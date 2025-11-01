# MGNREGA District Insights (MP-only v1)

This document captures the high-level design for a production-ready, reusable app focusing on Madhya Pradesh (MP) initially. The design is config-driven so it can expand to other states with minimal changes.

## Goals
- Fast, reliable dashboard for any citizen to explore district-level MGNREGA performance.
- Resilient to data.gov.in downtime (serve from our DB snapshot; retry ETL later).
- Codebase simplicity: single facts collection; on-demand aggregations; robust caching.

## Key Decisions
- Storage: Single MongoDB collection `MgnregaData` containing monthly facts per district (FY + month). District metadata in `District`.
- Ingestion: Config-driven ETL that defaults to MP (`DEFAULT_STATE_*`). No summaries table; everything aggregated live.
- Caching: Redis per-route caches (e.g., `dashboard:*`, `map:*`); invalidated after successful ETL.
- Frontend: Next.js 14 (App Router), SSR APIs; client components consume `/api/dashboard/*` and `/api/districts`.

## Config
- Centralized in `config/appConfig.ts` (lazy env read). Required env in `.env`:
  - `DEFAULT_STATE_CODE=MP`
  - `DEFAULT_STATE_NAME=MADHYA PRADESH`
  - `DATA_GOV_API_KEY=...`
  - `DATA_GOV_RESOURCE_ID=ee03643a-ee4c-48c2-ac30-9f2ff26ab722`
  - Optional: `DATA_GOV_PAGE_LIMIT`, `DATA_GOV_TIMEOUT_MS`, `DATA_GOV_PAGE_BACKOFF_MS`, `DATA_GOV_MAX_RETRIES`

## ETL
- Entry: `lib/etl.ts::runETL(stateCode?, financialYear?, month?)`
- Defaults to MP using config if no stateCode provided.
- Paginates through data.gov.in with backoff, retries; normalizes and upserts by (districtCode, financialYear, month).
- Populates `District` on the fly the first time a district is seen.
- Invalidates `dashboard:*` and `map:*` on completion.

## APIs
- `GET /api/districts`: returns MP districts by default (config-driven).
- `GET /api/dashboard/state`: defaults to MP; returns latest summary, monthly aggregates, and top districts.
- `GET /api/dashboard/district` (and `/v2`): per-district details, monthly trend, and vs state average.

## Frontend UX (v1)
- District selector lists only MP districts (API default). UI remains reusable for multi-state future.
- Dashboard cards: households worked, persons worked, workdays generated, expenditure, works completed, trends.
- Comparatives: vs state average and performance category.

## Resilience & Operations
- Schedule ETL periodically (e.g., cron or GitHub Actions) to refresh snapshot.
- If data.gov.in is down, existing dashboards continue serving from Mongo.
- Backups: enable Mongo DB backups (daily), Redis is cache-only.
- Observability: add logging for ETL progress and errors; consider alerts on ETL failure.

## Future Expansion
- Multi-state: lift default filters; expose state selector; config remains reusable.
- Pre-compute hot aggregates (optional) if traffic spikes; current pipelines are fast for MP.
- Add search, bookmarking, and lightweight PWA features for mobile offline reading.
