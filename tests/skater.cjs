const assert=require('node:assert/strict'),P=require('../games/margin-skater/physics.js');
const flat={index:0,ground:[{x1:-1000,y1:430,x2:20000,y2:430}],rails:[],obstacles:[],stars:[],notes:[],checkpoints:[120],end:19000};
function game(level=flat){const s=P.create(level);s.status='playing';return s;}
function advance(s,n,input={}){for(let i=0;i<n;i++)P.step(s,input);}
function jump(hold){const s=game();advance(s,hold,{jump:true});P.step(s,{});assert(!s.grounded);let apex=s.y;while(!s.grounded&&s.status==='playing'){P.step(s,{});apex=Math.min(apex,s.y);}assert.equal(s.status,'playing');assert(s.grounded);return {s,apex};}
const low=jump(1),high=jump(70);assert(high.apex<low.apex-65,'charged ollie has substantially more lift');assert(high.s.x>low.s.x+180,'charged jump carries farther');assert(high.s.combo>0,'landing awards pending trick score');advance(high.s,230);assert(high.s.score>0&&high.s.combo===0,'safe landing banks combo');
const flip=game();advance(flip,70,{jump:true});P.step(flip,{});let flipEvent;for(let i=0;i<140;i++){P.step(flip,{lean:1});flipEvent=flip.events.find(e=>e.type==='land');if(flipEvent||flip.status==='bail')break;}assert.equal(flipEvent?.label,'FRONTFLIP','charged jump gives enough airtime for a deliberate full flip');
const down=game({...flat,ground:[{x1:-1000,y1:100,x2:20000,y2:6400}]});down.y=P.surface(down.x,down.level.ground).y;advance(down,120);assert(down.speed>450,'downhill builds momentum');
const coyote=game({...flat,ground:[{x1:-1000,y1:430,x2:123,y2:430}]});P.step(coyote,{jump:true});P.step(coyote,{jump:true});assert(!coyote.grounded);P.step(coyote,{});assert(coyote.vy<-350,'late jump works within coyote time');
const buffer=game();Object.assign(buffer,{x:300,y:420,grounded:false,vy:450,held:true,charge:.7,coyote:0});P.step(buffer,{});for(let i=0;i<10;i++)P.step(buffer,{});assert(buffer.vy<0&&!buffer.grounded,'jump release just before contact buffers into an ollie');
const rail={x1:200,y1:340,x2:550,y2:340};const grind=game({...flat,rails:[rail]});Object.assign(grind,{x:300,y:335,grounded:false,vy:600,vx:400,coyote:0});P.step(grind,{grind:true});assert.equal(grind.rail,rail);assert(grind.grounded);const first=grind.combo;advance(grind,30,{grind:true});assert(grind.combo>first,'grind scores by distance');assert(grind.x>390,'rail conserves forward movement');
const miss=game({...flat,rails:[rail]});Object.assign(miss,{x:300,y:335,grounded:false,vy:600,coyote:0});P.step(miss,{});assert.equal(miss.rail,null,'rail requires intentional grind');
const inverted=game();Object.assign(inverted,{x:300,y:427,grounded:false,vy:500,angle:Math.PI,coyote:0});P.step(inverted,{lean:1});assert.equal(inverted.status,'bail','upside-down landing bails');advance(inverted,110);assert.equal(inverted.status,'playing');assert(inverted.x<250,'quick checkpoint recovery');
const fast=game();Object.assign(fast,{x:300,y:425,grounded:false,vy:4000,coyote:0});P.step(fast,{});assert(fast.grounded&&fast.y===430,'swept contact prevents fast fall tunneling');
const star={id:0,x:120,y:400},stars=game({...flat,stars:[star]});advance(stars,3);assert.equal(stars.score,100);stars.x=120;advance(stars,3);assert.equal(stars.score,100,'collectibles score once across retries');
for(let page=0;page<3;page++){
 const level=P.makeLevel(page);assert(level.checkpoints.every(x=>P.surface(x,level.ground)),'every checkpoint is on terrain');
 const s=game(level);let jumps=0;const releases=new Set();
 const triggers=[...level.obstacles.map(o=>({x:o.x-115,type:'block'})),...level.ground.filter(g=>!level.ground.some(n=>n!==g&&n.x1===g.x2)&&g.x2<level.end).map(g=>({x:g.x2-18,type:'gap'}))];
 for(let tick=0;tick<120*100&&s.status!=='finished';tick++){
   let jump=s.grounded||s.held;
   for(const [i,t] of triggers.entries())if(!releases.has(i)&&s.x>=t.x&&s.x<t.x+15&&s.grounded){jump=false;releases.add(i);jumps++;}
   P.step(s,{jump});
   assert([s.x,s.y,s.vx,s.vy,s.angle].every(Number.isFinite));
   if(s.status==='bail')break;
 }
 assert.equal(s.status,'finished',`page ${page+1} is finishable with charged jumps; stopped at ${s.x.toFixed(0)}, ${s.y.toFixed(0)}, bails=${s.bails}`);
 console.log(`Page ${page+1}: completed in ${s.time.toFixed(1)}s, ${jumps} jumps, no bails.`);
}
console.log('PASS: charged arcs, slope momentum, coyote jump, buffered landing, intentional grinds, clean score banking, bail/recovery, swept contacts, single-claim stars, all three courses');
