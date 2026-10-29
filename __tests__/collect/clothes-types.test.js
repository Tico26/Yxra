const { sortByRules } = require("../../lib/sorting");
const { CLOTHES_TYPES, clothesTypeFor } = require("../../lib/clothes-types");

const product = (fields) => ({ title: "", description: "", product_type: "", tags: [], ...fields });
const typeOf = (fields) => sortByRules(product(fields), { womenOnly: true }).clothes_type;

describe("Clothes types (spec 0005)", () => {
  test("the nine types, in the order the filters show them", () => {
    expect(CLOTHES_TYPES.map((t) => t.clothes_type)).toEqual([
      "dresses", "tops", "knitwear", "coats", "jeans", "trousers", "skirts", "jumpsuits", "nightwear",
    ]);
    expect(CLOTHES_TYPES.map((t) => t.label)).toEqual([
      "Dresses", "Tops", "Jumpers & cardigans", "Coats & jackets", "Jeans", "Trousers & shorts",
      "Skirts", "Jumpsuits & co-ords", "Nightwear & loungewear",
    ]);
  });

  describe("rule 1: a title naming one type gets it", () => {
    test.each([
      ["Wrap Midi Dress", "dresses"],
      ["Floral Maxi Dresses", "dresses"],
      ["Ribbed Vest Top", "tops"],
      ["Oversized T-Shirt", "tops"],
      ["Broderie Blouse", "tops"],
      ["Longline Tunic", "tops"],
      ["Lace Bodysuit", "tops"],
      ["Satin Cami", "tops"],
      ["Cable Knit Jumper", "knitwear"],
      ["Longline Cardigan", "knitwear"],
      ["Slogan Hoodie", "knitwear"],
      ["Crew Neck Sweatshirt", "knitwear"],
      ["Belted Trench Coat", "coats"],
      ["Tailored Blazer", "coats"],
      ["Quilted Gilet", "coats"],
      ["Utility Shacket", "coats"],
      ["Wide Leg Jeans", "jeans"],
      ["Pull On Jeggings", "jeans"],
      ["Tapered Trousers", "trousers"],
      ["Cotton Leggings", "trousers"],
      ["Linen Shorts", "trousers"],
      ["Cuffed Joggers", "trousers"],
      ["Wide Leg Culottes", "trousers"],
      ["Pleated Midi Skirt", "skirts"],
      ["Denim Skort", "skirts"],
      ["Utility Jumpsuit", "jumpsuits"],
      ["Spot Playsuit", "jumpsuits"],
      ["Cord Dungarees", "jumpsuits"],
      ["Linen Co-ord", "jumpsuits"],
      ["Cotton Pyjamas", "nightwear"],
      ["Jersey Nightdress", "nightwear"],
      ["Waffle Dressing Gown", "nightwear"],
    ])("%s is %s", (title, type) => {
      expect(typeOf({ title })).toBe(type);
    });
  });

  describe("rule 2: with two, the last named before 'with' or 'in' wins", () => {
    test.each([
      ["Jumper Dress", "dresses"],
      ["T-Shirt Dress", "dresses"],
      ["Shirt Dress", "dresses"],
      ["Tunic Top", "tops"],
      ["Denim Jacket", "coats"],
      ["Kimono Jacket", "coats"],
      ["Jumpsuit Shorts", "trousers"],
      ["Skirt and Top Co-ord", "jumpsuits"],
      ["Dress with Shirt Collar", "dresses"],
      ["Skirt in Shirt Print", "skirts"],
      ["Top - Size 30", "tops"],
    ])("%s is %s", (title, type) => {
      expect(typeOf({ title })).toBe(type);
    });
  });

  describe("rule 3: nightwear words win", () => {
    test.each([
      ["Pyjama Set", "nightwear"],
      ["Lounge Shorts", "nightwear"],
      ["Loungewear Hoodie", "nightwear"],
      ["Satin Robe", "nightwear"],
      ["Nightie with Lace Trim", "nightwear"],
    ])("%s is %s", (title, type) => {
      expect(typeOf({ title })).toBe(type);
    });
  });

  describe("rule 4: product type, then tags that agree", () => {
    test("the Retailer's product type when the title names none", () => {
      expect(typeOf({ title: "The Sunday", product_type: "Dresses" })).toBe("dresses");
    });

    test("the title wins over the product type", () => {
      expect(typeOf({ title: "Denim Midi Skirt", product_type: "Denim" })).toBe("skirts");
      expect(typeOf({ title: "Shirt Dress", product_type: "Shirts" })).toBe("dresses");
    });

    test("tags decide when every tag naming a type names the same one", () => {
      expect(typeOf({ title: "The Weekender", tags: ["New In", "Jeans", "Denim jeans"] })).toBe("jeans");
    });

    test("tags that disagree decide nothing", () => {
      expect(typeOf({ title: "The Weekender", tags: ["Dresses", "Tops"] })).toBe(null);
    });

    test("nothing to go on leaves it blank", () => {
      expect(typeOf({ title: "The Weekender" })).toBe(null);
    });
  });

  describe("rule 5: only Clothes get a type", () => {
    test.each([
      ["Swim Dress"],
      ["Bikini Top"],
      ["Sports Bra"],
      ["Yoga Leggings"],
      ["Lace Balcony Bra"],
      ["Shapewear Slip Dress"],
      ["Ankle Boots"],
    ])("%s has none", (title) => {
      expect(typeOf({ title })).toBe(null);
    });

    test("menswear has none", () => {
      expect(sortByRules(product({ title: "Men's Crew Jumper" }), {}).clothes_type).toBe(null);
    });
  });

  test("clothesTypeFor reads text alone, for Products the AI calls Clothes", () => {
    expect(clothesTypeFor({ title: "Jumper Dress", product_type: "", tags: [] })).toBe("dresses");
    expect(clothesTypeFor({ title: "The Weekender", product_type: "", tags: [] })).toBe(null);
  });

  test("every type word also makes a Product Clothes", () => {
    expect(sortByRules(product({ title: "Utility Shacket" }), { womenOnly: true }).category).toBe("clothes");
    expect(sortByRules(product({ title: "Denim Skort" }), { womenOnly: true }).category).toBe("clothes");
  });
});
