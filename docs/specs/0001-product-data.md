# 0001: Product data

Agreed with Tico on 12 Oct 2026. The first release aims to get as many Shoppers as possible, so a broad catalogue and accurate sizes come before anything for Retailers.

## Goal

Yxra collects Products from UK online Retailers every night without needing their sign-off, works out which are Plus size clothes, swimwear, activewear or lingerie (see [ADR 0007](../adr/0007-lingerie-and-bra-sizes.md)), translates every Size label onto the UK size scale, and keeps stock current. A Shopper can then search by her UK size and category and see only Products that are in stock in that size. When she chooses one, Yxra checks it one last time before sending her to the Retailer.

## Out of scope

- Matching the same garment across Retailers ("also sold at").
- Branches and in-store stock.
- Placements, Standouts and Regions.
- Back-in-stock alerts (but sold-out Products are kept so these can be added).
- Shoes. (Lingerie was added on 21 Oct 2026: [ADR 0007](../adr/0007-lingerie-and-bra-sizes.md).)
- Body-measurement size matching.

## Terms

Uses: Shopper, Retailer, Brand, Product, Size label, UK size, Plus size, Stock check, Live check, Click-out.
Adds: **Suggested Retailer** and **Review list** (see [CONTEXT.md](../../CONTEXT.md)).

## Decisions

| # | Question | Decision | Why |
|---|---|---|---|
| D1 | What is one Product? | One garment, one colour, one Retailer | Stock, photos and links differ by colour; "black in 24" must be exact |
| D2 | Same garment at two Retailers? | Two Products; no matching | Barcodes are often missing and a wrong match sends a Shopper to the wrong dress |
| D3 | First source | Shopify public product data; then product structured data on Retailer pages (found via sitemaps); affiliate feeds replace either once approved | Shopify has clean per-size stock and needs no approval |
| D4 | How Retailers are added | Tico adds them by hand; discovery also finds Suggested Retailers that wait for Tico's approval | A trusted list first, with room to grow |
| D5 | When discovery is built | Right after the first build works end to end, before launch (16 Nov) | Keeps the first build small; grows the catalogue before launch |
| D6 | Size label with no confident UK size | Hidden from Shoppers; goes to the Review list | The 98% right-size promise; a wrong size costs trust |
| D7 | Size label covering two UK sizes | Shown under both, marked "fits 18–20" | The Retailer says it fits both |
| D8 | Product sold out in every size, or gone from the Retailer | Hidden but kept; comes back on restock; deleted 30 days after it disappears from the Retailer's data | Search stays in-stock only; restocks and future alerts keep working |
| D9 | Which AI tags Products | A small hosted model run as an overnight batch first; switch to a free open model if costs grow | Accuracy matters most while the catalogue is small |
| D10 | Live check finds her size just sold out | Don't send her; mark that size sold out; offer similar in-stock Products. If the check fails, send her on | Landing on a sold-out page is the frustration Yxra exists to remove |
| D11 | Where data and the nightly job run | Supabase Postgres; nightly Stock check as a scheduled GitHub Action | Free, and already half set up |
| D12 | Website | Next.js on Vercel, calling the existing Express API (also on Vercel) | Fast, findable on Google; keeps existing code |
| D13 | Spec format | Markdown in `docs/specs/`, sections as in [README](README.md) | Lives beside the code and glossary; rules become tests |

## Rules

### Collecting

1. A Retailer's Products are collected only once Tico has added the Retailer or approved it from Suggested Retailers.
2. Each Retailer records which source its Products come from, and the nightly Stock check uses that source.
3. Each colour of a garment becomes its own Product with its own photo, link and sizes in stock.
4. Collection respects the Retailer's robots.txt, fetches no faster than one request every few seconds per Retailer, and identifies itself as Yxra with a contact address.
5. When Tico removes a Retailer, its Products disappear from search at once and none are collected again.
6. When one Retailer fails to load, the others still complete, and that Retailer's existing Products keep their last known stock and check time.

### Sorting

7. Plain rules decide category, audience and UK size wherever the Retailer's data makes them clear; the AI is asked only about what the rules cannot settle.
8. The AI is asked about a Product again only when its title, description or Size labels change; a change in stock alone never triggers it.
9. Each AI answer carries a confidence; anything below the bar goes to the Review list instead of being shown.
10. Only Products for women, in clothes, swimwear, activewear or lingerie, and Plus size (made in UK 18 or above, or for a bra band 38 or above, whatever is in stock today) are shown to Shoppers.

### Sizes

11. Every Size label is translated onto the UK size scale (or for a bra, read as a Bra size), using the Brand's size chart where Yxra has one, then rules, then the AI.
12. A Size label with no confident UK size is never shown to Shoppers and goes to the Review list until Tico settles it.
13. A Size label that covers more than one UK size appears in searches for each of them, marked with the full range ("fits 18–20").

### Stock

14. Every Product's stock in each size is refreshed once a night, and the Product shows when that happened.
15. Search shows a Product only if it is in stock in the Shopper's chosen UK size (or for bras, her band and cup).
16. A Product sold out in every size is hidden but kept, and is shown again automatically when any size comes back.
17. A Product missing from its Retailer's data for 30 days in a row is deleted.

### Click-out

18. When a Shopper chooses to go to the Retailer, a Live check confirms that Product is in stock in her size before she leaves.
19. When the Live check finds her size sold out, she is not sent; she sees "Just sold out in <size>", that size is marked sold out at once, and similar in-stock Products are offered.
20. When the Live check fails or takes too long, she is sent to the Retailer as normal.
21. Every Click-out is recorded with the Product, the UK size (or Bra size) and the time.

### Discovery (after the first build)

22. Discovery only ever creates Suggested Retailers; it never adds a Retailer by itself.
23. A shop Tico has rejected is never suggested again.

## Build steps

1. **Data model**: one row per Product (Retailer, colour, link, photo, price, Brand), a sizes table (Size label, UK sizes, in stock, last checked), each Retailer's source, and the Review list. The current one-size-per-product model is replaced.
2. **Shopify reader**: reads a Retailer's public product data and turns it into Products, one per colour, with sizes and stock. Ends with a command that loads one real Retailer into a local database.
3. **Nightly Stock check**: a scheduled GitHub Action runs every Retailer's reader against Supabase, hides sold-out Products and deletes ones gone for 30 days.
4. **Sorting and sizes**: rule filters, Brand size charts and UK size translation, with the Review list for anything unsettled.
5. **AI tagging**: the overnight batch for Products the rules could not settle, re-asked only when their text changes.
6. **API**: search by UK size and category returning only in-stock Products; a Click-out link that runs the Live check and then redirects or offers alternatives.
7. **Website**: Next.js on Vercel with search, Product cards and the Click-out flow.
8. **Discovery**: finds Suggested Retailers for Tico's approval (before launch, after steps 1–7 work).
9. **Second source**: product structured data from Retailer pages via sitemaps.

## Open questions

- **Review list**: does Tico review it on a simple admin page or in a spreadsheet? (Tico; needed by build step 4.)
- **AI confidence bar**: what confidence counts as "confident"? Start at a strict bar and tune it using the weekly spot-check of 20 Products. (Claude proposes; Tico approves.)
- **"Similar" Products at a failed Click-out**: same category, same UK size and closest price to start? (Tico; needed by build step 6.)
- **Contact address** used to identify Yxra's fetching. (Tico.)
