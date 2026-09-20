// The plain HTML works on its own. Motion and filters enhance that foundation.
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const cards = [...document.querySelectorAll('.game-card')];
let motionOff = reducedMotion.matches;
try { motionOff ||= localStorage.getItem('notebook.motion') === 'off'; } catch {}
let currentCategory = 'all';
const motionButton = document.getElementById('motion-toggle');
function setMotion(off, persist = false) {
  motionOff = off;
  root.classList.toggle('motion-off', off);
  document.dispatchEvent(new CustomEvent('notebook:motion', {detail:{off}}));
  motionButton.textContent = `Motion: ${off ? 'off' : 'on'}`;
  motionButton.setAttribute('aria-pressed', String(off));
  motionButton.setAttribute('aria-label', off ? 'Turn on sketch animations' : 'Turn off sketch animations');
  if (off) document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  if (persist) { try { localStorage.setItem('notebook.motion', off ? 'off' : 'on'); } catch {} }
}
setMotion(motionOff);
motionButton.addEventListener('click', () => setMotion(!motionOff, true));
reducedMotion.addEventListener('change', event => setMotion(event.matches));

function filterGames(category) {
  if (!['all', 'action', 'sports'].includes(category)) throw new Error('Choose all, action, or sports.');
  currentCategory = category;
  const before = new Map(cards.filter(card => !card.hidden).map(card => [card, card.getBoundingClientRect()]));
  document.querySelectorAll('.filter').forEach(filter => {
    const active = filter.dataset.filter === category;
    filter.classList.toggle('active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  let count = 0;
  cards.forEach(card => {
    card.getAnimations().forEach(animation => animation.cancel());
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (card.hidden) return;
    count++;
    card.classList.add('in-view');
    if (motionOff || !card.animate) return;
    const previous = before.get(card), next = card.getBoundingClientRect();
    const dx = previous ? previous.left - next.left : 0;
    const dy = previous ? previous.top - next.top : 20;
    card.animate([
      { opacity: previous ? 1 : 0, transform: `translate(${dx}px,${dy}px) rotate(-1deg)` },
      { opacity: 1, transform: `translate(0,0) rotate(${card.style.getPropertyValue('--tilt')})` }
    ], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  document.getElementById('game-count').textContent = `${count} ${count === 1 ? 'game' : 'games'} · 100% doodled`;
  return { category, count };
}
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => filterGames(button.dataset.filter)));

// A broad back-and-forth mask reveals the original raster drawing like pencil strokes.
// The SVG is only a reveal mask; the illustrations themselves are original image assets.
const NS = 'http://www.w3.org/2000/svg';
let maskId = 0;
function sketchSurface({width, height, src, imageWidth = width, imageHeight = height, x = 0, y = 0, label}) {
  const svg = document.createElementNS(NS, 'svg');
  const id = `sketch-mask-${++maskId}`;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'sketch-surface');
  if (label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); }
  else svg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(NS, 'defs');
  const mask = document.createElementNS(NS, 'mask');
  mask.id = id; mask.setAttribute('maskUnits', 'userSpaceOnUse');
  mask.setAttribute('x', '0'); mask.setAttribute('y', '0');
  mask.setAttribute('width', width); mask.setAttribute('height', height);
  const path = document.createElementNS(NS, 'path');
  const step = height / 19;
  let d = `M -50 -30`;
  for (let row = 0; row <= 20; row++) {
    const end = row % 2 ? -50 : width + 50;
    d += ` L ${end} ${row * step}`;
  }
  path.setAttribute('d', d); path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'white'); path.setAttribute('stroke-width', step * 2.3);
  path.setAttribute('stroke-linecap', 'round'); path.setAttribute('pathLength', '1');
  path.setAttribute('class', 'sketch-mask-path');
  mask.append(path); defs.append(mask); svg.append(defs);
  const image = document.createElementNS(NS, 'image');
  image.setAttribute('href', src); image.setAttribute('x', x); image.setAttribute('y', y);
  image.setAttribute('width', imageWidth); image.setAttribute('height', imageHeight);
  image.setAttribute('mask', `url(#${id})`); svg.append(image);
  return svg;
}

const footerImage = document.querySelector('.footer-art');
function enhanceImage(img, className) {
  if (!img) return;
  const replace = () => {
    if (!img.naturalWidth) return;
    const svg = sketchSurface({width: img.naturalWidth, height: img.naturalHeight, src: img.getAttribute('src'), label: img.alt});
    svg.classList.add(...className.split(' '));
    img.replaceWith(svg);
  };
  if (img.complete) replace(); else img.addEventListener('load', replace, {once:true});
}
enhanceImage(footerImage, 'footer-art');
const sheet = new Image();
sheet.addEventListener('load', () => {
  cards.forEach(card => {
    const index = {slingshot:0, football:1, baseball:3}[card.dataset.preview];
    if (index === undefined) return; // Canvas-based games provide their own artwork.
    const area = card.querySelector('.game-art');
    const width = sheet.naturalWidth / 2, height = sheet.naturalHeight / 2;
    area.append(index === 1
      ? sketchSurface({width:1150,height:575,src:'games/xo-football/logo.webp',imageWidth:1536,imageHeight:1024,x:-195,y:-250})
      : sketchSurface({width, height, src: sheet.src, imageWidth: sheet.naturalWidth, imageHeight: sheet.naturalHeight, x: -(index % 2) * width, y: -Math.floor(index / 2) * height}));
    area.classList.add('has-sketch');
  });
}, {once:true});
sheet.src = 'assets/game-sheet.webp';

// Play each entrance once; a card never vanishes again when scrolling back up.
if ('IntersectionObserver' in window) {
  root.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, {threshold: .12, rootMargin:'0px 0px -20px 0px'});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
document.fonts.ready.then(() => requestAnimationFrame(() => root.classList.add('page-ready')));

// Keep the compact navigation out of the way after a destination is chosen.
const siteMenu = document.querySelector('.site-menu');
siteMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { siteMenu.open = false; }));
document.addEventListener('click', event => { if (!siteMenu.contains(event.target)) siteMenu.open = false; });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && siteMenu.open) { siteMenu.open = false; siteMenu.querySelector('summary').focus(); } });

// Expose the collection's existing filter to supported browser assistants.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name:'filter_notebook_games', title:'Filter Notebook Arcade games',
      description:'Show all, action, or sports games in the visible collection.',
      inputSchema:{type:'object',properties:{category:{type:'string',enum:['all','action','sports']}},required:['category'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).some(key => key !== 'category')) throw new Error('Provide only a category.');
        const result = filterGames(input.category);
        document.getElementById('games').scrollIntoView({behavior:motionOff ? 'instant' : 'smooth'});
        return result;
      }
    }, {signal:lifecycle.signal})).catch(() => {});
  } catch {}
  window.addEventListener('pagehide', event => { if (!event.persisted) lifecycle.abort(); });
}
