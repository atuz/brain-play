export const games = [
  {id:'2048', name:'2048', tint:'#eee8d6', help:['滑动合并相同数字，目标是 2048。','可以撤销上一步。']},
  {id:'twentyfour', name:'24 点', tint:'#f0e6d4', help:['点数字 → 选运算 → 点另一张牌，两张牌自动合并。','也可以先选两张牌，再选运算。减法和除法按点选顺序计算。','四张牌都要用，最后留下 24。分数可以继续参与运算。']},
  {id:'link', name:'水果连连看', tint:'#e5ebdf', help:['配对相同水果，连接路径最多转两次弯。','路径不能穿过水果，可以绕棋盘外侧。']},
  {id:'stars', name:'消灭星星', tint:'#e4e9e0', help:['点至少两颗相邻的同色星星，一起消除。','一次消除越多，得分越高。']},
  {id:'lights', name:'熄灯', tint:'#e6ebd8', help:['点一格，会同时翻转自己和上下左右的灯。','让所有灯熄灭。']},
  {id:'fifteen', name:'数字华容道', tint:'#e9e5db', help:['点击空格旁的数字，排好 1—15。','空格最后留在右下角。']},
  {id:'pipes', name:'接水管', tint:'#e2eade', help:['点击管道旋转，让金色水源连通全部格子。','每个管口都要接上，不能有漏口。']},
  {id:'nonogram', name:'迷你数织', tint:'#e4eadf', help:['边上的数字表示连续涂色格的长度。','两组之间至少空一格；用 × 标记空格。']},
  {id:'guess', name:'猜数字', tint:'#ece3da', help:['猜四个不重复的数字，可以以 0 开头。','A：数字、位置都对；B：数字对、位置不对。']},
];
function miniGrid(values,extra=''){return `<div class="mini-grid ${extra}" aria-hidden="true">${values.map(([text,kind=''])=>`<span class="${kind}">${text}</span>`).join('')}</div>`;}
export function preview(id){if(id==='2048')return miniGrid([['2'],['4'],['8','gold'],[''],['4'],['8','gold'],['16','mid'],[''],['8','gold'],['16','mid'],['32','filled'],[''],[''],['2'],['4'],['64','filled']]);if(id==='twentyfour')return '<div class="mini-cards" aria-hidden="true"><span>3</span><span>8</span><span>4</span><span>1</span></div>';if(id==='nonogram')return miniGrid('0101011111111110111000100'.split('').map(v=>['',v==='1'?'filled':'']),'five');if(id==='lights')return miniGrid(Array.from({length:25},(_,i)=>['',([0,2,3,6,7,10,12,14,17,18,21,24].includes(i)?'gold':'mid')]),'five');if(id==='link')return miniGrid(['🍋','🍓','🍇','🍐','🍇','🍋','🍊','🍓','🍐','🍇','🍋','🍊'].map(v=>[v]));if(id==='stars')return miniGrid(Array.from({length:16},(_,i)=>[['●','★','◆','✦'][i%4],['filled','gold','mid',''][[0,1,1,0,0,2,1,2,1,2,2,0,1,1,0,0][i]]]),'mini-colors');if(id==='fifteen')return miniGrid([['1','mid'],['2','mid'],['3','mid'],['4','mid'],['5'],['6'],['7'],['8'],['9'],['10'],[''],['12'],['13'],['14'],['11'],['15']]);if(id==='pipes')return miniGrid(['┌','─','┐','├','┐','│','└','┴','┘'].map(v=>[v]),'mini-pipes');return '<div class="mini-bulls" aria-hidden="true"><div><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span></div></div>';}
