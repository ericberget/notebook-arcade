const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),L=require('../games/xo-football/league.js');
assert.equal(L.teams.length,12);assert.equal(L.rosters.flat().length,192);assert.equal(new Set(L.rosters.flat().map(p=>p.id)).size,192);assert.equal(new Set(L.rosters.flat().map(p=>p.name)).size,192);
for(const p of L.rosters.flat())for(const v of Object.values(p.attrs))assert(v>=54&&v<=93);
for(const {id:team} of L.activeTeams){
 const s=L.create(team,2026);L.simDraft(s);const rr=L.rosterFor(s,team);const foes=new Set();for(const week of s.schedule){assert.equal(new Set(week.flatMap(g=>[g.home,g.away])).size,8);const g=week.find(g=>g.home===team||g.away===team);foes.add(g.home===team?g.away:g.home);}assert.equal(foes.size,7);
 for(let week=0;week<9;week++){const m=L.current(s);if(m){assert(L.finish(s,m.id,42,7,{[rr[0].id]:{pass:180,passTd:3},[rr[5].id]:{receive:100,td:2}}));assert(!L.finish(s,m.id,42,7,{}),'duplicate cannot record twice');}else assert(L.finishSpectatorWeek(s));}
 assert(s.complete);assert.equal(s.champion,team);assert.equal(s.stats[rr[0].id].pass,1620);assert.equal(s.stats[rr[5].id].td,18);assert.equal(L.standings(s).reduce((n,r)=>n+r.w,0),28);
}
const eliminated=L.create(4,9);L.simDraft(eliminated);while(!eliminated.complete){const m=L.current(eliminated);if(m)L.finish(eliminated,m.id,0,42,{});else L.finishSpectatorWeek(eliminated);}assert.notEqual(eliminated.champion,4);
const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};global.localStorage=storage;const saved=L.create(2,9);assert(L.save(saved));assert.equal(L.load().team,2);memory.set('notebook-football-season-v2','bad');assert.equal(L.load(),null);
const sandbox={XOLeague:L,URLSearchParams,location:{search:'?you=0&opponent=1'},document:{getElementById:()=>null},window:{}};vm.runInNewContext(fs.readFileSync('games/xo-football/match.js','utf8'),sandbox);const M=sandbox.window.XOMatch;
M.reset();M.startPlay(25,true);M.caught('WR-L');M.end('td',100);M.end('td',100);let stats=M.getStats();assert.equal(stats['0-0'].pass,75);assert.equal(stats['0-0'].passTd,1);assert.equal(stats['0-5'].receive,75);assert.equal(stats['0-5'].td,1);
M.startPlay(25,true);M.carry('RB',20);M.end('tackle',19);stats=M.getStats();assert.equal(stats['0-4'].rush,-6);
M.startPlay(25,true);M.end('inc',25);assert.equal(M.getStats()['0-0'].rush,0);
M.startPlay(25,true);M.carry('RB',20);M.lateral(40);M.carry('TE',37);M.end('tackle',50);stats=M.getStats();assert.equal(stats['0-4'].rush,9);assert.equal(stats['0-7'].rush,10);
M.startPlay(25,false);M.intercepted('CB-L',60);M.end('pick6',0);stats=M.getStats();assert.equal(stats['0-13'].returns,60);assert.equal(stats['0-13'].td,1);
M.startPlay(25,false);M.caught('WR-R');M.end('tackle',40);stats=M.getStats();assert.equal(stats['1-6'].receive,15);assert.equal(stats['1-0'].pass,15);
console.log('PASS: 8 complete seasons, balanced schedules, playoff seeding, champion, elimination, duplicate results, persistence, passing/rushing/receiving/lateral/return stats and opponent attribution');
// Completions count once, including zero-yard catches; laterals do not add catches.
M.reset();M.startPlay(25,true);M.caught('WR-L');M.caught('WR-L');M.lateral(25);M.carry('WR-R',25);M.end('td',100);
assert.equal(M.getStats()['0-5'].catches,1);assert.equal(M.getStats()['0-6'].catches,0);
M.startPlay(25,true);M.end('inc',25);assert.equal(M.getStats()['0-5'].catches,1);
M.startPlay(25,false);M.caught('WR-R');M.end('tackle',25);assert.equal(M.getStats()['1-6'].catches,1);
const oldStats={old:{pass:0,rush:0,receive:34,returns:0,td:1,passTd:0}};L.add(oldStats,'old',{receive:12,catches:1});assert.equal(oldStats.old.catches,1);assert.equal(oldStats.old.receive,46);
const simulated=L.create(0,51);L.simDraft(simulated);L.finish(simulated,L.current(simulated).id,7,0,{});
const receiving=Object.values(simulated.stats).filter(s=>s.receive>0);assert(receiving.length);assert(receiving.every(s=>Number.isInteger(s.catches)&&s.catches>0&&s.catches>=s.td));
console.log('PASS: catches, duplicate protection, no lateral/incompletion catches, opponent attribution, old totals, simulated catches');
