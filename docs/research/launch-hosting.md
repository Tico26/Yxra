# Launch hosting: Supabase + Vercel vs Render + Neon + Cloudflare

Research for issue #28. Question: for Amara's Pick at launch (16 Nov 2026), what does each stack cost per month on its free or lowest tier, and which limits would bite?

All prices are in US dollars, before VAT, as the providers publish them. Every source was read on **2026-10-18**. Prices and limits change often, so re-check the linked page before paying for anything.

## What Amara's Pick needs from a host

Taken from the code on `main` as of 2026-10-18:

- **Express API** (`app.js`, `listen.js`). It serves search and `POST /api/click-outs`, which runs the Live check against the Retailer. The Live check gives up after 2.5 seconds (`LIVE_CHECK_TIMEOUT_MS` in `controllers/click-outs.controller.js`).
- **Next.js 16 site** (`web/`). Both pages are `force-dynamic`, so every page view is rendered on the server and calls the API. A Click-out goes from the Shopper's browser to `/go/<id>` on the site, then to the API, then to the Retailer.
- **Postgres** (`db/schema.sql`).
- **GitHub Actions**: the nightly Stock check plus AI tagging (`stock-check.yml`, 02:00 daily, 300-minute timeout) and weekly discovery (`discovery.yml`, Mondays 04:00, 60-minute timeout). The repository is public (checked with the GitHub API), so these runs cost nothing ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions): "free … for public repositories that use standard GitHub-hosted runners"). Hosting does not change this, so it is left out of the comparison below.

## How big the database will be

I loaded `db/schema.sql` into a throwaway Postgres 16 and filled it with made-up data at launch scale:

- 20 Retailers
- 20,000 Products, each with a description of about 1,000 characters, Shopify-length URLs and 8 tags
- 100,000 size rows (5 per Product)
- 100,000 Click-outs (roughly 3 months at about 1,000 a day)

| Table | Size including indexes |
|---|---|
| products | 41 MB |
| product_sizes | 21 MB |
| click_outs | 8 MB per 100k rows |
| everything else | under 1 MB |
| **Whole database, freshly loaded** | **78 MB** (an empty database is about 7.5 MB) |

The nightly Stock check rewrites every size row. That leaves dead rows behind until Postgres's clean-up (vacuum) reclaims the space. After two simulated nights the database peaked at **135 MB** and then settled at **about 96 MB** once vacuum ran.

**Estimate: 100–150 MB at launch.** Allow up to about 250 MB if Retailer descriptions are much longer than my sample (raw Shopify HTML can be). Click-outs add about 30 MB a year at 1,000 a day. Supabase also keeps its own `auth` and `storage` tables in the same database, which adds a little more.

This fits **Supabase Free (500 MB)** and **Neon Free (1 GB)** comfortably. Neither limit is a problem at launch.

## Comparison

### (a) Supabase + Vercel, as built

| Topic | Supabase Free (database) | Vercel Hobby (site and API) |
|---|---|---|
| Price | $0 | $0 |
| Lowest paid tier | Pro: $25/month, including $10 of compute credit ([pricing](https://supabase.com/pricing)) | Pro: $20/month per developer seat, including $20 of usage credit ([pricing](https://vercel.com/pricing)) |
| Size and usage limits | 500 MB database, 5 GB egress, 2 active projects, shared CPU with 500 MB RAM. No automatic backups on Free ([pricing](https://supabase.com/pricing)) | 1M function invocations, 4 hours of Active CPU, 100 GB data transfer and 5,000 image transformations a month. Go over and that feature stops for 30 days ([Hobby plan](https://vercel.com/docs/plans/hobby)) |
| Pausing when idle | "Free projects are paused after 1 week of inactivity." Typically "a few user requests to the database each day over the previous week is enough" to stay awake. Restoring is manual, from the dashboard ([project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)). The nightly Stock check queries every night, so it should keep the project awake | Does not pause |
| Cold start on a Click-out | Not applicable: the database is always on while the project is active | Fluid compute is on by default for new projects. It cuts cold starts with "bytecode optimization, and function pre-warming on production deployments". Vercel gives no figure ([Fluid compute](https://vercel.com/docs/fluid-compute)). This should be sub-second, but I could not verify that from an official page |
| Function time limit | Not applicable | 300 seconds on Hobby, up to 800 seconds on Pro ([Fluid compute](https://vercel.com/docs/fluid-compute)). The Live check's 2.5 seconds is well within this |
| Custom domain and HTTPS | Custom domain for the Supabase API is a paid add-on ($10/month on Pro). Amara's Pick does not need one, because the API connects with a connection string | Custom domains are included (50 per project). Free Let's Encrypt certificates are issued and renewed automatically ([SSL](https://vercel.com/docs/domains/working-with-ssl)) |
| Commercial use on free tier | No restriction found. The [terms](https://supabase.com/terms) apply to all plans and give no uptime guarantee | **Not allowed.** "Hobby teams are restricted to non-commercial personal use only." The forbidden list includes "Affiliate linking is the primary purpose of the site" and "The inclusion of advertisements" ([fair use](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)) |

### (b) Render + Neon + Cloudflare

| Topic | Render Free (Express API) | Neon Free (database) | Cloudflare Workers Free (Next.js site) |
|---|---|---|---|
| Price | $0 | $0 | $0 |
| Lowest paid tier | $7/month web service (512 MB RAM) ([pricing](https://render.com/pricing)) | Launch: pay as you go, no minimum. $0.106 per compute-hour, $0.35 per GB-month ([pricing](https://neon.com/pricing), [plans](https://neon.com/docs/introduction/plans)) | Workers Paid: from $5/month ([pricing](https://developers.cloudflare.com/workers/platform/pricing/)) |
| Size and usage limits | 750 instance hours a month, which is enough for one service running all month. 5 GB bandwidth on the free Hobby workspace. If either runs out with no card on file, all free services are suspended until the next month ([free](https://render.com/docs/free), [pricing](https://render.com/pricing)) | 1 GB storage and 100 compute-hours per project. Using up the compute-hours suspends the database "until the next billing period or until you upgrade". Going over 1 GB blocks writes ([free plan FAQ](https://neon.com/faqs/free-plan-limits-and-quotas)) | 100,000 requests a day, **10 ms of CPU per request**, 64 MiB Worker size, 128 MB memory ([limits](https://developers.cloudflare.com/workers/platform/limits/)) |
| Pausing when idle | "spins down a Free web service that goes 15 minutes without receiving any inbound traffic". Render "might restart a Free web service at any time" ([free](https://render.com/docs/free)) | Sleeps after 5 minutes idle, and on Free this "cannot be turned off" ([pricing](https://neon.com/pricing)) | Does not pause |
| Cold start on a Click-out | **About one minute** to wake ([free](https://render.com/docs/free)). The paid $7 service does not spin down | Waking "typically adds a few hundred milliseconds of latency" ([latency](https://neon.com/docs/guides/benchmarking-latency)) | Little or none. The Worker's start-up code must run within 1 second ([limits](https://developers.cloudflare.com/workers/platform/limits/)) |
| Function time limit | None: it is an ordinary long-running server | Not applicable | Free has no time limit on waiting, but has a 10 ms CPU limit per request. Paid allows 30 seconds of CPU by default, up to 5 minutes |
| Custom domain and HTTPS | Custom domains and managed TLS are supported. The Hobby workspace includes 2 domains ([free](https://render.com/docs/free), [pricing](https://render.com/pricing)) | Not applicable | Custom domains with automatic certificates. The domain must be a zone in your Cloudflare account ([custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)) |
| Commercial use on free tier | No commercial-use ban, but Render says of free instances: "Do not use them for production applications" ([free](https://render.com/docs/free)) | No restriction found. Free is described as for "Prototypes, side projects, and small teams" ([plans](https://neon.com/docs/introduction/plans)) | No restriction found on the pricing or limits pages |

### Monthly cost side by side

| | (a) Supabase + Vercel | (b) Render + Neon + Cloudflare |
|---|---|---|
| Everything on free tiers | $0, but this breaks Vercel's terms once Amara's Pick earns commission | $0, but this goes against Render's "not for production" advice and brings a one-minute cold start |
| Cheapest setup that is allowed and works | **$20**: Vercel Pro plus Supabase Free | **$12**: Render $7 plus Cloudflare Paid $5 plus Neon Free |
| With database backups and no free-tier ceilings | **$45**: Vercel Pro plus Supabase Pro | About **$12–32**: Neon Launch is at most about $20 if the database never sleeps (0.25 compute × 730 hours × $0.106, plus storage), and less if it sleeps |

## Limits that would actually bite

1. **Vercel Hobby forbids commercial use (stack a).** Amara's Pick's purpose is sending Shoppers to Retailers, and ADR 0005 and CONTEXT.md describe affiliate commission and sold Placements. Both match Vercel's examples of commercial use. Running the site and API on Hobby after launch would break Vercel's terms, so the real price of stack (a) is at least $20 a month.

2. **Render Free's one-minute cold start (stack b) would ruin Click-outs.** After 15 quiet minutes, the next Click-out waits about a minute for the API to wake. The Live check's 2.5-second timeout does not help, because it only starts once the API is running. The site's `clickOut()` in `web/lib/api.mjs` sets no timeout of its own, so the Shopper simply waits. At launch traffic, quiet gaps of 15 minutes will be common, especially overnight. The paid $7 instance removes this.

3. **Cloudflare Workers Free allows only 10 ms of CPU per request (stack b).** Both Amara's Pick pages are rendered on the server for every view. Rendering a grid of Product cards with React could go over 10 ms of CPU on some requests. This is my judgement, not something Cloudflare documents for Next.js, and it would need testing. Workers Paid ($5) raises the limit to 30 seconds. Cloudflare also now recommends its own **vinext** over the OpenNext adapter for new Next.js apps ([OpenNext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)). Either way, moving `web/` to Cloudflare is extra porting work with Next.js 16, which Vercel runs as is.

4. **Neon Free's compute-hour cap (stack b).** At the smallest size (0.25 compute), 100 compute-hours is 400 hours of the database being awake. Each wake keeps it on for at least 5 minutes. The nightly run (polite fetching at one request every 5 seconds per Retailer) is likely to keep it awake for an hour or more each night. If daytime searches keep it awake most of the day, the monthly allowance runs out partway through the month and the database stops until the next month. That would be an outage, not a slowdown. Neon Launch removes the cap for about $20 a month at most.

5. **Supabase Free pausing (stack a) hangs on the nightly Action.** The nightly Stock check keeps the project active. But GitHub automatically disables scheduled workflows in a public repository "when no repository activity has occurred in 60 days" ([GitHub docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). It also says the `schedule` event "can be delayed during periods of high loads". If commits stop for two months, the nightly job stops, and Supabase could pause a week later. Shopper traffic would usually keep the project awake anyway. Restoring it is a manual click in the dashboard.

6. **Supabase Free has no automatic backups.** Losing the catalogue is recoverable, because the nightly job rebuilds it. But Tico's Review list decisions, the Click-out history and approved Suggested Retailers exist only in the database. I did not check Neon Free's restore window; see [Neon plans](https://neon.com/docs/introduction/plans) before relying on it. Render's free Postgres is not part of either stack: it expires after 30 days.

7. **Database size does not bite on either stack** (see the estimate above: 100–150 MB against limits of 500 MB and 1 GB).

**A related issue in the code:** in `web/app/go/[productId]/page.jsx`, if the API call throws (for example the API is down), the result becomes `null` and the page shows Not Found. Rule R20 says that when the Live check fails, the Shopper should be sent to the Retailer as normal. That works inside the API, but not when the API itself is unreachable. This matters most with a host that sleeps or restarts.

## Recommendation (Claude's view)

> This section is my opinion, based on the facts above. It is not a provider's statement.

**Launch on stack (a) as built: Vercel Pro ($20/month) and Supabase Free. Move to Supabase Pro ($25/month) once Tico's Review list decisions and the Click-out history are worth protecting with backups.**

Why:

- **It is already built for this.** Spec 0001 decisions D11 and D12, `web/README.md` and both workflow files all target Supabase and Vercel. Next.js 16 runs on Vercel without changes. Stack (b) would mean porting `web/` to Cloudflare's adapter and moving the database a month before launch.
- **Stack (b) is only about $8 a month cheaper** once it is set up so that it actually works: $12 for Render $7 plus Cloudflare $5 plus Neon Free, against $20. And Neon Free's compute-hour cap is a real risk of the database stopping mid-month. Pay for Neon Launch to remove that risk and the two stacks cost about the same.
- **The one thing that forces spending on (a) is the commercial-use rule.** Vercel Pro is needed from the day Amara's Pick links out for commission. Upgrade before turning on affiliate links or Placements, not after.
- **Do not launch any stack on Render Free.** A one-minute wait on a Click-out undoes what the Live check is for.

Two small follow-ups apply to either stack:

- Give `clickOut()` in `web/lib/api.mjs` a timeout of a few seconds.
- When the API is unreachable, send the Shopper to the Retailer instead of showing Not Found (rule R20).

## Sources (all read 2026-10-18)

- Supabase pricing: https://supabase.com/pricing
- Supabase project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase terms: https://supabase.com/terms
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel fair use and commercial usage: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel pricing: https://vercel.com/pricing
- Vercel Fluid compute: https://vercel.com/docs/fluid-compute
- Vercel SSL: https://vercel.com/docs/domains/working-with-ssl
- Render free instances: https://render.com/docs/free
- Render pricing: https://render.com/pricing
- Neon pricing: https://neon.com/pricing
- Neon plans: https://neon.com/docs/introduction/plans
- Neon Free plan limits FAQ: https://neon.com/faqs/free-plan-limits-and-quotas
- Neon latency: https://neon.com/docs/guides/benchmarking-latency
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers custom domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Cloudflare OpenNext guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- GitHub schedule event: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
