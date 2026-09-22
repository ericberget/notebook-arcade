(() => {
'use strict';
const L=XOLeague,q=new URLSearchParams(location.search),seasonId=q.get('season');
let season=seasonId?L.load():null,fixture=season&&L.current(season);
if(seasonId&&(!season||season.id!==seasonId||!fixture||fixture.id!==q.get('match'))){location.replace('index.html#season');return;}
const valid=(v,f)=>v!==null&&/^\d+$/.test(v)&&L.teams[Number(v)]?Number(v):f;
const you=season?season.team:valid(q.get('you'),0),opp=season?(fixture.home===you?fixture.away:fixture.home):valid(q.get('opponent'),you===1?0:1);
let totals={},play={},finished=false,highlight=null;
const get=(role,mine)=>{const rr=L.rosterFor(season,mine?you:opp),p=rr.find(p=>p.role===role);return p?{...p,attrs:L.effectiveAttrs(p,rr.find(p=>p.role==='QB'))}:undefined;};
const put=(p,k,n)=>{if(p)L.add(totals,p.id,{[k]:n});};
function closeSegment(spot){if(play.segment){const n=Math.round(spot-play.start);put(play.segment,play.type,n);if(play.type==='receive')put(play.qb,'pass',n);play.start=spot;play.segment=null;}}
window.XOMatch={you:L.teams[you],opponent:L.teams[opp],season:!!season,get,
 reset(){totals={};finished=false;highlight=null;document.getElementById('match-finish')?.remove();},
 startPlay(los,mine){play={start:los,los,mine,frames:[],segment:get('QB',mine),type:'rush',qb:get('QB',mine),ended:false};},
 carry(role,spot){if(play.segment?.role===role)return;play.segment=get(role,play.mine);},
 caught(role){if(play.ended||play.forward)return;play.type='receive';play.segment=get(role,play.mine);put(play.segment,'catches',1);play.forward=true;},
 lateral(spot){closeSegment(spot);},
 intercepted(role,spot){play.segment=get(role,!play.mine);play.start=spot;play.type='returns';play.turnover=true;},
 record(frame){if(!play.ended&&play.frames&&play.frames.length<181)play.frames.push(frame);},
 end(kind,spot){if(play.ended)return;play.ended=true;
   if(((kind==='td'&&play.mine)||(kind==='pick6'&&!play.mine))&&play.frames?.length>1){highlight={version:1,kind,player:play.segment?.name||'Your squad',yards:Math.max(0,Math.round(kind==='pick6'?play.start:100-play.los)),you,opponent:opp,frames:play.frames,matchId:fixture?.id||null};}
   if(kind==='inc')return;
   if(play.turnover){put(play.segment,'returns',Math.round(play.start-spot));if(kind==='pick6')put(play.segment,'td',1);return;}
   const scorer=play.segment;closeSegment(spot);if(kind==='td'){put(scorer,'td',1);if(play.forward)put(play.qb,'passTd',1);}
 },
 finish(a,b){if(finished)return;finished=true;let message='Quick Play final';let ok=false;
   if(season){const latest=L.load();if(latest&&latest.id===season.id&&L.finish(latest,fixture.id,a,b,totals)){if(highlight)latest.highlight=highlight;ok=L.save(latest);message=ok?'Final recorded · season saved':'Unable to save this result. Keep this page open.';season=latest;}else message='This matchup was already recorded or the season changed.';}
   const panel=document.createElement('div');panel.id='match-finish';panel.style.cssText='position:absolute;left:320px;top:370px;width:550px;text-align:center;padding:18px 24px;background:repeating-linear-gradient(0deg,transparent 0 31px,#7e9dcc25 31px 32px),#fcf8e9;box-shadow:2px 3px 0 #263e8330;border:1px solid #243e83;color:#243e83;z-index:8;font:16px/1.6 Courier New,monospace';
   const heading=document.createElement('strong');heading.textContent=(a>b?'A win for the notebook.':'We’ll get the next one.')+' '+a+'–'+b;heading.style.cssText='display:block;font-size:23px;margin-bottom:9px';panel.appendChild(heading);
   const caption=document.createElement('p');caption.textContent=message;panel.appendChild(caption);
   const stars=Object.entries(totals).map(([id,s])=>({p:L.allPlayers(season).find(p=>p.id===id),s})).filter(x=>x.p?.team===you).sort((x,y)=>(y.s.pass+y.s.rush+y.s.receive+y.s.returns)-(x.s.pass+x.s.rush+x.s.receive+x.s.returns)).slice(0,2);
   for(const {p,s}of stars){const line=document.createElement('div');line.textContent=`${p.name} · ${s.pass+s.rush+s.receive+s.returns} yd · ${s.td+s.passTd} TD`;panel.appendChild(line);}
   if(season&&!ok&&message.startsWith('Unable')){const retry=document.createElement('button');retry.textContent='Retry saving';retry.onclick=()=>{const latest=L.load();if(latest?.id===season.id&&L.current(latest)?.id===fixture.id&&L.save(season)){caption.textContent='Final recorded · season saved';retry.remove();}else caption.textContent='Could not save. Check browser storage before trying again.';};panel.appendChild(retry);}
   const link=document.createElement('a');link.href=season?'index.html#season':'index.html';link.textContent=season?'Back to squad →':'Back to menu →';link.style.cssText='display:block;margin-top:14px;padding:8px;background:repeating-linear-gradient(125deg,#ba86151c 0 1px,transparent 1px 4px),#f5d66d;color:#243e83;border:1px solid #6b623e;text-decoration:none';panel.appendChild(link);if(season&&ok&&highlight){const replay=document.createElement('a');replay.href='index.html#replay';replay.textContent='Watch your touchdown ↗';replay.style.cssText='display:block;margin-top:8px;font-size:14px;color:#243e83';panel.appendChild(replay);}document.getElementById('stage').appendChild(panel);
 },
 getHighlight:()=>highlight,
 getStats:()=>JSON.parse(JSON.stringify(totals))
};
})();
