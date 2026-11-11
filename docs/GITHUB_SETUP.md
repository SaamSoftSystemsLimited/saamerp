# GitHub access and setup

Requested destination: `SaamSoftSystemsLimited/saamerp`, private. Requested project: `SaamERP Delivery Roadmap`, private. Assignee: `sundayayandele` only.

## Observed blocker (11 November 2026)

The environment GitHub CLI authenticated as `sundayayandele`. GitHub rejected `CreateRepository` and `CreateProjectV2` with "does not have the correct permissions". No remote repository or project was created. This was a GitHub permission rejection, not an automatic sandbox approval rejection.

Update after user-created resources and connection authorization: repository access now works and private visibility is verified. The collaborator API returns only `sundayayandele` with admin access. Organization Projects still returns `Resource not accessible by integration`; project linking, fields and views have not been configured. Use `--apply --skip-project` to publish repository milestones/issues independently.

## Resolve access

Use an organization-authorized connection with repository creation and organization Projects read/write access, or manually create the private repository and private organization project in GitHub. Do not paste tokens into chat or commit them. Organization membership alone may not grant these permissions; the GitHub App credential must also be authorized for the relevant operations.

Manual repository creation:
https://github.com/organizations/SaamSoftSystemsLimited/repositories/new

Project location:
https://github.com/orgs/SaamSoftSystemsLimited/projects

Name repository `saamerp`, choose Private, and leave it empty for the initial push. Name the project `SaamERP Delivery Roadmap`, choose private visibility and no extra collaborators. Organization owners may retain inherent access. Do not change organization-wide access defaults for this task.

## Publish after authorization

From this directory, with an authorized GitHub CLI session:

```sh
gh repo create SaamSoftSystemsLimited/saamerp --private --description 'SaamERP by SaamSoft Systems'
git init -b main
git add .
git commit -m 'docs: establish SaamERP product and delivery baseline'
git remote add origin https://github.com/SaamSoftSystemsLimited/saamerp.git
git push -u origin main
python scripts/publish_github_plan.py
python scripts/publish_github_plan.py --apply
```

Skip repository creation if it already exists; inspect its visibility and content before pushing. The planning script defaults to a local validation/dry-run. It creates missing milestones/issues and a project only with `--apply`; reruns reuse stable issue IDs in titles and reuse fields. It does not push files, invite users or change repository permissions.

After importing, create/verify Board and Roadmap views in GitHub UI. Use Start date and Target date for the roadmap. Verify privacy, inherited repository permissions and project access before treating access as limited to the owner. No CI/deployment or branch-protection configuration is claimed by this setup.
