const db = require("./connection");

const format = require("pg-format");

const seed = ({ products, categories, shops }) => {
  return db
    .query("DROP TABLE IF EXISTS products")
    .then(() => {
      return db.query("DROP TABLE IF EXISTS shops");
    })
    .then(() => {
      return db.query("DROP TABLE IF EXISTS categories");
    })
    .then(() => {
      return createCategory();
    })
    .then(() => {
      return createShop();
    })
    .then(() => {
      return createProduct();
    })
    .then(() => {
      return insertCategory(categories);
    })
    .then(({ rows }) => {
      modifyShops(rows, shops);
    })
    .then(() => {
      return insertShops(shops);
    })
    .then(({ rows }) => {
      return modifyProducts(rows, products);
    })
    .then(() => {
      return insertProducts(products);
    });
};
const createCategory = () => {
  return db.query(`CREATE TABLE categories
          (category_id SERIAL PRIMARY KEY,
          category_name VARCHAR (250) NOT NULL,
          category_description VARCHAR(250))`);
};

const createShop = () => {
  return db.query(`CREATE TABLE shops
          (shop_id SERIAL PRIMARY KEY,
          shop_name VARCHAR (250) NOT NULL,
          shop_url VARCHAR (250) NOT NULL,
          location VARCHAR (250),

          category_id INT REFERENCES categories(category_id)
          )`);
};
const createProduct = () => {
  return db.query(`CREATE TABLE products
    (product_id SERIAL PRIMARY KEY,
    product_url VARCHAR (250) NOT NULL,
    image VARCHAR (250) NOT NULL,
    product_name VARCHAR (250) NOT NULL,
    price_in_pence INT,
    product_description VARCHAR (250),
    size VARCHAR (250),
    colour VARCHAR (250),
    product_category VARCHAR(250) NOT NULL,
    shop_id INT REFERENCES shops(shop_id)
    )`);
};

const insertCategory = (categories) => {
  const formattedCategories = categories.map((category) => {
    return [category.category_name, category.category_description];
  });

  const insertCategories = format(
    `INSERT INTO categories(category_name, category_description)
    VALUES %L
    RETURNING *`,
    formattedCategories
  );
  return db.query(insertCategories);
};

const modifyShops = (categories, shops) => {
  const updatedShops = shops.map((shop) => {
    categories.forEach((category) => {
      if (category.category_name === shop.shop_category) {
        shop.category_id = category.category_id;
        delete shop.category_name;
      }
    });
    return shop;
  });
  return updatedShops;
};

const insertShops = (shops) => {
  const formattedShops = shops.map((shop) => {
    return [shop.shop_name, shop.shop_url, shop.location, shop.category_id];
  });

  const insertedShops = format(
    `INSERT INTO shops(shop_name, shop_url,location,category_id)
      VALUES %L
      RETURNING *`,
    formattedShops
  );
  return db.query(insertedShops);
};

const modifyProducts = (shops, products) => {
  const updatedProducts = products.map((product) => {
    shops.forEach((shop) => {
      if (product.shop_name === shop.shop_name) {
        product.shop_id = shop.shop_id;
        delete product.shop_name;
      }
    });
    return product;
  });
  return updatedProducts;
};

const insertProducts = (products) => {
  const formattedProducts = products.map((product) => {
    return [
      product.product_url,
      product.image,
      product.product_name,
      product.price_in_pence,
      product.product_description,
      product.size,
      product.colour,
      product.category,
      product.shop_id,
    ];
  });
  const insertedProducts = format(
    `INSERT INTO products(product_url,image,product_name,price_in_pence, product_description,size,colour,product_category,shop_id)
    VALUES %L
    RETURNING *
    `,
    formattedProducts
  );
  return db.query(insertedProducts);
};

module.exports = seed;
