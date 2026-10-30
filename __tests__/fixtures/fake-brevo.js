// A stand-in for Brevo's API (https://developers.brevo.com), kept in memory
// and answering the same addresses the real one does, so newsletter tests
// never reach Brevo. Install its fetch as global.fetch; it returns its state.
//   contacts: { [email]: { emailBlacklisted, lists: [list names] } }
//   lists:    [{ id, name, folderId }]
//   folders:  [{ id, name }]
//   emails:   the bodies of POST /v3/smtp/email
// Set fail to a status to fail every call, or rateLimitNext to answer that
// many calls with 429 first.
const fakeBrevo = ({ key = "test-key", contacts = {}, lists = [], folders = [] } = {}) => {
  const state = { contacts, lists, folders, emails: [], fail: null, rateLimitNext: 0 };
  let nextId = 100;
  const listById = (id) => state.lists.find((l) => l.id === Number(id));
  const page = (items, searchParams, most) => {
    const limit = Number(searchParams.get("limit") || 10);
    const offset = Number(searchParams.get("offset") || 0);
    if (!(limit >= 1 && limit <= most)) return null;
    // Never more than two at a time, so callers have to page through.
    return items.slice(offset, offset + Math.min(limit, 2));
  };

  state.fetch = async (url, { method = "GET", headers = {}, body } = {}) => {
    const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
    const error = (status, code, message) => json({ code, message }, status);
    if (state.fail) return error(state.fail, "internal_error", "Something went wrong");
    if (state.rateLimitNext > 0) {
      state.rateLimitNext -= 1;
      return new Response(JSON.stringify({ code: "too_many_requests" }), {
        status: 429,
        headers: { "x-sib-ratelimit-reset": "0" },
      });
    }
    if (headers["api-key"] !== key) return error(401, "unauthorized", "Key not found");
    const { pathname, searchParams } = new URL(url);
    const sent = body && JSON.parse(body);
    const parts = pathname.split("/").filter(Boolean).slice(1).map(decodeURIComponent);

    if (parts.join("/") === "smtp/email" && method === "POST") {
      state.emails.push(sent);
      return json({ messageId: `<${nextId++}@relay>` }, 201);
    }
    if (parts.join("/") === "contacts/folders") {
      if (method === "POST") {
        const folder = { id: nextId++, name: sent.name };
        state.folders.push(folder);
        return json({ id: folder.id }, 201);
      }
      const folders = page(state.folders, searchParams, 50);
      if (!folders) return error(400, "invalid_parameter", "limit");
      return json({ folders, count: state.folders.length });
    }
    if (parts.join("/") === "contacts/lists") {
      if (method === "POST") {
        if (!state.folders.some((f) => f.id === sent.folderId)) return error(400, "invalid_parameter", "folderId");
        const list = { id: nextId++, name: sent.name, folderId: sent.folderId };
        state.lists.push(list);
        return json({ id: list.id }, 201);
      }
      const lists = page(state.lists, searchParams, 50);
      if (!lists) return error(400, "invalid_parameter", "limit");
      return json({ lists, count: state.lists.length });
    }
    if (parts[0] === "contacts" && parts[1] === "lists" && parts[3] === "contacts") {
      const list = listById(parts[2]);
      if (!list) return error(404, "document_not_found", "List ID does not exist");
      if (parts[4] === "remove" && method === "POST") {
        for (const email of sent.emails) {
          if (state.contacts[email]) state.contacts[email].lists = state.contacts[email].lists.filter((n) => n !== list.name);
        }
        return json({ contacts: { success: sent.emails } }, 201);
      }
      const all = Object.entries(state.contacts)
        .filter(([, c]) => c.lists.includes(list.name))
        .map(([email, c]) => ({
          email,
          emailBlacklisted: c.emailBlacklisted,
          listIds: c.lists.map((n) => state.lists.find((l) => l.name === n).id),
        }));
      const contacts = page(all, searchParams, 500);
      if (!contacts) return error(400, "invalid_parameter", "limit");
      return json({ contacts, count: all.length });
    }
    if (parts.join("/") === "contacts" && method === "POST") {
      const contact = state.contacts[sent.email];
      if (contact && !sent.updateEnabled) return error(400, "duplicate_parameter", "Contact already exist");
      const names = (sent.listIds || []).map((id) => listById(id).name);
      state.contacts[sent.email] = {
        emailBlacklisted: "emailBlacklisted" in sent ? sent.emailBlacklisted : Boolean(contact?.emailBlacklisted),
        lists: [...new Set([...(contact ? contact.lists : []), ...names])],
      };
      return contact ? new Response(null, { status: 204 }) : json({ id: nextId++ }, 201);
    }
    if (parts[0] === "contacts" && parts.length === 2 && method === "DELETE") {
      if (!state.contacts[parts[1]]) return error(404, "document_not_found", "Contact does not exist");
      delete state.contacts[parts[1]];
      return new Response(null, { status: 204 });
    }
    return error(404, "document_not_found", `unexpected ${method} ${pathname}`);
  };
  return state;
};

module.exports = { fakeBrevo };
