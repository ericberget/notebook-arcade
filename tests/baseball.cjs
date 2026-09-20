const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const html = fs.readFileSync('games/baseball/index.html', 'utf8');
for (const m of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
const battingSource = html.slice(html.indexOf('const SWING_CONTACT'), html.indexOf('function ballOn'));
const pitchesSource = html.slice(html.indexOf('const PITCHES'), html.indexOf('// ---------- contact ----------'));
const launchSource = html.slice(html.indexOf('function launch(c)'), html.indexOf('function startRunners'));
const stepSource = html.slice(html.indexOf('function step()'), html.indexOf('let lastT ='));
let seed = 4123;
const math = Object.create(Math); math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
const home = {x:560,y:612};
const context = { Math: math, PV:{ZX:400,ZY:460,ZW:48,ZH:100,hand:{x:803,y:428}}, MOUND:{x:560,y:462},HOME:home,
  GRAV:.32,FENCE_R:440,FIELDER_SPD:3.1,RUNNER_SPD:2.9,BASE_D:118,BASES:[home,{x:678,y:494}],
  game:{over:false},pitch:null,swing:null,play:null,impactPause:0,introT:150,INTRO_LEN:150,msg:null,popups:[],bursts:[],fan:{t:0},frame:0,trail:[],caught:null,holdPlate:0,view:1,state:'batting',runnersAnim:[],
  batting:()=>true,RED:'',INK:'',GRAPHITE:'',popup(){},startRunners(){},SFX:{crack(){},whiff(){},pop(){},pencil(){}},
  resolvePitch(){context.pitch=null;context.state='between';},cpuSwing(){},resolvePlay(){context.play=null;context.pitch=null;context.state='between';}
};
function reset(){Object.assign(context,{fielders:Object.fromEntries(['1B','2B','SS','3B','P','CF'].map(k=>[k,{x:560,y:400,tx:560,ty:400}])),swing:null,play:null,impactPause:0,pitch:null,state:'batting',holdPlate:0});}
vm.createContext(context);vm.runInContext(pitchesSource+battingSource+launchSource+stepSource,context);
let strikes=0;for(let i=0;i<10000;i++){context.throwPitch(['fast','curve','change'][i%3],0);const p=context.pitch;strikes+=p.strike;assert.equal(p.strike,Math.abs(p.fy)<=50);assert(p.T>=100);const endpoint=context.platePitchPos(p,p.T);assert.equal(endpoint.x,400);assert(Math.abs(endpoint.y-(460+p.fy))<1e-8);}
assert(Math.abs(strikes/10000-.8)<.015);console.log(`PASS: ${(strikes/100).toFixed(1)}% actual strikes across 10,000 seeded pitches; visible trajectory matches zone`);
const center=context.timingContact(0,true);assert(center.q===1);assert(center.v>context.timingContact(15,true).v);assert(context.timingContact(10,true).dir<-90);assert(context.timingContact(-10,true).dir>-90);
assert(context.timingContact(20,true));assert(context.timingContact(-20,true));assert.equal(context.timingContact(21,true),null);assert.equal(context.timingContact(-21,true),null);assert.equal(context.timingContact(0,false),null);
// Every valid timing and pitch height connects; neither pointer location nor animation delay affects it.
for(const dt of [-20,-12,0,12,20])for(const fy of [-24,0,24]){
  reset();context.pitch={T:100,t:100-dt,wind:0,plate:true,strike:true,fy,type:'fast'};context.swingAtPlate();const clickTime=context.pitch.t;
  for(let f=0;f<5;f++)context.step();assert.equal(context.play,null);assert.equal(context.pitch.t,clickTime);
  context.step();assert(context.play,'valid timing launches on contact frame');const pose=context.batPose(6,context.swing.aim);assert.equal(pose.dy,0);assert.equal(pose.hy,460+fy);assert(context.swing.aim.x>pose.hx+pose.dx*.53&&context.swing.aim.x<pose.hx+pose.dx);assert(context.swing.aim.x<=context.swing.from.x,'contact never pulls a passed ball backwards');
  assert.equal(context.swing.contact.q,context.timingContact(dt,true).q,'judge input, not animation delay');
  const x=context.play.x;for(let i=0;i<3;i++)context.step();assert.equal(context.play.x,x,'contact freeze keeps bat and ball together');
  for(let i=0;i<600&&context.play;i++)context.step();assert.equal(context.play,null,'contact resolves through fielding');
}
for(const [dt,strike] of [[60,true],[-22,true],[0,false]]){reset();context.pitch={T:100,t:100-dt,wind:0,plate:true,strike,fy:strike?0:80,type:'fast'};context.swingAtPlate();for(let i=0;i<180&&context.pitch;i++)context.step();assert.equal(context.play,null);assert.equal(context.pitch,null);}
for(const strike of [true,false]){reset();context.pitch={T:100,t:0,wind:0,plate:true,strike,fy:0,type:'fast'};for(let i=0;i<150&&context.pitch;i++)context.step();assert.equal(context.pitch,null,'taking a pitch resolves');}
for(const ang of [-15,0,14,35,68]){reset();context.launch({dir:-90,ang,v:14});const p=context.play;assert(p.T>0);assert(Math.abs(p.z0+p.vz*p.T-.16*p.T*p.T)<1e-8);}
console.log('PASS: generous timing boundaries, no cursor requirement, level contact, input-time scoring, misses, taken pitches, fielding completion and ball flight');
