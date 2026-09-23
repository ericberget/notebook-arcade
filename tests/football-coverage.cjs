const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const noop=()=>{},nodes=new Map(),events={};
const ctx=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
function node(){return {style:{},classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},dataset:{},children:[],appendChild(x){this.children.push(x)},addEventListener:noop,setAttribute:noop,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1200,height:720})};}
const doc={getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement:node,querySelectorAll:()=>[],addEventListener:noop};
const math=Object.create(Math);let seed=1;math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
const sandbox={XOLeague:require('../games/xo-football/league.js'),document:doc,window:{innerWidth:1400,innerHeight:900,addEventListener:(k,f)=>(events[k]??=[]).push(f)},Image:class{},localStorage:{getItem:()=>null},NotebookPaper:{draw:noop},NotebookInk:()=>new Proxy({INK:'#123',RED:'#c00',GRAPHITE:'#333'},{get:(o,k)=>o[k]||noop}),Matter:require('../shared/matter.min.js'),requestAnimationFrame:noop,performance:{now:()=>1},setTimeout:noop,clearTimeout:noop,Math:math};
vm.createContext(sandbox);
const html=fs.readFileSync(process.env.FOOTBALL_HTML || 'games/xo-football/play.html','utf8');
vm.runInContext([...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)][0][1],sandbox);
const run=s=>vm.runInContext(s,sandbox);

run(`
function coverageFixture(){
 setupPlay(); state='live'; introT=9999; playFrame=0;
 const r=byName('WR-L'), d=byName('CB-L'), qb=byName('QB');
 players=[qb,r,d]; World.clear(world,false); World.add(world,[r.body,d.body]);
 Body.setPosition(r.body,{x:200,y:600}); r.home={...r.body.position};
 Body.setPosition(d.body,{x:200,y:555}); d.home={...d.body.position};
 d.coverage={cadence:7,cushion:18,shade:0,pace:1,bite:.82};
 r.route=[{x:200,y:450},{x:500,y:450}];
 return {r,d,qb};
}
function trial(disableCut=false){
 const {r,d}=coverageFixture(), original=routeCut;
 if(disableCut)routeCut=()=>{};
 const samples=[];let cutFrame=null;
 for(let frame=0;frame<260;frame++){
  playFrame++; followRoute(r);updateDefense();Engine.update(engine,1000/60);
  if(d.cutRead&&cutFrame===null)cutFrame=playFrame;
  samples.push({frame:playFrame,gap:Math.hypot(r.body.position.x-d.body.position.x,r.body.position.y-d.body.position.y),cut:!!d.cutRead,rx:r.body.position.x,dx:d.body.position.x});
 }
 routeCut=original; return {samples,cutFrame};
}
`);

// Physical separation, using the real Matter simulation and identical coverage.
seed=1;const cut=run('trial()');seed=1;const plain=run('trial(true)');
assert(cut.cutFrame>0,'a real route corner triggers the juke');
const during=cut.cutFrame+20;
assert(cut.samples[during-1].gap>plain.samples[during-1].gap+15,'biting creates a useful throwing window');
assert.equal(cut.samples.at(-1).cut,false,'the recovery penalty expires');
assert(run("byName('CB-L').body.collisionFilter.mask !== 0"),'juking never disables defender collisions');

run(`
function cornerScenario({route,kind='WR',human=false,job='man',far=false}={}){
 const {r,d,qb}=coverageFixture();r.kind=kind;
 if(route)r.route=route;
 Body.setPosition(r.body,r.route[0]);Body.setPosition(d.body,{x:r.body.position.x,y:r.body.position.y-(far?150:18)});
 d.job=job;d.zone={...d.body.position};
 if(human){game.possession='pencils';coachMode=false;ctrl=d;}
 playFrame=100;return {r,d,qb};
}
`);
const forceBite=math.random;math.random=()=>0;
run('cornerScenario();routeCut(byName("WR-L"),0)');
assert(run('!!byName("CB-L").cutRead'),'a fooled corner commits the wrong way');
const expectedAim=run('JSON.stringify(byName("CB-L").cutRead.aim)');
run('ball.carrier=null;ball.flying={to:{x:400,y:450},target:byName("WR-L")};updateDefense()');
assert.equal(run('JSON.stringify(byName("CB-L").cutRead.aim)'),expectedAim,'throwing during the cut does not give the DB an instant read');
assert(run('byName("CB-L").body.force.y<0'),'DB initially follows the old direction even while the pass is in flight');
run('ball.flying=null;giveBall(byName("WR-L"));updateDefense()');assert(!run('byName("CB-L").cutRead'),'a catch restores normal pursuit');
for(const config of [
 {route:[{x:200,y:450},{x:200,y:200}]},
 {route:[{x:200,y:450},{x:201,y:435},{x:199,y:420},{x:200,y:405}]},
 {kind:'RB'}, {human:true}, {job:'zoneSpot'}, {job:'rush'}, {far:true}
]){
 run('game.possession="you";coachMode=false;cornerScenario('+JSON.stringify(config)+');routeCut(byName("WR-L"),0)');
 assert(!run('byName("CB-L").cutRead'),'no juke for straight lines, drawing wobble, other positions, user control, zones, blitzes or distant coverage');
}
run(`game.possession='you';cornerScenario();
 const dense=byName('WR-L');dense.route=[];
 for(let y=580;y>=450;y-=10)dense.route.push({x:200,y});
 for(let x=210;x<=400;x+=10)dense.route.push({x,y:450});
 routeCut(dense,13);`);
assert(run('!!byName("CB-L").cutRead'),'densely sampled drawn routes also produce a cut');
run('delete byName("CB-L").cutRead;playFrame+=10;routeCut(byName("WR-L"),13)');
assert(!run('byName("CB-L").cutRead'),'rapid repeated cuts cannot stun-lock a defender');
math.random=()=>.99;
run('cornerScenario();routeCut(byName("WR-L"),0)');assert(!run('byName("CB-L").cutRead'),'a clean read stays with the receiver');
math.random=forceBite;

run(`
function rbTrial(oldCoverage){
 setupPlay();state='live';playFrame=0;introT=9999;
 const r=byName('RB'),d=byName('LB-L');
 players=[byName('QB'),r,d];World.clear(world,false);World.add(world,[r.body,d.body]);
 r.route=[{x:r.home.x+120,y:r.home.y-14},{x:r.home.x+170,y:r.home.y-80}];
 const samples=[];
 for(let i=0;i<180;i++){
  playFrame++;followRoute(r);
  if(oldCoverage){if(playFrame%7===d.id%7||!d.aim)d.aim={x:r.body.position.x+r.body.velocity.x*4,y:r.body.position.y-18+r.body.velocity.y*4};steer(d,d.aim,.88);}
  else updateDefense();
  Engine.update(engine,1000/60);samples.push(Math.hypot(r.body.position.x-d.body.position.x,r.body.position.y-d.body.position.y));
 }
 return samples;
}
`);
const newRB=run('rbTrial(false)'),oldRB=run('rbTrial(true)');
const avg=a=>a.slice(80,160).reduce((n,v)=>n+v,0)/80;
assert(avg(newRB)<avg(oldRB)*.85,'LB closes the easy backfield outlet sooner with real physics');
assert(avg(newRB)>15,'better tracking still leaves space to play the matchup');
console.log('PASS: sharp-cut separation, bounded DB recovery, clean reads, hand-drawn routes, no jitter/exploit jukes, live collisions and manual control, faster RB coverage');
