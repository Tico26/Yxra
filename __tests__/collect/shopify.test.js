const { parseShopifyProducts, readShopify } = require("../../lib/collect/shopify");
const page1 = require("../fixtures/shopify/products-page-1.json");
const page2 = require("../fixtures/shopify/products-page-2.json");
const page3 = require("../fixtures/shopify/products-page-3.json");

const SITE = "https://northern-curve.example";

describe("parseShopifyProducts", () => {
  const products = parseShopifyProducts(page1.products, SITE);
  const [black, red, vest] = products;

  test("R3: each colour becomes its own Product", () => {
    expect(products.map((p) => [p.title, p.colour])).toEqual([
      ["Wrap Midi Dress", "Black"],
      ["Wrap Midi Dress", "Red"],
      ["Ribbed Vest Top", null],
    ]);
    expect(black.external_id).not.toBe(red.external_id);
  });

  test("R3: each colour has its own photo and link", () => {
    expect(black.image_url).toBe("https://cdn.example/black.jpg");
    expect(red.image_url).toBe("https://cdn.example/red.jpg");
    expect(black.product_url).toBe(`${SITE}/products/wrap-midi-dress?variant=11`);
    expect(red.product_url).toBe(`${SITE}/products/wrap-midi-dress?variant=15`);
  });

  test("R3: each colour has its own sizes in stock", () => {
    expect(black.sizes).toEqual([
      { size_label: "16", in_stock: true, variant_refs: ["11"] },
      { size_label: "18", in_stock: true, variant_refs: ["12"] },
      { size_label: "20", in_stock: false, variant_refs: ["13"] },
      { size_label: "22/24", in_stock: true, variant_refs: ["14"] },
    ]);
    expect(red.sizes.filter((s) => s.in_stock).map((s) => s.size_label)).toEqual(["20"]);
  });

  test("keeps the price (lowest for the colour), Brand, type, tags and plain-text description", () => {
    expect(black).toMatchObject({
      price_in_pence: 3500,
      brand: "Northern Curve",
      product_type: "Dresses",
      tags: ["Plus Size", "Womens", "Dresses"],
      description: "A jersey wrap dress.",
    });
    expect(red.price_in_pence).toBe(3000);
  });

  test("a garment with no colour option is one Product, using its first photo", () => {
    expect(vest.image_url).toBe("https://cdn.example/vest.jpg");
    expect(vest.sizes.map((s) => s.size_label)).toEqual(["3X", "4X"]);
  });

  test("finds Size and Color options whatever order or spelling they use", () => {
    const [tankini] = parseShopifyProducts(page2.products, SITE);
    expect(tankini.colour).toBe("Navy");
    expect(tankini.sizes.map((s) => s.size_label)).toEqual(["UK 18", "UK 20"]);
  });

  test("a bra with separate band and cup options gets one Size label per band and cup", () => {
    const [bra] = parseShopifyProducts(
      [
        {
          id: 501,
          title: "Lace Balcony Bra",
          handle: "lace-balcony-bra",
          vendor: "Lounge Underwear",
          options: [
            { name: "Colour", position: 1 },
            { name: "Band Size", position: 2 },
            { name: "Cup Size", position: 3 },
          ],
          variants: [
            { id: 1, option1: "Black", option2: "38", option3: "DD", available: true, price: "40.00" },
            { id: 2, option1: "Black", option2: "38", option3: "E", available: false, price: "40.00" },
            { id: 3, option1: "Black", option2: "40", option3: "DD", available: true, price: "40.00" },
          ],
          images: [],
        },
      ],
      SITE
    );
    expect(bra.sizes).toEqual([
      { size_label: "38DD", in_stock: true, variant_refs: ["1"] },
      { size_label: "38E", in_stock: false, variant_refs: ["2"] },
      { size_label: "40DD", in_stock: true, variant_refs: ["3"] },
    ]);
  });

  test("a product with no sizes at all is skipped", () => {
    const titles = parseShopifyProducts(page2.products, SITE).map((p) => p.title);
    expect(titles).not.toContain("Gift Card");
  });
});

describe("readShopify", () => {
  test("reads every page of the Retailer's product data", async () => {
    const pages = { 1: page1, 2: page2, 3: page3 };
    const asked = [];
    const fetcher = {
      getJson: async (url) => {
        asked.push(url);
        return pages[new URL(url).searchParams.get("page")];
      },
    };
    const products = await readShopify({ site_url: SITE }, fetcher);
    expect(products.map((p) => p.title)).toEqual([
      "Wrap Midi Dress",
      "Wrap Midi Dress",
      "Ribbed Vest Top",
      "Tankini Set",
    ]);
    expect(asked[0]).toBe(`${SITE}/products.json?limit=250&page=1`);
    expect(asked).toHaveLength(3);
  });
});
