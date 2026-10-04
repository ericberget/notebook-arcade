const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../games/splash-line/index.html'), 'utf8');
const start = html.indexOf('const TESTERS =');
const end = html.indexOf('const tName =', start);
const ctx = vm.createContext({assert});
vm.runInContext(`const state = {tester:'lou'}; ${html.slice(start,end)}
assert.equal(tester().id, 'sandy', 'locked Lou falls back to an available rider');
assert(!TESTERS.filter(testerAvailable).some(t=>t.id==='lou'), 'Lou cannot appear as a random guest before unlock');
state.completedAt = 123;
assert.equal(tester().id, 'lou', 'existing completed parks unlock Lou');
assert(TESTERS.filter(testerAvailable).some(t=>t.id==='lou'));
const saved = JSON.stringify(state); delete state.completedAt; state.tester='ducky';
assert.equal(tester().id,'ducky', 'ordinary riders remain available');
Object.assign(state,JSON.parse(saved)); assert.equal(tester().id,'lou','selection survives save roundtrip');
`, ctx);
console.log('PASS: Lou locked before completion, unlocked for completed parks, random guest gating, existing riders and saved selection.');
