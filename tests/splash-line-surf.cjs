const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../games/splash-line/index.html'),'utf8');
const source=html.slice(html.indexOf('const SW = ['),html.indexOf('// ---------- drawing ----------',html.indexOf('const SW = [')));
const ctx=vm.createContext({assert,console});
vm.runInContext(`
const state={surf:{best:{}}},W=1200,INK='#123',GRAPH='#456',RED='#789',AQUA='#abc',AQUA_DK='#def';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),SFX=new Proxy({},{get:()=>()=>{}});
`+source+`
let r=sNew(SW[0],false);SURF.r=r;SURF.view='fp';SURF.useKeys=true;
assert(r.lesson);assert(sPractice(r));
for(let i=0;i<11*60;i++)sStep(r,1/60);
assert.equal(r.wipes,0,'first-time idle rider is safe during practice');assert.equal(r.surge,0);
assert(!r.items.some(i=>['fin','floaty'].includes(i.kind)),'practice spawns safe targets');
r.t=12;assert(!sPractice(r));
// Instruction steps require the actual movement, not just elapsed time.
r=sNew(SW[0],false);r.h=sFace(r,r.sx)*.7;sCoachStep(r);assert.equal(r.lesson.step,1);
r.h=sFace(r,r.sx)*.2;sCoachStep(r);assert.equal(r.lesson.step,2);
r.air=true;r.airT=.6;r.ah=200;r.avh=-200;r.spin=S_TAU+.8;sLand(r,sFace(r,r.sx));assert(r.goalDone);assert.equal(r.lesson.step,3);assert.equal(r.wipes,0);
r=sNew(SW[0],false);r.air=true;r.airT=.6;r.ah=200;r.avh=-200;r.spin=Math.PI;sLand(r,sFace(r,r.sx));assert.equal(r.wipes,1);assert(!r.goalDone,'a wipeout is not a clean landing');
// Real input through climb, drop, launch, release; all simulation state stays finite.
r=sNew(SW[0],false);SURF.r=r;SURF.useKeys=false;let sawAir=false,sawCarve=false;
for(let i=0;i<1800;i++){
 const f=i<45?.7:i<100?.15:i<170?1.3:.5;
 SURF.px=300+(f+.1)/1.5*600;SURF.hold=false;sStep(r,1/60);
 sawAir ||= r.air;sawCarve ||= r.lesson.step>=2;
 for(const k of ['h','v','vh','sx','cx','score'])assert(Number.isFinite(r[k]),k);
}
assert(sawCarve);assert(sawAir);assert(r.goalDone,'a beginner can complete the clean-landing goal');
state.surf.best.baby=100;r=sNew(SW[0],false);assert.equal(r.lesson,null,'completed first run skips tutorial');
assert.equal(sNew(SW[1],false).lesson,null);assert.equal(sNew(SW_POOL,false).lesson,null);assert.equal(sNew(SW[0],true).lesson,null);
for(const w of [...SW,SW_POOL]){
 const bot=sNew(w,true);for(let i=0;i<(w.time+8)*60;i++)sStep(bot,1/60);
 assert(bot.done,w.id+' finishes');assert(Number.isFinite(bot.score));assert(bot.score>=0);
}
console.log('PASS: surf practice safety, action-based coaching, real-input first jump/landing, repeat-player behavior, all wave completions.');
`,ctx);
