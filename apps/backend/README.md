# SaamERP backend foundation

Requires JDK 21 and network access to Maven Central on the first build. Maven is
bootstrapped by the checked-in wrapper (Windows: `mvnw.cmd`).

```sh
cd apps/backend
./mvnw --batch-mode --no-transfer-progress clean verify
./mvnw spring-boot:run
```

`GET http://localhost:8080/actuator/health` returns the process health without
internal details. All other requests are denied. This is a foundation, not an
ERP API or an implemented authentication system. Do not deploy it as a product.
There is no persistence, tenant provisioning or PostgreSQL integration yet.

The tests start an HTTP server and verify health exposure and request denial;
Spring Modulith tests verify module membership and declared dependency boundaries.
The GitHub Actions workflow runs the same clean verification on GitHub-hosted Ubuntu runners.
No remote workflow execution has been claimed.

See [ownership, version sources and database feasibility gate](../../docs/architecture/BUILD_SPIKE.md).

## Managed cloud environment

Maven does not automatically honor `HTTPS_PROXY`. Configure your local Maven
settings with the environment's proxy if needed. Keep credentials and environment
hostnames out of committed settings. If your home directory is read-only, use:

```sh
MAVEN_USER_HOME=/tmp/saamerp-wrapper ./mvnw \
  -s /path/to/local-settings.xml -Dmaven.repo.local=/tmp/saamerp-m2 \
  --batch-mode --no-transfer-progress clean verify
```

## Validation evidence — 11 November 2026

Clean wrapper build verified using Temurin JDK 21.0.13+9. Both tests passed:
module boundary verification and real HTTP health/access-denial verification.
The executable Spring Boot JAR was packaged successfully. Database, browser,
mobile and production-load tests are not part of this foundation.

This cloud image contains only a Java 21 runtime. A checksum-verified Temurin JDK
was downloaded from the official `adoptium/temurin21-binaries` GitHub release
into `/tmp/saamerp-tools/jdk21` for validation. This temporary installation is not
part of the reusable environment configuration. Set `JAVA_HOME` to a JDK 21,
not the preinstalled runtime, before building.
