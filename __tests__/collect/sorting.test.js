const { sortByRules, decideStatus } = require("../../lib/sorting");

const product = (fields) => ({ title: "", description: "", product_type: "", tags: [], ...fields });

describe("sortByRules (R7)", () => {
  test.each([
    ["Wrap Midi Dress", "clothes"],
    ["Ribbed Vest Top", "clothes"],
    ["Wide Leg Jeans", "clothes"],
    ["Tankini Set", "swimwear"],
    ["Ruched Swimsuit", "swimwear"],
    ["Swim Shorts", "swimwear"],
    ["Sports Bra", "activewear"],
    ["Yoga Leggings", "activewear"],
    ["Lace Balcony Bra", "lingerie"],
    ["High Waist Briefs 3 Pack", "lingerie"],
    ["Smoothing Shapewear Slip", "lingerie"],
    ["Gym Bag", null],
  ])("%s is %s", (title, category) => {
    const sorted = sortByRules(product({ title }), { womenOnly: true });
    expect(sorted.category).toBe(category);
  });

  test.each([
    ["Lace Balcony Bra", null],
    ["Wide Fit Ankle Boots", "shoes"],
    ["Leather Sandals", "shoes"],
    ["Gym Bag", "accessories"],
    ["Bikini Bag", "accessories"],
    ["Gift Card", "accessories"],
    ["Cap Sleeve Dress", null],
  ])("%s is excluded as %s", (title, excluded) => {
    expect(sortByRules(product({ title }), { womenOnly: true }).excluded_as).toBe(excluded);
  });

  test("a sports bra is activewear even when the Retailer files it under Bras", () => {
    const sorted = sortByRules(product({ title: "High Impact Sports Bra", product_type: "Bras" }), {});
    expect(sorted.category).toBe("activewear");
  });

  test("the Retailer's product type is trusted over the title", () => {
    const sorted = sortByRules(product({ title: "The Sunday", product_type: "Dresses" }), {});
    expect(sorted.category).toBe("clothes");
  });

  test("tags count as well as the title", () => {
    const sorted = sortByRules(product({ title: "The Sunday", tags: ["Swimwear", "New In"] }), {});
    expect(sorted.category).toBe("swimwear");
  });

  test("a title the rules cannot read leaves the category unsettled", () => {
    expect(sortByRules(product({ title: "The Weekender" }), { womenOnly: true })).toEqual({
      audience: "women",
      category: null,
      clothes_type: null,
      excluded_as: null,
    });
  });

  test.each([
    ["Men's Crew Jumper", "men"],
    ["Mens Swim Shorts", "men"],
    ["Girls Party Dress", "other"],
    ["Womens Wrap Dress", "women"],
    ["Ladies Tunic", "women"],
  ])("%s is for %s", (title, audience) => {
    expect(sortByRules(product({ title }), { womenOnly: false }).audience).toBe(audience);
  });

  test("a women-only Retailer's Products are for women unless they say otherwise", () => {
    expect(sortByRules(product({ title: "Wrap Dress" }), { womenOnly: true }).audience).toBe("women");
    expect(sortByRules(product({ title: "Wrap Dress" }), { womenOnly: false }).audience).toBe(null);
    expect(sortByRules(product({ title: "Men's Shirt" }), { womenOnly: true }).audience).toBe("men");
  });

  test("a shop's Gender_Mens tag makes it menswear, even at a women-only Retailer", () => {
    const pant = product({ title: "Carhartt WIP Module Pant", product_type: "TROUSERS", tags: ["Gender_Mens"] });
    expect(sortByRules(pant, { womenOnly: true }).audience).toBe("men");
    const jacket = product({ title: "Barbour Beaufort Wax Jacket", tags: ["Gender_Womens"] });
    expect(sortByRules(jacket, { womenOnly: false }).audience).toBe("women");
    const cap = product({ title: "Logo Cap", tags: ["Gender_Mens", "Gender_Womens"] });
    expect(sortByRules(cap, { womenOnly: false }).audience).toBe("women");
  });

  test("the title wins over the shop's tags", () => {
    const kaftan = product({ title: "Damask Boubou & Kaftan Two Piece Set for Men", tags: ["female", "women"] });
    expect(sortByRules(kaftan, { womenOnly: true }).audience).toBe("men");
    const jumper = product({ title: "Ladies Button Stripe Crew Jumper", tags: ["mens t-shirt"] });
    expect(sortByRules(jumper, { womenOnly: false }).audience).toBe("women");
  });
});

describe("decideStatus (R10)", () => {
  const settled = { audience: "women", category: "clothes", excluded_as: null };
  const size = (uk_sizes, extra = {}) => ({
    uk_sizes,
    size_status: uk_sizes.length ? "translated" : "unsettled",
    in_stock: false,
    ...extra,
  });

  test("women's clothes made in UK 18 or above are shown, whatever is in stock today", () => {
    expect(decideStatus(settled, [size([16]), size([18])]).sort_status).toBe("shown");
  });

  test("a garment made only below UK 18 is excluded", () => {
    expect(decideStatus(settled, [size([12], { in_stock: true }), size([16])])).toEqual({
      sort_status: "excluded",
      sort_reason: "not made in UK 18 or above (or bra band 38)",
    });
  });

  test("a Size label covering 16 and 18 counts as Plus size", () => {
    expect(decideStatus(settled, [size([16, 18])]).sort_status).toBe("shown");
  });

  describe("bras", () => {
    const lingerie = { ...settled, category: "lingerie" };
    const bra = (bra_band, bra_cup = "DD") => size([], { size_status: "translated", bra_band, bra_cup });

    test("a bra made in band 38 or above is Plus size and shown", () => {
      expect(decideStatus(lingerie, [bra(34), bra(38)]).sort_status).toBe("shown");
    });

    test("a bra made only below band 38 is excluded", () => {
      expect(decideStatus(lingerie, [bra(32), bra(36, "G")])).toEqual({
        sort_status: "excluded",
        sort_reason: "not made in UK 18 or above (or bra band 38)",
      });
    });

    test("a bra with a size not yet translated stays unsettled", () => {
      expect(decideStatus(lingerie, [bra(36), size([])]).sort_status).toBe("unsettled");
    });
  });

  test("lingerie is shown like clothes when it is Plus size", () => {
    expect(decideStatus({ ...settled, category: "lingerie" }, [size([20])]).sort_status).toBe("shown");
  });

  test("shoes and menswear are excluded", () => {
    expect(decideStatus({ ...settled, excluded_as: "shoes" }, [size([20])]).sort_status).toBe("excluded");
    expect(decideStatus({ ...settled, audience: "men" }, [size([20])]).sort_status).toBe("excluded");
  });

  test("unsettled when the audience, category or Plus size is not yet known", () => {
    expect(decideStatus({ ...settled, category: null }, [size([20])]).sort_status).toBe("unsettled");
    expect(decideStatus({ ...settled, audience: null }, [size([20])]).sort_status).toBe("unsettled");
    expect(decideStatus(settled, [size([16]), size([])]).sort_status).toBe("unsettled");
  });
});
