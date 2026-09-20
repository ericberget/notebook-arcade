(() => {
  'use strict';
  const P=BridgePhysics,W=1200,H=720,canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),k=NotebookInk(ctx),{INK,RED,GRAPHITE}=k;
  const stage=document.getElementById('stage'),$=id=>document.getElementById(id),levels=BridgeLevels;
  let levelIndex=0,completed=[];
  try{const saved=JSON.parse(localStorage.getItem('bridge-pages')||'null');if(saved){levelIndex=Math.max(0,Math.min(levels.length-1,Number.isInteger(saved.current)?saved.current:0));completed=Array.isArray(saved.completed)?saved.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<levels.length):[];}}catch{}
  let level=levels[levelIndex],budget=level.budget;const drafts=new Map();
  function remember(){try{localStorage.setItem('bridge-pages',JSON.stringify({current:levelIndex,completed}));}catch{}}
  const paper=document.createElement('canvas');paper.width=W;paper.height=H;NotebookPaper.draw(paper.getContext('2d'),W,H,'plain');
  $('binding').innerHTML='<i></i>'.repeat(15);
  let strokes=[],history=[],active=null,tool='road',world=null,mode='draw',frame=0,attempt=1,ghost=[],hint=false,hover=null,breakCount=0,resultAt=0;
  let voice='i was told there would be a bridge.',voiceUntil=300,sound=false,audio=null;
  function fit(){const rim=innerWidth<700?8:30,s=Math.min((innerWidth-rim*2)/1252,(innerHeight-rim*2)/H);stage.style.transform=`scale(${s})`;stage.style.marginLeft=((innerWidth-1252*s)/2+52*s)+'px';stage.style.marginTop=((innerHeight-H*s)/2)+'px';}
  window.addEventListener('resize',fit);fit();
  const clone=()=>strokes.map(s=>({type:s.type,points:s.points.map(p=>({...p}))}));
  function save(){history.push(clone());if(history.length>30)history.shift();}
  function say(text,t=200){voice=text;voiceUntil=frame+t;}
  function note(text){$('status').textContent=text;}
  function blip(type){if(!sound)return;audio ||= new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.connect(g);g.connect(audio.destination);o.type='triangle';o.frequency.setValueAtTime(type==='snap'?115:type==='win'?620:220,t);o.frequency.exponentialRampToValueAtTime(type==='snap'?55:type==='win'?850:180,t+.12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.08,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.start();o.stop(t+.2);}
  function update(){
    $('level-count').textContent=`LEVEL ${levelIndex+1} / ${levels.length}`;$('level-name').textContent=level.name;$('ink-meter').max=budget;
    [...$('level-pages').children].forEach((button,i)=>{button.setAttribute('aria-current',i===levelIndex?'page':'false');button.classList.toggle('completed',completed.includes(i));button.setAttribute('aria-label',`Level ${i+1}: ${levels[i].name}${completed.includes(i)?' Completed.':''}`);});
    $('retry').hidden=mode!=='won';$('go').classList.toggle('next-level',mode==='won');
    const left=Math.max(0,budget-P.length(strokes)-(active?P.length([active]):0));$('ink-meter').value=left;$('ink-count').textContent=Math.round(left/budget*100)+'%';$('go').textContent=mode==='run'?'STOP!':mode==='draw'?'SEND IT! →':mode==='won'?(levelIndex<levels.length-1?'NEXT LEVEL →':'PLAY AGAIN ↶'):'FIX IT ↶';$('undo').disabled=mode!=='draw'||!history.length;for(const id of ['road','brace','erase']){$(id).disabled=mode!=='draw';$(id).setAttribute('aria-pressed',String(tool===id));}}
  function select(t){tool=t;$('tool-note').innerHTML=t==='road'?'Blue lines are roads.<br>Join the two top dots.':t==='brace'?'Braces hold things up.<br>Triangles are your friends.':'Tap a stroke to erase it.<br>No evidence. No problem.';update();}
  ['road','brace','erase'].forEach(id=>$(id).onclick=()=>select(id));
  function loadLevel(index){
    if(active){active=null;}
    drafts.set(levelIndex,clone());levelIndex=index;level=levels[index];budget=level.budget;
    strokes=(drafts.get(index)||[]).map(s=>({type:s.type,points:s.points.map(p=>({...p}))}));history=[];world=null;mode='draw';attempt=1;ghost=[];hint=false;hover=null;breakCount=0;
    select('road');note(level.brief);say(index===0?'i was told there would be a bridge.':'another river? really?',240);remember();
  }
  levels.forEach((page,i)=>{const button=document.createElement('button');button.type='button';button.textContent=i+1;button.title=`Level ${i+1}: ${page.name}`;button.onclick=()=>{if(i!==levelIndex)loadLevel(i);};$('level-pages').append(button);});
  $('retry').onclick=()=>edit();
  function edit(){if(world)ghost=world.links.map(l=>({a:{x:world.nodes[l.a].x,y:world.nodes[l.a].y},b:{x:world.nodes[l.b].x,y:world.nodes[l.b].y}}));world=null;mode='draw';attempt++;say('okay. NEW plan.');note('Add a brace. Erase a wobble. Try again.');update();}
  function go(){if(active)return;if(mode==='won'){loadLevel(levelIndex<levels.length-1?levelIndex+1:0);return;}if(mode!=='draw'){edit();return;}if(!strokes.some(s=>s.type==='road')){note('Our driver would appreciate an actual road.');say('small request: a road.');return;}world=P.create(strokes,level);mode='run';breakCount=0;note('Testing your actual drawing...');say('i believe in you. mostly.',180);blip('go');update();}
  $('go').onclick=go;
  $('undo').onclick=()=>{if(mode==='draw'&&history.length){strokes=history.pop();update();}};
  $('clear').onclick=()=>{if(mode!=='draw')edit();save();strokes=[];ghost=[];hint=false;note('A fresh start. Same nervous driver.');say('we never speak of the last one.');update();};
  $('hint').onclick=()=>{hint=!hint;note(hint?'Road across the top. Brace underneath. Touch the anchor dots.':'Your pencil. Your questionable decisions.');};
  $('sound').onclick=()=>{sound=!sound;$('sound').textContent='sound: '+(sound?'on':'off');$('sound').setAttribute('aria-pressed',String(sound));if(sound)blip('go');};
  function pos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  const inside=p=>p.x>=180&&p.x<=910&&p.y>=235&&p.y<=610;
  function snap(p){let nearest=null,dist=17;for(const a of level.anchors){const d=P.distance(p,a);if(d<dist){nearest=a;dist=d;}}for(const s of strokes)for(let i=1;i<s.points.length;i++){const q=P.closest(p,s.points[i-1],s.points[i]),d=P.distance(p,q);if(d<dist){nearest=q;dist=d;}}return nearest?{x:nearest.x,y:nearest.y}:{...p};}
  function add(p){if(!inside(p))return;const last=active.points.at(-1),d=P.distance(last,p);if(d<4)return;const remaining=budget-P.length(strokes)-P.length([active]);if(remaining<1){note('Out of pencil. Undo or erase a little.');return;}active.points.push(d>remaining?{x:last.x+(p.x-last.x)*remaining/d,y:last.y+(p.y-last.y)*remaining/d}:p);update();}
  canvas.addEventListener('pointerdown',e=>{if(mode!=='draw'||!inside(pos(e)))return;e.preventDefault();const p=pos(e);if(tool==='erase'){let closest=18,index=-1;strokes.forEach((s,j)=>s.points.slice(1).forEach((b,i)=>{const d=P.distance(p,P.closest(p,s.points[i],b));if(d<closest){closest=d;index=j;}}));if(index>=0){save();strokes.splice(index,1);update();}return;}if(P.length(strokes)>=budget)return;canvas.setPointerCapture(e.pointerId);active={type:tool,points:[snap(p)]};});
  canvas.addEventListener('pointermove',e=>{hover=pos(e);if(active){e.preventDefault();add(pos(e));}});
  function finish(e){if(!active)return;const p=pos(e);if(inside(p))add(snap(p));if(active.points.length>1){save();strokes.push(active);note(tool==='road'?'Road drawn. Some support might be nice.':'That looks suspiciously like engineering.');}active=null;update();}
  canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',()=>{active=null;update();});canvas.addEventListener('pointerleave',()=>{hover=null;});
  window.addEventListener('keydown',e=>{if(e.target.matches('button,a'))return;if(e.code==='Space'){e.preventDefault();go();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$('undo').click();}if(mode==='draw'){if(e.key==='1')select('road');if(e.key==='2')select('brace');if(e.key==='e')select('erase');}});
  const pts=a=>a.map(([x,y])=>({x,y}));
  function text(s,x,y,size=22,color=INK,rot=0,align='center'){k.text(s,x,y,{size,color,rot,align,font:size>21?'Caveat':'Patrick Hand',weight:size>21?700:400});}
  function arrow(x,y,xx,yy,id,color=RED){k.line(x,y,xx,yy,id,color,1.5,2);const a=Math.atan2(yy-y,xx-x);for(const d of [-.5,.5])k.line(xx,yy,xx-Math.cos(a+d)*10,yy-Math.sin(a+d)*10,id+2+d,color,1.5,1);}
  function scenery(){const [tl,tr,bl,br]=level.anchors,L=tl.x,R=tr.x,M=(L+R)/2;ctx.drawImage(paper,0,0);ctx.strokeStyle='rgba(80,124,173,.09)';ctx.lineWidth=.8;for(let x=170;x<920;x+=24){ctx.beginPath();ctx.moveTo(x,215);ctx.lineTo(x,635);ctx.stroke();}for(let y=215;y<636;y+=24){ctx.beginPath();ctx.moveTo(170,y);ctx.lineTo(915,y);ctx.stroke();}
    k.line(175,145,589,136,10,RED,3,2);k.line(201,150,523,143,11,RED,1.5,1);
    text('NOT TO SCALE',836,59,14,GRAPHITE,.09);k.line(780,48,892,66,12,RED,1,1);text('not to code either.',827,84,19,RED,.09);
    text('attempt '+String(attempt).padStart(2,'0'),208,222,22,GRAPHITE,-.07);text('destination: literally over there',775,331,20,INK,.04);arrow(813,338,R+55,393,20,INK);
    const left=pts([[179,422],[L,422],[L-4,448],[L-15,456],[L-4,483],[bl.x-8,bl.y-38],[bl.x,bl.y],[bl.x-17,610],[bl.x-13,622],[179,622]]),right=pts([[R,422],[912,422],[912,623],[br.x+16,623],[br.x+11,610],[br.x,br.y],[br.x+14,br.y-22],[R+18,491],[R+27,466],[R+3,452]]);
    for(const [shape,id] of [[left,30],[right,60]]){ctx.fillStyle='#e6dcc6';ctx.beginPath();shape.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();k.hatch(shape,id,GRAPHITE,10,.7,.19);k.poly(shape,id+1,GRAPHITE,1.7,2);}
    k.line(179,422,L,422,90,INK,3,2);k.line(R,422,912,422,91,INK,3,2);
    // A deeply unimpressed fish in the canyon.
    const fy=618+Math.sin(frame*.035)*3,fx=540+Math.sin(frame*.006)*55;
    ctx.strokeStyle='#63828c';ctx.lineWidth=1.3;for(let j=0;j<3;j++){ctx.beginPath();for(let x=L;x<R;x+=4){const y=610+j*9+Math.sin(x*.055+frame*.025)*3;x===L?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
    k.poly(pts([[fx-15,fy],[fx-28,fy-9],[fx-26,fy+9],[fx-15,fy]]),99,INK,1,1);ctx.beginPath();ctx.ellipse(fx,fy,16,8,0,0,7);ctx.strokeStyle=INK;ctx.stroke();k.line(fx+6,fy-3,fx+12,fy-3,100,INK,1.4,1);text('oh good. another bridge.',596,655,19,GRAPHITE,-.035);
    for(const [i,a] of level.anchors.entries()){ctx.fillStyle='#edd35b77';ctx.beginPath();ctx.arc(a.x,a.y,11,0,7);ctx.fill();k.circle(a.x,a.y,7,120+i*3,RED,2,2);k.circle(a.x,a.y,2,121+i*3,RED,2,1);}
    if(!strokes.length){text('road goes here-ish',M,394,27,RED,-.055);ctx.setLineDash([5,8]);ctx.strokeStyle='#bf3b2d77';ctx.beginPath();ctx.moveTo(L+15,422);ctx.quadraticCurveTo(M,410,R-16,422);ctx.stroke();ctx.setLineDash([]);arrow(M+9,397,M+25,416,150);}
    text('bolt your doodles here',bl.x-87,bl.y,18,RED,-.12);arrow(bl.x-51,bl.y+8,bl.x-9,bl.y,160);
    if(hint){ctx.save();ctx.setLineDash([7,8]);ctx.strokeStyle='#aa9d8066';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L,422);ctx.lineTo(R,422);ctx.moveTo(bl.x,bl.y);ctx.lineTo(M,422);ctx.lineTo(br.x,br.y);ctx.stroke();ctx.restore();text('try triangles underneath',550,566,23,RED,.02);}
    // Evidence of questionable calculations, left in the margins.
    text('load = truck',99,310,18,GRAPHITE,-.13);text('+ vibes',106,333,18,GRAPHITE,-.09);k.line(58,338,145,316,177,RED,1.5,1);text('hmm.',115,366,25,RED,-.1);
    text('★',R+75,414,30,RED,.12);k.line(R+54,422,R+54,379,179,GRAPHITE,1.5,1);k.poly(pts([[R+55,379],[R+83,384],[R+56,398]]),180,RED,1.5,2);
  }
  function drawing(){if(ghost.length){ctx.strokeStyle='#6b625018';ctx.lineWidth=4;ctx.beginPath();for(const e of ghost){ctx.moveTo(e.a.x,e.a.y);ctx.lineTo(e.b.x,e.b.y);}ctx.stroke();}
    if(world){world.links.forEach((l,i)=>{const a=world.nodes[l.a],b=world.nodes[l.b];if(l.broken){k.line(a.x,a.y,a.x+(b.x-a.x)*.2,a.y+(b.y-a.y)*.2,1400+i,RED,2,1);k.line(b.x,b.y,b.x+(a.x-b.x)*.2,b.y+(a.y-b.y)*.2,1450+i,RED,2,1);return;}const color=l.stress>.75?RED:l.type==='road'?INK:GRAPHITE;k.line(a.x,a.y,b.x,b.y,1000+i*4,color,l.type==='road'?3:1.8,2);});
      if(world.breaks.length){const p=world.breaks[0];text('needed something here',p.x+42,p.y+52,22,RED,.07);arrow(p.x+32,p.y+33,p.x,p.y,1490);}
      world.nodes.forEach((n,i)=>{if(!n.pin&&n.y<650)k.circle(n.x,n.y,2,1500+i,GRAPHITE,.8,1);});
    }else{[...strokes,...(active?[active]:[])].forEach((s,j)=>{for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i];k.line(a.x,a.y,b.x,b.y,1000+j*121+i,s.type==='road'?INK:GRAPHITE,s.type==='road'?3:1.8,2);}});if(hover&&inside(hover)&&tool!=='erase'){const p=snap(hover);if(P.distance(p,hover)>0.2)k.circle(p.x,p.y,11,1900,RED,1.5,1);}}
  }
  function truck(){const a=world?world.wheels[0]:{x:level.anchors[0].x-120,y:413},b=world?world.wheels[1]:{x:level.anchors[0].x-72,y:413},x=(a.x+b.x)/2,y=(a.y+b.y)/2,angle=Math.atan2(b.y-a.y,b.x-a.x);if(y>740)return;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);const shape=pts([[-33,-11],[-34,-33],[4,-32],[7,-44],[23,-42],[33,-25],[37,-21],[36,-10]]);ctx.fillStyle='#f5d659';ctx.beginPath();shape.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();k.hatch(shape,2000,INK,5,-.7,.18);k.poly(shape,2001,INK,2,2);k.poly(pts([[10,-39],[21,-37],[28,-26],[8,-26]]),2020,INK,1.5,1);k.line(-32,-32,-3,-33,2021,RED,3,2);text('EGGS',-14,-17,14,INK,-.04);for(const wx of [-24,24]){ctx.fillStyle='#f8f1de';ctx.beginPath();ctx.arc(wx,0,9,0,7);ctx.fill();k.circle(wx,0,9,2030+wx,INK,2.5,2);k.line(wx-Math.cos(frame*.06)*5,-Math.sin(frame*.06)*5,wx+Math.cos(frame*.06)*5,Math.sin(frame*.06)*5,2040+wx,INK,1.1,1);}k.line(31,-18,38,-18,2050,INK,1.6,1);ctx.restore();
    if(frame<voiceUntil){const bx=x+12,by=y-84;ctx.fillStyle='#fcf9ed';ctx.beginPath();ctx.ellipse(bx,by,110,22,-.025,0,7);ctx.fill();k.line(bx-20,by+20,bx-8,by+38,2100,GRAPHITE,1,1);text(voice,bx,by+5,19,GRAPHITE,-.025);}
  }
  function result(){if(mode==='draw'||mode==='run')return;const won=mode==='won';ctx.save();ctx.translate(563,262);ctx.rotate(won?-.08:.055);text(won?(completed.length===levels.length?'ALL FOUR HELD!':'IT HELD!'):mode==='stuck'?'WE LIVE HERE NOW.':'STRUCTURAL OOPS.',0,0,51,won?INK:RED);k.line(-197,12,201,9,2200,won?INK:RED,2.5,2);text(won?(completed.length===levels.length?'the eggs are forever in your debt.':'the eggs send their regards.'):mode==='stuck'?'a flatter road might help.':'no eggs were harmed. (probably.)',0,36,22,GRAPHITE);ctx.restore();}
  function step(){frame++;if(mode==='run'){P.step(world);if(world.breaks.length>breakCount){breakCount=world.breaks.length;blip('snap');say('that was a load-bearing scribble!',150);}if(world.t===230&&!breakCount)say('steady... STEADY...',150);if(world.status!=='running'){mode=world.status;resultAt=frame;if(mode==='won'){if(!completed.includes(levelIndex))completed.push(levelIndex);remember();}note(mode==='won'?(levelIndex<levels.length-1?`Bridge passed. On to level ${levelIndex+2}!`:completed.length===levels.length?'All four levels complete. The eggs are very impressed.':'Level 4 complete! Try the other numbered pages above.'):mode==='stuck'?'Too bumpy or steep. Flatten the road, then try again.':'The red strokes took too much strain. Add braces underneath.');say(mode==='won'?'i never doubted you.':'i would like a refund.',220);if(mode==='won')blip('win');update();}}}
  function draw(){scenery();drawing();truck();result();}
  let last=0,acc=0;function tick(now){if(!last)last=now;acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){step();acc-=1000/60;}draw();requestAnimationFrame(tick);}note(level.brief);update();requestAnimationFrame(tick);
})();
