const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const P=require('../games/splash-line/park-progress.js');
const html=fs.readFileSync(require('node:path').join(__dirname,'../games/splash-line/index.html'),'utf8');
const section=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
vm.runInNewContext(`const state={tester:'lou',tickets:9999,lifetimeTickets:9999,completedAt:123};let notices=0;function toast(){notices++;}
${section('const TESTERS =','const tName =')}
${section('function recordTicketBalance(', 'function setTickets(')}
assert.equal(tester().id,'sandy','inspection alone does not unlock Lou');
recordTicketBalance(10000);assert.equal(tester().id,'lou');assert.equal(notices,1);
recordTicketBalance(20);assert.equal(tester().id,'lou','spending preserves unlock');assert.equal(state.lifetimeTickets,10000);
recordTicketBalance(25);assert.equal(state.lifetimeTickets,10005);assert.equal(notices,1);
state.tester='ducky';assert.equal(tester().id,'ducky');
`,{assert});
assert.equal(P.normalize({rides:[],tickets:10000}).lifetimeTickets,10000,'legacy balance gets credit');
assert.equal(P.normalize({rides:[],tickets:20,lifetimeTickets:10000}).lifetimeTickets,10000,'earned progress survives loading');
console.log('PASS: Lou unlocks at 10,000 total tickets, retains unlock after spending, announces once, and preserves saved progress.');
