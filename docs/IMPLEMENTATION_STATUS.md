# Implementation status — 12 November 2026

## Implemented slice

- Modular Java 21 / Spring Boot / Spring Modulith backend with typed tenant/branch IDs.
- Optional loopback-only PostgreSQL demo API, Flyway schema, tenant-scoped relationships,
  exact quotation totals, issued snapshots, controlled status changes and event records.
- Web customers, contacts and multi-line quotation creation, issue/accept/reject,
  quotation download, branch filtering and browser persistence/reset.
- Module activation, explicit dependencies and retained records while disabled.
- GitHub-hosted runner workflows with PostgreSQL services, authenticated API seeding,
  backend restart verification, static data export and Pages deployment.

See [CRM implementation and boundaries](CRM_DEMO.md). This remains a partial M0 /
CRM-001 slice; no epic or specialist acceptance has been marked complete.

## Local verification

Six backend tests passed, including four real PostgreSQL tests, with zero skipped.
Eight frontend policy tests passed. TypeScript and production build passed.
The API-generated fixture was identical after stopping and restarting Java.
All four Chromium end-to-end tests passed, including customer/contact creation,
multi-line quotation issue/accept/download, reload persistence, mobile branch filtering
and reset. Screenshots were visually inspected at 1440px and 390px. Remote results
are recorded after deployment verification.

## Remaining

Production identity/MFA, tenant/branch authorization, database-per-customer feasibility,
customer editing/archive, quotation revisions, taxation, leads/orders/contracts,
shared durable frontend edits, specialist review and mobile parity are not complete.
GitHub runners are ephemeral jobs and do not provide a live backend for Pages.
