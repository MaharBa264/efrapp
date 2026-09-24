import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const schema=readFileSync('migrations/0002_item_units_weight.sql','utf8'),api=readFileSync('worker.js','utf8'),ui=readFileSync('web/app.js','utf8');
test('migration preserves legacy quantity and marks unknown weight',()=>{assert.match(schema,/ADD COLUMN units_count INTEGER/);assert.match(schema,/ADD COLUMN weight_kg REAL/);assert.match(schema,/quantity = CAST\(quantity AS INTEGER\)/);assert.doesNotMatch(schema,/UPDATE dispatch_items SET weight_kg/)});
test('API requires valid units and kg per new dispatch line',()=>{assert.match(api,/Number\.isSafeInteger\(units\)/);assert.match(api,/Number\.isFinite\(weight\)/);assert.match(api,/units_count,weight_kg/)});
test('mobile entry, preview and receipt include both measures',()=>{assert.match(ui,/data-units=/);assert.match(ui,/data-weight=/);assert.match(ui,/inputmode="decimal"/);assert.match(ui,/UNIDADES/);assert.match(ui,/'KG'/)});
