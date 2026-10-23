const { badRequest } = require("./errors");
const { isUkSize, isBraBand, isBraCup } = require("./sizes");

const LAUNCH_CATEGORIES = ["clothes", "swimwear", "activewear", "lingerie"];

const parseUkSize = (value) => {
  const size = Number(value);
  if (!isUkSize(size)) {
    throw badRequest("uk_size must be an even UK size between 4 and 40");
  }
  return size;
};

const parseCategory = (value) => {
  if (value === undefined || value === "") return null;
  if (!LAUNCH_CATEGORIES.includes(value)) {
    throw badRequest(`category must be one of ${LAUNCH_CATEGORIES.join(", ")}`);
  }
  return value;
};

const given = (value) => value !== undefined && value !== null && value !== "";

// She looks for clothes by UK size, or for bras by band (and optionally cup).
const parseSize = ({ uk_size, bra_band, bra_cup }) => {
  if (given(uk_size) && given(bra_band)) {
    throw badRequest("give uk_size or bra_band, not both");
  }
  if (!given(bra_band)) {
    if (given(bra_cup)) throw badRequest("bra_cup needs a bra_band");
    return { ukSize: parseUkSize(uk_size), braBand: null, braCup: null };
  }
  const braBand = Number(bra_band);
  if (!isBraBand(braBand)) {
    throw badRequest("bra_band must be an even band size between 28 and 56");
  }
  let braCup = null;
  if (given(bra_cup)) {
    braCup = String(bra_cup).trim().toUpperCase();
    if (!isBraCup(braCup)) throw badRequest("bra_cup must be a UK cup size, like DD");
  }
  return { ukSize: null, braBand, braCup };
};

// A search may leave the size out: she is browsing before she picks one.
// Any size she does give is checked exactly as parseSize checks it.
const parseSearchSize = (query) => {
  const { uk_size, bra_band, bra_cup } = query;
  if (!given(uk_size) && !given(bra_band) && !given(bra_cup)) {
    return { ukSize: null, braBand: null, braCup: null };
  }
  return parseSize(query);
};

module.exports = { LAUNCH_CATEGORIES, parseUkSize, parseCategory, parseSize, parseSearchSize };
