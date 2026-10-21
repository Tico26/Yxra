# Yxra

Yxra helps plus-size women in the UK find clothes in their size across many retailers, see what is still in stock, and go straight to where they can buy it. Yxra sells nothing itself.

## Language

### People

**Shopper**:
A plus-size woman browsing Yxra to find clothes in her size. Menswear is out of scope for now.
_Avoid_: User, customer, visitor

### Who sells

**Retailer**:
A business a Shopper can buy from, online or in person (ASOS, Yours).
_Avoid_: Shop, store, merchant

**Suggested Retailer**:
A shop Yxra found by itself that waits for Tico's approval before it becomes a Retailer. Tico can also add a Retailer directly.
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
Yxra's single standard size scale for clothing, swimwear and activewear, which every Size label is translated onto so one size can be searched across all Retailers. One Size label can translate to more than one UK size ("18/20" is both 18 and 20). Lingerie and shoes will need their own scales.
_Avoid_: Normalised size, standard size, Yxra size

**Plus size**:
A product made in UK size 18 or above, whether or not that size is in stock today.
_Avoid_: Curve, extended size (except as Range names)

**Review list**:
Products, sizes and Suggested Retailers Yxra could not settle by itself, waiting for Tico to decide. A Size label with no confident UK size is never shown to Shoppers until it is settled here.
_Avoid_: Queue, inbox, moderation

### Stock

**Stock check**:
The regular refresh of whether each product is still available, and in which sizes, at its Retailer.
_Avoid_: Sync, update, crawl

**Live check** (removed at launch, see ADR 0006):
A one-off Stock check of a single product made at the moment a Shopper chooses to go to the Retailer.
_Avoid_: Real-time stock, refresh

**Back-in-stock alert**:
An email to a Shopper when a product she chose comes back in stock in her UK size.
_Avoid_: Notification, restock alert

**Click-out**:
A Shopper leaving Yxra for a Retailer's site to look at or buy a product.
_Avoid_: Redirect, referral, outbound click

**Wrong-Product report**:
A Shopper telling Yxra that a Product she saw was sold out, in the wrong size, not plus size, or had a broken link. It puts the Product on the Review list.
_Avoid_: Flag, complaint, feedback

**Accuracy number**:
The weekly share of Click-outs that found her UK size in stock, and of spot-checked Products whose UK sizes matched the Retailer, shown to Shoppers.
_Avoid_: Score, rating, quality metric

### Placement

**Region**:
One area of the UK a Shopper is treated as shopping from, used to choose what a Slot shows her.
_Avoid_: Area, location, zone

**Slot**:
A named space on a Yxra page whose content can change by Region or be sold (home-hero, category-top-row).
_Avoid_: Ad space, banner, position

**Placement**:
A Slot sold to a Retailer for a fixed period, optionally in one Region, always shown labelled as Sponsored.
_Avoid_: Ad, booking, sponsorship
