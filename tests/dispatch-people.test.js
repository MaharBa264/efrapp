import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {receiptSvg} from '../web/receipt.js';
const worker=fs.readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../migrations/0006_dispatch_people.sql',import.meta.url),'utf8');
test('people are independent of login seller and remain historical dispatch snapshots',()=>{
 assert.match(migration,/CREATE TABLE salespeople/);assert.match(migration,/CREATE TABLE carriers/);
 assert.match(migration,/ADD COLUMN salesperson_name/);assert.match(migration,/ADD COLUMN carrier_name/);
 assert.match(worker,/salesperson_id,salesperson_name,carrier_id,carrier_name/);
 assert.match(worker,/seller_id,seller_name,status/);
 assert.match(worker,/if\(b\.salesperson_id&&!salesperson\)fail/);
});
test('receipt options omit commercial names by default and show requested names',()=>{
 const d={number:1,customer_name:'Cliente',seller_name:'Usuario',salesperson_name:'Ana Pérez',carrier_name:'Luis Gómez',items:[{product_name:'Fideo',quantity:1,weight_kg:1}],issuer_snapshot:'{}',created_at:'2026-09-25T12:00:00Z'};
 const plain=receiptSvg(d).svg;assert.doesNotMatch(plain,/Ana Pérez|Luis Gómez/);
 const selected=receiptSvg(d,{salesperson:true,carrier:true}).svg;assert.match(selected,/Vendedor: Ana Pérez/);assert.match(selected,/Transportista: Luis Gómez/);
});
