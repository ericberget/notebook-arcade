// Notebook Arcade — shared paper styles. Usage: NotebookPaper.draw(ctx2d, width, height, 'ruled')
const NotebookPaper = (() => {
  let W = 1200, H = 720;
  function grain(p, n, col, a) { for (let i = 0; i < n; i++) { p.fillStyle = `rgba(${col},${Math.random() * a})`; p.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); } }
  function holes(p, xs = 48, ys = [140, 360, 580]) { for (const y of ys) { p.fillStyle = '#e9e4d6'; p.beginPath(); p.arc(xs, y, 14, 0, Math.PI * 2); p.fill(); p.strokeStyle = 'rgba(0,0,0,.12)'; p.lineWidth = 2; p.stroke(); } }
  function rules(p, color, gap = 32, y0 = 96, w = 1.2) { p.strokeStyle = color; p.lineWidth = w; for (let y = y0; y < H; y += gap) { p.beginPath(); p.moveTo(0, y + 0.5); p.lineTo(W, y + 0.5); p.stroke(); } }
  function margin(p, x, color, w = 1.5) { p.strokeStyle = color; p.lineWidth = w; p.beginPath(); p.moveTo(x + 0.5, 0); p.lineTo(x + 0.5, H); p.stroke(); }
  function coffeeRing(p, x, y, r) {
    for (let k = 0; k < 3; k++) {
      p.strokeStyle = `rgba(120,80,30,${0.10 + k * 0.05})`; p.lineWidth = 6 - k * 1.5; p.beginPath();
      for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 2; const rr = r + Math.sin(t * 3 + k) * 3 + (Math.random() - 0.5) * 2; const px = x + Math.cos(t) * rr, py = y + Math.sin(t) * rr * 0.92; i ? p.lineTo(px, py) : p.moveTo(px, py); }
      p.stroke();
    }
    const g = p.createRadialGradient(x, y, r * 0.5, x, y, r); g.addColorStop(0, 'rgba(120,80,30,0)'); g.addColorStop(1, 'rgba(120,80,30,.08)');
    p.fillStyle = g; p.beginPath(); p.ellipse(x, y, r, r * 0.92, 0, 0, 7); p.fill();
  }
  const STYLE_LIST = [
    function ruled(p) { // classic wide-ruled notebook
      p.fillStyle = '#fbf8ee'; p.fillRect(0, 0, W, H); grain(p, 6000, '120,100,60', 0.05);
      rules(p, 'rgba(120,160,220,.55)'); margin(p, 110, 'rgba(220,90,90,.6)'); holes(p);
    },
    function graph(p) { // quad-ruled graph paper
      p.fillStyle = '#f6f8f2'; p.fillRect(0, 0, W, H); grain(p, 5000, '80,110,90', 0.05);
      p.strokeStyle = 'rgba(110,170,150,.35)'; p.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { p.beginPath(); p.moveTo(x + 0.5, 0); p.lineTo(x + 0.5, H); p.stroke(); }
      for (let y = 0; y < H; y += 24) { p.beginPath(); p.moveTo(0, y + 0.5); p.lineTo(W, y + 0.5); p.stroke(); }
      p.strokeStyle = 'rgba(110,170,150,.55)'; p.lineWidth = 1.2;
      for (let x = 0; x < W; x += 120) { p.beginPath(); p.moveTo(x + 0.5, 0); p.lineTo(x + 0.5, H); p.stroke(); }
      for (let y = 0; y < H; y += 120) { p.beginPath(); p.moveTo(0, y + 0.5); p.lineTo(W, y + 0.5); p.stroke(); }
      holes(p);
    },
    function legal(p) { // yellow legal pad
      p.fillStyle = '#f7e9a6'; p.fillRect(0, 0, W, H); grain(p, 7000, '150,110,30', 0.08);
      rules(p, 'rgba(70,110,200,.45)', 30, 90); margin(p, 118, 'rgba(220,60,60,.55)'); margin(p, 126, 'rgba(220,60,60,.55)');
      // glued top edge with tear-off perforation
      p.fillStyle = 'rgba(120,90,40,.25)'; p.fillRect(0, 0, W, 10);
      p.strokeStyle = 'rgba(120,90,40,.6)'; p.setLineDash([4, 6]); p.beginPath(); p.moveTo(0, 22.5); p.lineTo(W, 22.5); p.stroke(); p.setLineDash([]);
    },
    function dots(p) { // dot-grid bullet journal
      p.fillStyle = '#fdfbf4'; p.fillRect(0, 0, W, H); grain(p, 5000, '120,100,60', 0.05);
      p.fillStyle = 'rgba(90,90,110,.45)';
      for (let x = 30; x < W; x += 30) for (let y = 30; y < H; y += 30) { p.beginPath(); p.arc(x, y, 1.3, 0, 7); p.fill(); }
      // spiral binding down the left edge
      for (let y = 40; y < H; y += 44) {
        p.fillStyle = '#e9e4d6'; p.beginPath(); p.roundRect(30, y, 26, 14, 7); p.fill();
        p.strokeStyle = 'rgba(0,0,0,.18)'; p.lineWidth = 1.5; p.stroke();
        p.strokeStyle = 'rgba(70,70,80,.7)'; p.lineWidth = 3; p.beginPath(); p.moveTo(10, y - 6); p.quadraticCurveTo(38, y - 14, 44, y + 6); p.stroke();
      }
    },
    function sketchbook(p) { // plain cream sketchbook with a coffee ring and test scribbles
      p.fillStyle = '#f4efe2'; p.fillRect(0, 0, W, H); grain(p, 9000, '120,100,60', 0.07);
      coffeeRing(p, 1010, 668, 70); coffeeRing(p, 330, 620, 40);   // Keep the sky clear for Eraser War.
      p.strokeStyle = 'rgba(31,61,158,.35)'; p.lineWidth = 2; p.beginPath();
      for (let i = 0; i < 40; i++) { const x = 1000 + i * 4, y = 520 + Math.sin(i * 1.3) * 10 + (Math.random() - .5) * 4; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.stroke();
      p.strokeStyle = 'rgba(74,74,79,.35)'; p.beginPath(); for (let i = 0; i < 30; i++) { p.moveTo(1000 + i * 5, 545 + (Math.random() - .5) * 10); p.lineTo(1006 + i * 5, 560 + (Math.random() - .5) * 10); } p.stroke();
      // slight shadow of the sheet below at right edge
      const g = p.createLinearGradient(W - 40, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.08)'); p.fillStyle = g; p.fillRect(W - 40, 0, 40, H);
    },
    function torn(p) { // old ruled scrap torn out of a notebook, folded corner
      p.fillStyle = '#efe7cf'; p.fillRect(0, 0, W, H); grain(p, 9000, '110,80,30', 0.1);
      rules(p, 'rgba(90,130,190,.4)', 28, 80, 1); margin(p, 100, 'rgba(200,80,80,.45)');
      // torn left edge
      p.fillStyle = '#e9e4d6'; p.beginPath(); p.moveTo(0, 0);
      for (let y = 0; y <= H; y += 12) p.lineTo(18 + Math.random() * 22 + Math.sin(y * 0.05) * 6, y);
      p.lineTo(0, H); p.closePath(); p.fill();
      p.strokeStyle = 'rgba(0,0,0,.15)'; p.lineWidth = 1; p.stroke();
      // folded (dog-eared) top-right corner
      p.fillStyle = '#e9e4d6'; p.beginPath(); p.moveTo(W - 90, 0); p.lineTo(W, 0); p.lineTo(W, 90); p.closePath(); p.fill();
      p.fillStyle = '#e6dcc0'; p.beginPath(); p.moveTo(W - 90, 0); p.lineTo(W - 90, 90); p.lineTo(W, 90); p.closePath(); p.fill();
      p.strokeStyle = 'rgba(0,0,0,.2)'; p.beginPath(); p.moveTo(W - 90, 0); p.lineTo(W - 90, 90); p.lineTo(W, 90); p.stroke();
      // yellowed blotch
      const g = p.createRadialGradient(600, 300, 50, 600, 300, 400); g.addColorStop(0, 'rgba(150,110,40,.12)'); g.addColorStop(1, 'rgba(150,110,40,0)'); p.fillStyle = g; p.fillRect(0, 0, W, H);
    },
    function scorched(p) { // singed at the edges
      p.fillStyle = '#f1e6c8'; p.fillRect(0, 0, W, H); grain(p, 9000, '110,70,20', 0.12);
      rules(p, 'rgba(120,120,160,.3)', 32, 96, 1); margin(p, 110, 'rgba(200,80,80,.35)');
      for (const [cx, cy, r] of [[0, 0, 340], [W, 0, 260], [W, H, 380], [0, H, 220], [W * 0.5, H, 160]]) {
        const g = p.createRadialGradient(cx, cy, r * 0.35, cx, cy, r); g.addColorStop(0, 'rgba(40,20,5,.85)'); g.addColorStop(0.5, 'rgba(90,50,15,.45)'); g.addColorStop(1, 'rgba(120,80,30,0)');
        p.fillStyle = g; p.fillRect(0, 0, W, H);
      }
      // ragged burnt holes
      for (const [hx, hy, hr] of [[70, 80, 40], [1150, 690, 55], [1180, 40, 30]]) {
        p.fillStyle = '#e9e4d6'; p.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.28, rr = hr + Math.random() * 12; i ? p.lineTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr) : p.moveTo(hx + rr, hy); } p.closePath(); p.fill();
        p.strokeStyle = 'rgba(30,15,5,.8)'; p.lineWidth = 4; p.stroke();
      }
      for (let i = 0; i < 400; i++) { p.fillStyle = `rgba(30,20,10,${Math.random() * 0.5})`; p.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    },
    function soaked(p) { // rain-soaked, ink bleeding, wrinkled
      p.fillStyle = '#e8ebe6'; p.fillRect(0, 0, W, H); grain(p, 8000, '60,80,100', 0.1);
      p.strokeStyle = 'rgba(90,120,190,.35)'; p.lineWidth = 3; for (let y = 96; y < H; y += 32) { p.beginPath(); p.moveTo(0, y); p.lineTo(W, y + (Math.random() - .5) * 4); p.stroke(); }
      p.strokeStyle = 'rgba(190,80,90,.35)'; p.lineWidth = 4; p.beginPath(); p.moveTo(110, 0); p.lineTo(114, H); p.stroke();
      for (let i = 0; i < 7; i++) { const x = Math.random() * W, y = Math.random() * H, r = 60 + Math.random() * 160; const g = p.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(70,90,120,.02)'); g.addColorStop(0.9, 'rgba(70,90,120,.06)'); g.addColorStop(1, 'rgba(60,70,100,0)'); p.fillStyle = g; p.beginPath(); p.arc(x, y, r, 0, 7); p.fill();
        p.strokeStyle = 'rgba(60,70,100,.14)'; p.lineWidth = 1.5; p.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.283, rr = r * (0.92 + Math.sin(a * 5 + i) * 0.05 + Math.random() * 0.05); k ? p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8) : p.moveTo(x + rr, y); } p.stroke(); }
      // wrinkles
      p.lineWidth = 1; for (let i = 0; i < 26; i++) { const x0 = Math.random() * W, y0 = Math.random() * H; p.strokeStyle = i % 2 ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.08)'; p.beginPath(); p.moveTo(x0, y0); let x = x0, y = y0; for (let k = 0; k < 8; k++) { x += (Math.random() - .5) * 120; y += (Math.random() - .5) * 90; p.lineTo(x, y); } p.stroke(); }
      holes(p);
    },
    function crumpled(p) { // crumpled, flattened out, ready to be graded
      p.fillStyle = '#f9f7f0'; p.fillRect(0, 0, W, H); grain(p, 7000, '100,90,70', 0.07);
      rules(p, 'rgba(120,160,220,.5)'); margin(p, 110, 'rgba(220,90,90,.55)'); holes(p);
      // crease network: light + dark edge pairs
      const nodes = []; for (let i = 0; i < 18; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H });
      for (let i = 0; i < nodes.length; i++) for (let k = i + 1; k < nodes.length; k++) { const a = nodes[i], b = nodes[k]; if (Math.hypot(a.x - b.x, a.y - b.y) > 420 || Math.random() > 0.5) continue;
        p.strokeStyle = 'rgba(0,0,0,.09)'; p.lineWidth = 2; p.beginPath(); p.moveTo(a.x, a.y); p.lineTo(b.x, b.y); p.stroke();
        p.strokeStyle = 'rgba(255,255,255,.9)'; p.lineWidth = 1.2; p.beginPath(); p.moveTo(a.x + 1.5, a.y + 1.5); p.lineTo(b.x + 1.5, b.y + 1.5); p.stroke(); }
      // facets: faint triangular shading
      for (let i = 0; i < 30; i++) { const a = nodes[(Math.random() * nodes.length) | 0], b = nodes[(Math.random() * nodes.length) | 0], c = nodes[(Math.random() * nodes.length) | 0]; if (Math.hypot(a.x - b.x, a.y - b.y) > 300 || Math.hypot(a.x - c.x, a.y - c.y) > 300) continue; p.fillStyle = `rgba(${Math.random() > .5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.025})`; p.beginPath(); p.moveTo(a.x, a.y); p.lineTo(b.x, b.y); p.lineTo(c.x, c.y); p.fill(); }
    },
  ];

  STYLE_LIST.push(function plain(p) { // plain drawing paper: cream, a little tooth, no lines at all
    p.fillStyle = '#f6f1e4'; p.fillRect(0, 0, W, H); grain(p, 9000, '120,100,60', 0.07);
    for (let i = 0; i < 320; i++) { p.strokeStyle = `rgba(120,100,60,${Math.random() * 0.12})`; p.lineWidth = 1; p.beginPath(); const x = Math.random() * W, y = Math.random() * H; p.moveTo(x, y); p.lineTo(x + (Math.random() - .5) * 8, y + (Math.random() - .5) * 8); p.stroke(); }
    const g = p.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,70,40,.10)'); p.fillStyle = g; p.fillRect(0, 0, W, H);
  });
  // metal spiral binding down the left edge: punched slots with a wire coil looping out over the edge
  function spiral(p) {
    for (let y = 34; y < H - 10; y += 40) {
      // punched slot with a shadow inside
      p.fillStyle = '#e9e4d6'; p.beginPath(); p.roundRect(28, y - 6, 22, 12, 6); p.fill();
      p.fillStyle = 'rgba(0,0,0,.28)'; p.beginPath(); p.roundRect(30, y - 4, 18, 8, 4); p.fill();
      p.strokeStyle = 'rgba(0,0,0,.18)'; p.lineWidth = 1; p.beginPath(); p.roundRect(28, y - 6, 22, 12, 6); p.stroke();
      // the wire: dark body with a bright highlight, sweeping from inside the slot out past the page edge
      for (const [w, col, off] of [[5, '#6e6e74', 0], [4.2, '#9a9aa0', 0], [1.6, '#e8e8ec', -1]]) {
        p.strokeStyle = col; p.lineWidth = w; p.lineCap = 'round'; p.beginPath();
        p.moveTo(44, y + 1 + off); p.bezierCurveTo(30, y - 24 + off, -6, y - 22 + off, -2, y - 2 + off); p.stroke();
      }
      p.strokeStyle = 'rgba(0,0,0,.25)'; p.lineWidth = 2; p.beginPath(); p.moveTo(2, y + 2); p.lineTo(10, y + 6); p.stroke(); // wire shadow on the page
    }
    // slight edge shading where the paper curls at the binding
    const g = p.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, 'rgba(0,0,0,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); p.fillStyle = g; p.fillRect(0, 0, 60, H);
  }
  STYLE_LIST.push(function sketchpad(p) { STYLES.plain(p); spiral(p); });
  const STYLES = {}; STYLE_LIST.forEach(f => { STYLES[f.name] = f; });
  const DESCRIPTIONS = { ruled: 'wide-ruled notebook', graph: 'quad-ruled graph paper', legal: 'yellow legal pad', dots: 'dot-grid journal', sketchbook: 'coffee-stained sketchbook', torn: 'torn-out scrap', scorched: 'singed at the edges', soaked: 'rain-soaked & wrinkled', crumpled: 'crumpled & flattened', plain: 'plain drawing paper', sketchpad: 'spiral-bound sketchpad' };
  return {
    names: Object.keys(STYLES),
    describe: name => DESCRIPTIONS[name] || name,
    draw(p, w, h, name = 'ruled') { W = w; H = h; p.clearRect(0, 0, W, H); (STYLES[name] || STYLES.ruled)(p); },
  };
})();
