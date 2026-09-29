const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../games/eraser-war/index.html'),'utf8');
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
const part=(a,b)=>html.slice(html.indexOf('function '+a+'('),html.indexOf('function '+b+'('));
const c=vm.createContext({Math});
vm.runInContext(`const W=1200,GRAV=.26,WINDK=.028; let wind=0; let you={x:175,y:520,hp:100,dir:1},pen={x:1025,y:520,hp:100,dir:-1}; const groundAt=x=>520; let proj,shake,state,waitT,lastShot=null; const PINK='',PINK_DK='',PEN_LT='',RED='',GRAPHITE='',INK='',PEN_DK=''; const SFX={thud(){},rub(){},ow(){}}; function carve(){} function burst(){} function popup(){} function say(){} function scrawl(){};`,c);
vm.runInContext(part('handOf','launch')+part('simulate','planAI')+part('impact','endMatch'),c);
let checked=0;
for(const w of [-.4,0,.4]) for(const degrees of [-80,-60,-45,-30,-10]) for(const power of [7,12,17]) {
 const result=vm.runInContext(`wind=${w};simulate(you,${degrees}*Math.PI/180,${power},900)`,c);
 let x=189,y=486,vx=Math.cos(degrees*Math.PI/180)*power,vy=Math.sin(degrees*Math.PI/180)*power;
 let ended=false,out=false;
 for(let t=0;t<900;t++){vy+=.26;vx+=w*.028;x+=vx;y+=vy;if(Math.hypot(1025-x,496-y)<24||y>=520){ended=true;break;}if(x< -60||x>1260){out=true;ended=true;break;}}
 if(!ended)out=true;
 assert(Math.abs(result.x-x)<1e-8&&Math.abs(result.y-y)<1e-8);assert.equal(result.out,out);checked++;
}
const hit=(attacker,direct,offset)=>vm.runInContext(`you.hp=100;pen.hp=100;proj={who:${attacker},pow:17};impact(${attacker==='you'?1025:175}+${offset},498,${direct});${attacker==='you'?'pen':'you'}.hp`,c);
assert.equal(hit('you',true,0),49);
assert.equal(hit('pen',true,0),69);
assert(hit('you',false,95)<100,'player near miss should damage opponent');
assert.equal(hit('pen',false,95),100,'enemy keeps smaller splash radius');
console.log(`Passed: syntax, ${checked} trajectory comparisons, and direct/splash damage.`);
const controls = vm.createContext({Math, document:{getElementById(){return {textContent:''};}}});
vm.runInContext(`let state='aim',winner=null,aimAngle=40,aimPower=14.6,shotNumber=2,throwAnim=null,pen={}; const angleControl={},powerControl={},fireButton={},shotStatus={};`,controls);
vm.runInContext(part('syncControls','fireShot'),controls);
for (const state of ['intro','aim','throwing','aiturn','settle','over']) {
 const result=vm.runInContext(`state='${state}';syncControls();({fire:fireButton.disabled,slider:angleControl.disabled,label:fireButton.textContent})`,controls);
 assert.equal(result.fire,!['aim','over'].includes(state));
 assert.equal(result.slider,state!=='aim');
 if(state==='over')assert.equal(result.label,'Play again ↻');
}
console.log('Passed: control locking across all turn states and replay action.');
