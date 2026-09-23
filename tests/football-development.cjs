const assert=require('node:assert/strict'),L=require('../games/xo-football/league.js');
const storage=new Map();global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const quick=JSON.stringify(L.rosters);
const fresh=seed=>{const s=L.create(4,seed);L.simDraft(s);return s;};
const finish=(s,line={})=>{const m=L.current(s);assert(m);assert(L.finish(s,m.id,28,14,line));return m.id;};
for(let seed=0;seed<80;seed++){
 const s=L.create(4,seed);
 for(const p of s.draft.prospects){assert(p.attrs.speed<=90);assert(Object.values(p.attrs).every(v=>v<=92));assert(p.overall<=92);}
 L.simDraft(s);
 for(const t of L.activeTeams)for(const p of L.rosterFor(s,t.id).filter(p=>L.draftRoles.includes(p.role))){assert(p.attrs.speed<=90);assert(Object.values(p.attrs).every(v=>v<=92));}
}
// An old draft keeps committed picks; only still-available prospects get capped.
const partial=L.create(4,801),first=L.draftOptions(partial)[0];L.draftPick(partial,first.id);
const existing=partial.rosters[4][0];existing.attrs.speed=96;existing.attrs.arm=98;
const oldProspect=partial.draft.prospects.find(p=>p.role==='WR');oldProspect.attrs.speed=96;oldProspect.attrs.hands=96;
assert(L.draftOptions(partial).find(p=>p.id===oldProspect.id).attrs.speed<=90);
assert.equal(existing.attrs.speed,96);assert.equal(existing.attrs.arm,98);
L.save(partial);assert.equal(L.load().rosters[4][0].attrs.speed,96);


let s=fresh(803),qb=s.rosters[4][0],wr=s.rosters[4].find(p=>p.role==='WR-L'),rb=s.rosters[4].find(p=>p.role==='RB');
assert.equal(L.performance(s).points,0);assert(!L.upgradePlayer(s,qb.id,'speed').accepted);
const priorRatings=JSON.stringify(s.rosters[4]);
const match=finish(s,{[qb.id]:{pass:250,passTd:2},[wr.id]:{receive:200,catches:8,td:2},[rb.id]:{rush:50,receive:50,catches:2}});
assert.equal(L.performance(s).points,130,'yards, catches, TDs and win award a visible squad bank');
assert.equal(s.lastPerformance.earned,130);assert.equal(s.lastPerformance.balance,130);
assert.equal(s.lastPerformance.breakdown.yards,60,'passing and receiving yards are not doubled');
assert.equal(s.lastPerformance.breakdown.touchdowns,30,'passing TDs and scoring TDs are not doubled');
assert.equal(JSON.stringify(s.rosters[4]),priorRatings,'earning points NEVER applies an automatic upgrade to the user squad');
const before=JSON.stringify(s);assert(!L.finish(s,match,28,14,{[qb.id]:{pass:9999}}));assert.equal(JSON.stringify(s),before,'duplicate final cannot award points twice');
L.save(s);s=L.load();qb=s.rosters[4][0];wr=s.rosters[4].find(p=>p.role==='WR-L');
const originalSpeed=qb.attrs.speed,originalOverall=qb.overall;
const result=L.upgradePlayer(s,qb.id,'speed');assert(result.accepted);assert.equal(qb.attrs.speed,originalSpeed+1);assert(qb.overall>=originalOverall);
assert.equal(L.performance(s).points,30);assert.equal(L.performance(s).spent,100);assert.equal(L.performance(s).earned,130);
assert.equal(qb.upgrades.speed,1);assert.equal(s.rosterRevision,1,'upgrades invalidate in-flight games with old ratings');
const unchanged=JSON.stringify(s);assert(!L.upgradePlayer(s,qb.id,'speed').accepted);assert.equal(JSON.stringify(s),unchanged,'insufficient points leave the squad unchanged');
L.save(s);assert.deepEqual(L.load(),s,'chosen upgrades and unused points persist');
finish(s,{});assert.equal(L.performance(s).points,50,'unspent points carry over plus the new win reward');
assert.equal(s.lastPerformance.earned,20,'last-game panel reports only that game');

// Enough points to choose any starter and any of that position's real attributes.
s=fresh(804);let capMatch=finish(s,Object.fromEntries(s.rosters[4].map(p=>[p.id,{pass:10000,rush:10000,catches:100,receive:10000,td:100,passTd:100}])));
assert.equal(L.performance(s).points,200,'per-game performance awards are bounded');
const own=s.rosters[4].filter(p=>L.draftRoles.includes(p.role));
for(const p of own)for(const attribute of L.upgradeAttributes(p)){
 const trial=JSON.parse(JSON.stringify(s)),player=trial.rosters[4].find(x=>x.id===p.id),from=player.attrs[attribute];
 assert(L.upgradePlayer(trial,p.id,attribute).accepted);assert.equal(player.attrs[attribute],from+1);assert.equal(L.performance(trial).points,100);
}
wr=s.rosters[4].find(p=>p.role==='WR-L');
assert(!L.upgradePlayer(s,wr.id,'arm').accepted,'hidden non-QB arm is not an upgrade option');
const opponent=L.allPlayers(s).find(p=>p.team!==s.team&&p.role==='QB');
assert(!L.upgradePlayer(s,opponent.id,'speed').accepted,'cannot upgrade another team');
assert(!L.upgradePlayer(s,'missing','speed').accepted);assert(!L.upgradePlayer(s,wr.id,'anything').accepted);
qb=s.rosters[4][0];qb.attrs.speed=98;
assert(L.upgradePlayer(s,qb.id,'speed').accepted);assert.equal(qb.attrs.speed,99);
const remaining=L.performance(s).points;
assert(!L.upgradePlayer(s,qb.id,'speed').accepted);assert.equal(L.performance(s).points,remaining,'99 ceiling never consumes points');
assert(L.upgradePlayer(s,wr.id,'hands').accepted);assert.equal(L.performance(s).points,0,'second upgrade can go to a different player');
assert(Object.values(s.stats).some(x=>x.pass>0),'upgrade spending preserves game stats');
for(let i=0;i<3;i++)finish(s,{});
assert(L.allPlayers(s).filter(p=>p.team!==s.team).some(p=>Object.keys(p.upgrades||{}).length),'AI teams spend their own earned points');
assert.equal(qb.attrs.speed,99,'no further automatic changes to chosen ratings');
L.save(s);assert.deepEqual(L.load(),s);
assert.equal(JSON.stringify(L.rosters),quick,'Quick Play ratings remain unchanged');
console.log('PASS: draft caps, committed picks preserved, earned squad points, no invisible user gains, 100-point choice, persistence, duplicate protection, all positions, invalid spending, 99 ceiling, AI development and Quick Play isolation');
