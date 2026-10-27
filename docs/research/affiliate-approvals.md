# How affiliate programmes approve a new site like Amara's Pick

Research for GitHub issue #33. All sources were read on **2026-10-18** through the WebFetch and WebSearch tools; direct `curl` to the retailers' sites was blocked by the network proxy. Retailer homepages could not be loaded, so retailer facts come from network programme pages and one retailer page (Simply Be).

Amara's Pick context: a UK sole trader runs a search site for plus-size women's clothing that links out to Retailers and sells nothing itself.

## TL;DR

- **Sole trader is fine on every network checked. No Ltd company is needed.** Awin's tax form has a "Sole Trader" option. Rakuten and Impact both offer an "individual" account type. Partnerize accepts individuals but requires you to act "in the course of a business", which a sole trader does.
- **Fees:** Awin takes a small refundable deposit; its own pages disagree on whether it is £1 or £5. Rakuten says joining is free. Simply Be's CJ programme is "free of charge to join". No sign-up fee was found for Impact or Partnerize, but neither page stated one way or the other. CJ (UK) and Partnerize mention dormant-account fees.
- **What the site needs before applying:** a live site with real, original content (Rakuten says it must not be "in development"), a privacy policy (Rakuten and Partnerize require one explicitly, Partnerize on every page), and an affiliate disclosure (Rakuten requires one on every page, starting with "Disclosure:"; the UK ASA expects an "Ad"-style label, not a footer disclaimer). No network sets a minimum traffic level; Rakuten says individual advertisers may set their own.
- **Approval time:** Awin's network approval takes about 24 hours (an older Awin page says about 2 working days). Rakuten "does not screen publishers when they join". CJ, Impact and Partnerize give no timeline. After that, each advertiser approves you separately, at its own discretion and with no published SLA.
- **Deep links:** Awin and CJ both provide deep-link tools that work for any page on the advertiser's site. **Data collected from the Retailer's site is the real risk.** JD Group's Awin terms explicitly ban scraping "for product information, images or for any other reason". The Awin publisher terms licence only covers advertiser materials published "without modification". No programme page read here explicitly allows using data collected from the site in place of the feed. Every Yours, Simply Be, Jacamo, Evans and River Island programme read here offers a product feed.

## 1. Which network each Retailer uses

| Retailer | Network (UK) | Evidence | Confidence |
|---|---|---|---|
| Yours Clothing | **Awin** (ID 19275). 6% new / 2% existing / 1% default, 30-day cookie, daily product feed | https://ui.awin.com/merchant-profile/19275 | Confirmed (network page) |
| Simply Be | **CJ** according to Simply Be's own page: "managed by CJ", "free of charge to join", up to 5%, 30-day cookie, product feeds; contact NBROWN_BRANDS@cj.com. An Awin profile also still exists (ID 3027, 5%/1%) | https://www.simplybe.co.uk/about-us/affiliate ; https://ui.awin.com/merchant-profile/3027 | Confirmed CJ (first-party). The Awin listing may be legacy, not confirmed |
| JD Williams | **Not confirmed.** It is an N Brown brand, like Simply Be and Jacamo. Jacamo still shows on Awin (ID 3026). Simply Be's CJ address "NBROWN_BRANDS" suggests the N Brown brands moved to CJ, but that is an inference. No first-party JD Williams affiliate page could be loaded. An Awin Hub post "JD Williams: Introducing two new Affiliate Programmes" exists, but the Hub was retired in Nov 2024 and the post no longer loads | https://ui.awin.com/merchant-profile/3026 ; https://www.awin.com/docs.awin.com/hub-deactivation/index.html?p=31415 | Unconfirmed: ask the N Brown team (NBROWN_BRANDS@cj.com) |
| Evans | **Awin** (Evans UK, ID 71429). 6% new / 3% existing / 1% default, 30-day cookie, daily feed | https://ui.awin.com/merchant-profile/71429 | Confirmed |
| ASOS (Curve) | **Not confirmed.** ASOS's own help page lists only loyalty and cashback partners (Rakuten, Capital One Shopping, TopCashback, MaxRebates, Cartera) and names no affiliate network. A Rakuten Advertising case study says one ASOS influencer campaign in France ran "through the Rakuten Advertising network". An old Awin Hub post titled "ASOS Launches on Affiliate Window" appears in search results but no longer loads | https://www.asos.com/us/customer-care/payment-promos-gift-voucher/is-asos-affiliated-with-any-reward-or-loyalty-websites/ ; https://rakutenadvertising.com/en-uk/resources/case-study-asos-shop-my-influence/ | Unconfirmed. Rakuten is plausible but not proven for the UK affiliate programme |
| River Island (Plus) | **Awin** (River Island UK & IE, ID 103217). 1% baseline, 30-day cookie, 46-day validation, product feeds. Only codes from the Awin team are allowed | https://ui.awin.com/merchant-profile/103217 | Confirmed. Plus is part of the main RI programme (the page has no separate Plus programme) |
| New Look (Curves) | **Awin** (New Look UK, ID 1946). 30-day cookie; "may not alter or change any of the provided creative or text links"; site must be "compatible with the New Look brand" | https://ui.awin.com/merchant-profile-terms/1946 | Confirmed. Curves falls under the main UK programme |
| Ulla Popken UK | **Awin** (ID 25873), 30-day cookie. The page also mentions TradeTracker for vouchers. Bans paidmail, iframes, pop-ups and search/AdSense ad switching | https://ui.awin.com/merchant-profile/25873 | Confirmed Awin listing. TradeTracker mention unexplained |

Takeaway: **one Awin account covers Yours, Evans, River Island, New Look and Ulla Popken.** Simply Be (and probably JD Williams) needs CJ. ASOS still needs confirming.

## 2. Can a UK sole trader join?

- **Awin.** Yes. The tax-details FAQ says that if you have no registered business, select "Sole Trader" and enter your full name as the Company Name. UK VAT is optional; the format is GB123456789. The publisher terms define a Publisher as "an individual or entity" (cl. 1.5). Individuals must be 18 or over (cl. 1.7).
  https://success.awin.com/articles/en_US/Knowledge/Publisher-Tax-Details-FAQs ; https://www.awin.com/docs.awin.com/Legal/Publisher+Terms/2025/EN-(UK)_Awin-Ltd-Publisher-terms_August-2025.pdf
- **Rakuten Advertising.** Yes. At sign-up you choose "An individual" or "Part of a company". Tax information and a mailing address are required.
  https://pubhelp.rakutenadvertising.com/hc/en-us/articles/20898125890573-Publisher-Sign-Up-Process ; https://pubhelp.rakutenadvertising.com/hc/en-us/articles/13214492487309-Requirements-for-Becoming-a-Publisher
- **Impact.com.** Yes. The "Operating as" field asks whether you are "a single individual or a company".
  https://help.impact.com/en/support/solutions/articles/48001236554-sign-up-as-a-partner-on-impact-com
- **Partnerize (UK entity terms, effective 10 Apr 2025).** Yes. The terms cover "if Partner is an individual". The partner must take part "in the course of a business" (cl. 6.1(j)), which a sole trader does.
  https://partnerize.com/wp-content/uploads/2025/04/20250331-Partnerize-Publisher-Terms-and-Conditions-1.8.-UK-Entity-min.pdf
- **CJ.** **Not confirmed** from the pages read. Neither https://www.cj.com/publisher nor http://www.uk.cj.com/publisher/join says whether individuals can join. The sign-up form (https://members.cj.com/member/signup/publisher/) could not be inspected.

## 3. Sign-up fees and deposits

| Network | Fee | Source |
|---|---|---|
| Awin | Refundable deposit, paid by card. **The amount is inconsistent across Awin's own pages:** £5 ("the only network to request this") on the compliance page and the getting-started article; "1 EUR, GBP, or USD" on the Success Centre FAQ; the FAQ page says "the amount is on the sign-up page". It is refunded with the first payment once you reach the threshold (terms cl. 7.1). If you are rejected, you must request the refund yourself; it is not automatic | https://www.awin.com/gb/compliance-and-regulations/application-process-and-joining-fee ; https://success.awin.com/articles/en_US/Knowledge/Why-do-I-have-to-pay-the-sign-up-fee ; https://www.awin.com/gb/faqs ; https://www.awin.com/gb/news-and-events/tips-and-tricks/getting-started-with-affiliate-marketing |
| Rakuten | Free ("free membership"; "no cost to join any advertiser program") | Rakuten pubhelp pages above |
| CJ | Simply Be's CJ programme is "free of charge to join". No general CJ fee was confirmed. The UK join page mentions a non-refundable **£7.50 Dormant Account Fee** after 6 months with no commissionable transactions (page date unknown, may be old) | https://www.simplybe.co.uk/about-us/affiliate ; http://www.uk.cj.com/publisher/join |
| Impact | Not stated on the sign-up help page | as above |
| Partnerize | No joining fee found. Payout threshold £20/month (cl. 5.3); dormant-account fees possible (cl. 5.4(b)); bank and FX charges can be passed on (cl. 5.10–5.11) | Partnerize UK terms |

## 4. What the site must have before applying

**Network-level requirements found**

- **Live site with original content.** Rakuten: "your own live website, blog, or customized social media page URL", not in development, with "unique, quality content … not copied from another site". It also cites Google's warning that "thin" affiliate sites add no value. Awin needs the URLs you will use and a description of how you promote. Awin also accepts social channels instead of a website.
  https://pubhelp.rakutenadvertising.com/hc/en-us/articles/360060314292-Requirements-for-New-Publishers ; https://www.awin.com/gb/compliance-and-regulations/application-process-and-joining-fee ; https://www.awin.com/gb/faqs
- **Privacy notice.** Rakuten: "Maintain a current, accurate, and accessible privacy policy on all websites". Partnerize: "a clear and conspicuous link to its privacy policy from each page on its Site" (cl. 6.1(g)), plus cookie and tracking consent (cl. 7.2). Awin: comply with data regulation (cl. 12.1) and advertising standards (cl. 9.2.4).
  https://rakutenadvertising.com/legal-notices/affiliate-network-policies/ ; Partnerize UK terms
- **Affiliate disclosure.** Rakuten requires it "on every page of your site that has a review, recommendation, comment, or article", and it must "begin with the word 'Disclosure:'". Partnerize requires you to disclose the commercial relationship (cl. 6.1(h)). JD Group's Awin terms require following the CAP Code and ASA/CMA guidance (cl. 3–4).
  **UK ASA:** affiliate content must be identifiable before people engage with it. A label such as "Ad" works; mixed content can be marked "(Ad)". A footer disclaimer is "unlikely to be sufficient", and "affiliate" on its own was ruled not clear enough.
  https://www.asa.org.uk/advice-online/affiliate-marketing.html (page dated 22 Mar 2023)
- **Accessibility.** Rakuten says sites "should" meet WCAG 2.1 AA.
- **Traffic.** No network minimum was found. Rakuten asks for monthly visitors and page views at sign-up, or a Google Analytics link, and says each advertiser "may set their own" minimums. Awin says advertisers look at visitor numbers and audience. CJ asks for a profile description of at least 250 characters (2015 article).
  https://junction.cj.com/article/get-accepted-more-programs-more-often ; https://www.awin.com/us/how-to-use-awin/five-steps-successful-awin-publisher
- **Impact.** It recommends adding "at least one verified property" (ownership-verified website) to improve approval chances.

**Advertiser-level conditions relevant to Amara's Pick** (examples from the programme terms read)

- New Look: the site must be "compatible with the New Look brand", "honest, factually correct"; creative and text links must not be altered.
- JD Group programmes on Awin (example terms read: JD Sports IE 5945, Blacks 1520, Millets 1521): **no scraping**; CSS (comparison shopping) use needs prior written approval; JD may restrict links to certain pages; you must not present the site as official.
  These are JD Sports Fashion PLC programmes, **not** JD Williams, which belongs to N Brown. They show how strict a big UK fashion advertiser can be.
- River Island: CSS affiliates need written permission; only network-supplied codes are allowed.

**Unconfirmed:** none of the Amara's Pick Retailers' Awin pages (Yours, Evans, River Island, Ulla Popken) states any website or content prerequisite. Their full programme terms tabs may contain more.

## 5. Approval time

- **Awin network:** "within 24 hours" (excluding weekends and bank holidays) on the compliance page and FAQ. The getting-started article says "about two working days".
- **Rakuten:** "does not screen publishers when they join" but may review later. The Network Quality team "rigorously screens and monitors". No timeline.
- **CJ, Impact, Partnerize:** no timeline found.
- **Each advertiser:** a separate approval at the advertiser's "sole discretion" (Partnerize cl. 1.1). No retailer page gives a timeline. Some Awin advertisers offer "instant approval". **Unconfirmed** which of Amara's Pick's retailers do.

## 6. Deep links, and Product data collected from the Retailer's site

**Deep links are standard.**
- Awin Link Builder: "generate a deeplink by pasting the URL of the page you want to link to". You can even deep-link before joining if the advertiser offers instant approval. Awin's Generate Link API exists (https://help.awin.com/apidocs/generatelink).
  https://www.awin.com/gb/faqs ; https://success.awin.com/articles/en_US/Knowledge/How-can-I-use-Link-Builder-to-create-Deep-Links
- CJ Deep Link Generator: links "from any page within an advertiser's website", including product pages; you must be joined to the programme. https://junction.cj.com/article/deep-linking-tools-publishers (2019)
- Rakuten: every link must use the click.linksynergy tracking domain.
- Partnerize: traffic must come from the "Authorised URLs" you declare (Schedule para 4).
- **Limits:** advertisers can deactivate links (Awin cl. 4.5) or restrict which pages you link to (JD Group cl. 18). New Look forbids altering text links.

**Data collected from the Retailer's site is NOT clearly permitted.**
- Awin's publisher terms license "Advertiser Materials" for publishing "without modification" (cl. 10.1). Use "for any other purpose" of information and data is prohibited (cl. 10.7). Data collected from the site falls outside what is licensed. The terms do not mention scraping explicitly.
- JD Group programme terms on Awin (cl. 6): you must not use bots or scraping tools "for product information, images or for any other reason".
- Rakuten and Partnerize policies are silent on scraping. Both prohibit IP infringement (Partnerize cl. 3.1, 6.1(i)). Product images and descriptions are the retailer's IP.
- Yours, Evans, River Island, New Look, Ulla Popken and Simply Be pages: **silent on scraping** in what was read. All except New Look and Ulla Popken (where the page didn't describe one) advertise a product feed. **Could not confirm** any retailer's position either way.

**Practical reading:** a deep link to a Product page is fine whatever the data source. But building the catalogue by collecting data from Retailer sites without permission risks the network or programme terms and the Retailer's IP. Amara's Pick should use the network product feeds where they exist, or get written permission from each Retailer before collecting data from its site.

## Open questions to settle by email

1. Which network runs JD Williams and ASOS UK today? Ask NBROWN_BRANDS@cj.com and ASOS.
2. Is Simply Be's old Awin profile (3027) still live, or has it moved fully to CJ?
3. For each Retailer: is collecting data from its site acceptable for products missing from the feed? Get the answer in writing.
4. Is the Awin deposit £1 or £5? The sign-up page will show it.
5. Does CJ UK still charge the £7.50 dormant fee, and does it accept individuals? Check the sign-up form.
