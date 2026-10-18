const fs = require("fs");
const path = require("path");
const {
  parseProductPage,
  readStructuredData,
  liveCheckStructuredData,
} = require("../../lib/collect/structured-data");

const FIXTURES = path.join(__dirname, "../fixtures/structured-data");
const fixture = (name) => fs.readFileSync(path.join(FIXTURES, name), "utf8");
const SITE = "https://curve-house.example";

// A Retailer's site made of saved pages; a missing page answers 404.
const savedSite = (pages, { sitemaps = [] } = {}) => {
  const asked = [];
  return {
    asked,
    sitemapsFor: async () => sitemaps,
    getText: async (url) => {
      asked.push(url);
      if (!(url in pages)) throw new Error(`${url} answered 404`);
      return pages[url];
    },
  };
};

const site = (extra = {}) =>
  savedSite({
    [`${SITE}/sitemap.xml`]: fixture("sitemap.xml"),
    [`${SITE}/sitemap-products-1.xml`]: fixture("sitemap-products-1.xml"),
    [`${SITE}/sitemap-pages.xml`]: fixture("sitemap-pages.xml"),
    [`${SITE}/p/tea-dress`]: fixture("tea-dress.html"),
    [`${SITE}/p/swim-dress`]: fixture("swim-dress.html"),
    [`${SITE}/about`]: fixture("about.html"),
    ...extra,
  });

describe("parseProductPage", () => {
  test("R3: each colour in a product group becomes its own Product", () => {
    const products = parseProductPage(fixture("tea-dress.html"), `${SITE}/p/tea-dress`);
    expect(products.map((p) => [p.title, p.colour])).toEqual([
      ["Floral Tea Dress", "Navy"],
      ["Floral Tea Dress", "Red"],
    ]);
    const [navy, red] = products;
    expect(navy).toMatchObject({
      external_id: "TD100:navy",
      brand: "Curve House",
      product_type: "Dresses",
      description: "A flowing tea dress & flutter sleeves.",
      image_url: "https://img.example/td-navy.jpg",
      product_url: `${SITE}/p/tea-dress?colour=navy`,
      price_in_pence: 3900,
      sizes: [
        { size_label: "18", in_stock: true, variant_refs: ["TD100-NAV-18"] },
        { size_label: "20", in_stock: false, variant_refs: ["TD100-NAV-20"] },
      ],
    });
    expect(red).toMatchObject({
      image_url: "https://img.example/td-red.jpg",
      price_in_pence: 3500,
      sizes: [{ size_label: "20", in_stock: true, variant_refs: ["TD100-RED-20"] }],
    });
  });

  test("reads a single Product inside an @graph", () => {
    const [swim] = parseProductPage(fixture("swim-dress.html"), `${SITE}/p/swim-dress`);
    expect(swim).toMatchObject({
      title: "Tummy Control Swim Dress",
      colour: "Black",
      brand: "Curve House",
      price_in_pence: 4500,
      sizes: [{ size_label: "UK 22", in_stock: true, variant_refs: ["SW55"] }],
    });
  });

  test("a page with no product data gives no Products", () => {
    expect(parseProductPage(fixture("about.html"), `${SITE}/about`)).toEqual([]);
    expect(parseProductPage("<script type=\"application/ld+json\">{oops</script>", SITE)).toEqual([]);
  });
});

describe("readStructuredData", () => {
  test("finds product pages through the sitemap and reads each one", async () => {
    const web = site();
    const products = await readStructuredData({ site_url: SITE }, web);
    expect(products.map((p) => `${p.title} (${p.colour})`)).toEqual([
      "Floral Tea Dress (Navy)",
      "Floral Tea Dress (Red)",
      "Tummy Control Swim Dress (Black)",
    ]);
    // Product sitemaps are preferred, so the About page is never fetched.
    expect(web.asked).not.toContain(`${SITE}/about`);
  });

  test("uses the sitemaps robots.txt names", async () => {
    const web = savedSite(
      {
        [`${SITE}/products.xml`]: fixture("sitemap-products-1.xml"),
        [`${SITE}/p/tea-dress`]: fixture("tea-dress.html"),
        [`${SITE}/p/swim-dress`]: fixture("swim-dress.html"),
      },
      { sitemaps: [`${SITE}/products.xml`] }
    );
    const products = await readStructuredData({ site_url: SITE }, web);
    expect(products).toHaveLength(3);
  });

  test("R6: fails as a whole when most product pages fail, so last known stock is kept", async () => {
    const web = savedSite({
      [`${SITE}/sitemap.xml`]: fixture("sitemap-products-1.xml"),
    });
    await expect(readStructuredData({ site_url: SITE }, web)).rejects.toThrow(/pages failed/);
  });
});

describe("liveCheckStructuredData", () => {
  test("reads the Product's page again and reports each Size label's stock", async () => {
    const [navy] = parseProductPage(fixture("tea-dress.html"), `${SITE}/p/tea-dress`);
    const soldOut = fixture("tea-dress.html").replace(
      '"price": "39.00", "priceCurrency": "GBP", "availability": "https://schema.org/InStock"',
      '"price": "39.00", "priceCurrency": "GBP", "availability": "https://schema.org/OutOfStock"'
    );
    const web = savedSite({ [`${SITE}/p/tea-dress?colour=navy`]: soldOut });
    const live = await liveCheckStructuredData(
      { product_url: navy.product_url, external_id: navy.external_id },
      [{ size_label: "18", variant_refs: ["TD100-NAV-18"] }],
      web
    );
    expect(live).toEqual(new Map([["18", false]]));
  });
});
