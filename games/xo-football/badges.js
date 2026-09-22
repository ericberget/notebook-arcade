// Generated club sketches; legacy emblems remain available for older seasons.
window.XOBadges=(()=>{
 const art={0:'crushers',1:'pencils',2:'legends',4:'ducks',5:'ghosts',6:'cyclones',7:'rockets',10:'bandits'};
 function badge(t){const slug=art[t.id];
  if(!slug)return `<span class="club-emblem legacy-emblem" style="--team:${t.color};--accent:${t.accent}" aria-hidden="true">${t.icon}</span>`;
  return `<span class="club-emblem" style="--team:${t.color};--accent:${t.accent}" aria-hidden="true"><img src="assets/club-art-v1/${slug}.png" alt="" width="1254" height="1254" decoding="async" draggable="false"></span>`;
 }
 return {badge};
})();
