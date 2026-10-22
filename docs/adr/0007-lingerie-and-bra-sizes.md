# Lingerie and Bra sizes

Decided by Tico on 21 Oct 2026. Changes spec 0001's scope, which left lingerie out.

Lingerie is a launch category alongside clothes, swimwear and activewear, so Retailers such as Lounge and Your Bra Lady can be collected. Knickers and shapewear sold in dress sizes use the UK size scale like any garment; nightwear stays under clothes. Bras are sold by band and cup, which has no honest UK size, so a Bra size label ("38DD", or a Shopify band option and cup option joined into one) is stored as its band and cup, and a Shopper finds bras by band and optionally cup.

A bra counts as Plus size when it is made in band 38 or above, matching the UK 18 line for clothes. A lone L cup is not read as a bra ("32L" is usually UK 32 Long), and Bra size labels the rule cannot read ("38DD/E") wait on the Review list, which can only answer in UK sizes for now.

Products excluded as lingerie before this decision are sorted again by `npm run migrate`, because the rules only re-read a Product when its text changes. A Plus-size bra is found in all its bands, including smaller ones, as a Plus-size dress is found in all its UK sizes.

Shoes stay out of scope. The Shopper site still needs a way to choose a Bra size; until then bras can be found only through the API.
