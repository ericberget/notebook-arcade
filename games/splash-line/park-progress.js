/* Shared, deterministic rules for drawing assistance, saves, and park milestones. */
(function (root) {
  'use strict';
  const families = ['kiddie', 'body', 'tube', 'loop', 'launch', 'drop', 'bunny', 'lazy', 'camel', 'switch', 'dloop', 'cliff', 'tour'];
  const services = ['snack', 'hottub', 'fountain', 'gift', 'river', 'wave', 'surf'];
  const entrances = [
    {id:'classic',name:'Notebook classic',need:0,price:0,paper:'#fff3b0',letter:'#bd4031',left:'#ef476f',right:'#118ab2',desc:'Striped posts and a little splash of color.'},
    {id:'seaside',name:'Seaside blue',need:3,price:25,paper:'#d9f0e7',letter:'#216578',left:'#48aaad',right:'#387da2',desc:'Sea-glass colors and cool blue lettering.'},
    {id:'boardwalk',name:'Warm boardwalk',need:5,price:45,paper:'#f5dfb5',letter:'#774727',left:'#98714c',right:'#98714c',wood:true,desc:'Timber posts and a warm, hand-painted sign.'},
    {id:'festival',name:'Summer festival',need:7,price:65,paper:'#ffe0c4',letter:'#ab3e57',left:'#ef7991',right:'#e9b943',desc:'Coral, sunshine, and a string of pennants.'},
  ];
  function entranceStatus(state,id) {
    const item=entrances.find(item=>item.id===id);if(!item)return null;
    const owned=id==='classic'||!!state.entranceStyles?.[id];
    const designs=new Set((state.rides||[]).map(r=>r.kit)).size;
    return {item,owned,designs,locked:!owned&&designs<item.need,shortfall:Math.max(0,item.price-(state.tickets||0)),current:(state.entranceStyle||'classic')===id};
  }
  function selectEntrance(state,id) {
    const status=entranceStatus(state,id);if(!status||status.locked||(!status.owned&&status.shortfall))return false;
    if(!status.owned){state.tickets-=status.item.price;state.entranceStyles={...state.entranceStyles,[id]:true};}
    state.entranceStyle=id;return true;
  }
  function drawPoint(pointer, origin, anchor, previous, launch, radius) {
    const p = { x: anchor.x + pointer.x - origin.x, y: anchor.y + pointer.y - origin.y };
    // Anchor to the slide, not the edge of a fingertip. Only the short entrance
    // is monotonic; hills, loops, and continuation strokes remain freehand.
    if (launch) {
      p.x = Math.max(previous.x, p.x);
      p.y = Math.max(previous.y, p.y);
      launch = p.x - anchor.x < radius && p.y - anchor.y < radius;
    }
    return { point: p, launch };
  }
  function facts(state) {
    const rides = state.rides || [], owned = state.owned || {};
    const distinct = new Set(rides.map(r => r.kit)).size;
    const mastered = Object.keys(state.mastered || {}).filter(k => families.includes(k)).length;
    const amenities = services.filter(k => owned[k]).length;
    const styled = rides.some(r => r.style && (r.style.paint || Object.values(r.style.x || {}).some(Boolean) || (r.style.tower && r.style.tower !== 'scaffold')));
    const tour = rides.some(r => r.kit === 'tour' && r.stars >= 2);
    const tasks = [
      { name: 'Grand opening', detail: 'Open your first slide and ride it yourself.', done: rides.length > 0 && !!state.firstRide },
      { name: 'Growing park', detail: 'Open 3 different slide designs and build 2 amenities.', done: distinct >= 3 && amenities >= 2 },
      { name: 'Destination park', detail: 'Open 5 different designs, master 3 designs, and style a ride.', done: distinct >= 5 && mastered >= 3 && styled },
      { name: 'Lou’s final inspection', detail: 'Open Grand Tour with at least 2 stars and complete 3 guest requests.', done: tour && (state.reqsDone || 0) >= 3 },
    ];
    return { distinct, mastered, amenities, styled, tour, tasks, ready: tasks.every(t => t.done) };
  }
  function normalize(input) {
    if (!input || typeof input !== 'object' || !Array.isArray(input.rides)) throw new Error('This is not a park save.');
    if (input.version > 2) throw new Error('This park needs a newer version of Splash Line.');
    const s = JSON.parse(JSON.stringify(input));
    const finite = n => typeof n === 'number' && Number.isFinite(n);
    const validStrokes = strokes => Array.isArray(strokes) && strokes.length <= 4000 && strokes.every(st => Array.isArray(st) && st.length <= 5000 && st.every(p => Array.isArray(p) && p.length === 2 && p.every(finite) && p[0] >= 100 && p[0] <= 1200 && p[1] >= 0 && p[1] <= 750));
    if (s.rides.length > 300) throw new Error('This park has too many rides.');
    const lots = new Set(), ids = new Set();
    for (const r of s.rides) {
      if (!families.includes(r.kit) || !Number.isInteger(r.lot) || r.lot < 0 || r.lot > 500 || lots.has(r.lot) || !finite(r.id) || ids.has(r.id) || !validStrokes(r.strokes) || !r.strokes.some(st => st.length > 1)) throw new Error('A ride in this save is incomplete.');
      if (!Array.isArray(r.traj) || r.traj.length < 2 || !r.traj.every(p => Array.isArray(p) && p.length >= 3 && p.slice(0, 3).every(finite))) throw new Error('A ride is missing its test run.');
      if (!r.stats || !['topMph', 'maxG', 'air', 'time', 'drop'].every(k => finite(r.stats[k]))) throw new Error('A ride is missing its inspection.');
      lots.add(r.lot); ids.add(r.id); r.name = String(r.name || 'My slide').slice(0, 26);
      r.stars = Math.max(1, Math.min(3, Math.floor(r.stars || 1))); r.riders = Math.max(0, Math.floor(r.riders || 0)); r.earned = Math.max(0, Math.floor(r.earned || 0));
    }
    s.version = 2; s.name = String(s.name || 'My Water Park').slice(0, 28);
    s.tickets = finite(s.tickets) ? Math.max(0, Math.floor(s.tickets)) : 5;
    s.owned = s.owned && typeof s.owned === 'object' && !Array.isArray(s.owned) ? s.owned : {};
    s.mastered = Object.fromEntries(Object.entries(s.mastered || {}).filter(([k,v]) => families.includes(k) && v));
    s.rides.filter(r => r.stars === 3 || r.trophy).forEach(r => { s.mastered[r.kit] = true; });
    // Keep legacy unlocks available while future milestones reward unique designs.
    s.trophies = Math.max(Number(s.trophies) || 0, Object.keys(s.mastered).length);
    s.unlocked = Math.max(Number(s.unlocked) || 0, s.rides.length);
    s.settings = { muted: !!s.settings?.muted, comfort: s.settings?.comfort !== false };
    s.entranceStyles=Object.fromEntries(entrances.filter(e=>e.id==='classic'||s.entranceStyles?.[e.id]===true).map(e=>[e.id,true]));
    s.entranceStyle=s.entranceStyles[s.entranceStyle]&&entrances.some(e=>e.id===s.entranceStyle)?s.entranceStyle:'classic';
    s.drafts = Object.fromEntries(Object.entries(s.drafts || {}).filter(([,d]) => d && families.includes(d.kit) && Number.isInteger(d.lot) && d.lot >= 0 && d.lot <= 500 && validStrokes(d.strokes)));
    s.reqsDone = Math.max(0, Math.floor(Number(s.reqsDone) || 0));
    s.riders = Math.max(0, Math.floor(Number(s.riders) || 0));
    if (s.request && ((s.request.kind === 'palms' && s.request.base + 2 > 10) || (s.request.kind === 'flowers' && s.request.base >= 12) || !['own','rides','palms','stars','flowers','design'].includes(s.request.kind))) s.request = null;
    return s;
  }
  function readSave(storage, key) {
    const errors = [];
    for (const suffix of ['', '-backup']) {
      try { const raw = storage.getItem(key + suffix); if (raw) return { park: normalize(JSON.parse(raw)), recovered: !!suffix, errors }; }
      catch (e) { errors.push(e.message); }
    }
    return { park: null, recovered: false, errors };
  }
  function writeSave(storage, key, park) {
    const next = JSON.stringify(park), previous = storage.getItem(key);
    // Never replace the good backup with a corrupt primary save.
    if (previous) { try { normalize(JSON.parse(previous)); storage.setItem(key + '-backup', previous); } catch (_) {} }
    storage.setItem(key, next);
    if (storage.getItem(key) !== next) throw new Error('Save could not be verified.');
    return next;
  }
  const api = { entrances, entranceStatus, selectEntrance, drawPoint, facts, normalize, readSave, writeSave, families, services };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SplashProgress = api;
})(typeof window === 'undefined' ? globalThis : window);
