const { badRequest } = require("./errors");

const SOURCES = ["shopify", "structured_data"];

// A Retailer is known by its site's origin: https://www.example.co.uk
const normaliseSiteUrl = (value) => {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    throw badRequest("site_url must be a web address like https://www.example.co.uk");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw badRequest("site_url must start with https://");
  }
  return url.origin;
};

const parseSource = (value) => {
  if (!SOURCES.includes(value)) throw badRequest(`source must be one of ${SOURCES.join(", ")}`);
  return value;
};

module.exports = { SOURCES, normaliseSiteUrl, parseSource };
