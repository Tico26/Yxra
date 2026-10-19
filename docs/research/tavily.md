# Tavily as a way to fetch Retailer data

Read 2026-10-19 for Tico's question in the launch map thread. Sources: [Tavily pricing](https://www.tavily.com/pricing), [Credits & Pricing docs](https://docs.tavily.com/documentation/api-credits), [Crawl docs](https://docs.tavily.com/documentation/api-reference/endpoint/crawl), [FAQ](https://docs.tavily.com/faq/faq), [Startup program](https://tavily.com/startups), and a third-party user-agent page for [TavilyBot](https://chrisleverseo.com/user-agents/tavilybot/).

## What it is

A web search and page-fetch API for AI agents: Search (find pages), Extract (read up to 20 URLs per call), Map (list a site's pages) and Crawl (Map + Extract).

## Prices

| Plan | Price | Credits a month |
| --- | --- | --- |
| Researcher | free, no card | 1,000 |
| Project | $30/month | 4,000 |
| Bootstrap | $100/month | 15,000 |
| Startup | $220/month | 38,000 |
| Growth | $500/month | 100,000 |
| Pay as you go | $0.008 a credit | as used |

Credit costs: Search 1 (basic) or 2 (advanced) per request; Extract 1 credit per 5 pages (basic) or 2 per 5 (advanced); Map 1 per 10 pages; Crawl = Map + Extract. Failed fetches aren't charged. When credits run out, requests stop until the 1st of the month (no surprise bill on the free plan).

## Promotions

- **Startup program:** up to 100,000 credits for 6 months, but for "early-stage, VC-backed startups" (pre-seed to Series A). Yxra is self-funded, so it probably doesn't qualify.
- **Students:** free access; eligibility via support@tavily.com.
- No discount codes or launch offers listed. Third-party sites mention ~17% off for annual billing on paid plans.

## Fit for Yxra (Claude's view)

- **Collecting the big Retailers: not a fit.**
  - Output is cleaned markdown or text, with no raw-HTML option, so the structured data with per-size stock that Yxra needs is very likely lost (not confirmed; would need a test with a free key).
  - Volume: the free 1,000 credits read about 5,000 pages a month. A nightly Stock check of even 2,000 Products is ~60,000 pages a month (~12,000 credits, over $90/month on pay as you go).
  - Using a third party to fetch pages from Retailers that blocked Yxra's honestly named collector goes around their choice. That breaks the spirit of rule R4, and the database-right risk in launch-law.md stays the same.
- **Finding new plus-size shops for discovery: a good fit.** Search at 1 credit a query fits the free tier easily (a few hundred searches a month), and finding pages to suggest is what it's built for. Discovered shops would still be collected by Yxra's own polite Shopify reader.
- TavilyBot reportedly honours robots.txt (third-party source, not Tavily's own docs).
