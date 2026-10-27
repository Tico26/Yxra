# Shopper accounts before the soft open

Decided by Tico on 27 Oct 2026, in a grilling session one question at a time. This replaces the 12 Oct decision of "no accounts at launch".

Shoppers can sign in before the 12 Nov soft open. A Shopper account keeps her Saved items and her UK size on any device; searching, browsing and Click-outs stay open to everyone, with no account. The first reason to sign in is Saved items, and Back-in-stock alerts are built next on top of them.

Signing in is by an emailed link or "Continue with Google", never a password, so there are no passwords to store, reset or leak. It runs on Supabase Auth, which the database already uses, with sign-in emails sent through a free email service on amaraspick.com. Running cost stays £0 until traffic proves otherwise.

Saving never waits for an account: a signed-out Shopper's heart saves on her device at once, and those saves move into her account when she signs in. Sign-up offers news emails only through an unticked box (PECR), and every account can be deleted by its Shopper.

Considered and turned down: shipping after the 16 Nov launch (Claude's recommendation, so launch work isn't squeezed; Tico chose the soft open so early visitors can be kept), passwords (more screens, more risk), and asking Shoppers to sign in before the heart works (loses people at the moment they show interest).
