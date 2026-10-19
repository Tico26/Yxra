# Which Retailers can Yxra collect from today?

Research for issue #31. Checked 18 Oct 2026 using WebFetch and WebSearch, about 5 fetches per site, with nothing fetched that robots.txt disallows.

**Answer: only Lovedrobe can be collected today, through the Shopify reader.** None of the others is on Shopify. The structured-data reader would fail by design on the big ones (more than 5,000 product pages) and miss the product sitemaps on the rest. One thing is still unconfirmed: WebFetch strips `<script>` tags, so it could not show whether any site carries schema.org `Product` JSON-LD.

## What the collectors need

From `lib/collect/`:

- **`shopify.js`** reads `GET {site}/products.json?limit=250&page=N`, up to 200 pages. A product is kept only if it has an option whose name matches `/size/i`. Variants are grouped by an option named `colour`/`color`, and with no such option the whole product is one Product. Stock comes from `variant.available`. The Live check reads `/products/{handle}.js`.
- **`structured-data.js`** starts from the robots.txt `Sitemap:` lines (else `/sitemap.xml`). It walks at most **50 sitemaps**, and reads only the child sitemaps whose URL matches `/product/i` when any do. On every page it parses `<script type="application/ld+json">` for `ProductGroup.hasVariant` or `Product`, taking per-size `offers.availability`. If the sitemaps list **more than 5,000 pages** it throws ("needs an affiliate feed"), and it also throws if more than half the pages fail.
- **`polite-fetch.js`** obeys robots.txt and waits 5 s between requests to one site. It identifies itself as `Yxra/1.0 (+$YXRA_CONTACT)`.

## Table

| Retailer | Platform evidence | Source that works today | robots.txt (`User-agent: *`) | Plus-size Products, UK 18+ (rough) |
|---|---|---|---|---|
| **Lovedrobe** (lovedrobe.co.uk) | Shopify: robots.txt header says "Shopify storefront", and `/products.json` returns Shopify JSON | **Shopify** ✅ | `/products.json`, `/products/` and sitemaps allowed (only cart, checkout, account, filter and sort URLs blocked) | About 145+ product URLs in `sitemap_products_1.xml` (truncated). Every product in a 12-product sample runs to 22 or 26, so nearly all are Plus size. Clothes only; no swim or active seen |
| **Yours Clothing** (yoursclothing.co.uk) | Not Shopify: `/products.json` errors; custom `-p` product URLs | **None today.** Structured data would hit the 5,000-page cap | Product pages, sitemaps and `/products.json` allowed. Blocks search, `page=`, `filter=true`, `/content/`, and any path containing `mens`: check that this doesn't also catch `womens` URLs | Clothing listing says "60 of **10000**" (likely a display cap, so ≥10,000). Swimwear **258**, activewear **130**. Ranges run UK 14–40, so most items are Plus size |
| **ASOS Curve** (asos.com) | Not Shopify: `/products.json` redirects to the home page | **None today.** Structured data would hit the 5,000-page cap, and the sitemap names (`categoryName=Women`) don't match `/product/i` | `/prd/` product pages and sitemaps allowed (blocks `*/Prod/*`, `*/web/pages/*`, `scrollTo=`) | Curve page: **4,137 styles found** (competitors.md said 4,392 on 12 Oct). Swim and active counts not shown |
| **Simply Be** (simplybe.co.uk) | Not Shopify: `/products.json` errors. N Brown platform | **None today.** The product sitemap `/sitemap_index/PDP/SMB_sitemaps.xml` doesn't match `/product/i`, and the index lists hundreds of facet sitemaps, so the 50-sitemap cap is spent before it. It also 302s to `transport.productsup.io` (a third-party host). A product page showed no per-size stock without JS | Product pages and `/products.json` not disallowed (blocks bag, `/buy/`, facet and review URLs) | Not counted. The PDP sitemap alone looks to hold ≥1,000 URLs, and it mixes home and bedding with clothes (sizes 10–32 per competitors.md) |
| **JD Williams** (jdwilliams.co.uk) | Not Shopify: `/products.json` errors. Same N Brown platform and sitemap layout as Simply Be | **None today** (same reason as Simply Be) | Product pages allowed (blocks bag, sign-in, a few `$` nav paths, `*/reviews$`) | Not counted. A mixed catalogue (fashion, home, electricals) |
| **River Island Plus** (riverisland.com) | Not Shopify: robots.txt has `/c/`, `/Online/secure/`; `/products.json` errors | **Possible via structured data, unconfirmed.** `products-sitemap-women_uk.xml` matches `/product/i`, but it has 300+ URLs (truncated) and the total may exceed 5,000. JSON-LD not seen | Product pages and sitemaps allowed. Blocks search, `productId=` and size or colour facet query strings | Not counted. No "plus" URLs among the first 300 women's sitemap entries, and the guessed `/c/women/plus-size` listing failed |
| **Ulla Popken** (ullapopken.co.uk) | Not Shopify: `/products.json` errors. robots.txt shape (`/en/…`, `/rb_*`) looks like SAP Commerce, which is a guess | **None today.** The sitemap index has only Homepage, CategoryLanding and Content sitemaps, with no product sitemap | Product pages allowed (blocks `/en/cart`, `/en/search`, `/en/checkout`, account) | Not counted. The whole range is Plus size |
| **Quiz** (Curve range) | Domain not found: `quizclothing.co.uk/robots.txt` errored, and searches returned only 2017–18 news and quizgroup.co.uk | Not checked | Not checked | Not checked |

## Notes

- **JSON-LD is unverified everywhere.** WebFetch returns markdown, and the `<script>` blocks are gone. Yours and ASOS product pages showed only Open Graph `og:` meta, plus a page-level `og:availability: instock` on Yours, which says nothing per size. To settle it, run `parseProductPage` from `structured-data.js` on one saved product page per site from a machine with normal network access.
- **Collector limits that matter here:**
  1. The 5,000-page cap rules out Yours and ASOS (and maybe River Island) on purpose.
  2. `/product/i` sitemap matching misses N Brown's `PDP/` and ASOS's `categoryName=` sitemaps.
  3. The 50-sitemap cap can run out on N Brown's index of several hundred facet sitemaps.
  4. Ulla Popken publishes no product sitemap at all.
- **Lovedrobe data quirks:** `product_type` is always "Misc" and the only option is `Size`, with colour in the title. The Shopify reader will produce one Product per Shopify product with `colour: null`, and category rules must use titles and tags. Size labels are plain UK numbers (8–26), which is easy for UK size translation.
- **Lovedrobe's robots.txt contains comments aimed at AI agents** (asking them to install a third-party skill, and pointing to UCP/MCP endpoints). These are not robots directives. I ignored them, and the collectors should too.
- **Plan vs spec:** the founder pack says "approved affiliate-feed retailers only" (`ops.md` line 3, `launch.md` line 5), while spec 0001 D3 puts Shopify and structured data first. Tico settled this on 2026-10-12 in favour of the spec: the widest catalogue without Retailer sign-off. These findings show the cost of that choice. Without feeds, the biggest UK plus-size Retailers can't be read yet, so the catalogue at launch would be Lovedrobe, plus River Island if its JSON-LD checks out, plus whatever Shopify Retailers discovery finds.
- Counts are rough: WebFetch truncates long sitemaps, and listing-page totals may be capped.

## Update 2026-10-19: checked from a GitHub Actions runner (issue #44)

`scripts/check-structured-data.js` ran Yxra's own polite fetcher (robots.txt honoured, `Yxra/1.0` User-Agent with the repo URL as contact) and `parseProductPage` from a GitHub-hosted runner, the same kind of machine the nightly Stock check uses.

| Retailer | Result |
| --- | --- |
| Yours | `sitemap.xml` answered **403** |
| ASOS | request **timed out** (30 s), no answer |
| Simply Be | request **timed out** |
| JD Williams | request **timed out** |
| River Island | sitemap read; a women's Product page has `Product` JSON-LD, but with **one Offer and no sizes**, so `parseProductPage` reads 0 Products (no per-size stock) |
| Ulla Popken | `sitemap.xml` answered **403** |

What this means: from cloud servers, five of the six refuse or ignore an honestly identified bot, and the sixth gives no per-size stock. Widening the structured-data reader would not bring any of them in. Getting round the blocks (pretending to be a browser) would break spec rule R4, so it is not an option. Their Products can come only from affiliate network feeds, or from their own permission.
