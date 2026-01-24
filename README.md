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

## Global Funding Sources

Grant Sentinel aggregates opportunities from 55+ public funding sources worldwide:

- **Grants.gov** - U.S. federal grant opportunities across all agencies
- **SAM.gov** - U.S. federal contract opportunities and awards
- **HRSA** - Health Resources and Services Administration grants
- **TED Europe** - European Union public procurement notices
- **UNGM** - United Nations procurement opportunities
- **World Bank** - World Bank procurement and consulting opportunities
- **UNDP** - UNDP procurement notices and tenders
- **ADB** - Asian Development Bank procurement opportunities
- **IADB** - Inter-American Development Bank project procurement
- **Caribbean Development Bank** - Caribbean Development Bank procurement
- **EDC Canada** - Export Development Canada financing opportunities
- **Contracts Finder UK** - UK government contracts and tenders
- **Public Contracts Scotland** - Scottish public sector contracts
- **Sell2Wales** - Welsh public sector procurement opportunities
- **AusTender** - Australian government tenders and contracts
- **GETS** - New Zealand government electronic tendering
- **GeBIZ** - Singapore government procurement portal
- **ChileCompra** - Chilean public procurement system
- **Compranet** - Mexican federal procurement platform
- **PanamaCompra** - Panamanian public procurement system
- **COMPR.AR** - Argentine public procurement portal
- **Compras Estatales** - Uruguayan state procurement system
- **Contrataciones Públicas** - Paraguayan public procurement
- **HonduCompras** - Honduran public procurement platform
- **BAOSEM** - Algerian public procurement portal
- **Ministry of National Defence (Algeria)** - Algerian Ministry of Defense procurement
- **Marches Publics (Morocco)** - Moroccan public procurement system
- **Observatoire National des Marches Publics** - Tunisian public procurement observatory
- **GHANEPS** - Ghana electronic procurement system
- **eTenders (Nigeria)** - Nigerian electronic tendering platform
- **e-GP** - Bangladesh electronic government procurement
- **PhilGEPS** - Philippines Government Electronic Procurement System
- **ePerolehan** - Malaysian electronic procurement system
- **JETRO** - Japan External Trade Organization opportunities
- **DAPA-FPBIS** - South Korea Defense Acquisition Program Administration
- **Public Procurement Service (South Korea)** - South Korea Public Procurement Service
- **SEAP** - Romanian electronic public procurement
- **Inspektorat Uzbrojenia** - Polish Armament Inspectorate procurement
- **Doffin** - Norwegian public procurement database
- **e-Vergabe** - German electronic procurement platform
- **Marches Publics (France)** - French public procurement portal
- **AcquistinretePA** - Italian public administration procurement
- **Prozorro** - Ukrainian transparent procurement system
- **Tender Board** - Bahrain tender board
- **PPRA** - Pakistan Public Procurement Regulatory Authority
- **National Treasury eTenders** - South African National Treasury eTenders
- **CanadaBuys** - Canadian federal procurement opportunities
- **Cal eProcure** - California eProcure state contracts
- **Florida DMS** - Florida Department of Management Services
- **New York OGS** - New York Office of General Services
- **NATO ACT** - NATO Allied Command Transformation procurement
- **NATO HQ Bonfire Portal** - NATO Headquarters Bonfire procurement portal
- **NATO NCI Agency** - NATO Communications and Information Agency
- **NATO Support and Procurement Agency** - NATO Support and Procurement Agency

The registry-backed source pipeline supports manual or automated imports for bulk exports (XML/JSON/ZIP).

### Sources Page

The dedicated **Sources** page (`/sources`) is the central hub for managing all aspects of the system:

**Overview Dashboard**
- System-wide statistics: Total opportunities, for-profit eligible, analyzed with AI, high feasibility count
- High-signal opportunities list with feasibility scores
- Last update timestamp and active source count

**Source Management Table**
- **Status indicators**: Color-coded circles showing sync status (syncing, scheduled, synced, failed, inactive, never synced)
- **Real-time status**: Shows whether sources are syncing now, scheduled to sync, or require manual sync
- **Quick actions**: Sync button (with loading animation) and Enable/Disable toggle for each source
- **Detailed metrics**: Last sync time, ingested counts, integration types, source descriptions
- **Expandable settings**: Click "Settings" on any source row to:
  - View detailed source information (Auto URL, homepage, last error, expected volume)
  - Sync with custom max notices limit
  - Update integration type, auto URL, and enable/disable cron sync
  - Run manual import with URL override

**Filters Management**
- Add exclusion rules (exclude bureau/agency or priority agency)
- View and manage active filters in a table
- Disable filters as needed

**System Settings**
- View Worker API endpoint configuration
- Secrets configuration information

**Bulk Actions**
- "Sync All Sources" button in the page header to trigger ingestion for all active sources

## AI Analysis

Use the **AI Analysis** page (formerly "Shortlist") to collect high-priority opportunities and trigger AI analysis on demand. The analysis pipeline stores feasibility, suitability, and profitability scores for quick triage.

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

**Public Endpoints** (no authentication required):
- `GET /api/opportunities?query=&source=&minScore=&limit=`
- `GET /api/opportunities/:id`
- `GET /api/sources`
- `GET /health`
- `GET /api/shortlist`
- `GET /api/admin/sources` - List all funding sources
- `GET /api/admin/summary` - Get system statistics
- `GET /api/admin/exclusions` - List exclusion rules

**Protected Endpoints** (require `Authorization: Bearer <ADMIN_API_KEY>` header if `ADMIN_API_KEY` is set):
- `POST /api/shortlist` - Add opportunity to shortlist
- `POST /api/shortlist/remove` - Remove from shortlist
- `POST /api/shortlist/analyze` - Trigger AI analysis
- `PATCH /api/admin/sources/:id` - Update source settings
- `POST /api/admin/sources/:id/sync` - Sync a specific source
- `POST /api/admin/exclusions` - Add exclusion rule
- `DELETE /api/admin/exclusions/:id` - Disable exclusion rule
- `POST /api/admin/run-sync` - Trigger full ingestion sync

## Compliance Disclaimer

Grant Sentinel aggregates data from multiple public funding sources (including Grants.gov, SAM.gov, TED.eu, HRSA, and others). This product is not endorsed or certified by any government agency or funding organization.

## Repo Layout

- `app/` Next.js App Router dashboard with pages: Dashboard, Sources, AI Analysis
- `components/` UI components including Navigation, SourceRowWrapper, and SourceRowActions
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
wrangler secret put ADMIN_API_KEY  # Optional: Required for write operations (POST, PATCH, DELETE) on admin endpoints
```

**Note**: The `ADMIN_API_KEY` is optional. If set, it protects write operations (POST, PATCH, DELETE) on admin endpoints. GET requests to admin endpoints are always allowed for frontend access. If not set, all operations are allowed.
