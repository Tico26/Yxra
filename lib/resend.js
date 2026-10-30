// Resend sends the sign-in emails (through Supabase) and the newsletter, and
// keeps the newsletter's contacts in segments: "Newsletter sign-ups" (the
// band), "Shopper accounts" (the news emails box) and "Newsletter" (both, the
// one segment each broadcast goes to). These are the few
// calls Amara's Pick makes to its API (https://resend.com/docs/api-reference).
const API = "https://api.resend.com";

class ResendError extends Error {
  constructor(status, body) {
    super(`Resend answered ${status}: ${body.message || body.name || "no message"}`);
    this.status = status;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Resend allows about two requests a second; a 429 waits as long as Resend
// asks (a second if it doesn't say, longer each time) and tries again.
const call = async (path, { method = "GET", body } = {}, tries = 5) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (res.status === 429 && tries > 1) {
    const asked = Number(res.headers.get("retry-after"));
    await wait(Number.isFinite(asked) && res.headers.has("retry-after") ? asked * 1000 : 1000 * (6 - tries));
    return call(path, { method, body }, tries - 1);
  }
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!res.ok) throw new ResendError(res.status, parsed);
  return parsed;
};

const contactPath = (email) => `/contacts/${encodeURIComponent(email)}`;

const sendEmail = (email) => call("/emails", { method: "POST", body: email });

// The segment's id, made the first time it is asked for.
const segmentId = async (name) => {
  const { data } = await call("/segments");
  const found = data.find((s) => s.name === name);
  return found ? found.id : (await call("/segments", { method: "POST", body: { name } })).id;
};

// Every contact in a segment, with whether they unsubscribed.
const segmentContacts = async (id) => {
  const contacts = [];
  for (;;) {
    const after = contacts.length ? `&after=${encodeURIComponent(contacts.at(-1).id)}` : "";
    const page = await call(`/segments/${id}/contacts?limit=100${after}`);
    contacts.push(...page.data);
    if (!page.has_more || page.data.length === 0) return contacts;
  }
};

const getContact = async (email) => {
  try {
    return await call(contactPath(email));
  } catch (err) {
    if (err instanceof ResendError && err.status === 404) return null;
    throw err;
  }
};

// Puts the contact in the segment, making the contact if needed. Leaves an
// unsubscribe alone unless resubscribe is set (she has just confirmed).
const addToSegment = async (email, id, { resubscribe = false } = {}) => {
  const contact = await getContact(email);
  if (!contact) {
    return call("/contacts", { method: "POST", body: { email, unsubscribed: false, segments: [{ id }] } });
  }
  if (resubscribe && contact.unsubscribed) {
    await call(contactPath(email), { method: "PATCH", body: { unsubscribed: false } });
  }
  return call(`${contactPath(email)}/segments/${id}`, { method: "POST" });
};

const removeFromSegment = (email, id) => call(`${contactPath(email)}/segments/${id}`, { method: "DELETE" });

const deleteContact = (email) => call(contactPath(email), { method: "DELETE" });

module.exports = {
  ResendError,
  sendEmail,
  segmentId,
  segmentContacts,
  addToSegment,
  removeFromSegment,
  deleteContact,
};
