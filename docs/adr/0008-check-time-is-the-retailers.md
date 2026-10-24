# A Product's check time is its Retailer's collection time

Decided by Tico on 24 Oct 2026. Changes how spec 0001 rule 14 is stored.

Every Product in a Retailer is checked in the same nightly save, so the time a Product and its sizes were checked is the Retailer's `last_collected_at`, and the API reports that. A Retailer that fails to load keeps its last collection time, so its Products still show when they were really last checked (rule 6).

Each save now rewrites only the Products and sizes whose data changed (price, link, photo, text, stock, sorting, or coming back after being missing). Before, every row was rewritten every night just to move its own check time. In Postgres a rewritten row leaves its old copy behind until vacuum, so the tables settled at about twice their real size: in a 25-shop scale test over four simulated nights the products and sizes tables held at 82 MB, against 41 MB when only changed rows are written, and the nightly saves took 40–80% longer. On Supabase's 500 MB free tier that bloat roughly halved how many Retailers fit.

The rows keep their `last_checked_at` columns, which now mean when the row was last written. They are not read for the check time any more and could be dropped later.
