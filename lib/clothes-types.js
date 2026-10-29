// Clothes types (spec 0005): what kind of garment a Clothes Product is, in
// the order the filters show them. Each lists the words that name it.
const CLOTHES_TYPES = [
  { clothes_type: "dresses", label: "Dresses", words: ["dress(?:es)?", "sundress(?:es)?", "gowns?"] },
  { clothes_type: "tops", label: "Tops", words: ["tops?", "t-?shirts?", "tees?", "blouses?", "shirts?", "tunics?", "bodysuits?", "camis?", "camisoles?", "vests?", "polos?"] },
  { clothes_type: "knitwear", label: "Jumpers & cardigans", words: ["jumpers?", "cardigans?", "cardis?", "hoodies?", "sweatshirts?", "sweaters?", "pullovers?", "knitwear"] },
  { clothes_type: "coats", label: "Coats & jackets", words: ["coats?", "jackets?", "blazers?", "gilets?", "parkas?", "trench(?:es)?", "shackets?", "waistcoats?", "kimonos?", "ponchos?", "capes?", "raincoats?", "puffers?", "bombers?", "outerwear"] },
  { clothes_type: "jeans", label: "Jeans", words: ["jeans", "jeggings"] },
  { clothes_type: "trousers", label: "Trousers & shorts", words: ["trousers", "leggings", "shorts", "joggers", "culottes", "chinos", "pants", "palazzos?", "cargos?", "flares", "wide leg"] },
  { clothes_type: "skirts", label: "Skirts", words: ["skirts?", "skorts?"] },
  { clothes_type: "jumpsuits", label: "Jumpsuits & co-ords", words: ["jumpsuits?", "playsuits?", "dungarees", "rompers?", "all-?in-?ones?", "co-?ords?", "two-?piece", "sets?"] },
  { clothes_type: "nightwear", label: "Nightwear & loungewear", words: ["pyjamas?", "pajamas?", "pjs", "nightdress(?:es)?", "nighties?", "nightshirts?", "nightwear", "sleepwear", "robes?", "dressing gowns?", "lounge\\w*", "onesies?"] },
];

const NIGHTWEAR = CLOTHES_TYPES.find((t) => t.clothes_type === "nightwear");
const anyOf = (words, flags) => new RegExp(`\\b(?:${words.join("|")})\\b`, flags);
const PATTERNS = CLOTHES_TYPES.map((t) => ({ clothes_type: t.clothes_type, pattern: anyOf(t.words, "gi") }));
const NIGHTWEAR_PATTERN = anyOf(NIGHTWEAR.words, "i");

// Every word that names a Clothes type, for the Category rules.
const CLOTHES_TYPE_WORDS = CLOTHES_TYPES.flatMap((t) => t.words);

// The type named last, as English names the garment last ("Jumper Dress").
const lastNamed = (text) => {
  let found = null;
  let end = -1;
  for (const { clothes_type, pattern } of PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const matchEnd = match.index + match[0].length;
      if (matchEnd > end) {
        end = matchEnd;
        found = clothes_type;
      }
    }
  }
  return found;
};

// From one piece of text: nightwear words win (rule 3); otherwise the last
// type named before any "with" or "in" (rule 2), which describe the garment
// rather than name it ("Dress with Shirt Collar").
const typeIn = (text) => {
  if (!text) return null;
  text = text.replace(/_/g, " ");
  if (NIGHTWEAR_PATTERN.test(text)) return "nightwear";
  const [named] = text.split(/\s+(?:with|in)\s+/i);
  return lastNamed(named) || lastNamed(text);
};

// The title first, then the Retailer's product type, then the tags when
// every tag naming a type names the same one (rule 4).
const clothesTypeFor = ({ title = "", product_type = "", tags = [] }) => {
  const fromTitle = typeIn(title) || typeIn(product_type);
  if (fromTitle) return fromTitle;
  const fromTags = new Set((tags || []).map(typeIn).filter(Boolean));
  return fromTags.size === 1 ? [...fromTags][0] : null;
};

const isClothesType = (value) => CLOTHES_TYPES.some((t) => t.clothes_type === value);

module.exports = { CLOTHES_TYPES, CLOTHES_TYPE_WORDS, clothesTypeFor, isClothesType };
