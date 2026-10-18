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

module.exports = { LAUNCH_CATEGORIES, parseUkSize, parseCategory };
