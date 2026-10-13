// Translates a Retailer's Size label onto UK sizes (spec rules R11–R13).
// A known translation for the Brand (its size chart, Tico's answer or a
// confident AI answer) comes first; then plain rules. Anything else stays
// unsettled: never shown, and on the Review list.

const brandKey = (brand) => (brand || "").trim().toLowerCase();

const sizeLabelKey = (label) => label.trim().toLowerCase().replace(/\s+/g, " ");

const UNSETTLED = { uk_sizes: [], size_status: "unsettled" };

const isUkSize = (n) => Number.isInteger(n) && n >= 4 && n <= 40 && n % 2 === 0;

// UK 18 is EU 46 and US 14.
const SCALES = { uk: (n) => n, eu: (n) => n - 28, us: (n) => n + 4 };

const LABEL = new RegExp(
  "^(?:(uk|eu|eur|us)\\s*)?(?:size\\s*)?" +
    "(\\d{1,2})(?:\\s*[/\\-–]\\s*(\\d{1,2}))?" +
    "\\s*(?:r|regular|l|long|tall|s|short|p|petite)?$"
);

const byRules = (label) => {
  const match = sizeLabelKey(label).match(LABEL);
  if (!match) return UNSETTLED;
  const [, scaleName = "uk", first, second] = match;
  const scale = SCALES[scaleName === "eur" ? "eu" : scaleName];
  const from = scale(Number(first));
  const to = second === undefined ? from : scale(Number(second));
  // A range must be two neighbouring sizes, like 18/20.
  if (!isUkSize(from) || !isUkSize(to) || (to !== from && to !== from + 2)) return UNSETTLED;
  return { uk_sizes: to === from ? [from] : [from, to], size_status: "translated" };
};

const translateSizeLabel = (label, known) => {
  if (known) {
    return known.uk_sizes.length
      ? { uk_sizes: [...known.uk_sizes], size_status: "translated" }
      : UNSETTLED;
  }
  return byRules(label);
};

module.exports = { brandKey, sizeLabelKey, translateSizeLabel };
