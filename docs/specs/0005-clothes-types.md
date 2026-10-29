# 0005: Clothes types

Asked for by Tico on 29 Oct 2026 ("Let's split the products into categories. Don't stop building it."). He asked for the build to keep going, so Claude made the decisions below with a recommendation each and wrote them down here; any of them can be changed by pull request.

## Goal

A Shopper can narrow the product list to the kind of garment she wants: Dresses, Tops, Jumpers & cardigans, Coats & jackets, Jeans, Trousers & shorts, Skirts, Jumpsuits & co-ords, or Nightwear & loungewear, as well as Swimwear, Activewear and Lingerie as today. Picking one shows up to 500 of that kind, not only the ones that happened to be among the first 500 Products, and the address of the page says which one she picked, so it can be shared or linked to. Running it stays at £0.

## Out of scope

- Types inside Swimwear, Activewear and Lingerie (bikinis, sports bras, bras). They stay one filter each for now.
- Tico setting a Product's type by hand on the admin page. A Product without a type is still shown under "All".
- Filtering by more than one type at once, neckline, sleeve, length, fabric or occasion.
- Search by words (a separate piece of work).
- Waist sizes (Parasol Store's 26–32) being read as UK sizes. Known and tracked separately; this spec does not change sizes.
- Menus, the home page and shop pages beyond what Rule 13 says.

## Terms

Uses: Product, Retailer, Shopper, Review list, Stock check.
Adds (also in [CONTEXT.md](../../CONTEXT.md)):
- **Category**: the broad kind of Product (Clothes, Swimwear, Activewear, Lingerie), already in the code since spec 0001 but not yet in the glossary.
- **Clothes type**: what kind of garment a Product in Clothes is, such as Dresses or Jeans. Every Clothes Product has one Clothes type or none yet; Swimwear, Activewear and Lingerie Products never have one.

## Decisions

| # | Question | Decision | Why |
|---|---|---|---|
| D1 | One level or two | Keep the four Categories and add a Clothes type inside Clothes only (Claude, 29 Oct) | Clothes is most of the catalogue and the only Category too broad to browse; the other three are small enough as they are |
| D2 | Which types | Dresses, Tops, Jumpers & cardigans, Coats & jackets, Jeans, Trousers & shorts, Skirts, Jumpsuits & co-ords, Nightwear & loungewear (Claude, 29 Oct) | The groups UK plus-size Retailers (Yours, Evans, Simply Be) use on their own menus, merged where one would be thin |
| D3 | What the Shopper sees | One row of filters: All, the nine Clothes types, then Swimwear, Activewear, Lingerie (Claude, 29 Oct) | One tap to what she wants, no second row to discover; "Clothes" as a filter adds nothing once its types are there |
| D4 | How a type is decided | Plain word rules first, reading the title before the Retailer's product type and tags; the AI only for Clothes Products the rules can't settle, asked once per wording (Claude, 29 Oct) | Same pattern as Categories (spec 0001 R7–R8): free for most Products, AI only where needed |
| D5 | When the rules and AI can't tell | The Product is still shown, under "All" only (Claude, 29 Oct) | Hiding a good Product because its type is unclear would shrink the catalogue for no gain |
| D6 | Where filtering happens on the products page | The server: each filter fetches its own list (Claude, 29 Oct) | The page only ever gets 500 Products; filtering those in the browser would leave thin types nearly empty |
| D7 | Order inside a type | The saved product order, unchanged: Studio catalogue Retailers first, Retailers taking turns (Claude, 29 Oct) | Keeps PR #86's order and its speed; the filter only skips Products |

## Rules

### Deciding the type

1. When a Clothes Product's title names one Clothes type, it gets that type ("Wrap Midi Dress" is Dresses).
2. When a title names more than one, the last one named before any "with" or "in" wins, as the garment is named last in English ("Jumper Dress" is Dresses, "Denim Jacket" is Coats & jackets, "Dress with Shirt Collar" is Dresses).
3. When the title names pyjamas, a nightdress, a nightie, a robe, a dressing gown or loungewear, the type is Nightwear & loungewear whatever else it names ("Pyjama Set", "Lounge Shorts").
4. When the title names no type, the Retailer's own product type decides; when that names none either, the tags decide, but only if every tag that names a type names the same one.
5. Swimwear, Activewear and Lingerie Products, and Products not shown to Shoppers for being out of scope (shoes, menswear), never get a Clothes type.
6. When a Product's wording changes, its type is decided again; when only stock, price or photos change, it keeps its type.
7. When the rules can't decide, the overnight AI is asked once per wording; a confident answer (the same confidence bar as for Categories) sets the type, and an unsure one leaves it blank.
8. When the AI says a Product is not Clothes, it gets no Clothes type.
9. Every Product already in the catalogue gets its type from the rules the first time this runs, without waiting for its wording to change.

### Browsing

10. The products page shows the filters in this order: All, Dresses, Tops, Jumpers & cardigans, Coats & jackets, Jeans, Trousers & shorts, Skirts, Jumpsuits & co-ords, Nightwear & loungewear, Swimwear, Activewear, Lingerie.
11. When she picks a filter, she sees up to 500 Products of that kind in stock in plus sizes, in the saved product order, 48 at a time as today.
12. The page address carries the filter (`/products?type=dresses`, `/products?category=swimwear`); opening that address opens the page with that filter picked, and an unknown value opens "All".
13. A shop's page offers only the filters that have Products from that shop, in the same order.
14. A Product without a Clothes type appears under All (and on its shop's page under All) but under no type.
15. Price range and sort work inside the picked filter as they do today.
16. The product list API accepts `type` (one of the nine) on its own or with a size or Retailer, and refuses an unknown type with a clear message.

### Costs

17. Nothing here needs a paid plan. The AI is asked only about Clothes Products the rules can't settle, each wording once, within the existing nightly limit of 2,000 questions.

## Build steps

Each step is built tests first: the tests are written and seen failing, then the code makes them pass.

1. **The rules.** Clothes types and their words in one place; the sorting rules return a type. Ends with: tests for rules 1–5 pass.
2. **Saving the type.** A Clothes type on each Product, filled in by the Stock check when the wording is new or changed, and for every existing Product by the migrate step. Ends with: tests for rules 6 and 9 pass against a database.
3. **The AI.** The overnight batch also asks for the type of Clothes Products the rules left blank. Ends with: tests for rules 7, 8 and 17 pass with a fake model.
4. **The API.** `GET /api/products?type=` filters by type in the saved order. Ends with: tests for rules 11 and 16 pass.
5. **The site.** The filter row from one list, the products page fetching each filter from the API and keeping it in the address, shop pages filtering what they have. Ends with: rules 10–15 work in a local preview.
6. **Ship.** Merge, deploy, run the migrate step, and check the live products page per type. Needs Tico's go-ahead.

## Open questions

- After the first night, how many Clothes Products still have no type? If it is more than one in ten, add rule words, and check the AI batch has its key (Claude to check, Tico decides on any spend).
- Should Swimwear, Activewear and Lingerie get their own types (bikinis, sports bras, bras) before the soft open (Tico)?
- Should the home page get a "Shop by type" row linking to these filters (Tico)?
