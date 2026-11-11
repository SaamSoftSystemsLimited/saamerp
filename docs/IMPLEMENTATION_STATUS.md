# Implementation status — 11 November 2026

## Implemented

- Backend foundation: Java 21 / Spring Boot / Spring Modulith, typed customer/branch
  identities, deny-by-default HTTP configuration, health endpoint and module tests.
- Static web demonstration: overview, sample branch selector, searchable module
  catalog, explicit dependencies, activation/deactivation and browser-local preferences.
- GitHub-hosted Ubuntu runner workflows for backend and frontend verification.
- Pages artifact deployment workflow for the frontend, restricted to main/manual runs.

This is partial PLAT-001 / M0 groundwork. No issue or epic has been marked Done.
No customer data, financial postings, payroll calculations or authentication workflow
is implemented. Database-per-customer and branch authorization still need validation.

## Verification

Backend: previous clean wrapper build and both automated tests passed with JDK 21.0.13.
Frontend: four policy tests passed, TypeScript and Vite production build passed,
and the production dependency audit reported zero vulnerabilities.
Chromium browser checks passed for dependency errors, dependent-module protection,
persistence after reload, search, branch selection and mobile navigation. Tested at
1440px desktop and 390px mobile widths; no horizontal overflow or JavaScript errors.
Screenshots were captured and visually inspected. Both checked-in Playwright tests also
passed against the production build. Remote deployment is tracked separately.


## Next implementation slices

1. Authenticate tenant/branch membership and validate the customer database strategy.
2. Add durable module configuration and organization/branch workflows with API tests.
3. Connect the frontend to an authenticated API on a separate backend host.
4. Implement a narrow CRM/quotation workflow with audit and permissions.

GitHub Projects remains optional and blocked; existing issues and the checked-in
backlog remain the delivery record.

## GitHub runner results

Implementation commit: `4a643d22adb5cb4e7650039521b3ed096674f405`, pushed to private `main`.

- [Backend verification](https://github.com/SaamSoftSystemsLimited/saamerp/actions/runs/43106029850): success on a GitHub-hosted Ubuntu runner.
- [Frontend verification](https://github.com/SaamSoftSystemsLimited/saamerp/actions/runs/43106029835): success, including Chromium end-to-end checks.
- [Pages workflow](https://github.com/SaamSoftSystemsLimited/saamerp/actions/runs/43106029792): artifact build/tests/upload succeeded; deployment failed during Configure Pages.

GitHub's deployment annotation reports `Get Pages site failed` / `Not Found` and
asks for Pages to be enabled using GitHub Actions. The current credential's attempt
to enable Pages returned HTTP 403. `configure-pages` automatic enablement requires
a separate authorized token; the built-in workflow token cannot enable the site.
No live Pages URL is claimed.

Account action: open [repository Pages settings](https://github.com/SaamSoftSystemsLimited/saamerp/settings/pages),
select **GitHub Actions** as the source, then rerun the Pages workflow. Private
repository Pages availability depends on the GitHub plan. Keep the repository private.
This preview is safe to publish as a demo because it bundles synthetic fixtures only;
Pages does not supply backend hosting or business-data access control.

Full failed-run log download was denied by the environment proxy at GitHub's log
storage host; the failure above was verified through GitHub's check annotations API.
