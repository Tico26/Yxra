# What UK law asks of Amara's Pick's site at launch

Research for GitHub issue #35. All sources read on **2026-10-18** unless marked otherwise. This is a research summary, **not legal advice**. Points marked **[Lawyer]** need a qualified UK solicitor before launch.

Amara's Pick as assumed here: a UK site run by a sole trader (Tico). Shoppers search Products collected from Retailers' public product data, then click out to the Retailer to buy, possibly through affiliate links. The site remembers the Shopper's size on her device, may run analytics, and collects waiting-list emails. Amara's Pick sells nothing itself.

## Launch-day checklist (short version)

| # | Must be in place | Law | Section |
|---|---|---|---|
| 1 | Privacy notice covering waiting list, analytics, hosting, email provider | UK GDPR Art 13 | [§1](#1-uk-gdpr-privacy-notice) |
| 2 | A clear way to make a data protection complaint, acknowledged within 30 days | DPA 2018 s.164A (from DUAA s.103, in force 19 June 2026) | [§1](#1-uk-gdpr-privacy-notice) |
| 3 | ICO data protection fee paid (likely tier 1, £52 or £47 by direct debit), or a documented exemption | Data Protection (Charges and Information) Regs 2018 | [§2](#2-ico-data-protection-fee) |
| 4 | Storage notice for the size choice and analytics, with a free, simple way to object. A consent banner only if anything goes beyond the new exceptions | PECR reg 6 + Sch A1 (as amended 5 Feb 2026) | [§3](#3-pecr-cookies-local-storage-analytics) |
| 5 | Waiting-list form that collects clear opt-in consent to emails, plus an unsubscribe link in every email | PECR reg 22 | [§4](#4-waiting-list-emails) |
| 6 | "Ad"-style label on or next to affiliate links, plus a prominent "how we make money" explanation | CAP Code 2.1/2.3; DMCC Act s.227, Sch 20 para 12 | [§5](#5-affiliate-links-asacap-and-cma) |
| 7 | Clear explanation of how results are ranked, how much of the market is covered, and any paid placement labelled "Sponsored" | DMCC Act Part 4 Ch 1; CMA comparison-tool principles; P2B Reg Art 5 (possibly) | [§6](#6-consumer-law-for-a-discoverycomparison-site) |
| 8 | No copied review stars or counts unless there is a published review policy and checks | DMCC Act Sch 20 para 13; CMA208 | [§6](#6-consumer-law-for-a-discoverycomparison-site) |
| 9 | Retailer opt-out route, a policy on product images, and robots.txt and terms respected | CRDR 1997 reg 16; CDPA 1988 | [§7](#7-collecting-retailers-public-product-data) |
| 10 | Trader's name, geographic address and email on the site | Electronic Commerce Regs 2002 reg 6 | [§8](#8-sole-trader-vs-ltd) |

---

## 1. UK GDPR privacy notice

**What applies.** Amara's Pick is the controller for any personal data it holds. That includes waiting-list emails, analytics data (IP addresses and device identifiers are personal data), server logs and complaint messages. Where data is collected directly from people, UK GDPR Art 13 requires the notice to give ([ICO, "What privacy information should we provide?"](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/), page dated 15 Jan 2026):

- the controller's name and contact details
- each purpose of processing and its lawful basis, plus the legitimate interests relied on where Art 6(1)(f) is used
- recipients or categories of recipients, including processors such as the host, the email platform and the analytics vendor
- transfers outside the UK and the safeguard used
- retention periods, or the criteria for setting them
- individuals' rights, with the right to object flagged separately
- the right to withdraw consent, where consent is the basis
- the right to complain to the ICO
- whether providing the data is required, and any automated decision-making

The ICO page notes it is "under review" following DUAA changes.

**Likely lawful bases for Amara's Pick:** consent for the waiting list (it is tied to PECR consent, see §4) and legitimate interests for analytics and security logs. **[Lawyer]**: confirm the bases and write a short legitimate interests assessment.

**Size remembered on the device.** If the size choice stays in the browser and is never sent to Amara's Pick's server, Amara's Pick probably isn't processing it as personal data. PECR still applies to storing it, though (§3). If the size is ever sent with search requests or logged, put it in the notice. *(This is my inference, not an ICO statement.)*

**New complaints duty (DUAA 2025 s.103).** This commenced on **19 June 2026** ([S.I. 2026/82 reg 3](https://legislation.gov.uk/uksi/2026/82)). Organisations must "provide a clear way to raise a data protection complaint", "acknowledge it within 30 days" and "investigate appropriately and communicate the outcome" ([ICO news, 23 June 2026](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/06/new-data-protection-complaints-law-now-in-force/)). The ICO suggests making complaints easier, for example with an electronic form, and responding "without undue delay" ([ICO, DUAA: what does it mean for organisations?](https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/), updated 19 June 2026). **Launch action:** put a complaints email address or form in the privacy notice.

**Children.** The ICO says that if a service is likely to be used by children, its needs must be considered, and following the Age Appropriate Design Code should meet that duty (same ICO DUAA page). Amara's Pick targets adult women, so this is probably low risk. Record the reasoning anyway.

## 2. ICO data protection fee

- Tiers ([ICO, Guide to the data protection fee](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/), page dated 9 Sept 2025):
  - **tier 1 (micro): £52** (turnover up to £632,000 or up to 10 staff)
  - tier 2: £78
  - tier 3: £3,763
  - £5 off when paying by direct debit
  - The ICO treats every controller as tier 3 "unless and until they tell us otherwise", so declare tier 1 when you register.
- Exemptions are in the [Data Protection (Charges and Information) Regulations 2018, Schedule para 2(2)](https://www.legislation.gov.uk/uksi/2018/480/schedule). They include (d) staff administration, (e) "advertising, marketing and public relations" for the controller's **own** business, and (f) accounts and records.
- **Assessment:** the waiting list on its own might fit exemption (e). Analytics of Shopper behaviour, and running a consumer-facing search service that processes visitors' data, go beyond the listed purposes. **Plan to pay tier 1 before launch**, and confirm with the [ICO self-assessment](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/data-protection-fee-faqs/). The ICO can issue fixed penalties for non-payment ([ICO, fixed penalties](https://ico.org.uk/about-the-ico/our-information/fixed-penalties-for-failure-to-pay-the-data-protection-charge/); found by search, not read).
- The fee is paid by the controller: Tico personally as a sole trader, or the company if one is formed. Moving to a Ltd means a new registration (§8).

## 3. PECR: cookies, local storage, analytics

**The rule (as amended).** [PECR reg 6](https://www.legislation.gov.uk/uksi/2003/2426/regulation/6) was substituted by the Data (Use and Access) Act 2025 with effect from **5 February 2026** ([S.I. 2026/82 reg 2](https://legislation.gov.uk/uksi/2026/82): s.112 and Sch 12 commenced). Storing information on, or reading it from, a user's device is prohibited "subject to Schedule A1". Reg 6 also now covers "collecting or monitoring information automatically emitted by the terminal equipment". The ICO's final guidance names **local storage** and **device fingerprinting** as covered technologies ([ICO, Storage and access technologies: About this guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/about-this-guidance/), finalised April 2026).

**The exceptions** ([DUAA 2025 Sch 12, inserting PECR Sch A1](https://www.legislation.gov.uk/ukpga/2025/18/schedule/12)):

| Exception | Conditions | Amara's Pick use |
|---|---|---|
| Strictly necessary (para 4) | essential to provide the service the user requests, for example security, fraud prevention or authentication | session or security tokens, if any |
| **Statistical purposes** (para 5) | sole purpose is collecting statistics on how the service is used, to improve it; data not shared except with someone helping make those improvements; "clear and comprehensive information"; "a simple means of objecting, free of charge", and the user does not object | first-party, aggregate analytics |
| **Appearance and functionality** (para 6) | sole purpose is adapting how the website appears or functions to the user's preferences; clear information; a simple, free means of objecting | **remembering the Shopper's size** |
| Emergency assistance (para 7) | not relevant | none |

**ICO interpretation** ([What are the exceptions?](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/), April 2026):

- **Analytics:** the exception covers only aggregate statistics and is "not for identifying, tracking or monitoring" individuals. A third-party analytics provider "must be a processor, not a joint controller". Advertising use, linking visitor IDs to ads, or profiling takes you outside the exception. The ICO accepts analytics and appearance toggles that are **on by default**, as long as users can switch them off at any time. You "must not solely rely on browser settings" as the way to object.
- **Appearance:** the ICO's examples include remembering a selected language and detecting a theme preference. The exception does **not** cover choosing content or ads based on inferred interests. Remembering a size the Shopper chose herself, so the site filters to her size, looks like a direct analogue of "language selected". However, the ICO says the exception "is not about adapting the content to display to a user". Filtering results by size arguably adapts content. **[Lawyer]** for a view. The fallback is to treat size storage as **strictly necessary**: the Shopper actively asked to "remember my size", so the storage is needed for the feature she requested.
- **"Cookieless" analytics:** if analytics reads or stores nothing on the device, and does not collect information the device emits automatically (for example fingerprinting), reg 6 may not be engaged at all. The ICO guidance does not expressly address purely server-side analytics. Fingerprinting is covered, and the ICO says the statistical exception "does not apply to collecting or monitoring information automatically emitted by terminal equipment". So "cookieless" products that fingerprint still need either the exception's conditions to be met or consent. UK GDPR still applies to the IP addresses and logs they process.

**If anything needs consent** (for example affiliate-network tracking pixels, third-party analytics that act as a controller, or ad tech), the ICO expects ([How do we manage consent in practice?](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/)):

- refusing must be "as easy to refuse consent as it is to accept"
- consent needs positive action ("silence or inactivity doesn't qualify")
- non-essential technologies are off by default
- users can withdraw "with the same ease that they gave it"

**Affiliate links.** Click-out tracking usually sets cookies on the **Retailer's or network's** domain, not Amara's Pick's. Whether Amara's Pick "instigates" that storage (reg 6(2)(a) now says storage includes instigating it) needs checking. **[Lawyer]**, and check with the research-affiliates thread.

**Penalties.** The ICO says the DUAA lets it "issue fines of up to £17.5 million or 4% of global turnover" under PECR ([ICO statement on DUAA commencement, Feb 2026](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/statement-on-the-commencement-of-the-data-use-and-access-act-duaa)). Sanctions apply to breaches on or after 5 Feb 2026 (S.I. 2026/82 regs 8 and 11).

**Launch action:** a short "Storage on your device" section that names each item (size choice, analytics) and its purpose, with an always-available toggle to switch off analytics and size memory. Use first-party aggregate analytics with the vendor as a processor. A full consent banner is needed only if non-exempt tags are added.

## 4. Waiting-list emails

[PECR reg 22](https://www.legislation.gov.uk/uksi/2003/2426/regulation/22) prohibits unsolicited marketing email to individuals unless "the recipient … has previously notified the sender that he consents".

- The **soft opt-in** (reg 22(3)) needs details obtained "in the course of the sale or negotiations for the sale". Amara's Pick sells nothing, so it **cannot rely on it**. The DUAA extended the soft opt-in only to **charities** (reg 22(3A), from 5 Feb 2026).
- **Launch action:**
  - an unticked opt-in on the sign-up form that says what emails Shoppers will get
  - a record of when and how each person consented
  - an unsubscribe link in every email
  - the email platform named in the privacy notice as a processor, with an Art 28 processor contract (normally the vendor's DPA)

## 5. Affiliate links: ASA/CAP and CMA

**CAP Code (ASA).** CAP's affiliate advice ([ASA AdviceOnline, Online affiliate marketing](https://www.asa.org.uk/advice-online/affiliate-marketing.html), dated 22 Mar 2023; CAP Executive guidance, not binding):

- Affiliates act as "secondary advertiser[s]", and affiliate-linked content is within the CAP Code.
- Rule 2.1 says marketing must be "obviously identifiable", and rule 2.3 says commercial intent must be clear if it isn't apparent from context.
- Use an identifier such as **"Ad"** on or before affiliate content. A disclaimer at the bottom is "unlikely to be sufficient", and "affiliate" alone was found insufficient.
- Voucher-site analogy: if **all** offers are affiliate-linked, the **site as a whole** must make this clear, and you shouldn't rely only on About, FAQ or Terms pages. If only **some** are, label those offers.
- Disclosing the commission itself is "not a requirement of the Code".

**Comparison-site remit** ([ASA, Remit: search engines and price comparison websites](https://www.asa.org.uk/advice-online/remit-search-engines-and-price-comparison-websites.html), dated 4 Feb 2026):

- "Natural" results are the site's own product and are generally out of remit.
- Paid prominence or preferential positioning is **in** remit.
- The site's claims about itself (for example "every plus-size shop in the UK") may be in remit.
- A site closely tied to the firms it lists may be treated as advertising throughout.

**CMA.** The CMA's creator guidance says "it is not enough just to … use discount codes or affiliate links", and lists "#affiliate" as ambiguous ([CMA, Social media endorsements: guidance for content creators](https://www.gov.uk/government/publications/social-media-endorsements-guidance-for-content-creators/social-media-endorsements-being-transparent-with-your-followers), updated 3 Sept 2025). It is aimed at social media, but the reasoning carries over.

Under the DMCC Act ([CMA207](https://www.gov.uk/government/publications/unfair-commercial-practices-cma207/unfair-commercial-practices), updated 18 Nov 2025):

- a practice "involves a misleading omission if it fails to identify its commercial intent" (s.227)
- banned practice 12 prohibits paid "editorial content … to promote a product" without making the payment clear ([DMCC Act 2024 Sch 20](https://www.legislation.gov.uk/ukpga/2024/13/schedule/20))

**Launch action for Amara's Pick:**

1. A short line on every results page and on each Product card or "Buy" button, such as "Ad · we may earn commission if you buy". **[Lawyer]** to sign off the exact wording; CAP prefers "Ad".
2. A prominent "How Amara's Pick makes money" page, linked from the header or footer, not only from Terms.
3. If affiliate status doesn't change ranking, say so.

## 6. Consumer law for a discovery/comparison site

**DMCC Act 2024, Part 4 Chapter 1** (unfair commercial practices; replaced the CPRs from 6 April 2025). Relevant duties ([CMA207](https://www.gov.uk/government/publications/unfair-commercial-practices-cma207/unfair-commercial-practices)):

- Misleading actions, including "overall presentation" likely to deceive, and false statements about "sponsorship or approval".
- Misleading omissions (s.227, commercial intent).
- Professional diligence (s.229).
- The rules expressly cover traders who promote **another trader's** products.
- **Accuracy:** stale prices or "in stock" claims could be misleading actions. Show "last checked" times and refresh often.

**Penalties:** the CMA can impose fines "of up to the higher of £300,000 or 10%" of worldwide turnover (CMA207 fn 39). Banned practices 12 and 13 are civil only (fn 112).

**Rankings and "Sponsored".** Sch 20 has **no** UK banned practice specifically about undisclosed paid search ranking. The EU added one, but the UK list doesn't include it ([Sch 20 paras 1–32](https://www.legislation.gov.uk/ukpga/2024/13/schedule/20)). Undisclosed paid ranking would still be caught by the misleading action and omission rules and by the CAP Code. The CMA's comparison-tool principles ([Digital comparison tools: summary of final report](https://www.gov.uk/government/publications/digital-comparison-tools-summary-of-final-report/digital-comparison-tools-summary-of-final-report), 26 Sept 2017) expect sites to:

- "Prominently provide a general explanation of how they make money"
- "Clearly explain how much of the market they cover"
- "Clearly explain how they have ranked the results"
- "Clearly state when and how commercial relationships have affected the results"

**Launch action:**

- An "About our results" note: which Retailers are covered (not "all"), the default sort order, and whether commission affects order.
- Any paid or boosted placement labelled **"Sponsored"** and kept visibly distinct from natural results.

**P2B Regulation (retained/assimilated Reg (EU) 2019/1150).**

- Art 5 requires online intermediation services to put "the main parameters determining ranking" in their terms. They must also describe any "possibility to influence ranking against any direct or indirect remuneration" ([Art 5](https://www.legislation.gov.uk/eur/2019/1150/article/5)).
- A service is an online intermediation service only if it is provided to business users "on the basis of contractual relationships" ([Art 2(2)(c)](https://www.legislation.gov.uk/eur/2019/1150/article/2)).
- Amara's Pick probably falls outside this while it has no contracts with Retailers. Affiliate agreements, or a future Retailer onboarding flow, might bring it in. **[Lawyer]**. Separately, Amara's Pick is not an "online search engine" (Art 2(5)) because it doesn't search "in principle, all websites".

**Fake reviews (banned practice 13).**

- Banned: publishing "consumer reviews, or consumer review information" without "reasonable and proportionate steps" to prevent and remove fake or concealed-incentivised reviews.
- CMA guidance covers publishing reviews "originally collated by someone else", and lists overall ratings and review counts as review information ([CMA208 short guide](https://www.gov.uk/government/publications/fake-reviews-cma208/short-guide-for-businesses-publishing-consumer-reviews-and-complying-with-consumer-protection-law), published 4 Apr 2025).
- Expected steps: a published review policy, a risk assessment, detection and removal processes, and regular checks.
- **Launch action:** do **not** import Retailers' star ratings or review counts at launch. If added later, first publish a review policy and set up the required steps.

## 7. Collecting Retailers' public product data

**Database right** ([Copyright and Rights in Databases Regulations 1997](https://www.legislation.gov.uk/uksi/1997/3032/regulation/13)):

- Database right exists where there was "a substantial investment in obtaining, verifying or presenting the contents" (reg 13).
- Infringement means extracting or re-utilising "all or a substantial part" without consent, and "repeated and systematic extraction … of insubstantial parts" can count as a substantial part ([reg 16](https://www.legislation.gov.uk/uksi/1997/3032/regulation/16)).
- For databases made on or after 1 Jan 2021, only UK makers qualify ([gov.uk, Sui generis database rights](https://www.gov.uk/guidance/sui-generis-database-rights)). UK Retailers' catalogues probably qualify.
- Systematically crawling a Retailer's whole catalogue is the textbook risk case. **[Lawyer]**

**Copyright.**

- Product **photos** and descriptive copy are typically copyright works. Bare facts (price, sizes, stock) are not.
- The text-and-data-mining exception covers only computational analysis "for the sole purpose of research for a non-commercial purpose" ([CDPA s.29A](https://www.legislation.gov.uk/ukpga/1988/48/section/29A)), so it doesn't help a commercial site.
- Copying and re-hosting product images is the highest-risk item. **[Lawyer]**: options are using affiliate or product feeds whose licence covers images, or hot-linking or thumbnailing with permission.

**Website terms.** Many Retailer terms prohibit scraping. Whether browse-wrap terms bind a crawler, and whether a breach gives a claim, is unsettled and fact-specific. **[Lawyer]**. Unauthorised-access offences under the Computer Misuse Act 1990 are unlikely for public pages accessed without bypassing controls, but get confirmation (not read for this note).

**Practical risk reducers (no legal duty found, but they reduce exposure):**

- Prefer **affiliate or product feeds** (licensed data, which removes most database right and copyright risk). See the research-retailers and research-affiliates threads.
- Respect robots.txt, rate-limit, and identify the crawler with a contact URL.
- Take only the fields needed. Link out for full detail.
- Publish a **Retailer opt-out** route (an email or form, honoured promptly, with a removal log). Nothing in the sources read creates a legal duty to offer one. It is a goodwill and risk measure that also supports the "Suggested Retailer" approval flow.
- Retailer names and logos: name Retailers descriptively, and avoid logos without permission (trade marks; not researched here).

## 8. Sole trader vs Ltd

| | Sole trader (Tico) | Ltd company |
|---|---|---|
| Liability | "unlimited liability": personally responsible for all business debts ([gov.uk, Set up as a sole trader](https://www.gov.uk/set-up-sole-trader)) | company liable; directors generally not personally liable (not researched in depth) |
| Website disclosures | [E-Commerce Regs 2002 reg 6](https://www.legislation.gov.uk/uksi/2002/2013/regulation/6): name, **geographic address** where established, email, VAT number if registered | same as sole trader, **plus** part of the UK where registered, company number and registered office ([Company, LLP and Business (Names and Trading Disclosures) Regs 2015 reg 25](https://www.legislation.gov.uk/uksi/2015/17/regulation/25)) |
| Trading under a name other than own surname | Companies Act 2006 Part 41: name and UK address on business letters, orders, invoices and payment demands ([s.1202](https://www.legislation.gov.uk/ukpga/2006/46/section/1202)) | n/a |
| ICO fee and controller | Tico personally | the company; new registration needed on incorporation |
| Tax | register for Self Assessment if earning more than £1,000 in a tax year (gov.uk) | Corporation Tax; not researched |
| Privacy | home address may have to be shown under reg 6 | registered office can be a service address |

**[Lawyer] or accountant:**

- whether a virtual or business address satisfies the reg 6 "geographic address" requirement for a home-based sole trader
- the timing and tax effects of incorporating
- whether affiliate networks require a company

## Needs a lawyer (consolidated)

1. Whether remembering size fits the "appearance" exception, or should rest on "strictly necessary".
2. Whether affiliate click-out cookies are storage that Amara's Pick "instigates".
3. Database right, copyright (especially **images**) and terms of use for crawled Retailer data. A feed-first strategy is the main mitigation.
4. Whether the P2B Regulation applies once Amara's Pick has affiliate or Retailer contracts.
5. The exact affiliate disclosure wording and placement.
6. Lawful bases and a legitimate interests assessment for analytics.
7. Sole trader address disclosure, and the timing of incorporation.

## Sources (all read 2026-10-18)

- legislation.gov.uk:
  - [PECR reg 6](https://www.legislation.gov.uk/uksi/2003/2426/regulation/6)
  - [PECR reg 22](https://www.legislation.gov.uk/uksi/2003/2426/regulation/22)
  - [DUAA 2025 Sch 12](https://www.legislation.gov.uk/ukpga/2025/18/schedule/12)
  - [DUAA 2025 Sch 13](https://www.legislation.gov.uk/ukpga/2025/18/schedule/13)
  - [S.I. 2026/82](https://legislation.gov.uk/uksi/2026/82)
  - [S.I. 2018/480 Sch](https://www.legislation.gov.uk/uksi/2018/480/schedule)
  - [DMCC Act 2024 Sch 20](https://www.legislation.gov.uk/ukpga/2024/13/schedule/20)
  - [P2B Reg Art 2](https://www.legislation.gov.uk/eur/2019/1150/article/2)
  - [P2B Reg Art 5](https://www.legislation.gov.uk/eur/2019/1150/article/5)
  - [CRDR 1997 reg 13](https://www.legislation.gov.uk/uksi/1997/3032/regulation/13)
  - [CRDR 1997 reg 16](https://www.legislation.gov.uk/uksi/1997/3032/regulation/16)
  - [CDPA s.29A](https://www.legislation.gov.uk/ukpga/1988/48/section/29A)
  - [E-Commerce Regs reg 6](https://www.legislation.gov.uk/uksi/2002/2013/regulation/6)
  - [S.I. 2015/17 reg 25](https://www.legislation.gov.uk/uksi/2015/17/regulation/25)
  - [CA 2006 s.1202](https://www.legislation.gov.uk/ukpga/2006/46/section/1202)
- ico.org.uk:
  - [Storage and access tech guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/)
  - [Exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
  - [Consent in practice](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/)
  - [Privacy information](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
  - [Fee guide](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/)
  - [Fee FAQs](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/data-protection-fee-faqs/)
  - [DUAA for organisations](https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/)
  - [DUAA commencement statement](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/statement-on-the-commencement-of-the-data-use-and-access-act-duaa)
  - [Complaints law in force](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/06/new-data-protection-complaints-law-now-in-force/)
- asa.org.uk:
  - [Affiliate marketing](https://www.asa.org.uk/advice-online/affiliate-marketing.html)
  - [Remit: search engines and price comparison](https://www.asa.org.uk/advice-online/remit-search-engines-and-price-comparison-websites.html)
- gov.uk:
  - [CMA207](https://www.gov.uk/government/publications/unfair-commercial-practices-cma207/unfair-commercial-practices)
  - [CMA208 short guide](https://www.gov.uk/government/publications/fake-reviews-cma208/short-guide-for-businesses-publishing-consumer-reviews-and-complying-with-consumer-protection-law)
  - [CMA DCT principles](https://www.gov.uk/government/publications/digital-comparison-tools-summary-of-final-report/digital-comparison-tools-summary-of-final-report)
  - [CMA creator guidance](https://www.gov.uk/government/publications/social-media-endorsements-guidance-for-content-creators/social-media-endorsements-being-transparent-with-your-followers)
  - [DUAA commencement plans](https://www.gov.uk/guidance/data-use-and-access-act-2025-plans-for-commencement)
  - [Sui generis database rights](https://www.gov.uk/guidance/sui-generis-database-rights)
  - [Set up as a sole trader](https://www.gov.uk/set-up-sole-trader)
