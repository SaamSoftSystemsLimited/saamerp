# ADR-001: Modular architecture and deployment

Status: proposed implementation baseline. Date: 2026-11-11.

## Decision

Start with a modular monolith: Java/Spring Boot, Spring Modulith and PostgreSQL. Proposed clients: React/TypeScript and Flutter. Select supported runtime/framework versions during the build spike rather than pinning unverified versions here.

Customer module activation does not require independent microservices. Domain modules own their tables, expose explicit interfaces and use durable events for asynchronous work. Enforce boundaries through architecture tests. Extract services when independent scaling or deployment warrants the operational cost.

Financial posting needs balanced entries, unique source references, idempotency, locks and visible exceptions. Separate invoicing, revenue recognition and cash allocation. Save business state and outgoing events atomically; process consumers safely on retry.

## SaaS isolation

Proposed database per customer plus a control database. Validate provisioning, pooled connections, 50-customer upgrades and selective restore in a spike. Enforce tenant context on API requests, jobs, files, caches and integrations. A separate database alone is not a security boundary for the whole application.

One legal entity per customer initially; branches are reporting/access dimensions. Do not implement multi-entity consolidation implicitly.

## Deployment

Containers and reproducible VM installation; separate staging. SSD Nodes is a provisional provider choice, not provisioned infrastructure or a guarantee of throughput. Recheck pricing before purchase. Production app/database separation does not provide high availability. Maintain external encrypted backups and PostgreSQL recovery logs; rehearse restores.

## Consequences

Less operational overhead for a solo developer and simpler local transactions. Requires disciplined boundaries and upgrade automation. Mobile parity and multiple installation modes still carry substantial testing costs.
