// Plain rules that decide who a Product is for and what it is (spec rules
// R7 and R10). Whatever they cannot settle is left null for the AI or Tico.

const words = (list) => new RegExp(`\\b(?:${list.join("|")})\\b`, "i");

// Checked in this order: the first group that matches wins, so "Sports Bra"
// is activewear, "Bikini Bag" an accessory and "Swim Shorts" swimwear.
const GROUPS = [
  { excluded_as: "shoes", pattern: words(["shoes?", "boots?", "sandals?", "trainers?", "heels", "footwear", "slippers?", "sneakers?", "mules", "wellies", "flip ?flops?", "espadrilles?", "loafers?"]) },
  { excluded_as: "accessories", pattern: words(["bags?", "handbags?", "totes?", "backpacks?", "purses?", "wallets?", "jewellery", "jewelry", "necklaces?", "earrings?", "bracelets?", "belts?", "hats?", "baseball caps?", "scarf", "scarves", "sunglasses", "gloves", "umbrellas?", "gift ?cards?", "hair ?clips?", "candles?", "perfume", "fragrance"]) },
  { category: "swimwear", pattern: words(["swim\\w*", "bikinis?", "tankinis?", "beachwear", "cover ?ups?", "kaftans?", "sarongs?", "rash ?vests?"]) },
  { category: "activewear", pattern: words(["active\\s?wear", "activewear", "sportswear", "sports? bras?", "gym", "workout", "yoga", "running", "training", "athletic", "active"]) },
  { category: "lingerie", pattern: words(["lingerie", "bras?", "bralettes?", "knickers", "briefs", "thongs?", "shapewear", "underwear", "hosiery", "tights", "socks", "stockings", "suspenders?", "corsets?"]) },
  { category: "clothes", pattern: words(["dress(?:es)?", "tops?", "t-?shirts?", "tees?", "blouses?", "shirts?", "jeans", "jeggings", "trousers", "skirts?", "jumpers?", "cardigans?", "coats?", "jackets?", "shorts", "jumpsuits?", "playsuits?", "leggings", "hoodies?", "sweatshirts?", "sweaters?", "knitwear", "co-?ords?", "kimonos?", "tunics?", "bodysuits?", "pyjamas?", "nightwear", "nightdress(?:es)?", "nighties?", "loungewear", "joggers", "blazers?", "gilets?", "waistcoats?", "culottes", "dungarees", "camis?", "vests?", "rompers?", "robes?", "dressing gowns?", "denim", "knit", "outerwear", "parkas?", "trench", "chinos", "wide leg"]) },
];

const MEN = words(["men", "mens", "men's", "male", "gents", "menswear"]);
const WOMEN = words(["women", "womens", "women's", "ladies", "female", "womenswear", "maternity"]);
const CHILDREN = words(["kids", "girls?", "girl's", "boys?", "boy's", "baby", "babies", "children", "childrens", "toddlers?"]);

const groupFor = (text) => GROUPS.find((g) => g.pattern.test(text));

const audienceFor = (text, womenOnly) => {
  if (CHILDREN.test(text)) return "other";
  const men = MEN.test(text);
  const women = WOMEN.test(text);
  if (men && !women) return "men";
  if (women) return "women";
  return womenOnly ? "women" : null;
};

const ACTIVEWEAR = GROUPS.find((g) => g.category === "activewear");

const sortByRules = ({ title = "", product_type = "", tags = [] }, { womenOnly = false } = {}) => {
  const titleAndTags = [title, ...tags].join(" | ");
  let group = groupFor(product_type || "") || groupFor(titleAndTags);
  // Shops often file sports bras under a "Bras" product type.
  if (group && group.category === "lingerie" && ACTIVEWEAR.pattern.test(titleAndTags)) {
    group = ACTIVEWEAR;
  }
  return {
    audience: audienceFor([product_type, titleAndTags].join(" | "), womenOnly),
    category: group && group.category ? group.category : null,
    excluded_as: group && group.excluded_as ? group.excluded_as : null,
  };
};

// Plus size means made in UK 18 or above (for a bra, band 38 or above),
// whether or not that size is in stock today. Unknown while any Size label is
// still unsettled.
const SMALLEST_PLUS_UK_SIZE = 18;
const SMALLEST_PLUS_BRA_BAND = 38;

const isPlusSize = (sizes) => {
  const plus = (s) =>
    s.uk_sizes.some((n) => n >= SMALLEST_PLUS_UK_SIZE) ||
    (s.bra_band != null && s.bra_band >= SMALLEST_PLUS_BRA_BAND);
  if (sizes.some((s) => s.size_status === "translated" && plus(s))) return true;
  if (sizes.length === 0 || sizes.some((s) => s.size_status !== "translated")) return null;
  return false;
};

const decideStatus = ({ audience, category, excluded_as }, sizes) => {
  if (excluded_as) return { sort_status: "excluded", sort_reason: excluded_as };
  if (audience === "men" || audience === "other") {
    return { sort_status: "excluded", sort_reason: `not for women (${audience})` };
  }
  const plus = isPlusSize(sizes);
  if (plus === false) {
    return { sort_status: "excluded", sort_reason: "not made in UK 18 or above (or bra band 38)" };
  }
  if (audience === "women" && category && plus) return { sort_status: "shown", sort_reason: null };

  const unknown = [
    !audience && "audience",
    !category && "category",
    plus === null && "Plus size",
  ].filter(Boolean);
  return { sort_status: "unsettled", sort_reason: `unsettled: ${unknown.join(", ")}` };
};

module.exports = {
  sortByRules,
  decideStatus,
  isPlusSize,
  SMALLEST_PLUS_UK_SIZE,
  SMALLEST_PLUS_BRA_BAND,
};
