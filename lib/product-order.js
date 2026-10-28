// The product list's order, worked out once a night (the Stock check's last
// step, after every Retailer and the AI tagging) and at each deploy, so a visitor's search only reads the first Products in
// it instead of shuffling the whole catalogue (28 Oct 2026: that took the
// free database up to 10 s). Products with a professional photo come first
// (Tico, 28 Oct 2026; see lib/photo-check.js), then the rest. Within each,
// each Retailer's Products are mixed at random and Retailers take turns, in
// an order also picked at random, so one Retailer's Products are not all
// together and the list changes from night to night. No Retailer can pay to
// be placed higher: the photo is judged the same way for every Retailer.
//
// Every shown Product takes part, also one missing from its Retailer's data or
// at a removed Retailer: searches still check each is shoppable, and it keeps
// its place if it comes back.
const db = require("../db/connection");

const rebuildProductOrder = async () => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM product_order`);
    const { rowCount } = await client.query(
      `WITH shops AS (
         SELECT retailer_id, row_number() OVER (ORDER BY random()) AS shop_order FROM retailers
       )
       INSERT INTO product_order (product_id, retailer_id, photo_rank, turn, shop_order)
       SELECT p.product_id, p.retailer_id, p.rank,
         row_number() OVER (PARTITION BY p.retailer_id, p.rank ORDER BY random()), s.shop_order
       FROM (SELECT *, photo_rank(photo_professional, photo_checked_url, image_url) AS rank
             FROM products) p
       JOIN shops s USING (retailer_id)
       WHERE p.sort_status = 'shown'`
    );
    await client.query("COMMIT");
    return rowCount;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { rebuildProductOrder };
