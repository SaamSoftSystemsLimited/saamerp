#!/usr/bin/env python3
"""Run the real Java/PostgreSQL demo, export synthetic JSON, verify restart persistence.
Only exports the fixed synthetic tenant; credentials never enter the frontend bundle.
Requires an empty demo database. Does not connect to production infrastructure.
"""
import argparse, base64, json, os, secrets, subprocess, tempfile, time, urllib.request, urllib.error
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--jar', required=True)
parser.add_argument('--output', required=True)
args=parser.parse_args()
env=os.environ.copy()
for name in ['CRM_DATABASE_URL','CRM_DATABASE_USER','CRM_DATABASE_PASSWORD']:
    if not env.get(name): raise SystemExit(f'{name} is required')
env['CRM_DEMO_PASSWORD']=secrets.token_urlsafe(32)
env['SPRING_PROFILES_ACTIVE']='postgres'
env['SERVER_ADDRESS']='127.0.0.1'
env['SERVER_PORT']='18080'
java=str(Path(env['JAVA_HOME'])/'bin/java') if env.get('JAVA_HOME') else 'java'
auth='Basic '+base64.b64encode(('demo:'+env['CRM_DEMO_PASSWORD']).encode()).decode()
base='http://127.0.0.1:18080/api/demo/crm'
process=None
log=tempfile.TemporaryFile(mode='w+')
def start():
    global process
    process=subprocess.Popen([java,'-jar',args.jar],env=env,stdout=log,stderr=subprocess.STDOUT)
    for _ in range(90):
        if process.poll() is not None: raise RuntimeError('Backend exited during startup; inspect database settings')
        try:
            with urllib.request.urlopen('http://127.0.0.1:18080/actuator/health',timeout=2) as response:
                if response.status==200: return
        except (OSError,urllib.error.URLError): pass
        time.sleep(1)
    raise RuntimeError('Backend did not become healthy within 90 seconds')
def stop():
    if process and process.poll() is None:
        process.terminate()
        try: process.wait(timeout=15)
        except subprocess.TimeoutExpired: process.kill();process.wait(timeout=5)
def api(path='',body=None):
    request=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers={'Authorization':auth,'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=15) as r: return json.load(r)
try:
    start()
    if api()['customers']: raise RuntimeError('Synthetic tenant is not empty; use a fresh demo database')
    a=api('/customers',{'branch':'Lagos · Head office','name':'Demo · Lagoon Learning Ltd','email':'hello@lagoon.example.test'})
    b=api('/customers',{'branch':'Abuja · Demo branch','name':'Demo · Cedar Technology Ltd','email':'team@cedar.example.test'})
    person=api('/contacts',{'customerId':a['id'],'name':'Demo · Amara Okafor','email':'amara@example.test'})
    api('/contacts',{'customerId':b['id'],'name':'Demo · Musa Bello','email':'musa@example.test'})
    quote=api('/quotes',{'customerId':a['id'],'contactId':person['id'],'validUntil':'2099-12-31','lines':[{'description':'Corporate training workshop (synthetic)','quantity':2,'unitPriceMinor':12500000},{'description':'Course materials (synthetic)','quantity':10,'unitPriceMinor':150000}]})
    assert quote['totalMinor']==26500000, 'API calculated an unexpected total'
    issued=api('/quotes/'+quote['id']+'/status',{'status':'SENT'})
    assert issued['status']=='SENT'
    assert api('/quotes/'+quote['id']+'/status',{'status':'SENT'})==issued, 'Issue retry changed the quotation snapshot'
    api('/quotes',{'customerId':b['id'],'contactId':None,'validUntil':'2099-12-31','lines':[{'description':'IT consulting session (synthetic)','quantity':3,'unitPriceMinor':3500000}]})
    before=api()
    stop();start()
    assert api()==before, 'Stored CRM state changed after backend restart'
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(before,indent=2)+'\n')
    print('Verified PostgreSQL restart persistence and exported synthetic CRM data:',output)
finally:
    stop();log.close()
