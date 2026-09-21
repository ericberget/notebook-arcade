const assert=require('node:assert/strict'),P=require('../games/margin-skater/physics.js');
function ride(slope=0,speed=450){const level={zen:true,index:0,ground:[{x1:-1000,y1:430-1000*slope,x2:100000,y2:430+100000*slope}],end:90000,rails:[],obstacles:[],stars:[],notes:[],checkpoints:[120]};const s=P.create(level);Object.assign(s,{status:'playing',speed,vx:speed,angle:Math.atan(slope)});return s;}
function advance(s,seconds){for(let i=0;i<seconds/P.DT;i++)P.step(s);return s;}
const flat=advance(ride(),2),down=advance(ride(.12),2),up=advance(ride(-.12),2);
assert(down.speed>flat.speed+150,'downhill acceleration is meaningful');
assert(up.speed<flat.speed-150,'uphill spends momentum');
assert(flat.speed>380,'fast rolling does not snap to a preset cruise speed');
const hop=ride(0,520);Object.assign(hop,{held:true,charge:.1});P.step(hop);assert(hop.vx>510,'takeoff carries entry speed');
const slow=ride(0,170);Object.assign(slow,{held:true,charge:.1});P.step(slow);assert(slow.vx<175,'jump does not inject a fixed forward boost');
const land=ride(0,500);Object.assign(land,{grounded:false,y:429,vy:300,vx:500,coyote:0});P.step(land);assert(land.grounded&&land.speed>480,'landing preserves speed above old cap');
const rail=ride(0,470);rail.level.rails.push({x1:-1000,y1:430,x2:5000,y2:430});rail.rail=rail.level.rails[0];advance(rail,1);assert(rail.speed>425&&rail.pushStroke===0,'rails retain momentum without pushing');
const hill=advance(ride(-.12,90),4);assert(hill.speed>130&&hill.x>600,'gentle assistance prevents uphill stalling');
const bump=ride(0,500);bump.level.obstacles.push({x:135,y:430,w:52,h:24});P.step(bump);assert(bump.speed>340&&bump.speed<370,'bump removes a fraction of momentum');
console.log(`PASS: after two seconds uphill ${up.speed.toFixed(0)}, flat ${flat.speed.toFixed(0)}, downhill ${down.speed.toFixed(0)}; takeoff, landing, rails, hill assistance, proportional bumps`);
