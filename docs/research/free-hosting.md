# Free hosting that allows Amara's Pick

Research for issue #43. Question: which free tiers allow a commercial site with affiliate links, can run Amara's Pick, and keep the MVP at £0 until there is real traffic?

This builds on [launch-hosting.md](launch-hosting.md) (issue #28), which found that **Vercel Hobby bans commercial and affiliate sites**. I re-read that rule today and it is unchanged: "Hobby teams are restricted to non-commercial personal use only", and the examples include "Affiliate linking is the primary purpose of the site" ([Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage), page dated 2026-09-14). Facts already in that note (database size of 100–150 MB, Render's one-minute cold start, Neon's 100 compute-hours, Supabase pausing after a week, GitHub disabling schedules after 60 days without repository activity) are not repeated here.

Every source was read on **2026-10-19**. Prices are in US dollars as published. Free tiers change often, so re-check the linked page before relying on it.

## What Amara's Pick asks of a host

From the code on `main` today:

- **Express API** (`app.js`): 15 routes, plus `/admin`, which serves `public/admin.html` from disk. `db/connection.js` opens a `pg` `Pool` and reads `.env.<NODE_ENV>` with dotenv.
- **Click-out Live check** (`models/click-outs.models.js`). The Shopper waits while it runs, and it gives up after 2.5 seconds. For Shopify Retailers it fetches a small `/products/<handle>.js` JSON file (`lib/collect/shopify.js`). For structured-data Retailers it **downloads and parses the whole product page HTML** (`liveCheckStructuredData` in `lib/collect/structured-data.js`). Parsing the page uses CPU. Waiting for it to download does not.
- **Next.js 16.3 site** (`web/`). Both pages are `force-dynamic`, so every view is rendered on the server and calls the API over HTTP (`web/lib/api.mjs`).
- **Postgres**, 100–150 MB at launch.
- **GitHub Actions**: nightly Stock check plus AI tagging (`stock-check.yml`, 300-minute timeout) and weekly discovery (`discovery.yml`, 60-minute timeout). They connect straight to the database with `DATABASE_URL`, so they do not depend on where the site is hosted.

A cost outside hosting: the AI tagging step calls the Anthropic API, which is paid. The workflow skips it when `ANTHROPIC_API_KEY` is unset, and it has to stay unset for a true £0.

## GitHub Actions: are the scheduled workflows free?

- **Public repository: yes, with no minute cap.** "GitHub Actions usage is free for self-hosted runners and for public repositories that use standard GitHub-hosted runners" ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)). The repository was public when #28 checked it on 2026-10-18. I did not re-check, because this task ruled out git and GitHub tools.
- **Private repository: 2,000 minutes a month on GitHub Free.** "If your account does not have a valid payment method on file, usage is blocked once you use up your quota." With a card on file, usage over the quota "is billed to your account" (same page). So with no card on file the jobs stop rather than cost money. The Stock check is allowed up to 300 minutes a night. If it actually ran for about 60 minutes a night, the nightly job alone would use about 1,800 minutes a month, plus up to 4 × 60 for discovery and whatever CI uses. **If the repository went private, the minutes would probably run out partway through the month.** Keep it public, or time a real nightly run before going private.

## Each candidate

"Allowed?" asks whether the terms permit a commercial site that makes money from affiliate links. Where a provider says nothing, I say so. Silence is not the same as permission, but none of these providers has a rule like Vercel's.

### Cloudflare Workers (and Pages) Free

- **Allowed?** Yes. I found no clause restricting commercial use. The self-serve [terms](https://www.cloudflare.com/terms/) say of free services only that "We may offer free or trial versions of the Services" and that Cloudflare has "no liability" for them. The free-plan restrictions that are relevant here: you may not "process or collect personal or business credit card information on any web property that is receiving Free Services" (Amara's Pick takes no payments), and you may not "use the Services to provide a virtual private network or other similar proxy services". Nothing mentions affiliate links or advertising.
- **Limits** ([limits](https://developers.cloudflare.com/workers/platform/limits/), [pricing](https://developers.cloudflare.com/workers/platform/pricing/)):
  - 100,000 requests a day, resetting at midnight UTC.
  - **10 ms of CPU per request.** "Waiting on network requests (such as `fetch()` calls, KV reads, or database queries) does **not** count toward CPU time."
  - 128 MB memory, 50 subrequests, 6 connections open at once, 1 second to start up, 5 Cron Triggers per account.
  - Worker size is 64 MiB uncompressed on both plans: "There is no compressed size limit." The OpenNext site still says 3 MiB compressed on Free ([opennext.js.org/cloudflare](https://opennext.js.org/cloudflare)). Cloudflare's own page is the authority, but test a real deploy.
  - Requests for static assets "are free and unlimited" ([static assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)).
  - Workers do not sleep, so there is no cold-start pause.
  - Hyperdrive (Cloudflare's connection pool for Postgres) is "included in both the Free and Paid Workers plans", with 100,000 database queries a day ([Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/)).
  - Pages has 500 builds a month, and "Requests to Pages functions count towards your quota for Workers plans" ([Pages limits](https://developers.cloudflare.com/pages/platform/limits/)). Use Workers, not Pages.
  - The pages I read do not say whether a card is needed. By default you get the Free plan.
- **When a quota runs out: it fails, it does not bill.** After the daily request limit, "Cloudflare returns **Error 1027**". Requests over the free limits "can return a 429". For Hyperdrive, "further operations of that type will fail with an error". The pricing pages describe no overage billing for the Free plan.
- **What would bite:**
  - **The 10 ms CPU limit.** Rendering a grid of Product cards with React on the server, plus building the `pg` result objects, has to fit in 10 ms. This is not documented either way and needs a test. The structured-data Live check, which parses a whole product page of HTML with regular expressions, is the most likely part to go over. When a request goes over, it fails, and so far that would show the Shopper Not Found (see the caveat in launch-hosting.md).
  - **Next.js support.** OpenNext supports "All minor and patch versions of Next.js 16". Cloudflare now says "Cloudflare recommends vinext instead of OpenNext for new Next.js applications" ([OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)).
- **Code changes:**
  - `web/`: add the OpenNext adapter and a `wrangler.jsonc` file. Set `AMARAS_PICK_API_URL` to the API Worker.
  - The API can stay on Express. Cloudflare documents running Express on Workers with the `nodejs_compat` flag and `export default httpServerHandler({ port: 3000 })` from `cloudflare:node` ([Express on Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/)). It cannot read `.env` files or `public/` from disk, so:
    - Rewrite `db/connection.js` to create a `pg` `Client` per request from `env.HYPERDRIVE.connectionString`. Cloudflare's [node-postgres guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) says "Create a new client instance for each request", requires `pg` newer than 8.16.3, and requires `nodejs_compat`.
    - Serve `admin.html` as a static asset.
  - The other way is to move the 15 routes into Next.js route handlers, which makes a single Worker. Then each page view costs a second Worker request unless the pages call the models directly.

### Netlify Free

- **Allowed?** Yes, as far as I found. The [Self-Serve Subscription Agreement](https://www.netlify.com/pdf/self-serve-subscription-agreement.pdf) and the [Acceptable Use Policy](https://www.netlify.com/legal/acceptable-use-policy/) do not ban commercial sites or affiliate links. The AUP's "commercially exploit the Netlify Services" is about reselling Netlify itself, which is my reading. The AUP's ban on scrapers covers "the Netlify website", not sites hosted on Netlify. The free tier is at Netlify's discretion: "Netlify may shut down Free Usage Tier website projects without notice for any reason or no reason" (agreement section 6.1).
- **Limits:** 300 credits a month, as a hard cap ([pricing](https://www.netlify.com/pricing/), [how credits work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)):
  - "each successful production deploy consumes 15 credits". Deploy Previews are free.
  - "Compute consumes 10 credits per GB-hour". This is run time × memory, and functions get 1,024 MB by default, so waiting on the Retailer during a Live check counts.
  - 2 credits per 10,000 web requests. 20 credits per GB of bandwidth.
  - Functions time out after 60 seconds ([functions configuration](https://docs.netlify.com/build/functions/configuration/)).
  - Next.js has "Full Support" for route handlers, and the adapter covers "all Next.js versions starting from version 13.5" ([Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)).
- **When a quota runs out: everything is paused, nothing is billed.** "The free plan is always free, with hard monthly limits that cannot be exceeded or incur any costs." When the credits run out, "all projects owned by the team pause". Visitors see "Site not available" until the next billing cycle. "The free plan does not allow you to purchase more credits" ([resume paused projects](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/)).
- **What would bite:** the credit maths, which is my estimate:
  - 10 production deploys = 150 credits, half the month's budget. Turn off automatic deploys on every push to `main`.
  - A Click-out that waits 1 second on the Retailer uses about 0.00028 GB-hours. 1,000 Click-outs a day ≈ 8 GB-hours ≈ **85 credits a month**.
  - Server-rendered page views add about the same again at a few thousand views a day.
  - **Netlify Free works at a trickle of traffic and switches the whole site off once traffic is real.** That is the opposite of failing gracefully.
- **Code changes:** move the Express routes into Next.js route handlers, or wrap Express in a single function. Both run as Netlify Functions. `db/connection.js` works almost unchanged, but keep the pool small (it already uses `max: 2`).

### Supabase Free (database, and Edge Functions as the API)

- **Allowed?** Yes, as far as I found. The [terms](https://supabase.com/terms) apply to all plans. They limit use to "Customer's internal business purposes", which is standard wording that rules out reselling Supabase, not running a public app on it. That is my reading. Nothing mentions affiliate links or advertising.
- **Limits** ([pricing](https://supabase.com/pricing), [Edge Function limits](https://supabase.com/docs/guides/functions/limits)):
  - 500 MB database and 5 GB egress.
  - **500,000 Edge Function invocations a month**, counted "regardless of the response status code".
  - Each Edge Function request gets **2 seconds of CPU**. "Async I/O doesn't count."
  - 150 seconds of wall-clock time on Free, 256 MB memory, and a 5 MB limit when bundled on the server (20 MB when bundled with the CLI).
  - Outbound ports 25 and 587 are blocked, and nothing else. Edge Functions may connect "directly to your database using any popular Postgres client", for example `npm:postgres` ([connect to Postgres](https://supabase.com/docs/guides/functions/connect-to-postgres)).
  - Pausing after a week without activity is covered in #28. A paused project can be restored "for up to 1 year" ([pausing](https://supabase.com/docs/guides/platform/free-project-pausing)).
- **When a quota runs out: restricted, not billed.** "You will be notified when you exceed the Free Plan quota … If you continue to exceed the limits, service restrictions will apply." Those restrictions can include pausing projects, read-only mode, and 402 errors on API requests. A grace period comes first, but only once ([billing FAQ](https://supabase.com/docs/guides/platform/billing-faq), [Edge Function invocations](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations)).
- **What would bite:**
  - **500,000 invocations is the tightest number.** If every page view and every Click-out is one invocation, about 15,000 a day in total runs out mid-month.
  - **The 2 seconds of CPU is generous.** It fits the HTML-parsing Live check easily, unlike Workers' 10 ms.
- **Code changes:** Edge Functions run on Deno, not Node, so Express does not run as is. Rewrite `app.js` as one function with a small router, such as Hono, and swap `pg` for `npm:postgres` or `npm:pg`. Rewrite `db/connection.js` too. The controllers and models carry over largely as they are.

### Neon Free (database only)

- **Allowed?** No restriction found. The [terms of service](https://neon.com/terms-of-service) say nothing about free-plan or commercial use. The [plans page](https://neon.com/docs/introduction/plans) calls Free "for Prototypes, side projects, and small teams".
- **Limits:** 1 GB storage per project and 100 CU-hours a month. The database sleeps after 5 minutes idle ("cannot disable"). Point-in-time restore keeps 6 hours of history (plans page).
- **When a quota runs out: suspended, not billed.** "compute is suspended until the next billing period or until you upgrade". Over the storage cap, writes fail. "None of these limits delete your data."
- **What would bite:** the CU-hour cap, covered in #28. It works as a drop-in replacement for Supabase's database (same `pg` driver, a new `DATABASE_URL`), but it does not fix anything that Supabase Free gets wrong for Amara's Pick.

### Fly.io

- **There is no free tier for new accounts.** "No. New organizations don't have a free tier or a monthly free usage allowance." The trial "lasts for up to 2 hours of Machine runtime or 7 days, whichever comes first", and after that a card is required ([pricing](https://docs.fly.io/about/pricing)). Ruled out.

### Koyeb

- **Allowed?** The [pricing FAQ](https://www.koyeb.com/docs/faqs/pricing) says nothing about commercial use, and I did not read the Master Service Agreement.
- **Limits:** "Each organization is limited to one Free Instance". It has 512 MB RAM and 0.1 vCPU, runs in Frankfurt or Washington only, and scales "down to zero when they don't receive any traffic for 1 hour" ([instances](https://www.koyeb.com/docs/reference/instances)). Waking costs "1-5 seconds" in the default Deep Sleep, and this cannot be disabled on the free instance ([scale-to-zero](https://www.koyeb.com/docs/run-and-scale/scale-to-zero)). There is also one free Postgres with "5 hours of active time and 1GB of storage".
- **Card required:** yes. "We require a credit card to prevent fraud and abuse", verified with a $29 pre-authorisation hold. Signing up "triggers a prorated charge for the selected plan, which defaults to Pro" (FAQ). The [pricing page](https://www.koyeb.com/pricing) today lists Pro at $29/month as the lowest plan and no $0 plan. The two pages disagree, so a £0 sign-up is not certain.
- **When a quota runs out:** "You will never be charged when using the `free` web Service", but anything beyond it is billed.
- **Code changes:** none for Express, since it is a normal container. Verdict: plausible for the API, but it needs a card, it is unclear whether sign-up costs anything, and an overnight Click-out could wait up to 5 seconds. Not recommended.

### Deno Deploy

- **Allowed?** Commercial sites are explicitly acceptable: "An e-commerce site" and "A company website" are listed as acceptable uses. But **"Scrapers" are listed as not acceptable** ([acceptable use](https://docs.deno.com/deploy/acceptable_use_policy/)). A Live check per Click-out is not bulk scraping, but it is fetching another site's pages, so this is a grey area. The [terms](https://docs.deno.com/deploy/terms_and_conditions/) also let Deno "restrict, suspend, or terminate" access "at any time and for any reason".
- **Limits:** 1M requests a month, 10 hours of active CPU a month and 20 GiB egress. Free is described as "For personal use and smaller projects" ([pricing](https://deno.com/deploy/pricing)). "Organizations get restricted Free plan limits until they verify by linking a credit card" ([changelog](https://docs.deno.com/deploy/changelog/)).
- **When a quota runs out: paused.** "Free organizations that exceed their limits have their applications paused until the next billing cycle" (changelog).
- **Code changes:** Next.js builds on Deno Deploy, and Express can run under Deno's Node compatibility. I did not verify Next.js 16 specifically. Not recommended, because of the scraper clause and the card needed for full limits.

### Firebase / Google Cloud Run

- **Allowed?** I found no restriction on commercial use.
- **Firebase Spark (the no-card plan) cannot run Amara's Pick.** Cloud Functions, App Hosting (Next.js on the server) and outbound networking are all "Not applicable" on Spark ([Firebase pricing](https://firebase.google.com/pricing)).
- **Cloud Run free tier:**
  - 2 million requests, 180,000 vCPU-seconds and 360,000 GiB-seconds a month ([Cloud Run pricing](https://cloud.google.com/run/pricing)). That would comfortably run both the API and the site.
  - **London (europe-west2) is a Tier 2 region.** "The free tier is applied as a spending based discount using Tier 1 pricing", so use europe-west1 (Belgium).
  - There is no free Cloud SQL, only a 30-day trial, so the database would be Supabase or Neon.
  - Instances scale to zero, so the first request after a quiet spell waits for a cold start. A kept-warm minimum instance is billed.
- **Card required, and overage is billed, not capped.** "A Google Cloud billing account is required to access the Google Cloud Free Tier". Usage past the free tier is billed at standard rates ([free features](https://docs.cloud.google.com/free/docs/free-cloud-features)). An ordinary budget "doesn't automatically cap … usage or spending" ([budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets)). Google now has spend-cap budgets "if supported for your service", but I could not confirm that Cloud Run is supported.
- **Code changes:** small. Add a Dockerfile for the API and one for `web/` (`next start`). Verdict: it is allowed and it works, but **£0 is not guaranteed**, because a traffic spike or a misconfiguration bills the card.

### Render Free

- Covered in #28: one-minute cold start, free Postgres expires after 30 days, and "Do not use them for production applications" ([free](https://render.com/docs/free)). New today:
  - Render may suspend free services for "unusually high service-initiated traffic". The nightly job does not run there, but Live checks do.
  - Running out of bandwidth with no card on file "suspends all of your Free services for the remainder of the month". The free allowance is 5 GB bandwidth and 500 build minutes ([pricing](https://render.com/pricing)).
- Ruled out for the Click-out path.

### Oracle Cloud Always Free

- **Allowed?** The [FAQ](https://www.oracle.com/cloud/free/faq/) and the [free tier page](https://www.oracle.com/cloud/free/) say nothing about commercial use. The free tier page only says that "to production scenarios, you may need to use resources outside of Always Free limits". I did not read the full Oracle Cloud Services Agreement.
- **Limits** ([Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)):
  - Arm VMs with "2 OCPUs and 12 GB of memory" in total, plus 2 AMD micro VMs (1/8 OCPU, 1 GB each).
  - "200 GB of Block Volume storage" and "10 TB per month of outbound data".
  - Instances "must" be in your home region. The UK has a London region. "out of host capacity" errors for free shapes are a known, documented possibility.
  - **There is no managed Postgres.** The free databases are Oracle Autonomous Database and MySQL HeatWave, so Postgres would run on the VM itself.
- **Card required:** yes. Prepaid and virtual cards are refused.
- **When a quota runs out:** "You will only be charged for services that you use that exceeds Always Free", and Always Free resources cannot be upgraded to paid ones on a free account. Two risks:
  - **Idle reclamation.** Oracle may reclaim an instance if, over 7 days, the 95th-percentile CPU, network and (on Arm) memory are all "less than 20%". A quiet launch-stage Amara's Pick would meet that test.
  - "Accounts left idle for 30 days or more may be deemed abandoned."
- **Code changes:** none. Express, `next start` and Postgres 16 run on one VM, as they do in CI. In exchange, Amara's Pick takes on everything a managed host does for you: OS patching, TLS (or put Cloudflare's free proxy in front), backups, restarts and monitoring.

## Summary table

| Host | Commercial and affiliate use | Card needed | Would bite | When the quota runs out | Code changes |
|---|---|---|---|---|---|
| Vercel Hobby | **Banned** | No | n/a | Feature paused for 30 days | n/a |
| Cloudflare Workers Free | No restriction found | Not stated | **10 ms CPU per request**; 100k requests a day | Fails (Error 1027 or 429); no bill | OpenNext for `web/`; Express via `httpServerHandler`; `pg` client per request over Hyperdrive |
| Netlify Free | No restriction found | Not stated | 300 credits; 15 per deploy; compute counts waiting time | **Every project paused** until next month; no bill | Express into route handlers or one function |
| Supabase Free | No restriction found | Not stated | 500k Edge invocations; pauses after a week idle | Restricted (read-only, 402, paused); no bill | API rewritten for Deno (Hono + `npm:postgres`) |
| Neon Free | No restriction found | Not stated | 100 CU-hours | Database suspended; no bill | `DATABASE_URL` only |
| Fly.io | n/a | Yes | No free tier | n/a | n/a |
| Koyeb | Not addressed | Yes ($29 hold) | Sleeps after 1 hour; 0.1 vCPU; pricing pages disagree | Free instance never billed; extras billed | None |
| Deno Deploy | Commercial sites OK; **"Scrapers" not acceptable** | For full limits | Scraper clause | Apps paused | Some |
| Google Cloud Run | No restriction found | Yes | Cold starts; London not Tier 1 | **Billed** | Dockerfiles |
| Render Free | Allowed, but "not for production" | No | One-minute cold start | All free services suspended | None |
| Oracle Always Free | Not addressed | Yes | Idle reclamation; you run the server | Always Free not billed | None, but you administer it |

## Workable £0 stacks, ranked

### 1. Cloudflare Workers Free (site and API) + Supabase Free (Postgres) + GitHub Actions (public repository)

- No card needed (as far as the pages say), allowed for affiliate use, never sleeps, and fails rather than bills when a limit is hit.
- Supabase stays the database, so the workflows and `DATABASE_URL` do not change. Hyperdrive pools connections to the Supabase session pooler.
- Work needed:
  - Port `web/` with OpenNext (or vinext).
  - Wrap the Express app in `httpServerHandler`.
  - Rewrite `db/connection.js` for Hyperdrive, and serve `admin.html` as a static asset.
- **Main risk:** the 10 ms CPU limit. Test it before committing: deploy, then load the search page with 60 Product cards and make Click-outs to a structured-data Retailer.
- **Fallback if the Live check goes over:** move only `POST /api/click-outs` to a Supabase Edge Function (2 seconds of CPU, 500k invocations a month). Click-outs are far fewer than page views, so the invocation cap is not a concern.

### 2. Netlify Free (site and API) + Supabase Free + GitHub Actions

- The least porting: Next.js 16 runs on Netlify's adapter, and the Express routes become route handlers. It is allowed, there is no card, and it never bills.
- **It only suits a trickle of traffic.** The 300 credits run out at roughly a few thousand page views and Click-outs a day, or sooner with frequent deploys. Then *the whole site* goes dark until next month, unless Amara's Pick upgrades.
- Turn off automatic production deploys.

### 3. Oracle Cloud Always Free (one Arm VM running everything) + Cloudflare free DNS and proxy + GitHub Actions

- No code changes and no CPU or request quotas: Express, `next start` and Postgres sit on one VM in London.
- **Downsides:**
  - A card is needed for sign-up.
  - Arm capacity is not guaranteed.
  - Amara's Pick becomes the sysadmin: patches, backups and uptime.
  - Oracle's idle-reclamation rule threatens exactly a low-traffic launch.
- Choose this only if someone on the team is comfortable running a Linux server.

Not ranked:

- **Google Cloud Run** works technically, but its overage is billed to a card, so it breaks the strict £0 rule.
- **Koyeb, Deno Deploy, Render Free and Fly.io** each fail on a card requirement, a terms clause, cold starts or a missing free tier.

## Recommendation (Claude's view)

> This section is my opinion, based on the facts above. It is not a provider's statement.

**Go with stack 1: Cloudflare Workers Free + Supabase Free, and spend half a day on a spike before committing.**

- It is the only option that is free, allowed for affiliate links, needs no card, does not sleep, and has request headroom (100,000 a day) well beyond launch traffic. When it breaks, it breaks per request, not by switching the whole site off for a month the way Netlify does.
- The spike should answer a single question: does a server-rendered search page and a Live check stay under 10 ms of CPU? If the page is fine but the structured-data Live check is not, move the Click-out to a Supabase Edge Function rather than abandoning the stack.
- When real traffic arrives, the upgrade path is cheap and smooth: Workers Paid at $5 a month lifts the CPU limit to 30 seconds with no code changes. That is cheaper than Vercel Pro at $20.
- Keep the repository public, so the nightly and weekly jobs stay free. Leave `ANTHROPIC_API_KEY` unset until there is a budget.
- Fix the two follow-ups from #28 first, because they matter more on a host that fails per request: give `clickOut()` a timeout, and send the Shopper to the Retailer instead of Not Found when the API errors (rule R20).

## Sources (all read 2026-10-19)

- Vercel fair use: https://vercel.com/docs/limits/fair-use-guidelines
- Cloudflare terms: https://www.cloudflare.com/terms/
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare static assets billing: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Hyperdrive pricing: https://developers.cloudflare.com/hyperdrive/platform/pricing/
- Cloudflare Hyperdrive with node-postgres: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/
- Cloudflare Express on Workers: https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/
- Cloudflare OpenNext guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- OpenNext for Cloudflare: https://opennext.js.org/cloudflare
- Netlify pricing: https://www.netlify.com/pricing/
- Netlify how credits work: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
- Netlify paused projects: https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/
- Netlify functions configuration: https://docs.netlify.com/build/functions/configuration/
- Netlify Next.js: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Netlify terms of use: https://www.netlify.com/legal/terms-of-use/
- Netlify Self-Serve Subscription Agreement: https://www.netlify.com/pdf/self-serve-subscription-agreement.pdf
- Netlify Acceptable Use Policy: https://www.netlify.com/legal/acceptable-use-policy/
- Supabase pricing: https://supabase.com/pricing
- Supabase terms: https://supabase.com/terms
- Supabase billing FAQ: https://supabase.com/docs/guides/platform/billing-faq
- Supabase Edge Function limits: https://supabase.com/docs/guides/functions/limits
- Supabase Edge Function invocations: https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations
- Supabase Edge Functions to Postgres: https://supabase.com/docs/guides/functions/connect-to-postgres
- Supabase project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Neon plans: https://neon.com/docs/introduction/plans
- Neon terms of service: https://neon.com/terms-of-service
- Fly.io pricing: https://docs.fly.io/about/pricing
- Koyeb pricing: https://www.koyeb.com/pricing
- Koyeb pricing FAQ: https://www.koyeb.com/docs/faqs/pricing
- Koyeb instances: https://www.koyeb.com/docs/reference/instances
- Koyeb scale-to-zero: https://www.koyeb.com/docs/run-and-scale/scale-to-zero
- Deno Deploy pricing: https://deno.com/deploy/pricing
- Deno Deploy terms: https://docs.deno.com/deploy/terms_and_conditions/
- Deno Deploy acceptable use: https://docs.deno.com/deploy/acceptable_use_policy/
- Deno Deploy changelog: https://docs.deno.com/deploy/changelog/
- Firebase pricing: https://firebase.google.com/pricing
- Google Cloud free features: https://docs.cloud.google.com/free/docs/free-cloud-features
- Cloud Run pricing: https://cloud.google.com/run/pricing
- Google Cloud budgets: https://docs.cloud.google.com/billing/docs/how-to/budgets
- Render free: https://render.com/docs/free
- Render pricing: https://render.com/pricing
- Oracle Cloud Free Tier: https://www.oracle.com/cloud/free/
- Oracle Free Tier FAQ: https://www.oracle.com/cloud/free/faq/
- Oracle Always Free resources: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
