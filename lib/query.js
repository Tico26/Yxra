const { badRequest } = require("./errors");

const LAUNCH_CATEGORIES = ["clothes", "swimwear", "activewear"];

// UK clothing sizes run in even numbers; Yxra covers 4 to 40.
const parseUkSize = (value) => {
  const size = Number(value);
  if (!Number.isInteger(size) || size < 4 || size > 40 || size % 2) {
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
