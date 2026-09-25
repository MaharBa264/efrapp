import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('catalog migration preserves sellable IDs and historical dispatch text, including fresh seed',()=>{
 const script=`import sqlite3,pathlib
c=sqlite3.connect(':memory:')
m=pathlib.Path('migrations')
for n in range(1,5): c.executescript(next(m.glob(f'{n:04}*.sql')).read_text())
c.executescript(pathlib.Path('seed.sql').read_text().split('-- Link initial catalog')[0])
before=c.execute('SELECT id,name FROM products ORDER BY sort_order').fetchall()
c.execute("INSERT INTO customers(id,name,created_at,updated_at) VALUES('c','Cliente','2026','2026')")
c.execute("INSERT INTO users(id,name,username,password_hash,salt,role_id,active,created_at,updated_at) VALUES('u','Usuario','u','hash','salt','admin',1,'2026','2026')")
c.execute("INSERT INTO dispatches(id,customer_id,customer_name,seller_id,seller_name,status,created_by,created_at,updated_at) VALUES('d','c','Cliente','u','Usuario','CONFIRMADO','u','2026','2026')")
c.execute("INSERT INTO dispatch_items(id,dispatch_id,product_id,product_name,unit,quantity) VALUES('i','d',?,'Nombre histórico','unidad',2)",(before[0][0],))
c.executescript(next(m.glob('0005*.sql')).read_text())
assert c.execute('SELECT id,name FROM products ORDER BY sort_order').fetchall()==before
assert c.execute("SELECT product_name FROM dispatch_items WHERE id='i'").fetchone()[0]=='Nombre histórico'
assert c.execute("SELECT variety_id FROM dispatch_items WHERE id='i'").fetchone()[0] is not None
assert c.execute("SELECT COUNT(*) FROM products WHERE variety_id IS NOT NULL").fetchone()[0]==24
assert c.execute("SELECT COUNT(*) FROM product_families").fetchone()[0]>=5
c.executescript(pathlib.Path('seed.sql').read_text())
assert c.execute('SELECT COUNT(*) FROM products').fetchone()[0]==24
print('migration and seed OK')`;
 const result=spawnSync('python3',['-c',script],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/migration and seed OK/);
});
