// Brevo (free plan) keeps the newsletter lists, sends the confirmation email
// and every newsletter, and handles unsubscribing. Contacts sit in two lists:
// "Newsletter sign-ups" (the band) and "Shopper accounts" (the news emails
// box); each newsletter goes to both. These are the few calls Amara's Pick
// makes to its API (https://developers.brevo.com).
const API = "https://api.brevo.com/v3";
const FOLDER = "Amara's Pick";

class BrevoError extends Error {
  constructor(status, body) {
    super(`Brevo answered ${status}: ${body.message || body.code || "no message"}`);
    this.status = status;
    this.code = body.code;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A 429 waits until Brevo's limit resets (a second if it doesn't say, longer
// each time) and tries again.
const call = async (path, { method = "GET", body } = {}, tries = 5) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "api-key": process.env.BREVO_API_KEY, accept: "application/json", "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (res.status === 429 && tries > 1) {
    const reset = res.headers.get("x-sib-ratelimit-reset");
    await wait(reset !== null && Number.isFinite(Number(reset)) ? Number(reset) * 1000 : 1000 * (6 - tries));
    return call(path, { method, body }, tries - 1);
  }
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!res.ok) throw new BrevoError(res.status, parsed);
  return parsed;
};

// Every item of a paged list, e.g. all("/contacts/lists", "lists", 50).
const all = async (path, key, limit) => {
  const items = [];
  const join = path.includes("?") ? "&" : "?";
  for (;;) {
    const page = await call(`${path}${join}limit=${limit}&offset=${items.length}`);
    items.push(...(page[key] || []));
    if (!page[key]?.length || items.length >= page.count) return items;
  }
};

const sendEmail = (email) => call("/smtp/email", { method: "POST", body: email });

// The list's id, made (in an "Amara's Pick" folder) the first time it is asked for.
const listId = async (name) => {
  const found = (await all("/contacts/lists", "lists", 50)).find((l) => l.name === name);
  if (found) return found.id;
  const folder = (await all("/contacts/folders", "folders", 50)).find((f) => f.name === FOLDER);
  const folderId = folder ? folder.id : (await call("/contacts/folders", { method: "POST", body: { name: FOLDER } })).id;
  return (await call("/contacts/lists", { method: "POST", body: { name, folderId } })).id;
};

// Every contact on a list, with whether they unsubscribed (emailBlacklisted)
// and the lists they are on.
const listContacts = (id) => all(`/contacts/lists/${id}/contacts`, "contacts", 500);

// Puts the contact on the list, making the contact if needed and keeping her
// other lists. Leaves an unsubscribe alone unless resubscribe is set (she has
// just confirmed).
const addToList = (email, id, { resubscribe = false } = {}) =>
  call("/contacts", {
    method: "POST",
    body: { email, listIds: [id], updateEnabled: true, ...(resubscribe && { emailBlacklisted: false }) },
  });

const removeFromList = (emails, id) =>
  call(`/contacts/lists/${id}/contacts/remove`, { method: "POST", body: { emails } });

const deleteContact = (email) => call(`/contacts/${encodeURIComponent(email)}`, { method: "DELETE" });

module.exports = { BrevoError, sendEmail, listId, listContacts, addToList, removeFromList, deleteContact };
