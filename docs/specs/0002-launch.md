# 0002: Launch

Agreed with Tico between 18 and 19 Oct 2026, one decision at a time, on the launch map ([#27](https://github.com/Tico26/Yxra/issues/27)). Each decision links to the ticket that holds the reasoning. Research is in [`docs/research/`](../research/).

## Goal

From Mon 16 Nov 2026, any Shopper can use Yxra on the public internet. She opens a home page that looks like a normal online shop, picks her UK size once, and finds plus-size clothes, swimwear and activewear in stock in that size from at least 8 Retailers. When she chooses one, Yxra checks it again and sends her to the Retailer, or tells her it sold out. She can see how accurate Yxra was last week, report a wrong Product, and read plainly how Yxra is paid and what it stores. From Thu 12 Nov the same site is open, unannounced, to the waiting list.

Running Yxra costs £0 a month until there is real traffic (Tico, 19 Oct). Only legally required costs are paid.

## Out of scope

- Placements, Standouts, Back-in-stock alerts, content per Region, Shopper accounts, the marketing campaign (Tico, 18 Oct). The home page keeps space for Standouts and the shop spotlight, which a Placement can later take.
- The big Retailers that block collection (Yours, Ulla Popken, ASOS, Simply Be, JD Williams, River Island). They join by affiliate feed once they approve Yxra, after launch.
- Any paid plan or paid API.
- A lawyer's review of the legal pages (after traffic).

## Terms

Uses: Shopper, Retailer, Product, UK size, Plus size, Stock check, Live check, Click-out, Review list, Suggested Retailer, Placement, Standout.
Adds: **Wrong-Product report** and **Accuracy number** (see [CONTEXT.md](../../CONTEXT.md)).

## Decisions

| # | Question | Decision | Why |
|---|---|---|---|
| D1 | Launch date and scope | Public launch Mon 16 Nov; soft open Thu 12 Nov ([#27](https://github.com/Tico26/Yxra/issues/27)) | Four days of real Shoppers before the public launch |
| D2 | Where it runs | Site and API on Cloudflare Workers Free; database on Supabase Free; nightly jobs on GitHub Actions. If a Click-out goes over Workers' 10 ms CPU limit, only Click-outs move to a Supabase Edge Function ([#29](https://github.com/Tico26/Yxra/issues/29), [research](../research/free-hosting.md)) | £0, and allows affiliate sites; Vercel's free plan does not |
| D3 | Domain | Not chosen yet; a placeholder until Tico decides ([#30](https://github.com/Tico26/Yxra/issues/30)) | The name may change |
| D4 | Which Retailers at launch | Lovedrobe plus Shopify Retailers found by discovery and approved by Tico; big Retailers join by feed after approval ([#42](https://github.com/Tico26/Yxra/issues/42), [research](../research/collectable-retailers.md)) | The big Retailers block or time out Yxra's polite collector |
| D5 | Smallest catalogue to open with | 1,000 in-stock Products, 8 or more Retailers, 48 or more in-stock Products per category in each UK size 18 to 28, no Retailer above 40% of in-stock Products; otherwise the soft open continues ([#32](https://github.com/Tico26/Yxra/issues/32)) | It must look like a normal online shop |
| D6 | Finding new Retailers | Tavily's free plan is discovery's web search, replacing the paid Claude finder; never used to fetch Retailer pages, Stock checks or Live checks ([#46](https://github.com/Tico26/Yxra/issues/46), [research](../research/tavily.md)) | £0, and it respects Retailers that block Yxra |
| D7 | AI tagging | A nightly Claude Code routine on Tico's Claude plan tags what the rules cannot settle (export, tag, import); same 0.9 confidence bar; not the paid API ([#45](https://github.com/Tico26/Yxra/issues/45)) | £0; replaces spec 0001 D9 for launch |
| D8 | Click-out links | Plain Retailer links at launch; each Retailer switches to its commission link when it approves Yxra ([#34](https://github.com/Tico26/Yxra/issues/34), [research](../research/affiliate-approvals.md)) | Networks need a live site first |
| D9 | Accuracy number | In stock = share of the week's Click-outs whose Live check found her UK size; right size = Tico's weekly spot-check of 20 random Products; updated weekly; a home page line links to a page explaining it; a Retailer below target that week is hidden ([#37](https://github.com/Tico26/Yxra/issues/37)) | Shows the 95% / 98% promise honestly |
| D10 | Wrong-Product reports | "Something wrong?" on every card, and "Was it right?" when she returns after a Click-out; every report goes to the Review list; two from different Shoppers within 24 hours hide the Product ([#38](https://github.com/Tico26/Yxra/issues/38)) | Fast correction without an account |
| D11 | Legal pages | Claude drafts from the research, Tico approves, lawyer later; Tico does the ICO self-assessment and pays the fee only if it says so ([#36](https://github.com/Tico26/Yxra/issues/36), [research](../research/launch-law.md)) | Covers what UK law asks at launch |
| D12 | Counting and alerts | Cloudflare Web Analytics for visits (no cookies); searches, Click-outs and reports counted in Yxra's own database; GitHub emails Tico when a scheduled job fails; an hourly check of the home page, API and one Click-out ([#39](https://github.com/Tico26/Yxra/issues/39)) | £0, no consent banner |
| D13 | Look | The size-first home page with ideas from the earlier frontend (shop-name row, Standouts block, shop spotlight, grid with shop badges, waiting list), in its black and white look with GFS Didot and Outfit; the green stock tick and amber Sponsored label stay ([#40](https://github.com/Tico26/Yxra/issues/40), prototype [`web/prototype/brand-look-ideas.html`](../../web/prototype/brand-look-ideas.html), variant 2) | Tico's pick; the two colours keep their meaning |
| D14 | Waiting list and soft open | Emails with opt-in kept in the database; on 12 Nov the site is live but unannounced and the list gets one email with the link, sent through Brevo's free plan; the list is deleted after that email ([#41](https://github.com/Tico26/Yxra/issues/41)) | £0 and nothing extra to build |

## Rules

### Catalogue

1. Search shows only Products from Retailers that are approved and not hidden by the Accuracy number.
2. A Retailer found by discovery appears in search only after Tico approves it.
3. Discovery's web search never fetches a Retailer's pages for Product data; Products always come from Yxra's own collector or an affiliate feed.
4. When the catalogue floor is not met (D5), the public launch does not happen and the soft open continues.

### Home page and look

5. The home page shows, in order: the shop-name row, the size picker with search, the Accuracy number line, the "New in" block in the Standouts layout, the shop spotlight, the "New in" grid, the waiting list (until 16 Nov), and the footer.
6. The shop-name row shows Retailer names as text, never logos.
7. The shop spotlight moves only when she presses an arrow or a dot; it never moves by itself.
8. Her UK size, once picked, is remembered on her device and preselected on every page.
9. Every Product card shows the Retailer's name, price, and "In stock in [her size]" in green.
10. Green is used only for in-stock ticks and the Accuracy number.

### Click-out

11. ~~When she chooses a Product, a Live check runs before she leaves Yxra.~~ Removed by Tico on 21 Oct 2026 ([ADR 0006](../adr/0006-no-live-check-at-click-out.md)): she is sent straight to the Retailer, and stock is as of the nightly Stock check shown on each card.
12. ~~Sold-out-at-click handling.~~ Removed with rule 11.
13. ~~Live check timeout.~~ Removed with rule 11.
14. When the Yxra API cannot be reached at all, the site still sends her to the Retailer's link.
15. A Retailer with an approved commission link gets that link; every other Retailer gets its plain link.
16. Every commission link carries an "Ad" label next to it.

### Accuracy number

17. Each Monday the in-stock figure is the share of last week's Click-outs whose Live check found her size in stock; Click-outs whose check failed are left out.
18. Each Monday the right-size figure is the share of Tico's 20 spot-checked Products whose UK sizes matched the Retailer's page.
19. The home page shows last week's real figures with the week's dates, whatever they are.
20. A Retailer with at least 20 Click-outs that week and an in-stock figure under 95%, or a spot-check right-size figure under 98%, is hidden from search until a later week is back on target.
21. A hidden Retailer keeps its nightly Stock check and stays in the spot-check pool.

### Wrong-Product reports

22. Every Product card has a "Something wrong?" link with the reasons: sold out, wrong size, not plus size, link broken, something else.
23. Every report puts the Product on the Review list.
24. Two reports from different devices within 24 hours hide the Product until Tico clears it or the next Stock check confirms it.
25. "Was it right?" is asked once per Click-out, only when she returns within 24 hours, and can be dismissed.

### Privacy and legal

26. Every page's footer links to Privacy, Cookies and storage, How Yxra makes money, For Retailers, and Contact.
27. Yxra stores on her device only her UK size and a random report ID, each with an off switch on the Cookies and storage page.
28. No consent banner is shown, because nothing stored goes beyond the storage exceptions.
29. A search is counted with its words, filters and result count only; nothing that identifies her.

### Waiting list and soft open

30. Joining the waiting list needs an email and a ticked opt-in; the opt-in's wording and time are saved with the email.
31. The opening email goes once, on 12 Nov, with an unsubscribe link; unsubscribing deletes the email.
32. After the opening email is sent, the waiting list is deleted.
33. The waiting-list box disappears from the home page on 16 Nov.

### Running costs and alerts

34. Nothing in the launch build needs a paid plan or a paid API key.
35. When the nightly Stock check, weekly discovery, nightly tagging or the hourly check fails, Tico gets an email.
36. When the AI tagging routine misses a night, untagged Products stay hidden; no guessed tag is shown.

## Build steps

Each step ends in something that runs. Steps 1 to 3 come first because everything else is deployed on them.

1. **Hosting test.** Deploy the existing API and site to a Cloudflare Workers preview with the Supabase Free database. Measure CPU time on the home page, a search and a Click-out. If a Click-out goes over 10 ms, move Click-outs to a Supabase Edge Function. Ends with: the preview site serves a search and a Click-out.
2. **Click-out fallback.** Add the 3-second Live check timeout and the "API unreachable, send her anyway" path (rules 13 and 14). Ends with: tests for both paths pass.
3. **Hourly check and alerts.** A scheduled GitHub Action that loads the home page, the API and one Click-out, and fails when any is down. Ends with: a deliberate failure emails Tico.
4. **Tavily finder.** Replace `lib/claude-finder.js` behind the existing `finder.find({ knownSites })` seam; remove the Anthropic key from discovery. Ends with: weekly discovery runs on GitHub Actions and adds Suggested Retailers.
5. **Tagging routine.** `scripts/ai-tagging.js --export` and `--import`, and a scheduled Claude Code routine that runs them after the Stock check. Ends with: one night's untagged Products tagged or sent to the Review list.
6. **Catalogue floor count.** A script that prints in-stock counts per Retailer, category and UK size, and says pass or fail against D5. Ends with: the script runs on live data.
7. **Black and white restyle and new home page.** Swap `web/app/globals.css` and the fonts (self-hosted GFS Didot and Outfit) for the D13 look, and build the home page blocks from rule 5. Ends with: the home page matches the prototype with real Products.
8. **Accuracy number.** The weekly job, the spot-check entry for Tico on the admin page, the home page line and its page, and hiding by rule 20. Ends with: a test week computes and shows both figures.
9. **Wrong-Product reports.** The card link, "Was it right?", the Review list entry and hiding by rule 24. Ends with: two test reports hide a Product.
10. **Search counts.** Record each search (rule 29). Ends with: searches appear in the database.
11. **Legal pages.** Draft the five pages, plus the Cookies and storage off switches. Ends with: Tico approves them.
12. **Waiting list.** The box, the opt-in, the database table, and the Brevo send with unsubscribe. Ends with: a test email reaches Tico and unsubscribing deletes it.
13. **Launch-day check.** A checklist script run on 11 Nov and again on 15 Nov: floor count passes, hourly check green, legal pages live, a real Click-out works, the Accuracy number shows. Ends with: both runs pass, or the launch waits.

### What Tico does by hand

- Create the free Cloudflare, Supabase and Brevo accounts, and add their keys and a `TAVILY_API_KEY` as GitHub secrets.
- Choose the domain (D3) in time to set up email sending before 12 Nov.
- Approve enough Suggested Retailers to meet the floor (D5).
- Do the ICO self-assessment before 12 Nov, and pay only if it says so.
- Approve the legal pages.
- Do the weekly spot-check of 20 Products.
- Apply to Awin and other networks once the site is live.

## Open questions

- **The domain** (Tico). It must be chosen by Mon 2 Nov so the sending domain for the opening email can be set up before 12 Nov. Until then the code uses a placeholder.
- **The side-by-side test with 10 real Shoppers** from the founder launch plan (Tico). Default: it runs during the soft open and informs changes, but does not gate the public launch.
- **What happens if the floor is not met by 15 Nov** (Tico). Default: the soft open continues, and the public launch moves one week at a time until the floor passes.
