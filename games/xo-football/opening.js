/* The title sequence is isolated from the season save and from match gameplay. */
(() => {
  'use strict';
  const SEEN_KEY = 'xo-football-opening-v1';
  const DURATION = 5150;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const home = () => !location.hash || location.hash === '#home';
  let running = null, seenInMemory = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => {n=clamp(n);return n*n*(3-2*n);};
  const between = (t, start, duration) => clamp((t-start)/duration);
  const lerp = (a,b,t) => a+(b-a)*t;
  const blue = '#203d8c', red = '#b44535';

  function drawFilm(ctx, logo, t) {
    ctx.clearRect(0,0,560,630);
    ctx.lineCap='round';ctx.lineJoin='round';
    // Reveal the existing hand-lettered artwork with overlapping pen-width sweeps.
    const title = between(t,760,1100);
    if(logo.complete && logo.naturalWidth && title>0){
      ctx.save();ctx.beginPath();
      const edge=90+390*title;
      ctx.moveTo(76,56);ctx.lineTo(edge,56);
      for(let y=56;y<=307;y+=5)ctx.lineTo(edge+Math.sin(y*1.71)*8,y);
      ctx.lineTo(76,307);ctx.closePath();ctx.clip();
      ctx.drawImage(logo,91,65,390,232);ctx.restore();
    }
    function line(points, progress=1, color=blue, width=1.6, alpha=1) {
      if(progress<=0)return;
      ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=alpha;
      ctx.beginPath();let lengths=[],total=0;
      for(let i=1;i<points.length;i++){const len=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(len);total+=len;}
      let left=total*clamp(progress);ctx.moveTo(...points[0]);
      for(let i=1;i<points.length;i++){const ratio=Math.min(1,left/lengths[i-1]);ctx.lineTo(lerp(points[i-1][0],points[i][0],ratio),lerp(points[i-1][1],points[i][1],ratio));left-=lengths[i-1];if(left<=0)break;}
      ctx.stroke();ctx.restore();
    }
    function mark(x,y,letter,progress=1,scale=1,angle=0) {
      if(progress<=0)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
      for(let lap=0;lap<4;lap++){
        const points=[];
        if(letter==='O'){
          for(let i=0;i<=64;i++){const a=i/64*Math.PI*2-.9+lap*.4;const r=14+lap*.44+Math.sin(a*3+lap)*.65;points.push([Math.cos(a)*r,Math.sin(a)*(r+1)]);}
          line(points,progress,blue,lap===0?1.55:.7,lap===0?.95:.55);
        }else{
          line([[-11+lap*.6,-12],[.4,0],[12,12-lap*.4]],clamp(progress*2),red,lap===0?2.2:.8,lap===0?1:.6);
          line([[12,-12+lap*.5],[0,-.2],[-12+lap*.4,12]],clamp(progress*2-1),red,lap===0?2.2:.8,lap===0?1:.6);
        }
      }
      ctx.restore();
    }
    // Just enough field to read the play. The ink stays smooth and human.
    const field=between(t,1270,550);
    line([[78,333],[274,332],[480,334]],field,blue,1,.32);
    line([[80,335],[273,334],[480,335]],field,blue,.7,.18);
    for(let x=83;x<479;x+=12)line([[x,316],[x+8,333]],field,blue,.7,.16);
    line([[79,461],[245,460],[480,462]],field,blue,1,.2);
    ctx.save();ctx.fillStyle=blue;ctx.globalAlpha=field*.47;ctx.font='15px "Courier New"';ctx.textAlign='center';ctx.fillText('END ZONE',280,322);ctx.restore();
    const ink=between(t,1470,500), run=between(t,2210,1680);
    // Receiver stems upfield, plants, and snaps to the right; the DB overcommits.
    const cut=ease(between(run,.43,.19));
    const rx=lerp(346,457,ease(between(run,.46,.54)));
    const ry=lerp(477,312,run);
    const dx=lerp(347,430,ease(between(run,.68,.32)));
    const dy=lerp(432,287,Math.min(1,run*1.03));
    const catchAt=3590, celebration=between(t,3920,510);
    const hop=Math.sin(celebration*Math.PI)*13;
    const qbX=lerp(220,210,ease(between(t,2210,350)));
    const qbY=lerp(512,527,ease(between(t,2210,350)));
    // A route being drawn becomes the action a moment later.
    const route=between(t,1770,430), fade=1-between(t,2440,650);
    if(fade>0){
      line([[346,477],[346,415],[457,350]],route,blue,1.3,fade*.52);
      line([[445,350],[458,348],[452,361]],clamp(route*3-2),blue,1.3,fade*.52);
    }
    mark(266,484,'O',ink);mark(294,485,'O',between(t,1580,400));
    // Linemen lean into their blocks instead of every mark moving in lockstep.
    mark(262-7*run,459-2*run,'X',between(t,1670,370),1,-run*.15);
    mark(298+9*run,459+4*run,'X',between(t,1730,330),1,run*.18);
    mark(qbX,qbY,'O',ink,1,between(t,3130,220)*-.12);
    mark(dx,dy,'X',between(t,1650,420),1,Math.sin(cut*Math.PI)*.22);
    if(run>.44 && run<.7){
      const opacity=Math.sin(between(run,.44,.26)*Math.PI)*.6;
      line([[rx-22,ry+13],[rx-31,ry+17]],1,blue,1,opacity);
      line([[rx-19,ry+20],[rx-26,ry+24]],1,blue,1,opacity);
    }
    mark(rx,ry-hop,'O',ink,1+Math.sin(celebration*Math.PI)*.055,-Math.sin(celebration*Math.PI)*.14);
    // The ball follows a clean visible arc to the receiver, never to the defender.
    if(t>=3050 && t<catchAt){
      const p=between(t,3050,catchAt-3050);
      const catchRun=between(catchAt,2210,1680),cx=lerp(346,457,ease(between(catchRun,.46,.54))),cy=lerp(477,312,catchRun);
      const bx=lerp(qbX+17,cx,p),by=lerp(qbY-8,cy,p)-Math.sin(p*Math.PI)*35;
      ctx.save();ctx.translate(bx,by);ctx.rotate(-.7+p*5);ctx.fillStyle='#765130';ctx.strokeStyle='#3c3c44';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#fbf8ee';ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(3,0);ctx.stroke();ctx.restore();
    }
    if(t>=catchAt){
      const pop=1-between(t,catchAt,310);
      for(let a=0;a<6;a++){const theta=a*Math.PI/3;line([[rx+Math.cos(theta)*21,ry+Math.sin(theta)*21],[rx+Math.cos(theta)*(21+8*pop),ry+Math.sin(theta)*(21+8*pop)]],1,blue,1.3,pop);}
    }
    const td=between(t,3940,420);
    if(td>0){
      ctx.save();ctx.translate(300,574);ctx.rotate(-.06);ctx.beginPath();ctx.rect(-153,-48,306*td,68);ctx.clip();ctx.fillStyle=blue;ctx.font='54px "Reenie Beanie", cursive';ctx.textAlign='center';ctx.fillText('Touchdown!',0,0);ctx.restore();
      line([[185,589],[301,585],[405,587]],between(t,4240,250),'#c9a136',2.6,.85);
    }
  }

  function seen(){try{return seenInMemory || localStorage.getItem(SEEN_KEY)==='1';}catch{return seenInMemory;}}
  function remember(){seenInMemory=true;try{localStorage.setItem(SEEN_KEY,'1');}catch{/* The menu still works without browser storage. */}}
  function finish(animate=true){
    if(!running)return;
    const state=running;running=null;cancelAnimationFrame(state.frame);clearTimeout(state.safety);
    state.controller.abort();remember();
    state.main.inert=state.wasInert;document.body.classList.remove('opening-active');
    if(animate && !reduced.matches){state.main.classList.add('menu-arriving');setTimeout(()=>state.main.classList.remove('menu-arriving'),750);}
    state.overlay.inert=true;state.overlay.removeAttribute('aria-modal');state.overlay.classList.add('leaving');
    if(!animate || reduced.matches)state.overlay.remove();else setTimeout(()=>state.overlay.remove(),430);
    if(home())(state.returnFocus?.isConnected?state.returnFocus:document.querySelector('.mode-option'))?.focus({preventScroll:true});
  }
  async function start(manual=false){
    if(running || !home() || (!manual && (seen() || reduced.matches)))return;
    const main=document.querySelector('main.notebook');if(!main)return;
    const overlay=document.createElement('section');overlay.className='opening-film';
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','X’s and O’s Football opening');
    overlay.innerHTML=`<div class="opening-scene" aria-hidden="true"><div class="opening-sheet"><canvas width="1120" height="1260"></canvas></div><div class="opening-cover"><img src="assets/logo-pen-v2.png" alt="" draggable="false"></div><div class="opening-wire">${'<i></i>'.repeat(7)}</div></div><div class="opening-controls"><button class="opening-skip" type="button">Skip intro →</button></div>`;
    const returnFocus=manual?document.activeElement:null;
    const controller=new AbortController(),state={overlay,main,wasInert:main.inert,returnFocus,controller,frame:0,safety:0};running=state;
    main.inert=true;document.body.classList.add('opening-active');document.body.append(overlay);
    const skip=overlay.querySelector('button');skip.focus({preventScroll:true});
    skip.addEventListener('click',()=>finish(),{signal:controller.signal});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}else if(e.key==='Tab'){e.preventDefault();skip.focus();}},{signal:controller.signal});
    window.addEventListener('hashchange',()=>finish(false),{signal:controller.signal});
    window.addEventListener('pagehide',()=>finish(false),{signal:controller.signal});
    reduced.addEventListener('change',()=>{if(reduced.matches)finish(false);},{signal:controller.signal});
    // A slow/missing asset must never become an obstacle to the game.
    state.safety=setTimeout(()=>finish(false),9500);
    const logo=new Image();logo.src='assets/logo-pen-v2.png';
    await Promise.race([Promise.allSettled([logo.decode(),document.fonts.load('54px "Reenie Beanie"')]),new Promise(resolve=>setTimeout(resolve,650))]);
    if(running!==state)return;
    clearTimeout(state.safety);
    const canvas=overlay.querySelector('canvas'),ctx=canvas.getContext('2d');
    if(!ctx){finish(false);return;}ctx.scale(2,2);
    const scene=overlay.querySelector('.opening-scene'),cover=overlay.querySelector('.opening-cover');
    if(reduced.matches){scene.style.transform='none';cover.hidden=true;drawFilm(ctx,logo,4600);skip.textContent='Continue →';return;}
    let elapsed=0,last=performance.now();
    const tick=now=>{
      if(running!==state)return;
      // Do not consume the sequence while its browser tab is hidden.
      if(!document.hidden)elapsed+=Math.min(64,now-last);last=now;
      const settle=ease(between(elapsed,0,550)),open=ease(between(elapsed,460,1080));
      scene.style.transform=`translateY(${22*(1-settle)}px) rotate(${-6+5*settle}deg) scale(${.88+.12*settle})`;
      cover.style.transform=`rotateY(${-155*open}deg)`;cover.style.opacity=String(1-ease(between(open,.67,.33)));
      try{drawFilm(ctx,logo,elapsed);}catch{finish(false);return;}
      if(elapsed>=DURATION){finish();return;}
      state.frame=requestAnimationFrame(tick);
    };
    state.frame=requestAnimationFrame(tick);
  }
  function replayButton(){
    if(!home() || document.querySelector('.menu-opening-replay'))return;
    const menu=document.querySelector('.game-menu');if(!menu)return;
    const button=document.createElement('button');button.type='button';button.className='menu-opening-replay';button.textContent='Replay opening';button.addEventListener('click',()=>start(true));menu.append(button);
  }
  const content=document.getElementById('content');
  if(content)new MutationObserver(()=>{replayButton();start();}).observe(content,{childList:true});
  replayButton();start();
})();
