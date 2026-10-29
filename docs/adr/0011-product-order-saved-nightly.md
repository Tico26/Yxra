# The product list's order is saved nightly, not shuffled per visitor

Decided by Tico on 28 Oct 2026, after live timings showed the product list taking 8 to 10 s when the free database was cold.

Each visit used to shuffle every shown Product and its sizes afresh, so the database read the whole catalogue for every page and nothing could be cached. Now the order (each Retailer's Products mixed at random, Retailers taking turns in a random order) is worked out once after each nightly Stock check and at each deploy, and saved in product_order. A search walks that order and stops once it has enough. A Product shown during the day joins at once, after its Retailer's others, until the next night mixes it in. The website Worker also keeps each product list answer at Cloudflare's edge for 10 minutes.

The cost is that refreshing the page shows the same order until the next night (or for 10 minutes from the edge cache), not a new mix each time. Ordering by photo quality, being built separately, slots into the same nightly order.
