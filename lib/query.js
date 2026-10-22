const { badRequest } = require("./errors");
const { isUkSize } = require("./sizes");

const LAUNCH_CATEGORIES = ["clothes", "swimwear", "activewear"];

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

// A search may leave the size out: she is browsing before she picks one.
// A size she does give is checked exactly as parseUkSize checks it.
const parseSearchSize = (value) =>
  value === undefined || value === "" ? null : parseUkSize(value);

module.exports = { LAUNCH_CATEGORIES, parseUkSize, parseCategory, parseSearchSize };
