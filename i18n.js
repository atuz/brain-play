export const languages = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' },
];
let currentLanguage = 'zh-CN';
export const getLanguage = () => currentLanguage;
export function normalizeLanguage(value) {
  const code = String(value || '').toLowerCase();
  if (/^zh-(tw|hk|mo|hant)/.test(code)) return 'zh-TW';
  if (code === 'zh' || /^zh-(cn|sg|hans)/.test(code)) return 'zh-CN';
  return code.startsWith('en') ? 'en' : null;
}
export function setLanguage(code) { currentLanguage = normalizeLanguage(code) || 'en'; }

const english = {
  '目标排列':'Goal layout','进度只保存在当前浏览器。':'Progress is saved in this browser only.',
  '排好 1—15，空格留在右下角。':'Order 1–15. Leave the gap at the bottom right.',
  '箭头和滑动方向表示数字移动的方向。':'Arrows and swipes move the numbered tiles in that direction.',
  '重新开始？':'Start over?', '本局进度将重新开始。':'This round will start over.',
  '继续玩':'Keep playing','重新开始':'Start over',
  '点选闪亮的两个水果。':'Tap the two highlighted fruit.',
  '点选一组同色星星，再点一次消除。':'Tap a matching group, then tap again to clear it.',
  '试试闪亮的格子。':'Try the highlighted light.',
  '转动闪亮的管道，试着接通它。':'Rotate the highlighted pipe to connect it.',
  '转动管道接通水源，红点表示漏口。':'Connect pipes to the source. Red dots mark leaks.',
  '拖动连续涂格；切换 × 标空。':'Drag to fill a line. Switch to × to mark empty cells.',
  '拖动连续涂格；一笔可以一次撤销。':'Drag to paint a line. Undo reverses the whole stroke.',
  '下一关':'Next puzzle', '删除数字':'Delete digit','猜测记录':'Guess history',
  '小小动脑场':'Brain Play', '游戏':'Games', '设置':'Settings', '返回':'Back', '帮助':'Help', '完成':'Done',
  '游戏设置':'Game settings', '棋盘大小':'Board size', '玩法':'Mode',
  '经典':'Classic', '斐波那契':'Fibonacci', '经典 2048':'Classic 2048', '斐波那契 2584':'Fibonacci 2584',
  '每种玩法和尺寸分别保存进度与最高分。':'Each mode and board size keeps its own progress and best score.',
  '合并相邻的斐波那契数，例如 2＋3＝5、3＋5＝8。':'Merge consecutive Fibonacci numbers, such as 2 + 3 = 5 and 3 + 5 = 8.',
  '1＋1＝2，其他相同数字不能合并。目标是 2584。':'1 + 1 = 2. Other equal numbers cannot merge. Reach 2584.',
  '合并相邻的斐波那契数，目标是 2584。':'Merge consecutive Fibonacci numbers to reach 2584.',
  '达到 2584！你也可以继续挑战更大的数字。':'You reached 2584! Keep going if you like.',
  '2584 棋盘':'2584 board',
  '返回 App':'Back to app', '请使用 App 顶部的返回按钮。':'Use the back button at the top of the app.',
  '语言':'Language', '国家／地区代码':'Country / region code', '音效':'Sound', '动画':'Animations',
  '自动识别':'Detect automatically', '自动':'Auto', '国家代码需要两位英文字母，例如 CA。':'Use a two-letter country code, such as CA.',
  '使用浏览器语言中的地区，可手动修改。':'Uses your browser’s language region. You can change it.',
  '开始玩':'Play', '继续':'Resume', '跳到主要内容':'Skip to content', '关闭设置':'Close settings', '关闭帮助':'Close help',
  '游戏加载遇到了问题，请刷新页面后重试。':'Could not load this game. Please refresh.',
  '24 点':'Make 24', '水果连连看':'Fruit Link', '消灭星星':'Pop Stars', '熄灯':'Lights Out',
  '数字华容道':'Sliding Puzzle', '接水管':'Pipe Connect', '迷你数织':'Nonogram', '猜数字':'Bulls & Cows',
  '滑动合并相同数字，目标是 2048。':'Swipe to merge matching numbers and reach 2048.',
  '可以撤销上一步。':'Undo is always available.',
  '点数字 → 选运算 → 点另一张牌，两张牌自动合并。':'Tap a number, an operation, and another card to merge them.',
  '也可以先选两张牌，再选运算。减法和除法按点选顺序计算。':'You can also pick two cards first. Subtraction and division follow your selection order.',
  '四张牌都要用，最后留下 24。分数可以继续参与运算。':'Use all four cards and finish with 24. Fractions are allowed.',
  '配对相同水果，连接路径最多转两次弯。':'Match identical fruit with a path of at most two turns.',
  '路径不能穿过水果，可以绕棋盘外侧。':'Paths cannot cross fruit, but may go around the board.',
  '点至少两颗相邻的同色星星，一起消除。':'Tap a group of at least two matching stars.',
  '一次消除越多，得分越高。':'Larger groups score more points.',
  '点一格，会同时翻转自己和上下左右的灯。':'Tap a light to toggle it and its four neighbors.',
  '让所有灯熄灭。':'Turn every light off.',
  '点击空格旁的数字，排好 1—15。':'Slide tiles into the empty space to order 1–15.',
  '空格最后留在右下角。':'Leave the empty space at the bottom right.',
  '点击管道旋转，让金色水源连通全部格子。':'Rotate pipes to connect every tile to the gold source.',
  '每个管口都要接上，不能有漏口。':'Connect every pipe opening without leaks.',
  '边上的数字表示连续涂色格的长度。':'Edge clues give the lengths of filled runs.',
  '两组之间至少空一格；用 × 标记空格。':'Leave a gap between runs. Use × to mark empty cells.',
  '猜四个不重复的数字，可以以 0 开头。':'Guess four different digits. A leading 0 is allowed.',
  'A：数字、位置都对；B：数字对、位置不对。':'A: correct digit and position. B: correct digit, wrong position.',
  '撤销':'Undo', '新一局':'New', '提示':'Hint', '重置':'Reset', '得分':'Score', '本机最高':'Best',
  '步数':'Moves', '亮灯':'Lights on', '已归位':'In place', '旋转':'Turns', '已连通':'Connected',
  '已涂格':'Filled', '已猜次数':'Guesses', '本机解题':'Solved', '猜一下':'Guess', '剩余对数':'Pairs left', '已消除':'Matched',
  '独立完成':'Solved', '本局合并':'Merges', '发新牌':'Deal', '↶ 撤销':'↶ Undo', '↺ 重来':'↺ Reset',
  '✧ 提示一步':'✧ Hint', '⇄ 交换两张牌的顺序':'⇄ Swap order', '再来一局 →':'Play again →',
  '加':'Add', '减':'Subtract', '乘':'Multiply', '除':'Divide', '另一张牌':'another card',
  '四张牌，每张用一次':'Use each card once', '漂亮，正好 24！':'Exactly 24!',
  '计算过程 · 还没开始':'Steps', '每次合并的结果会记录在这里。':'Your merges will appear here.',
  '正在发牌…':'Dealing…', '两张牌正在合并…':'Merging…', '牌发好了。点数字 → 选运算 → 点另一张牌。':'Tap a card, an operation, then another card.',
  '先点一张牌，再选运算和另一张牌。':'Tap a card, an operation, then another card.',
  '先点一张牌，再选运算和另一张牌':'Tap a card, an operation, then another card.',
  '点一张牌，开始你的第一步':'Tap a card to start', '选一个运算符，把这两张牌合成一张。':'Choose an operation to merge these cards.',
  '再点另一张牌，就会按这个顺序合并。':'Tap another card to merge in this order.',
  '可以选运算，也可以再选一张牌。':'Choose an operation or another card.',
  '已撤销上一步，可以换个思路。':'Move undone. Try another approach.',
  '当前这一步之后算不到 24 了。撤销一步，再试一条路。':'This position cannot reach 24. Undo and try another route.',
  '四张牌，三次合并，完成！':'Four cards, three merges. Solved!',
  '漂亮！三次合并，正好 24。':'Well done! Exactly 24 in three merges.',
  '借助提示完成了这一局，下一局试试自己解出来。':'Solved with a hint. Try the next hand on your own.',
  '借助提示完成了，下一局试试独立解出来。':'Solved with a hint. Try the next hand on your own.',
  '不能除以 0，换一张牌或换个运算吧。':'Cannot divide by zero. Choose another card or operation.',
  '同一张牌不能使用两次。':'You cannot use the same card twice.', '先选择一个运算符。':'Choose an operation first.',
  '请选择加、减、乘、除中的一种运算。':'Choose addition, subtraction, multiplication, or division.',
  '这张牌已经合并过了，请选择桌上的牌。':'That card has already been used. Pick a card on the table.',
  '这个结果超出了计算范围。':'This result is too large.',
  '把相同数字合在一起，慢慢向 2048 前进。':'Merge matching numbers to reach 2048.',
  '没有可以移动的格子了，试试撤销或新开一局。':'No moves left. Undo or start a new game.',
  '达到 2048！你也可以继续挑战更大的数字。':'You reached 2048! Keep going if you like.',
  '滑动棋盘，或使用方向键 / WASD':'Swipe or use arrow keys / WASD',
  '点一下，会同时翻转自己和上下左右的灯。':'Tap to toggle a light and its four neighbors.',
  '已选中一个可以点击的格子；提示不会替你移动。':'The focused light is a possible next move.',
  '按从左到右、从上到下的顺序，排好 1—15。':'Arrange 1–15 in order, left to right, top to bottom.',
  '点击空格旁的数字，或用方向键移动空格':'Tap beside the empty space or use arrow keys',
  '点击管道顺时针旋转，让水源连通所有格子，且没有漏口。':'Rotate pipes to connect every tile without leaks.',
  '已选中一个方向不对的管道，试着转动它。':'The focused pipe needs rotating.',
  '找两个一样的水果，用不超过两次转弯的路径连接。':'Match identical fruit with a path of at most two turns.',
  '高亮的水果，可以和焦点框里的水果配对。':'Match the highlighted fruit with the focused fruit.',
  '暂时没有可消除的组合，已自动重新排列剩余水果。':'No matches remained. The fruit has been reshuffled.',
  '这两枚还连不上：路径最多转两次弯，途中不能有水果。':'No valid path: at most two turns, without crossing fruit.',
  '全部配对成功！再来一盘？':'All pairs matched! Play again?',
  '至少两个相邻的同色星星才能消除。':'Choose at least two adjacent matching stars.',
  '点击至少两颗相邻的同色星星，连成一组越大，分数越高。':'Tap a matching group. Bigger groups score more.',
  '数字表示连续涂色格的长度；两组之间至少留一格。':'Clues show filled runs. Leave a gap between runs.',
  '■ 涂色':'■ Fill', '× 标空':'× Empty', '选择数织关卡':'Choose a puzzle',
  '先猜一组数字，让线索慢慢浮现。':'Make a guess to reveal the first clues.',
  'A：数字和位置都对　B：数字对，位置不对':'A: correct digit and place. B: correct digit, wrong place.',
  '请输入四个不重复的数字，可以以 0 开头。':'Enter four different digits. A leading 0 is allowed.',
  '这一组已经猜过了，试试别的组合。':'You already tried these digits. Try another combination.',
  '四个数字互不重复。每次猜测都会得到 A / B 提示。':'Guess four different digits. Each guess gives A / B clues.',
  '输入四个不重复的数字':'Enter four different digits',
  '小小爱心':'Heart', '一棵小树':'Tree', '小房子':'House', '小帆船':'Sailboat', '一枚箭头':'Arrow',
  '菱形':'Diamond', '一杯热茶':'Tea', '一朵小花':'Flower', '空格':'Empty', '未标记':'Unmarked',
  '已涂色':'Filled', '标为空':'Marked empty', '未连通':'Disconnected', '亮':'On', '灭':'Off',
  '绿':'Green', '黄':'Yellow', '橙':'Orange', '蓝':'Blue', '紫':'Purple',
  '向上':'Up', '向下':'Down', '向左':'Left', '向右':'Right', '方向控制':'Directions',
  '2048 棋盘':'2048 board', '熄灯棋盘':'Lights Out board', '数字华容道棋盘':'Sliding puzzle board',
  '接水管棋盘':'Pipe board', '连连看棋盘':'Fruit Link board', '消灭星星棋盘':'Pop Stars board',
  '数织棋盘':'Nonogram board', '24 点牌桌':'Make 24 table', '桌上的数字牌':'Cards on the table',
  '选择运算':'Choose an operation', '本局完成':'Hand complete',
  '本机存储不可用，本次仍可继续玩':'Progress could not be saved, but you can keep playing.',
};

const traditionalPairs = [
  ['设置','設定'],['默认','預設'],['保存','儲存'],['提示','提示'],['本机','本機'],['界面','介面'],['重复','重複'],
];
const traditionalCharacters = Object.fromEntries(`设設 语語 国國 区區 码碼 动動 戏戲 数數 点點 连連 灭滅 华華 龙龍 织織 猜猜 简簡 体體 选選 运運 算算 张張 牌牌 这這 个個 为為 来來 发發 合合 并併 过過 关關 页頁 进進 度度 当當 前前 浏瀏 览覽 器器 自自 动動 识識 别別 写寫 处處 时時 间間 线線 传傳 递遞 阅閱 读讀 转轉 换換 复復 开開 够夠 获獲 得得 剩剩 余餘 对對 消消 还還 值值 样樣 录錄 验驗 护護 让讓 从從 顺順 负負 结結 果果 块塊 邻鄰 橙橙 蓝藍 绿綠 黄黃 树樹 热熱 杯杯 帆帆 花花 朵朵 箭箭 头頭 图圖 案案 爱愛 心心 复復 标標 记記 涂塗 长長 两兩 组組 计計 显顯 获獲 单單 级級 达達 到到 战戰 继繼 续續 边邊 缘緣 移移 换換 脑腦 脑腦 场場 声聲 音音 证證 误誤 试試 无無 解解 键鍵 盘盤 后後 台臺 确確 实實 准準 请請 检檢 查查 括括 号號 没沒 有有 给給 把把 闭閉 仅僅 式式 练練 习習 启啟 画畫 户戶 断斷 输輸 入入 待待 击擊 应應 注註 帐帳 号號 奖獎 励勵 层層 独獨 立立 与與 会會 侧側 储儲 内內 减減 参參 围圍 帮幫 弯彎 归歸 径徑 择擇 晓曉 暂暫 机機 条條 灯燈 游遊 种種 经經 绕繞 着著 载載 里裡 针針 销銷 闪閃 问問 题題 双雙 莲蓮 苏蘇 断斷 错錯 满滿 尝嘗 颗顆 总總 终終 局局 获獲 关關 胜勝 顶頂 笔筆 实實 测測 删刪 将將` .split(' ').filter(Boolean).map(pair => [pair[0], pair[1]]));
function traditional(text) {
  let result = text;
  for (const [a, b] of traditionalPairs) result = result.replaceAll(a, b);
  return [...result].map(char => traditionalCharacters[char] || char).join('');
}
const patterns = [
  [/^选中 (\d+) 颗，再点一次得 (\d+) 分。$/,m=>`${m[1]} selected. Tap again for +${m[2]} points.`],
  [/^第 (\d+) 位数字$/,m=>`Digit ${m[1]}`],
  [/^目标 (\d+)$/, m => `Goal ${m[1]}`],
  [/^滑动合并相同数字，目标是 (\d+)。$/, m => `Swipe to merge matching numbers and reach ${m[1]}.`],
  [/^达到 (\d+)！你也可以继续挑战更大的数字。$/, m => `You reached ${m[1]}! Keep going if you like.`],
  [/^计算过程 · (\d+) 步$/, m => `Steps · ${m[1]}`],
  [/^已合并 (\d+) 步，共 3 步$/, m => `${m[1]} of 3 merges complete`],
  [/^(.+) 已选好，再点另一张数字牌。$/, m => `${m[1]} selected. Tap another card.`],
  [/^合成了 (.+)，还剩 (\d+) 张牌。$/, m => `Made ${m[1]}. ${m[2]} cards left.`],
  [/^最后是 (.+)，还没到 24。撤销一步，再试一种运算。$/, m => `The last card is ${m[1]}. Undo and try another operation.`],
  [/^最后是 (.+)。点「撤销」换个思路，或重来这副牌。$/, m => `The last card is ${m[1]}. Undo or reset this hand.`],
  [/^试试 (.+)。再点闪亮的那张牌完成这一步。$/, m => `Try ${m[1]}. Tap the highlighted card to merge.`],
  [/^全部熄灭！用了 (\d+) 步。$/, m => `All lights off in ${m[1]} moves!`],
  [/^排列完成！用了 (\d+) 步。$/, m => `Solved in ${m[1]} moves!`],
  [/^所有管道都连通了！用了 (\d+) 次旋转。$/, m => `All pipes connected in ${m[1]} turns!`],
  [/^消除了 (\d+) 颗星星，获得 (\d+) 分！$/, m => `${m[1]} stars cleared. +${m[2]} points!`],
  [/^本局结束！剩 (\d+) 颗星星，最终得分 (\d+)。$/, m => `Game over. ${m[1]} stars left. Score: ${m[2]}.`],
  [/^图案揭晓：(.+)。完成了！$/, m => `Picture revealed: ${translate(m[1], 'en')}. Solved!`],
  [/^猜中了 (\d+)！你用了 (\d+) 次。$/, m => `You found ${m[1]} in ${m[2]} guesses!`],
  [/^第 (\d+) 关$/, m => `Puzzle ${m[1]}`],
  [/^数字 (\d+)$/, m => `Tile ${m[1]}`],
  [/^第(\d+)张牌：(.+?)(?:，来自(.+))?$/, m => `Card ${m[1]}: ${m[2]}${m[3] ? ', from ' + m[3] : ''}`],
  [/^第(\d+)行第(\d+)列，水源，(.+)$/, m => `Row ${m[1]}, column ${m[2]}, source, ${translate(m[3], 'en')}`],
  [/^第(\d+)行第(\d+)列，(.+)$/, m => `Row ${m[1]}, column ${m[2]}, ${translate(m[3], 'en')}`],
  [/^第(\d+)行第(\d+)列 (.+)$/, m => `Row ${m[1]}, column ${m[2]}, ${translate(m[3], 'en')}`],
  [/^第(\d+)(行|列)提示 (.+)$/, m => `${m[2] === '行' ? 'Row' : 'Column'} ${m[1]} clue: ${m[3].replaceAll('、', ', ')}`],
  [/^(.+)色星星$/, m => `${translate(m[1], 'en')} star`],
];
export function translate(value, language = currentLanguage) {
  const text = String(value ?? '');
  if (language === 'zh-TW') return traditional(text);
  if (language !== 'en') return text;
  if (english[text]) return english[text];
  for (const [regex, render] of patterns) {
    const match = text.match(regex);
    if (match) return render(match);
  }
  return text;
}
export const t = translate;
