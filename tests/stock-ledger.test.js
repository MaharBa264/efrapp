import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {readdirSync} from 'node:fs';
const migrations=readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort().map(x=>readFileSync(new URL('../migrations/'+x,import.meta.url),'utf8'));
test('stock starts disabled; confirmation and void move units once; insufficient stock rolls back',()=>{
 const script=`import sqlite3,sys,json\nc=sqlite3.connect(':memory:');c.execute('PRAGMA foreign_keys=ON')\nfor migration in json.loads(sys.stdin.read()):c.executescript(migration)\n`+String.raw`
c.execute("INSERT INTO users VALUES('u','Usuario','usuario','hash','salt','superadmin',1,'t','t')")
c.execute("INSERT INTO products(id,name,unit,active,sort_order,created_at,updated_at) VALUES('p','Producto','unidad',1,0,'t','t')")
c.execute("INSERT INTO customers(id,name,created_at,updated_at) VALUES('c','Cliente','t','t')")
c.execute("INSERT INTO dispatches(id,customer_id,customer_name,seller_id,seller_name,status,created_by,created_at,updated_at) VALUES('d','c','Cliente','u','Usuario','BORRADOR','u','t','t')")
c.execute("INSERT INTO dispatch_items(id,dispatch_id,product_id,product_name,unit,quantity,units_count) VALUES('i','d','p','Producto','unidad',3,3)")
assert c.execute("SELECT value FROM settings WHERE key='stock_enabled'").fetchone()==('0',)
try:c.execute("INSERT INTO stock_movements(id,product_id,delta,kind,actor_id,created_at) VALUES('m0','p',5,'IN','u','t')");assert False
except sqlite3.IntegrityError: pass
c.execute("UPDATE settings SET value='1' WHERE key='stock_enabled'")
c.execute("INSERT INTO stock_movements(id,product_id,delta,kind,actor_id,expected_quantity,created_at) VALUES('m1','p',5,'IN','u',0,'t')")
try:c.execute("INSERT INTO stock_movements(id,product_id,delta,kind,actor_id,expected_quantity,created_at) VALUES('stale','p',1,'IN','u',0,'t')");assert False
except sqlite3.IntegrityError: pass
c.execute("UPDATE dispatches SET status='CONFIRMADO',confirmed_by='u',confirmed_at='t' WHERE id='d'")
assert c.execute("SELECT quantity FROM stock_levels WHERE product_id='p'").fetchone()==(2,)
c.execute("INSERT INTO dispatches(id,customer_id,customer_name,seller_id,seller_name,status,created_by,created_at,updated_at) VALUES('d2','c','Cliente','u','Usuario','BORRADOR','u','t','t')")
c.execute("INSERT INTO dispatch_items(id,dispatch_id,product_id,product_name,unit,quantity,units_count) VALUES('i2','d2','p','Producto','unidad',6,6)")
try:c.execute("UPDATE dispatches SET status='CONFIRMADO',confirmed_by='u',confirmed_at='t' WHERE id='d2'");assert False
except sqlite3.IntegrityError: pass
assert c.execute("SELECT status FROM dispatches WHERE id='d2'").fetchone()==('BORRADOR',)
assert c.execute("SELECT quantity FROM stock_levels WHERE product_id='p'").fetchone()==(2,)
try:c.execute("INSERT INTO stock_movements(id,product_id,delta,kind,actor_id,expected_quantity,created_at) VALUES('m2','p',-3,'OUT','u',2,'t')");assert False
except sqlite3.IntegrityError: pass
c.execute("UPDATE settings SET value='0' WHERE key='stock_enabled'")
c.execute("UPDATE dispatches SET status='ANULADO',voided_by='u',voided_at='t' WHERE id='d'")
assert c.execute("SELECT quantity FROM stock_levels WHERE product_id='p'").fetchone()==(5,)
assert c.execute("SELECT kind,delta FROM stock_movements WHERE dispatch_id='d' ORDER BY delta").fetchall()==[('DISPATCH_OUT',-3),('DISPATCH_VOID',3)]
print('ok')`;
 const result=spawnSync('python3',['-c',script],{input:JSON.stringify(migrations),encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'ok');
});
