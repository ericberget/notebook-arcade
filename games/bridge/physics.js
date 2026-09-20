/* Freehand strokes become a shared, deformable network. No preselected outcomes. */
(function(root){
  const anchors=[{x:350,y:422},{x:740,y:422},{x:330,y:545},{x:760,y:545}];
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function closest(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return {x:a.x+dx*t,y:a.y+dy*t,t};}
  function simplify(points,eps=4){
    if(points.length<3)return points.map(p=>({...p}));
    let far=0,at=0;for(let i=1;i<points.length-1;i++){const d=distance(points[i],closest(points[i],points[0],points.at(-1)));if(d>far){far=d;at=i;}}
    return far>eps?[...simplify(points.slice(0,at+1),eps).slice(0,-1),...simplify(points.slice(at),eps)]:[{...points[0]},{...points.at(-1)}];
  }
  function length(strokes){return strokes.reduce((n,s)=>n+s.points.slice(1).reduce((d,p,i)=>d+distance(p,s.points[i]),0),0);}
  function create(strokes,level={anchors}){
    const bolts=level.anchors||anchors,left=bolts[0].x,right=bolts[1].x,deckY=bolts[0].y;
    const nodes=[],links=[],segments=[];
    const node=(p,pin=false)=>{let i=nodes.findIndex(n=>distance(n,p)<7);if(i<0){i=nodes.length;nodes.push({x:p.x,y:p.y,px:p.x,py:p.y,ox:p.x,oy:p.y,pin});}else if(pin)nodes[i].pin=true;return i;};
    bolts.forEach(a=>node(a,true));
    strokes.forEach((s,stroke)=>{const pts=simplify(s.points);for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i],n=s.type==='brace'?1:Math.max(1,Math.ceil(distance(a,b)/65));
      for(let j=0;j<n;j++){const p={x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n},q={x:a.x+(b.x-a.x)*(j+1)/n,y:a.y+(b.y-a.y)*(j+1)/n};node(p);node(q);segments.push({a:p,b:q,type:s.type,stroke});}
    }});
    // Explicit intersections share joints, including crossings halfway along a stroke.
    for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
      const a=segments[i].a,b=segments[i].b,c=segments[j].a,d=segments[j].b;
      const dx=b.x-a.x,dy=b.y-a.y,ex=d.x-c.x,ey=d.y-c.y,den=dx*ey-dy*ex;
      if(Math.abs(den)<.001)continue;const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/den,u=((c.x-a.x)*dy-(c.y-a.y)*dx)/den;
      if(t>=0&&t<=1&&u>=0&&u<=1)node({x:a.x+t*dx,y:a.y+t*dy});
    }
    segments.forEach(s=>{const list=[];nodes.forEach((p,i)=>{const q=closest(p,s.a,s.b);if(distance(p,q)<8)list.push({i,t:q.t});});list.sort((a,b)=>a.t-b.t);
      for(let j=1;j<list.length;j++){const a=list[j-1].i,b=list[j].i;if(a!==b&&distance(nodes[a],nodes[b])>3&&!links.some(l=>l.a===a&&l.b===b||l.a===b&&l.b===a))links.push({a,b,rest:distance(nodes[a],nodes[b]),type:s.type,stroke:s.stroke,broken:false,stress:0,fatigue:0});}
    });
    // Weak bending resistance preserves a drawn curve, while braces carry axial loads.
    const bends=[];for(let i=0;i<links.length;i++)for(let j=i+1;j<links.length;j++){
      const a=links[i],b=links[j];if(a.stroke!==b.stroke)continue;const joint=[a.a,a.b].find(v=>v===b.a||v===b.b);if(joint===undefined)continue;
      const x=a.a===joint?a.b:a.a,y=b.a===joint?b.b:b.a;bends.push({a:x,b:y,rest:distance(nodes[x],nodes[y]),links:[i,j]});
    }
    const wheels=[left-120,left-72].map(x=>({x,y:deckY-9,px:x,py:deckY-9}));
    return {nodes,links,bends,wheels,left,right,deckY,t:0,status:'running',breaks:[],maxSag:0,stuck:0,lastX:left-96};
  }
  function constrain(nodes,a,b,rest,stiff=1){const n=nodes[a],m=nodes[b],dx=m.x-n.x,dy=m.y-n.y,d=Math.hypot(dx,dy)||.001,wa=n.pin?0:1,wb=m.pin?0:1;if(!wa&&!wb)return;
    const f=(d-rest)/d*stiff/(wa+wb);n.x+=dx*f*wa;n.y+=dy*f*wa;m.x-=dx*f*wb;m.y-=dy*f*wb;
  }
  function step(w){
    if(w.status!=='running')return;w.t++;
    w.nodes.forEach(n=>{if(n.pin){n.x=n.ox;n.y=n.oy;return;}const vx=(n.x-n.px)*.98,vy=(n.y-n.py)*.98;n.px=n.x;n.py=n.y;n.x+=vx;n.y+=vy+.025;});
    w.wheels.forEach(n=>{const vx=(n.x-n.px)*.95,vy=(n.y-n.py)*.98;n.px=n.x;n.py=n.y;n.x+=Math.max(.3,Math.min(.85,vx+.13));n.y+=vy+.23;});
    for(let iter=0;iter<12;iter++){
      for(const l of w.links){if(l.broken)continue;const strain=Math.abs(distance(w.nodes[l.a],w.nodes[l.b])-l.rest)/l.rest;l.stress=Math.max(l.stress*.94,strain*7);constrain(w.nodes,l.a,l.b,l.rest,.93);}
      for(const b of w.bends)if(b.links.every(i=>!w.links[i].broken))constrain(w.nodes,b.a,b.b,b.rest,.13);
      constrain(w.wheels,0,1,48,1);
      for(const wheel of w.wheels){
        if((wheel.x<=w.left||wheel.x>=w.right)&&wheel.y+9>w.deckY){wheel.y=w.deckY-9;continue;}
        let surface=null;
        for(const l of w.links){if(l.type!=='road'||l.broken)continue;const a=w.nodes[l.a],b=w.nodes[l.b];if(Math.abs(b.x-a.x)<2)continue;const t=(wheel.x-a.x)/(b.x-a.x);if(t<0||t>1)continue;const y=a.y+(b.y-a.y)*t;
          if(wheel.y+9>=y&&wheel.py+9<y+22&&(!surface||y<surface.y))surface={l,a,b,t,y};
        }
        if(surface){const {a,b,t,y}=surface,penetration=wheel.y+9-y,aw=a.pin?0:1-t,bw=b.pin?0:t,sum=.7+aw*aw+bw*bw;
          wheel.y-=penetration*.7/sum;a.y+=penetration*aw/sum;b.y+=penetration*bw/sum;
        }
      }
    }
    for(const l of w.links){if(l.broken)continue;const a=w.nodes[l.a],b=w.nodes[l.b];const sag=Math.max(a.y-a.oy,b.y-b.oy);w.maxSag=Math.max(w.maxSag,sag);
      // A deck bent far beyond its original shape fractures; triangles keep it in shape.
      const load=l.type==='road'?Math.max(l.stress,sag/14):l.stress;
      l.stress=Math.max(l.stress,load);l.fatigue=Math.max(0,l.fatigue+(load>1?1:-.8));
      if(l.fatigue>14){l.broken=true;w.breaks.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,t:w.t});}
    }
    const x=(w.wheels[0].x+w.wheels[1].x)/2,y=(w.wheels[0].y+w.wheels[1].y)/2;
    if(w.wheels.every(p=>p.x>w.right+45&&p.y<w.deckY+23))w.status='won';
    else if(y>650||w.wheels.some(p=>p.y>720))w.status='lost';
    if(w.t%120===0){w.stuck=x-w.lastX<12?w.stuck+1:0;w.lastX=x;}
    if(w.stuck>3||w.t>2400)w.status='stuck';
    return w.status;
  }
  const api={anchors,create,step,length,closest,simplify,distance};if(typeof module!=='undefined')module.exports=api;else root.BridgePhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
