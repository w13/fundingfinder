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
  max_notices INTEGER,
  keyword_includes TEXT,
  keyword_excludes TEXT,
  language TEXT,
  metadata TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  last_sync TEXT,
  last_successful_sync TEXT,
  last_status TEXT,
  last_error TEXT,
  last_ingested INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_next_attempt ON tasks(next_attempt_at);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  query TEXT,
  source TEXT,
  min_score REAL,
  mode TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_click_events (
  id TEXT PRIMARY KEY,
  query TEXT,
  source_filter TEXT,
  min_score REAL,
  mode TEXT,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  result_id TEXT,
  position INTEGER,
  correlation_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_search_click_query ON search_click_events(query);
CREATE INDEX IF NOT EXISTS idx_search_click_source ON search_click_events(source);

CREATE TABLE IF NOT EXISTS source_sync_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  ingested_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  correlation_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_source_sync_runs_source ON source_sync_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_source_sync_runs_started ON source_sync_runs(started_at);

CREATE TABLE IF NOT EXISTS pdf_jobs (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  queued_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  duration_ms INTEGER,
  error TEXT,
  correlation_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_pdf_jobs_status ON pdf_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pdf_jobs_started ON pdf_jobs(started_at);

CREATE TABLE IF NOT EXISTS failed_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  failed_at TEXT NOT NULL,
  correlation_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_type ON failed_jobs(job_type);

CREATE TABLE IF NOT EXISTS notification_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT NOT NULL,
  severity_threshold TEXT NOT NULL DEFAULT 'high',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS normalization_diagnostics (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  missing_fields TEXT NOT NULL,
  guessed_fields TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_normalization_diag_source ON normalization_diagnostics(source);

CREATE TABLE IF NOT EXISTS search_boosts (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_value TEXT NOT NULL,
  boost REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_boosts_unique ON search_boosts(entity_type, entity_value);