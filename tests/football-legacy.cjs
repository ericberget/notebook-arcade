const assert=require('node:assert/strict'),fs=require('node:fs'),L=require('../games/xo-football/league.js');
const storage=new Map();global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
for(const file of ['football-v2-draft.json','football-v2-season.json']){
 const raw=fs.readFileSync('tests/fixtures/'+file,'utf8');storage.set('notebook-football-season-v2',raw);const s=L.load();assert(s,'original twelve-team save loads');assert.equal(s.version,2);assert.equal(L.clubsFor(s).length,12);assert.equal(L.regularWeeks(s),8);const prior=s.draft.picks.map(p=>p.playerId);L.simDraft(s);assert.equal(s.draft.picks.length,60);assert.deepEqual(s.draft.picks.slice(0,prior.length).map(p=>p.playerId),prior);
 while(!s.complete){const m=L.current(s);if(m)L.finish(s,m.id,49,0,{});else L.finishSpectatorWeek(s);assert(L.save(s));assert(L.load(),'legacy save remains valid after each round');}
 assert.equal(s.champion,3);assert.equal(s.week,10);assert(L.archive(s));assert.equal(L.archives()[0].id,s.id);const next=L.create(4,8080);L.save(next);assert.equal(L.load().version,3);assert.equal(L.archives()[0].schedule.length,10,'starting eight-team season preserves legacy history');
}
const s=L.create(10,555);L.simDraft(s);while(!s.complete){const m=L.current(s);if(m)L.finish(s,m.id,42,0,{});else L.finishSpectatorWeek(s);}assert(L.archive(s));assert.equal(L.archives().length,2);assert(L.archive(s));assert.equal(L.archives().length,2,'archive deduplicates');
assert.throws(()=>L.create(3));const broken=L.create(0,7);broken.clubIds[1]=broken.clubIds[0];L.save(broken);assert.equal(L.load(),null);
console.log('PASS: frozen twelve-team draft and season saves finish unchanged; archived history survives new eight-team seasons; archive deduplication and validation');
