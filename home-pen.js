(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'home-ink';
  canvas.setAttribute('aria-hidden', 'true');
  const toolbar = document.createElement('div');
  toolbar.id = 'pen-tools';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Doodle on this page');
  toolbar.innerHTML = '<button type="button" id="pen-toggle" aria-pressed="false">grab a pen ↗</button><span id="pen-options" hidden><button type="button" id="pen-undo" disabled>undo</button><button type="button" id="pen-clear" disabled>erase all</button></span><span id="pen-tip">make a mess.</span>';
  document.body.append(canvas, toolbar);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); toolbar.remove(); return; }
  const toggle = toolbar.querySelector('#pen-toggle');
  const options = toolbar.querySelector('#pen-options');
  const undo = toolbar.querySelector('#pen-undo');
  const clear = toolbar.querySelector('#pen-clear');
  const tip = toolbar.querySelector('#pen-tip');
  const strokes = [];
  let enabled = false, active = null, pointer = null, scheduled = false;
  function point(e) { return { x: e.pageX / document.documentElement.clientWidth, y: e.pageY, width: e.pointerType === 'pen' ? 1.2 + e.pressure * 2.4 : 2.2 }; }
  function paint() {
    scheduled = false;
    const width = document.documentElement.clientWidth;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.strokeStyle = ctx.fillStyle = '#2145a0';
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      const first = stroke[0];
      ctx.beginPath(); ctx.arc(first.x * width - scrollX, first.y - scrollY, first.width / 2, 0, Math.PI * 2); ctx.fill();
      for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1], b = stroke[i];
        if (Math.max(a.y, b.y) < scrollY || Math.min(a.y, b.y) > scrollY + innerHeight) continue;
        ctx.lineWidth = (a.width + b.width) / 2;
        ctx.beginPath(); ctx.moveTo(a.x * width - scrollX, a.y - scrollY); ctx.lineTo(b.x * width - scrollX, b.y - scrollY); ctx.stroke();
      }
    }
  }
  function redraw() { if (!scheduled) { scheduled = true; requestAnimationFrame(paint); } }
  function resize() {
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * scale); canvas.height = Math.round(innerHeight * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0); redraw();
  }
  function controls() { undo.disabled = clear.disabled = !strokes.length; }
  function finish() {
    if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
    active = null; pointer = null; controls();
  }
  function setEnabled(value) {
    finish(); enabled = value;
    canvas.classList.toggle('drawing', enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'put pen down ✓' : 'grab a pen ↗';
    options.hidden = !enabled;
    tip.textContent = enabled ? 'scribble anywhere · Esc to finish' : 'make a mess.';
  }
  toggle.addEventListener('click', () => setEnabled(!enabled));
  undo.addEventListener('click', () => { finish(); strokes.pop(); controls(); redraw(); });
  clear.addEventListener('click', () => { finish(); strokes.length = 0; controls(); redraw(); });
  canvas.addEventListener('pointerdown', e => {
    if (!enabled || pointer !== null || e.button !== 0 || !e.isPrimary) return;
    e.preventDefault(); pointer = e.pointerId; active = [point(e)]; strokes.push(active);
    canvas.setPointerCapture(pointer); controls(); redraw();
  });
  canvas.addEventListener('pointermove', e => {
    if (!active || e.pointerId !== pointer) return;
    e.preventDefault();
    const samples = e.getCoalescedEvents?.() || [];
    for (const sample of samples.length ? samples : [e]) active.push(point(sample));
    redraw();
  });
  canvas.addEventListener('pointerup', e => { if (e.pointerId === pointer) { active.push(point(e)); finish(); redraw(); } });
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);
  window.addEventListener('blur', finish);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && enabled) { setEnabled(false); toggle.focus(); } });
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', redraw, { passive: true });
  resize();
})();
