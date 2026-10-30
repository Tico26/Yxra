// The nightly newsletter sync (scripts/newsletter-sync.js). Shoppers opt in to
// news emails with the box on Log in and Your account (spec 0004), which
// saves shoppers.profiles.news_emails. Resend's "Shopper accounts" segment is
// made to match those ticks, each of them is also in "Newsletter" (the one
// segment broadcasts go to), and anyone who unsubscribed in Resend has her box
// unticked, so Your account always tells the truth. Run twice, it changes nothing.
const db = require("../db/connection");
const resend = require("./resend");

const ACCOUNTS = "Shopper accounts";
const SIGNUPS = "Newsletter sign-ups";
const NEWSLETTER = "Newsletter";

const syncAccountsList = async () => {
  if (!process.env.RESEND_API_KEY) return { skipped: "RESEND_API_KEY is not set" };
  const summary = { added: 0, removed: 0, deleted: 0, unticked: 0 };

  const accountsId = await resend.segmentId(ACCOUNTS);
  const signupsId = await resend.segmentId(SIGNUPS);
  const newsletterId = await resend.segmentId(NEWSLETTER);
  const byEmail = (contacts) => new Map(contacts.map((c) => [c.email.toLowerCase(), c]));
  const onList = byEmail(await resend.segmentContacts(accountsId));
  const signedUp = byEmail(await resend.segmentContacts(signupsId));
  const inNewsletter = byEmail(await resend.segmentContacts(newsletterId));

  // Unsubscribed in Resend: untick her box first, so she is not counted below.
  const unsubscribed = [...onList.keys()].filter((email) => onList.get(email).unsubscribed);
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
      await resend.addToSegment(email, accountsId);
      if (!inNewsletter.has(email)) await resend.addToSegment(email, newsletterId);
      summary.added += 1;
    }
  }

  // Unticked: out of this segment, and out of the Newsletter unless she also
  // signed up through the band. Account deleted: gone from Resend too, unless
  // she signed up through the band. Someone who
  // unsubscribed stays in the segment (and unsubscribed) while her account
  // lasts, so ticking the box again is unticked again the next night. An
  // unsubscribe is never lifted from here.
  for (const [email, contact] of onList) {
    if (accounts.get(email)) continue;
    if (!accounts.has(email) && !signedUp.has(email)) {
      await resend.deleteContact(email);
      summary.deleted += 1;
    } else if (!(accounts.has(email) && contact.unsubscribed)) {
      await resend.removeFromSegment(email, accountsId);
      if (!signedUp.has(email) && inNewsletter.has(email)) await resend.removeFromSegment(email, newsletterId);
      summary.removed += 1;
    }
  }

  return summary;
};

module.exports = { syncAccountsList };
