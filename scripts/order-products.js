// Works out the product list's order afresh: the Stock check's last step,
// once every Retailer is collected and the AI has tagged what it could.
const db = require("../db/connection");
const { rebuildProductOrder } = require("../lib/product-order");

rebuildProductOrder()
  .then((count) => console.log(`Product order rebuilt: ${count} Products`))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
