# Data hygiene and backfills

This project includes a small set of scripts and SQL helpers to keep data clean and rebuild indexes.
Most operations require `ADMIN_API_KEY` if auth is enabled.

## Environment

- `ADMIN_API_KEY` (required for protected endpoints)
- `GRANT_SENTINEL_API_URL` (optional; defaults to `https://grant-sentinel.wakas.workers.dev`)

## Cleanup "Unknown" entries

Use the cleanup script to remove placeholder opportunities (defaults target Prozorro):

```bash
./scripts/cleanup-unknown.sh
```

If you need to run SQL directly, review `db/cleanup_unknown.sql` and execute it with:

```bash
wrangler d1 execute <DB_NAME> --file db/cleanup_unknown.sql
```

## FTS backfill

Rebuild the FTS5 index after schema changes or bulk imports:

```bash
wrangler d1 execute <DB_NAME> --file scripts/fts-backfill.sql
```

## Re-sync a single source

Queue a sync for one source (useful for targeted re-normalization):

```bash
./scripts/resync-source.sh grants_gov --max-notices 200
./scripts/resync-source.sh ted_eu --url "https://example.com/ted/20250101.zip"
```

## Full re-sync (re-normalize)

Trigger a full sync for all sources:

```bash
./scripts/run-sync.sh
```

This re-applies normalization logic to fresh data and updates diagnostics.
