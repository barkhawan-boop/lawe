CREATE TABLE IF NOT EXISTS cash_records (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('buy','sell','service')),
  service TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT '',
  usd REAL NOT NULL DEFAULT 0,
  rate REAL NOT NULL DEFAULT 0,
  iqd REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  fee REAL NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '',
  customer TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL DEFAULT '',
  cashier_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cash_records_date ON cash_records(date);
CREATE INDEX IF NOT EXISTS idx_cash_records_kind ON cash_records(kind);
