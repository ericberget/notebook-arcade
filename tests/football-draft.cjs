const assert=require('node:assert/strict'),L=require('../games/xo-football/league.js');
const storage=new Map();global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const base=JSON.stringify(L.rosters);
for(const {id:team} of L.activeTeams){
 let s=L.create(team,1000+team);
 assert.equal(L.current(s),null,'cannot start games before the draft');assert(!L.finishSpectatorWeek(s),'cannot skip the draft through simulation');
 assert.equal(s.draft.prospects.length,80);assert.equal(new Set(s.draft.prospects.map(p=>p.name)).size,80);
 const ids=[];
 for(let round=0;round<5;round++){
  const turn=L.draftTurn(s);assert.equal(turn.team,team);assert.equal(turn.round,round);assert.equal(turn.role,L.draftRoles[round]);
  const choices=L.draftOptions(s);assert(choices.length>=5);const pick=choices[Math.min(3,choices.length-1)];ids.push(pick.id);
  const invalid=s.draft.prospects.find(p=>p.role!==pick.role);assert(!L.draftPick(s,invalid.id));assert(!L.draftPick(s,'unknown'));
  assert(L.draftPick(s,pick.id));assert(!L.draftPick(s,pick.id),'already drafted cannot be picked again');
  assert(L.save(s));s=L.load();assert(s,'mid-draft save is readable');
 }
 assert(s.draft.complete);assert.equal(s.draft.picks.length,40);assert.equal(new Set(s.draft.picks.map(p=>p.playerId)).size,40);
 assert(L.current(s),'week one unlocks');assert(!L.simDraft(s));
 for(const t of L.activeTeams){const picks=s.draft.picks.filter(p=>p.team===t.id);assert.equal(picks.length,5);assert.deepEqual(picks.map(p=>p.role),L.draftRoles);assert.deepEqual(L.rosterFor(s,t.id).map(p=>p.role),L.roles);for(const p of picks)assert(L.rosterFor(s,t.id).some(x=>x.id===p.playerId&&x.role===p.role));}
 for(let round=0;round<5;round++)assert.equal(s.draft.picks[round*8+(round%2?7:0)].team,team,'snake order reverses each round');
 assert.deepEqual(s.draft.picks.filter(p=>p.team===team).map(p=>p.playerId),ids);
}
const partial=L.create(4,77),chosen=L.draftOptions(partial)[4];L.draftPick(partial,chosen.id);assert(L.simDraft(partial));assert.equal(L.rosterFor(partial,4)[0].id,chosen.id,'simulate keeps the manual selection');assert.equal(JSON.stringify(L.rosters),base,'Quick Play rosters stay unchanged');
const all=L.create(4,78);L.simDraft(all);assert(all.draft.picks.every(p=>p.automatic));
storage.clear();storage.set('notebook-football-season-v1',JSON.stringify({version:1,team:4,week:3}));const old=storage.get('notebook-football-season-v1');assert(L.legacySave());assert.equal(L.load(),null);L.save(partial);assert.equal(storage.get('notebook-football-season-v1'),old,'old season is preserved separately');assert(L.load().draft.complete);
console.log('PASS: 8 manual drafts, five required positions, 80 unique prospects, 40 unique picks, snake order, saves after every pick, simulation preserves selections, legacy save preserved, Quick Play unchanged');
