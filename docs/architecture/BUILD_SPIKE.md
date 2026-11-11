# Backend build spike (SPIKE-001)

Implementation baseline: Java 21 LTS, Spring Boot 4.1.2, Spring Modulith 2.1.2,
Maven 3.9.11. Versions are pinned; upgrades require a fresh verification run.
These are released versions listed by Maven Central on 11 November 2026,
not milestone or release-candidate builds. Java 21 is the installed LTS runtime.

Sources:
- https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml
- https://repo.maven.apache.org/maven2/org/springframework/modulith/spring-modulith-bom/maven-metadata.xml
- https://www.oracle.com/java/technologies/java-se-support-roadmap.html
- https://spring.io/projects/spring-boot#support
- https://spring.io/projects/spring-modulith

The Spring reference documentation host was denied by the environment proxy;
released artifact resolution and the integration tests provide compatibility evidence.
Review upstream support policies before production; no long-term vendor support is implied.

## Initial ownership and interfaces (ARCH-001)

`tenancy` owns customer identity. Its public `TenantId` is a typed UUID;
it does not authenticate or authorize the caller. Future control-plane provisioning
and routing belong here. No database routing is implemented yet.

`organization` owns legal-entity configuration and branches. Its public `BranchId`
includes the tenant owner. It may depend on the tenancy public API only.
Branch authorization must still be checked against authenticated membership.

`platform` owns technical HTTP configuration, has no domain dependencies, and
exposes only health publicly. All other HTTP requests are denied. No business
endpoint, identity provider, session policy or MFA implementation is claimed.

Module root packages form the public API. Subpackages are internal. Spring
Modulith verification rejects cycles, internal access and undeclared dependencies.
Add modules when implementing their first workflow, with explicit allowed dependencies.

### Financial boundaries before implementation

Billing owns invoices and immutable issued-document snapshots. Cash allocation
owns receipts and their application to receivables. Revenue recognition owns
performance schedules and deferred/earned revenue. Accounting owns balanced journals,
period controls and reversal links. Paying an invoice must not implicitly recognize
revenue. None of these financial modules is implemented in this spike.

Journal posting must balance per currency, use an immutable tenant-scoped source
reference and idempotency key, and commit source state, journal and outbox together.
Retry must return the prior result; a conflicting payload must fail. Closed periods
reject posting. Corrections require linked reversals rather than destructive edits.
Tax/payroll rules require effective dates and specialist approval.

## Database-per-customer feasibility gate

Before committing to the SaaS design, test:

1. Provisioning and migrations of a control database plus 50 customer databases;
   interrupted migrations, resumability and per-customer schema versions.
2. Bounded connection pools under 250 active concurrent users, with idle pool
   eviction and a measured PostgreSQL connection budget.
3. Authenticated tenant selection with fail-closed handling; forged tenant IDs,
   reused worker threads, background jobs and cross-tenant branch references.
4. Selective encrypted backup/restore, point-in-time recovery, attachment consistency
   and measured recovery targets (15-minute RPO / four-hour restore are provisional).
5. File, cache, search, integration and outbox tenant ownership, including retries.

No PostgreSQL integration or isolation guarantee is claimed by this build spike.

## Acceptance state

Foundation implemented; build/test evidence is recorded in the backend README.
ARCH-001 remains partial pending specialist review and detailed transaction designs.
SPIKE-001 must not be marked Done until its evidence is reviewed. No application
business function, deployment or mobile parity is complete.
