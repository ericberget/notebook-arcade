const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const P = require('../games/splash-line/park-progress.js');
const bridge = fs.readFileSync('ios/SketchwaterPark/native-bridge.js','utf8');
const html = fs.readFileSync('games/splash-line/index.html','utf8');
const key = 'splash-line-park-v1';
// Opening the software keyboard must not move focused inputs between UI trees.
const layoutSource = html.slice(html.indexOf('function layoutControls('), html.indexOf('let SC ='));
const fitSource = html.slice(html.indexOf('function fit()'), html.indexOf('function toStage('));
let movedControls = 0;
const viewport = {clientWidth:1180,clientHeight:800,style:{setProperty(){}}};
const layout = vm.createContext({
  document:{documentElement:viewport,body:{dataset:{},classList:{toggle(){}}}},
  window:{visualViewport:{height:800},SketchwaterNative:{}},innerHeight:800,devicePixelRatio:2,
  stage:{style:{},append(){movedControls++;}},mobileUI:{append(){movedControls++;}},stageControls:[{}],
  W:1200,H:720,scene:'title',clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  cv:{},drawPaper(){},rideCache:{clear(){}},$:()=>({})
});
vm.runInContext('let phoneLayout=false,SC=1,K=1.5;'+layoutSource+fitSource+'fit();',layout);
layout.window.visualViewport.height=420;
vm.runInContext('fit();',layout);
assert.equal(movedControls,0,'iPad keyboard must not reparent and blur the name field');
assert.equal(vm.runInContext('phoneLayout',layout),false);
// Native keyboard avoidance also resizes the WKWebView's layout viewport.
layout.document.activeElement={tagName:'INPUT'};viewport.clientHeight=420;
vm.runInContext('fit();',layout);
assert.equal(movedControls,0,'native keyboard resize must preserve the focused control');
layout.document.activeElement=null;
viewport.clientWidth=390;viewport.clientHeight=844;layout.window.visualViewport.height=844;
vm.runInContext('fit();',layout);
assert.equal(vm.runInContext('phoneLayout',layout),true,'a real narrow viewport still gets phone controls');
layout.window.visualViewport.height=400;vm.runInContext('fit();',layout);
assert.equal(movedControls,1,'phone keyboard must keep controls in place too');
const park = {version:2,name:'Original',tickets:42,rides:[],owned:{},drafts:{'0:body':{lot:0,kit:'body',strokes:[[[236,100],[400,300]]]}},settings:{muted:true,comfort:false}};
(async () => {
  const messages=[];let reject=false, release;
  const window={__SKETCHWATER_SAVES__:{[key]:JSON.stringify(park)},SplashProgress:P,webkit:{messageHandlers:{park:{postMessage:async msg=>{messages.push(msg);if(reject)throw Error('disk full');if(release)await release;return true;}}}}};
  vm.runInNewContext(bridge,{window});
  const store=window.SketchwaterNative.storage;
  assert.deepEqual(JSON.parse(store.getItem(key)),park,'hydrate legacy save and unfinished drawing before game startup');
  assert.throws(()=>store.setItem('unrelated','{}'));
  assert.throws(()=>store.setItem(key,'broken'));
  P.writeSave(store,key,{...park,tickets:55});
  await store.flush();assert.equal(JSON.parse(messages.at(-1).values[key]).tickets,55);
  assert.equal(JSON.parse(messages.at(-1).values[key+'-backup']).tickets,42);
  reject=true;P.writeSave(store,key,{...park,tickets:60});await assert.rejects(store.flush(),/disk full/);
  reject=false;await store.flush();assert.equal(JSON.parse(messages.at(-1).values[key]).tickets,60,'retry succeeds after disk error');
  let unblock; release=new Promise(r=>unblock=r);
  store.setItem(key,JSON.stringify({...park,tickets:70}));const first=store.flush();
  store.setItem(key,JSON.stringify({...park,tickets:80}));const second=store.flush();unblock();await Promise.all([first,second]);release=null;
  assert.equal(JSON.parse(messages.at(-1).values[key]).tickets,80,'serialized writes cannot revert newer progress');
  await window.SketchwaterNative.exportPark(JSON.stringify(park));assert.equal(messages.at(-1).action,'export');
  // Execute the real replacement routine and simulate pagehide during reload.
  const source=html.slice(html.indexOf('async function replacePark('),html.indexOf('function confirmImport('));
  let reloads=0;const state=structuredClone(park),notices=[];
  const context=vm.createContext({Progress:P,ParkStorage:store,SAVE_KEY:key,state,scene:'park',clearTimeout,toast:s=>notices.push(s),location:{reload(){reloads++;assert.equal(vm.runInContext('saveBlocked',context),true,'pagehide must not save old park');}},console});
  vm.runInContext('let saveBlocked=false,saveTimer=0;'+source,context);
  await vm.runInContext('replacePark({version:2,name:"Imported",tickets:99,rides:[],owned:{}})',context);
  assert.equal(reloads,1);assert.equal(JSON.parse(messages.at(-1).values[key]).name,'Imported');
  assert.equal(JSON.parse(messages.at(-1).values[key+'-previous-park']).name,'Original');
  assert.match(html,/button, \.back \{ touch-action: manipulation; \}/,'preserve pre-existing double-tap fix');
  assert(!html.includes('fonts.googleapis.com'),'fonts are bundled');
  console.log('PASS: stable keyboard layout, native hydration, draft preservation, disk acknowledgments, errors/retries, ordered writes, export, import/reload overwrite protection, double-tap fix and offline fonts.');
})().catch(e=>{console.error(e);process.exitCode=1;});
