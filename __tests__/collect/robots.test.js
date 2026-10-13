const { parseRobots } = require("../../lib/collect/robots");

describe("robots.txt rules", () => {
  const robots = parseRobots(`
User-agent: *
Disallow: /admin
Disallow: /cart
Allow: /cart/shared
Disallow: /*.oembed$
Sitemap: https://shop.example/sitemap.xml

User-agent: BadBot
Disallow: /
`);

  test("allows paths no rule mentions", () => {
    expect(robots.isAllowed("/products.json?page=2", "Yxra")).toBe(true);
  });

  test("refuses paths under a Disallow", () => {
    expect(robots.isAllowed("/admin/settings", "Yxra")).toBe(false);
  });

  test("the longest matching rule wins", () => {
    expect(robots.isAllowed("/cart/shared/1", "Yxra")).toBe(true);
    expect(robots.isAllowed("/cart/1", "Yxra")).toBe(false);
  });

  test("supports * and $ in rules", () => {
    expect(robots.isAllowed("/products/dress.oembed", "Yxra")).toBe(false);
    expect(robots.isAllowed("/products/dress.oembed.html", "Yxra")).toBe(true);
  });

  test("a group naming the agent replaces the * group", () => {
    expect(robots.isAllowed("/products.json", "BadBot")).toBe(false);
    const yxraOnly = parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: yxra\nDisallow: /admin\n");
    expect(yxraOnly.isAllowed("/products.json", "Yxra")).toBe(true);
  });

  test("lists the sitemaps it names", () => {
    expect(robots.sitemaps).toEqual(["https://shop.example/sitemap.xml"]);
  });

  test("an empty robots.txt allows everything", () => {
    expect(parseRobots("").isAllowed("/anything", "Yxra")).toBe(true);
  });
});
