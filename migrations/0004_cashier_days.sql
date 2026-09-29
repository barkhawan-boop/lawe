CREATE TABLE IF NOT EXISTS cashier_days (
  id TEXT PRIMARY KEY,
  cashier_name TEXT NOT NULL,
  business_date TEXT NOT NULL,
  opening_usd REAL NOT NULL DEFAULT 0,
  opening_iqd REAL NOT NULL DEFAULT 0,
  opening_fib REAL NOT NULL DEFAULT 0,
  opening_qicard REAL NOT NULL DEFAULT 0,
  opening_nasswallet REAL NOT NULL DEFAULT 0,
  closing_usd REAL,
  closing_iqd REAL,
  closing_fib REAL,
  closing_qicard REAL,
  closing_nasswallet REAL,
  status TEXT NOT NULL CHECK(status IN ('open','closed')) DEFAULT 'open',
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  UNIQUE(cashier_name, business_date)
);
CREATE INDEX IF NOT EXISTS idx_cashier_days_date ON cashier_days(business_date);
