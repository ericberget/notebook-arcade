const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const html = fs.readFileSync('games/xo-football/index.html','utf8');
const source = html.slice(html.indexOf('// ---------- sound ----------'),html.indexOf('// ---------- game state ----------'))+'\nglobalThis.audio = SFX;';
function boot(saved, supported = true) {
  const nodes=[], store={value:saved}, listeners={}; let starts=0, context;
  const param=()=>({value:0,setValueAtTime(v,t){assert(Number.isFinite(v)&&t>=0);this.value=v;},linearRampToValueAtTime(v,t){assert(Number.isFinite(v)&&t>=0);this.value=v;},exponentialRampToValueAtTime(v,t){assert(v>0&&t>=0);this.value=v;},setTargetAtTime(v,t,c){assert(Number.isFinite(v)&&t>=0&&c>0);this.value=v;}});
  class Audio {
    constructor(){context=this;this.currentTime=1;this.sampleRate=8000;this.state='suspended';this.destination={};}
    node(){const n={connect(){return arguments[0];},disconnect(){},gain:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),start(t=0){assert(t>=0);starts++;},stop(t){assert(t>=0);}};nodes.push(n);return n;}
    createGain(){return this.node();} createDynamicsCompressor(){return this.node();} createBufferSource(){return this.node();} createBiquadFilter(){return this.node();} createOscillator(){return this.node();}
    createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};} resume(){this.state='running';return Promise.resolve();}
  }
  const doc={hidden:false,addEventListener:(name,fn)=>listeners[name]=fn};
  const sandbox={window:supported?{AudioContext:Audio}:{},document:doc,localStorage:{getItem:()=>store.value,setItem:(k,v)=>store.value=v},setTimeout:()=>1,clearTimeout:()=>{},Math};
  vm.runInNewContext(source,sandbox);
  return {audio:sandbox.audio,nodes,store,doc,listeners,get starts(){return starts;},get context(){return context;}};
}
const b=boot(); const a=b.audio;
a.hut();assert.equal(b.starts,0,'no autoplay before gesture');a.resume();assert.equal(b.context.state,'running');assert.equal(b.starts,1,'only the silent pencil bed runs; no ambient crowd');
for(const name of ['hut','whistle','throw_','catch_','thump','incomplete','td','bad','good','kick','click','pencil','win'])a[name]();
assert(b.starts>40,'all event layers schedule');
a.toggleMute();const count=b.starts;a.td();a.thump();assert.equal(b.starts,count,'muted effects do not schedule');
assert.equal(b.nodes[0].gain.value,0);a.setVolume(.35);assert.equal(b.nodes[0].gain.value,0);a.toggleMute();assert.equal(b.nodes[0].gain.value,.35*.75);
b.doc.hidden=true;b.listeners.visibilitychange();assert.equal(b.nodes[0].gain.value,0,'background tab is silent');b.doc.hidden=false;b.listeners.visibilitychange();assert.equal(b.nodes[0].gain.value,.35*.75);
const restored=boot(b.store.value);assert.equal(restored.audio.volume,.35);assert.equal(restored.audio.muted,false);
assert.equal(boot('broken json').audio.volume,.65);assert.equal(boot('{"volume":9}').audio.volume,1);
const unsupported=boot(null,false);unsupported.audio.resume();unsupported.audio.hut();unsupported.audio.whistle();assert.equal(unsupported.starts,0,'game works without Web Audio');
console.log('PASS: audio scheduling, no autoplay, mute, volume persistence, hidden-tab silence, unsupported audio fallback');
