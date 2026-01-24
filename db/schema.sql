CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  agency TEXT,
  bureau TEXT,
  status TEXT,
  summary TEXT,
  eligibility TEXT,
  for_profit_eligible INTEGER NOT NULL DEFAULT 0,
  small_business_eligible INTEGER NOT NULL DEFAULT 0,
  keyword_score REAL NOT NULL DEFAULT 0,
  posted_date TEXT,
  due_date TEXT,
  url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  version_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (opportunity_id, source)
);

CREATE TABLE IF NOT EXISTS opportunity_versions (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  version INTEGER NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  document_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  text_excerpt TEXT,
  section_map TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  feasibility_score REAL NOT NULL,
  profitability_score REAL NOT NULL,
  summary TEXT NOT NULL,
  constraints TEXT,
  model TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exclusion_rules (
  id TEXT PRIMARY KEY,
  rule_type TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
