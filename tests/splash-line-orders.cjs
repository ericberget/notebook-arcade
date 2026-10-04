const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const P = require('../games/splash-line/park-progress.js');
const html = fs.readFileSync(path.join(__dirname, '../games/splash-line/index.html'), 'utf8');
const section = (a,b) => html.slice(html.indexOf(a),html.indexOf(b));
vm.runInNewContext(section('const GY =','// ---------- stage & canvas') + section('function crPts(','function propsFor(') + section('const NAME_A', 'function randomName') + `
  const fixtures=[];
  for(const order of EXTRA_ORDERS){
    const kit=KITS.find(k=>k.id===order.id);
    assert(NAME_B[kit.id] || NAME_B[kit.base], 'new rides have a name vocabulary');
    const points=crPts([[START_X,towerTop(kit)],...EXAMPLES[kit.id]]);
    const track=buildTrack([points],kit), sim=simulate(track,kit);
    assert.equal(inspect(sim,kit,track).stars,3,kit.name+' has an achievable three-star route');
    if(kit.gates){
      const missed={...kit,gates:kit.gates.map(g=>({...g,y:-1000}))};
      assert.equal(kit.goal.test(simulate(track,missed).stats),false,'missing hoops fails the goal');
    }
    if(kit.obstacles){
      const blocked={...kit,obstacles:[{x:200,y:0,w:800,h:700}]};
      assert.equal(kit.goal.test(simulate(track,blocked).stats),false,'crossing an obstacle fails the goal');
    }
    if(order.goalType==='landing'){
      const missed={...kit,pool:[1100,1130]};
      assert.equal(kit.goal.test(simulate(track,missed).stats),false,'missing a narrow pool fails');
    }
    fixtures.push({id:fixtures.length+1,lot:fixtures.length,kit:kit.id,name:kit.name,stars:3,
      strokes:[points.map(p=>[p.x,p.y])],traj:sim.frames.map(f=>[f.x,f.y,f.r,f.a]),
      stats:{topMph:sim.stats.topMph,maxG:sim.stats.maxG,air:sim.stats.longestAir,time:sim.stats.rideTime,drop:sim.stats.dropFt}});
  }
  const park=P.normalize(JSON.parse(JSON.stringify({rides:fixtures,drafts:Object.fromEntries(fixtures.map(r=>[r.lot+':'+r.kit,{lot:r.lot,kit:r.kit,strokes:r.strokes}]))})));
  assert.equal(park.rides.length,16);assert.equal(Object.keys(park.mastered).length,16);assert.equal(Object.keys(park.drafts).length,16);
  assert.throws(()=>P.normalize({rides:[{...fixtures[0],kit:'unknown'}]}),/incomplete/);
`,{assert,P,matchMedia:()=>({matches:false})});
console.log('PASS: 16 new three-star routes, missed hoops, obstacle collisions, narrow pool misses, and save migration.');
