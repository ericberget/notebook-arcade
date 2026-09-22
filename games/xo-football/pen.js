// Stable, player-specific pen marks. SVG keeps team ink and meter values live.
window.XOPen=(()=>{
  function random(key){let n=2166136261;for(const c of String(key))n=Math.imul(n^c.charCodeAt(0),16777619);return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
  const f=n=>n.toFixed(2);
  function mark(letter,key,number,portrait=false){const r=random(key),paths=[],character=portrait&&letter==='O';
    for(let lap=0;lap<6;lap++){
      const cx=64+(r()-.5)*7,cy=64+(r()-.5)*6,rx=44+r()*7,ry=44+r()*9,phase=r()*Math.PI*2;
      let d='';
      if(letter==='X'){
        for(let side=0;side<2;side++){
          const x1=(side?106:24)+(r()-.5)*8,y1=23+(r()-.5)*7,x2=(side?23:105)+(r()-.5)*8,y2=106+(r()-.5)*7;
          d+=`M${f(x1)} ${f(y1)} Q${f(64+(r()-.5)*14)} ${f(64+(r()-.5)*10)} ${f(x2)} ${f(y2)} `;
        }
      }else{
        const start=r()*6.28,sweep=6.1+r()*.65;
        for(let i=0;i<=100;i++){
          const a=start+sweep*i/100,w=Math.sin(a*3+phase)*1.4+Math.sin(a*7-phase)*.65;
          const x=cx+Math.cos(a)*(rx+w)+Math.sin(a)*2,y=cy+Math.sin(a)*(ry+w);
          d+=`${i?'L':'M'}${f(x)} ${f(y)} `;
        }
      }
      paths.push(`<path d="${d}" stroke-width="${f(.75+r()*.65)}" opacity="${f(.48+r()*.35)}"/>`);
    }
    const jersey=number==null?'':`<text x="64" y="68" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-family="Courier New,monospace" font-size="42" font-weight="bold">${character?'<tspan font-size="27">#</tspan>':''}${Number(number)}</text>`;
    // Card portraits get a tiny relaxed stance; field markers stay compact Os.
    const limbs=character?`<g stroke-width="2.1" opacity=".85"><path d="M32 61 Q25 69 20 75 L10 69 M128 61 L141 50 Q145 48 151 55 M64 108 Q61 125 61 141 L46 145 M96 108 L104 139 L119 137"/><path d="M31 62 L19 76 L9 70 M129 62 L142 51 L151 56 M65 109 L62 142 L47 146 M97 109 L105 140 L118 138" stroke-width=".8" opacity=".5"/></g>`:'';
    return `<svg viewBox="0 0 ${character?'160 160':'128 128'}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${limbs}<g${character?' transform="translate(16 0)"':''}>${paths.join('')}${jersey}</g></svg>`;
  }
  function bar(value,key){const r=random(key),end=4+392*Math.max(0,Math.min(99,value))/99,paths=[];
    // Separate, slightly curved pen scratches leave paper visible between strokes.
    for(let x=4;x<end-1;x+=1.9+r()*1.3){
      const x2=Math.min(end,x+4+r()*7),y1=18+r()*3,y2=3+r()*3;
      paths.push(`<path d="M${f(x)} ${f(y1)} Q${f((x+x2)/2+(r()-.5)*2)} ${f(10+r()*4)} ${f(x2)} ${f(y2)}" stroke-width="${f(.65+r()*.6)}" opacity="${f(.5+r()*.4)}"/>`);
    }
    for(let x=7;x<end-5;x+=10+r()*15){
      paths.push(`<path d="M${f(x)} ${f(4+r()*6)} L${f(Math.min(end,x+5+r()*10))} ${f(15+r()*5)}" stroke-width=".65" opacity=".45"/>`);
    }
    return `<svg viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M3 3 Q102 1 206 3 T397 2 L397 21 Q280 22 170 21 T3 22 Z M2 4 L3 21 M398 3 L397 21" stroke-width="1.1" opacity=".78"/>${paths.join('')}</svg>`;
  }
  return {mark,bar};
})();
