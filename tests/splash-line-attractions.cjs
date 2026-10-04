const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const P=require('../games/splash-line/park-progress.js');
const html=fs.readFileSync(path.join(__dirname,'../games/splash-line/index.html'),'utf8');
const section=(a,b)=>{const start=html.indexOf(a);assert(start>=0,a);const end=html.indexOf(b,start);assert(end>start,b);return html.slice(start,end)};
const setup=`
let now=0,REDUCED=true,frameN=0;
const W=1200,H=720,INK='#1f3d9e',GRAPH='#4a4a4f',RED='#c0392b',AQUA='#4fc3e0',SKIN='#f1c27d';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t,rnd=n=>(Math.sin(n)*.5+.5),pick=a=>a[0];
const state={owned:{},dive:{medals:{},best:{}}},MINI={type:'dive',hold:false,score:0,t:0,over:false},MINI_INFO={},MINI_INIT={},MINI_TAP={},MINI_STEP={};
const button={hidden:true},$=()=>button,SFX=new Proxy({},{get:()=>()=>{}});
function miniLabel(){}function miniEnd(){MINI.over=true;}function diveOnEnd(){}function setTimeout(){}
function htext(){}function jline(){}function jcircle(){}function drawCloud(){}function drawRideExtra(){}function drawPovFoot(){}function povDrawScenery(){}
`;
const ctx=vm.createContext({assert,console});
vm.runInContext(setup+section('const DV_EV =','// ----- drawing -----')+section('// First-person dive view.','MINI_DRAW.dive =')+`
// Exercise each event's real launch, tuck, entry and next-dive transitions.
const draw=new Proxy({},{get:(o,k)=>o[k]||((...args)=>{for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),'finite '+k);}),set:(o,k,v)=>{o[k]=v;return true;}});
for(const reduced of [true,false])for(const ev of DV_EV)for(const tuck of [true,false]){
 REDUCED=reduced;DVS.ev=ev;MINI.type='dive';MINI.hold=tuck;MINI.over=false;MINI.score=0;
 const d=MINI.d=MINI_INIT.dive();
 divePovWorld(draw,d);
 if(d.phase==='pick')MINI_TAP.dive({x:360,y:205});
 d.bt=ev.kind==='spring'||ev.kind==='cannon'?Math.PI/2/5.2:1/1.3;
 MINI_TAP.dive({x:600,y:240});assert.equal(d.phase,'air');
 let frames=0;
 while(d.phase==='air'&&frames++<600){
   now+=1/60;MINI_STEP.dive(1/60,d);
   const cam=divePovCamera(d,ev);for(const v of Object.values(cam))assert(Number.isFinite(v));
   divePovWorld(draw,d);divePovEntryGuide(draw,d);
 }
 assert.equal(d.phase,'judge',ev.id+' reaches water');assert(Number.isFinite(MINI.score));assert(d.result.js.every(n=>n>=0&&n<=10));
 const score=MINI.score;for(let i=0;i<205;i++){now+=1/60;MINI_STEP.dive(1/60,d);divePovWorld(draw,d);divePovScores(draw,d);}
 assert.equal(d.n,1);assert(['pick','bounce'].includes(d.phase));assert.equal(MINI.score,score,'one score per entry');
}
// Near-plane clipping must stay finite while a somersault crosses the horizon.
for(let a=0;a<Math.PI*4;a+=.11){
 const cam={y:200,z:90,sp:Math.sin(a),cp:Math.cos(a)},points=[[-500,0,0],[500,0,0],[500,0,1900],[-500,0,1900]].map(p=>divePovPoint(cam,p));
 for(const p of divePovClip(points))assert(p.z>=8-1e-8&&Object.values(p).every(Number.isFinite));
}
`,ctx);
// Existing parks retain purchased towers, but requests for the removed game are retired.
const legacy=P.normalize({rides:[],tickets:35,owned:{rescue:true},dive:{medals:{spring1:3}},request:{kind:'own',target:'rescue'}});
assert.equal(legacy.owned.rescue,true);assert.equal(legacy.dive.medals.spring1,3);assert.equal(legacy.tickets,35);
assert.equal(P.normalize({rides:[],owned:{},request:{kind:'own',target:'rescue'}}).request,null);
const layout=vm.createContext({assert});
vm.runInContext(`let SLOTS=[],PW=0;const state={owned:{}},PARK={rt:new Map()};const lotCountShown=()=>6;`+section('const LAYOUT =','function salePlaceholder(')+section('function buildSlots()','const PALM_X')+`
buildSlots();assert(!SLOTS.some(s=>s.type==='rescue'));const lots=SLOTS.filter(s=>s.type==='lot').map(s=>s.lot);
state.owned.rescue=true;buildSlots();assert.equal(SLOTS.filter(s=>s.type==='rescue').length,1);assert.deepEqual(SLOTS.filter(s=>s.type==='lot').map(s=>s.lot),lots);
`,layout);
// Handoff cues must follow complete, matching orders, including duplicate items and wrapping.
const gifts=vm.createContext({assert});
vm.runInContext(section('const giftPrice =','// ----- drawing the souvenirs -----')+section('function giftReadyCustomers(','function giftCounterGuide(')+`
const d={cur:null,cus:[{state:'wait',order:{items:['ball','ball'],wrap:true}},{state:'wait',order:{items:['tee_red'],wrap:false}}]};
assert.equal(giftReadyCustomers(d).length,0);giftAdd(d,'ball');giftAdd(d,'ball');assert.equal(giftReadyCustomers(d).length,0);giftAdd(d,'wrap');assert.equal(giftReadyCustomers(d)[0],d.cus[0]);
assert(giftAdd(d,'tee_red'),'cannot add to wrapped bag');d.cus[0].state='happy';assert.equal(giftReadyCustomers(d).length,0);
d.cur=null;giftAdd(d,'tee_red');assert.equal(giftReadyCustomers(d)[0],d.cus[1]);
`,gifts);
// The attractions dispatch dedicated effects; quiet settings do not schedule audio.
const audio=vm.createContext({assert});
vm.runInContext(`let t=1,on=true,calls=[];const T=()=>t,ok=()=>on;let lastSquirt=-1,lastBoatBump=-1,boatBumpBuf=null;const sample=(...x)=>calls.push(['sample',...x]);const tone=(...x)=>calls.push(['tone',...x]),noise=(...x)=>calls.push(['noise',...x]);const fx={`+section('    squirt() {','    erase() {')+`};
fx.squirt();assert(calls.length>0);const first=calls.length;fx.squirt();assert.equal(calls.length,first,'held gun rate is bounded');t++;calls=[];fx.boatBump();assert(calls.some(c=>c[0]==='tone'&&c[2]<300),'boat impact has a low rubber tone');
boatBumpBuf={approved:true};t++;calls=[];fx.boatBump(.55);assert.equal(calls.length,1);assert.equal(calls[0][0],'sample');assert.equal(calls[0][1],boatBumpBuf);assert.equal(calls[0][2],.55);fx.boatBump();assert.equal(calls.length,1,'collision burst is rate limited');
on=false;t++;calls=[];fx.squirt();fx.boatBump();assert.equal(calls.length,0);
`,audio);
console.log('PASS: five first-person dive events in both camera modes, launch/entry/score/reset, finite clipping, gift handoff cues, legacy tower saves and distinct muted/rate-limited effects.');
