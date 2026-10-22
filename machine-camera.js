const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Distances and speed are in screen pixels, independent of board scale.
export function edgePan({pointer,view,scroll,limit},elapsed){
  const next={x:scroll.x,y:scroll.y};
  if(!pointer||elapsed<=0||pointer.x< -16||pointer.x>view.width+16||pointer.y< -16||pointer.y>view.height+16)return next;
  const edge=(p,length)=>{
    const margin=Math.min(48,length/4);
    if(p<margin)return -320*clamp(1-p/margin,0,1)**2;
    if(p>length-margin)return 320*clamp(1-(length-p)/margin,0,1)**2;
    return 0;
  };
  next.x=clamp(scroll.x+edge(pointer.x,view.width)*elapsed/1000,0,limit.x);
  next.y=clamp(scroll.y+edge(pointer.y,view.height)*elapsed/1000,0,limit.y);
  return next;
}
export function overviewScale(view,world){return Math.min(view.width/world.width,view.height/world.height);}
export function worldPoint(client,rect,scale){return {x:(client.x-rect.left)/scale,y:(client.y-rect.top)/scale};}
