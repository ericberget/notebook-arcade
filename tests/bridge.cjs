const assert=require('node:assert/strict'),P=require('../games/bridge/physics.js');
const stroke=(type,points)=>({type,points:points.map(([x,y])=>({x,y}))});
const road=stroke('road',[[350,422],[740,422]]);
const braces=stroke('brace',[[330,545],[545,422],[760,545]]);
function run(strokes){const w=P.create(strokes);while(w.status==='running'){P.step(w);assert(w.nodes.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert(w.wheels.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}return w;}
const empty=run([]);assert.equal(empty.status,'lost');
const weak=run([road]);assert.equal(weak.status,'lost');assert(weak.breaks.length>0,'unsupported deck visibly fractures');
const strong=run([road,braces]);assert.equal(strong.status,'won');assert.equal(strong.breaks.length,0);assert(strong.maxSag<weak.maxSag/2,'braces reduce deformation');
assert(P.length([road,braces])<1500,'basic solution fits the pencil budget');
for(const n of strong.nodes.filter(n=>n.pin)){assert.equal(n.x,n.ox);assert.equal(n.y,n.oy);}
const partial=run([road,stroke('brace',[[330,545],[545,422]])]);assert(partial.maxSag>strong.maxSag,'asymmetric support deforms more than a balanced brace');
assert.equal(run([stroke('road',[[350,422],[470,422]]),stroke('road',[[600,422],[740,422]]),braces]).status,'lost','truck cannot drive across disconnected roads');
const crossing=P.create([road,stroke('brace',[[545,545],[545,350]])]);const joint=crossing.nodes.findIndex(n=>Math.hypot(n.ox-545,n.oy-422)<1);assert(joint>=0);assert(crossing.links.filter(l=>l.a===joint||l.b===joint).length>=4,'crossed strokes create a shared structural joint');
const rough=stroke('road',[[350,422],[411,419],[470,425],[545,422],[600,424],[680,420],[740,422]]);assert.equal(run([rough,braces]).status,'won','slightly messy freehand road remains playable');
const original=JSON.stringify([road,braces]);run([road,braces]);assert.equal(JSON.stringify([road,braces]),original,'simulation never mutates the editable drawing');
const curve=P.create([stroke('road',[[350,422],[460,365],[640,370],[740,422]])]);assert(curve.nodes.some(n=>n.oy<380),'curves are preserved, not replaced by a canned bridge');
console.log('PASS: unsupported failure, braced success, partial support, road gaps, shared intersections, anchors, curved strokes, ink budget, editable reset, and finite simulation');

const levels=require('../games/bridge/levels.js');
for(const level of levels){
  const [left,right,lowerLeft,lowerRight]=level.anchors,mid={x:(left.x+right.x)/2,y:left.y};
  const solution=[{type:'road',points:[left,right]},{type:'brace',points:[lowerLeft,mid,lowerRight]}];
  assert(P.length(solution)<=level.budget,`${level.name} can be solved within its pencil allowance`);
  const world=P.create(solution,level);while(world.status==='running')P.step(world);
  assert.equal(world.status,'won',`${level.name} has a working freehand solution`);
  assert(world.wheels.every(w=>w.x>right.x+45),'finish line follows the level geometry');
  for(const n of world.nodes.filter(n=>n.pin)){assert.equal(n.x,n.ox);assert.equal(n.y,n.oy);}
  const gap=P.create([],level);while(gap.status==='running')P.step(gap);assert.equal(gap.status,'lost','level gap has no invisible road');
}
console.log('PASS: all four levels are solvable within budget, with matching anchors and finish lines');
