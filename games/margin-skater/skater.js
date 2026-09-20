(() => {
'use strict';
const P=SkatePhysics,$=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const INK='#243e86',RED='#b44749',PAPER='#f6f2e8',GRAY='#85827a',TAU=Math.PI*2;
let s=P.create(),cam=-100,W=1200,H=600,offsetY=0,acc=0,last=0,paused=false,particles=[],trails=[],toastLife=0,shake=0,visualTime=0,prev={x:s.x,y:s.y,angle:s.angle},best={};
const input={jump:false,left:false,right:false,grind:false};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{best=JSON.parse(localStorage.getItem('margin-skater-best'))||{};}catch(_){}
const paper=new Image();paper.src='assets/paper-v1.png';
const audio=(()=>{
  let ac,master,buffer,muted=false;try{muted=localStorage.getItem('margin-skater-muted')==='true';}catch(_){}
  function init(){if(ac)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;try{ac=new Audio();}catch(_){return;}master=ac.createGain();master.gain.value=muted?0:.45;master.connect(ac.destination);buffer=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  function play(kind){if(!ac||muted||document.hidden)return;const t=ac.currentTime;function tone(f,end,len,vol,type='sine',delay=0){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t+delay);o.frequency.exponentialRampToValueAtTime(end,t+delay+len);g.gain.setValueAtTime(.0001,t+delay);g.gain.linearRampToValueAtTime(vol,t+delay+.005);g.gain.exponentialRampToValueAtTime(.0001,t+delay+len);o.connect(g).connect(master);o.start(t+delay);o.stop(t+delay+len+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
    function noise(len,vol,f){const b=ac.createBufferSource(),g=ac.createGain(),filter=ac.createBiquadFilter();b.buffer=buffer;filter.type='bandpass';filter.frequency.value=f;filter.Q.value=.6;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+len);b.connect(filter).connect(g).connect(master);b.start(t);b.stop(t+len);b.onended=()=>{b.disconnect();filter.disconnect();g.disconnect();};}
    if(kind==='ollie'){tone(240,75,.075,.3);noise(.04,.1,2100);}
    if(kind==='land'){tone(135,45,.12,.38);noise(.06,.13,1300);}
    if(kind==='grind'){noise(.055,.028,2300);}
    if(kind==='rail'){tone(1200,600,.08,.09,'triangle');noise(.09,.045,2600);}
    if(kind==='star'){tone(1047,1047,.13,.09,'triangle');tone(1568,1568,.15,.08,'triangle',.08);}
    if(kind==='bank'||kind==='checkpoint'){tone(523,523,.14,.09,'triangle');tone(784,784,.2,.09,'triangle',.1);}
    if(kind==='bail'){noise(.13,.14,600);tone(120,40,.23,.22);}
    if(kind==='finish'){[523,659,784,1047].forEach((f,i)=>tone(f,f,.3,.1,'triangle',i*.12));}
  }
  return{get muted(){return muted;},unlock(){init();if(ac?.state==='suspended')ac.resume().catch(()=>{});},toggle(){muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:.45,ac.currentTime,.02);try{localStorage.setItem('margin-skater-muted',muted);}catch(_){}return muted;},play};
})();
function soundUI(){$('sound').textContent=audio.muted?'sound: off':'sound: on';$('sound').setAttribute('aria-pressed',String(audio.muted));}soundUI();
$('sound').onclick=()=>{audio.unlock();audio.toggle();soundUI();};
function resize(){const box=canvas.getBoundingClientRect(),ratio=box.width/box.height;W=Math.max(600,600*ratio);H=W/ratio;offsetY=(H-600)*.4;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);}
new ResizeObserver(resize).observe(canvas);
function clearInput(){Object.keys(input).forEach(k=>input[k]=false);s.held=false;s.charge=0;s.buffer=0;}
function toast(text,seconds=1.5){$('announcement').textContent=text;toastLife=seconds;$('announcement').classList.add('show');}
function select(index,play=false){s=P.create(P.makeLevel(index));prev={x:s.x,y:s.y,angle:s.angle};cam=s.x-W*.27;acc=0;particles=[];trails=[];paused=false;clearInput();$('finish').hidden=true;$('pause-panel').hidden=true;$('intro').hidden=play;s.status=play?'playing':'ready';$('pause').disabled=!play;$('pause').textContent='Ⅱ pause';$('pause').setAttribute('aria-label','Pause game');$('page-name').textContent=`PAGE 0${index+1} · ${s.level.name.toUpperCase()}`;$('course-note').textContent=s.level.subtitle;$('announcement').classList.remove('show');toastLife=0;document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.level===index)));updateHUD();if(play){audio.unlock();canvas.focus({preventScroll:true});}}
function start(){$('intro').hidden=true;s.status='playing';$('pause').disabled=false;audio.unlock();canvas.focus({preventScroll:true});toast('hold. pop. roll.',1.6);}
$('start').onclick=start;
function pause(value=!paused){if(s.status==='ready'||s.status==='finished')return;paused=value;clearInput();$('pause-panel').hidden=!paused;$('pause').textContent=paused?'▶ resume':'Ⅱ pause';$('pause').setAttribute('aria-label',paused?'Resume game':'Pause game');if(!paused){audio.unlock();canvas.focus({preventScroll:true});}acc=0;}
$('pause').onclick=()=>pause();$('resume').onclick=()=>pause(false);$('restart').onclick=()=>select(s.level.index,true);$('replay').onclick=()=>select(s.level.index,true);$('next').onclick=()=>select((s.level.index+1)%3,true);
function retry(){if(s.status==='ready')return;if(s.status==='finished'){select(s.level.index,true);return;}clearInput();paused=false;$('pause-panel').hidden=true;$('pause').textContent='Ⅱ pause';$('pause').setAttribute('aria-label','Pause game');s.status='bail';s.bailTimer=0;s.combo=0;s.chain=0;s.airPoints=0;s.bails++;}
$('retry').onclick=retry;
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>select(+b.dataset.level,true));
const keyMap={Space:'jump',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'grind',KeyS:'grind'};
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)pause();return;}if(e.code==='KeyR'){if(!e.repeat)retry();return;}const key=keyMap[e.code];if(!key)return;if(e.target.tagName==='BUTTON'&&s.status==='ready')return;e.preventDefault();if(s.status==='ready'){if(key==='jump')start();else return;}if(!paused&&s.status==='playing'){input[key]=true;if(key==='jump')s.held=true;audio.unlock();}});
window.addEventListener('keyup',e=>{const key=keyMap[e.code];if(key){input[key]=false;e.preventDefault();}});
window.addEventListener('blur',()=>{if(s.status==='playing'||s.status==='bail')pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(s.status==='playing'||s.status==='bail'))pause(true);});
document.querySelectorAll('[data-hold]').forEach(b=>{const k=b.dataset.hold;b.addEventListener('pointerdown',e=>{e.preventDefault();if(s.status==='ready')start();if(paused||s.status!=='playing')return;b.setPointerCapture(e.pointerId);input[k]=true;if(k==='jump')s.held=true;audio.unlock();});const up=()=>input[k]=false;b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);});
function burst(x,y,n,color=INK,power=1){if(reduced)n=Math.ceil(n/3);for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*220*power,vy:-Math.random()*150*power-20,life:.35+Math.random()*.35,max:.7,color,size:1+Math.random()*2});}
function finish(){const old=best[s.level.index]?.score||0;if(s.score>old){best[s.level.index]={score:s.score,stars:s.collected.size};try{localStorage.setItem('margin-skater-best',JSON.stringify(best));}catch(_){}}const grade=s.bails===0?'A+ · no erasers required.':s.bails<=3?'A · beautifully questionable.':'B · persistence counts.';$('grade').textContent=grade;$('finish-stats').textContent=`${s.score.toLocaleString()} points · ${s.collected.size}/${s.level.stars.length} stars · ${Math.round(s.time)}s · ${s.bails} ${s.bails===1?'bail':'bails'}`;$('finish-best').textContent=s.score>old?'A new personal best. Scribble that down.':'A cleaner line is always one more run away.';$('next').textContent=s.level.index===2?'back to page 01 ↗':'next page ↗';$('finish').hidden=false;$('pause').disabled=true;$('next').focus({preventScroll:true});}
function events(){for(const e of s.events){audio.play(e.type);if(e.type==='ollie'){burst(s.x,s.y,8,GRAY,.5);}if(e.type==='land'){burst(s.x,s.y,12,GRAY,.7);shake=reduced?0:Math.min(3,e.impact/260);toast(`${e.label}${e.clean?' · CLEAN!':''}`,1);}
  if(e.type==='rail'){toast('50–50 GRIND',1.1);burst(s.x,s.y,9,RED);}
  if(e.type==='grind')burst(s.x-12,s.y,3,RED,.5);
  if(e.type==='star')burst(s.x,s.y-30,12,RED);
  if(e.type==='bank'){toast(`+${e.points}  ${e.chain>1?'LINE LANDED':'NICE LANDING'}`,1.2);}
  if(e.type==='checkpoint'){toast('checkpoint. exhale.',1.4);burst(s.x,s.y-50,10,RED);}
  if(e.type==='bail'){shake=reduced?0:7;toast(e.why,1.3);burst(s.x,s.y-20,25,INK,1.3);}
  if(e.type==='respawn'){trails=[];cam=s.x-W*.27;prev={x:s.x,y:s.y,angle:s.angle};}
  if(e.type==='finish')finish();
}}
function updateHUD(){$('score').textContent=String(s.score).padStart(4,'0');$('best').textContent=best[s.level.index]?.score||'—';$('stars').textContent=`${s.collected.size} / ${s.level.stars.length}`;const progress=P.clamp((s.x-120)/(s.level.end-120)*100,0,100);$('progress').style.width=progress+'%';document.querySelector('.progress').setAttribute('aria-valuenow',Math.round(progress));$('charge').style.width=s.charge*100+'%';$('combo').replaceChildren();if(s.combo){const label=document.createTextNode(`${Math.round(s.combo)} ×${(1+Math.min(4,s.chain-1)*.5).toFixed(1)}`),hint=document.createElement('small');hint.textContent=s.rail?'keep it sliding':s.grounded?'jump again to link it':'bring it home';$('combo').append(label,hint);}}
// Stable, slightly imperfect strokes: no random jitter between frames.
function line(x1,y1,x2,y2,color=INK,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x1,y1);const wiggle=Math.sin(x1*.037+y1*.061+x2*.013)*1.1;ctx.quadraticCurveTo((x1+x2)/2+wiggle,(y1+y2)/2+wiggle,x2,y2);ctx.stroke();}
function path(points,color=INK,width=2,closed=false,fill=null){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(closed)ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
function circle(x,y,r,color=INK,width=2,fill=null){ctx.beginPath();ctx.ellipse(x,y,r,r*.96,0,0,TAU);ctx.strokeStyle=color;ctx.lineWidth=width;if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.stroke();}
function text(str,x,y,size=20,color=INK,angle=0,align='left'){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.font=`${size}px 'Patrick Hand', cursive`;ctx.textAlign=align;ctx.fillText(str,0,0);ctx.restore();}
function star(x,y,r=10,color=RED){const p=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.43:r;p.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}path(p,color,1.8,true,'#f6f2e8');}
function board(angle,spin=0){ctx.save();ctx.rotate(angle);path([[-28,-11],[-23,-6],[21,-6],[29,-12]],INK,3);line(-20,-4,20,-4,INK,1.1);for(const x of [-17,17]){circle(x,0,5,INK,1.8,PAPER);line(x-3*Math.cos(spin),-3*Math.sin(spin),x+3*Math.cos(spin),3*Math.sin(spin),INK,1);}line(-23,-8,22,-8,RED,1.3);ctx.restore();}
function skater(x,y,angle){
  ctx.save();ctx.translate(x,y-5);ctx.rotate(angle);
  const crouch=s.charge*.65+Math.max(0,s.compression)*.7,air=!s.grounded,bend=air?.13:crouch;
  const hip={x:-4+(input.right?3:0),y:-41+bend*21},neck={x:7+bend*9,y:hip.y-27+bend*7},head={x:neck.x+3,y:neck.y-12};
  const pushPhase=(s.time%1.5)/1.5, pushing=s.grounded&&!s.rail&&s.charge<.05&&s.compression<.08&&pushPhase<.32;
  const push=pushing?Math.sin(pushPhase/.32*Math.PI):0;
  const feet=[[-17-push*19,-11+push*10],[17,-11]],knees=[[-22-push*10,hip.y+18],[17+bend*9,hip.y+15]];
  // Two-segment legs compress with landing force and crouch charge.
  path([[hip.x,hip.y],knees[0],feet[0]],INK,3);path([[hip.x,hip.y],knees[1],feet[1]],INK,3);
  path([[hip.x-3,hip.y],[neck.x-4,neck.y],[neck.x+6,neck.y+1],[hip.x+7,hip.y+1]],INK,2,true,'#e5e9ee');
  line(neck.x,neck.y+4,air?-24:-18,air?-53:hip.y+4,INK,2.5);line(air?-24:-18,air?-53:hip.y+4,air?-39:-26,air?-62:hip.y-8,INK,2.3);
  line(neck.x+2,neck.y+5,air?27:25,air?-51:hip.y-8,INK,2.4);line(air?27:25,air?-51:hip.y-8,air?40:34,air?-46:hip.y-17,INK,2.3);
  circle(head.x,head.y,10,INK,1.8,PAPER);ctx.beginPath();ctx.arc(head.x,head.y-2,10,Math.PI,TAU);ctx.fillStyle='#243e8630';ctx.fill();ctx.strokeStyle=INK;ctx.stroke();line(head.x-10,head.y-2,head.x+10,head.y-2,INK,2);path([[head.x-8,head.y-3],[head.x-22,head.y-6],[head.x-11,head.y+1]],INK,1.8);circle(head.x+4,head.y,1,INK,1,INK);path([[head.x+3,head.y+5],[head.x+7,head.y+4]],INK,1);
  for(const f of feet){path([[f[0]-7,f[1]-2],[f[0]+4,f[1]-2],[f[0]+9,f[1]+3],[f[0]-7,f[1]+3]],INK,1.7,true,PAPER);line(f[0]-3,f[1]-1,f[0]+1,f[1]+2,GRAY,.8);}
  board(0,s.x*.2);ctx.restore();
}
function terrain(){
  for(const seg of s.level.ground){if(seg.x2<cam-40||seg.x1>cam+W+40)continue;const a=Math.max(seg.x1,cam-60),b=Math.min(seg.x2,cam+W+60),m=(seg.y2-seg.y1)/(seg.x2-seg.x1),ya=seg.y1+(a-seg.x1)*m,yb=seg.y1+(b-seg.x1)*m;
    path([[a,ya],[b,yb],[b,yb+22],[a,ya+22]],'#243e8625',1,true,'#e6e5df');line(a,ya,b,yb,INK,2.5);line(a,ya+4,b,yb+4,'#243e8650',.7);
    for(let x=Math.ceil(a/19)*19;x<b;x+=19){const y=seg.y1+(x-seg.x1)*m;line(x,y+8,x-7,y+18,'#243e8650',.8);}
    const atEnd=!s.level.ground.some(q=>q!==seg&&Math.abs(q.x1-seg.x2)<1);if(atEnd){path([[seg.x2,seg.y2],[seg.x2-4,seg.y2+15],[seg.x2+2,seg.y2+22]],INK,1.2);for(let i=0;i<3;i++)line(seg.x2+8+i*4,seg.y2+37+i*8,seg.x2+13+i*4,seg.y2+43+i*8,GRAY,.8);}
  }
  for(const rail of s.level.rails){if(rail.x2<cam-30||rail.x1>cam+W+30)continue;const yAt=x=>rail.y1+(x-rail.x1)*(rail.y2-rail.y1)/(rail.x2-rail.x1);for(const x of [rail.x1+14,rail.x2-14]){const g=P.surface(x,s.level.ground);if(g){line(x,yAt(x),x,g.y,GRAY,2);line(x-12,g.y,x+12,g.y,GRAY,2);}}
    if(rail.type==='pencil'){path([[rail.x1,rail.y1],[rail.x2-20,rail.y2-1],[rail.x2,rail.y2+4],[rail.x2-20,rail.y2+7],[rail.x1,rail.y1+8]],INK,1.5,true,'#dfc57f');line(rail.x1+7,rail.y1+4,rail.x2-20,rail.y2+3,INK,.8);}
    else if(rail.type==='ruler'){path([[rail.x1,rail.y1],[rail.x2,rail.y2],[rail.x2,rail.y2+13],[rail.x1,rail.y1+13]],INK,1.5,true,'#e3cfa350');for(let x=rail.x1+8;x<rail.x2;x+=14)line(x,yAt(x)+4,x,yAt(x)+(Math.round(x)%2?8:12),INK,.7);}
    else{line(rail.x1,rail.y1,rail.x2,rail.y2,INK,3);line(rail.x1+3,rail.y1+5,rail.x2-2,rail.y2+5,GRAY,1.3);}
  }
  for(const o of s.level.obstacles){if(o.x+o.w<cam-30||o.x>cam+W+30)continue;path([[o.x,o.y],[o.x-4,o.y-o.h+6],[o.x+5,o.y-o.h],[o.x+o.w-5,o.y-o.h],[o.x+o.w,o.y-6],[o.x+o.w-3,o.y]],INK,1.7,true,'#e9b2ad');line(o.x+2,o.y-o.h+8,o.x+o.w-7,o.y-o.h+8,RED,1);for(let i=0;i<4;i++)line(o.x+8+i*7,o.y-8,o.x+13+i*7,o.y-14,'#b4474960',.8);}
  for(const item of s.level.stars)if(!s.collected.has(item.id)&&item.x>cam-30&&item.x<cam+W+30){star(item.x,item.y+Math.sin(visualTime*3+item.id)*3,11);}
  for(const n of s.level.notes)if(n.x>cam-300&&n.x<cam+W)text(n.text,n.x,n.y,21,'#b44749b0',-.035);
  for(let i=1;i<s.level.checkpoints.length;i++){const x=s.level.checkpoints[i];if(x<cam-30||x>cam+W+30)continue;const y=P.surface(x,s.level.ground).y;line(x,y,x,y-75,GRAY,1);path([[x,y-75],[x+34,y-67],[x,y-57]],i<=s.checkpointIndex?RED:GRAY,1.5,true,i<=s.checkpointIndex?'#b4474930':null);}
  const x=s.level.end,y=P.surface(x,s.level.ground).y;if(x<cam+W+150){for(const a of [x,x+90])line(a,y,a,y-140,INK,2);for(let i=0;i<6;i++)for(let j=0;j<2;j++){ctx.fillStyle=(i+j)%2?INK:PAPER;ctx.fillRect(x+i*15,y-140+j*15,15,15);}text('CLASS DISMISSED',x+45,y-160,24,RED,-.025,'center');}
}
function draw(alpha,dt){
  const scale=canvas.width/W;ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);
  if(paper.complete&&paper.naturalWidth){const width=900,h=600,shift=((cam*.14)%width+width)%width;ctx.globalAlpha=.65;for(let x=-shift;x<W;x+=width)ctx.drawImage(paper,x,offsetY,width,h);ctx.globalAlpha=1;}
  for(let y=offsetY+18;y<H;y+=36)line(0,y,W,y,'#6688a91b',.6);
  const px=prev.x+(s.x-prev.x)*alpha,py=prev.y+(s.y-prev.y)*alpha,pa=prev.angle+(s.angle-prev.angle)*alpha;
  const target=px-W*.27+Math.min(60,(s.vx-300)*.1);cam+=(target-cam)*(1-Math.exp(-7*dt));
  ctx.save();ctx.translate(-cam,offsetY);if(shake>.1&&!reduced)ctx.translate(Math.sin(visualTime*73)*shake,Math.cos(visualTime*59)*shake*.6);terrain();
  for(const tr of trails){ctx.globalAlpha=tr.life*.12;line(tr.x-18,tr.y,tr.x+18,tr.y,INK,1.5);}ctx.globalAlpha=1;
  const shadow=P.surface(px,s.level.ground);if(shadow){ctx.save();ctx.globalAlpha=Math.max(.025,.13-(shadow.y-py)*.00035);ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(px,shadow.y+3,28,3,0,0,TAU);ctx.fill();ctx.restore();}
  if(s.status==='bail'){const t=.85-s.bailTimer;ctx.save();ctx.translate(px,py-10);ctx.rotate(t*4);board(0,visualTime*6);ctx.restore();ctx.save();ctx.globalAlpha=.7;skater(px+t*35,py-40-Math.sin(t*4)*20,pa+t*3);ctx.restore();}
  else skater(px,py,pa);
  if(s.charge>.05&&s.status==='playing'){const y=py-105;for(let i=0;i<5;i++){ctx.fillStyle=i/5<s.charge?RED:'#243e8620';ctx.fillRect(px-20+i*9,y,6,4);}}
  for(const p of particles){ctx.globalAlpha=Math.min(1,p.life/.2);line(p.x,p.y,p.x-p.vx*.025,p.y-p.vy*.025,p.color,p.size);}ctx.globalAlpha=1;ctx.restore();
  if(s.status==='playing'){text(`${Math.round(s.speed/10)} ink / sec`,W-24,H-20,15,GRAY,.02,'right');}
}
function frame(time){let dt=last?Math.min(.06,(time-last)/1000):0;last=time;visualTime+=dt;if(!paused){acc+=dt;let ticks=0;while(acc>=P.DT&&ticks<8){prev={x:s.x,y:s.y,angle:s.angle};P.step(s,{jump:input.jump,lean:Number(input.right)-Number(input.left),grind:input.grind});events();acc-=P.DT;ticks++;}for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=400*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);for(const t of trails)t.life-=dt;trails=trails.filter(t=>t.life>0);if(!s.grounded&&s.status==='playing'&&!reduced)trails.push({x:s.x,y:s.y,life:.28});toastLife-=dt;if(toastLife<=0)$('announcement').classList.remove('show');shake*=Math.exp(-14*dt);}else acc=0;draw(paused?1:acc/P.DT,dt);updateHUD();requestAnimationFrame(frame);}
select(0);resize();requestAnimationFrame(frame);
})();
