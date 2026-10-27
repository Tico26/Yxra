# Amara's Pick

Amara's Pick helps plus-size women in the UK find clothes in their size across many retailers, see what is still in stock, and go straight to where they can buy it. Amara's Pick sells nothing itself. It was called Yxra until 27 Oct 2026 (ADR 0009).

## Language

### People

**Amara**:
The site's friendly guide, who speaks for Amara's Pick ("Amara checks every shop each night"). She says what the site found, never what she likes, and never hand-picks or endorses items.
_Avoid_: Using "Amara" alone for the business

**Shopper**:
A plus-size woman browsing Amara's Pick to find clothes in her size. Menswear is out of scope for now.
_Avoid_: User, customer, visitor

**Shopper account**:
What a Shopper gets by signing in with an email link or Google. It keeps her Saved items and her UK size on any device. Everything else on Amara's Pick works without one (ADR 0010).
_Avoid_: User account, profile, membership, login (as a noun)

### Who sells

**Retailer**:
A business a Shopper can buy from, online or in person (ASOS, Yours).
_Avoid_: Shop, store, merchant

**Suggested Retailer**:
A shop Amara's Pick found by itself that waits for Tico's approval before it becomes a Retailer. Tico can also add a Retailer directly.
_Avoid_: Candidate, lead, prospect

**Range**:
A Retailer's named plus-size line within its wider catalogue (ASOS Curve).
_Avoid_: Sub-brand, collection

**Brand**:
The label on the garment itself, which may differ from the Retailer selling it.
_Avoid_: Designer, maker

**Branch**:
One physical shop belonging to a Retailer, at a real address (Yours Leeds).
_Avoid_: Store, outlet, location

### What is sold

**Product**:
One garment in one colour at one Retailer, with its own photos, sizes in stock and link. The same dress in black and in red is two Products.
_Avoid_: Item, listing, variant, style

### Size

**Size label**:
The size exactly as a Retailer writes it ("3X", "EU 50", "22/24").
_Avoid_: Retailer size, raw size

**UK size**:
Amara's Pick's single standard size scale for clothing, swimwear, activewear and lingerie sold in dress sizes, which every Size label is translated onto so one size can be searched across all Retailers. One Size label can translate to more than one UK size ("18/20" is both 18 and 20). Bras use Bra sizes instead; shoes will need their own scale.
_Avoid_: Normalised size, standard size, Amara's Pick size

**Bra size**:
A bra's band in inches and UK cup, written together ("38DD"). A Shopper finds bras by band, and optionally cup, instead of by UK size.
_Avoid_: Bra UK size, cup size (alone)

**Plus size**:
A product made in UK size 18 or above (for a bra, band 38 or above), whether or not that size is in stock today.
_Avoid_: Curve, extended size (except as Range names)

**Review list**:
Products, sizes and Suggested Retailers Amara's Pick could not settle by itself, waiting for Tico to decide. A Size label with no confident UK size is never shown to Shoppers until it is settled here.
_Avoid_: Queue, inbox, moderation

### Stock

**Stock check**:
The regular refresh of whether each product is still available, and in which sizes, at its Retailer.
_Avoid_: Sync, update, crawl

**Live check** (removed at launch, see ADR 0006):
A one-off Stock check of a single product made at the moment a Shopper chooses to go to the Retailer.
_Avoid_: Real-time stock, refresh

**Saved item**:
A Product a Shopper has kept with the heart on its card, listed on her Saved page. A Saved item stays listed, marked sold out, while it is out of stock in her UK size, and goes when the Product is deleted.
_Avoid_: Favourite, wishlist, like, bookmark

**Back-in-stock alert**:
An email to a Shopper when a product she chose comes back in stock in her UK size.
_Avoid_: Notification, restock alert

**Click-out**:
A Shopper leaving Amara's Pick for a Retailer's site to look at or buy a product.
_Avoid_: Redirect, referral, outbound click

**Wrong-Product report**:
A Shopper telling Amara's Pick that a Product she saw was sold out, in the wrong size, not plus size, or had a broken link. It puts the Product on the Review list.
_Avoid_: Flag, complaint, feedback

**Accuracy number**:
The weekly share of Click-outs that found her UK size in stock, and of spot-checked Products whose UK sizes matched the Retailer, shown to Shoppers.
_Avoid_: Score, rating, quality metric

### Placement

**Region**:
One area of the UK a Shopper is treated as shopping from, used to choose what a Slot shows her.
_Avoid_: Area, location, zone

**Slot**:
A named space on a Amara's Pick page whose content can change by Region or be sold (home-hero, category-top-row).
_Avoid_: Ad space, banner, position

**Placement**:
A Slot sold to a Retailer for a fixed period, optionally in one Region, always shown labelled as Sponsored.
_Avoid_: Ad, booking, sponsorship
