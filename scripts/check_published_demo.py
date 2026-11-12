#!/usr/bin/env python3
"""Post-deployment smoke check for the public SaamERP application and synthetic asset."""
import json
import sys
import time
import urllib.error
import urllib.request

base = sys.argv[1].rstrip('/') + '/'
last_error = ''
for attempt in range(12):
    try:
        with urllib.request.urlopen(base, timeout=10) as response:
            html = response.read().decode('utf-8')
        assert '<div id="root"></div>' in html, 'Published page is not the React application'
        with urllib.request.urlopen(base + 'demo/crm.json', timeout=10) as response:
            data = json.load(response)
        assert data['version'] == 1 and data['mode'] == 'synthetic'
        assert len(data['customers']) == 2 and len(data['contacts']) == 2 and len(data['quotes']) == 2
        assert all(customer['name'].startswith('Demo · ') for customer in data['customers'])
        assert all(quote['currency'] == 'NGN' and quote['totalMinor'] == sum(line['quantity'] * line['unitPriceMinor'] for line in quote['lines']) for quote in data['quotes'])
        print('Published React application and PostgreSQL-generated synthetic CRM dataset verified:', base)
        break
    except (OSError, urllib.error.URLError, AssertionError, KeyError, ValueError) as error:
        last_error = str(error)
        if attempt == 11:
            raise SystemExit('Published application smoke check failed: ' + last_error)
        time.sleep(5)
