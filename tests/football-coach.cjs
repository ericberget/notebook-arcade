const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const noop=()=>{},nodes=new Map(),events={};
const ctx=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
function node(){return {style:{},classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},dataset:{},children:[],appendChild(x){this.children.push(x)},addEventListener:noop,setAttribute:noop,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1200,height:720})};}
const doc={getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement:node,querySelectorAll:()=>[],addEventListener:noop};
const math=Object.create(Math);let seed=1;math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
const sandbox={document:doc,window:{innerWidth:1400,innerHeight:900,addEventListener:(k,f)=>(events[k]??=[]).push(f)},Image:class{},localStorage:{getItem:()=>null},NotebookPaper:{draw:noop},NotebookInk:()=>new Proxy({INK:'#123',RED:'#c00',GRAPHITE:'#333'},{get:(o,k)=>o[k]||noop}),Matter:require('../shared/matter.min.js'),requestAnimationFrame:noop,performance:{now:()=>1},setTimeout:noop,clearTimeout:noop,Math:math};
vm.createContext(sandbox);
const html=fs.readFileSync('games/xo-football/index.html','utf8');
vm.runInContext([...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)][0][1],sandbox);
const run=s=>vm.runInContext(s,sandbox);
run('introT=9999; hike()');assert.equal(run('state'),'presnap');assert(nodes.get('hike').disabled,'empty call cannot snap');
run("loadPreset('slants'); updateButtons(); hike()");assert.equal(run('state'),'live');
run('setMode(false)');assert(run('coachMode'),'cannot change mode mid-play');
let pass=false;for(let i=0;i<901&&run('state')==='live';i++){run('step()');pass ||= run('!!ball.flying');}
assert(pass,'QB throws automatically');assert.equal(run('state'),'result','pass resolves without input');
run('setupPlay(true)');assert.equal(run('coachPlayReady()'),false,'new down requires a fresh call');
run("loadPreset('sweep left'); hike()");let handoff=false;
for(let i=0;i<120&&run('state')==='live';i++){run('step()');if(run("ball.carrier?.name === 'RB'")){handoff=true;break;}}
assert(handoff,'called run hands off');assert(run("byName('RB').route.length > 0"),'handoff preserves route');
run("setupPlay(); drawing=byName('WR-L'); drawing.route=[{x:100,y:900},{x:180,y:850}]; onUp(); hike()");assert.equal(run('state'),'live','drawn route enables snap');
run('setupPlay(); drawing=byName("WR-L"); drawing.route=[{x:100,y:900}]; onUp(); hike()');assert.equal(run('state'),'presnap','short gesture cannot satisfy call');
run("loadPreset('slants')");nodes.get('clear').onclick();run('hike()');assert.equal(run('state'),'presnap','erase disables snap');
run("startDrive('pencils'); introT=9999; for(let i=0;i<300;i++)step()");assert.equal(run('state'),'presnap','defense waits for coach');
run('setReady(); for(let i=0;i<42;i++)step()');assert.equal(run('state'),'live');
for(let i=0;i<901&&run('state')==='live';i++)run('step()');assert.equal(run('state'),'result','defense resolves autonomously');
run("startDrive('you'); setMode(false); introT=9999; hike()");assert.equal(run('state'),'live','Player Mode retains automatic call and manual snap');
console.log('PASS: required play call, automatic pass and handoff, route preservation, drawn routes, erasing, fresh downs, mode lock, autonomous defense, Player Mode');
