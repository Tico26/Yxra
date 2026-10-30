// The nightly newsletter sync (scripts/newsletter-sync.js). Shoppers opt in to
// news emails with the box on Log in and Your account (spec 0004), which
// saves shoppers.profiles.news_emails. Brevo's "Shopper accounts" list is made
// to match those ticks, and anyone who unsubscribed in Brevo has her box
// unticked, so Your account always tells the truth. Run twice, it changes nothing.
const db = require("../db/connection");
const brevo = require("./brevo");

const ACCOUNTS = "Shopper accounts";

const syncAccountsList = async () => {
  if (!process.env.BREVO_API_KEY) return { skipped: "BREVO_API_KEY is not set" };
  const summary = { added: 0, removed: 0, deleted: 0, unticked: 0 };

  const listId = await brevo.listId(ACCOUNTS);
  const onList = new Map((await brevo.listContacts(listId)).map((c) => [c.email.toLowerCase(), c]));

  // Unsubscribed in Brevo: untick her box first, so she is not counted below.
  const unsubscribed = [...onList.keys()].filter((email) => onList.get(email).emailBlacklisted);
  if (unsubscribed.length > 0) {
    const { rowCount } = await db.query(
      `UPDATE shoppers.profiles p SET news_emails = FALSE, news_emails_at = NULL
       FROM auth.users u
       WHERE u.id = p.shopper_id AND p.news_emails AND lower(u.email) = ANY($1)`,
      [unsubscribed]
    );
    summary.unticked = rowCount;
  }

  const { rows } = await db.query(
    `SELECT lower(u.email) AS email, COALESCE(p.news_emails, FALSE) AS ticked
     FROM auth.users u LEFT JOIN shoppers.profiles p ON p.shopper_id = u.id
     WHERE u.email IS NOT NULL`
  );
  const accounts = new Map(rows.map((r) => [r.email, r.ticked]));

  for (const [email, ticked] of accounts) {
    if (ticked && !onList.has(email)) {
      await brevo.addToList(email, listId);
      summary.added += 1;
    }
  }

  // Unticked: off this list, keeping any other. Account deleted: gone from
  // Brevo too, unless she also signed up through the band. Someone who
  // unsubscribed stays listed (and unsubscribed) while her account lasts, so
  // ticking the box again is unticked again the next night. An unsubscribe is
  // never lifted from here.
  const toRemove = [];
  for (const [email, contact] of onList) {
    if (accounts.get(email)) continue;
    const otherLists = (contact.listIds || []).filter((id) => id !== listId);
    if (!accounts.has(email) && otherLists.length === 0) {
      await brevo.deleteContact(email);
      summary.deleted += 1;
    } else if (!(accounts.has(email) && contact.emailBlacklisted)) {
      toRemove.push(email);
    }
  }
  // Brevo takes up to 150 addresses per call.
  for (let i = 0; i < toRemove.length; i += 150) {
    await brevo.removeFromList(toRemove.slice(i, i + 150), listId);
  }
  summary.removed = toRemove.length;

  return summary;
};

module.exports = { syncAccountsList };
