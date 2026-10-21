const guide=(play,limits,goal,goalTitle='怎么算赢')=>[
  {title:'怎么玩',text:play},{title:'规则与限制',text:limits},{title:goalTitle,text:goal},
];
export const games = [
  {id:'domino',name:'蚂蚁多米诺',tint:'#f0e4cb',summary:'搬好骨牌，只推一次；出口牌最后倒下，再走进门。',rules:guide(
    '点地面或骨牌，蚂蚁会自动沿平台和梯子走过去；也可滑动或用方向按钮。走到骨牌所在格，点“搬起”，走到空位再点“放下”。准备好后，走到起始牌上，选择向左或向右推倒。',
    '每次尝试只能主动推一次；蚂蚁走过骨牌不会推倒它。一次只能搬一张，出口牌不能搬，门口只允许消失牌。分叉牌只能由上方落下的牌启动；骨牌落到普通牌上会撞坏。失败可“回到摆放”，保留刚才的安排。',
    '所有骨牌都倒下或消失，且出口牌比其他牌更晚倒下，门才会打开；再让蚂蚁走进门才算过关。相同一刻倒下不算最后。骨牌图鉴可查看六种牌的作用。')},
  {id:'2048',name:'2048',tint:'#eee8d6',summary:'滑动合并相同数字，合出 2048 达标。',rules:guide(
    '向上下左右滑动，整盘数字一起移动。两个相同数字相碰会合成它们的和。',
    '每个数字在一次滑动中只能合并一次；有效移动后会出现一个新数字。无法移动时本局结束，可以撤销。',
    '合出 2048 即达成目标；达标后可以继续挑战更大的数字。')},
  {id:'twentyfour',name:'24 点',tint:'#f0e6d4',summary:'四张牌每张用一次，最后算出 24。',rules:guide(
    '点一张牌，选加、减、乘、除，再点另一张牌，把两张牌合成一张。也可以先选两张牌再选运算。',
    '四张原始牌都必须用，而且每张只能用一次。减法、除法按点选顺序计算；允许分数，不能除以 0。',
    '经过三次合并，只剩一张牌且数值恰好等于 24，即获胜。走错可以撤销或重来这副牌。')},
  {id:'link',name:'水果连连看',tint:'#e5ebdf',summary:'相同水果最多拐 2 次弯连起来，全部配完获胜。',rules:guide(
    '依次点两个相同的水果；如果能用一条符合规则的线连接，它们就会消除。',
    '连线只能横走或竖走，最多拐 2 次弯（3 段线）。不能穿过其他水果，可以绕棋盘外侧。',
    '消除全部水果即获胜。没有可配对组合时，会自动重新排列剩余水果。')},
  {id:'stars',name:'消灭星星',tint:'#e4e9e0',summary:'至少 2 颗相邻同色星星成组；尽量清盘得高分。',rules:guide(
    '点一组同色星星查看数量和得分，再点这组中的任意一颗消除。',
    '至少 2 颗，上下左右相邻才算一组；斜着相邻不算。消除后上方星星落下，空列向左收拢。',
    '这是计分游戏：一次消除越多，得分越高。没有可消除的组时本局结束；尽量清空棋盘，剩余越少，结算奖励越高。','目标与结算')},
  {id:'lights',name:'熄灯',tint:'#e6ebd8',summary:'点一格会翻转十字范围，把所有灯熄灭即获胜。',rules:guide(
    '点任意一盏灯，会同时翻转它自己和上下左右紧邻的灯：亮变灭，灭变亮。',
    '灭着的灯也可以点。边缘格只影响棋盘内的相邻灯，斜角不受影响；可以撤销，也可以查看下一步提示。',
    '让棋盘上的所有灯同时熄灭，即获胜。')},
  {id:'fifteen',name:'数字拼图',tint:'#e9e5db',summary:'数字滑入空格，排好 1—15，空格留在右下角。',rules:guide(
    '这是数字滑块拼图。点空格旁的数字，让它滑入空格；也可以滑动棋盘或按方向按钮。',
    '每次只能把上下左右紧邻空格的一块数字移入，不能斜着移动。箭头与滑动方向都表示数字移动的方向。',
    '从左到右、从上到下排成 1—15，最后一个空格留在右下角，即获胜。可点“目标排列”查看示意。')},
  {id:'pipes',name:'接水管',tint:'#e2eade',summary:'旋转管道，全部接通金色水源且没有漏口即获胜。',rules:guide(
    '点管道，让它顺时针旋转 90°。从中央金色水源开始，把管口与相邻管口接起来。',
    '已接通水源的管道会变绿，红点表示漏口。每个管口都要和相邻管口对上，不能朝向棋盘外侧。',
    '全部 25 格都连通水源，并且所有管口都没有漏口，即获胜。')},
  {id:'nonogram',name:'迷你数织',tint:'#e4eadf',summary:'根据行列数字涂出隐藏图案，全部涂对即过关。',rules:guide(
    '根据左侧和上方的数字涂格子；拖动可连续涂一行或一列。用“× 标空”记录确定不涂的格子。',
    '数字表示按顺序连续涂色的格数。例如“2 1”表示连续涂 2 格，至少空 1 格，再涂 1 格。各行、各列的提示都要同时满足。',
    '把隐藏图案的所有格子涂对，即过关。空格不必全部标 ×；一笔拖涂可以一次撤销。')},
  {id:'guess',name:'猜数字',tint:'#ece3da',summary:'猜 4 个不重复数字，得到 4A 即获胜。',rules:guide(
    '用数字键盘输入 4 个不同数字，再点“猜一下”。可以点某一位修改数字，也可以删除重填。',
    '可以以 0 开头。A 表示数字和位置都对，B 表示数字对但位置不对。例如 1A2B 表示一位完全正确、另两位位置不对；不告诉你具体是哪几位。',
    '四个数字及其位置都正确，得到 4A，即获胜。不限制猜测次数；根据每次 A/B 反馈逐步排除。')},
];
function miniGrid(values,extra=''){return `<div class="mini-grid ${extra}" aria-hidden="true">${values.map(([text,kind=''])=>`<span class="${kind}">${text}</span>`).join('')}</div>`;}
export function preview(id){if(id==='domino')return '<div class="mini-domino" aria-hidden="true"><i></i><i></i><i></i></div>';if(id==='2048')return miniGrid([['2'],['4'],['8','gold'],[''],['4'],['8','gold'],['16','mid'],[''],['8','gold'],['16','mid'],['32','filled'],[''],[''],['2'],['4'],['64','filled']]);if(id==='twentyfour')return '<div class="mini-cards" aria-hidden="true"><span>3</span><span>8</span><span>4</span><span>1</span></div>';if(id==='nonogram')return miniGrid('0101011111111110111000100'.split('').map(v=>['',v==='1'?'filled':'']),'five');if(id==='lights')return miniGrid(Array.from({length:25},(_,i)=>['',([0,2,3,6,7,10,12,14,17,18,21,24].includes(i)?'gold':'mid')]),'five');if(id==='link')return miniGrid(['🍋','🍓','🍇','🍐','🍇','🍋','🍊','🍓','🍐','🍇','🍋','🍊'].map(v=>[v]));if(id==='stars')return miniGrid(Array.from({length:16},(_,i)=>[['●','★','◆','✦'][i%4],['filled','gold','mid',''][[0,1,1,0,0,2,1,2,1,2,2,0,1,1,0,0][i]]]),'mini-colors');if(id==='fifteen')return miniGrid([['1','mid'],['2','mid'],['3','mid'],['4','mid'],['5'],['6'],['7'],['8'],['9'],['10'],[''],['12'],['13'],['14'],['11'],['15']]);if(id==='pipes')return miniGrid(['┌','─','┐','├','┐','│','└','┴','┘'].map(v=>[v]),'mini-pipes');return '<div class="mini-bulls" aria-hidden="true"><div><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span></div><div><span></span><span></span><span></span><span></span></div></div>';}
