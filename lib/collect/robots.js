// Reads robots.txt the way Google documents it: the group naming our agent
// wins over "*", and within a group the longest matching rule decides.

const toRegExp = (pattern) => {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
};

const parseRobots = (text) => {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const match = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const [, rawKey, value] = match;
    const key = rawKey.toLowerCase();

    if (key === "user-agent") {
      if (!lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === "sitemap") sitemaps.push(value);
    else if ((key === "allow" || key === "disallow") && current && value) {
      current.rules.push({ allow: key === "allow", pattern: value, regexp: toRegExp(value) });
    }
  }

  const rulesFor = (agent) => {
    const name = agent.toLowerCase();
    const named = groups.filter((g) => g.agents.some((a) => a !== "*" && name.includes(a)));
    const chosen = named.length ? named : groups.filter((g) => g.agents.includes("*"));
    return chosen.flatMap((g) => g.rules);
  };

  const isAllowed = (path, agent) => {
    let best = null;
    for (const rule of rulesFor(agent)) {
      if (!rule.regexp.test(path)) continue;
      const longer = !best || rule.pattern.length > best.pattern.length;
      const tieAllows = best && rule.pattern.length === best.pattern.length && rule.allow;
      if (longer || tieAllows) best = rule;
    }
    return !best || best.allow;
  };

  return { isAllowed, sitemaps };
};

module.exports = { parseRobots };
