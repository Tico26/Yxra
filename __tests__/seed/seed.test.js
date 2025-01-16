const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");

beforeAll(() => seed(data));
afterAll(() => db.end());

describe("seed", () => {
  describe("category table", () => {
    test("categories table exists", () => {
      return db
        .query(
          `SELECT EXISTS(
                    SELECT FROM information_schema.tables
                    WHERE
                        table_name = 'categories');`
        )
        .then(({ rows: [{ exists }] }) => {
          expect(exists).toBe(true);
        });
    });
    test("categories table has category_id column as its serial primary key", () => {
      return db
        .query(
          `SELECT column_name, data_type, column_default
                    FROM information_schema.columns
                    WHERE table_name = 'categories'
                    AND column_name = 'category_id';`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("category_id");
          expect(column.data_type).toBe("integer");
          expect(column.column_default).toBe(
            "nextval('categories_category_id_seq'::regclass)"
          );
        });
    });
    test("categories table has category_name", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'categories'
                AND column_name = 'category_name'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("category_name");
        });
    });
    test("categories table has category_description", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'categories'
                AND column_name = 'category_description'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("category_description");
        });
    });
  });

  describe("shop table", () => {
    test("shop table exists", () => {
      return db
        .query(
          `SELECT EXISTS(
                    SELECT FROM information_schema.tables
                    WHERE
                        table_name = 'shops');`
        )
        .then(({ rows: [{ exists }] }) => {
          expect(exists).toBe(true);
        });
    });
    test("shop table has shop_id column as its serial primary key", () => {
      return db
        .query(
          `SELECT column_name, data_type, column_default
                    FROM information_schema.columns
                    WHERE table_name = 'shops'
                    AND column_name = 'shop_id';`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("shop_id");
          expect(column.data_type).toBe("integer");
          expect(column.column_default).toBe(
            "nextval('shops_shop_id_seq'::regclass)"
          );
        });
    });
    test("shops table has shop_name column", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'shops'
                AND column_name = 'shop_name'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("shop_name");
        });
    });
    test("shops table has shop_url column", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'shops'
                AND column_name = 'shop_url'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("shop_url");
        });
    });
    test("shops table has location column", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'shops'
                AND column_name = 'location'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("location");
        });
    });
    test("shops table has category_id column ", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'shops'
                AND column_name = 'category_id'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("category_id");
        });
    });
  });

  describe("products table", () => {
    test("products table exists", () => {
      return db
        .query(
          `SELECT EXISTS(
                    SELECT FROM information_schema.tables
                    WHERE
                        table_name = 'products');`
        )
        .then(({ rows: [{ exists }] }) => {
          expect(exists).toBe(true);
        });
    });
    test("products table has product_id column as its serial primary key", () => {
      return db
        .query(
          `SELECT column_name, data_type, column_default
                    FROM information_schema.columns
                    WHERE table_name = 'products'
                    AND column_name = 'product_id';`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("product_id");
          expect(column.data_type).toBe("integer");
          expect(column.column_default).toBe(
            "nextval('products_product_id_seq'::regclass)"
          );
        });
    });
    test("products table has product_name column", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'product_name'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("product_name");
        });
    });
    test("products table has product_url column", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'product_url'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("product_url");
        });
    });
    test("products table has image column", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'image'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("image");
        });
    });
    test("products table has price_in_pence column ", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'price_in_pence'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("price_in_pence");
        });
    });
    test("products table has product_description column ", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'product_description'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("product_description");
        });
    });
    test("products table has size column ", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'size'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("size");
        });
    });
    test("products table has colour column ", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'colour'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("colour");
        });
    });
    test("products table has product_category column ", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'product_category'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("product_category");
        });
    });
    test("products table has shop_id column ", () => {
      return db
        .query(
          `SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products'
                AND column_name = 'shop_id'`
        )
        .then(({ rows: [column] }) => {
          expect(column.column_name).toBe("shop_id");
        });
    });
  });

  describe("data insertion", () => {
    test("categories data has been inserted correctly", () => {
      return db
        .query(`SELECT * FROM categories;`)
        .then(({ rows: categories }) => {
          expect(categories).toHaveLength(4);
          categories.forEach((category) => {
            expect(category).toHaveProperty("category_id");
            expect(category).toHaveProperty("category_name");
            expect(category).toHaveProperty("category_description");
          });
        });
    });
    test("shops data has been inserted correctly", () => {
      return db.query(`SELECT * FROM shops;`).then(({ rows: shops }) => {
        expect(shops).toHaveLength(6);
        shops.forEach((shop) => {
          expect(shop).toHaveProperty("shop_id");
          expect(shop).toHaveProperty("shop_name");
          expect(shop).toHaveProperty("shop_url");
          expect(shop).toHaveProperty("location");
          expect(shop).toHaveProperty("category_id", expect.any(Number));
        });
      });
    });
    test("products data has been inserted correctly", () => {
      return db.query(`SELECT * FROM products;`).then(({ rows: products }) => {
        expect(products).toHaveLength(6);
        products.forEach((product) => {
          expect(product).toHaveProperty("product_id");
          expect(product).toHaveProperty("product_name");
          expect(product).toHaveProperty("product_description");
          expect(product).toHaveProperty("product_url");
          expect(product).toHaveProperty("image");
          expect(product).toHaveProperty("price_in_pence");
          expect(product).toHaveProperty("size");
          expect(product).toHaveProperty("colour");
          expect(product).toHaveProperty("product_category");
          expect(product).toHaveProperty("shop_id", expect.any(Number));
        });
      });
    });
  });
});
