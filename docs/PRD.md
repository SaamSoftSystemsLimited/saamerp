# Product requirements baseline

Owner: SaamSoft Systems. Product: SaamERP. Human development capacity: 20 hours/week. Initial access: sundayayandele only; no collaborators to be invited.

## Scope

Dolibarr's public feature list is the baseline. Enriched HR includes recruitment, onboarding, employee records, attendance, leave, appraisals, learning, benefits, loans/advances, offboarding and self-service.

Payroll supports fixed salaries, allowances, commissions, approved overtime, pension, PAYE and loan deductions. Contractor instructors can be paid per approved course/service delivery through a distinct engagement and accounting workflow. New employees have no historical payroll migration; publish payslips from the first completed run and expose at least the latest 12 months when available. Record retention is a separate policy.

Finance includes double-entry accounting, AR/AP, bank reconciliation, statements, Nigerian tax reports, multiple currencies, FX differences, fixed assets/depreciation, budgets, cost centres, inventory valuation and combined branch reports. Multi-entity consolidation is a benchmark gap, not an approved change to the one-entity customer model.

Baseline modules: organization/access; CRM/opportunities; proposals/orders; contracts/subscriptions; tickets/knowledge; employee/expenses/leave/timesheets/recruitment; memberships; CMS/website/POS; products/services/stocks/purchasing/shipments/manufacturing; invoicing/payments/banking/accounting; emailing/surveys; projects/tasks/interventions/agenda; APIs/connectivity/import-export/developer module building.

Competitor references: Zoho One, Odoo Enterprise, Sage Intacct and Sage 50 Quantum (US/Peachtree lineage). Full competitor scope must be decomposed before claiming parity. Standalone products such as hosted mail, office editors, video meetings and password management remain scope decisions; do not silently mark integrations as native parity.

## Deployment and integrations

SaaS pilot first. Dedicated deployments and on-premises VM support are required. Local server workflows remain available over the intranet during internet outages; external actions queue with visible status. Disconnected-device sync is not yet specified.

All business functions on web/Android/iPhone; SaaS only for mobile. UI workflows must be independently tested, including administrative functions and document handling.

Email, WhatsApp, SMS and bank-statement imports first. Customers connect their own accounts or request a provider-managed offering. Usage costs and provider onboarding are separate from module entitlements.

Migration: Excel first, Dolibarr when used by pilot; later adapters for Zoho, Odoo, Sage and legacy Peachtree. Define supported versions, records, attachments, history and balance reconciliation separately for each adapter.

## Acceptance controls

- Financial postings balance and have source references, idempotency and period controls.
- Posted records use audited corrections/reversals; issued documents preserve snapshots.
- Payroll and Nigerian tax outputs require accountant/HR/tax-auditor acceptance; no assumed rates.
- Overtime approval is restricted to authorized persons or valid delegates.
- Tenant, branch and employee document isolation are tested server-side.
- Imports support preview, error reports, duplicate prevention and reconciliation.
- Every functional requirement tracks web/Android/iPhone evidence.
- Load tests represent 250 active users, not idle sessions.
- Proposed targets: p95 common actions <=2s at defined load, recovery point <=15 minutes, restore <=4 hours; targets require validation and are not SLAs.

## Dates and uncertainty

5 Dec 2026: controlled demonstration. 25 Jan 2027: controlled pilot target. 30 Jun 2027: commercial core. 31 Mar 2028: broad ERP. 31 Dec 2028: provisional full agreed business-management scope. Contingency through Nov 2029. These dates supersede the earlier full-production target of 25 Jan 2027 under the user's acceptance of the phased roadmap.

Weekly specialist reviews. Re-estimate on 23 Dec 2026 after six weeks of observed delivery at 20 hours/week. Full suite acceptance is not guaranteed by any date.
