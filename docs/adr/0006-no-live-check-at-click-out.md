# No Live check at Click-out

Supersedes the Live check half of [ADR 0002](0002-nightly-stock-check-plus-live-check.md). Decided by Tico on 21 Oct 2026.

Stock is checked once a night, and each card shows when. Choosing a Product sends her straight to the Retailer's page in her size, without re-reading it first. The Live check was the one request that ran past Cloudflare Workers Free's 10 ms CPU limit (about 27 ms typical in the 21 Oct hosting test), and dropping it keeps Yxra at £0 without a second host. The cost is that an item can sell out between the nightly check and her click; the card's "Checked" time says how fresh it is.

Spec 0002's in-stock Accuracy number (D9, rule 17) was measured from Live checks, so it needs a new measure before the first weekly figure.
