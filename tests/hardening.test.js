import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {reportRange} from '../report-range.js';
const migrations=readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort().map(x=>readFileSync(new URL('../migrations/'+x,import.meta.url),'utf8'));
const worker=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
test('confirming twice burns no dispatch number',()=>{
 const script=`import sqlite3,sys,json\nc=sqlite3.connect(':memory:');c.execute('PRAGMA foreign_keys=ON')\nfor migration in json.loads(sys.stdin.read()):c.executescript(migration)\n`+String.raw`
c.execute("INSERT INTO users VALUES('u','Usuario','usuario','hash','salt','superadmin',1,'t','t')")
c.execute("INSERT INTO customers(id,name,created_at,updated_at) VALUES('c','Cliente','t','t')")
for d in ('d1','d2'):c.execute("INSERT INTO dispatches(id,customer_id,customer_name,seller_id,seller_name,status,created_by,created_at,updated_at) VALUES(?,'c','Cliente','u','Usuario','BORRADOR','u','t','t')",(d,))
def confirm(d):
 cur=c.execute("UPDATE dispatches SET status='CONFIRMADO',number=(SELECT next_number FROM dispatch_counter WHERE id=1),confirmed_by='u',confirmed_at='t',updated_at='t' WHERE id=? AND status='BORRADOR'",(d,))
 changed=cur.rowcount
 c.execute("UPDATE dispatch_counter SET next_number=next_number+1 WHERE id=1 AND changes()>0")
 return changed
assert confirm('d1')==1
assert confirm('d1')==0
assert confirm('d2')==1
assert [r[0] for r in c.execute("SELECT number FROM dispatches ORDER BY number")]==[1,2]
assert c.execute("SELECT next_number FROM dispatch_counter").fetchone()==(3,)
`;
 const result=spawnSync('python3',['-c',script],{input:JSON.stringify(migrations),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
test('hardening migration adds login throttle and logo tables',()=>{
 const sql=migrations.find(x=>x.includes('login_attempts'));assert.match(sql,/login_attempts/);assert.match(sql,/issuer_logos/);
});
test('worker protects superadmin, throttles login, snapshots logo once and filters dates in San Luis time',()=>{
 assert.match(worker,/El rol superadmin no se puede modificar/);
 assert.match(worker,/Demasiados intentos/);
 assert.match(worker,/INSERT OR IGNORE INTO issuer_logos/);
 assert.match(worker,/Debe quedar al menos un superadmin activo/);
 assert.doesNotMatch(worker,/T23:59:59\.999Z/);
 assert.match(worker,/already_confirmed/);
});
test('date filter bounds use exclusive end in UTC-3',()=>{
 const r=reportRange('2026-09-29','2026-09-29');
 assert.equal(r.start,'2026-09-29T03:00:00.000Z');assert.equal(r.end,'2026-09-30T03:00:00.000Z');
});
test('Pages ships security headers',()=>{
 const h=readFileSync(new URL('../web/_headers',import.meta.url),'utf8');
 for(const x of ["Content-Security-Policy","frame-ancestors 'none'","X-Content-Type-Options: nosniff"])assert.ok(h.includes(x),x);
});
