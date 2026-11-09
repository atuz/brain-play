// Preserve the painted rolling pose when the tumbler leaves a platform.
// Angles stay unwrapped: e.g. -270 -> -360, never +90 -> -180.
export function tumblerDropMotion({matrix,angle,dir,width,height,dx=0,dy=0}){
  const progress=angle*dir;
  const half=Math.ceil((progress-1e-5)/180);
  const end=half*180*dir;
  const inverted=Math.abs(half%2)===1;
  return {
    from:`translate(${matrix[4]+dx}px,${matrix[5]+dy}px) rotate(${angle}deg)`,
    to:`translate(${inverted?width:0}px,${inverted?height:0}px) rotate(${end}deg)`,
    inverted,end,
  };
}
