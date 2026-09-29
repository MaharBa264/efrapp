import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
test('manifest declares PNG and maskable icons that exist and are cached offline',()=>{
 const manifest=JSON.parse(read('web/manifest.webmanifest')),sw=read('web/sw.js');
 for(const purpose of ['any','maskable'])assert.ok(manifest.icons.some(i=>i.type==='image/png'&&i.purpose===purpose),purpose);
 for(const icon of manifest.icons){assert.ok(existsSync(new URL('../web'+icon.src,import.meta.url)),icon.src)}
 assert.match(sw,/icon-maskable-512\.png/);
});
test('void requires a reason and setup status is public',()=>{
 const worker=read('worker.js'),migration=read('migrations/0009_void_reason.sql');
 assert.match(migration,/void_reason/);assert.match(worker,/Indicá el motivo de la anulación/);
 assert.match(worker,/path\[0\]==='setup'&&method==='GET'/);assert.match(worker,/path\[1\]==='last'/);
});
test('frontend exposes keyboard-accessible items, share and repeat-last actions',()=>{
 const app=read('web/app.js');
 for(const needle of ["role','button'","navigator.share","repeatLast","askReason","aria-current","data-quick"])assert.ok(app.includes(needle),needle);
 assert.doesNotMatch(app,/confirm\('¿Anular/);
});
