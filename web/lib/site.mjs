// Who runs Yxra and how to reach them, shown in the footer and the legal
// pages. Set at build time by .github/workflows/deploy.yml from repository
// variables, so changing the domain or address needs no code change.
export const SITE = {
  url: (process.env.YXRA_SITE_URL || "https://yxra.co.uk").replace(/\/$/, ""),
  email: process.env.YXRA_CONTACT_EMAIL || "hello@yxra.co.uk",
  // E-Commerce Regulations 2002 reg 6: the trader's name and geographic address.
  traderName: process.env.YXRA_TRADER_NAME || "",
  traderAddress: process.env.YXRA_TRADER_ADDRESS || "",
};

export const LAST_UPDATED = "21 October 2026";

// The big plus-size Retailers that are not on Yxra yet (spec 0002, D4).
export const NOT_YET = ["Yours", "Simply Be", "ASOS Curve", "Evans", "JD Williams", "Ulla Popken", "River Island Plus"];
