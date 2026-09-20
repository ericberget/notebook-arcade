// Small living sketches adapted from the user's doodle.html reference.
// Real links, filters and readable card faces remain ordinary HTML.
(() => {
  const motionOff = () => document.documentElement.classList.contains('motion-off');
  const states = [];
  const ambient = [];
  let raf = 0, lastFrame = 0, clock = 0;

  function createPreview(canvas, kind) {
    canvas.width = 1000; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const ink = NotebookInk(ctx), {INK, RED} = ink;
    const PEN_MD = '#7a7a82', PEN_DK = '#4a4a50', BROWN = '#8a5a2b';
    let frame = 0;
function previewSlingshot(w, h, hov) {
  const speed = hov ? 1.7 : 1, t = ((frame * speed) % 260) / 260, ground = h - 18;
  ink.line(6, ground, w - 6, ground, 200, INK, 2, 1); for (let x = 12; x < w; x += 22) ink.line(x, ground, x + 3, ground - 6, 201 + x, INK, 1, 1);
  ink.line(34, ground, 34, ground - 34, 202, INK, 3, 1); ink.line(34, ground - 34, 26, ground - 48, 203, INK, 3, 1); ink.line(34, ground - 34, 42, ground - 48, 204, INK, 3, 1);
  const tx = w - 60, fallen = t > 0.62, f = fallen ? Math.min(1, (t - 0.62) / 0.15) : 0;
  const blk = (x, y, bw, bh, ang, id) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); const q = [{ x: -bw / 2, y: -bh / 2 }, { x: bw / 2, y: -bh / 2 }, { x: bw / 2, y: bh / 2 }, { x: -bw / 2, y: bh / 2 }]; ink.hatch(q, id, INK, 5, 0.8, 0.4); ink.poly(q, id, INK, 1.6, 1); ctx.restore(); };
  blk(tx - 16, ground - 16 + f * 4, 8, 32, f * 0.9, 210); blk(tx + 16, ground - 16 + f * 4, 8, 32, -f * 0.7, 211); blk(tx + f * 22, ground - 36 + f * 26, 44, 8, f * 0.6, 212);
  const mx = tx + f * 30, my = ground - 46 + f * 34; ink.circle(mx, my, 8, 213, RED, 1.8, 1); for (const ex of [-3, 3]) { ink.line(mx + ex - 1.5, my - 3, mx + ex + 1.5, my, 214 + ex, RED, 1.2, 1); ink.line(mx + ex + 1.5, my - 3, mx + ex - 1.5, my, 216 + ex, RED, 1.2, 1); }
  let bx = 34, by = ground - 44;
  if (t < 0.25) { const u = t / 0.25; bx = 34 - u * 22; by = ground - 44 + u * 12; ink.line(26, ground - 48, bx, by, 220, RED, 1.5, 1); ink.line(42, ground - 48, bx, by, 221, RED, 1.5, 1); }
  else if (t < 0.62) { const u = (t - 0.25) / 0.37; bx = 12 + (tx - 12) * u; by = ground - 32 - Math.sin(u * Math.PI) * 70; ctx.fillStyle = INK; ctx.globalAlpha = 0.3; for (let k = 0; k < 8; k++) { const uu = u * k / 8; ctx.beginPath(); ctx.arc(12 + (tx - 12) * uu, ground - 32 - Math.sin(uu * Math.PI) * 70, 1.5, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  else { bx = tx + 8 + f * 10; by = ground - 10; }
  ink.circle(bx, by, 8, 222, INK, 2, 1); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx - 3, by - 2, 1.2, 0, 7); ctx.arc(bx + 3, by - 2, 1.2, 0, 7); ctx.fill(); ink.line(bx - 5, by - 6, bx - 2, by - 4, 223, INK, 1.2, 1); ink.line(bx + 5, by - 6, bx + 2, by - 4, 224, INK, 1.2, 1);
  if (fallen && f >= 1) ink.text('+100', tx + 10, ground - 62, { size: 16, color: RED, rot: -0.1, alpha: 1 - (t - 0.77) / 0.23 });
}
function previewFootball(w, h, hov) {
  const speed = hov ? 1.6 : 1, t = ((frame * speed) % 300) / 300;
  for (let y = 18; y < h; y += 28) ink.line(10, y, w - 10, y, 240 + y, INK, 1, 1);
  ink.line(10, 6, 10, h - 6, 241, INK, 2, 1); ink.line(w - 10, 6, w - 10, h - 6, 242, INK, 2, 1);
  const los = h - 52; ink.line(10, los, w - 10, los, 243, INK, 1.6, 1); ink.line(10, los - 40, w - 10, los - 40, 244, RED, 1.6, 1);
  const O = (x, y, id) => ink.circle(x, y, 7, id, INK, 2, 1), X = (x, y, id) => { ink.line(x - 5, y - 5, x + 5, y + 5, id, PEN_DK, 2, 1); ink.line(x + 5, y - 5, x - 5, y + 5, id + 1, PEN_DK, 2, 1); };
  [[w / 2 - 22, los + 8], [w / 2, los + 8], [w / 2 + 22, los + 8], [w / 2, los + 28], [w / 2, los + 46]].forEach(([x, y], k) => O(x, y, 250 + k));
  [[w / 2 - 22, los - 12], [w / 2, los - 12], [w / 2 + 22, los - 12], [w / 2 + 30, los - 40]].forEach(([x, y], k) => X(x, y, 260 + k * 2));
  const rx = w - 44, ry = los + 8, route = [{ x: rx, y: ry }, { x: rx, y: ry - 56 }, { x: rx - 70, y: ry - 100 }], draw = Math.min(1, t / 0.3);
  ink.line(route[0].x, route[0].y - 8, route[1].x, route[1].y, 270, INK, 2, 1, draw * 2); ink.line(route[1].x, route[1].y, route[2].x, route[2].y, 271, INK, 2, 1, draw * 2 - 1);
  if (draw >= 1) { ink.line(route[2].x, route[2].y, route[2].x + 9, route[2].y - 2, 272, INK, 2, 1); ink.line(route[2].x, route[2].y, route[2].x + 4, route[2].y + 9, 273, INK, 2, 1); }
  let px = rx, py = ry, cx = rx, cy = ry - 26;
  if (t > 0.38) { const u = Math.min(1, (t - 0.38) / 0.45), seg = u < 0.5 ? 0 : 1, lu = seg ? (u - 0.5) * 2 : u * 2, a = route[seg], b = route[seg + 1]; px = a.x + (b.x - a.x) * lu; py = a.y + (b.y - a.y) * lu; cx = px + 4 + (1 - u) * 6; cy = py - 22 + u * 12; }
  O(px, py, 280); X(cx, cy, 282);
  if (t > 0.55 && t < 0.83) { const u = (t - 0.55) / 0.28, qx = w / 2, qy = los + 28, bx = qx + (px - qx) * u, by = qy + (py - qy) * u - Math.sin(u * Math.PI) * 30; ctx.fillStyle = BROWN; ctx.beginPath(); ctx.ellipse(bx, by, 5, 3, 0.5, 0, 7); ctx.fill(); }
  if (t > 0.86) ink.text('catch!', px - 20, py - 16, { size: 15, color: INK, font: 'Patrick Hand', weight: 400, rot: -0.1 });
}
function previewBaseball(w, h, hov) {
  const speed = hov ? 1.6 : 1, t = ((frame * speed) % 280) / 280, hx = w / 2, hy = h - 22, d = 44;
  ink.poly([{ x: hx, y: hy }, { x: hx + d, y: hy - d }, { x: hx, y: hy - 2 * d }, { x: hx - d, y: hy - d }], 300, INK, 1.6, 1);
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.8; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx, hy, d * 2.5, -2.36, -0.78); ctx.stroke(); ctx.globalAlpha = 1;
  ink.circle(hx, hy - d - 8, 5, 301, BROWN, 1.3, 1);
  let bx = hx, by = hy - d - 8; const swing = t > 0.42 && t < 0.52;
  if (t < 0.42) { const u = t / 0.42; by = hy - d - 8 + (hy - 6 - (hy - d - 8)) * Math.pow(u, 1.3); }
  else if (t < 0.85) { const u = (t - 0.42) / 0.43; bx = hx + u * 70; by = hy - 6 - u * (2.3 * d) - Math.sin(u * Math.PI) * 40; ctx.fillStyle = INK; ctx.globalAlpha = 0.3; for (let k = 0; k < 8; k++) { const uu = u * k / 8; ctx.beginPath(); ctx.arc(hx + uu * 70, hy - 6 - uu * (2.3 * d) - Math.sin(uu * Math.PI) * 40, 1.4, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  else bx = -50;
  const ang = swing ? -2.4 + ((t - 0.42) / 0.1) * 2.6 : (t >= 0.52 ? 0.3 : -2.4);
  ink.circle(hx - 18, hy + 2, 6, 302, INK, 2, 1); ink.line(hx - 12, hy - 2, hx - 12 + Math.cos(ang) * 26, hy - 2 + Math.sin(ang) * 26, 303, INK, 3, 1);
  if (bx > -20) { ctx.fillStyle = '#fbf8ee'; ctx.strokeStyle = PEN_DK; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.fill(); ctx.stroke(); }
  if (t > 0.5 && t < 0.62) ink.text('CRACK!', hx + 30, hy - 40, { size: 18, color: RED, rot: -0.15 });
  if (t >= 0.86) ink.text('HOME RUN!', hx, 34, { size: 22, color: INK, rot: -0.06, alpha: 1 - (t - 0.86) / 0.14 });
}
function previewPaperFootball(w, h, hov) {
  const speed = hov ? 1.6 : 1, t = ((frame * speed) % 240) / 240, edge = w - 40;
  ink.line(14, 16, edge, 16, 320, INK, 2.4, 1); ink.line(14, h - 16, edge, h - 16, 321, INK, 2.4, 1); ink.line(edge, 16, edge, h - 16, 322, INK, 3, 1);
  for (let x = 40; x < edge; x += 34) ink.line(x, 20, x, h - 20, 323 + x, INK, 0.8, 1);
  ink.line(edge, h / 2 - 22, edge, h / 2 + 22, 330, PEN_DK, 2, 1); ink.line(edge, h / 2 - 22, edge + 26, h / 2 - 26, 331, PEN_DK, 2, 1); ink.line(edge, h / 2 + 22, edge + 26, h / 2 + 26, 332, PEN_DK, 2, 1);
  const u = Math.min(1, t / 0.6), ease = 1 - Math.pow(1 - u, 2.2), x = 40 + (edge - 40 - 6) * ease, y = h / 2 + Math.sin(u * 4) * 6;
  ctx.save(); ctx.translate(x, y); ctx.rotate(u * 6); ctx.fillStyle = '#fbf8ee'; ctx.beginPath(); ctx.moveTo(-14, -9); ctx.lineTo(14, 0); ctx.lineTo(-14, 9); ctx.closePath(); ctx.fill(); ink.poly([{ x: -14, y: -9 }, { x: 14, y: 0 }, { x: -14, y: 9 }], 340, INK, 1.8, 1); ink.line(-12, 0, 10, 0, 341, PEN_MD, 1, 1); ctx.restore();
  ctx.fillStyle = INK; ctx.globalAlpha = 0.3; for (let k = 0; k < 10; k += 2) { const uu = u * k / 10, e2 = 1 - Math.pow(1 - uu, 2.2); ctx.beginPath(); ctx.arc(40 + (edge - 40 - 6) * e2, h / 2 + Math.sin(uu * 4) * 6, 1.4, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
  if (t > 0.66) ink.text('TOUCHDOWN!', w / 2 - 20, h / 2 - 32, { size: 22, color: INK, rot: -0.05, alpha: Math.min(1, (t - 0.66) / 0.1) * (t > 0.92 ? (1 - t) / 0.08 : 1) });
}

    function previewTennis(w,h) {
      const t=frame*.025, bx=170+Math.sin(t)*95, by=85+Math.cos(t)*58;
      ink.poly([{x:105,y:18},{x:235,y:18},{x:289,y:155},{x:51,y:155}],900,INK,2,2);
      ink.line(80,85,260,85,910,INK,2,2);
      for(let x=80;x<260;x+=10) ink.line(x,76,x,94,920+x,PEN_DK,.7,1);
      ink.line(90,115,250,115,913,INK,1,1);ink.line(117,47,222,47,914,INK,1,1);ink.line(170,47,170,115,915,INK,1,1);
      for(const [x,y,id] of [[170+Math.sin(t+.4)*65,157,940],[170+Math.sin(t-1)*40,25,960]]) {
        ink.circle(x,y-21,6,id,INK,1.8,2);ink.line(x,y-15,x,y,id+1,INK,2,2);ink.line(x,y,x-9,y+8,id+2,INK,2,2);ink.line(x,y,x+9,y+8,id+3,INK,2,2);ink.line(x,y-11,x+16,y-19,id+4,INK,2,2);ink.line(x+16,y-17,x+21,y-30,id+6,INK,2.5,2);ink.circle(x+24,y-38,9,id+5,INK,1.5,2);
      }
      ink.scribble(bx,by-12,5,990,RED,15,.7);ink.circle(bx,by-12,5,991,RED,1.4,1);
      ink.text('tok!',bx+22,by-20,{size:20,color:RED,rot:-.15});
    }
    function previewBridge(w,h) {
      const t=(frame%340)/340,road=90,sag=Math.sin(t*Math.PI)*5;
      for(const [a,b] of [[12,78],[265,328]]){ink.line(a,road,b,road,1100+a,INK,2.5,2);for(let x=a;x<b;x+=10)ink.line(x,road+3,x+5,150,1101+x,PEN_MD,.7,1);}
      const roadPts=[{x:78,y:road},{x:172,y:road+sag},{x:265,y:road}];ink.path(roadPts,1130,INK,3,2);
      ink.path([{x:68,y:145},roadPts[1],{x:277,y:145}],1150,PEN_DK,2,2);
      for(const p of [{x:78,y:road},{x:265,y:road},{x:68,y:145},{x:277,y:145}])ink.circle(p.x,p.y,4,1180+p.x,RED,1.5,2);
      const x=28+t*273,y=road+(x>78&&x<265?sag*Math.sin((x-78)/187*Math.PI):0);
      ctx.save();ctx.translate(x,y-10);const shape=[{x:-19,y:0},{x:-19,y:-19},{x:4,y:-19},{x:6,y:-27},{x:16,y:-25},{x:23,y:-11},{x:25,y:0}];ctx.fillStyle='#e7c84f';ctx.beginPath();shape.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ink.poly(shape,1200,INK,1.6,2);ink.circle(-12,4,6,1201,INK,2,1);ink.circle(17,4,6,1202,INK,2,1);ink.text('EGGS',-5,-6,{size:9,color:INK,font:'Patrick Hand',weight:400});ctx.restore();
      ink.text(t>.78?'IT HELD!':'probably fine.',175,42,{size:27,color:RED,rot:-.08});
    }
    function previewEraser(w, h, hov) {
      const speed = hov ? 1.6 : 1, t = ((frame * speed) % 240) / 240;
      const gy = x => h - 40 + Math.sin(x / 50) * 8 - Math.exp(-Math.pow((x - w / 2) / 40, 2)) * 22;
      const hit = t > 0.55, bite = hit ? Math.min(1, (t - 0.55) / 0.08) : 0, px = w - 58;
      // far hills, then the playable hills in pencil with a bite rubbed out after the hit
      ctx.strokeStyle = PEN_MD; ctx.globalAlpha = 0.4; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= w; x += 6) { const y = h - 78 - Math.abs(Math.sin(x / 60 + 1)) * 34; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.strokeStyle = PEN_DK; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.8; ctx.beginPath();
      for (let x = 4; x <= w - 4; x += 4) { let y = gy(x); const d = Math.abs(x - px); if (bite && d < 24) y += Math.sqrt(24 * 24 - d * d) * 0.8 * bite; x === 4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      ctx.globalAlpha = 0.18; for (let x = 8; x < w; x += 7) { ctx.beginPath(); ctx.moveTo(x, gy(x) + 3); ctx.lineTo(x + 4, gy(x) + 12); ctx.stroke(); } ctx.globalAlpha = 1;
      // the kid (ink) at left, winding up then throwing
      const kx = 48, ky = gy(48);
      ink.circle(kx, ky - 30, 8, 400, INK, 1.8, 1); ink.line(kx, ky - 22, kx, ky - 8, 401, INK, 2, 1); ink.line(kx, ky - 8, kx - 6, ky, 402, INK, 2, 1); ink.line(kx, ky - 8, kx + 6, ky, 403, INK, 2, 1); ink.line(kx - 8, ky - 34, kx + 8, ky - 34, 404, RED, 1.6, 1);
      const armA = t < 0.12 ? -2.4 + t / 0.12 * 1.6 : -0.8; ink.line(kx, ky - 18, kx + Math.cos(armA) * 14, ky - 18 + Math.sin(armA) * 14, 405, INK, 2, 1);
      // the pencil at right, sinking into the crater when hit
      const py = gy(px) + (hit ? 12 * bite : 0);
      ctx.fillStyle = '#fbf8ee'; ctx.fillRect(px - 5, py - 34, 10, 26); ink.poly([{ x: px - 5, y: py - 8 }, { x: px - 5, y: py - 34 }, { x: px + 5, y: py - 34 }, { x: px + 5, y: py - 8 }], 410, PEN_DK, 1.6, 1); ink.poly([{ x: px - 5, y: py - 34 }, { x: px, y: py - 44 }, { x: px + 5, y: py - 34 }], 411, PEN_DK, 1.4, 1); ctx.fillStyle = '#efb7c3'; ctx.fillRect(px - 5, py - 8, 10, 6); ink.line(px - 4, py - 2, px - 8, py + 2, 412, PEN_DK, 1.4, 1); ink.line(px + 4, py - 2, px + 8, py + 2, 413, PEN_DK, 1.4, 1);
      ctx.fillStyle = PEN_DK; ctx.beginPath(); ctx.arc(px - 2, py - 24, 1, 0, 7); ctx.arc(px + 2, py - 24, 1, 0, 7); ctx.fill(); if (hit) ink.circle(px, py - 18, 2, 414, PEN_DK, 1, 1); else ink.line(px - 3, py - 18, px + 3, py - 19, 415, PEN_DK, 1, 1);
      // the eraser in flight, with a dotted arc behind it
      if (t >= 0.12 && t < 0.55) { const u = (t - 0.12) / 0.43; const ex = kx + 14 + (px - kx - 14) * u, ey = ky - 30 - Math.sin(u * Math.PI) * 60; ctx.fillStyle = INK; ctx.globalAlpha = 0.3; for (let k = 0; k < 8; k++) { const uu = u * k / 8; ctx.beginPath(); ctx.arc(kx + 14 + (px - kx - 14) * uu, ky - 30 - Math.sin(uu * Math.PI) * 60, 1.3, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; ctx.save(); ctx.translate(ex, ey); ctx.rotate(u * 6); ctx.fillStyle = '#efb7c3'; ctx.fillRect(-7, -4, 14, 8); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(-7, -4, 14, 8); ctx.restore(); }
      if (hit) { const a = Math.min(1, (t - 0.55) / 0.08) * (t > 0.9 ? (1 - t) / 0.1 : 1); ink.text('WHAM!', px - 30, py - 60, { size: 22, color: RED, rot: -0.12, alpha: a }); ctx.fillStyle = '#efb7c3'; ctx.globalAlpha = a * 0.9; for (let k = 0; k < 8; k++) { const ang = k / 8 * 6.28; ctx.fillRect(px + Math.cos(ang) * (10 + bite * 22) - 2, py - 10 + Math.sin(ang) * (6 + bite * 12), 4, 2); } ctx.globalAlpha = 1; }
      // a windsock on the middle hill
      ink.line(w / 2, gy(w / 2), w / 2, gy(w / 2) - 26, 420, PEN_DK, 1.2, 1); ink.poly([{ x: w / 2, y: gy(w / 2) - 26 }, { x: w / 2 + 16, y: gy(w / 2) - 20 + Math.sin(frame * 0.2) }, { x: w / 2, y: gy(w / 2) - 18 }], 421, RED, 1.2, 1);
    }
    const previews = {eraser:previewEraser,bridge:previewBridge,tennis:previewTennis,slingshot:previewSlingshot, football:previewFootball, baseball:previewBaseball, paperFootball:previewPaperFootball};
    return elapsed => {
      frame = elapsed * .06;
      ink.tick();
      ctx.clearRect(0, 0, 500, 250);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(250, 126, 232, 104, 0, 0, Math.PI * 2); ctx.clip();
      ctx.translate(27, 25);
      ctx.scale(446 / 340, 202 / 170);
      previews[kind](340, 170, false);
      ctx.restore();
      for (let pass = 0; pass < 2; pass++) {
        const points = Array.from({length:38}, (_, i) => {
          const a = i / 37 * Math.PI * 2;
          const wiggle = 1 + Math.sin(a * 5 + pass) * .018;
          return {x:250 + Math.cos(a) * (235 + pass * 3) * wiggle, y:126 + Math.sin(a) * (105 + pass) * wiggle};
        });
        ink.path(points, 850 + pass * 100, INK, pass ? .8 : 1.8, 1);
      }
    };
  }

  function update(state) {
    const wanted = (state.hovered || state.pinned) && !state.suppressed;
    if (wanted !== state.active) { state.elapsed = 0; state.active = wanted; }
    state.card.classList.toggle('previewing', wanted);
    state.button.setAttribute('aria-pressed', String(wanted));
    state.button.setAttribute('aria-label', `${wanted ? 'Stop preview of' : 'Preview'} ${state.title}`);
    state.button.textContent = wanted ? 'back to sketch ×' : 'watch it play ↻';
    if (wanted) state.draw(motionOff() ? 1300 : state.elapsed);
    wake();
  }

  document.querySelectorAll('.game-card[data-preview]').forEach(card => {
    const canvas = document.createElement('canvas');
    canvas.className = 'doodle-preview'; canvas.setAttribute('aria-hidden', 'true');
    card.querySelector('.game-art').append(canvas);
    const button = card.querySelector('.preview-toggle');
    const state = {card, button, title:card.querySelector('h3').textContent, draw:createPreview(canvas, card.dataset.preview), hovered:false, pinned:false, suppressed:false, active:false, visible:false, elapsed:0};
    if (['tennis','bridge'].includes(card.dataset.preview)) {
      const still = document.createElement('canvas'); still.width=1000; still.height=500;
      still.className='tennis-still'; still.setAttribute('aria-hidden','true');
      createPreview(still, card.dataset.preview)(1800); card.querySelector('.game-art').prepend(still);
    }
    states.push(state);
    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = button.getBoundingClientRect();
      // A direct click on the preview control must start it, not toggle a just-started hover off.
      const overButton = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!overButton) { state.hovered = true; update(state); }
    });
    card.addEventListener('pointerleave', () => { state.hovered = false; state.suppressed = false; update(state); });
    button.addEventListener('click', () => {
      if (state.active) { state.pinned = false; state.suppressed = true; }
      else { state.pinned = true; state.suppressed = false; }
      update(state);
    });
    update(state);
  });

  function createMargin(canvas, kind) {
    const ctx = canvas.getContext('2d'); ctx.setTransform(2, 0, 0, 2, 0, 0);
    const ink = NotebookInk(ctx), {INK, RED, GRAPHITE} = ink;
    return time => {
      ink.tick(); ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
      if (kind === 'header') {
        // A faint coffee ring and a small sun that occasionally blinks.
        for (let k = 0; k < 3; k++) {
          ctx.strokeStyle = `rgba(117,84,40,${.06 + k * .025})`; ctx.lineWidth = 3 - k * .6; ctx.beginPath();
          for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, r = 28 + Math.sin(a * 3 + k) * 1.4; const x = 47 + Math.cos(a) * r, y = 45 + Math.sin(a) * r * .84; i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); } ctx.stroke();
        }
        ink.circle(125, 35, 13, 10, INK, 1.1, 1);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.sin(time / 3500) * .08; ink.line(125 + Math.cos(a)*18,35 + Math.sin(a)*18,125 + Math.cos(a)*24,35 + Math.sin(a)*24,20+i,INK,1,1); }
        const blink = time % 7200 > 6700;
        ink.line(120,33,122,blink?33:35,40,INK,1.2,1); ink.line(129,33,131,blink?33:35,41,INK,1.2,1);
        ink.path([{x:121,y:39},{x:125,y:42},{x:130,y:38}],42,INK,1,1);
      } else {
        const excited = states.some(s => s.active && s.visible);
        ink.poly([{x:9,y:21},{x:92,y:19},{x:92,y:59},{x:10,y:61}],50,GRAPHITE,1.2,1);
        ink.text(excited ? 'THAT ONE!' : 'PICK ONE',50,45,{size:18,color:RED,rot:-.05});
        ink.line(79,60,78,108,60,GRAPHITE,1.3,1);
        ink.circle(38,95,11,62,GRAPHITE,1.2,2);
        ink.circle(34,93,.7,64,GRAPHITE,1,1); ink.circle(42,93,.7,65,GRAPHITE,1,1);
        ink.path([{x:34,y:100},{x:38,y:102},{x:43,y:98}],67,GRAPHITE,1,1);
        ink.line(38,107,39,138,70,GRAPHITE,1.3,1);
        ink.path([{x:39,y:117},{x:61,y:123},{x:78,y:107}],72,GRAPHITE,1.3,1);
        const waving = excited || time % 9500 < 1200;
        ink.path([{x:39,y:119},{x:22,y:110},{x:15,y:waving?94+Math.sin(time/170)*5:121}],78,GRAPHITE,1.3,1);
        ink.path([{x:39,y:138},{x:24,y:158},{x:16,y:158}],84,GRAPHITE,1.3,1);
        ink.path([{x:39,y:138},{x:49,y:158},{x:58,y:159}],88,GRAPHITE,1.3,1);
      }
    };
  }
  for (const [selector,kind] of [['.header-doodle','header'],['.margin-fan','fan']]) {
    const element = document.querySelector(selector);
    if (element) ambient.push({element, visible:false, draw:createMargin(element,kind)});
  }

  function shouldRun() { return !document.hidden && !motionOff() && (states.some(s => s.active && s.visible) || ambient.some(s => s.visible)); }
  function wake() { if (!raf && shouldRun()) { lastFrame = 0; raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    if (!shouldRun()) return;
    if (!lastFrame || now - lastFrame >= 1000 / 12) {
      const delta = lastFrame ? Math.min(now - lastFrame, 120) : 1000 / 12;
      lastFrame = now; clock += delta;
      states.forEach(s => { if (s.active && s.visible) { s.elapsed += delta; s.draw(s.elapsed); } });
      ambient.forEach(s => { if (s.visible) s.draw(clock); });
    }
    raf = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const item = states.find(s => s.card === entry.target) || ambient.find(s => s.element === entry.target);
      if (item) item.visible = entry.isIntersecting;
    });
    wake();
  }, {threshold:.05});
  states.forEach(s => observer.observe(s.card)); ambient.forEach(s => observer.observe(s.element));
  const paintStill = () => {
    ambient.forEach(s => s.draw(1800));
    states.forEach(s => { if (s.active) s.draw(motionOff()?1300:s.elapsed); });
  };
  paintStill(); document.fonts.ready.then(paintStill);
  document.addEventListener('notebook:motion', () => { paintStill(); wake(); });
  document.addEventListener('visibilitychange', wake);
})();
