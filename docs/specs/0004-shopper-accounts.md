# 0004: Shopper accounts

Agreed with Tico on 27 Oct 2026, one decision at a time, using the Matt Pocock flow (grilling, then this spec, then tickets). The why is in [ADR 0010](../adr/0010-shopper-accounts-before-soft-open.md).

## Goal

Before the 12 Nov soft open, a Shopper can sign in with an emailed link or with Google. A heart on every Product card saves it, signed in or not, and her Saved page lists what she has saved. Signed in, her Saved items and her UK size follow her to any device. She can opt in to news emails, sign out, and delete her account. Browsing, search and Click-outs never need an account, and running it costs £0 (spec 0002 rule 34).

## Out of scope

- Back-in-stock alerts. They come straight after this spec, built on Saved items.
- Sending news emails. This spec only collects the opt-in; a mailing tool comes later.
- Passwords, and sign-in with Apple, Facebook or anything else.
- Retailer accounts, and any change to how Tico signs in to the admin page.
- Turning the "Coming soon" newsletter band into a working sign-up. It stays as it is.
- Lists or folders of Saved items, sharing a Saved list, and notes on Saved items.

## Terms

Uses: Shopper, Product, Retailer, UK size, Stock check, Click-out, Back-in-stock alert, Placement.
Adds (also in [CONTEXT.md](../../CONTEXT.md)):
- **Shopper account**: what a Shopper gets by signing in. It keeps her Saved items and her UK size on any device.
- **Saved item**: a Product she kept with the heart, listed on her Saved page.

## Decisions

| # | Question | Decision | Why |
|---|---|---|---|
| D1 | Who can sign in | Shoppers only (Tico, 27 Oct) | Back-in-stock alerts, the next feature, need an account. Retailer logins wait for paying Retailers |
| D2 | When | Live before the 12 Nov soft open (Tico, 27 Oct) | Keep early visitors. Claude recommended after launch; Tico chose earlier |
| D3 | How she signs in | Emailed link or "Continue with Google", no passwords (Tico, 27 Oct) | No passwords to forget, reset or leak; Google is fastest for many people |
| D4 | What an account does on day one | Saved items, and her UK size remembered on any device (Tico, 27 Oct) | A clear reason to sign in that is small enough for two weeks |
| D5 | Heart when signed out | Saves on her device at once, offers sign-in, and moves the saves into her account when she signs in (Tico, 27 Oct) | Users-first launch: nobody is blocked at the moment she shows interest |
| D6 | News emails | An optional unticked box at sign-in, changeable later (Tico, 27 Oct) | PECR needs separate, active consent; a list from day one |
| D7 | Saved items that sell out | Stay on the Saved page, greyed, "Sold out in your size", with no link out; gone when the Product is deleted (Tico, 27 Oct) | A save vanishing looks like a bug, and it sets up Back-in-stock alerts |
| D8 | How it is built | Supabase Auth in the browser; Saved items and her size live in a separate `shoppers` schema in the same Supabase database, protected by row-level security, read and written by the browser directly. The Workers only gain a way to fetch Products by id (Claude, 27 Oct) | Already on Supabase; adds next to no Worker CPU against the 10 ms free limit |
| D9 | Sign-in emails | Sent through Resend's free plan (3,000 a month, 100 a day) from amaraspick.com, set as Supabase Auth's email sender (Claude, 27 Oct) | Supabase's own sender allows only a few emails an hour; the same sender serves Back-in-stock alerts later |

## Rules

### Signing in

1. The Log in page offers "Email me a sign-in link" and "Continue with Google"; it has no password field.
2. When she asks for a link, she is told to check her email, and the link signs her in once, within one hour.
3. The first time an email address or Google account signs in, a Shopper account is made; there is no separate sign-up step. The old Sign up address goes to the Log in page.
4. The Log in page has an unticked "Send me new finds and offers" box. Her account records news emails as wanted only when she ticked it, with the date.
5. When signed in, the menu shows "Saved" and "Your account" in place of "Log in".
6. Signing out ends the session on that device only.
7. A sign-in link that is used, too old or broken shows a page saying so, with a button to send a new one.

### Saving

8. Every Product card and product page has a heart. Tapping it saves the Product; tapping again removes it.
9. When she is signed out, a saved Product is kept on that device, and a note offers "Sign in to keep your saves on any device".
10. When she signs in on a device that has saves on it, those saves join her account's Saved items without duplicates, and the device's own list is then cleared.
11. When she is signed in, a save made on one device shows on every device she is signed in on, after a page load.
12. The Saved page lists her Saved items, newest saved first.
13. A Saved item that is not in stock in her UK size stays on the Saved page, greyed, marked "Sold out in your size", with no link to the Retailer.
14. When a Product is deleted (spec 0001: gone from its Retailer for 30 days), it leaves every Saved page.
15. A Placement is never added to a Saved page, and saving never changes ranking anywhere (ADR 0005).

### Her size

16. When she is signed in and picks a UK size, it is kept on her account, and every device she is signed in on starts with that size.
17. When she is signed out, a size she picks is kept on that device only, and moves to her account when she signs in, unless her account already has one.

### Her account

18. "Your account" shows her email, her UK size, the news emails box, "Sign out" and "Delete my account".
19. "Delete my account" asks once to confirm, then removes her account, her Saved items, her size and her news emails choice, and signs her out.
20. No one holding the site's public browser key can read or change anything but their own Saved items, size and news emails choice; Products, Retailers, Click-outs and the Review list stay closed to it.

### Legal and costs

21. The Privacy page says what an account stores (email, Saved items, UK size, news emails choice and date), why, for how long (until she deletes it), and that Supabase and Resend process it.
22. The Cookies page lists the sign-in session kept in her browser as strictly necessary.
23. Nothing here needs a paid plan or a paid API key.

## Build steps

Each step is one ticket, built with `/implement`. Steps marked **Tico** are his.

1. **Tico: accounts set-up.** A free Resend account with amaraspick.com verified (DNS records on Cloudflare); Supabase Auth set to send through Resend, with the site address and allowed redirect addresses; a Google Cloud sign-in app connected to Supabase; the Supabase project URL and public key added as repository variables. Run `bash scripts/setup-accounts.sh` from the repository root; it walks through every click. Ends with: a test sign-in email arrives from amaraspick.com.
2. **The shoppers schema.** `shoppers.saved_items` (Shopper, Product, saved date; deleted with the Product), `shoppers.profiles` (Shopper, UK size, news emails and date), row-level security so each Shopper sees only her own rows, a `delete_my_account` function, and only `shoppers` exposed to the browser key, with row-level security turned on for every existing table too. Ends with: tests for rules 14, 19 and 20 pass against a database.
3. **Products by id.** `GET /api/products?ids=1,2,3` returns those Products, including sold out ones with each size's stock, for the Saved page. Ends with: tests for rules 13 and 14 pass in the API.
4. **Heart and Saved page, signed out.** The heart on cards and product pages, saves on the device, and the Saved page reading them through step 3. Ends with: rules 8, 9, 12, 13 and 15 work on the site without an account.
5. **Email sign-in.** The new Log in page, the check-your-email and broken-link pages, the menu change, sign out, the news emails box, and the Sign up address forwarding. Ends with: rules 1 to 7 work with a real email (needs step 1).
6. **Saves and size on the account.** Signed-in saves and size go to the account; device saves and size move in at sign-in. Ends with: rules 10, 11, 16 and 17 pass.
7. **Continue with Google.** The button and its return to the page she was on. Ends with: a Google sign-in works on the live site (needs step 1).
8. **Your account and legal pages.** The account page, Delete my account, and the Privacy and Cookies wording. Ends with: rules 18, 19, 21 and 22 work.

Steps 2 to 4 need nothing from Tico and can start at once; 5 and 7 wait on step 1.

## Open questions

- Resend's free plan allows 100 emails a day. If sign-ins pass that at the soft open, switch to Brevo's free plan (300 a day) or ask Tico about a paid plan (Claude to watch, Tico decides).
- Should the Saved page offer "Email me when it's back" now as a "coming soon" line, or show nothing until Back-in-stock alerts are built (Tico)?
