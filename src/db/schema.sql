-- ============================================================================
--  Nowy Browar Gdański — schemat bazy (SQLite)
--  Stosowany idempotentnie przy starcie aplikacji (CREATE TABLE IF NOT EXISTS).
--  Kwoty pieniężne przechowywane w groszach (kolumny *_grosze).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- --- Użytkownicy / autoryzacja ---------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id     TEXT UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --- Ustawienia witryny (klucz -> JSON) -----------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --- Edytowalne bloki treści (strony statyczne) --------------------------
CREATE TABLE IF NOT EXISTS content_blocks (
  key        TEXT NOT NULL,
  locale     TEXT NOT NULL DEFAULT 'pl',
  title      TEXT,
  body_html  TEXT NOT NULL DEFAULT '',
  draft_html TEXT,
  format     TEXT NOT NULL DEFAULT 'html' CHECK (format IN ('html','markdown')),
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (key, locale)
);

-- --- Biblioteka mediów ---------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  filename      TEXT NOT NULL,
  path          TEXT NOT NULL,          -- ścieżka publiczna, np. /uploads/xxx.jpg
  variants_json TEXT NOT NULL DEFAULT '{}',  -- { "webp": {...}, "avif": {...}, sizes }
  alt           TEXT NOT NULL DEFAULT '',
  width         INTEGER,
  height        INTEGER,
  mime          TEXT,
  bytes         INTEGER,
  uploaded_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --- Menu --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menus (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  type                TEXT NOT NULL CHECK (type IN ('a_la_carte','seasonal','group','xmas','drinks')),
  locale              TEXT NOT NULL DEFAULT 'pl',
  slug                TEXT NOT NULL,
  title               TEXT NOT NULL,
  intro               TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  current_revision_id INTEGER,
  source_pdf_path     TEXT,             -- oryginalny PDF do pobrania
  position            INTEGER NOT NULL DEFAULT 0,
  created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (slug, locale)
);

CREATE TABLE IF NOT EXISTS menu_sections (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id  INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  note     TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id   INTEGER NOT NULL REFERENCES menu_sections(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  weight       TEXT NOT NULL DEFAULT '',      -- "180g", "±500g", "300ml"
  price_grosze INTEGER,                        -- NULL gdy cena słowna / warianty
  price_note   TEXT NOT NULL DEFAULT '',       -- np. "kurczak 38 zł / krewetki 48 zł"
  tags_json    TEXT NOT NULL DEFAULT '[]',     -- ["veg","gf","spicy","new"]
  allergens    TEXT NOT NULL DEFAULT '',
  position     INTEGER NOT NULL DEFAULT 0
);

-- --- Import menu z PDF ---------------------------------------------------
CREATE TABLE IF NOT EXISTS pdf_imports (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name  TEXT NOT NULL,
  stored_path    TEXT NOT NULL,
  bytes          INTEGER,
  pages          INTEGER,
  status         TEXT NOT NULL DEFAULT 'uploaded'
                   CHECK (status IN ('uploaded','parsed','reviewed','applied','failed')),
  raw_text       TEXT NOT NULL DEFAULT '',
  parsed_json    TEXT NOT NULL DEFAULT '{}',
  reviewed_json  TEXT,
  target_menu_id INTEGER REFERENCES menus(id) ON DELETE SET NULL,
  error          TEXT,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_revisions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id              INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  version              INTEGER NOT NULL,
  snapshot_json        TEXT NOT NULL,          -- pełny stan sekcji+pozycji
  note                 TEXT NOT NULL DEFAULT '',
  source_pdf_import_id INTEGER REFERENCES pdf_imports(id) ON DELETE SET NULL,
  created_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (menu_id, version)
);

-- --- Promocje ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  locale      TEXT NOT NULL DEFAULT 'pl',
  kind        TEXT NOT NULL DEFAULT 'timed' CHECK (kind IN ('weekly','timed')),
  weekday     INTEGER,                       -- 1=pon .. 7=nd (dla kind='weekly')
  title       TEXT NOT NULL,
  short_label TEXT NOT NULL DEFAULT '',      -- np. "-30%", "1+1"
  description TEXT NOT NULL DEFAULT '',
  media_id    INTEGER REFERENCES media(id) ON DELETE SET NULL,
  starts_at   TEXT,
  ends_at     TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --- Sklep ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  subtitle     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  style        TEXT NOT NULL DEFAULT '',
  abv          REAL,
  ibu          INTEGER,
  plato        REAL,
  volume_ml    INTEGER,
  pack_size    INTEGER NOT NULL DEFAULT 1,
  price_grosze INTEGER NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  media_id     INTEGER REFERENCES media(id) ON DELETE SET NULL,
  untappd_url  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'beer' CHECK (category IN ('beer','set','merch','voucher')),
  is_active    INTEGER NOT NULL DEFAULT 1,
  is_featured  INTEGER NOT NULL DEFAULT 0,
  meta_json    TEXT NOT NULL DEFAULT '{}',
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  number           TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL DEFAULT '',
  name             TEXT NOT NULL,
  address_json     TEXT NOT NULL DEFAULT '{}',
  fulfillment      TEXT NOT NULL DEFAULT 'pickup' CHECK (fulfillment IN ('pickup','courier')),
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','paid','packed','shipped','completed','cancelled')),
  payment_status   TEXT NOT NULL DEFAULT 'pending'
                     CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_provider TEXT NOT NULL DEFAULT 'mock',
  payment_ref      TEXT NOT NULL DEFAULT '',
  subtotal_grosze  INTEGER NOT NULL DEFAULT 0,
  shipping_grosze  INTEGER NOT NULL DEFAULT 0,
  total_grosze     INTEGER NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'PLN',
  note             TEXT NOT NULL DEFAULT '',
  consent_json     TEXT NOT NULL DEFAULT '{}',
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name_snapshot    TEXT NOT NULL,
  unit_price_grosze INTEGER NOT NULL,
  qty              INTEGER NOT NULL DEFAULT 1
);

-- --- Zapytania / formularze --------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL CHECK (type IN ('contact','b2b','reservation','event','newsletter')),
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  meta_json  TEXT NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled','spam')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --- Dziennik zdarzeń -------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL DEFAULT '',
  entity_id  TEXT NOT NULL DEFAULT '',
  meta_json  TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --- Indeksy ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_menus_type_locale   ON menus(type, locale, status);
CREATE INDEX IF NOT EXISTS idx_sections_menu       ON menu_sections(menu_id, position);
CREATE INDEX IF NOT EXISTS idx_items_section       ON menu_items(section_id, position);
CREATE INDEX IF NOT EXISTS idx_revisions_menu      ON menu_revisions(menu_id, version);
CREATE INDEX IF NOT EXISTS idx_promotions_active   ON promotions(is_active, kind, position);
CREATE INDEX IF NOT EXISTS idx_products_active     ON products(is_active, position);
CREATE INDEX IF NOT EXISTS idx_orders_created      ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_type      ON inquiries(type, status, created_at);
CREATE INDEX IF NOT EXISTS idx_content_blocks_key  ON content_blocks(key, locale);
