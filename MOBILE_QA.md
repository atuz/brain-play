# Mobile interaction review — 2026-10-20

## Reference research

The references informed behavior and sequencing. No third-party code, graphics, levels or game resources were copied.

| Reference | Observed / reviewed | Applied here |
| --- | --- | --- |
| [Original 2048](https://play2048.co/) | Actually played moves and a merge; movement, merge feedback, score change and new tile follow a clear sequence. | Track every source tile to its destination; animate only merge results and the spawned tile; queue short bursts of input. |
| [15 Puzzle Online](https://15puzzleonline.com/) | Actually tapped an adjacent tile and undid it; neighboring-tile operation and an explicit ordered goal. | Tap and swipe; arrows describe numbered-tile direction; highlight movable neighbors and provide a compact goal diagram. |
| [Bulls and Cows](https://www.bullsandcowsgame.com/index.html) | Actually entered four digits on the page keypad and submitted; grouped clues avoid revealing which digit is correct. | Four editable slots, large keypad, no duplicate digits, delete, draft restoration and grouped A/B feedback. |
| [Pipe Puzzle](https://pipepuzzle.games/) | Actually rotated a tile and used the visible hint. | Quarter-turn animation, newly connected flow feedback, visible hints and red marks on leaking ends. |
| [Nonograms.org](https://www.nonograms.org/nonograms/i/69023) | Reviewed the live puzzle and its fill/empty, clue-crossing and completed-line controls. Its full desktop interface is deliberately not reproduced. | Two compact paint modes, row/column strokes, one undo per stroke and clue completion feedback. |
| [MathPG Lights Out](https://mathpg.com/lights-out-game/) | Reviewed the live interface and its documented cross-shaped influence, undo and visible hint. | Center/neighbor pulse, persistent hint ring and immediate playable state after each tap. |
| [Simon Tatham Same Game](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/samegame.html) | Read the creator's instructions: preview a group, confirm removal, gravity, then empty-column closure. Other pages on this host failed to load; not claimed as browser-played. | Group/score preview, two-tap confirmation, disappearance, then downward and leftward movement. |
| [WebGamePlus Make 24](https://webgameplus.com/games/24-game/) and [QuickenBrain](https://quickenbrain.com/en/twenty-four) | Compared during the earlier card interaction work; one-card/op/other-card and two-cards/op patterns, undo and fractions. | Retain both selection orders and original dealing/merging visuals; add progress-loss confirmation and verify cancellation. |

Fruit Link uses the same selected → visible operation → removal principle; its route is drawn from this project's actual two-bend path solver, including routes outside the board.

## Browser checks completed

Phone layout: 390 × 844. Additional English layout checks: actual 320 × 740 viewport for all nine games; no horizontal overflow or untranslated Chinese in the game content. Simplified Chinese, Traditional Chinese and English checked through the actual settings UI. Animation-off mode exercised through global settings.

- Sliding Puzzle: numbered-tile directions, a real board drag, four rapidly queued arrow keys, four undos restoring the exact original board, edge buttons, expanded goal, restart cancellation and exit during motion. Four rapid inputs increased the move count by exactly four; no ghosts remained after exit.
- 2048 / 2584: sliding and merge/spawn sequencing, short input queue, undo, classic 4 × 4 and Fibonacci 5 × 5, separate variant restoration. Other sizes/modes are covered by engine property checks. Changing settings retains variant progress.
- Fruit Link: actually completed all 18 pairs; checked an outside-border route, both-fruit hints and undo after completion. Fixed path geometry so selected-tile transforms cannot distort the route. No-match shuffle retains holes.
- Pop Stars: selected a group of four, previewed 80 points without changing the score, confirmed removal, and undid to the exact previous board. Then played 18 groups to a terminal board with nine remaining tiles and final score 1355, including the remaining-tile bonus.
- Lights Out: a top-row tap changed exactly indices 0, 1, 2, 6; undo restored the exact light state. Followed hints to complete the board in 14 moves.
- Pipe Connect: rotation undo restored every arm orientation; followed visible hints to connect all 25 pipes in 26 turns. Final leaking-end marker count was zero.
- Nonogram: dragged five cells in a row; one undo removed the whole stroke; dragged five empty marks; completed the heart using tap, keyboard and drag, with all ten clue lines complete. Supports restoring a stroke that reached completion immediately before leaving the page.
- Bulls & Cows: persisted a partial draft across reload, edited a selected position, prevented duplicate digits and checked deletion position. Solved one round using only displayed A/B feedback; verified record increment, replay and keypad removal on completion.
- Make 24: dealt cards, merged through a visible hint, canceled a new deal without losing progress, undid to four cards, and completed three exact merges to 24.

Browser automation was briefly interrupted by a stale viewport capability. It was restored, and viewport size was explicitly read back before the 320 px checks. No failed or interrupted batch is counted as a passed check.

## Automated checks

`npm test`: 32 tests, including all original rules and new directional, tile-trace, collapse-identity, shuffle-hole and stroke checks. `npm run check`: static syntax and local module paths.

Tests validate all four movement directions, three merge-board sizes and both rulesets. Every surviving tile occurs once in a movement trace, merged totals agree with the resulting board, and each destination receives at most two source tiles. Original nonogram clue uniqueness tests still pass.

## Scope

This release changes the web games. It does not add an offline game cache or alter the native iOS bridge. Browser interaction checks are mobile-viewport checks, not a claim that every game was tested on physical iOS and Android hardware.


## Rules and goals follow-up

Every game now has a persistent, tappable one-sentence rule above the board. The full guide has separate controls, restrictions and victory sections; Pop Stars instead explains its score-based ending. Fruit Link explicitly allows at most two turns / three straight segments, disallows crossing fruit, permits outside-border paths and requires clearing every pair. Hints no longer replace the persistent rules.

The numbered sliding game is called “数字拼图” / “15 Puzzle” to distinguish it from classic Cao Cao Huarong Dao. Game rules and saved-state identifiers are unchanged. Merge-game help follows the selected size/mode, including the 512 target on a classic 3 × 3 board and the Fibonacci sequence, special 1 + 1 rule and 2584 goal.

Validated English translations for all 114 static and variant rule/name strings. Opened every guide in the browser; verified each has instructions, constraints and a stated goal or score-ending condition.

Follow-up UI validation: opened all nine guides in Simplified Chinese, Traditional Chinese and English. At 320 × 740, English dialogs fit within the viewport with no horizontal overflow; each guide contains three sections. Verified the 3 × 3 classic 512 target and Fibonacci sequence/2584 target through the actual game settings. Fruit Link’s persistent rule remains visible after requesting a hint. No browser warnings or errors during these checks.

## 蚂蚁多米诺（v12）

- 12 个原创固定关卡的记录解法：逐步执行实际行走、搬起、放下与一次推动；全部开门且出口可达。交换骨牌遍历顺序后结果一致。
- 规则回归：出口与其他牌同时倒下不算最后；延时改变两侧先后；分叉只接受从上方落牌；普通牌被落牌击中会撞坏；搭桥支持左右方向、真实补地面并让人物通过。
- 390×844 页面实测：第一关推倒、走进门才获胜，通关后撤销；第二关失败反馈、保留摆放重试、搬牌携带状态刷新恢复；第六关绕梯搬搭桥牌、启动连锁、从新桥走过进门；第七关上下层搬运与落牌分叉。
- 320×740 英文界面：无横向溢出，无中文遗漏，按钮可见；繁体界面与图鉴／帮助文本均有翻译。方向按钮至少 44×44 CSS px。
- 开启动画后查看人物走动、骨牌依次倒下和搭桥；播放中取消能回到原摆放，播放中刷新可恢复已完成的连锁结果。关闭动画也能执行同样规则。
- 本机存储校验：拒绝缺牌、重复牌、移动的出口牌、非法人物位置；允许已铺桥上的人物位置恢复。12 关的提示针对初始布置，不是运行时任意局面求解。
- 验证环境为桌面浏览器的手机尺寸预览；这次没有安装 App 或连接实体手机测试。

- 换关时先取消旧坐标的过渡，强制完成新舞台布局后恢复行走动画；已实测单层→双层关卡，人物与平台立即位于新关卡坐标，无需刷新。

## 第 7 关失败反馈与开门关系（v13）

- 复现用户截图：将蓝色分叉牌由下层第 8 列移至第 4 列，再将上层第 2 列黄牌移到下层第 2 列；从上层第 3 列向右推。全部牌已倒，但下层该黄牌与开门牌的完成时间相同。现在返回独立的 tie 原因，并标记这两张牌。
- 棋盘正下方直接显示失败原因；刷新后的失败局面也重算并显示原因。区分同刻、提前、未倒和撞坏，保留原判定与保存局面。
- 红色 ≡ 改称开门牌，并标注“机关”；门标注“出口”。规则明确其远程控制关系，开门后显示虚线信号，不要求骨牌接到门口。
- 新的下一步提示从当前摆法导向已验证的参考布局，可提示临时存牌、搬起、放下、起推位置和方向。普通牌可互换；不会自动重置玩家摆法，也不承诺最短解。
- 回归测试执行截图中的合法操作、确认 tie 与两个标记 ID；从这份失败布局按提示修正后可开门。额外检查全部 12 个初始布局及 96 个合法随机摆法（包括携带牌状态与交换循环），每一步提示均合法且最终开门、出口可达。
- 390×844 浏览器实际操作：重建截图中的失败局面，确认两个“同刻”标记与常驻原因；仅依据页面可见的提示、框选格和按钮修正该局面，启动连锁并走进远处的门，页面显示“连锁完成！”。
- 320×740 英文及繁体中文提示与远程开门说明正常；英文页面无中文残留，两种语言均无横向溢出。测试为浏览器的手机尺寸预览。

## 本地待发布：骨牌比例与站位

- 蚂蚁停在所选牌旁的半格空隙；边缘优先选择有地面的另一侧，梯子中段仍保持居中。逻辑坐标和旧存档格式保持兼容。
- 骨牌高 1.12 格、宽 0.24 格，绕倒下方向的底角转动；约 43° 时接触相邻牌，再继续落平。接触段与模拟的 200ms 一拍一致。分叉牌用左右两半同时展开；延时牌先停顿，再接触并平滑落地。
- 棋盘使用不可滚动的裁剪，换关时清零内部偏移，避免聚焦按钮或关卡高度变化把上层平台裁掉。分叉牌装饰只作用于棋盘骨牌，且不接收点击。
- 390×844 实际操作检查：第一关向右连锁；第三关搬牌后向左连锁开门；第四关搬延时牌、停顿后接触与落地、开门；第七关搬分叉牌、上层落牌与双向展开开门。
- 320×740 与 390×844：蚂蚁位于上层两张牌之间，无横向溢出；单层与双层切换后内部滚动偏移均为零。浏览器没有 warning/error；测试仍为桌面浏览器的手机尺寸预览。
- 提前倒下与同时倒下的失败提示统一为“开门牌必须最后一个倒”，英文与繁体同步。本批先保留本地，未 push。

## 本地待发布：36 关与大场地（2026-10-21）

- 保留原 12 关及索引，新增 24 个固定关卡，五章场地从 9×7 到 13×13、17×17、21×21、25×25。新增关卡从三层接力增加到六层，包含断桥、落牌分叉、延时先后和多步交换。允许自由搬牌和多种解法。
- 全部 36 关逐步执行记录解法：行走、搬起、放下、一次推动，全部能开门且出口可达。新增关卡把延时牌改成普通牌后仍会全部倒下，但开门牌先倒或同刻，验证时序问题真实存在。
- 提示回归覆盖 36 个初始局面与 288 个合法随机打乱局面（含携带牌），每一步均合法、最终能开门。大关卡的提示共用一次可达区域遍历，避免逐牌重复寻路。
- 镜头单测：四边边界、全景居中、围绕触点缩放、人物安全区跟随。390×844 实际拖动最大关卡的镜头，确认未误走路、未搬牌；反向拖回、放大、全景和 ◎ 定位正常。跨多层自动走到最下层后，定位能显示人物。
- 从第 13 关初始局面，仅按页面可见提示完成跨层搬运、临时存牌、交换、推倒、开门和走进出口，页面显示“连锁完成！”。播放过程中镜头随连锁移动，原先的撤销和回到摆放仍可用。
- 320×740 英文选择器包含五章与 36 关，无中文残留；最大场地全景和按钮无横向溢出，视角按钮至少 44×44。繁体关卡名、反馈与视角标签正常。
- 小场地回归：第一关向右滑动只移动一格，视角工具隐藏，点按与方向按钮仍按原方式操作。
- 双指缩放已接入指针事件；本次验证了缩放数学、按钮和鼠标拖动，测试环境仍是桌面浏览器的手机尺寸预览，没有宣称实体手机上的多点触控已测。
- 用户当前的 127.0.0.1 试玩进度与 QA 的 localhost origin 分开；不修改原版资源，不发布本批变更。

## 大场地上下移动的镜头跟随修复（2026-10-21，本地）

- 拖动或缩放地图会暂停跟随；原先移动人物不会恢复跟随，导致人物可以走出视口。现在合法行走和启动连锁均恢复跟随，保留玩家当前的缩放比例；停着查看地图时仍可自由拖动。
- 新增挂载镜头回归测试，覆盖放大进入手动模式、静止时保持视角、恢复后向下和向上跟随。全套 83 项测试通过，静态检查通过。
- 390×844 实际操作：最大关卡第 3 行第 4 列放大，再按页面“向下”连续走到第 22 行；镜头自动下移，人物保持可见。拖动地图后，用键盘 ArrowUp 连续返回第 3 行，模式恢复 follow，人物仍在视口内。浏览器无 warning/error。
- 试玩进度仍与 localhost QA 隔离，本次修复没有 push。

## 本地待发布：角色动作重做（2026-10-21）

- 独立绘制矢量蚂蚁：四条行走腿、两条工作臂、分节身体、眼睛高光、触角和围巾。空手行走有交替迈步和摆臂；爬梯使用单独的手脚动作，抱牌爬梯保留一臂扶牌。没有使用参考游戏的图像或程序。
- 携带牌为与地面骨牌相当尺寸的独立 SVG，位于身体前侧并与手对齐。搬起约 400ms、放下约 360ms，地面与手中的骨牌只有一个可见归属；按当前镜头矩阵计算转移位置，左右朝向和缩放均适用。
- 推牌先伸手约 230ms，接触后才启动原有连锁模拟，再有约 300ms 收手恢复。约 480ms 的缩入门动画结束后才记录获胜；通关后撤销会恢复人物。
- 一步行走约 180ms、爬梯约 220ms，自动寻路连续播放。动作进行中只缓存最近一次方向/目的地，避免快速输入让角色瞬移；撤销、重开、换关和离开页面会取消旧动作，防止旧回调覆盖新状态。存档格式与关卡规则保持兼容。
- 390×844 实际操作：第二关取牌过程中撤销（观察到 take 状态），再次取牌、搬到缺口、放下、向右推动、进门获胜、撤销恢复。第三关左向取牌、搬运、左向推动、进门获胜。
- 通过键盘 Enter 触发推牌并在 reach 阶段按 Z 撤销，确认未启动连锁；开始连锁后撤销并立即搬牌也保持 arrange 状态，没有迟到的推动回调。
- 从首页关闭动画，再完成第三关放牌、推动和进门，均正常且没有等待动画的死锁；随后恢复动画设置。所有测试偏好和进度均使用隔离的 localhost origin。
- 320×740 英文窄屏无横向溢出；第 7 关左边界的角色保持完整。最大关卡抱牌下梯，再放大到 2 倍并向上移动，镜头为触角、双脚及携带牌保留更大安全区。爬梯经过中间平台时人物保持在梯子中线，不左右摆移。
- 新增角色取消/后续动作隔离、减少动画模式、窄视口高缩放跟随测试。完整 86 项测试通过。验证仍为桌面浏览器的手机尺寸，没有宣称实体手机性能/触控已测。
- 更新相关入口与动作资源的本地缓存版本，避免刷新后继续执行旧脚本。本批没有 commit 或 push；开发服务器继续用于本地试玩。
# App 返回时存档（2026-10-21）

- 网页存储回归：十个固定游戏编码、2048 六种独立组合、每日局面、撤销历史、成绩及设置往返恢复；旧 WebView 存档首次迁移，已有原生存档优先；导出仅限游戏数据。
- 独立本地 App 模拟页面实测：数字拼图走一步，传输仍为 0；返回首页变为 1 次；再次进入后续玩到第 2 步，返回 App 变为 2 次；重新打开恢复第 2 步。再走第 3 步直接刷新，恢复上次返回的第 2 步，符合不抢救突然关闭的要求。
- 普通浏览器保持 localStorage 保存；不向 App 逐步发消息，不增加保存确认。
- iPhone 11 hosted XCTest：7/7 通过，含真实 WK documentStart 注入 → close 消息 → 写盘 → 新 WebView 读回 → 原生备用按钮保存；另检查非法来源、子 frame、错误编码、超限数据和写入失败保留旧档。结果包 `/tmp/brain-play-save-iphone11-20261021-r2.xcresult`。测试文件均在临时目录，未覆盖用户存档。
- 现有正式站“网页按钮返回 App”实际界面回归另 1/1 通过（`/tmp/brain-play-save-ui-iphone11-20261021.xcresult`），新协议与旧网页兼容。网页改动未 push，App 新包已在 iPhone 11 安装，测试后普通启动。

# 骨牌场景背景（2026-10-21）

- 新增独立的原创 SVG 庭院、工坊、港口游船、高楼城市和遗迹远景。港口 13–18 关、城市 25–30 关各有白天与傍晚两种配色。装饰层 aria-hidden，且 pointer-events 为 none，不进入棋盘点击层。
- 390×844 实际检查第 13、25、28 关：游船和高楼完整显示；点按地面及方向按钮可以移动人物。地图拖动改变棋盘 transform；连续放大后，远景边界仍为同一个 330×294.5 像素矩形。全景中完整关卡仍可辨认。
- 320×740 检查第 36、7、1 关，遗迹、工坊、庭院均显示正常，人物未被远景裁剪；手机未出现横向溢出。电脑默认视口也检查了港口和相机工具栏。
- 首页关闭动画后，实际读取云层和船身的 computed animationName 均为 none；测试结束恢复原动画设置。检查页无控制台 error。
- 静态检查 31 个文件通过；36 关通关方案和相机相关检查共 37/37 通过。用户预览独立于测试页，刷新后读取到最新保存的第 35 关、第 19 行第 9 列局面。本批仍在本地，未 commit / push。

# 骨牌立体材质与倒下后的搭靠（2026-10-21，本地）

- 棋盘、手中和图鉴中的骨牌共用带侧面厚度、倒角、高光与凹刻符号的原创 SVG；分叉牌展开后的两半同样具有厚度。地面柔影与侧面阴影随倒下方向呈现。
- 倒牌按相邻牌的姿态计算搭靠角度；连续一排的末张平放，前面各张约为从直立转过 76–78°，牌尖搭在下一张上。先倒的牌具有更高的绘制层次；棋盘牌层整体仍低于人物和点击层。分叉左右半片独立计算，缺口、其他楼层、消失牌及下落牌不会充当支撑。
- 新增 5 项搭靠几何测试，覆盖左右接触、排列顺序无关、输入不变、无效支撑、分叉及连锁中途的姿态。连同角色动作和关卡回归共 54/54 通过，包含 36 关实际合法操作的记录解法。静态检查 33 个文件通过；未改变游戏规则或存档格式。
- 390×844 隔离测试页实际完成第 1 关右向连锁、第 3 关搬牌后的左向连锁、第 7 关落牌分叉，三关均开门并走入出口通关；查看叠压、倾角和遮挡。控制台没有 warning/error。验证为桌面浏览器手机尺寸预览，本批未 commit / push。

# 按章节统一场景（2026-10-21，本地）

- 每章固定一种远景和光照：入门 1–12 庭院、进阶 13–18 工坊、挑战 19–24 游船港湾、大师 25–30 傍晚城市、终局 31–36 古代遗迹；取消入门中途换景及港口／城市章内的日夜切换。选关标题共用同一份场景配置，简体、繁体、英文均显示场景名。
- 同步第 18、22、24 关的场景相关名称；关卡顺序、布局、通关方案和存档编号不变。移除关卡定义中未使用的旧 theme 字段，避免存在两套主题映射。
- 核对全部 36 关的场景与光照配置。390×844 浏览器实际切换第 7、12、13、18、19、24、25、30、31、36 关，确认章内一致、章间切换。320×740 英文选关无横向溢出，繁体五章场景名正常；控制台无 warning/error。
- 静态检查通过，现有完整英繁翻译检查通过。本批未 commit / push，用户原试玩进度保留，4173 开发服务器继续运行。

# 机关工坊首版（2026-10-21，本地）

- 在已有合集加入 `machine`，存档编码 `g011`。7 个原创固定关卡、25 种道具及连接工具、3 种场景与自由实验；未复制 The Incredible Machine 的美术、源程序或关卡。Matter.js 0.20.0 随站点提供，保留 MIT 许可。
- 390×844 浏览器实际完成全部 7 关：第一关点放斜坡；第三关从道具箱拖入风扇；第四关手动连接电动机与传送带；第五关断开并重接吊桶与灯。其余关使用参考摆法，实际播放弹床反弹、发射破碎及点火升空。验证拖动、15° 旋转、翻转、撤销、暂停／继续、慢放、返回与刷新恢复。
- 320×667 English 检查首页入口、自由实验、分类、横向道具箱与完整玩法；documentWidth = 320，无横向溢出，短屏允许纵向滚动，运行栏保持可见。1280×900 检查繁体界面与已存关卡恢复。语言仅从首页设置切换，结束时恢复简体中文。
- 通关横条避开主要目标，机关继续运行 3 秒；返回摆放保留运行前的草稿。绳索只承受拉力，松弛时不会推开端点或触发拉绳机关；气球向上拉紧同样可以触发。断开的绳子解除实际约束，场地底部承接掉落物体。
- 18 项机关专项测试覆盖所有参考解法、空布局失败、固定步长与重置、动力闭环不自启动、齿轮换向、风箱、剪绳、地面碰撞、松绳／拉紧、一次发射、光照及点火、存档验证、三种语言与 App 编码恢复。测试为桌面浏览器的手机尺寸预览，本次未安装到真机。
- 全部工作保留在本地，未 commit / push。用户试玩使用 localhost 的首关入口，与 127.0.0.1 上的机关 QA 通关记录分开；既有游戏存档保留。
- 最终全站测试 113/113 通过，静态检查 40 个文件通过。宽屏使用右侧道具箱，手机使用底部道具箱；666×867 预览中首关场地、道具和运行栏同时可见。最终 localhost 页面启动后没有新增控制台 error。

# 机关工坊长场地拖放（2026-10-21，本地）

- 自由实验扩大到 1440×900，首批 7 个关卡保留原尺寸与物理解法。世界边界、放置验证、背景与地面碰撞共同读取关卡尺寸；视口内滚动不改动物理比例。
- 画布与点击层在同一个可滚动世界中。拖道具到边缘会自动平移，四角同时移动两个轴；越靠边越快。工具刚从道具箱经过边缘时有短暂缓冲，防止无意带动镜头。原有道具从场内拖到边缘时可直接续拖；指针停住仍会继续滚动，松手或取消后停止。返回摆放保留原草稿。
- 空白处支持手动平移，运行中也可以查看远处；“全景”查看整个场地，“近看”回到此前位置。各关与自由实验的视图中心、全景状态与草稿一同保存，恢复时拒绝越界或损坏的镜头数据。
- 666×867 实测从道具箱向右缘放入小球，场地 scrollLeft 从 0 增至 9，页面 scrollY 始终为 0；右下角同时增加横纵偏移。390×844 实测原有道具拖到右下、左上、左下、右上四角，滚动方向均正确，页面位置在各次拖动前后保持不变。松手后读取的世界坐标与落点一致；刷新后镜头偏移恢复为同一值（142,126），全景状态也能恢复。
- 新增 6 项相机／大场地测试，覆盖四角持续滚动、速度渐变、帧率无关、边界钳制、固定指针下世界坐标变化、全景比例、远端放置／落地、镜头存档。机关与相机专项共 24/24，全站 119/119 通过，静态检查 41 个文件通过。验证使用桌面浏览器的手机尺寸预览，未进行本轮真机安装，未 commit / push。

# 机关工坊弹床方向（2026-10-21，本地）

- 修正弹床横向弹力与画面倾角相反的问题：按床面法线反弹，并保留切向运动；碰到侧面、背面或正在离开床面的物体不会获得额外弹力。新增弹床默认水平，选中与拖放预览显示弹力箭头。第二关参考摆法改为右端低 15°，接球杯位置随正确反弹轨迹校准；简繁英文提示同步。已有用户草稿与通关记录保留。
- 新增两项物理回归测试，实际模拟 −30°、−15°、0°、15°、30° 的出射速度与后续位移，核对左右镜像、切向运动、侧面／背面及离开床面的接触。机关与相机专项 26/26，全站 121/121 通过，静态检查 41 个文件通过。
- 390×844 独立浏览器存档实测旋转按钮：−15° 箭头朝左上且实际轨迹向左；0° 箭头竖直且实际轨迹无横向偏移；15° 向右弹入杯中并显示“机关成功”。测试结束回到 localhost 原试玩存档，未覆盖用户草稿。验证为桌面浏览器手机尺寸，未 commit / push。

# 机关工坊全部道具复查（2026-10-21，本地）

使用 `machine-parts.test.js`、`dev/machine-cases.js` 和独立的 `dev/machine-audit.html`。逐项核验使用游戏的实际引擎与 Canvas 绘制；页面不读写存档。新增 47 项测试，包含全部 25 种道具／连接工具的合法摆放、保存／重置与 30 秒稳定运行，以及正反方向、实际接触、持续运行、停止或损坏的专项场景。整个网站 168/168 测试通过，42 个静态文件检查通过。

| 道具 | 已复查行为与边界 |
| --- | --- |
| 小球 | 重力、滚动、碰撞反弹、平台落稳、存档恢复 |
| 重球 | 重力、较大质量、碰撞反弹、平台落稳 |
| 气球 | 上浮、左右风力、椭圆顶部与天花板接触、拉绳 |
| 吊桶 | 下落、拉紧绳索、保持悬挂、剪断后释放 |
| 平台 | 承接、落稳、旋转与斜面一致的点击区域 |
| 斜坡 | 正反倾角滚动、旋转、实际落杯 |
| 弹床 | 五种倾角、左右镜像、水平反弹、双球同时接触、侧面／背面不加力、床面形变 |
| 电源开关 | 顶部实际接触后锁定供电；有空隙或从下方撞击不启动 |
| 风扇 | 供电启动、前方吹风、翻转、无电停止、叶片与风线 |
| 风车 | 风力启动、转轴与皮带输出、失去风力停止且保留相位 |
| 发电机 | 转轴输入供电、断源停电、无输入的闭环不能自行启动 |
| 电动机 | 供电、翻转、反向动画、输出到皮带、相反驱动冲突停转 |
| 齿轮 | 相邻反转、三级传动、奇数闭环锁死、故障标记 |
| 传送带 | 电动机／传送带翻转的四种组合、只带动接触上表面的物体、空隙及底面不带动、停转不跳纹理 |
| 拉绳灯 | 拉紧点亮、持续发光；未连接或绳索松弛不启动 |
| 太阳能板 | 近处光源供电、远处或熄灭的光源不供电、随光源停止 |
| 放大镜 | 朝向选择、预热、光束中断清零、两片镜子不能重复累计同一帧的加热时间 |
| 蜡烛 | 连续聚光点燃、火焰、风吹熄灭、冷却与持续加热后重新点燃 |
| 小火箭 | 连续预热、一次点火、尾焰、向上飞行、穿环、离场后停止燃烧及物理运动 |
| 鱼缸 | 真实快速撞击破碎，邻近或缓慢物体不误触发；破片与水面状态 |
| 风箱 | 正反方向的上方把手按压、压缩动作、一次喷气、不能被附近物体隔空启动 |
| 弹丸发射器 | 拉绳、左右一次发射、闪光、5px 弹丸碰撞形状、墙体阻挡、碰撞后不重新获得发射速度 |
| 剪刀 | 实际接触后闭合、仅剪到刀口附近的绳索、一次触发、解除实际绳索约束 |
| 皮带 | 两点连接、传动方向、实际轴心挂接、不兼容／重复／自身／超距连接拒绝、断开和撤销 |
| 绳索 | 实际挂点、松弛与拉紧、只能承受拉力、连接限制、剪断、删除端点与撤销 |

- 修复上述检查复现的问题：隔空触发、气球图形与碰撞高度不符、弹床共享冷却导致第二颗球漏弹、传送带隔空带动、矛盾齿轮闭环仍转动、点火时间跨中断累计／双镜重复计时、弹丸碰撞后被重设速度及半径错误、火箭离场后继续推进、长供电链受固定迭代次数限制。碰撞与启动条件修复后，7 个原有关卡参考摆法均保持可解。
- 修复可视表现：翻转电动机的转向、传送带停转时纹理跳回原点、皮带动画方向、连接线轴心／挂点、旋转道具的点击区域、放大镜方向预览和剪刀闭合幅度。错误存档中的不支持旋转／翻转会被拒绝，既有合法草稿保持兼容。
- 浏览器逐项打开并核验 25 种场景全部通过。推进到接触前后，实际查看弹床 0.80 秒形变、风箱 0.70 秒压缩、发射器 0.20 秒闪光与飞行弹丸、剪刀 0.40 秒闭合、火箭 1.00 秒尾焰；另连续播放风扇／风车／发电机／皮带，检查暂停时画面与状态冻结、恢复后继续运行。
- 390×844 实际操作全部 23 种实体道具：从道具箱点放、适用的旋转／翻转按钮、拖动、移回道具箱、撤销恢复、再移除。皮带与绳索分别实测两点连接、错误端点、断开、撤销、删除端点移除连接。运行、暂停、返回摆放并刷新后，四件道具的 DOM 位置／方向与两个连接均一致。
- 同一手机尺寸在页面中重新运行全部 7 个参考摆法，逐关看到“机关成功”。320×740 检查第 7 关，页面宽度为 320，无横向溢出。QA 页面和游戏操作页在本轮时间内无控制台 error。
- 本轮为桌面浏览器手机尺寸验证，未安装真机。localhost 用户草稿与进度未改动；测试使用独立 127.0.0.1 origin，结果保留本地，未 commit / push。


# 机关工坊：点选与放回道具（2026-10-21）

- 复现用户报告：第 5 关放入太阳能板，再从道具箱选风扇，点击已放入的太阳能板，原先错误地尝试在同一位置放风扇，显示“这里放不下”，无法选中原道具。调整指针事件处理顺序，已有实体优先选中并取消普通放置模式；皮带／绳索仍保留两端点连接模式。键盘激活使用同一选中逻辑。
- 将不明显的叉号改为可见的“移回道具箱”文字按钮，至少 44px 高。名称和归还按钮独立一行，旋转／翻转／断开控制可以换行；选中实体提供 pressed 状态和画布轮廓。归还时清除连接选择、恢复本体与所连皮带／绳索库存，原摆法可撤销恢复。
- 桌面浏览器 390×844 的真实指针路径验证：复现并修复“先选风扇再点已有太阳能板”；选中、归还、库存恢复、撤销；固定拉绳灯没有归还按钮；电动机与固定传送带重新连接皮带，归还电动机后两者库存均恢复，撤销同时恢复实体和连接；斜坡旋转到 45°、拖动、取消选中、重新点选和归还均通过。320×740 再检查归还按钮为 76×44px，页面宽度等于视口，无横向溢出。
- 机关相关 73/73 自动化检查通过，47 个静态文件的语法及模块路径检查通过。使用独立内存存档，未触及用户的 localhost 摆法；没有把桌面手机尺寸验证算作 iPhone 真机验证。改动保留本地，未 push。

# 机关工坊：单独归还绳索与皮带（2026-10-21）

- 上一轮只验证了实体道具及删除端点时回收连接，没有覆盖直接选择连接线。补充沿实际绳索曲线／两条皮带边线的透明触摸区域（44 CSS px，缩放后不缩小），与画布共用挂点和曲线数据；选中后高亮并显示“移回道具箱”。新连接完成后直接保持选中。实体端点仍可正常点选，固定道具保留。
- 单独归还连接只删除该连接、恢复对应库存，不移动或归还两个端点；删除实体仍回收所连线，撤销保持完整摆法。键盘 Enter／空格可选择连接，Delete／Backspace 可归还。新增 5 项检查覆盖两固定端点之间的绳索、同端点多根绳索只删除一根、皮带独立回收、合法存档往返及绘制／命中共用几何数据；机关相关 78/78 通过。
- 独立内存存档的浏览器实测 390×844：第 7 关实际点击绳索中段、归还、库存恢复、五个实体的位置完全不变、撤销恢复；从吊桶重新接到固定灯后自动选中绳索，Enter 和 Backspace 归还通过。第 4 关实际点击皮带、单独归还后电动机库存仍为 0、皮带库存为 1，实体位置不变，撤销恢复。320×740 再次实际点选第 7 关绳索并归还通过。控制台无 error。
- 本地页面已刷新，用户摆法保留；测试使用独立内存存档，不计作真机测试。未 push。

# 机关工坊：参考原版思路的正式关卡（2026-10-21，本地）

- 保留最初 7 关的 ID／索引／摆法，新增 18 关，合计 25 关。选关分入门练习、重力车间、屋顶动力、港湾连锁四组，可直接选择，显示章节通关数。每章使用统一场景；旧摆法、自由实验和通关存档保持兼容。
- 参考 TIM 的多级输送、齿轮换向、风力发电、剪绳释放、烛光中继、双路发射和多目标结构，按本引擎重新设计坐标、障碍和道具配额；各关 `reference` 留存原关思路编号，资料来源见 README。18 个正式关卡覆盖全部新增机制，整套 25 关使用全部 25 种道具／连接工具。
- 新增多目标、指定球归位、吊桶落入区域、启动机关和熄火判定；落杯需稳定 0.45 秒，区域／启动／熄火需稳定 0.2 秒。各目标逐项记录，全部完成才过关和报告本局结果；计数在工具栏显示。关卡自带固定绳索不能归还但可被剪刀剪断，玩家连接的绳索／皮带仍可归还。放置剪刀等实体到连接线上不会被连接线点选拦截。
- 场地逐步扩大至 1440×1000；首次进入大场地显示全景，近看编辑可平移／靠边拖放。试运行自动全景，返回摆放恢复运行前编辑镜头，存档也保留编辑镜头。正式关卡运行上限 24–60 秒；提示提供思路，练习以外不自动显示整套摆位轮廓。
- 自动化验证：25 套参考摆法均合法可过关，空摆法均失败；正式关卡参考摆法逐件移除实体／连接线共 71 次，均不能完成全部目标。此检查不排除其他有效解法。另覆盖固定布局、网格角度、指定球、复合目标不提前过关、固定绳索不可覆盖／重复、旧新存档往返，以及全部新名称／目标／提示的中英繁体翻译。测试发现三个参考坐标没有对齐编辑网格，已修正为手机实际能放出的坐标。
- 全站 237/237 测试通过；补充工具栏计数与帮助文案后，50 个静态文件和最终翻译专项 2/2 再通过。语法、模块路径和 diff 空白检查通过。
- 390×844 实际页面逐关播放全部 18 个新关卡并看到“机关成功”；第 12 关手动点放两把剪刀并平移场地后通过，其余通过页面主动加载参考摆法再运行。第 23 关暂停在 2/3，确认尚未过关，继续后完成第三项目标。第 25 关最终代码实际运行显示 2/2；320×740 英文版再次运行总装通过，页面宽度与视口均为 320，章节／工具／目标／结算均为英文。两测试页控制台无 error。浏览器逐关记录 `/tmp/brain-play-campaign-browser-results.json`，全站日志 `/tmp/brain-play-campaign-full-test.log`。
- 验证使用独立内存存档，不计作真机验证；未覆盖用户试玩摆法，未 commit / push。

# 机关工坊：逐件操作正式关卡（2026-10-21，本地）

- 按用户要求补做完整手动操作：390×844 独立内存存档，从第 8 到第 25 关的空摆法逐关点放／拖动、旋转、翻转、点两个端点连接绳索或皮带，实际运行至“机关成功”。本轮没有点击提示或“查看参考摆法”；操作者已知自己设计的方案，因此不算盲解或新玩家难度评估。逐关记录 `/tmp/brain-play-manual-results.json`。
- 第 8 关横向平移后摆右斜坡；第 10、11 关经历放置位置偏差、运行失败、返回拖动调整和重试。第 19 关横纵平移并旋转弹床越墙；第 24 关向下查看第二层并手动接三条皮带；第 25 关近看跨区放 8 件设备、接 1 条绳索和 2 条皮带，最终 2/2。第 20 关还实际退回一条绳索，再重新连接、双向发射成功。截图 `/tmp/brain-play-manual-final-390.jpg`。
- 手动操作发现：第 15 关全景模式的固定齿轮扩大触区挡住新齿轮的合法啮合位置，原代码需切近看才能摆入。修正命中优先级：先选手指实际点中的实体；实体之间合法可放的空隙允许放入当前工具；其余位置保留扩大触区，仍可方便选取／归还道具。保留固定道具只读、物理防重叠和连接线可选行为。
- 修复后重新打开空摆法第 15 关，全程全景点放电机与啮合齿轮、归还齿轮并重放；另一道具已选时仍可点中已有电机。直接点两个相邻齿轮各自的中心，分别接好两条皮带，实际运行成功。该页无控制台 error，截图 `/tmp/brain-play-manual-hit-fix-390.jpg`。定向命中／正式关卡／镜头／连接测试 37/37，通过 51 个静态文件检查与 diff 空白检查。保留原用户存档，未 commit / push。

# 机关工坊：非动物道具扩充与重新编排关卡（2026-10-22，本地）

- 新增网球、棒球、炮弹、滑轮、固定挂环、跷跷板、砖墙、金属直管／弯管、拳击手套、弹簧盒、手电筒、大炮、炸药、压杆引爆器、引爆线，共 16 种，当前共 41 种；动物机关留待后续。每种加入独立可视化复查场景和保存／重置／30 秒稳定性检查。
- 绕轮绳索传递总长度约束，支持多个不同滑轮和两端重力交换；松弛时不推开物体。路径各段都可剪断，退回滑轮同时退回经过它的玩家连接。跷跷板使用真实动态转轴，拳套与弹簧头只在碰到物体时发射；弹簧蓄力可中断保留、仅发射一次。手电筒按接触开启，供光有方向。大炮按仰角／朝向发射真实重炮弹，破砖消耗速度；引爆线不承重，炸药有引信延迟、范围和连锁，钢管不被炸毁。画面包含伸缩弹簧、拳套、蓄力表、光束、后坐／烟尘、引信、冲击与碎块。
- 新编第 26–37 关：机械实验室 6 关使用装配车间场景，重型机库 6 关使用统一机库场景，当前合计 37 关。由单机制进入多段传递、悬吊爆破和越墙总装；保留旧 25 关 ID、顺序和存档。测试发现最后一关移除挂环仍能借下面的砖墙托住吊桶，已调整两面砖墙并增加挡住后续炮弹的金属隔板，让悬吊步骤确实参与解法。
- 自动化：全站 295/295 通过。37 个参考摆法均合法可过关，空摆法均失败；全部正式关卡共 119 次移除参考部件检查通过，不声称证明唯一解。新增专项还检查弹性／重量差异、绳索长度与松弛、跷跷板系绳、拳套两朝向、弹簧停机、手电筒正反照明、炮击角度／翻转、连续点火、爆炸延迟／范围／连锁和材料差异。全站日志 `/tmp/brain-play-expansion-full-final.log`。最终帮助文案的翻译专项再次通过，56 个静态文件及 diff 空白检查通过。
- 实际页面：390×844 独立内存存档，从空摆法逐关手动完成第 26–37 关，未使用提示／加载参考摆法；操作者已知自己设计的方案，不算盲解难度评估。实际点击滑轮按顺序绕绳、旋转弯管和炮口、连接皮带／绳索／引爆线，第 37 关近看平移到远端完成挂环／吊桶／炸药，全部目标完成。逐关记录 `/tmp/brain-play-expansion-manual.json`，选关通关图 `/tmp/brain-play-expansion-chapters-390.jpg`，最后一关 `/tmp/brain-play-expansion-final-390.jpg`。控制台无 error。
- 附加复查：320×740 英文第 32 关主动加载参考摆法运行成功，页面宽度与内容宽度均为 320；修复杯子结算时“近看”遮挡下一关按钮，修复砖墙炸毁后碎片常驻空中的画面。16 个新增道具在复查页逐项核验通过；另用界面推进至拳套 0.60 秒和爆炸 1.30 秒，查看伸出接触及冲击碎片。该页已适配每关完整场地和 41 项数量。未更改 iOS 代码、未进行真机验证，未 commit / push。

# App 页面／关卡通知（2026-10-21）


- 11 个游戏共用 `navigation` 消息，携带固定编码、关卡／模式、原因与独立事件 ID。进入、选关、下一关、重开／新一局和刷新各发一次；返回首页先传存档再发导航。返回 App 仍先保存再 pop。导航不传存档。
- 使用独立内存存档的 `dev/app-navigation.html` 操作全部 11 个游戏，验证进入、新一局和返回顺序。24 点验证原牌重来与发新牌；数织实际完成心形后下一关；骨牌实际完成首关后下一关、选择第 7 关；机关实际运行参考摆法过关后下一关、自由实验和清空。普通移动、撤销、提示、取消重开、查看参考摆法不产生导航消息。
- 2048 每日局带日期；切换至斐波那契 5×5 只发一条 `settings`，相同设置直接完成不发送。实际刷新只有一条 `reload`，文档 ID 更新。普通移动不发送；整个 QA 过程控制台无错误。测试数据不覆盖 localhost 试玩进度。
- 网页 173/173 自动化测试通过，42 个静态文件检查通过。新增 5 项检查覆盖全部编码、字段、页面 ID、每日局和模式元数据、非法事件、缺失／失败接口及关卡描述。
- iOS Simulator 的 27/27 相关 XCTest 通过：18 项现有广告策略、9 项 WebView／存档检查，其中新增真实 WKWebView 消息接收及去重、非法来源／字段拒绝、全部编码与模式。结果 `/tmp/brain-play-navigation-sim-20261021-r1.xcresult`；未在此轮播放真实广告或安装到实体手机。
- iOS 复用现有全局 300 秒冷却、权益／同意、前台与广告就绪判断；连续切页合并、离开页面不弹。网页只报告机会。全部改动保留本地，未 commit / push。


# iPhone 11 关卡通知验证（2026-10-21）

- 经用户本次明确授权，覆盖安装新 Debug 包到 iPhone 11 / iOS 26.5.2，未卸载或替换用户数据。同一组 27 项广告策略／WebGames hosted 检查全部通过。
- 用 `dev/native-fixture.mjs` 打包当前未发布的 39 个模块、样式与物理库，专用缓存快照在真实 WKWebView 载入，使用临时原生存档。实际 DOM 操作全部 11 个游戏的进入、重开／新一局、返回；数织实际完成后下一关、机关切到第 2 关，原生共收到 36 条唯一导航消息，返回后 11 个编码均有存档。该专项 1/1 通过，测试结束删除快照，不覆盖试玩存档。
- 官方广告 SDK 初始化、插屏／激励加载及实际横幅组件加载另外 4 项通过。首次快照漏掉 Matter.js 的副作用 import、旧横幅用例错误等待首页广告，均已修复测试夹具并保留失败记录；没有因此修改游戏或广告策略。
- 总计 32 个不同的 hosted 真机检查通过。XCUITest 两次卡在系统“启用自动化模式”初始化，未执行到界面操作；完整插屏弹出／关闭仍待确认，不能算作通过。已请求用户检查手机授权与解锁状态。
- 结果：`/tmp/brain-play-navigation-iphone11-20261021-r1.xcresult`、`/tmp/brain-play-navigation-iphone11-local-site-r2-20261021.xcresult`、`/tmp/brain-play-navigation-iphone11-ads-sdk-20261021.xcresult`、`/tmp/brain-play-navigation-iphone11-banner-r2-20261021.xcresult`。网页未 commit / push，日常 App 入口仍是线上旧网页。


## 自动化启用后的界面补验（2026-10-21）

- 用户启用系统自动化后，iPhone 11 的真实网页返回设置 UI 流程通过（19.100 秒）。官方测试插屏已在 WebView 返回后实际弹出；测试首次点击 Close 处在过渡期，改为等待真实关闭、仍有广告时重试 SDK 关闭控件，定向复测 1/1 通过（43.677 秒），关闭后设置页可见且可操作。产品广告／导航代码未改。
- 原生同一进程日志确认 23:42:01Z 展示、23:42:07Z 设置页重现、23:42:08Z SDK 关闭回调。结果 `/tmp/brain-play-navigation-iphone11-ui-r2-20261021.xcresult`（普通返回通过、首次关闭检查失败）和 `/tmp/brain-play-navigation-iphone11-ui-r3-20261021.xcresult`（关闭定向复测通过）。
- 加上前面的 32 项 hosted 检查，目前共 34 个不同的真机检查通过。测试临时使用 3 秒广告冷却，结束后已不带测试参数普通启动，日常仍 300 秒。网页未 commit / push。


# 进入游戏时的 App 放行（2026-10-21）

- 全部 11 个游戏的进入／选关／下一关／重开／新一局／刷新走同一通知接口。新版 App 声明回执能力后，无需广告立即放行；展示广告时在 SDK 关闭或失败后回复同一个导航 ID。HTML、资源、棋盘正常加载，只暂缓触摸和键盘。重开／换关的新状态在放行后更新；返回取消旧等待，迟到回执不能启动新页面。原有返回时存档策略不变。
- 网页 177/177、静态文件 43 项通过；最终损坏关卡元数据与 bridge/storage 定向检查 13/13。独立浏览器手工放行验证：棋盘已加载但不可操作，键盘无效；放行后真实移动；重开放行前旧棋盘保留、放行后撤销历史清空；等待时返回首页、迟到放行不影响首页；实际刷新只发一次 reload。控制台无错误。
- iPhone 11：29/29 hosted 检查通过，包括全部 11 个实际网页游戏与原生回执、不需广告的同步放行。另 1 项真实 UI 测试从游戏网格点击 2048，看到官方测试插屏，广告期间不能操作游戏；关闭后仍在 2048，向上移动成功，撤销变为可用。这次确实测试进入游戏，并非返回 App。
- 原生同一进程 23:55:11Z 收到 g001 enter 并展示，23:55:18Z SDK 关闭后回执，路由始终为 settings/webGames。UI 测试使用进程内 15 秒冷却及临时隔离存档，日常仍 300 秒，未修改用户存档。
- 结果 `/tmp/brain-play-gate-iphone11-unit-20261021.xcresult`、`/tmp/brain-play-gate-iphone11-entry-ui-20261021.xcresult`。手机已恢复不带测试参数的普通启动。网页未 commit / push。


## 统一 App 暂停／恢复（2026-10-21）

- 同一 `brainPlayActivity` 状态快照覆盖前后台和全屏广告；导航等待、网页隐藏独立叠加。暂停保留游戏状态与等待剩余时间，解除所有原因后才继续；HTML/模块加载继续，用户手动暂停保持。原有返回时存档时机不变。
- 网页 184/184、最终 runtime/bridge/storage 定向 20/20，45 个静态文件语法与模块路径检查通过。新增检查覆盖状态原子切换、重叠暂停、活动时钟、延时创建/剩余/取消、动画保留/取消/手动暂停、初始快照、浏览器隐藏回退与音效中断不重放。
- 独立浏览器测试页：广告关闭但仍在后台保持暂停；回前台恢复；机关手动暂停经过广告后仍 paused；24 点新发牌被广告打断后完成、实际选牌并合并 3+7=10；控制台无错误。该页使用内存存档。
- iPhone 11：19 项广告策略和 4 项 hosted 检查通过（23/23），包含全部 11 游戏实际本地模块的进入/重开通知与生命周期原生发布。暂停专项随后扩展为真实 24 点发牌/重发、骨牌连锁及机关物理冻结/恢复、手动暂停保留，1/1 通过（5.233 秒）；生命周期不增加原生存档写入。
- 真实 UI 从游戏网格打开 2048，看到 Google 官方测试插屏，关闭后实际移动；随后撤销、切后台、回前台、再次移动成功。首次测试在系统自动化初始化超时，尚未执行；重试通过（46.433 秒）。同一 launch 的日志确认 21:36:41 EDT ad=true，21:36:47 关闭/ad=false，21:36:50 inactive/active=false，21:36:51 foreground/active=true。结果与截图见 iOS Docs/TestArtifacts/web-games-activity-20261021。
- 测试用隔离临时存档、进程内 15 秒广告间隔。完成后已恢复无测试参数的普通启动，日常仍 300 秒。网页未 commit / push。


## 初始化配置与本局结果（2026-10-21）

- documentStart 提供 App version/build、能力和默认语言/音效/动画/light 主题；ready 返回网页 build/protocol/capabilities。新旧能力及显式关闭能力可降级；App 入口不再把语言写死为 zh-CN，网页保存的选择优先于 App 默认值。
- 全部 11 游戏结算使用独立本局编号，续局保留编号与活动时长，重开/换关重新生成；广告、后台与机关手动暂停时间不计入。结果只含适用的分数/步数/猜测次数/辅助标记，不发送局面，不触发广告。结果单独原子保存在 App，去重跨浏览器实例和 App 重开生效，历史最多 1000 局；原有返回时存档策略保持。
- 网页全量 190/190；随后能力降级分支与最终 round/bridge/storage/runtime 定向 27/27；47 静态文件语法和模块路径通过。最终 cache URL 已更新，避免旧 storage/motion 实例混入。
- iPhone 11 共 7 个不同 hosted 检查通过。实际 WKWebView 使用独立临近完成局面，真实 DOM 控件触发 11 游戏结算；另测无合法移动的 2048 和断开的骨牌链两种失败，共 13 条独立结果。2048 撤销重做不重复；重复消息、新 browser 仍去重，外站/子 frame/非法数字/局面字段被拒绝，损坏历史保留，1000 局上限通过。结果从未触发导航广告或写游戏局面文件。
- 初始化真实验证：App 默认繁体使首次网页显示 zh-TW；网页保存的中文/声音选择仍优先，动画默认尊重减少动态效果，App 收到网页 build 27 和 result 能力。已有全部 11 游戏导航和统一暂停/恢复回归通过。
- 这些是设备内 WKWebView/DOM 操作，不宣称为逐个游戏的手指点击 XCUITest。本次没有重复无变更的 SDK 广告展示专项。使用临时原生存档/结果文件，已恢复无测试参数的普通 App 启动。结果及 JSON 证据见 iOS Docs/TestArtifacts/web-games-results-20261021，网页未 commit / push。
