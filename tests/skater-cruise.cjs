const assert=require('node:assert/strict'),P=require('../games/margin-skater/physics.js');
for(let index=0;index<3;index++){
  const s=P.create(P.makeCruise(index));s.status='playing';let rails=0,lands=0;
  // Ten minutes each: idle cruising, frequent casual jumps, and held spins.
  for(let tick=0;tick<120*600;tick++){
    const phase=tick%240;
    P.step(s,index===0?{}:{jump:phase<65,lean:index===2?1:0});
    rails+=s.events.filter(e=>e.type==='rail').length;lands+=s.events.filter(e=>e.type==='land').length;
    assert.equal(s.status,'playing','cruise never ends or bails');
    assert([s.x,s.y,s.angle,s.vx,s.vy].every(Number.isFinite));
    assert(s.level.end>s.x+3000,'terrain stays ahead of rider');
  }
  assert(s.x>100000,'a long continuous ride');assert.equal(s.bails,0);
  assert(s.level.ground.length<90&&s.level.stars.length<45&&s.collected.size<45,'old scenery and collections are bounded');
  if(index===0)assert(s.starsTotal>50,'coasting collects low stars');
  if(index===1)assert(rails>0&&lands>0,'optional hops automatically catch rails and land');
  console.log(`Cruise ${index+1}: ten minutes, ${Math.floor(s.x/10)} m, ${s.starsTotal} stars, ${lands} landings, ${rails} grinds, no bails.`);
}
const s=P.create();s.status='playing';Object.assign(s,{grounded:false,y:900,angle:Math.PI});P.step(s);assert(s.grounded&&s.status==='playing','recovery keeps you moving at current position');
console.log('PASS: endless generation, relaxed idle play, spin forgiveness, auto rails, recovery, bounded memory');
const ride=(jumping)=>{
 const s=P.create();s.status='playing';let pressed=false;
 for(let i=0;i<120*60;i++){
  const obstacle=s.level.obstacles.find(o=>!o.hit&&!o.cleared&&o.x>s.x-20);
  const jump=jumping&&!pressed&&s.grounded&&obstacle&&obstacle.x-s.x<95&&obstacle.x-s.x>60;
  P.step(s,{jump});pressed=jump;
 }
 return s;
};
const idle=ride(false),hops=ride(true);
assert(idle.bumps>=8,'not jumping hits real obstacles');
assert.equal(idle.status,'playing','bumps preserve the ride');
assert(hops.cleared>=8&&hops.bumps===0,'simple taps clear a minute of obstacles');
assert(hops.x>idle.x,'clean hops preserve momentum');
assert(idle.level.obstacles.length<10,'old obstacles are discarded');
console.log(`PASS: ${idle.bumps} forgiving bumps without jumping; ${hops.cleared} obstacles cleared with simple taps and zero bumps`);
