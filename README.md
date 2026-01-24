# Grant Sentinel

Grant Sentinel is an AI-native grant aggregator and private-sector search engine built for the Cloudflare ecosystem. It
implements a multi-stage funnel that mirrors public metadata, performs deep PDF processing only for high-signal
opportunities, and assigns feasibility scores using Workers AI.

## Architecture Overview

**Stage 1: Metadata Ingestion**
- Cron Worker polls Grants.gov, SAM.gov, HRSA, and TED.eu for the last 7 days.
- Eligibility filter requires for-profit or small business indicators and excludes restricted entities.
- Keyword scoring prioritizes AI and digital health terms.

**Stage 2: Intelligent Extraction**
- Browser Rendering (optional) is used to discover hidden PDF links.
- PDFs are stored in R2 and converted to text in the Worker.
- Sections are sliced to focus on program description, requirements, and evaluation criteria.

**Stage 3: Agentic Reasoning**
- Workers AI analyzes feasibility and profitability.
- Vector embeddings are stored in Vectorize for semantic search.
- Daily brief notifications can be delivered via webhook.

## Repo Layout

- `app/` Next.js App Router dashboard
- `components/` UI components
- `lib/` API client and shared types
- `workers/` Cloudflare Worker ingestion pipeline
- `db/schema.sql` D1 schema for metadata, documents, and analyses
- `wrangler.toml` Cloudflare bindings and cron schedule

## Requirements

- Node.js 20+
- Cloudflare Wrangler CLI
- Cloudflare account with D1, R2, Queues, Vectorize

## Local Development

```bash
npm install
npm run worker:dev
npm run dev
```

Set `GRANT_SENTINEL_API_URL` (or `NEXT_PUBLIC_GRANT_SENTINEL_API_URL`) to your Worker endpoint so the dashboard can read
data:

```bash
export GRANT_SENTINEL_API_URL="http://localhost:8787"
```

## Cloudflare Setup

1. Create a D1 database and update `wrangler.toml` with its ID.
2. Create an R2 bucket named `grant-sentinel-pdfs`.
3. Create a Queue named `grant-sentinel-pdf`.
4. Create a Vectorize index named `grant-sentinel-index`.
5. Apply schema:

```bash
wrangler d1 execute grant_sentinel --file db/schema.sql
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
```

## API Endpoints (Worker)

- `GET /api/opportunities?query=&source=&minScore=&limit=`
- `GET /api/opportunities/:id`
- `GET /health`
- `POST /api/admin/run-ted-sync`

## Compliance Disclaimer

This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and Human
Services.
