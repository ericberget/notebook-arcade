// Notebook Arcade — shared sketchy drawing helpers.
// const ink = NotebookInk(ctx); ink.line(...); ink.circle(...); call ink.tick() once per frame so lines "boil" gently.
function NotebookInk(ctx) {
  const INK = '#1f3d9e', RED = '#c0392b', GRAPHITE = '#4a4a4f';
  let wobble = 0, frame = 0, alphaMul = 1;   // alphaMul: global fade multiplier (used for sketch-in intros)
  const rnd = seed => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const jit = (id, k, amt) => (rnd(id * 31 + k * 7 + wobble) - 0.5) * amt;

  function line(x1, y1, x2, y2, id, color = INK, width = 2, passes = 2, prog = 1) {
    if (prog <= 0) return;
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let p = 0; p < passes; p++) {
      if (prog < 1 && p > 0) break;
      ctx.lineWidth = width * (0.8 + rnd(id + p) * 0.4); ctx.globalAlpha = 0.85 * alphaMul;
      const k = p * 100;
      const mx = (x1 + x2) / 2 + jit(id, k + 1, 3), my = (y1 + y2) / 2 + jit(id, k + 2, 3);
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const ov = p ? Math.max(0, jit(id, k + 9, 8)) : 0;
      ctx.beginPath();
      const ax = x1 + jit(id, k + 3, 2) - ux * ov * 0.4, ay = y1 + jit(id, k + 4, 2) - uy * ov * 0.4, bx = x2 + jit(id, k + 5, 2) + ux * ov, by = y2 + jit(id, k + 6, 2) + uy * ov;
      ctx.moveTo(ax, ay);
      if (prog >= 1) ctx.quadraticCurveTo(mx, my, bx, by);
      else for (let i = 1; i <= 8; i++) { const t = prog * i / 8, u = 1 - t; ctx.lineTo(u * u * ax + 2 * u * t * mx + t * t * bx, u * u * ay + 2 * u * t * my + t * t * by); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // a long hand-drawn stroke: subdivided, with slow waviness and small tremor, and a lighter second pass that drifts
  function longLine(x1, y1, x2, y2, id, color = INK, width = 2, passes = 2, amp = 1.6, prog = 1) {
    if (prog <= 0) return;
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux;
    const n = Math.max(3, Math.round(L / 28));
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let p = 0; p < passes; p++) {
      if (prog < 1 && p > 0) break;
      const f1 = 1.5 + rnd(id + p) * 2, f2 = 5 + rnd(id + p + 3) * 4, ph1 = rnd(id + p + 7) * 6.28, ph2 = rnd(id + p + 11) * 6.28;
      const drift = p ? (rnd(id + 17) - 0.5) * 2.5 : 0;
      ctx.globalAlpha = (p ? 0.45 : 0.9) * alphaMul; ctx.lineWidth = width * (p ? 0.7 : 1) * (0.85 + rnd(id + p + 5) * 0.3);
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const t = i / n, along = t * L; if (t > prog) break;
        const off = amp * (Math.sin(t * f1 * 6.28 + ph1) * 0.7 + Math.sin(t * f2 * 6.28 + ph2) * 0.3) + (rnd(id * 7 + i * 13 + p * 101) - 0.5) * amp * 0.5 + drift;
        const x = x1 + ux * along + nx * off, y = y1 + uy * along + ny * off;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function poly(verts, id, color = INK, width = 2, passes = 2) {
    for (let i = 0; i < verts.length; i++) { const a = verts[i], b = verts[(i + 1) % verts.length]; line(a.x, a.y, b.x, b.y, id + i * 13, color, width, passes); }
  }
  function path(pts, id, color = INK, width = 2, passes = 1) {
    for (let i = 0; i < pts.length - 1; i++) line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, id + i * 7, color, width, passes);
  }
  function circle(cx, cy, r, id, color = INK, width = 2, passes = 2, prog = 1) {
    if (prog <= 0) return;
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    for (let p = 0; p < passes; p++) {
      if (prog < 1 && p > 0) break;
      ctx.lineWidth = width * (0.8 + rnd(id + p) * 0.4); ctx.globalAlpha = 0.85 * alphaMul; ctx.beginPath();
      const start = rnd(id + p * 5) * Math.PI * 2, n = 24, stop = Math.round((n + 1) * prog);
      for (let i = 0; i <= stop; i++) { const t = start + (i / n) * Math.PI * 2, rr = r + jit(id, p * 50 + i, 3); const x = cx + Math.cos(t) * rr, y = cy + Math.sin(t) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function hatch(verts, id, color = INK, gap = 9, angle = Math.PI / 4, alpha = 0.55) {
    ctx.save(); ctx.beginPath(); verts.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.clip();
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    verts.forEach(v => { minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y); });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, R = Math.hypot(maxX - minX, maxY - minY) / 2 + 4;
    ctx.strokeStyle = color; ctx.lineWidth = 1.1; ctx.globalAlpha = alpha;
    const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx; let k = 0;
    for (let o = -R; o <= R; o += gap, k++) { const j = jit(id, k, 2); ctx.beginPath(); ctx.moveTo(cx + nx * o - dx * R + j, cy + ny * o - dy * R); ctx.lineTo(cx + nx * o + dx * R, cy + ny * o + dy * R + j); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // scribble fill: random back-and-forth strokes inside a circle
  function scribble(cx, cy, r, id, color = INK, n = 30, alpha = 0.4) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = rnd(id + i) * 6.28, rr = rnd(id + i + 50) * r, a2 = rnd(id + i + 100) * 6.28, rr2 = rnd(id + i + 150) * r; ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); ctx.lineTo(cx + Math.cos(a2) * rr2 + jit(id, i, 4), cy + Math.sin(a2) * rr2); }
    ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
  }
  function text(str, x, y, { size = 30, color = INK, font = 'Caveat', rot = 0, align = 'center', alpha = 1, weight = 700 } = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `${weight} ${size}px '${font}', cursive`; ctx.textAlign = align; ctx.fillStyle = color; ctx.globalAlpha = alpha * alphaMul;
    ctx.fillText(str, 0, 0); ctx.globalAlpha = alpha * alphaMul * 0.5; ctx.fillText(str, 1, 0.8); ctx.restore(); ctx.globalAlpha = 1;
  }
  // pencil: lighter, thinner, gray. depth 0 = far/faint, 1 = near/dark
  function pencil(x1, y1, x2, y2, id, depth = 1, passes = 2) { line(x1, y1, x2, y2, id, GRAPHITE, 0.8 + depth * 0.9, passes); ctx.globalAlpha = 1; }
  function pencilPath(pts, id, depth = 1, close = false) { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; pencil(a.x, a.y, b.x, b.y, id + i * 7, depth); } }
  function smudge(pts, id, strength = 0.08, angle = -0.6, gap = 4) {
    ctx.save(); ctx.beginPath(); pts.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.clip();
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    pts.forEach(v => { minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y); });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, R = Math.hypot(maxX - minX, maxY - minY) / 2 + 6;
    const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
    ctx.strokeStyle = '#6b6b70'; ctx.lineWidth = 5; ctx.globalAlpha = strength; let k = 0;
    for (let o = -R; o <= R; o += gap, k++) { ctx.beginPath(); ctx.moveTo(cx + nx * o - dx * R + jit(id, k, 3), cy + ny * o - dy * R); ctx.lineTo(cx + nx * o + dx * R, cy + ny * o + dy * R + jit(id, k + 1, 3)); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  return { INK, RED, GRAPHITE, rnd, jit, line, longLine, poly, path, circle, hatch, scribble, text, pencil, pencilPath, smudge,
    tick() { frame++; if (frame % 6 === 0) wobble++; }, get frame() { return frame; }, setAlpha(m) { alphaMul = m; } };
}
