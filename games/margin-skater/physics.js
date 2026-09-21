/* Margin Skater: deterministic 120 Hz skating, swept contacts, slope momentum.
   Coordinates use board contact point; +y points down. No render-frame physics. */
(function(root){
'use strict';
const DT=1/120, G=1350, TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function surface(x,segments){
  for(const s of segments) if(x>=s.x1&&x<=s.x2) return {y:s.y1+(x-s.x1)*(s.y2-s.y1)/(s.x2-s.x1),angle:Math.atan2(s.y2-s.y1,s.x2-s.x1),segment:s};
  return null;
}
function makeLevel(index=0){
  const ground=[],rails=[],obstacles=[],stars=[],notes=[],checkpoints=[120];
  const line=(x1,y1,x2,y2)=>ground.push({x1,y1,x2,y2});
  const rail=(x1,y1,x2,y2,type='staple')=>rails.push({x1,y1,x2,y2,type});
  const star=(x,y)=>stars.push({x,y,id:stars.length});
  const note=(x,y,text)=>notes.push({x,y,text});
  const block=(x,y,w=62,h=34)=>obstacles.push({x,y,w,h});
  // Every page starts with room to learn, then adds a distinct line through the park.
  line(-1000,430,900,430);block(790,430,60,30);star(800,315);
  note(220,295,'hold jump… release to ollie!');note(695,485,'tiny eraser. big ambitions.');
  let end;
  if(index===0){
    line(900,430,1130,350);line(1130,350,1250,350);line(1460,420,1950,420);
    rail(1630,342,1910,342);star(1330,275);star(1740,307);note(1030,485,'pop off the paper ramp ↗');note(1610,245,'hold ↓ to grind');
    line(1950,420,2250,500);line(2250,500,2450,500);line(2450,500,2750,380);line(2750,380,2860,380);line(3070,440,3700,440);checkpoints.push(2150,3300);
    star(2390,420);star(2940,295);block(3590,440,65,38);note(2240,565,'downhill = free speed');
    line(3700,440,3950,400);line(3950,400,4290,400);rail(3870,325,4270,305,'pencil');star(4020,280);
    line(4290,400,4560,470);line(4560,470,4820,470);line(4820,470,5100,365);line(5100,365,5220,365);line(5430,440,6500,440);checkpoints.push(4640,5580);
    star(5310,275);rail(5720,365,6100,365);star(5930,325);note(4920,515,'your notebook. your airspace.');end=6300;
  }else if(index===1){
    line(900,430,1150,360);line(1150,360,1450,360);line(1450,360,1730,440);line(1730,440,2100,440);
    rail(1020,305,1450,285,'pencil');rail(1590,330,2050,350);star(1250,255);star(1790,290);note(1040,225,'link the rails. keep the speed.');checkpoints.push(1830);
    line(2100,440,2370,360);line(2370,360,2500,360);line(2770,440,3200,440);rail(2420,330,2840,355,'ruler');star(2610,275);
    line(3200,440,3470,500);line(3470,500,3620,500);line(3620,500,3880,385);line(3880,385,4050,385);line(4270,435,4680,435);checkpoints.push(3060,4450);star(4160,275);
    rail(3360,385,3650,385);star(3500,345);block(4590,435,80,35);
    line(4680,435,4970,370);line(4970,370,5330,370);line(5330,370,5600,445);line(5600,445,6900,445);
    rail(4840,300,5290,300,'pencil');rail(5420,340,5770,340);rail(5930,360,6420,360,'ruler');star(5100,255);star(5620,295);star(6170,315);end=6710;note(5890,245,'the stationery department');
  }else{
    line(900,430,1240,520);line(1240,520,1420,520);line(1420,520,1730,355);line(1730,355,1850,355);line(2170,440,2670,440);star(2010,220);note(1530,560,'big gap. hold for a BIG ollie.');checkpoints.push(2300);
    line(2670,440,2920,365);line(2920,365,3070,365);line(3310,430,3710,430);rail(2860,310,3290,330,'pencil');star(3060,260);block(3610,430,75,40);
    line(3710,430,4020,510);line(4020,510,4190,510);line(4190,510,4500,350);line(4500,350,4620,350);line(4920,430,5520,430);checkpoints.push(4020,5070);star(4770,200);note(4250,580,'lean in the air. land wheels down.');
    line(5520,430,5800,370);line(5800,370,5980,370);line(6240,440,7480,440);rail(5690,310,6140,315,'ruler');star(5940,255);
    rail(6440,350,6870,350,'pencil');star(6640,305);block(7140,440,85,38);star(7180,295);end=7320;note(6750,245,'one last line before the bell.');
  }
  return {index,name:['Loose Leaf','Staple City','Final Period'][index],subtitle:['Find your feet. Lose the homework.','Every staple is a skate spot.','Big air. Questionable attendance.'][index],ground,rails,obstacles,stars,notes,checkpoints,end};
}
// The cruise grows ahead of the rider and discards distant scenery behind them.
// The entire lower route is connected: jumping and grinding are optional.
function cruiseHeight(x,index){return 438+Math.sin(x/680+index)*32+Math.sin(x/1370)*24;}
function extendCruise(level){
  const start=level.end, end=start+2400;
  for(let x=start;x<end;x+=120)level.ground.push({x1:x,y1:cruiseHeight(x,level.index),x2:x+120,y2:cruiseHeight(x+120,level.index)});
  const railX=start+1250, y=cruiseHeight(railX,level.index)-62;
  level.rails.push({x1:railX,y1:y,x2:railX+420,y2:y-12,type:['staple','pencil','ruler'][level.chunk%3]});
  for(let i=0;i<9;i++){
    const x=start+380+i*130, airborne=i>=5;
    level.stars.push({x,y:cruiseHeight(x,level.index)-(airborne?100+Math.sin((i-5)/3*Math.PI)*45:30),id:level.nextStar++});
  }
  const words=['nothing to rush toward.','a little air. a little daydream.','take the long way home.','the best line is your own.','stay awhile.','no bell to beat.'];
  level.notes.push({x:start+600,y:560,text:words[level.chunk%words.length]});
  level.chunk++;level.end=end;
}
function makeCruise(index=0){
  const level={index,zen:true,name:['Garden Loop','Harbor Drift','Golden Coast'][index],subtitle:'An endless afternoon. Tricks optional.',ground:[],rails:[],obstacles:[],stars:[],notes:[],checkpoints:[120],end:-2400,chunk:0,nextStar:0};
  while(level.end<7200)extendCruise(level);
  return level;
}
function create(level=makeCruise(0)){
  return {level,starsTotal:0,x:120,y:level.zen?surface(120,level.ground).y:430,vx:level.zen?235:300,vy:0,angle:0,omega:0,grounded:true,rail:null,speed:level.zen?235:300,charge:0,held:false,coyote:.1,buffer:0,bufferPower:0,airTime:0,rotation:0,airPoints:0,airLabel:'',chain:0,combo:0,comboTime:0,score:0,bails:0,time:0,checkpoint:120,checkpointIndex:0,status:'ready',bailTimer:0,compression:0,events:[],collected:new Set(),grindDistance:0,grindScored:0,lastGrind:null,checkpointScore:0};
}
function emit(s,type,extra={}){s.events.push({type,...extra});}
function bank(s){if(!s.combo)return;const points=Math.round(s.combo*(1+Math.min(4,s.chain-1)*.5));s.score+=points;emit(s,'bank',{points,chain:s.chain});s.combo=0;s.chain=0;s.comboTime=0;}
function bail(s,why){if(s.status!=='playing')return;if(s.level.zen){const ground=surface(s.x,s.level.ground);if(ground){Object.assign(s,{y:ground.y,angle:ground.angle,grounded:true,rail:null,vy:0,omega:0,speed:235,airTime:0});bank(s);emit(s,'recover');return;}}s.status='bail';s.bailTimer=.85;s.bails++;s.combo=0;s.chain=0;s.airPoints=0;s.held=false;s.charge=0;s.buffer=0;emit(s,'bail',{why});}
function respawn(s){const p=surface(s.checkpoint,s.level.ground);Object.assign(s,{x:s.checkpoint,y:p.y,angle:p.angle,vx:300,vy:0,speed:300,omega:0,grounded:true,rail:null,status:'playing',charge:0,held:false,airTime:0,rotation:0,buffer:0,coyote:.1,grindDistance:0,lastGrind:null});emit(s,'respawn');}
function ollie(s,power){const a=s.rail?Math.atan2(s.rail.y2-s.rail.y1,s.rail.x2-s.rail.x1):s.angle;const impulse=400+power*250;s.vx=Math.max(s.level.zen?235:330,s.speed*Math.cos(a)+Math.sin(a)*impulse*.15);s.vy=s.speed*Math.sin(a)-Math.cos(a)*impulse;s.y-=2;s.grounded=false;s.rail=null;s.coyote=0;s.buffer=0;s.airTime=0;s.rotation=0;s.airPoints=40;s.airLabel=power>.65?'POWER OLLIE':'OLLIE';s.omega=-.35;s.compression=-.18;emit(s,'ollie',{power});}
function sweep(s,x0,y0,segments,rail=false){
  let hit=null;
  for(const seg of segments){
    const m=(seg.y2-seg.y1)/(seg.x2-seg.x1),d0=y0-(seg.y1+(x0-seg.x1)*m),d1=s.y-(seg.y1+(s.x-seg.x1)*m);
    if(d0>3||d1<0||d1<=d0)continue;
    const t=clamp(-d0/(d1-d0),0,1),x=x0+(s.x-x0)*t;
    if(x<seg.x1||x>seg.x2)continue;
    if(!hit||t<hit.t)hit={t,x,y:seg.y1+(x-seg.x1)*m,angle:Math.atan(m),segment:seg,rail};
  }return hit;
}
function step(s,input={},dt=DT){
  s.events=[];
  if(s.status==='bail'){s.bailTimer-=dt;if(s.bailTimer<=0)respawn(s);return;}
  if(s.status!=='playing')return;
  if(s.level.zen){
    while(s.level.end-s.x<3600)extendCruise(s.level);
    s.level.ground=s.level.ground.filter(g=>g.x2>s.x-2400);
    s.level.rails=s.level.rails.filter(g=>g.x2>s.x-2400);
    s.level.notes=s.level.notes.filter(n=>n.x>s.x-2400);
    s.level.stars=s.level.stars.filter(t=>{if(t.x<s.x-2400){s.collected.delete(t.id);return false;}return true;});
    s.checkpoint=s.x;
  }
  s.time+=dt;s.compression*=Math.exp(-10*dt);
  const jump=!!input.jump,lean=clamp(input.lean||0,-1,1);
  if(jump)s.charge=clamp(s.charge+dt/0.55,0,1);
  if(!jump&&s.held){s.buffer=s.level.zen?.22:.13;s.bufferPower=s.charge;s.charge=0;}
  s.held=jump;s.buffer=Math.max(0,s.buffer-dt);s.coyote=Math.max(0,s.coyote-dt);
  if(s.grounded)s.coyote=.1;
  if(s.buffer>0&&(s.grounded||s.coyote>0))ollie(s,s.bufferPower);
  const x0=s.x,y0=s.y;
  if(s.grounded){
    const segments=s.rail?[s.rail]:s.level.ground,at=surface(s.x,segments);
    if(!at){s.grounded=false;s.rail=null;s.airTime=0;s.rotation=0;}
    else{
      const a=at.angle,rolling=s.rail?26:38,push=s.rail?0:Math.max(0,345-s.speed)*1.25;
      s.speed=s.level.zen?clamp(s.speed+((235-s.speed)*.9+G*Math.sin(a)*.25)*dt,195,320):clamp(s.speed+(G*Math.sin(a)*.68+push-rolling)*dt,180,690);
      s.vx=s.speed*Math.cos(a);s.vy=s.speed*Math.sin(a);s.x+=s.vx*dt;
      const next=surface(s.x,segments);
      if(next){s.y=next.y;s.angle+=wrap(next.angle-s.angle)*Math.min(1,dt*25);s.omega=0;}
      else {s.y+=s.vy*dt;s.grounded=false;s.rail=null;s.airTime=0;s.rotation=0;}
      if(s.rail){s.grindDistance+=s.vx*dt;s.combo+=s.vx*dt*.28;s.comboTime=1.7;if(s.grindDistance-s.grindScored>55){s.grindScored=s.grindDistance;emit(s,'grind');}}
    }
  }else{
    s.airTime+=dt;s.vy+=G*dt;s.vx*=Math.exp(-.035*dt);s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(lean){s.omega=clamp(s.omega+lean*21*dt,-8,8);}
    else {const target=surface(s.x+s.vx*.12,s.level.ground)?.angle||0;s.omega+=(-wrap(s.angle-target)*30-s.omega*9)*dt;}
    const turn=s.omega*dt;s.angle+=turn;if(lean)s.rotation+=turn;
    const groundHit=sweep(s,x0,y0,s.level.ground),railHit=(input.grind||s.level.zen)?sweep(s,x0,y0,s.level.rails,true):null;
    let hit=railHit&&(!groundHit||railHit.t<groundHit.t)?railHit:groundHit;
    // Rails require a reasonably aligned board; missing one still permits a floor landing.
    if(!s.level.zen&&hit?.rail&&Math.abs(wrap(s.angle-hit.angle))>.65)hit=groundHit;
    if(hit){
      const error=Math.abs(wrap(s.angle-hit.angle)),impact=s.vy*Math.cos(hit.angle)-s.vx*Math.sin(hit.angle);
      if(!s.level.zen&&error>1.05){bail(s,'land wheels down');return;}
      s.x=hit.x;s.y=hit.y;s.speed=clamp(s.vx*Math.cos(hit.angle)+s.vy*Math.sin(hit.angle),205,690);
      const clean=error<.23&&impact<900;s.speed*=clean||s.level.zen?1:0.88;if(s.level.zen)s.speed=clamp(s.speed,210,320);
      s.grounded=true;s.rail=hit.rail?hit.segment:null;s.angle=hit.angle;s.omega=0;s.compression=clamp(impact/1100,.15,.75);
      const flips=Math.floor((Math.abs(s.rotation)+.35)/TAU);const points=s.airPoints+flips*400+(clean?60:10);
      if(s.airTime>.12){s.combo+=points;s.chain++;s.comboTime=1.7;emit(s,'land',{clean,impact,points,label:flips?`${flips>1?flips+'× ':''}${s.rotation<0?'BACKFLIP':'FRONTFLIP'}`:s.airLabel||'AIR'});}
      if(s.rail){if(s.lastGrind!==s.rail){s.chain++;s.combo+=100;}s.lastGrind=s.rail;s.grindDistance=0;s.grindScored=0;s.comboTime=1.7;emit(s,'rail');}
      s.airTime=0;s.airPoints=0;s.rotation=0;
      if(s.buffer>0)ollie(s,s.bufferPower);
    }
  }
  for(const o of s.level.obstacles){if(s.x+19>o.x&&s.x-19<o.x+o.w&&s.y>o.y-o.h+6&&s.y<o.y+45){bail(s,'eraser wins this round');return;}}
  for(const star of s.level.stars)if(!s.collected.has(star.id)&&Math.hypot(s.x-star.x,s.y-30-star.y)<43){s.collected.add(star.id);s.starsTotal++;s.score+=100;emit(s,'star');}
  if(s.y>820){bail(s,'mind the paper gap');return;}
  for(let i=s.checkpointIndex+1;i<s.level.checkpoints.length;i++)if(s.x>=s.level.checkpoints[i]&&s.grounded&&!s.rail){s.checkpointIndex=i;s.checkpoint=s.level.checkpoints[i];bank(s);emit(s,'checkpoint');}
  if(s.grounded&&!s.rail){s.comboTime-=dt;if(s.comboTime<=0)bank(s);}
  if(!s.level.zen&&s.x>=s.level.end){bank(s);s.status='finished';emit(s,'finish');}
}
const api={DT,G,clamp,wrap,surface,makeLevel,makeCruise,create,step,bank};if(typeof module!=='undefined')module.exports=api;else root.SkatePhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
