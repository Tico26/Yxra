// Translates a Retailer's Size label onto UK sizes (spec rules R11–R13).
// A known translation for the Brand (its size chart, Tico's answer or a
// confident AI answer) comes first; then Bra sizes; then plain rules.
// Anything else stays unsettled: never shown, and on the Review list.

const brandKey = (brand) => (brand || "").trim().toLowerCase();

const sizeLabelKey = (label) => label.trim().toLowerCase().replace(/\s+/g, " ");

const UNSETTLED = { uk_sizes: [], size_status: "unsettled" };

const isUkSize = (n) => Number.isInteger(n) && n >= 4 && n <= 40 && n % 2 === 0;

// A bare 34 to 40 is as likely a European size (UK 6 to 12) as a UK one, so
// above 32 a number must say it is UK.
const LARGEST_UNMARKED_UK_SIZE = 32;

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
  const [, marked, first, second] = match;
  const scaleName = marked || "uk";
  const scale = SCALES[scaleName === "eur" ? "eu" : scaleName];
  const from = scale(Number(first));
  const to = second === undefined ? from : scale(Number(second));
  // A range must be two neighbouring sizes, like 18/20.
  if (!isUkSize(from) || !isUkSize(to) || (to !== from && to !== from + 2)) return UNSETTLED;
  if (!marked && Number(second || first) > LARGEST_UNMARKED_UK_SIZE) return UNSETTLED;
  return { uk_sizes: to === from ? [from] : [from, to], size_status: "translated" };
};

// A Bra size is a band in inches and a UK cup ("38DD"). It has no UK size:
// bras are found by band and cup instead.
const isBraBand = (n) => Number.isInteger(n) && n >= 28 && n <= 56 && n % 2 === 0;
// No lone L cup: "32L" is far more often UK 32 Long than a bra.
const CUPS = ["AA", "A", "B", "C", "D", "DD", "E", "F", "FF", "G", "GG", "H", "HH", "J", "JJ", "K", "KK"];
const isBraCup = (cup) => CUPS.includes(cup);
const BRA_LABEL = /^(\d{2})\s*([a-k]{1,2})$/;

const parseBraSize = (label) => {
  const match = sizeLabelKey(label).match(BRA_LABEL);
  if (!match) return null;
  const band = Number(match[1]);
  const cup = match[2].toUpperCase();
  return isBraBand(band) && isBraCup(cup) ? { bra_band: band, bra_cup: cup } : null;
};

const translateSizeLabel = (label, known) => {
  if (known && known.uk_sizes.length) {
    return { uk_sizes: [...known.uk_sizes], size_status: "translated" };
  }
  // An unsure answer (no UK size) never hides a Bra size the rule can read.
  const bra = parseBraSize(label);
  if (bra) return { uk_sizes: [], size_status: "translated", ...bra };
  return known ? UNSETTLED : byRules(label);
};

module.exports = {
  brandKey,
  sizeLabelKey,
  translateSizeLabel,
  isUkSize,
  isBraBand,
  isBraCup,
  parseBraSize,
};
