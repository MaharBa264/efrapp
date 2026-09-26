import test from 'node:test';
import assert from 'node:assert/strict';
test('mobile app initializes its login screen without a session',async()=>{
 globalThis.sessionStorage={getItem:()=>null};let app={innerHTML:''};
 globalThis.document={querySelector:selector=>selector==='#app'?app:{innerHTML:''}};
 await import('../web/app.js');
 assert.match(app.innerHTML,/Entrar a EfraApp/);
 delete globalThis.document;delete globalThis.sessionStorage;
});
