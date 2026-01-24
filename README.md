# Grant Sentinel

Grant Sentinel is an enterprise-grade funding aggregator and search engine built on the Cloudflare ecosystem. It
implements a multi-stage funnel that mirrors public metadata, performs deep document processing for high-signal
opportunities, and assigns feasibility scores using Workers AI.

## Architecture Overview

**Stage 1: Metadata Ingestion**
- Cron Workers poll Grants.gov, SAM.gov, HRSA, TED.eu, and registry-backed global sources.
- Eligibility filters enforce private-sector requirements and exclusions.
- Keyword scoring prioritizes AI and digital health signals.

**Stage 2: Intelligent Extraction**
- Browser Rendering (optional) discovers hidden PDF links.
- PDFs are stored in R2 and converted to text in the Worker.
- Sections are sliced to focus on program description, requirements, and evaluation criteria.

**Stage 3: Agentic Reasoning**
- Workers AI generates feasibility + profitability scores.
- Vector embeddings are stored in Vectorize for semantic search.
- Daily brief notifications can be delivered via webhook.

## Repo Layout

- `app/` Next.js App Router dashboard with pages: Dashboard, Shortlist, Sources, Manage
- `components/` UI components including Navigation and admin tabs
- `lib/` API client and shared types
- `workers/` Cloudflare Worker ingestion pipeline
- `db/schema.sql` D1 schema for metadata, documents, and analyses
- `db/seed_sources.sql` global funding source registry seed data
- `wrangler.toml` Cloudflare bindings and cron schedule

## Requirements

- Node.js 20+
- Cloudflare Wrangler CLI
- Cloudflare account with D1, R2, Queues, Vectorize

## Local Development

```bash
npm install
npm run worker:dev  # Start the backend Worker
npm run dev         # Start the Next.js frontend
```

Set `GRANT_SENTINEL_API_URL` (or `NEXT_PUBLIC_GRANT_SENTINEL_API_URL`) to your Worker endpoint so the dashboard can read data:

```bash
export GRANT_SENTINEL_API_URL="http://localhost:8787"
```

### Frontend Deployment

The frontend is deployed to Cloudflare Workers using `@opennextjs/cloudflare`:

```bash
npm run build:cloudflare
npm run frontend:deploy
```

## Cloudflare Setup

1. Create a D1 database and update `wrangler.toml` with its ID.
2. Create R2 buckets:
   - `grant-sentinel-pdfs` (for PDF documents)
   - `grant-sentinel-frontend-assets` (for frontend static assets)
   - `grant-sentinel-next-cache` (for Next.js incremental cache)
3. Create a Queue named `grant-sentinel-pdf`.
4. Create a Vectorize index named `grant-sentinel-index`.
5. Apply schema:

```bash
wrangler d1 execute grant_sentinel --file db/schema.sql
```

6. Seed the global funding source registry (optional but recommended):

```bash
wrangler d1 execute grant_sentinel --file db/seed_sources.sql
```

## Secrets

```bash
wrangler secret put GRANTS_GOV_API_KEY
wrangler secret put SAM_GOV_API_KEY
wrangler secret put HRSA_API_KEY
wrangler secret put COMPANY_PROFILE
wrangler secret put NOTIFICATION_WEBHOOK_URL
```

## TED Bulk Download

The TED bulk download integration fetches the latest daily XML zip from the bulk download page, unzips notices, and
filters them with the same exclusion/keyword logic. You can override the download URL or cap the import size using
environment variables:

```bash
export TED_BULK_DOWNLOAD_URL="https://ted.europa.eu/en/simap/xml-bulk-download"
export TED_MAX_NOTICES="500"
export BULK_MAX_NOTICES="500"
```

## Global Funding Sources

The registry-backed source pipeline supports manual or automated imports for bulk exports (XML/JSON/ZIP). 

### Sources Page

The dedicated **Sources** page (`/sources`) provides a comprehensive table view of all funding sources with:
- **Status indicators**: Color-coded circles showing sync status (syncing, scheduled, synced, failed, inactive, etc.)
- **Real-time status**: Shows whether sources are syncing now, scheduled to sync, or require manual sync
- **Quick actions**: Sync and Enable/Disable buttons for each source
- **Detailed metrics**: Last sync time, ingested counts, integration types

### Manage Section

Use the **Manage** section (`/admin`) to:
- **Analytics**: View system-wide statistics and high-signal opportunities
- **Sources**: Configure sources with manual imports, auto URLs, and integration types
- **Filters**: Set exclusion rules and priority agencies
- **Settings**: Configure environment and API endpoints

## Shortlist + AI Analysis

Use the Shortlist page to collect high-priority opportunities and trigger AI analysis on demand. The analysis pipeline
stores feasibility, suitability, and profitability scores for quick triage.

### Adding or Updating Sources

Source-specific parsing logic lives in `workers/src/sources/`. When a source format changes (or you add a new source),
update or add a source definition file there instead of touching the database layer. The normalization pipeline
(`workers/src/normalize/opportunity.ts`) handles consistent scoring and storage.

## Search Improvements

Search now uses D1 FTS5 for fast keyword lookup with ranked results. Modes:

- `smart` (default): all terms must match
- `any`: any term can match
- `exact`: exact phrase

After applying the schema changes, backfill the FTS table if you already have data:

```sql
INSERT INTO opportunities_fts (opportunity_id, source, title, summary, agency)
SELECT opportunity_id, source, title, summary, agency FROM opportunities;
```

## D1 Schema

The D1 schema lives in `db/schema.sql` and includes:

- `opportunities`, `opportunity_versions`, `documents`, `analyses`
- `exclusion_rules`
- `funding_sources`

## API Endpoints (Worker)

- `GET /api/opportunities?query=&source=&minScore=&limit=`
- `GET /api/opportunities/:id`
- `GET /api/sources`
- `GET /health`
- `GET /api/shortlist`
- `POST /api/shortlist`
- `POST /api/shortlist/remove`
- `POST /api/shortlist/analyze`
- `GET /api/admin/sources`
- `PATCH /api/admin/sources/:id`
- `POST /api/admin/sources/:id/sync`

## Compliance Disclaimer

Grant Sentinel aggregates data from multiple public funding sources (including Grants.gov, SAM.gov, TED.eu, HRSA, and others). This product is not endorsed or certified by any government agency or funding organization.
