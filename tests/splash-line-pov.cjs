const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../games/splash-line/index.html'), 'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const nodes = new Map();
const context = vm.createContext({ assert, console, matchMedia: () => ({ matches: false }),
  document: { querySelector: s => {
    if (!nodes.has(s)) nodes.set(s, { hidden: true, classList: { remove() {} } });
    return nodes.get(s);
  } } });
vm.runInContext([
  section('const GY =', '// ---------- stage & canvas'),
  section('function crPts(', 'function propsFor('),
  section('const V3 =', '// ----- world drawing -----'),
  section('// Clip a world-space surface', 'function povCollect()'),
  `let povSplashes = 0;
   const SFX = new Proxy({}, { get: (_, key) => () => { if (key === "povSplash") povSplashes++; } });
   let scene = 'pov', shown = 0, bookOpens = 0;
   const state = { firstRide: true, milestones: {} }, returnNotices = [];
   function save() {}
   function openBook() { bookOpens++; }
   function toast(text) { returnNotices.push(text); }
   function showScene(s) { scene = s; }
   function showPovEnd() { shown++; }
   function rideColor(kit) { return kit.color; }
   function povTubeArt() {}
   povScenery = () => [];
   function tick(dt) { now += dt; povUpdate(dt); }
   function checkCamera() {
     for (const v of [POV.cam.C, POV.cam.F, POV.cam.U])
       assert(Object.values(v).every(Number.isFinite), 'camera remains finite');
     assert(Math.abs(vdot(POV.cam.F, POV.cam.U)) < 1e-8, 'camera stays orthogonal');
   }
   const crossing = [V3(0,2,0),V3(1,2,0),V3(1,-2,0),V3(0,-2,0)];
   const clipped = povAboveDeck(crossing, 0);
   assert.equal(clipped.length, 4);
   assert(clipped.every(p => p.y >= 0), 'foreground slide never includes geometry below the deck');
   assert.equal(clipped.filter(p => p.y === 0).length, 2, 'crossing faces meet the deck exactly');
   assert.equal(povAboveDeck(crossing, 3).length, 0, 'entirely hidden faces stay behind wood');
   assert.deepEqual(povAboveDeck(crossing, -3), crossing, 'raised entrance is preserved');
   const visibleFace=[V3(-5,-5,20),V3(5,-5,20),V3(5,5,40),V3(-5,5,40)];
   assert(povPolyVisible(visibleFace));
   assert(!povPolyVisible(visibleFace.map(p=>V3(p.x+1000,p.y,p.z))),'offscreen faces skip drawing');
   assert(!povPolyVisible(visibleFace.map(p=>V3(p.x,p.y,-20))),'faces behind the camera skip drawing');
   assert(povPolyVisible([V3(-20,-5,-5),V3(20,-5,-5),V3(20,5,40),V3(-20,5,40)]),'faces crossing the near plane remain eligible');
   let strokes=0, vertices=0;
   const pen={save(){},restore(){},clip(){},beginPath(){},closePath(){},stroke(){strokes++;},moveTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));vertices++;},lineTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));vertices++;}};
   povWoodTexture(pen,visibleFace,100);
   assert(strokes>0&&strokes<25,'detailed wood uses a bounded number of batched strokes');
   assert(vertices>100,'grain and hatch detail remains present');
   assert.strictEqual(povWoodBatches(100),povWoodBatches(100),'pen batches are reused');
   strokes=0;povWoodTexture(pen,visibleFace.map(p=>V3(p.x+1000,p.y,p.z)),100);
   assert.equal(strokes,0,'hidden wood does no pen work');
   povWoodTexture(pen,[V3(-5,-5,-2),V3(5,-5,-2),V3(5,5,40),V3(-5,5,40)],100);
   let splashes = 0;
   for (const kit of KITS) {
     const style={x:Object.fromEntries(['flowers','umbrellas','lifering','loungers','lanterns','pinwheels','towels','bubbles','mistarch','beachballs','noodles','sailboats','duckies'].map(id=>[id,true]))};
     const extras=povExtraScenery(kit,style),bounds=povPoolBounds(kit);
     assert.equal(povExtraScenery(kit,null).length,0,'undecorated rides add no extra rendering work');
     assert(extras.some(item=>item.id==='sailboats'),'purchased sailboat is visible in POV');
     for(const item of extras){assert(Number.isFinite(item.x)&&Number.isFinite(item.z));if(item.floating){assert(item.x>bounds.left&&item.x<bounds.right&&Math.abs(item.z)<bounds.halfWidth,'floating extras stay in the basin');}else assert(Math.abs(item.z)>bounds.halfWidth,'shore decorations stay out of the water');}
     style.x.sailboats=false;assert(!povExtraScenery(kit,style).some(item=>item.id==='sailboats'),'turning off an extra removes it from POV');
     const T = buildTrack([crPts([[START_X, towerTop(kit)], ...EXAMPLES[kit.id]])], kit);
     const sim = simulate(T, kit), original = JSON.stringify(sim), splashBefore = povSplashes;
     openPOV({ kit, T, sim, name: kit.name, stars: 0, from: 'park' });
     povUpdate(0);
     const start = { ...POV.cam.C };
     assert.equal(POV.mph, 0, 'standing rider is not already moving');
     assert(start.y > kit.towerH + 40, 'starts standing above the wooden platform');
     assert(start.x < START_X - 30, 'starts behind the slide entrance');
     for (let i = 0; i < 89; i++) tick(1 / 60);
     assert(POV.t < 0, 'holds at the top before sitting');
     assert.deepEqual(POV.cam.C, start, 'standing viewpoint stays steady');
     tick(10);
     assert.deepEqual(POV.cam.C, start, 'waits indefinitely for Send it');
     assert.equal(POV.waiting, true);
     povSend();
     const launchTime = POV.t; povSend();
     assert.equal(POV.t, launchTime, 'double activation does not restart boarding');
     assert.equal(POV.waiting, false);
     const before = POV.t;
     for (let i = 0; i < 60; i++) tick(1 / 60);
     assert(Math.abs(POV.t - before - 0.6) < 1e-8, 'one second advances 0.6 seconds of ride');
     assert(POV.cam.C.y < start.y && POV.cam.C.x > start.x, 'camera lowers and moves toward the seat');
     assert.equal(POV.mph, 0, 'boarding has no ride speed');
     while (POV.t < -0.01) { tick(1 / 60); checkCamera(); }
     const seated = povTargetCam(0);
     assert(Math.hypot(POV.cam.C.x - seated.C.x, POV.cam.C.y - seated.C.y, POV.cam.C.z - seated.C.z) < 0.001, 'boarding meets the starting camera without a position jump');
     while (POV.phase === 'ride') { tick(1 / 60); checkCamera(); }
     const shownBefore = shown;
     if (sim.stats.outcome === 'splash') {
       splashes++;
       const entry = { ...POV.cam.C };
       assert.deepEqual(entry, POV.float.start, 'splash does not snap the camera');
       for (let i = 0; i < 240; i++) { tick(1 / 60); checkCamera(); }
       assert.equal(shown, shownBefore, 'four seconds on the water before results');
       assert(Math.hypot(POV.cam.C.x - entry.x, POV.cam.C.z - entry.z) > 1, 'continues drifting after splash');
       assert(POV.cam.C.x > kit.pool[0] && POV.cam.C.x < kit.pool[1], 'drift stays inside pool');
       const basin=povPoolBounds(kit);
       const ahead=POV.float.forward.x>0?basin.right-POV.cam.C.x:POV.cam.C.x-basin.left;
       assert(ahead>180,'ample water ahead of floating feet');
       assert(basin.halfWidth-Math.abs(POV.cam.C.z)>200,'room on both sides of rider');
       assert(POV.cam.C.y > 10 && POV.cam.C.y < 14, 'floats above water');
       assert(!POV.air && POV.mph < 1, 'air and speed settle after splash');
     }
     for (let i = 0; i < 300; i++) tick(1 / 60);
     assert.equal(shown, shownBefore + 1, 'results appear exactly once');
     assert.equal(povSplashes - splashBefore, sim.stats.outcome === 'splash' ? 1 : 0, 'POV splash audio plays exactly once on pool entry');
     assert.equal(JSON.stringify(sim), original, 'playback preserves simulation and score data');
   }
   assert(splashes > 0, 'tested successful splashdowns');
   for (const outcome of ['stuck', 'crash', 'gone']) {
     const sim = { ...POV.sim, stats: { ...POV.sim.stats, outcome } };
     openPOV({ kit: POV.kit, T: POV.T, sim, name: outcome, stars: 0, from: 'park' });
     povSend(); POV.t = POV.endT; tick(0.1);
     assert.equal(POV.phase, 'end'); assert.equal(POV.float, null);
     const before = shown;
     for (let i = 0; i < 28; i++) tick(0.05);
     assert.equal(shown, before, 'failure ending keeps its original delay');
     for (let i = 0; i < 4; i++) tick(0.05);
     assert.equal(shown, before + 1);
   }
   // Re-entering a ride clears its ending and countdown; leaving cannot show stale results.
   openPOV({ kit: POV.kit, T: POV.T, sim: POV.sim, name: 'Replay', stars: 0, from: 'park' });
   assert.equal(POV.float, null); assert.equal(POV.endShown, false);
   assert.equal(POV.waiting, true, 'replay waits for Send it again');
   assert(POV.t < 0); assert.equal(POV.phase, 'ride');
   closePOV();
   assert.equal(scene, 'park', 'leaving POV returns straight to the park');
   assert.equal(bookOpens, 0, 'first POV ride never opens the journal automatically');
   assert.equal(returnNotices.length, 1, 'first reward gets one quiet notice');
   closePOV();
   assert.equal(returnNotices.length, 1, 'reward notice does not repeat');
   openPOV({ kit: POV.kit, T: POV.T, sim: POV.sim, name: 'Workshop', stars: 0, from: 'ws' });
   POV.reportWasOpen = true; closePOV();
   assert.equal(scene, 'ws', 'workshop test returns to the workshop');
   assert.equal(document.querySelector('#report').hidden, false, 'workshop inspection stays available');
   assert.equal(bookOpens, 0);
   console.log('PASS: all ' + KITS.length + ' slide kits; POV decoration placement, batched wood, offscreen culling, slower playback, launch pause, finite cameras, ' + splashes + ' floating splashdowns, result timing, replay reset, uninterrupted park return, unchanged simulation.');`
].join('\n'), context);
