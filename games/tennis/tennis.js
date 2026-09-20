(() => {
  'use strict';
  const canvas = document.querySelector('#court'), ctx = canvas.getContext('2d');
  const ink = NotebookInk(ctx), {INK, RED, GRAPHITE} = ink;
  const status = document.querySelector('#status'), serve = document.querySelector('#serve');
  const pause = document.querySelector('#pause'), keys = new Set();
  let crowdOn = false;
  try { crowdOn = localStorage.getItem('notebook.tennis.crowd') === 'on'; } catch {}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let player = 0.5, target = .5, ai = .5, aiTarget = .5, score = [0,0], phase = 'ready', paused = false;
  let shot = null, rally = 0, best = 0, boost = 0, burst = 0, flash = '', time = 0, last = 0, muted = true, audio;
  let playerY=1.04, targetY=1.04, aiY=.02, aiDepth=.02, charging=false, charge=0, powerLevel=0, lobQueued=false;
  const hardButton=document.querySelector('#hard'), lobButton=document.querySelector('#lob'), shotHint=document.querySelector('#shot-hint');
  let impact = null, hitStop = 0, swings = [null, null];
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const project = (x,y) => ({x:450+(x-.5)*(370+y*290),y:110+y*420});
  function sound(kind) {
    if(muted)return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
      const now=audio.currentTime;
      const tone=(frequency,volume,duration,delay=0)=>{
        const oscillator=audio.createOscillator(), gain=audio.createGain(), start=now+delay;
        oscillator.type='sine';oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.002);
        gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
        oscillator.connect(gain);gain.connect(audio.destination);
        oscillator.start(start);oscillator.stop(start+duration+.01);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      };
      if(kind==='point'){
        tone(523.25,.025,.18);tone(659.25,.019,.22,.075);return;
      }
      // A short filtered air transient and fixed resonances: felt ball on strings,
      // without an electronic pitch sweep or a sustained oscillator tail.
      const bounce=kind==='bounce', power=kind==='smash';
      const length=bounce?.036:power?.06:.048;
      const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*length),audio.sampleRate);
      const samples=buffer.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,3);
      const noise=audio.createBufferSource(), filter=audio.createBiquadFilter(), gain=audio.createGain();
      noise.buffer=buffer;filter.type='bandpass';filter.frequency.value=bounce?480:power?1400:1150;filter.Q.value=.65;
      gain.gain.value=bounce?.13:power?.28:.2;
      noise.connect(filter);filter.connect(gain);gain.connect(audio.destination);noise.start(now);
      noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
      const variation=.96+Math.random()*.08;
      tone((bounce?155:power?255:290)*variation,bounce?.045:.07,bounce?.045:.065);
      if(!bounce)tone(475*variation,.025,.032);
    } catch {}
  }
  function hit(from, down, power, y, z) {
    const p = project(from,y);
    impact = {x:p.x, y:p.y-z, age:0, power, down};
    swings[down ? 1 : 0] = {...impact};hitStop=power?.065:.035;
  }
  function say(text){status.textContent=text;}
  function launch(from,to,down,kind='normal',fromY=down?aiY:playerY,fromZ=28) {
    const endY=down?.88:.12, distance=Math.abs(endY-fromY);
    const duration=kind==='lob'?1.65:kind==='hard'?.64:Math.max(.78,distance*1.18);
    const gravity=300;
    shot={x:from,y:fromY,z:fromZ,vx:(to-from)/duration,vy:(endY-fromY)/duration,
      vz:(gravity*duration*duration/2-fromZ)/duration,gravity,down,kind,age:0,bounces:0,landingX:to,landingY:endY};
    aiTarget=clamp(to+(Math.random()-.5)*.05,.04,.96);
    burst=.22;hit(from,down,kind==='hard',fromY,fromZ);sound(kind==='hard'?'smash':'hit');
  }
  function shotUI(){
    hardButton.disabled=lobButton.disabled=phase!=='play'||paused;
    lobButton.setAttribute('aria-pressed',String(lobQueued));
    shotHint.textContent=charging?`power ${Math.round(charge*100)}% · release near contact`:lobQueued?'lob ready · next return':boost>0?'hard shot ready!':'auto return · hold Space for power · Shift to lob';
  }
  function clearShotChoice(){charging=false;charge=powerLevel=boost=0;lobQueued=false;}
  function startCharge(){if(phase!=='play'||paused)return;charging=true;charge=0;lobQueued=false;shotUI();}
  function releaseCharge(){if(!charging)return;charging=false;if(phase==='play'&&!paused){powerLevel=charge;boost=.42;}charge=0;shotUI();}
  function chooseLob(){if(phase!=='play'||paused)return;clearShotChoice();lobQueued=true;shotUI();}
  function action(){
    if(paused)return;
    if(phase==='over'){reset();return;}
    if(phase==='ready'){
      phase='play';rally=0;playerY=targetY=1.04;aiY=aiDepth=.02;
      launch(player,.18+Math.random()*.64,false);serve.textContent='rally in play';serve.disabled=true;
      say('Move in to volley. Lob over the pencil.');shotUI();canvas.focus({preventScroll:true});
    }
  }
  function point(who){
    clearShotChoice();score[who]++;best=Math.max(best,rally);phase='ready';shot=null;boost=0;impact=null;hitStop=0;swings=[null,null];
    document.querySelector('#you').textContent=score[0];document.querySelector('#pencil').textContent=score[1];
    const won=Math.max(...score)>=7&&Math.abs(score[0]-score[1])>=2;
    flash=who===0?'NICE!':'oops.';burst=1.2;sound(who===0?'point':'bounce');
    if(won){phase='over';say(`${who===0?'You win! The notebook goes wild.':'The pencil wins. Rematch?'} Best rally: ${best}.`);serve.textContent='play again ↻';}
    else {say(`${who===0?'Your point!':'Point to the pencil.'} ${rally} return${rally===1?'':'s'} · your serve.`);serve.textContent='next serve ↗';}
    serve.disabled=false;shotUI();
  }
  function reset(){clearShotChoice();playerY=targetY=1.04;aiY=aiDepth=.02;impact=null;hitStop=0;swings=[null,null];score=[0,0];player=target=ai=aiTarget=.5;shot=null;rally=best=boost=burst=0;phase='ready';paused=false;keys.clear();pause.textContent='pause';pause.setAttribute('aria-pressed','false');serve.disabled=false;serve.textContent='serve it ↗';document.querySelector('#you').textContent='0';document.querySelector('#pencil').textContent='0';say('Your court. Your serve.');shotUI();}
  function togglePause(){paused=!paused;keys.clear();clearShotChoice();pause.textContent=paused?'resume':'pause';pause.setAttribute('aria-pressed',String(paused));serve.disabled=paused||phase==='play';shotUI();}
  function update(dt){
    if(paused)return;
    if(impact){impact.age+=dt;if(impact.age>.42)impact=null;}
    for(let i=0;i<2;i++)if(swings[i]){swings[i].age+=dt;if(swings[i].age>.32)swings[i]=null;}
    if(hitStop>0){hitStop=Math.max(0,hitStop-dt);return;}
    time+=dt;boost=Math.max(0,boost-dt);burst=Math.max(0,burst-dt);
    if(charging)charge=Math.min(1,charge+dt*1.2);
    const dx=Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a'));
    const dy=Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'));
    if(dx)target=clamp(player+dx*dt*1.15,.02,.98);
    if(dy)targetY=clamp(playerY+dy*dt*.75,.58,1.12);
    player+=clamp(target-player,-dt*1.15,dt*1.15);
    playerY+=clamp(targetY-playerY,-dt*.75,dt*.75);
    // The pencil commits to occasional net approaches, then retreats from lobs.
    const receiving=shot&&!shot.down;
    const goal=receiving&&shot.age>.13?aiTarget:.5;
    if(receiving&&shot.kind==='lob'&&shot.age>.3)aiDepth=.01;
    ai+=clamp(goal-ai,-dt*.46,dt*.46);
    aiY+=clamp(aiDepth-aiY,-dt*.32,dt*.32);
    shotUI();
    if(!shot)return;
    const previousY=shot.y;
    shot.age+=dt;shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;
    shot.z+=shot.vz*dt-.5*shot.gravity*dt*dt;shot.vz-=shot.gravity*dt;
    if((previousY-.5)*(shot.y-.5)<=0&&shot.z<30){say('Caught the net!');point(shot.down?0:1);return;}
    if(shot.z<=0){
      shot.bounces++;sound('bounce');
      if(shot.bounces>=2){point(shot.down?1:0);return;}
      if(shot.x<0||shot.x>1||shot.y<0||shot.y>1){point(shot.down?0:1);return;}
      shot.z=0;shot.vz=Math.abs(shot.vz)*.64;
    }
    const down=shot.down, receiver=down?player:ai, receiverY=down?playerY:aiY;
    const reach=down&&boost>0?.078:down?.115:.09;
    if(shot.age>.15&&Math.abs(shot.y-receiverY)<.085&&Math.abs(shot.x-receiver)<reach&&shot.z<64&&shot.z>3){
      const incoming=shot;rally++;best=Math.max(best,rally);
      if(down){
        const kind=lobQueued?'lob':boost>0&&powerLevel>.12?'hard':'normal';
        const aim=clamp(.5+(incoming.x-player)*(kind==='hard'?5.5:4.2),.035,.965);
        clearShotChoice();launch(incoming.x,aim,false,kind,incoming.y,incoming.z);
        say(`${rally} returns · ${kind==='lob'?'lob!':kind==='hard'?'hard shot!':playerY<.78?'volley!':'keep it going'}`);
      }else{
        const kind=playerY<.76&&Math.random()<.6?'lob':Math.random()<.18?'hard':'normal';
        launch(incoming.x,.07+Math.random()*.86,true,kind,incoming.y,incoming.z);
        aiDepth=rally%3===1?.38:.02;
      }
    }
    if(shot&&(shot.y>1.3||shot.y<-.3||shot.x<-.2||shot.x>1.2))point(shot.bounces>0?(shot.down?1:0):(shot.down?0:1));
  }
  function line(a,b,id,color=INK,width=2){ink.longLine(a.x,a.y,b.x,b.y,id,color,width,2,2.2);}
  function court(){
    const p=project;
    const corners=[p(0,0),p(1,0),p(1,1),p(0,1)];
    ink.hatch(corners,51,'#778866',11,-.9,.12);
    for(const x of [0,.12,.88,1])line(p(x,0),p(x,1),10+x*100);
    for(const y of [0,.27,.73,1])line(p(0,y),p(1,y),30+y*100);
    line(p(.5,.27),p(.5,.73),32);
    for(let i=0;i<30;i++){const x=i/29;const a=p(x,.5);line({x:a.x,y:a.y-32},{x:a.x,y:a.y+6},200+i,GRAPHITE,.6);}
    for(let i=0;i<5;i++){const a=p(-.04,.5),b=p(1.04,.5);line({x:a.x,y:a.y-32+i*8},{x:b.x,y:b.y-32+i*8},240+i,GRAPHITE,.8);}
    for(const x of [-.04,1.04]){const a=p(x,.5);line({x:a.x,y:a.y-42},{x:a.x,y:a.y+18},250+x,RED,3);}
    const a=p(-.04,.5),b=p(1.04,.5);line({x:a.x,y:a.y-33},{x:b.x,y:b.y-33},260,INK,2.5);
    if(!crowdOn){ink.text('OUT?',782,440,{size:27,color:RED,rot:.16});ink.line(750,450,818,421,811,RED,1);
    ink.text('nope.',804,469,{size:21,color:GRAPHITE,rot:-.1});}
    ink.text('THE PENCIL',450,30,{size:22,color:GRAPHITE,rot:.04});
    for(let i=0;i<7;i++)ink.line(120+i*5,133,144+i*5,117,820+i,GRAPHITE,.7);
    ink.text('rally',113,crowdOn?70:379,{size:22,color:GRAPHITE,rot:-.13});ink.text(String(rally),113,crowdOn?107:416,{size:42,rot:-.1});
  }
  function drawCrowd(){
    if(!crowdOn)return;
    const cheer=burst>.4||Boolean(impact);
    for(const side of [-1,1])for(let row=0;row<2;row++)for(let n=0;n<5;n++){
      const depth=.14+n*.135, edge=project(side<0?0:1,depth);
      const x=edge.x+side*(42+row*43), y=edge.y+row*14;
      const id=1200+(side+1)*150+row*50+n*9;
      const beat=!reduced.matches&&!paused?Math.sin(time*(cheer?15:3)+n*1.9+row):0;
      const hop=cheer&&!reduced.matches?Math.max(0,beat)*5:0;
      const color=(n+row)%4===0?RED:GRAPHITE;
      const arm=cheer?-25:-9-beat*3;
      ctx.save();ctx.translate(x,y-hop);ctx.rotate(side*.09);
      ink.circle(0,-23,6+(n%2),id,color,1.3,2);
      ink.line(0,-16,1,-2,id+1,color,1.5,2);
      ink.path([{x:-9,y:8},{x:1,y:-2},{x:10,y:7}],id+2,color,1.4,1);
      ink.path([{x:-13,y:arm},{x:-7,y:-9},{x:0,y:-13},{x:8,y:-9},{x:14,y:arm-3}],id+3,color,1.4,2);
      if(n%3===0)ink.line(-7,-29,9,-29,id+4,INK,2,1);
      if(n===2&&row===1){
        ink.line(13,arm-3,13,arm-22,id+5,color,1,1);
        ink.poly([{x:13,y:arm-23},{x:33,y:arm-19},{x:13,y:arm-12}],id+6,RED,1.4,1);
      }
      ctx.restore();
    }
    ink.text(cheer?'YEAH!!':'shhh… tennis.',756,123,{size:25,color:RED,rot:.13});
    ink.text('the cheap seats',110,515,{size:21,color:GRAPHITE,rot:-.13});
  }
  function person(x,y,color,id){
    const p=project(x,y), bounce=phase==='play'&&!paused?Math.sin(time*12)*2:0;
    ctx.save();ctx.translate(p.x,p.y+bounce);
    const swing=swings[y>.5?0:1], age=swing?swing.age:1;
    // Discrete poses give the swing a little hand-animated snap and recovery.
    const pose=Math.floor(age*24)/24, recovery=clamp((pose-.06)/.25,0,1);
    const angle=swing&&!reduced.matches?(.95-recovery*1.25):-.3;
    const contactX=swing?swing.x-p.x:30, contactY=swing?swing.y-p.y:-52;
    const handX=swing&&!reduced.matches?(contactX-Math.sin(angle)*28)*(1-recovery)+30*recovery:30;
    const handY=swing&&!reduced.matches?(contactY+Math.cos(angle)*28)*(1-recovery)-24*recovery:-24;
    const lean=clamp((target-player)*40,-7,7)*(y>.5?1:0)+(swing&&!reduced.matches?(1-recovery)*5:0);
    ink.scribble(0,6,19,id,GRAPHITE,14,.12);
    ink.circle(lean,-45,11,id+1,color,2);ink.path([{x:lean,y:-33},{x:0,y:-13},{x:-14,y:5}],id+2,color,2.5,2);ink.line(0,-13,15,4,id+3,color,2.5);
    ink.path([{x:lean,y:-29},{x:18,y:-19},{x:handX,y:handY}],id+4,color,2,2);
    ink.line(lean,-29,-17,-19,id+6,color,2);
    ctx.save();ctx.translate(handX,handY);ctx.rotate(angle);ctx.translate(0,-28);ink.circle(0,0,16,id+7,color,2);ink.hatch([{x:-11,y:-11},{x:11,y:-11},{x:11,y:11},{x:-11,y:11}],id+8,color,5,.7,.45);ink.line(0,15,0,32,id+9,color,3);ink.line(-3,28,3,28,id+10,color,2);ctx.restore();
    ink.line(lean-9,-53,lean+8,-53,id+11,RED,3);ctx.restore();
  }
  function drawImpact(){
    if(!impact)return;
    const {x,y,age,power}=impact, progress=age/.42;
    const spread=reduced.matches?0:progress*(power?34:22);
    const color=power?RED:INK;
    if(progress<.7){
      for(let i=0;i<(power?10:7);i++){
        const a=i*2.399, inner=12+spread, outer=inner+(power?18:11)*(1-progress);
        ink.line(x+Math.cos(a)*inner,y+Math.sin(a)*inner,x+Math.cos(a)*outer,y+Math.sin(a)*outer,700+i,color,power?2.5:1.8,1);
      }
    }
    ink.text(power?'WHACK!':'pak!',clamp(x+42,70,810),y-30-spread*.3,{size:power?34:25,color,rot:-.18,alpha:1-progress});
  }
  function draw(){
    ctx.clearRect(0,0,900,650);if(!reduced.matches&&!paused)ink.tick();court();drawCrowd();person(ai,aiY,GRAPHITE,500);person(player,playerY,INK,550);
    let pos=project(player-.04,playerY),height=26;
    if(shot){
      pos=project(shot.x,shot.y);height=shot.z;
      if(shot.bounces===0){
        const landing=project(shot.landingX,shot.landingY);
        ctx.save();ctx.strokeStyle=shot.kind==='lob'?RED:'#1f3d9e66';ctx.lineWidth=1.5;ctx.setLineDash([4,5]);
        ctx.beginPath();ctx.ellipse(landing.x,landing.y,18,7,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
    }
    ctx.fillStyle='#4a4a4f26';ctx.beginPath();ctx.ellipse(pos.x+3,pos.y+4,10,4,0,0,7);ctx.fill();
    const fresh=impact&&impact.age<.11&&!reduced.matches;
    if(shot&&!reduced.matches&&shot.age>0&&shot.age<.3){
      const dir=shot.down?-1:1;
      for(let i=0;i<3;i++)ink.line(pos.x-7+i*7,pos.y-height+dir*13,pos.x-7+i*7,pos.y-height+dir*(24+12*(1-shot.age/.3)),650+i,impact&&impact.power?RED:GRAPHITE,1,1);
    }
    ctx.save();ctx.translate(pos.x,pos.y-height);if(fresh)ctx.scale(1.4,.72);
    ctx.fillStyle='#ded86b';ctx.beginPath();ctx.arc(0,0,8,0,7);ctx.fill();ink.circle(0,0,8,610,INK,1.5);ink.line(-4,-5,3,5,611,INK,.8);ctx.restore();
    drawImpact();
    if(boost>0||charging||lobQueued)ink.circle(project(player,playerY).x,project(player,playerY).y-28,32+charge*14,620,lobQueued?INK:RED,1);
    if(burst>.4)ink.text(flash,450,225,{size:65,color:RED,rot:-.12});
    if(paused){ctx.fillStyle='#f8f5ebdf';ctx.fillRect(220,230,460,100);ink.text('taking a breather.',450,290,{size:44,rot:-.04});}
  }
  function pointer(e){
    const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)*900/r.width,py=(e.clientY-r.top)*650/r.height;
    targetY=clamp((py-110)/420,.58,1.12);target=clamp((px-450)/(370+targetY*290)+.5,.02,.98);
  }
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointer(e);canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||canvas.hasPointerCapture(e.pointerId))pointer(e);});
  window.addEventListener('keydown',e=>{
    if(e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)return;
    const k=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s',' ','Shift','p'].includes(k)){
      e.preventDefault();keys.add(k);
      if(!e.repeat&&k===' '){if(phase==='play')startCharge();else action();}
      if(!e.repeat&&k==='Shift')chooseLob();if(!e.repeat&&k==='p')togglePause();
    }
  });
  window.addEventListener('keyup',e=>{keys.delete(e.key.length===1?e.key.toLowerCase():e.key);if(e.key===' ')releaseCharge();});
  hardButton.addEventListener('pointerdown',e=>{e.preventDefault();hardButton.setPointerCapture(e.pointerId);startCharge();});
  hardButton.addEventListener('pointerup',releaseCharge);
  hardButton.addEventListener('pointercancel',()=>{clearShotChoice();shotUI();});
  hardButton.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)startCharge();}});
  hardButton.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();releaseCharge();}});
  lobButton.onclick=chooseLob;
  window.addEventListener('blur',()=>{keys.clear();if(phase==='play'&&!paused)togglePause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='play'&&!paused)togglePause();});
  const crowdButton=document.querySelector('#crowd');
  function setCrowd(){
    document.body.classList.toggle('crowd-on',crowdOn);
    crowdButton.textContent=crowdOn?'mode: crowd':'mode: minimal';
    crowdButton.setAttribute('aria-pressed',String(crowdOn));
    crowdButton.setAttribute('aria-label',crowdOn?'Switch to minimal mode':'Show doodle crowd');
  }
  crowdButton.onclick=()=>{crowdOn=!crowdOn;setCrowd();try{localStorage.setItem('notebook.tennis.crowd',crowdOn?'on':'off');}catch{}};
  setCrowd();shotUI();
  serve.onclick=action;pause.onclick=togglePause;document.querySelector('#reset').onclick=reset;
  document.querySelector('#sound').onclick=e=>{muted=!muted;e.currentTarget.textContent=`sound: ${muted?'off':'on'}`;e.currentTarget.setAttribute('aria-pressed',String(!muted));sound('hit');};
  function frame(now){const dt=last?Math.min((now-last)/1000,.04):0;last=now;update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
