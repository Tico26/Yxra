// The overnight AI batch (spec build step 5, rules R7–R9). It asks a small
// hosted model only about what the rules left unsettled: who a Product is
// for, what it is, and what UK sizes a Size label means. A confident answer
// is used; anything else stays on the Review list for Tico.
const db = require("../db/connection");
const { retranslateAndSortProducts } = require("./catalogue");
const { saveTranslation } = require("../models/review.models");
const { isUkSize } = require("./sizes");
const { CLOTHES_TYPES, clothesTypeFor, isClothesType } = require("./clothes-types");

// Start strict (spec open question); tune with the weekly 20-Product spot check.
const CONFIDENCE_BAR = Number(process.env.AI_CONFIDENCE_BAR || 0.9);
const MAX_QUESTIONS_PER_RUN = 2000;

const LIVE = `r.removed_at IS NULL AND p.missing_since IS NULL`;
const BRAND_KEY = `LOWER(TRIM(COALESCE(p.brand, '')))`;
const LABEL_KEY = `LOWER(REGEXP_REPLACE(TRIM(s.size_label), '\\s+', ' ', 'g'))`;

const PRODUCT_SCHEMA = {
  type: "object",
  properties: {
    audience: { type: "string", enum: ["women", "men", "children", "unisex", "unknown"] },
    kind: {
      type: "string",
      enum: ["clothes", "swimwear", "activewear", "lingerie", "shoes", "accessories", "not_clothing", "unknown"],
    },
    confidence: { type: "number", description: "0 to 1: how sure you are of both answers" },
    clothes_type: {
      type: "string",
      enum: [...CLOTHES_TYPES.map((t) => t.clothes_type), "other", "unknown"],
      description: `Only for clothes: ${CLOTHES_TYPES.map((t) => `${t.clothes_type} (${t.label})`).join(", ")}`,
    },
    clothes_type_confidence: { type: "number", description: "0 to 1: how sure you are of clothes_type" },
  },
  required: ["audience", "kind", "confidence", "clothes_type", "clothes_type_confidence"],
  additionalProperties: false,
};

const SIZE_SCHEMA = {
  type: "object",
  properties: {
    uk_sizes: {
      type: "array",
      items: { type: "integer" },
      description: "Every UK women's clothing size (4, 6, 8 … 40) this label fits; empty if unknown",
    },
    confidence: { type: "number", description: "0 to 1: how sure you are" },
  },
  required: ["uk_sizes", "confidence"],
  additionalProperties: false,
};

const PRODUCT_SYSTEM =
  "You sort products for Amara's Pick, a UK site that helps plus-size women find clothes. " +
  "From a Retailer's product data, say who the product is for and what kind of product it is. " +
  "Clothes means everyday garments (dresses, tops, trousers, knitwear, coats, nightwear). " +
  "Sports bras, gym leggings and other sportswear are activewear; bras, knickers and shapewear are lingerie. " +
  "For clothes, also say which type of garment it is; use other when none fits. " +
  "Give a low confidence when the data does not make it clear; never guess.";

const SIZE_SYSTEM =
  "You translate a UK Retailer's Size labels onto the UK women's clothing size scale (even numbers 4 to 40). " +
  "A label that fits two sizes, like 18/20 or a 1X that fits 18 to 20, lists both. " +
  "Use what you know of the Brand's size chart. If you are not sure, return an empty list and a low confidence.";

const productQuestion = (p) => ({
  custom_id: `product-${p.product_id}`,
  kind: "product",
  subject: p.title,
  system: PRODUCT_SYSTEM,
  schema: PRODUCT_SCHEMA,
  prompt: [
    `Retailer: ${p.retailer_name}`,
    `Title: ${p.title}`,
    p.colour && `Colour: ${p.colour}`,
    p.brand && `Brand: ${p.brand}`,
    p.product_type && `Product type: ${p.product_type}`,
    p.tags.length && `Tags: ${p.tags.join(", ")}`,
    `Size labels: ${p.size_labels.join(", ")}`,
    p.description && `Description: ${p.description.slice(0, 2000)}`,
  ]
    .filter(Boolean)
    .join("\n"),
  product: p,
});

const sizeQuestion = (s, index) => ({
  custom_id: `size-${index}`,
  kind: "size",
  subject: `${s.brand}|${s.size_label}`,
  system: SIZE_SYSTEM,
  schema: SIZE_SCHEMA,
  prompt: [
    `Brand: ${s.brand || "unknown"}`,
    `Retailer: ${s.retailer_name}`,
    `Size label: ${s.size_label}`,
    `Other labels on the same garment: ${s.sibling_labels.join(", ")}`,
    `Example garment: ${s.example_title}`,
  ].join("\n"),
  size: s,
});

// Products the rules could not sort, and Clothes the rules could not give a
// Clothes type (spec 0005 rule 7), not yet asked about in their current
// wording (R8).
const productsToAsk = async () => {
  const { rows } = await db.query(
    `SELECT p.product_id, p.title, p.description, p.colour, p.brand, p.product_type, p.tags,
            p.text_hash, r.retailer_name,
            ARRAY(SELECT size_label FROM product_sizes WHERE product_id = p.product_id
                  ORDER BY product_size_id) AS size_labels
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE ${LIVE} AND p.excluded_as IS NULL
       AND ((p.sort_status = 'unsettled' AND (p.audience IS NULL OR p.category IS NULL))
            OR (p.sort_status <> 'excluded' AND p.category = 'clothes' AND p.clothes_type IS NULL))
       AND p.ai_asked_hash IS DISTINCT FROM p.text_hash
     ORDER BY p.product_id
     LIMIT $1`,
    [MAX_QUESTIONS_PER_RUN]
  );
  return rows;
};

// Size labels no rule, chart or earlier answer covers for their Brand.
const sizesToAsk = async () => {
  const { rows } = await db.query(
    `SELECT MIN(p.brand) AS brand, MIN(s.size_label) AS size_label,
            MIN(r.retailer_name) AS retailer_name, MIN(p.title) AS example_title,
            ARRAY(SELECT DISTINCT s2.size_label FROM product_sizes s2
                  WHERE s2.product_id = MIN(p.product_id)) AS sibling_labels
     FROM product_sizes s
     JOIN products p USING (product_id)
     JOIN retailers r USING (retailer_id)
     WHERE ${LIVE} AND s.size_status = 'unsettled' AND p.sort_status <> 'excluded'
       AND NOT EXISTS (SELECT 1 FROM size_translations t
                       WHERE t.brand_key = ${BRAND_KEY} AND t.size_label_key = ${LABEL_KEY})
     GROUP BY ${BRAND_KEY}, ${LABEL_KEY}
     ORDER BY 1, 2
     LIMIT $1`,
    [MAX_QUESTIONS_PER_RUN]
  );
  return rows;
};

const AUDIENCE = { women: "women", men: "men", children: "other" };
const CATEGORY = {
  clothes: "clothes",
  swimwear: "swimwear",
  activewear: "activewear",
  lingerie: "lingerie",
};
const EXCLUDED = {
  shoes: "shoes",
  accessories: "accessories",
  not_clothing: "not clothing",
};

const confident = (answer) =>
  answer && typeof answer.confidence === "number" && answer.confidence >= CONFIDENCE_BAR;

// Fills in only what the rules left blank, and records that this wording
// has been asked about either way.
const applyProductAnswer = async ({ product }, answer) => {
  const audience = confident(answer) ? AUDIENCE[answer.audience] || null : null;
  const category = confident(answer) ? CATEGORY[answer.kind] || null : null;
  const excluded = confident(answer) ? EXCLUDED[answer.kind] || null : null;
  // Only a Product that ends up Clothes keeps a type: the rules' if they
  // have one, else a confident answer naming one of the nine (rule 8).
  const sureOfType =
    answer &&
    typeof answer.clothes_type_confidence === "number" &&
    answer.clothes_type_confidence >= CONFIDENCE_BAR &&
    isClothesType(answer.clothes_type);
  const clothesType = clothesTypeFor(product) || (sureOfType ? answer.clothes_type : null);
  await db.query(
    `UPDATE products
     SET audience = COALESCE(audience, $2),
         category = COALESCE(category, $3),
         excluded_as = COALESCE(excluded_as, $4),
         clothes_type = CASE WHEN COALESCE(category, $3) = 'clothes' AND COALESCE(excluded_as, $4) IS NULL
                             THEN COALESCE(clothes_type, $6) END,
         ai_asked_hash = $5
     WHERE product_id = $1`,
    [product.product_id, audience, category, excluded, product.text_hash, clothesType]
  );
  return product.product_id;
};

const validUkSizes = (sizes) =>
  Array.isArray(sizes) &&
  sizes.length > 0 &&
  sizes.every(isUkSize);

const applySizeAnswer = async ({ size }, answer) => {
  const usable = confident(answer) && validUkSizes(answer.uk_sizes);
  const ukSizes = usable ? [...new Set(answer.uk_sizes)].sort((a, b) => a - b) : [];
  // An unsure answer is stored with no UK sizes, which keeps the label on
  // the Review list and stops it being asked again.
  await saveTranslation(size.brand || "", size.size_label, ukSizes, "ai", answer.confidence);
  const { rows } = await db.query(
    `SELECT DISTINCT p.product_id FROM products p JOIN product_sizes s USING (product_id)
     WHERE ${BRAND_KEY} = LOWER(TRIM($1)) AND ${LABEL_KEY} = LOWER(REGEXP_REPLACE(TRIM($2), '\\s+', ' ', 'g'))`,
    [size.brand || "", size.size_label]
  );
  return rows.map((r) => r.product_id);
};

const runAiTagging = async ({ model, log = console.log }) => {
  const questions = [
    ...(await productsToAsk()).map(productQuestion),
    ...(await sizesToAsk()).map(sizeQuestion),
  ];
  if (!questions.length) {
    log("AI tagging: nothing to ask");
    return { asked: 0, answered: 0 };
  }
  log(`AI tagging: asking about ${questions.length} things`);
  const answers = await model.askAll(questions);

  const touched = new Set();
  let answered = 0;
  for (const question of questions) {
    const answer = answers.get(question.custom_id);
    if (!answer) continue; // No answer (error or expiry): ask again next run.
    answered++;
    if (question.kind === "product") touched.add(await applyProductAnswer(question, answer));
    else (await applySizeAnswer(question, answer)).forEach((id) => touched.add(id));
  }
  await retranslateAndSortProducts([...touched]);
  log(`AI tagging: ${answered} answered, ${questions.length - answered} to ask again`);
  return { asked: questions.length, answered };
};

module.exports = { runAiTagging, CONFIDENCE_BAR };
