const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const P = require('../games/splash-line/park-progress.js');
const html = fs.readFileSync(path.join(__dirname, '../games/splash-line/index.html'), 'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const context = vm.createContext({ console, assert, P, matchMedia: () => ({matches:false}) });
vm.runInContext(section('const GY =', '// ---------- stage & canvas') + section('function crPts(', 'function propsFor(') + `
  const kit = KITS.find(k=>k.id==='body'), anchor={x:START_X,y:towerTop(kit)};
  const origin={x:anchor.x-15,y:anchor.y-20};
  let previous={...anchor}, launch=true;
  const points=[previous];
  for(const delta of [[0,0],[2,-4],[5,-2],[10,5],[20,10],[40,25],[100,70],[230,145],[360,205],[520,260]]) {
    const result=P.drawPoint({x:origin.x+delta[0],y:origin.y+delta[1]},origin,anchor,previous,launch,40);
    points.push(result.point);previous=result.point;launch=result.launch;
  }
  assert(points.every(p=>p.y>=anchor.y),'initial fingertip offset and jitter never draw uphill');
  assert.equal(points[1].x,anchor.x); assert.equal(points[1].y,anchor.y,'stationary contact adds no offset kink');
  assert.equal(launch,false,'freehand behavior resumes beyond the launch area');
  const T=buildTrack([points],kit), simulation=simulate(T,kit);
  assert.equal(simulation.stats.outcome,'splash','offset finger plus jitter still produces a working basic slide');
  const before=JSON.stringify(points);buildTrack([points],kit);assert.equal(JSON.stringify(points),before,'physics does not mutate saved drawings');
  globalThis.fixture={id:1,lot:0,kit:'body',name:'My slide',stars:3,strokes:[points.map(p=>[p.x,p.y])],traj:simulation.frames.filter((f,i)=>i%3===0).map(f=>[f.x,f.y,f.r,f.a]),stats:{topMph:simulation.stats.topMph,maxG:simulation.stats.maxG,air:simulation.stats.longestAir,time:simulation.stats.rideTime,drop:simulation.stats.dropFt},riders:0,earned:0};
`, context);
const anchor = {x:236,y:380}, origin={x:225,y:370};
const hill=P.drawPoint({x:400,y:200},origin,anchor,{x:420,y:460},false,40);
assert.equal(hill.point.y,210,'intentional hills are not flattened after the start');
assert.equal(hill.point.x,411,'gesture continues relative to the initial contact');
const fixture=JSON.parse(JSON.stringify(context.fixture));
const park=P.normalize({name:'Legacy park',tickets:42,rides:[fixture],owned:{},welcomed:true});
assert.equal(park.mastered.body,true,'existing three-star rides migrate into mastery');
assert.equal(park.version,2);
assert.deepEqual(park.settings,{muted:false,comfort:true});
const duplicate=JSON.parse(JSON.stringify(fixture));duplicate.id=2;duplicate.lot=1;
assert.equal(P.facts(P.normalize({...park,rides:[fixture,duplicate]})).mastered,1,'duplicate ride designs do not count as multiple mastery stamps');
const newer={...park,version:99};assert.throws(()=>P.normalize(newer),/newer version/);
assert.throws(()=>P.normalize({...park,rides:[{...fixture,strokes:null}]}),/incomplete/);
assert.throws(()=>P.normalize({...park,rides:[{...fixture,stats:{}}]}),/inspection/);
assert.throws(()=>P.normalize({...park,rides:[fixture,fixture]}),/incomplete/);
const migrated=P.normalize({...park,trophies:7,request:{kind:'palms',base:10},settings:{muted:true,comfort:false},drafts:{'0:body':{lot:0,kit:'body',strokes:fixture.strokes}}});
assert.equal(migrated.trophies,7,'legacy prize unlocks stay available');
assert.equal(migrated.request,null,'impossible legacy request is removed');
assert.equal(migrated.settings.muted,true);
assert(migrated.drafts['0:body'],'unfinished drawing survives serialization');
const full={...park,firstRide:true,reqsDone:3,mastered:{body:true,tube:true,loop:true},owned:{snack:true,river:true},rides:['body','tube','loop','drop','tour'].map((kit,i)=>({...fixture,id:i+1,lot:i,kit,stars:2,style:i===0?{paint:'#118ab2'}:undefined}))};
assert.equal(P.facts(full).ready,true,'all four milestones lead to final inspection');
assert.equal(P.facts({...full,reqsDone:2}).ready,false,'final inspection waits for guest requests');
assert.equal(P.facts({...full,rides:full.rides.filter(r=>r.kit!=='tour')}).ready,false,'Grand Tour is the capstone');
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
P.writeSave(storage,'park',park);P.writeSave(storage,'park',{...park,tickets:50});
assert.equal(P.readSave(storage,'park').park.tickets,50);
storage.setItem('park','broken');
assert.equal(P.readSave(storage,'park').recovered,true,'corrupt primary falls back to valid backup');
assert.equal(P.readSave(storage,'park').park.tickets,42);
P.writeSave(storage,'park',{...park,tickets:60});
assert.equal(JSON.parse(storage.getItem('park-backup')).tickets,42,'corrupt primary does not replace good backup');
assert.throws(()=>P.writeSave({getItem:()=>null,setItem:()=>{throw new Error('quota');}},'park',park),/quota/);
// Cosmetic entrance purchases must respect unlocks, preserve tickets, and survive reloads.
const gatePark=JSON.parse(JSON.stringify(park));gatePark.tickets=100;
assert.equal(gatePark.entranceStyle,'classic','legacy parks keep the classic entrance');
assert.equal(P.selectEntrance(gatePark,'seaside'),false,'tickets alone cannot bypass design unlocks');
assert.equal(gatePark.tickets,100);
gatePark.rides=[0,1,2].map(i=>({...fixture,id:i+1,lot:i}));
assert.equal(P.selectEntrance(gatePark,'seaside'),false,'copies of one design do not unlock a style');
gatePark.rides[1].kit='tube';gatePark.rides[2].kit='loop';gatePark.tickets=24;
assert.equal(P.selectEntrance(gatePark,'seaside'),false,'purchase cannot overdraw tickets');
gatePark.tickets=100;assert.equal(P.selectEntrance(gatePark,'seaside'),true);assert.equal(gatePark.tickets,75);
assert.equal(P.selectEntrance(gatePark,'seaside'),true);assert.equal(gatePark.tickets,75,'repeat selection never charges twice');
P.selectEntrance(gatePark,'classic');P.selectEntrance(gatePark,'seaside');assert.equal(gatePark.tickets,75);
const restoredGate=P.normalize(JSON.parse(JSON.stringify(gatePark)));assert.equal(restoredGate.entranceStyle,'seaside');assert.equal(restoredGate.entranceStyles.seaside,true);
restoredGate.rides=[];assert.equal(P.selectEntrance(restoredGate,'seaside'),true,'owned styles remain available after redesigning the park');
assert.equal(P.selectEntrance(gatePark,'unknown'),false);
assert.equal(P.normalize({...park,entranceStyle:'festival'}).entranceStyle,'classic','unowned selections fall back safely');
for(const item of P.entrances.filter(e=>e.price)){
 const ready={...park,tickets:item.price,rides:P.families.slice(0,item.need).map((kit,i)=>({...fixture,id:i+1,lot:i,kit}))};
 assert.equal(P.selectEntrance(ready,item.id),true);assert.equal(ready.tickets,0);assert.equal(P.normalize(ready).entranceStyle,item.id);
}
// New ride decorations use the same unlock, purchase, toggle, and save path as existing extras.
const extras=vm.createContext({console,assert,P,fixture});
vm.runInContext(`
 const state={tickets:100},SFX={cash(){},pop(){}},rideCache=new Map();
 function setTickets(n){state.tickets=n;}function save(){}function toast(){}
`+section('const PAINTS =','// ---------- the test rider crew')+`
 renderStyleOpts=()=>{};
 for(const id of ['beachballs','flowers','umbrellas','lifering','loungers','lanterns','pinwheels','noodles','towels','sailboats','bubbles','mistarch']){
   const item=STYLE_OPTS.x.items.find(x=>x.id===id);
   assert(item,'extra is offered in the style picker');
   ST.ride=JSON.parse(JSON.stringify(fixture));ST.ride.riders=item.need-1;state.tickets=100;
   styleChoose('x',id);assert.equal(state.tickets,100);assert(!ST.ride.style.x[id],'rider unlock is respected');
   ST.ride.riders=item.need;state.tickets=item.cost-1;
   styleChoose('x',id);assert.equal(state.tickets,item.cost-1);assert(!ST.ride.style.x[id],'cannot overspend');
   state.tickets=100;styleChoose('x',id);assert.equal(state.tickets,100-item.cost);assert.equal(ST.ride.style.x[id],true);
   styleChoose('x',id);assert.equal(ST.ride.style.x[id],false,'owned extras can be removed');
   ST.ride.riders=0;styleChoose('x',id);assert.equal(ST.ride.style.x[id],true);assert.equal(state.tickets,100-item.cost,'owned extras are free to reapply');
   const restored=P.normalize(JSON.parse(JSON.stringify({rides:[ST.ride],tickets:state.tickets})));
   assert.equal(restored.rides[0].style.x[id],true,'decoration survives saving and loading');
   assert.equal(restored.rides[0].bought['x:'+id],true,'purchase survives saving and loading');
 }
`,extras);
// Park packages enforce design and amenity requirements in the purchase handler,
// then persist ownership without charging twice or inflating amenity milestones.
const parkExtras=vm.createContext({console,assert,P,fixture});
vm.runInContext(`
 const Progress=P,state={tickets:100,owned:{},rides:[]},UMB_X=Array(11),now=0,W=1200,PW=10000,PG=540;
 const SLOTS=['gate','snack','gift','hottub','wave','surf'].map((type,i)=>({type,x:10+i*500,w:300}));
 const slotOf=type=>SLOTS.find(s=>s.type===type),slotOfLot=lot=>({x:3300+lot*632,w:612});
 const PARK={camX:0,camTarget:0,popups:[]},MASCOT={},SFX={cash(){}};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function setTickets(n){state.tickets=n;}function save(){}function hidePanels(){}function updateFireworksBtn(){}function toast(){}
`+section('const TIER1 =','function openShop(focus)')+section('function parkExtraSpots(', 'function drawParkExtras(')+section('function buy(it)', 'function showPrize(')+`
 for(const id of ['wayfinding','pinwheelgarden','picnic','cabanas','duckparade','parkbunting']){
   const it=SHOP.find(i=>i.id===id);assert(it&&it.art,'package has shop artwork');
   state.tickets=100;state.owned={};state.rides=[];
   const setDesigns=n=>{state.rides=P.families.slice(0,n).map((kit,i)=>({...fixture,id:i+1,lot:i,kit}));};
   if(it.needs)state.owned[it.needs[0]]=true;
   if(it.needDesigns){setDesigns(it.needDesigns-1);buy(it);assert.equal(state.tickets,100);assert(!state.owned[id],'locked package cannot be bought');}
   setDesigns(it.needDesigns||0);
   if(it.needs){state.owned={};buy(it);assert.equal(state.tickets,100);assert(!state.owned[id],'required amenity is checked on purchase');state.owned[it.needs[0]]=true;}
   state.tickets=it.price-1;buy(it);assert.equal(state.tickets,it.price-1);assert(!state.owned[id],'cannot overspend');
   const amenities=P.facts(state).amenities;state.tickets=100;buy(it);
   assert.equal(state.owned[id],true);assert.equal(state.tickets,100-it.price);assert(Number.isFinite(PARK.camTarget),'camera goes to the new decoration');
   buy(it);assert.equal(state.tickets,100-it.price,'packages are purchased once');
   assert.equal(P.facts(state).amenities,amenities,'cosmetic packages do not count as amenities');
   assert.equal(P.normalize(JSON.parse(JSON.stringify(state))).owned[id],true,'package survives a save round trip');
   for(const spot of parkExtraSpots(id)){assert(spot.x>=0&&spot.x<PW);assert(spot.y<570,'decorations leave the guest path clear');}
 }
`,parkExtras);
// Exercise actual request generation at maximum decoration counts.
const requests=vm.createContext({console,assert});
vm.runInContext(`const state={owned:{},rides:[],palms:10,flowers:12,goodGames:0};const TIER1=[],TIER2=[],KITS=[];const firstFreeLot=()=>0;const isMystery=()=>false;const unlockedCount=()=>0;`+section('function reqOptions()', 'function reqCheck()')+`assert(!reqOptions().some(r=>['palms','flowers'].includes(r.kind)));assert(reqOptions().some(r=>r.kind==='rides'));`,requests);
console.log('PASS: forgiving launch physics, freehand hills, draft/settings migration, unique mastery, campaign completion, backup recovery, failed saves, attainable requests, entrance unlocks and purchases, all twelve ride extras, six park packages, purchase requirements and saved ownership.');
