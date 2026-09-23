(function(root){
  'use strict';
  const teams = [
    ['Crayon County','Crushers','CC','✹','#bc362f','#ffd459','Absolutely outside the lines.'],
    ['Graphite City','Pencils','GC','✎','#434c60','#bbc6d4','Sharp on both sides of the ball.'],
    ['Lunchbox','Legends','LL','★','#214aab','#efb333','Fueled by questionable sandwiches.'],
    ['Detention','Dragons','DD','♜','#7b3597','#e4aeee','Unexcused greatness.'],
    ['Doodle Bay','Ducks','DB','≈','#097f78','#f3b741','All quack. Plenty of action.'],
    ['Eraser Falls','Ghosts','EF','◇','#795168','#ebafb5','Your lead was never here.'],
    ['Spiral City','Cyclones','SC','↻','#167590','#ffc958','A very loose spiral.'],
    ['Recess','Rockets','RR','↑','#bf4426','#f3b58a','Gone before the bell.'],
    ['Paper Valley','Planes','PV','➤','#2d6696','#addef3','Cleared for mild turbulence.'],
    ['Highlighter','Hornets','HH','⚡','#686d1b','#eff165','Impossible to ignore.'],
    ['Sticky Note','Bandits','SN','♠','#a33463','#fbc1d8','We had a play. We lost the note.'],
    ['Composition','Kings','CK','♛','#5542a4','#d0c6ef','College ruled. League feared.'],

  ].map((t,id)=>({id,city:t[0],name:t[1],abbr:t[2],icon:t[3],color:t[4],accent:t[5],motto:t[6]}));
  const clubIds=[0,1,2,4,5,6,7,10];
  const activeTeams=clubIds.map(id=>teams[id]);
  const clubsFor=s=>(s?.version===2?teams:(s?.clubIds||clubIds).map(id=>teams[id]));
  const regularWeeks=s=>s?.version===2?8:7;
  const roles=['QB','C','LG','RG','RB','WR-L','WR-R','TE','DE-L','NT','DE-R','LB-L','LB-R','CB-L','CB-R','S'];
  const first=['Biscuit','Chadwick','Gus','Mister','Wally','Duke','Cornelius','Beans','Otis','Skip','Bongo','Tater','Wendell','Chip','Tiny','Ronnie'];
  const last=['McFumble','Lunchmoney','Noodleman','Von Waffles','Thunderpants','Puddles','O’Really','Crumbsworth','Bologna','Pickles','Scribbles','Meatball','Wiggles','Longsocks','Flapjack','Dingus','Clipboard','Butterbean','Sidequest'];
  const quirks=['Brings orange slices for both teams.','Claims the forty time was uphill.','Has a lucky eraser. Will not elaborate.','Celebrates first downs like championships.','Scouted in the cafeteria.','Still thinks this is dodgeball.','Writes inspirational quotes on his cleats.','Runs better when someone says snacks.','Has never read a playbook right-side up.','Listed as round. Plays even rounder.','His agent is his lab partner.','Insists the O stands for outstanding.'];
  function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function positionAttributes(p){const a=p.attrs;
    if(p.role==='TE'){p.attrs={speed:a.speed,hands:a.hands,blocking:a.blocking??a.power??70,iq:a.iq??a.arm??70};p.overall=Math.round(p.attrs.speed*.25+p.attrs.hands*.3+p.attrs.blocking*.3+p.attrs.iq*.15);return p;}
    if(p.role!=='QB')return p;
    p.attrs={speed:a.speed,arm:a.arm,accuracy:a.accuracy??a.hands??70,leadership:a.leadership??a.power??70};
    p.overall=Math.round(p.attrs.arm*.35+p.attrs.accuracy*.35+p.attrs.speed*.15+p.attrs.leadership*.15);return p;
  }
  function ratePlayer(p){
    positionAttributes(p);const a=p.attrs;
    if(p.role==='RB')p.overall=Math.round(a.speed*.45+a.power*.4+a.hands*.15);
    else if(position(p.role)==='WR')p.overall=Math.round(a.hands*.45+a.speed*.35+a.power*.2);
    return p;
  }
  function capProspect(p){for(const k of Object.keys(p.attrs))p.attrs[k]=Math.min(k==='speed'?90:92,p.attrs[k]);return ratePlayer(p);}
  const catchingMultiplier=p=>(p?.attrs.hands==null?1:.72+p.attrs.hands/250)*(p?.role==='TE'?1+(p.attrs.iq??0)/99*.05:1);
  const leadershipBoost=qb=>Math.max(0,Math.min(99,qb?.attrs.leadership??0))/99*.05;
  function effectiveAttrs(p,qb){const a={...p.attrs};if(p.role.startsWith('WR'))for(const k of ['speed','hands','power'])a[k]=Math.min(99,a[k]*(1+leadershipBoost(qb)));return a;}
  function passError(accuracy,distance,r=Math.random){const radius=(1-Math.max(0,Math.min(99,accuracy))/99)*Math.min(28,4+distance*.055),angle=r()*Math.PI*2,size=Math.sqrt(r())*radius;return {x:Math.cos(angle)*size,y:Math.sin(angle)*size};}
  function roster(id){const r=random(9317+id*827);return roles.map((role,i)=>{
    const a=()=>54+Math.floor(r()*40), nameIndex=((id*16+i)*73)%304;
    const p={id:`${id}-${i}`,team:id,role,name:first[nameIndex%16]+' '+last[Math.floor(nameIndex/16)],number:role==='QB'?7+id:20+i*4,quirk:quirks[(id*5+i)%quirks.length],attrs:{speed:a(),hands:a(),power:a(),arm:a()}};
    p.overall=Math.round((p.attrs.speed+p.attrs.power+(role==='QB'?p.attrs.arm:p.attrs.hands))/3);return positionAttributes(p);
  });}
  const rosters=teams.map(t=>roster(t.id));
  const blank=()=>({pass:0,rush:0,receive:0,catches:0,returns:0,td:0,passTd:0});
  const key='notebook-football-season-v2';
  const draftRoles=['QB','WR-L','WR-R','RB','TE'];
  const position=role=>role.startsWith('WR')?'WR':role;
  const rosterFor=(s,id)=>s?.rosters?.[id]||rosters[id];
  const allPlayers=s=>clubsFor(s).flatMap(t=>rosterFor(s,t.id));
  function legacySave(){try{return JSON.parse(localStorage.getItem('notebook-football-season-v1'))?.version===1;}catch(_){return false;}}
  function create(team,seed=Date.now()){if(!clubIds.includes(team))throw Error('Choose a team');
    let ring=[...clubIds],schedule=[];const count=ring.length;
    for(let w=0;w<count-1;w++){const games=[];for(let i=0;i<count/2;i++)games.push({id:`w${w}-${i}`,home:ring[w%2?count-1-i:i],away:ring[w%2?i:count-1-i],score:null});schedule.push(games);ring.splice(1,0,ring.pop());}
    return {version:3,clubIds:[...clubIds],id:String(seed),seed:seed>>>0,team,week:0,schedule,stats:{},champion:null,complete:false,rosters:JSON.parse(JSON.stringify(rosters)),draft:{order:[team,...clubIds.filter(id=>id!==team)],picks:[],prospects:prospects(seed),complete:false}};
  }
  function archives(){try{const list=JSON.parse(localStorage.getItem('notebook-football-archives')||'[]');return Array.isArray(list)?list.filter(s=>[2,3].includes(s.version)&&s.complete&&teams[s.team]&&teams[s.champion]&&Array.isArray(s.schedule)):[];}catch(_){return [];}}
  function archive(s){if(!s?.complete)return true;try{const list=archives().filter(x=>x.id!==s.id);list.unshift(s);localStorage.setItem('notebook-football-archives',JSON.stringify(list));return true;}catch(_){return false;}}
  function save(s){try{localStorage.setItem(key,JSON.stringify(s));return true;}catch(_){return false;}}
  function load(){try{const s=JSON.parse(localStorage.getItem(key));
    if(![2,3].includes(s?.version)||!teams[s.team])return null;
    if(s.version===3&&(!Array.isArray(s.clubIds)||s.clubIds.length!==8||new Set(s.clubIds).size!==8||s.clubIds.some(id=>!clubIds.includes(id))))return null;
    const ids=clubsFor(s).map(t=>t.id),count=ids.length,weeks=regularWeeks(s);
    if(!ids.includes(s.team)||!Array.isArray(s.schedule)||s.schedule.length<weeks||s.schedule.length>weeks+2||!Number.isInteger(s.week)||s.week<0||s.week>s.schedule.length||!s.stats||typeof s.stats!=='object'||!s.draft||!Array.isArray(s.draft.picks)||!Array.isArray(s.draft.prospects)||!Array.isArray(s.draft.order)||s.draft.order.length!==count||new Set(s.draft.order).size!==count||s.draft.order.some(id=>!ids.includes(id))||!Array.isArray(s.rosters)||s.rosters.length!==teams.length)return null;
    if(s.draft.picks.length>count*draftRoles.length||s.draft.complete!==(s.draft.picks.length===count*draftRoles.length))return null;
    for(const [w,week]of s.schedule.entries()){
      if(!Array.isArray(week)||week.length!==(w<weeks?count/2:w===weeks?2:1))return null;
      for(const [i,g]of week.entries())if(!ids.includes(g.home)||!ids.includes(g.away)||g.home===g.away||g.id!==(w<weeks?`w${w}-${i}`:w===weeks?`semi-${i+1}`:'bowl')||(g.score!==null&&(!Array.isArray(g.score)||g.score.length!==2||!g.score.every(Number.isFinite))))return null;
    }
    for(const [id,rr]of s.rosters.entries()){if(rr.length!==roles.length||new Set(rr.map(p=>p.role)).size!==roles.length)return null;for(const p of rr)if(p.team!==id||!roles.includes(p.role)||!p.attrs||Object.values(p.attrs).some(v=>!Number.isFinite(v)||v<0||v>99))return null;}
    for(const p of s.rosters.flat().concat(s.draft.prospects))positionAttributes(p);
    return s;
  }catch(_){return null;}}
  function prospects(seed){
    const r=random((seed>>>0)+557),result=[];
    const names=['Moose','Peanut','Scooter','Bubba','Captain','Nugget','Nacho','Tugboat','Rusty','Boomer','Pickle','Nibbles','Spud','Lefty','Buck','Ziggy','Muffin','Chester','Goose','Dudley'];
    const surnames=['Fumblesworth','McNugget','Taterington','Wafflehouse','Crumple','Doodleberry','Snacks','Pancake','Underpants','Yardwork','Ovenmitts','Ketchup','Velcro','Soggycleats','Honk','Paperclip','Dingdong','Lunchbox','McZoom','Sideburns'];
    for(const [pos,count]of [['QB',16],['WR',32],['RB',16],['TE',16]])for(let i=0;i<count;i++){
      const n=result.length,j=(n*73+(seed>>>0)%400)%400,a=()=>48+Math.floor(r()*45);
      const attrs={speed:48+Math.floor(r()*43),hands:a(),power:a(),arm:a()};
      if(pos==='QB')attrs.arm=Math.max(attrs.arm,65);if(pos==='WR')attrs.hands=Math.max(attrs.hands,60);if(pos==='RB')attrs.speed=Math.max(attrs.speed,62);if(pos==='TE')attrs.power=Math.max(attrs.power,62);
      const p={id:`d${seed}-${n}`,team:null,role:pos,name:names[j%20]+' '+surnames[Math.floor(j/20)],number:pos==='QB'?1+i:20+n%70,quirk:quirks[n%quirks.length],attrs};
      result.push(ratePlayer(p));
    }return result;
  }
  function draftTurn(s){if(!s?.draft||s.draft.complete)return null;const index=s.draft.picks.length,round=Math.floor(index/s.draft.order.length),slot=index%s.draft.order.length,order=round%2?[...s.draft.order].reverse():s.draft.order;return {round,team:order[slot],role:draftRoles[round],pick:index+1};}
  function draftOptions(s){const turn=draftTurn(s);if(!turn)return [];const taken=new Set(s.draft.picks.map(p=>p.playerId));return s.draft.prospects.filter(p=>p.role===position(turn.role)&&!taken.has(p.id)).map(capProspect).sort((a,b)=>b.overall-a.overall||a.id.localeCompare(b.id));}
  function commitPick(s,p,automatic){const turn=draftTurn(s);const player={...p,attrs:{...p.attrs},team:turn.team,role:turn.role};const rr=s.rosters[turn.team],i=rr.findIndex(p=>p.role===turn.role);rr[i]=player;s.draft.picks.push({round:turn.round,team:turn.team,playerId:p.id,role:turn.role,automatic});s.draft.complete=s.draft.picks.length===s.draft.order.length*draftRoles.length;}
  function autoPick(s){const turn=draftTurn(s),options=draftOptions(s);const preference=(turn.role==='QB'?['speed','accuracy','leadership','arm']:turn.role==='TE'?['speed','hands','blocking','iq']:['speed','hands','power','arm'])[turn.team%4];options.sort((a,b)=>(b.overall+b.attrs[preference]*.1)-(a.overall+a.attrs[preference]*.1));commitPick(s,options[0],true);}
  function draftPick(s,id){const turn=draftTurn(s);if(!turn||turn.team!==s.team)return false;const p=draftOptions(s).find(p=>p.id===id);if(!p)return false;commitPick(s,p,false);while(draftTurn(s)&&draftTurn(s).team!==s.team)autoPick(s);return true;}
  function simDraft(s){if(!draftTurn(s))return false;while(draftTurn(s))autoPick(s);return true;}
  function standings(s){const rows=clubsFor(s).map(t=>({...t,w:0,l:0,pf:0,pa:0})),byId=Object.fromEntries(rows.map(t=>[t.id,t]));for(const week of s.schedule.slice(0,regularWeeks(s)))for(const g of week)if(g.score){const [a,b]=g.score;for(const [id,f,ag]of [[g.home,a,b],[g.away,b,a]]){byId[id].pf+=f;byId[id].pa+=ag;byId[id][f>ag?'w':'l']++;}}return rows.sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)||b.pf-a.pf||a.id-b.id);}
  function current(s){return s.complete||!s.draft?.complete?null:s.schedule[s.week]?.find(g=>g.home===s.team||g.away===s.team)||null;}
  function add(stats,id,delta){const target=stats[id]||(stats[id]=blank());for(const k of Object.keys(blank()))target[k]=(Number.isFinite(target[k])?target[k]:0)+(Number.isFinite(delta[k])?delta[k]:0);}
  const upgradeCost=100;
  const upgradeAttributes=p=>Object.keys(p.attrs).filter(k=>k!=='arm'||p.role==='QB');
  const performance=(s,team=s?.team)=>({...{points:0,earned:0,spent:0},...s?.performance?.[team]});
  function spendUpgrade(s,team,playerId,attribute){
    if(!s?.draft?.complete)return {accepted:false,reason:'Finish the draft first.'};
    const p=rosterFor(s,team).find(p=>p.id===playerId&&draftRoles.includes(p.role));
    if(!p||!upgradeAttributes(p).includes(attribute))return {accepted:false,reason:'Choose a player and attribute from your squad.'};
    if(p.attrs[attribute]>=99)return {accepted:false,reason:'That attribute is already 99.'};
    const bank=performance(s,team);
    if(bank.points<upgradeCost)return {accepted:false,reason:'You need 100 performance points for an upgrade.'};
    const from=p.attrs[attribute];p.attrs[attribute]=Math.min(99,from+1);ratePlayer(p);
    (p.upgrades??={})[attribute]=(p.upgrades[attribute]||0)+1;
    bank.points-=upgradeCost;bank.spent+=upgradeCost;(s.performance??={})[team]=bank;
    if(team===s.team)s.rosterRevision=(s.rosterRevision||0)+1;
    return {accepted:true,player:p.name,attribute,from,to:p.attrs[attribute],points:bank.points};
  }
  const upgradePlayer=(s,id,attribute)=>spendUpgrade(s,s?.team,id,attribute);
  // Count passing/receiving yards and passing/scoring TDs only once.
  function awardPerformance(s,team,gameStats,won){
    const total=blank(),rr=rosterFor(s,team);
    for(const p of rr)for(const k of Object.keys(total)){
      const v=gameStats[p.id]?.[k];if(Number.isFinite(v))total[k]+=Math.max(0,v);
    }
    const breakdown={yards:Math.floor((Math.max(total.pass,total.receive)+total.rush+total.returns)/5),
      catches:Math.floor(total.catches)*2,touchdowns:Math.floor(Math.max(total.td,total.passTd))*15,win:won?20:0};
    const earned=Math.min(200,Object.values(breakdown).reduce((a,b)=>a+b,0)),bank=performance(s,team);
    bank.points+=earned;bank.earned+=earned;(s.performance??={})[team]=bank;
    // Other clubs spend their own points. The user's bank is never spent for them.
    if(team!==s.team)while(performance(s,team).points>=upgradeCost){
      const players=rr.filter(p=>draftRoles.includes(p.role)&&upgradeAttributes(p).some(k=>p.attrs[k]<99)).sort((a,b)=>a.overall-b.overall);
      if(!players.length)break;
      const p=players[0],attribute=upgradeAttributes(p).sort((a,b)=>p.attrs[a]-p.attrs[b])[0];
      if(!spendUpgrade(s,team,p.id,attribute).accepted)break;
    }
    return {earned,balance:bank.points,breakdown};
  }
  function sim(s,g){const r=random(s.seed+g.home*107+g.away*137+s.week*829);let a=7*(1+Math.floor(r()*5))+3*Math.floor(r()*3),b=7*(1+Math.floor(r()*5))+3*Math.floor(r()*3);if(a===b)a+=3;g.score=[a,b];g.simulated=true;
    const gameStats={};
    for(const [id,score]of [[g.home,a],[g.away,b]]){const roster=rosterFor(s,id);let remain=Math.floor(score/7);for(const p of roster){if(['RB','WR-L','WR-R','TE'].includes(p.role)){const yards=15+Math.floor(r()*90),td=Math.min(remain,Math.floor(r()*3));remain-=td;add(gameStats,p.id,{[p.role==='RB'?'rush':'receive']:yards,td,catches:p.role==='RB'?0:Math.max(td,Math.ceil(yards/12))});if(p.role!=='RB')add(gameStats,roster[0].id,{pass:yards,passTd:td});}}if(remain)add(gameStats,roster[4].id,{td:remain});}
    for(const [id,delta]of Object.entries(gameStats))add(s.stats,id,delta);
    awardPerformance(s,g.home,gameStats,a>b);awardPerformance(s,g.away,gameStats,b>a);
  }
  function advance(s){if(s.schedule[s.week].some(g=>!g.score))return; s.week++;const weeks=regularWeeks(s);
    if(s.week===weeks){const top=standings(s).slice(0,4);s.schedule.push([{id:'semi-1',home:top[0].id,away:top[3].id,score:null},{id:'semi-2',home:top[1].id,away:top[2].id,score:null}]);}
    if(s.week===weeks+1){const winners=s.schedule[weeks].map(g=>g.score[0]>g.score[1]?g.home:g.away);s.schedule.push([{id:'bowl',home:winners[0],away:winners[1],score:null}]);}
    if(s.week===weeks+2){const g=s.schedule[weeks+1][0];s.champion=g.score[0]>g.score[1]?g.home:g.away;s.complete=true;}
  }
  function finish(s,matchId,you,opponent,stats){const g=current(s);if(!g||g.id!==matchId||g.score||!Number.isFinite(you)||!Number.isFinite(opponent)||you===opponent)return false;
    g.score=g.home===s.team?[you,opponent]:[opponent,you];for(const [id,delta]of Object.entries(stats||{}))if(rosterFor(s,g.home).concat(rosterFor(s,g.away)).some(p=>p.id===id))add(s.stats,id,delta);
    const homePoints=awardPerformance(s,g.home,stats||{},g.score[0]>g.score[1]),awayPoints=awardPerformance(s,g.away,stats||{},g.score[1]>g.score[0]);
    s.lastPerformance={matchId,week:s.week,...(s.team===g.home?homePoints:awayPoints)};
    for(const other of s.schedule[s.week])if(!other.score)sim(s,other);advance(s);return true;
  }
  function finishSpectatorWeek(s){if(!s.draft?.complete||s.complete||current(s))return false;for(const g of s.schedule[s.week])if(!g.score)sim(s,g);advance(s);return true;}
  const api={upgradeCost,upgradeAttributes,performance,upgradePlayer,activeTeams,clubsFor,regularWeeks,archive,archives,catchingMultiplier,leadershipBoost,effectiveAttrs,passError,teams,rosters,roles,rosterFor,allPlayers,draftRoles,draftTurn,draftOptions,draftPick,simDraft,legacySave,blank,create,save,load,standings,current,finish,finishSpectatorWeek,add};
  root.XOLeague=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
