// Original, fixed relay puzzles. These layouts do not import Domino-Chain data.
// Each starts from a designed, timed chain, then records reversible rearrangements.
const names=[
  ['三层接力','反向钟摆','空中断桥','两座桥','两端争先','工坊终局'],
  ['四层回响','远处的机关','错位落点','折返港湾','延时接力','港湾终局'],
  ['五层回廊','高空双桥','逆向长链','钟摆高塔','三处断口','高塔终局'],
  ['六层远征','横跨遗迹','多重落点','远门迷局','最后的时差','遗迹终局'],
];

function relay(chapter,variant){
  const width=13+chapter*4,tiers=3+chapter,height=tiers*4+1,center=Math.floor(width/2);
  const pieces=[],platforms=[],ladders=[{x:3,from:2,to:height-3},{x:width-4,from:2,to:height-3}],operations=[];
  const add=(type,x,y)=>{const p={type,x,y};pieces.push(p);return p;};
  const find=(x,y)=>pieces.find(p=>p.x===x&&p.y===y);
  const floorRows=[];
  let incoming=1;
  for(let row=0;row<tiers-1;row++){
    const y=2+row*4,dir=row%2?-1:1;
    const end=row===tiers-2?center-dir:dir===1?width-3:2;
    const from=dir===1?0:end,to=dir===1?end:width-1;
    floorRows.push({y,from,to,holes:[]});
    if(row){add('splitter',incoming,y);add('normal',incoming-dir,y);}
    for(let x=incoming+(row?dir:0);dir===1?x<=end:x>=end;x+=dir)add('normal',x,y);
    incoming=end+dir;
  }
  const bottom=height-3,triggerDir=variant%2?-1:1,shortLength=3+chapter,longLength=center-1;
  const delays=Math.ceil((longLength-shortLength+1)/2);
  add('splitter',center,bottom);
  for(let i=1;i<=shortLength;i++)add(i===shortLength?'trigger':i<=delays?'delay':'normal',center+triggerDir*i,bottom);
  const doorOnChain=variant===2||variant===5;
  for(let i=1;i<=longLength;i++)add(doorOnChain&&i===longLength?'vanish':'normal',center-triggerDir*i,bottom);
  const exit={x:doorOnChain?center-triggerDir*longLength:triggerDir===1?width-1:0,y:bottom};
  floorRows.push({y:bottom,from:0,to:width-1,holes:[]});

  // Bridge gaps are part of the route, with ladders providing a pre-push detour.
  const bridgeCount=1+(chapter>0?1:0)+(variant>=3?1:0);
  for(let bridge=0;bridge<bridgeCount;bridge++){
    const options=[];
    for(let row=0;row<tiers-1;row++){
      const f=floorRows[row],dir=row%2?-1:1;
      for(let x=f.from+1;x<f.to;x++)if(!ladders.some(l=>l.x===x)&&
        [x-dir,x,x+dir].every(col=>find(col,f.y)?.type==='normal'))options.push({row,x,dir});
    }
    const option=options[(variant*3+bridge*7+chapter)%options.length];
    if(!option)throw new Error('Advanced relay needs a bridge location');
    const f=floorRows[option.row];f.holes.push(option.x);
    pieces.splice(pieces.indexOf(find(option.x,f.y)),1);
    find(option.x-option.dir,f.y).type='bridge';
  }
  for(const f of floorRows){
    let start=f.from;
    for(const hole of f.holes.sort((a,b)=>a-b)){if(start<hole)platforms.push([f.y,start,hole-1]);start=hole+1;}
    if(start<=f.to)platforms.push([f.y,start,f.to]);
  }
  for(const [y,from,to]of platforms)if(y<bottom&&!ladders.some(l=>l.x>=from&&l.x<=to&&l.from<=y))
    ladders.push({x:Math.floor((from+to)/2),from:y,to:bottom});

  // Swap different types using a real empty buffer. Reverse these legal transfers
  // to obtain an explicit solution, including all temporary placements.
  const buffer={x:0,y:2},used=new Set();
  const transfer=(piece,to)=>{
    const from={x:piece.x,y:piece.y};
    if(find(to.x,to.y))throw new Error('Occupied relay buffer');
    operations.push({from,to:{...to}});Object.assign(piece,to);
  };
  const specials=pieces.filter(p=>!['normal','trigger','vanish'].includes(p.type));
  for(let i=0;i<=chapter;i++){
    const special=specials[(variant+i*3)%specials.length];
    const candidates=pieces.filter(p=>p.type==='normal'&&!used.has(p)&&p.y!==special.y);
    const normal=candidates[(variant*5+i*7)%candidates.length],a={x:special.x,y:special.y},b={x:normal.x,y:normal.y};
    transfer(special,buffer);transfer(normal,a);transfer(special,b);used.add(normal);used.add(special);
  }
  const spare=[];
  for(let x=0;x<width;x++)if(!find(x,bottom)&&x!==exit.x)spare.push({x,y:bottom});
  const movable=pieces.filter(p=>p.type==='vanish'||p.type==='normal'&&!used.has(p));
  movable.sort((a,b)=>(a.type==='vanish'?-1:0)-(b.type==='vanish'?-1:0)||a.y-b.y||a.x-b.x);
  for(let i=0;i<1+Math.floor(variant/2);i++)transfer(movable[i],spare[i]);
  return {
    name:names[chapter][variant],chapter:chapter+1,
    hint:'先处理断桥和落点，再比较底层两条支路；开门牌必须最后一个倒。',
    width,height,player:{x:0,y:2},exit,platforms,ladders,pieces,
    plan:operations.reverse().map(({from,to})=>({from:to,to:from})),push:{x:1,y:2,dir:1},
  };
}
export const advancedDefinitions=names.flatMap((group,chapter)=>group.map((_,variant)=>relay(chapter,variant)));
