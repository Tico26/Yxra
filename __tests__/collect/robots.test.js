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
    expect(robots.isAllowed("/products.json?page=2", "AmarasPick")).toBe(true);
  });

  test("refuses paths under a Disallow", () => {
    expect(robots.isAllowed("/admin/settings", "AmarasPick")).toBe(false);
  });

  test("the longest matching rule wins", () => {
    expect(robots.isAllowed("/cart/shared/1", "AmarasPick")).toBe(true);
    expect(robots.isAllowed("/cart/1", "AmarasPick")).toBe(false);
  });

  test("supports * and $ in rules", () => {
    expect(robots.isAllowed("/products/dress.oembed", "AmarasPick")).toBe(false);
    expect(robots.isAllowed("/products/dress.oembed.html", "AmarasPick")).toBe(true);
  });

  test("a group naming the agent replaces the * group", () => {
    expect(robots.isAllowed("/products.json", "BadBot")).toBe(false);
    const amarasPickOnly = parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: amaraspick\nDisallow: /admin\n");
    expect(amarasPickOnly.isAllowed("/products.json", "AmarasPick")).toBe(true);
  });

  test("lists the sitemaps it names", () => {
    expect(robots.sitemaps).toEqual(["https://shop.example/sitemap.xml"]);
  });

  test("an empty robots.txt allows everything", () => {
    expect(parseRobots("").isAllowed("/anything", "AmarasPick")).toBe(true);
  });
});
