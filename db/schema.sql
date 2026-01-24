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
  suitability_score REAL,
  profitability_score REAL NOT NULL,
  summary TEXT NOT NULL,
  constraints TEXT,
  model TEXT,
  created_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS opportunities_fts USING fts5(
  opportunity_id,
  source,
  title,
  summary,
  agency,
  tokenize = 'porter'
);

CREATE TRIGGER IF NOT EXISTS opportunities_fts_insert AFTER INSERT ON opportunities BEGIN
  INSERT INTO opportunities_fts (rowid, opportunity_id, source, title, summary, agency)
  VALUES (new.rowid, new.opportunity_id, new.source, new.title, new.summary, new.agency);
END;

CREATE TRIGGER IF NOT EXISTS opportunities_fts_update AFTER UPDATE ON opportunities BEGIN
  INSERT INTO opportunities_fts (opportunities_fts, rowid, opportunity_id, source, title, summary, agency)
  VALUES ('delete', old.rowid, old.opportunity_id, old.source, old.title, old.summary, old.agency);
  INSERT INTO opportunities_fts (rowid, opportunity_id, source, title, summary, agency)
  VALUES (new.rowid, new.opportunity_id, new.source, new.title, new.summary, new.agency);
END;

CREATE TRIGGER IF NOT EXISTS opportunities_fts_delete AFTER DELETE ON opportunities BEGIN
  INSERT INTO opportunities_fts (opportunities_fts, rowid, opportunity_id, source, title, summary, agency)
  VALUES ('delete', old.rowid, old.opportunity_id, old.source, old.title, old.summary, old.agency);
END;

CREATE INDEX IF NOT EXISTS idx_opportunities_source_posted ON opportunities (source, posted_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_keyword_score ON opportunities (keyword_score);
CREATE INDEX IF NOT EXISTS idx_analyses_latest ON analyses (opportunity_id, source, created_at);

CREATE TABLE IF NOT EXISTS shortlist (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (opportunity_id, source)
);

CREATE TABLE IF NOT EXISTS exclusion_rules (
  id TEXT PRIMARY KEY,
  rule_type TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funding_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  homepage TEXT,
  integration_type TEXT NOT NULL,
  auto_url TEXT,
  expected_results INTEGER,
  active INTEGER NOT NULL DEFAULT 0,
  last_sync TEXT,
  last_status TEXT,
  last_error TEXT,
  last_ingested INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
