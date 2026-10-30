// Works out the product list's order afresh: the Stock check's last step,
// once every Retailer is collected and the AI has tagged what it could.
const db = require("../db/connection");
const { rebuildProductOrder } = require("../lib/product-order");
const { countClothesTypes } = require("../lib/catalogue");

rebuildProductOrder()
  .then((count) => console.log(`Product order rebuilt: ${count} Products`))
  .then(countClothesTypes)
  .then(({ typed, untyped }) => console.log(`Clothes on the site: ${typed} with a Clothes type, ${untyped} without`))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
