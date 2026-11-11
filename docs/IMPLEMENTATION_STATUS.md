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
