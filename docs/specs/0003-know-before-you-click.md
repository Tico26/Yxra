# 0003: Know before you click

Agreed with Tico on 20 Oct 2026, one decision at a time. Comes from pipeline run 3: the shopper panel said what would win them over was each card showing the Retailer's own size measurements and its return costs, plus sorting by sale and price (retest: 5 of 20, 25%, which meets the bar). The offer is "Know before you click" in `yxra-founder/run-3/founder/offer.md`, items A, C and D.

## Goal

Every Product card in her size shows what the Retailer's own size guide says that size measures (bust, waist, hips) and what sending it back would cost, before she leaves Yxra. She can sort results by price, show only items the Retailer has marked down, show only items under £45, and show only Retailers with free returns. Running it costs £0 (spec 0002 rule 34).

## Out of scope

- The Retailer's fit note ("runs small"), fit notes from Shoppers, the "Shops we search" page and the "How results are ordered" line (offer items B, E, F, G). Each can get its own ticket.
- Size guides per Brand when a Retailer sells several Brands with different guides. At launch one guide per Retailer.
- Comparing her size with a big Retailer's guide (Yours, Simply Be). See open questions.
- Discount codes (they change daily and would be untrue when stale).
- Free returns paid for by Yxra.

## Terms

Uses: Shopper, Retailer, Product, UK size, Size label, Stock check, Click-out, Review list, Placement.
Adds:
- **Size guide**: the measurements a Retailer publishes for each of its UK sizes, in cm.
- **Returns terms**: a Retailer's return window in days, whether returning is free, and the cost when it is not.
- **Sale price**: a Product's price when its Retailer shows a higher "was" price next to it.

## Decisions

| # | Question | Decision | Why |
|---|---|---|---|
| D1 | How Size guides are collected | A Claude Code routine on Tico's plan reads each Retailer's size guide page and drafts the rows; nothing shows until Tico approves them on the admin page. Tico can also type a guide in by hand (Tico, 20 Oct) | £0 like spec 0002 D7, keeps Tico's time to checking, and scales as discovery adds Retailers |
| D2 | How Returns terms are collected | The same routine drafts them from the Retailer's returns page and Tico approves and re-checks them every 30 days (Tico, 20 Oct) | Terms change rarely; a date keeps them honest |
| D3 | What a card shows when a guide or terms are missing or stale | The line is left off, and the card links to the Retailer's own size guide or returns page instead (Tico, 20 Oct) | Never shows a figure Yxra has not checked |
| D4 | Where the Sale price comes from | Shopify's `compare_at_price` when it is above the price; Retailers read from structured data have no Sale price until their data gives one; Yxra's own price history never makes a Sale price (Tico, 20 Oct) | Only what the Retailer itself marks down |
| D5 | Default order | Newest first stays the default; price low to high and high to low are choices (Tico, 20 Oct) | Matches spec 0001; commission never changes the order (ADR 0005) |

## Rules

### Size guide

1. A Product card shows the bust, waist and hips in cm from its Retailer's approved Size guide for her UK size, labelled "The shop's size guide".
2. When the Product's Size label covers two UK sizes ("fits 18–20"), the card shows the range for each measurement.
3. When a Retailer has no approved Size guide for her UK size, the card shows no measurements and links to the Retailer's size guide page.
4. A drafted Size guide is shown to no Shopper until Tico approves it.

### Returns terms

5. A Product card shows its Retailer's approved Returns terms: "Free returns, 28 days" or "Returns £3.95, 14 days".
6. When a Retailer's Returns terms were last checked more than 30 days ago, the card leaves them off and the admin page lists the Retailer as due.
7. When a Retailer has no approved Returns terms, the card links to its returns page instead.

### Sale and price

8. A Product has a Sale price only when its Retailer shows a higher price next to the current one; the card then shows both, with the higher one struck through.
9. "Sale only" shows only Products with a Sale price.
10. "Under £45" shows only Products priced under £45.
11. "Free returns only" shows only Products whose Retailer has approved, current Returns terms that are free.
12. Sorting by price orders by the price she would pay today, cheapest or dearest first; Products with the same price keep the newest first.
13. A Placement never appears in a price sort and never changes a price sort's order.
14. Her sort and filters live in the page link, so a shared link shows the same results.

### Running costs

15. Nothing here needs a paid plan or a paid API key.

## Build steps

1. **Sale price.** Collect `compare_at_price` from Shopify into a new `was_price_in_pence`; the API returns it. Ends with: a test Product with a markdown comes back with both prices.
2. **Sort and filters in the API.** `GET /api/products` takes `sort=new|price_low|price_high`, `sale=only`, `max_price` (pence) and `returns=free`. Ends with: tests for rules 9 to 13 pass.
3. **Returns terms.** Columns on the Retailer for the window, free or paid, cost, page link and checked date, an admin form to enter and approve them, and the API returning them with each Product. Ends with: tests for rules 5 to 7 pass.
4. **Size guides.** A table of approved measurements per Retailer and UK size, an admin form to enter and approve them, and the API returning her size's row with each Product. Ends with: tests for rules 1 to 4 pass.
5. **Drafting routine.** `scripts/guides.js --export` lists Retailers due a guide or terms check with their page links; a Claude Code routine reads the pages and writes drafts; `--import` saves them as drafts for Tico. Ends with: drafts for the launch Retailers wait on the admin page.
6. **Cards and the results bar.** The card lines from rules 1, 5 and 8, and a sort menu with the three filter switches above the grid, in the D13 look. Ends with: the site shows them with real Products.
7. **Tico approves the launch Retailers.** About 10 minutes per Retailer. Ends with: every launch Retailer has an approved guide and terms, or its cards link out.

## Open questions

- Should the card also show the same size in Yours' or Simply Be's guide, so she can compare with a shop she knows? The panel's version had this (Tico).
- Is "Under £45" the right price line, or should it be a choice of price bands (Tico)?
