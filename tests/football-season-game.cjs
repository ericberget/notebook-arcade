const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const noop=()=>{},nodes=new Map(),timers=[],store=new Map();
const ctx=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
function node(){return {style:{},classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},dataset:{},children:[],appendChild(x){this.children.push(x)},addEventListener:noop,setAttribute:noop,remove:noop,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1200,height:720})};}
const doc={getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement:node,querySelectorAll:()=>[],addEventListener:noop};
const math=Object.create(Math);let seed=3;math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
const sandbox={document:doc,window:{innerWidth:1400,innerHeight:900,addEventListener:noop},Image:class{},URLSearchParams,location:{search:'?season=73&match=w0-0',replace:()=>{throw Error('Unexpected redirect')}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},NotebookPaper:{draw:noop},NotebookInk:()=>new Proxy({INK:'#123',RED:'#c00',GRAPHITE:'#333'},{get:(o,k)=>o[k]||noop}),Matter:require('../shared/matter.min.js'),requestAnimationFrame:noop,performance:{now:()=>1},setTimeout:f=>timers.push(f),clearTimeout:noop,Math:math};
vm.createContext(sandbox);const run=s=>vm.runInContext(s,sandbox);
run(fs.readFileSync('games/xo-football/league.js','utf8'));run('const XOLeague=window.XOLeague; const draftedSeason=XOLeague.create(0,73); XOLeague.simDraft(draftedSeason); XOLeague.save(draftedSeason);');run(fs.readFileSync('games/xo-football/match.js','utf8'));
const html=fs.readFileSync('games/xo-football/play.html','utf8');run([...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)][0][1]);
run('setMode(true)');assert.equal(run('teamName'),'CRUSHERS');assert.equal(run('opponentName'),'Bandits');assert.equal(run("byName('QB').profile.id"),run('draftedSeason.rosters[0][0].id'));assert(run("byName('QB').profile.id.startsWith('d73-')"),'drafted QB takes the field');assert.notEqual(run("byName('QB').speed"),2.75);
let plays=0,frames=0;for(;frames<160000&&run('state')!=='gameover';frames++){
 if(run('state')==='presnap'){run('introT=9999');if(run('onOffense()')){run(`loadPreset(${JSON.stringify(['slants','sweep left','four verts','crossers','HB dive'][plays++%5])}); hike()`);}else run('setReady()');}
 run('step()');while(timers.length)timers.shift()();
}
assert.equal(run('state'),'gameover','real simulated game finishes');const saved=run('XOLeague.load()');assert.equal(saved.week,1);assert(saved.schedule[0].every(g=>g.score));assert(Object.values(saved.stats).some(s=>s.pass>0));assert(saved.highlight?.frames.length>1,'actual touchdown is recorded and saved');assert(saved.highlight.frames.length<=181);assert(saved.highlight.frames.every(f=>f.players.length===16&&f.ball.length===3));if(process.env.FOOTBALL_REPLAY_FIXTURE)fs.writeFileSync(process.env.FOOTBALL_REPLAY_FIXTURE,JSON.stringify(saved));const first=JSON.stringify(saved);run('gameOver()');assert.equal(JSON.stringify(run('XOLeague.load()')),first,'finishing twice does not duplicate totals');
// The carrier hooks connect the actual game outcome to the real player card totals.
run("newGame(); introT=9999; loadPreset('slants'); MATCH.caught('WR-L'); giveBall(byName('WR-L')); endPlay('td',null,{x:100,y:yardY(100)})");assert.equal(run("MATCH.getStats()[draftedSeason.rosters[0][5].id].receive"),75);assert.equal(run("MATCH.getStats()[draftedSeason.rosters[0][0].id].passTd"),1);
console.log(`PASS: actual coached game finished in ${frames} frames, saved week 1, populated league stats, protected duplicate finish, wired receiver and QB touchdowns`);
