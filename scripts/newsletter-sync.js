// Nightly: make Brevo's accounts list match the news emails box on Shopper
// accounts, and untick the box for anyone who unsubscribed (lib/newsletter-sync.js).
const db = require("../db/connection");
const { syncAccountsList } = require("../lib/newsletter-sync");

syncAccountsList()
  .then((summary) => console.log("Newsletter sync:", JSON.stringify(summary)))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
