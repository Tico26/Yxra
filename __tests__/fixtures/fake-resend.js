// A stand-in for Resend's API (https://resend.com/docs/api-reference), kept in
// memory and answering the same addresses the real one does, so newsletter
// tests never reach Resend. Install it as global.fetch; it returns its state.
//   contacts: { [email]: { unsubscribed, segments: [segment names] } }
//   segments: [{ id, name }]
//   emails:   the bodies of POST /emails
const fakeResend = ({ key = "test-key", contacts = {}, segments = [] } = {}) => {
  const state = { contacts, segments, emails: [], fail: null };
  let nextId = 1;
  const segmentById = (id) => state.segments.find((s) => s.id === id);

  state.fetch = async (url, { method = "GET", headers = {}, body } = {}) => {
    const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
    const error = (status, name, message) => json({ statusCode: status, name, message }, status);
    if (state.fail) return error(state.fail, "application_error", "Something went wrong");
    if (headers.authorization !== `Bearer ${key}`) return error(401, "missing_api_key", "Missing API key");
    const { pathname, searchParams } = new URL(url);
    const sent = body && JSON.parse(body);
    const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);

    if (parts[0] === "emails" && method === "POST") {
      state.emails.push(sent);
      return json({ id: `email-${nextId++}` });
    }
    if (parts[0] === "segments" && parts.length === 1) {
      if (method === "GET") return json({ object: "list", has_more: false, data: state.segments });
      const segment = { id: `seg-${nextId++}`, name: sent.name };
      state.segments.push(segment);
      return json({ object: "segment", ...segment }, 201);
    }
    if (parts[0] === "segments" && parts[2] === "contacts" && method === "GET") {
      const segment = segmentById(parts[1]);
      if (!segment) return error(404, "not_found", "Segment not found");
      const limit = Number(searchParams.get("limit") || 100);
      if (!(limit >= 1 && limit <= 100)) return error(422, "validation_error", "limit");
      const all = Object.entries(state.contacts)
        .filter(([, c]) => c.segments.includes(segment.name))
        .map(([email, c]) => ({ id: email, email, unsubscribed: c.unsubscribed }));
      const after = searchParams.get("after");
      const start = after ? all.findIndex((c) => c.id === after) + 1 : 0;
      // Never more than two at a time, so callers have to page through.
      const data = all.slice(start, start + Math.min(limit, 2));
      return json({ object: "list", has_more: start + data.length < all.length, data });
    }
    if (parts[0] === "contacts" && parts.length === 1 && method === "POST") {
      if (state.contacts[sent.email]) return error(409, "conflict", "Contact already exists");
      state.contacts[sent.email] = {
        unsubscribed: Boolean(sent.unsubscribed),
        segments: (sent.segments || []).map((s) => segmentById(s.id).name),
      };
      return json({ object: "contact", id: sent.email }, 201);
    }
    if (parts[0] === "contacts") {
      const contact = state.contacts[parts[1]];
      if (!contact) return error(404, "not_found", "Contact not found");
      if (parts.length === 2 && method === "GET") return json({ object: "contact", email: parts[1], ...contact });
      if (parts.length === 2 && method === "PATCH") {
        if ("unsubscribed" in sent) contact.unsubscribed = sent.unsubscribed;
        return json({ object: "contact", id: parts[1] });
      }
      if (parts.length === 2 && method === "DELETE") {
        delete state.contacts[parts[1]];
        return json({ object: "contact", contact: parts[1], deleted: true });
      }
      if (parts[2] === "segments") {
        const segment = segmentById(parts[3]);
        if (!segment) return error(404, "not_found", "Segment not found");
        if (method === "POST" && !contact.segments.includes(segment.name)) contact.segments.push(segment.name);
        if (method === "DELETE") contact.segments = contact.segments.filter((n) => n !== segment.name);
        return json({ id: segment.id });
      }
    }
    return error(404, "not_found", `unexpected ${method} ${pathname}`);
  };
  return state;
};

module.exports = { fakeResend };
