#!/usr/bin/env python3
"""Validate the plan; --apply publishes it using an authorized gh session.

Stable IDs make milestones/issues/project items reusable on reruns.
Never reads or prints credential values. Stops on failed API operations.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OWNER = 'SaamSoftSystemsLimited'
REPO = OWNER + '/saamerp'
TITLE = 'SaamERP Delivery Roadmap'


def gh(*args):
    result = subprocess.run(['gh', *args], text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return json.loads(result.stdout) if result.stdout.strip() else None


def api(path, method='GET', payload=None):
    command = ['gh', 'api', path, '--method', method]
    if payload is not None:
        command += ['--input', '-']
    result = subprocess.run(command, input=json.dumps(payload) if payload is not None else None,
                            text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return json.loads(result.stdout) if result.stdout.strip() else None


def pages(path):
    result = []
    for page in range(1, 1000):
        batch = api(path + ('&' if '?' in path else '?') + f'per_page=100&page={page}')
        result.extend(batch)
        if len(batch) < 100:
            return result
    raise RuntimeError('Pagination exceeded expected size')


def body(item):
    criteria = '\n'.join('- [ ] ' + x for x in item['acceptance'])
    dependencies = ', '.join(item['dependencies']) or 'None'
    estimate = item['estimate_hours']
    return f'''## Outcome

{item['title']}

Requirement: {item['key']} | Module: {item['module']} | Type: {item['kind']}
Priority: {item['priority']} | Planned window: {item['start']} to {item['due']}
Human estimate: {str(estimate) + ' hours' if estimate is not None else 'Unestimated; decompose before commitment'}
Dependencies: {dependencies}

## Acceptance

{criteria}

## Evidence and review

- [ ] Relevant tests and exception/permission checks recorded.
- [ ] Web, Android and iPhone applicability and evidence recorded.
- [ ] Financial/HR/tax specialist acceptance recorded where applicable.
- [ ] Known limitations and deployment/data implications documented.

Dates are provisional phase windows. Capacity is 20 human hours/week across the whole project.
No production data, secrets or real payslips in this issue.

<!-- saamerp-plan:{item['key']} -->
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--skip-project', action='store_true', help='Publish repository milestones/issues without organization Projects access')
    args = parser.parse_args()
    items = json.loads((ROOT / 'planning/backlog.json').read_text())
    releases = json.loads((ROOT / 'planning/releases.json').read_text())
    keys = {i['key'] for i in items}
    assert len(keys) == len(items), 'Duplicate requirement IDs'
    titles = {r['title'] for r in releases}
    for item in items:
        assert item['release'] in titles
        assert set(item['dependencies']) <= keys
        assert item['start'] <= item['due']
        assert item['acceptance']
    print(f'Validated {len(items)} items and {len(releases)} milestones.')
    if not args.apply:
        print('Dry run only. Use --apply after GitHub access is authorized.')
        return

    repo = api('repos/' + REPO)
    if not repo['private']:
        raise RuntimeError('Refusing to populate a public repository; private was requested.')
    existing_ms = {x['title']: x for x in pages(f'repos/{REPO}/milestones?state=all')}
    milestones = {}
    for release in releases:
        entry = existing_ms.get(release['title'])
        if entry is None:
            entry = api(f'repos/{REPO}/milestones', 'POST', {
                'title': release['title'], 'due_on': release['due'] + 'T23:59:59Z',
                'description': 'Provisional SaamERP phase; 20 human hours/week. Acceptance gates apply.'})
        milestones[release['title']] = entry['number']

    labels = {x['name'] for x in pages(f'repos/{REPO}/labels')}
    wanted = {'epic': '5319e7', 'task': '0e8a16', 'checkpoint': 'fbca04',
              'P0': 'b60205', 'P1': 'd93f0b', 'P2': 'fbca04'}
    wanted.update({'module:' + i['module']: '1d76db' for i in items})
    for name, color in wanted.items():
        if name not in labels:
            api(f'repos/{REPO}/labels', 'POST', {'name': name, 'color': color})

    existing = pages(f'repos/{REPO}/issues?state=all')
    issues = []
    for item in items:
        marker = '<!-- saamerp-plan:' + item['key'] + ' -->'
        matches = [x for x in existing if marker in (x.get('body') or '') and 'pull_request' not in x]
        if len(matches) > 1:
            raise RuntimeError('Duplicate remote planning IDs: ' + item['key'])
        issue = matches[0] if matches else api(f'repos/{REPO}/issues', 'POST', {
            'title': '[' + item['key'] + '] ' + item['title'], 'body': body(item),
            'milestone': milestones[item['release']],
            'labels': [item['kind'], item['priority'], 'module:' + item['module']],
            'assignees': ['sundayayandele']})
        issues.append((item, issue))

    if args.skip_project:
        print(f'Published/reused {len(issues)} issues and {len(milestones)} milestones; project unchanged.')
        return

    projects = gh('project', 'list', '--owner', OWNER, '--limit', '100', '--format', 'json')['projects']
    matches = [x for x in projects if x['title'] == TITLE]
    if len(matches) > 1:
        raise RuntimeError('Multiple matching projects; choose explicitly before retrying.')
    project = matches[0] if matches else gh('project', 'create', '--owner', OWNER,
                                          '--title', TITLE, '--format', 'json')
    number = str(project['number'])
    gh('project', 'edit', number, '--owner', OWNER, '--visibility', 'PRIVATE',
       '--description', 'SaamERP phased roadmap. 20 human hours/week; dates provisional.',
       '--format', 'json')
    gh('project', 'link', number, '--owner', OWNER, '--repo', REPO)
    fields = gh('project', 'field-list', number, '--owner', OWNER, '--limit', '100', '--format', 'json')['fields']
    dates = {}
    for name in ['Start date', 'Target date']:
        field = next((x for x in fields if x['name'] == name), None)
        if field is None:
            field = gh('project', 'field-create', number, '--owner', OWNER,
                       '--name', name, '--data-type', 'DATE', '--format', 'json')
        dates[name] = field['id']
    estimate = next((x for x in fields if x['name'] == 'Estimate (hours)'), None)
    if estimate is None:
        estimate = gh('project', 'field-create', number, '--owner', OWNER,
                      '--name', 'Estimate (hours)', '--data-type', 'NUMBER', '--format', 'json')
    for item, issue in issues:
        entry = gh('project', 'item-add', number, '--owner', OWNER,
                   '--url', issue['html_url'], '--format', 'json')
        for name, value in [('Start date', item['start']), ('Target date', item['due'])]:
            gh('project', 'item-edit', '--id', entry['id'], '--project-id', project['id'],
               '--field-id', dates[name], '--date', value, '--format', 'json')
        if item['estimate_hours'] is not None:
            gh('project', 'item-edit', '--id', entry['id'], '--project-id', project['id'],
               '--field-id', estimate['id'], '--number', str(item['estimate_hours']), '--format', 'json')
    print(f'Published {len(issues)} planning issues. Project: {project.get("url", number)}')
    print('Verify private access and configure Board/Roadmap views in the GitHub UI.')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, AssertionError) as exc:
        print('Stopped: ' + str(exc), file=sys.stderr)
        sys.exit(1)
