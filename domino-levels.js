import {advancedDefinitions} from './domino-levels-advanced.js?v=22';
// Original, fixed puzzles. Recorded edit plans are checked by domino.test.js.
const piece=(type,x,y=5)=>({type,x,y});
const n=(x,y=5)=>piece('normal',x,y), d=(x,y=5)=>piece('delay',x,y),
  b=(x,y=5)=>piece('bridge',x,y), v=(x,y=5)=>piece('vanish',x,y),
  s=(x,y=5)=>piece('splitter',x,y), t=(x,y=5)=>piece('trigger',x,y);
const move=(x,y,toX,toY=y)=>({from:{x,y},to:{x:toX,y:toY}});
const ladder=(x,from=1,to=5)=>({x,from,to});
const definitions=[
  {name:'第一推',hint:'走到最左边的普通牌，向右推倒。开门牌要最后倒下，然后走进门。',player:{x:1,y:5},exit:{x:7,y:5},pieces:[n(2),n(3),n(4),t(5)],push:{x:2,y:5,dir:1}},
  {name:'补上缺口',hint:'把最右边的普通牌搬到中间的空位，再从左边启动连锁。',pieces:[n(1),n(2),n(4),t(5),n(7)],plan:[move(7,5,3)],push:{x:1,y:5,dir:1}},
  {name:'换个方向',hint:'把左侧落单的牌搬到开门牌右侧的空位，再从最右边向左推。',player:{x:8,y:5},exit:{x:0,y:5},pieces:[n(7),n(6),n(5),t(3),n(1)],plan:[move(1,5,4)],push:{x:7,y:5,dir:-1}},
  {name:'等一会儿',hint:'把带沙漏的延时牌搬进缺口。它会停顿一下，再继续传递。',pieces:[n(1),n(2),n(4),t(5),d(7)],plan:[move(7,5,3)],push:{x:1,y:5,dir:1}},
  {name:'门前的牌',hint:'只有消失牌可以放在门口。把它搬到门前，接起两边的骨牌。',exit:{x:3,y:5},pieces:[n(1),n(2),t(4),v(6)],plan:[move(6,5,3)],push:{x:1,y:5,dir:1}},
  {name:'一块小桥',hint:'从梯子绕过去，把搭桥牌搬到断口左侧。它向右倒下后会铺出一格桥。',platforms:[[1,0,8],[5,0,2],[5,4,8]],ladders:[ladder(0),ladder(8)],pieces:[n(1),n(4),n(5),t(6),b(7)],plan:[move(7,5,2)],push:{x:1,y:5,dir:1}},
  {name:'上下接力',hint:'把分叉牌放到上层断口正下方。上层骨牌落下，才会让它向两边展开。',player:{x:0,y:1},platforms:[[1,0,2],[5,0,8]],ladders:[ladder(0)],pieces:[n(1,1),n(2,1),n(2),n(4),t(5),s(7)],plan:[move(7,5,3)],push:{x:1,y:1,dir:1}},
  {name:'让出口等一等',hint:'交换左侧的延时牌和右侧普通牌，让出口这一边晚一点倒下。可借右侧空位暂存。',player:{x:0,y:1},platforms:[[1,0,2],[5,0,8]],ladders:[ladder(0)],pieces:[n(1,1),n(2,1),s(3),n(2),d(1),n(0),n(4),t(5)],plan:[move(4,5,7),move(1,5,4),move(7,5,1)],push:{x:1,y:1,dir:1}},
  {name:'过桥再开门',hint:'先把消失牌搬到门前，再把搭桥牌放在断口左侧。沿上层梯子绕行搬运。',exit:{x:5,y:5},platforms:[[1,0,8],[5,0,2],[5,4,8]],ladders:[ladder(0),ladder(8)],pieces:[n(1),v(2),n(4),t(6),b(7)],plan:[move(2,5,5),move(7,5,2)],push:{x:1,y:5,dir:1}},
  {name:'两边的节奏',hint:'出口在左侧。把右端的延时牌换到左侧中间，让右边先倒完。空位可以临时放牌。',player:{x:0,y:1},platforms:[[1,0,2],[5,0,8]],ladders:[ladder(0)],pieces:[n(1,1),n(2,1),s(3),n(2),n(1),t(0),n(4),n(5),d(6)],plan:[move(1,5,7),move(6,5,1),move(7,5,6)],push:{x:1,y:1,dir:1}},
  {name:'分头行动',hint:'上层两张特殊牌都要搬下来：搭桥牌放在右侧断口旁，延时牌放在左侧出口前。',platforms:[[1,0,2],[1,4,8],[5,0,5],[5,7,8]],ladders:[ladder(0),ladder(4),ladder(8)],pieces:[n(1,1),n(2,1),s(3),n(2),t(0),n(4),n(7),b(5,1),d(7,1)],plan:[move(5,1,5,5),move(7,1,1,5)],push:{x:1,y:1,dir:1}},
  {name:'最后一棒',hint:'把搭桥牌搬到左侧断口右边，并把延时牌换到分叉牌左边。可以借上层空位交换骨牌。',player:{x:2,y:5},platforms:[[1,0,3],[1,5,8],[5,0,0],[5,2,8]],ladders:[ladder(2),ladder(8)],pieces:[n(2,1),n(3,1),s(4),n(3),t(0),n(5),n(6),d(7),b(6,1)],plan:[move(3,5,0,1),move(7,5,3),move(0,1,7,5),move(6,1,2,5)],push:{x:2,y:1,dir:1}},
  ...advancedDefinitions,
];
export const chapters=['入门','进阶','挑战','大师','终局'];
export const levels=definitions.map((level,index)=>({
  width:9,height:7,chapter:0,player:{x:0,y:5},exit:{x:8,y:5},platforms:[[5,0,8]],ladders:[],plan:[],...level,
  id:index+1,pieces:level.pieces.map((p,i)=>({...p,id:`p${i}`})),
}));
