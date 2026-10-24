-- Yxra schema. Safe to run repeatedly: `npm run migrate` applies it to an
-- existing database without touching data; `npm run seed` drops everything
-- first and then applies it.

CREATE TABLE IF NOT EXISTS categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL UNIQUE,
  category_description VARCHAR(250)
);

-- A business a Shopper can buy from. Only Retailers Tico added (or approved
-- from Suggested Retailers) are collected; removing one sets removed_at.
CREATE TABLE IF NOT EXISTS retailers (
  retailer_id SERIAL PRIMARY KEY,
  retailer_name VARCHAR(250) NOT NULL,
  site_url VARCHAR(250) NOT NULL UNIQUE,
  source VARCHAR(30) NOT NULL CHECK (source IN ('shopify', 'structured_data')),
  women_only BOOLEAN NOT NULL DEFAULT FALSE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  last_collected_at TIMESTAMPTZ,
  last_error TEXT
);

-- One garment, one colour, one Retailer.
CREATE TABLE IF NOT EXISTS products (
  product_id SERIAL PRIMARY KEY,
  retailer_id INT NOT NULL REFERENCES retailers(retailer_id) ON DELETE CASCADE,
  external_id VARCHAR(250) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  brand VARCHAR(250),
  colour VARCHAR(250),
  product_url VARCHAR(1000) NOT NULL,
  image_url VARCHAR(1000),
  price_in_pence INT,
  product_type VARCHAR(250),
  tags TEXT[] NOT NULL DEFAULT '{}',
  -- Who it is for and what it is: set by the rules, or by the AI or Tico
  -- when the rules could not tell. excluded_as names a kind Yxra does not
  -- show (shoes, accessories).
  audience VARCHAR(20) CHECK (audience IN ('women', 'men', 'other')),
  category VARCHAR(50) REFERENCES categories(category_name),
  excluded_as VARCHAR(50),
  -- Worked out from the fields above and the sizes. shown: a Shopper can
  -- find it. excluded: not for Yxra. unsettled: waits for the AI or Tico.
  sort_status VARCHAR(20) NOT NULL DEFAULT 'unsettled'
    CHECK (sort_status IN ('shown', 'excluded', 'unsettled')),
  sort_reason VARCHAR(250),
  -- Hash of title, description and Size labels. The AI is asked again only
  -- when this changes.
  text_hash VARCHAR(64) NOT NULL DEFAULT '',
  ai_asked_hash VARCHAR(64),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  missing_since TIMESTAMPTZ,
  UNIQUE (retailer_id, external_id)
);

-- One row per Size label of a Product. A label can cover several UK sizes.
CREATE TABLE IF NOT EXISTS product_sizes (
  product_size_id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  size_label VARCHAR(100) NOT NULL,
  uk_sizes INT[] NOT NULL DEFAULT '{}',
  -- translated: uk_sizes is confident. unsettled: waits for the AI or Tico.
  size_status VARCHAR(20) NOT NULL DEFAULT 'unsettled'
    CHECK (size_status IN ('translated', 'unsettled')),
  in_stock BOOLEAN NOT NULL DEFAULT FALSE,
  variant_refs TEXT[] NOT NULL DEFAULT '{}',
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, size_label)
);

-- Changes to existing tables below check first and only run when needed:
-- even a no-op ALTER TABLE or CREATE INDEX waits for every open write on the
-- table, and a Stock check holds one for as long as it saves a Retailer.

-- A Bra size label ("38DD") has no UK size; it is found by band and cup.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'product_sizes' AND column_name = 'bra_band') THEN
    ALTER TABLE product_sizes ADD COLUMN bra_band INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'product_sizes' AND column_name = 'bra_cup') THEN
    ALTER TABLE product_sizes ADD COLUMN bra_cup VARCHAR(2);
  END IF;
END $$;

-- Known translations of a Brand's Size label: from the Brand's size chart,
-- settled by Tico, or answered by the AI. uk_sizes is empty when the AI was
-- not confident, which keeps the label on the Review list.
CREATE TABLE IF NOT EXISTS size_translations (
  brand_key VARCHAR(250) NOT NULL,
  size_label_key VARCHAR(100) NOT NULL,
  uk_sizes INT[] NOT NULL DEFAULT '{}',
  source VARCHAR(20) NOT NULL CHECK (source IN ('chart', 'tico', 'ai')),
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_key, size_label_key)
);

CREATE TABLE IF NOT EXISTS suggested_retailers (
  suggested_retailer_id SERIAL PRIMARY KEY,
  retailer_name VARCHAR(250) NOT NULL,
  site_url VARCHAR(250) NOT NULL UNIQUE,
  source VARCHAR(30) NOT NULL CHECK (source IN ('shopify', 'structured_data')),
  found_via TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  suggested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS click_outs (
  click_out_id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(product_id) ON DELETE SET NULL,
  uk_size INT,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('sent', 'sold_out', 'check_failed')),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A Click-out names her UK size, or for a bra her band and cup.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'click_outs' AND column_name = 'uk_size' AND is_nullable = 'NO') THEN
    ALTER TABLE click_outs ALTER COLUMN uk_size DROP NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'click_outs' AND column_name = 'bra_band') THEN
    ALTER TABLE click_outs ADD COLUMN bra_band INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'click_outs' AND column_name = 'bra_cup') THEN
    ALTER TABLE click_outs ADD COLUMN bra_cup VARCHAR(2);
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('product_sizes_uk_sizes_idx') IS NULL THEN
    CREATE INDEX product_sizes_uk_sizes_idx ON product_sizes USING GIN (uk_sizes);
  END IF;
  IF to_regclass('product_sizes_bra_band_idx') IS NULL THEN
    CREATE INDEX product_sizes_bra_band_idx ON product_sizes (bra_band);
  END IF;
  IF to_regclass('products_retailer_idx') IS NULL THEN
    CREATE INDEX products_retailer_idx ON products (retailer_id);
  END IF;
END $$;
