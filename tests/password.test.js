import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('password derivation fits Workers PBKDF2 limit',()=>{let src=readFileSync('worker.js','utf8');assert.match(src,/iterations:100000/);assert.doesNotMatch(src,/iterations:210000/)});
