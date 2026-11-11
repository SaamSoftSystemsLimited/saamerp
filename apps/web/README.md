# SaamERP web workspace

Static React/TypeScript foundation for the M0 demonstration. Includes responsive
navigation, branch selection, module search, dependency checks and browser-local
module preferences. All names/branches are demonstration fixtures. The selected
branch changes the displayed scope only; it does not imply an authorization boundary.

Business screens, authentication, database persistence and Java API connectivity
are not implemented. Enabling a module configures the preview; it does not complete
that module's workflow. Disabling a module changes only the preference list and
never deletes records. No actual business records are stored by this preview.

## Local development

Requires Node 24 and npm.

```sh
cd apps/web
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

For read-only home directories add `--cache /tmp/saamerp-npm-cache` to npm commands.

## GitHub-hosted runners and Pages

- `frontend.yml`: locked dependency install, module-policy tests, production build and Chromium browser checks
  on pushes/PRs; uses GitHub-hosted `ubuntu-latest`, not self-hosted runners.
- `backend.yml`: Java 21 clean Maven build and tests on GitHub-hosted Ubuntu.
- `pages.yml`: verifies and builds the frontend, uploads only `dist`, and deploys
  through GitHub's Pages artifact/OIDC mechanism on main or manual dispatch.
  PRs cannot deploy. Deployment permissions are limited to its deployment job.
- Relative asset URLs support `https://saamsoftsystemslimited.github.io/saamerp/`
  as well as a future custom domain. This URL is expected, not proof of deployment.
- In repository Settings → Pages, select **GitHub Actions** as the build source.
  The account plan must support Pages for private repositories. Keep this repository
  private; do not make it public to work around a plan or permission limitation.

A private repository does not automatically make its Pages site private. The
current static preview contains only synthetic data. Do not add customer records,
private planning files, credentials or tokens to the frontend bundle. Private Pages
access requires appropriate GitHub enterprise capabilities. The Java service and
PostgreSQL cannot run on Pages and need separate infrastructure before live workflows.

The current credential can read workflow runs but Pages settings and Actions
settings return HTTP 403 (`Resource not accessible by integration`). A credential
with repository Pages read/write and any required organization approval is needed
to enable/verify Pages. Workflow-file pushes may additionally need Workflows write
(or the classic `workflow` scope). No organization-wide permission changes are needed.

## Local verification

- Four module-policy tests passed; TypeScript check and Vite production build passed.
- Production dependency audit: no vulnerabilities reported at the time of the check.
- Browser verification evidence is recorded in `docs/IMPLEMENTATION_STATUS.md`.

Backend and frontend verification have now passed on GitHub-hosted runners. The
Pages build and artifact upload passed; deployment is blocked because the Pages site
is not enabled. See [verified run results](../../docs/IMPLEMENTATION_STATUS.md#github-runner-results).
