-- Shopper accounts (spec 0004, ADR 0010). Applied by db/migrate.js after
-- schema.sql, and only on Supabase: it needs Supabase Auth's auth.users,
-- auth.uid() and the anon and authenticated roles the browser key signs in as.
--
-- The browser reads and writes these tables directly with the public key, so
-- row-level security is what keeps each Shopper to her own rows. The Workers
-- connect as the tables' owner and are not affected by it.

CREATE SCHEMA IF NOT EXISTS shoppers;

-- One row per Shopper account. news_emails is true only when she ticked the
-- box, and news_emails_at records when (PECR).
CREATE TABLE IF NOT EXISTS shoppers.profiles (
  shopper_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  uk_size INT CHECK (uk_size IN (18, 20, 22, 24, 26, 28, 30, 32)),
  news_emails BOOLEAN NOT NULL DEFAULT FALSE,
  news_emails_at TIMESTAMPTZ,
  CHECK (NOT news_emails OR news_emails_at IS NOT NULL)
);

-- A Saved item goes when its Shopper or its Product is deleted.
CREATE TABLE IF NOT EXISTS shoppers.saved_items (
  shopper_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shopper_id, product_id)
);

-- seed.js drops and remakes products, which takes this foreign key with it.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid = 'shoppers.saved_items'::regclass AND contype = 'f'
                   AND confrelid = 'public.products'::regclass) THEN
    ALTER TABLE shoppers.saved_items
      ADD FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Deleting a Product looks its saves up by product_id.
CREATE INDEX IF NOT EXISTS saved_items_product_idx ON shoppers.saved_items (product_id);

ALTER TABLE shoppers.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoppers.saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_profile ON shoppers.profiles;
CREATE POLICY own_profile ON shoppers.profiles TO authenticated
  USING (shopper_id = (SELECT auth.uid()))
  WITH CHECK (shopper_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS own_saved_items ON shoppers.saved_items;
CREATE POLICY own_saved_items ON shoppers.saved_items TO authenticated
  USING (shopper_id = (SELECT auth.uid()))
  WITH CHECK (shopper_id = (SELECT auth.uid()));

-- Signed-out visitors (anon) get nothing; signed-in Shoppers only what the
-- policies above let through. A Saved item is never edited, only added or removed.
REVOKE ALL ON ALL TABLES IN SCHEMA shoppers FROM anon, authenticated;
GRANT USAGE ON SCHEMA shoppers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shoppers.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON shoppers.saved_items TO authenticated;

-- "Delete my account": removes her auth user, which takes her profile and
-- Saved items with it.
CREATE OR REPLACE FUNCTION shoppers.delete_my_account() RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = ''
  AS $$ DELETE FROM auth.users WHERE id = auth.uid() $$;
REVOKE ALL ON FUNCTION shoppers.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION shoppers.delete_my_account() TO authenticated;

-- Supabase lets the browser key read every public table that has no
-- row-level security, and grants it every table made there. Turn row-level
-- security on (with no policies, so the browser key reads nothing) and take
-- the grants away. Both lock the table, so only tables that still need it
-- are touched (see the note in schema.sql).
DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN SELECT c.oid::regclass AS name, c.relrowsecurity AS secured FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    IF NOT t.secured THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t.name);
    END IF;
    IF has_table_privilege('anon', t.name, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
       OR has_table_privilege('authenticated', t.name, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
      EXECUTE format('REVOKE ALL ON %s FROM anon, authenticated', t.name);
    END IF;
  END LOOP;
END $$;
