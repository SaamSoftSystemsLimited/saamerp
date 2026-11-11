# SaamERP

General-purpose ERP/CRM by SaamSoft Systems. Nigeria first, followed by Ghana, Kenya and South Africa.

Planning baseline: 11 November 2026. This repository currently contains specifications and delivery planning; it is not a working ERP.

## Product

- One legal entity with multiple branches per customer subscription; all modules included and selectively activated.
- CRM, sales, contracts, support, inventory, purchasing, manufacturing, accounting, banking, advanced finance, HR/payroll, memberships, projects, marketing, website and POS.
- Web plus Android/iPhone with business-function parity; mobile connects to SaaS only.
- SaaS first; dedicated and on-premises VM deployments. Intranet operation on an office server is distinct from disconnected-device operation.
- Initial capacity target: 50 customer businesses and 250 concurrent users total.

## Navigation

- [Product requirements](docs/PRD.md)
- [Roadmap and capacity](docs/ROADMAP.md)
- [Architecture decision](docs/architecture/ADR-001-modular-architecture.md)
- [Project management](docs/PROJECT_MANAGEMENT.md)
- [Competitor register](docs/COMPETITOR_REGISTER.md)
- [GitHub access and publishing](docs/GITHUB_SETUP.md)
- [Backlog](planning/backlog.json)

## Monorepo layout

`apps/backend` — proposed Java/Spring Boot modular backend.

`apps/web` — proposed React/TypeScript web client.

`apps/mobile` — proposed Flutter Android/iPhone client.

`deploy` — deployment definitions and runbooks, to be implemented.

## Ownership

Private proprietary project. No open-source license has been selected or granted. Copyright and legal ownership wording must be confirmed by the company before distribution.

Never commit credentials, production database exports, employee records or real payslips.
