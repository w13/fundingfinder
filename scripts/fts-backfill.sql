-- Rebuild the FTS5 index from opportunities.
-- Run with: wrangler d1 execute <DB_NAME> --file scripts/fts-backfill.sql

DELETE FROM opportunities_fts;
INSERT INTO opportunities_fts (rowid, opportunity_id, source, title, summary, agency)
SELECT rowid, opportunity_id, source, title, summary, agency
FROM opportunities;
