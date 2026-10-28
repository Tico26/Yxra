// Judges each shown Product's photo once, overnight with the AI tagging, so
// Products with professional-looking photos can come first in the product
// list (lib/product-order.js). Professional means what Tico chose on 28 Oct
// 2026: worn by a model, on a plain studio background, the whole garment in
// view and sharp. Flat-lays and lifestyle shots come after. A photo is asked
// about again only when the Product's photo changes.
const db = require("../db/connection");

// Spreads the first run over a few nights, and keeps any one night's batch small.
const MAX_PHOTOS_PER_RUN = 5000;

const PHOTO_SCHEMA = {
  type: "object",
  properties: {
    worn_by_model: { type: "boolean", description: "A person is wearing the garment" },
    plain_background: { type: "boolean", description: "A plain studio background (one colour, no scenery)" },
    whole_garment_in_view: { type: "boolean", description: "The whole garment is in the photo, not cut off" },
    sharp: { type: "boolean", description: "In focus and well lit" },
  },
  required: ["worn_by_model", "plain_background", "whole_garment_in_view", "sharp"],
  additionalProperties: false,
};

const PHOTO_SYSTEM =
  "You look at product photos for Amara's Pick, a UK site that helps plus-size women find clothes. " +
  "Answer each question about the photo as it is. A flat-lay or a garment on a hanger or mannequin " +
  "is not worn by a model. A street, room or outdoor scene is not a plain background.";

const isProfessional = (answer) =>
  answer.worn_by_model === true &&
  answer.plain_background === true &&
  answer.whole_garment_in_view === true &&
  answer.sharp === true;

// The AI only needs a small copy. Shopify's image CDN resizes on request;
// other photos are sent as they are.
const smallPhoto = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    if (url.hostname === "cdn.shopify.com" || url.pathname.includes("/cdn/shop/")) {
      url.searchParams.set("width", "512");
    }
    return url.toString();
  } catch {
    return imageUrl;
  }
};

const photoQuestion = (p) => ({
  custom_id: `photo-${p.product_id}`,
  kind: "photo",
  subject: p.image_url,
  system: PHOTO_SYSTEM,
  schema: PHOTO_SCHEMA,
  prompt: [
    { type: "image", source: { type: "url", url: smallPhoto(p.image_url) } },
    { type: "text", text: `Product: ${p.title}` },
  ],
  product: p,
});

// Shown Products whose current photo has not been judged.
const photosToAsk = async (limit = MAX_PHOTOS_PER_RUN) => {
  const { rows } = await db.query(
    `SELECT p.product_id, p.title, p.image_url
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE r.removed_at IS NULL AND p.missing_since IS NULL AND p.sort_status = 'shown'
       AND p.image_url IS NOT NULL
       AND p.photo_checked_url IS DISTINCT FROM p.image_url
     ORDER BY p.product_id
     LIMIT $1`,
    [limit]
  );
  return rows;
};

const runPhotoCheck = async ({ model, log = console.log, limit }) => {
  const questions = (await photosToAsk(limit)).map(photoQuestion);
  if (!questions.length) {
    log("Photo check: nothing to ask");
    return { asked: 0, answered: 0, professional: 0 };
  }
  log(`Photo check: asking about ${questions.length} photos`);
  const answers = await model.askAll(questions);

  let answered = 0;
  let professional = 0;
  for (const { product } of questions) {
    const answer = answers.get(`photo-${product.product_id}`);
    if (!answer) continue; // No answer (error, unreadable photo): asked again next run.
    answered++;
    const good = isProfessional(answer);
    if (good) professional++;
    // Only if the photo is still the one judged; a new one waits for next run.
    await db.query(
      `UPDATE products SET photo_professional = $2, photo_checked_url = $3
       WHERE product_id = $1 AND image_url = $3`,
      [product.product_id, good, product.image_url]
    );
  }
  log(`Photo check: ${answered} answered (${professional} professional), ${questions.length - answered} to ask again`);
  return { asked: questions.length, answered, professional };
};

module.exports = { runPhotoCheck, smallPhoto, isProfessional, MAX_PHOTOS_PER_RUN };
