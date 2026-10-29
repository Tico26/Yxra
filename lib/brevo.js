// Brevo (free plan) keeps the newsletter lists, sends the "please confirm"
// email and every newsletter, and handles unsubscribing. These are the few
// calls Amara's Pick makes to its API (https://developers.brevo.com).
const API = "https://api.brevo.com/v3";

class BrevoError extends Error {
  constructor(status, body) {
    super(`Brevo answered ${status}: ${body.message || body.code || "no message"}`);
    this.status = status;
    this.code = body.code;
  }
}

const call = async (path, { method = "GET", body } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!res.ok) throw new BrevoError(res.status, parsed);
  return parsed;
};

// Sends the confirmation email; she joins the lists only when she clicks it.
const sendConfirmation = ({ email, listId, templateId, redirectionUrl }) =>
  call("/contacts/doubleOptinConfirmation", {
    method: "POST",
    body: { email, includeListIds: [listId], templateId, redirectionUrl },
  });

// Every contact on a list, with whether they unsubscribed (emailBlacklisted).
const listContacts = async (listId) => {
  const contacts = [];
  for (;;) {
    const page = await call(`/contacts/lists/${listId}/contacts?limit=500&offset=${contacts.length}`);
    contacts.push(...(page.contacts || []));
    if (!page.contacts?.length || contacts.length >= page.count) return contacts;
  }
};

// Adds the contact to the list, keeping any other lists and an unsubscribe.
const addToList = (email, listId) =>
  call("/contacts", { method: "POST", body: { email, listIds: [listId], updateEnabled: true } });

const removeFromList = (emails, listId) =>
  call(`/contacts/lists/${listId}/contacts/remove`, { method: "POST", body: { emails } });

const deleteContact = (email) => call(`/contacts/${encodeURIComponent(email)}`, { method: "DELETE" });

module.exports = { BrevoError, sendConfirmation, listContacts, addToList, removeFromList, deleteContact };
