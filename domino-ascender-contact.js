// Match the rendered 40px grid: face width 32%, height 100%, top -10%.
// Sweep the hanging rectangle against an upright neighbour, using its near
// top corner as the pivot. The first overlap is the actual contact angle.
export function ceilingContactAngle(level, piece, target, dir) {
  const platform=level.platforms.find(([y,a,b])=>y===piece.y-1&&piece.x>=a&&piece.x<=b);
  const pivot={x:piece.x+.5+dir*.16,y:piece.y-.1+(18-(platform?.[3]||0))/40};
  const box=[[target.x+.34,target.y-.1],[target.x+.66,target.y-.1],
    [target.x+.66,target.y+.9],[target.x+.34,target.y+.9]];
  function overlaps(angle) {
    const a=-dir*angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const xs=dir===1?[-.32,0]:[0,.32];
    const body=[[xs[0],0],[xs[1],0],[xs[1],1],[xs[0],1]]
      .map(([x,y])=>[pivot.x+x*c-y*s,pivot.y+x*s+y*c]);
    return [[1,0],[0,1],[c,s],[-s,c]].every(([nx,ny])=>{
      const b=body.map(([x,y])=>x*nx+y*ny),t=box.map(([x,y])=>x*nx+y*ny);
      return Math.max(...b)>=Math.min(...t)-1e-9&&Math.max(...t)>=Math.min(...b)-1e-9;
    });
  }
  for(let angle=.5;angle<=90;angle+=.5) {
    if(!overlaps(angle))continue;
    let lo=angle-.5,hi=angle;
    for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(overlaps(mid))hi=mid;else lo=mid;}
    return hi;
  }
  return null;
}
