const sharp = require("sharp");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const {
  runShopPhotoCheck,
  categorise,
  measurePhoto,
  photoToFetch,
} = require("../../lib/shop-photos");

beforeEach(() => seed(data));
afterAll(() => db.end());

// A studio shot: a dark garment in the middle of a plain light background.
const studioPhoto = (width = 1000, height = 1500) =>
  sharp({ create: { width, height, channels: 3, background: "#f4f4f2" } })
    .composite([
      {
        input: {
          create: {
            width: Math.round(width / 2),
            height: Math.round(height / 2),
            channels: 3,
            background: "#202040",
          },
        },
        gravity: "center",
      },
    ])
    .jpeg()
    .toBuffer();

// A lifestyle shot: a busy scene (patches of different colours, 25px
// across) right to the edges.
const busyPhoto = async (width = 1000, height = 1500) => {
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const patch = Math.floor(x / 25) * 31 + Math.floor(y / 25) * 17;
      for (let c = 0; c < 3; c++) pixels[(y * width + x) * 3 + c] = (patch * (c + 3) * 47) % 256;
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } }).jpeg().toBuffer();
};

const STUDIO = { width: 1000, height: 1500, plain: true };

describe("measurePhoto", () => {
  test("reads the size and finds plain corners on a studio shot", async () => {
    expect(await measurePhoto(await studioPhoto())).toEqual(STUDIO);
  });

  test("a busy scene does not have plain corners", async () => {
    expect((await measurePhoto(await busyPhoto())).plain).toBe(false);
  });
});

describe("categorise: two distinct categories", () => {
  const photos = (n, photo = STUDIO) => Array(n).fill(photo);

  test("studio only when every check passes", () => {
    expect(categorise(photos(20), Array(20).fill(4)).category).toBe("studio");
  });

  test("half the photos on a plain background is enough", () => {
    const measured = [...photos(10), ...photos(10, { ...STUDIO, plain: false })];
    expect(categorise(measured, Array(20).fill(4)).category).toBe("studio");
  });

  test.each([
    ["shapes differ", [...photos(14), ...photos(6, { ...STUDIO, height: 1000 })], Array(20).fill(4)],
    ["photos are small", photos(20, { ...STUDIO, width: 600, height: 900 }), Array(20).fill(4)],
    ["too few photos per item", photos(20), Array(20).fill(2)],
    ["photo counts not known", photos(20), Array(20).fill(null)],
    ["over half have busy backgrounds", [...photos(9), ...photos(11, { ...STUDIO, plain: false })], Array(20).fill(4)],
  ])("mixed when %s", (_, measured, counts) => {
    const result = categorise(measured, counts);
    expect(result.category).toBe("mixed");
    expect(result.note).toMatch(/\(fails\)/);
  });

  test("too few photos read to judge: no category", () => {
    expect(categorise(photos(9), Array(9).fill(4))).toBeNull();
  });
});

describe("runShopPhotoCheck", () => {
  const fetcherFor = (bytesFor) => ({ getBytes: async (url) => bytesFor(url) });

  test("puts each current Retailer in a category and leaves it for a week", async () => {
    await db.query(`UPDATE products SET photo_count = 4, image_url = 'https://img.example/' || product_id || '.jpg'`);
    const studio = await studioPhoto();
    // The fixtures have only a few Products per Retailer, so judge from every photo read.
    const measured = [];
    const measure = async (bytes) => {
      const m = await measurePhoto(bytes);
      measured.push(m);
      return m;
    };
    const { rows: shops } = await db.query(
      `SELECT r.retailer_id, count(p.product_id) AS shown FROM retailers r
       LEFT JOIN products p ON p.retailer_id = r.retailer_id AND p.sort_status = 'shown'
       WHERE r.removed_at IS NULL GROUP BY r.retailer_id`
    );
    // Give the first Retailer enough Products to be judged.
    const first = shops[0].retailer_id;
    for (let n = 0; n < 12; n++) {
      await db.query(
        `INSERT INTO products (retailer_id, external_id, title, product_url, image_url, photo_count, sort_status)
         VALUES ($1, $2, 'Dress', 'https://shop.example/d', 'https://img.example/x.jpg', 4, 'shown')`,
        [first, `extra-${n}`]
      );
    }
    const summary = await runShopPhotoCheck({ fetcher: fetcherFor(async () => studio), measure, log: () => {} });
    expect(summary.studio).toHaveLength(1);
    const { rows } = await db.query(`SELECT photo_category, photo_checked_at FROM retailers WHERE retailer_id = $1`, [first]);
    expect(rows[0].photo_category).toBe("studio");

    const again = await runShopPhotoCheck({ fetcher: fetcherFor(async () => studio), log: () => {} });
    expect(again.studio).toEqual([]);
  });

  test("a photo that cannot be fetched is skipped, not fatal", async () => {
    const summary = await runShopPhotoCheck({
      fetcher: fetcherFor(async () => {
        throw new Error("404");
      }),
      log: () => {},
    });
    expect(summary.studio).toEqual([]);
    expect(summary.mixed).toEqual([]);
  });
});

test("Shopify photos are fetched at most 1000px wide; others as they are", () => {
  expect(photoToFetch("https://cdn.shopify.com/s/files/1/dress.jpg?v=1")).toBe(
    "https://cdn.shopify.com/s/files/1/dress.jpg?v=1&width=1000"
  );
  expect(photoToFetch("https://img.example/dress.jpg")).toBe("https://img.example/dress.jpg");
});
