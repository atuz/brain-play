# 百战小旅鼠初代 DOS 版研究

研究范围为用户确认的 1991 年初代 DOS 单人 120 关：Fun、Tricky、Taxing、Mayhem，各 30 关。资料片与其他平台专属关另算。开局图、横向地图视野、技能动作与通关结果分别编号，便于对照后续手机版实现。

## 可执行参考与截图

- [Eric Lautanen 的网页版](https://eric-lautanen.github.io/lemmings/)提供公开的完整选关器，使用 DOS 原始数据重绘地形、物体和人物；它是 JavaScript 移植版，不是 DOSBox 中运行的原版二进制。
- [参考源码](https://github.com/Eric-Lautanen/lemmings)，研究副本基于提交 `bfc20792d80347e4cd37038c6c40b677ddc65f33`。
- [LemmingsJS](https://lemmingsjs.oklemenz.de/)也已实际打开，显示第一关 Just dig!；其作者[公开说明](https://github.com/oklemenz/LemmingsJS)支持版本、难度、关卡、速度等 URL 参数。本轮完整截图选用前者，避免混用两套界面。
- 原始截图目录：`/Users/pingzheng/Study/game-references/captures/lemmings-dos-1991/`。
- 本地[120 关截图目录](http://127.0.0.1:4176/lemmings-dos-1991/)。`manifest.json`保存编号、英文名称、文件大小与 SHA256；`map-manifest.json`将每关对应到五张横向视野图。

已实际通过公开选关器逐关载入、重置、暂停，保存 **120 张开局图**。随后逐关重置并点击缩略地图，从左至右保存 **600 张视野图**。参考地图宽 1600 像素，可见区域为 320×160 像素，五个视野覆盖横向场地；完整截图同时保留关卡名、技能栏和计数。截图不等于已经通关 120 关。

## 实际试玩结果

所有分配技能、暂停、重开、切关与移动视野均从可见界面操作，没有调用游戏内部函数、修改技能数量或修改胜负状态。

| 关卡 | 实际操作与结果 | 结果图 |
| --- | --- | --- |
| Fun 1 Just dig! | 在上层分配向下挖掘，通道打通后全体落到下层并进入出口，10／10 获救 | `skills/08-digger-win.jpg` |
| Fun 2 Only floaters can survive this | 对五只旅鼠分配降落伞，观察展开和缓降；五只安全到达出口，另外五只未获技能而损失，5／10 获救 | `skills/02-floater-win.jpg` |
| Fun 3 Tailor-made for blockers | 在上层右端放置阻挡者，观察后来者接近后掉头，随后进入下一层；此关未完成 | `skills/04-blocker-turn-result.jpg` |
| Fun 4 Now use miners and climbers | 矿工斜挖穿过上层地板，再将攀爬分配给落到下层的旅鼠，爬上出口建筑，10／10 获救，要求 100% | `skills/01-07-climber-miner-win.jpg` |
| Fun 5 You need bashers this time | 前两次横挖选中了背向墙壁的对象或起点不合适，消耗技能而没有打通；调整朝向后打穿细柱和厚岩层。后半段没有及时在山脚横挖，最终超时，0／50，要求 10% | `skills/06-basher-column-result.jpg`、`06-basher-rock-active.jpg`、`06-basher-timeout.jpg` |
| Fun 6 A task for blockers and bombers | 阻挡者＋爆破者固定爆点：先炸断薄桥，再炸开出口前的薄墙。两只爆破者损失，其余 48／50 获救，要求 20% | `skills/03-bomber-win.jpg` |
| Fun 7 Builders will help you here | 一次搭楼梯上高台，一次跨越后半段缺口。45 只获救，五只在桥未完工时落入坑内；达到要求后实际使用 Nuke 结束这五只的行动，最终 45／50，要求 50% | `skills/05-builder-win.jpg` |

## 八种技能的操作与动作

共同操作是先选技能，再点目标旅鼠。技能作用于目标当前的行走方向，不等于点击屏幕左边就向左施工。成功分配会减少剩余次数。参考网页版支持暂停时分配技能，再恢复观察；原 DOS 暂停期间能否分配，仍需直接核对 DOS 程序。

| 技能 | 实际观察的动作与效果 | 对应截图 |
| --- | --- | --- |
| Climber 攀爬，键 1 | 分配后先继续走；碰到高墙后竖直攀登，到顶翻上平台，再继续走。Fun 4 中两只同时爬出口建筑的侧面，随后进入出口 | `01-07-climber-miner-before.jpg`、`01-climber-active.jpg`、`01-climber-roof-result.jpg` |
| Floater 降落伞，键 2 | 分配不立即张伞；走过台阶后从高处落下，先出现展开动作，再缓慢下降并安全着地。相邻未分配对象没有同样保护 | `02-floater-before.jpg`、`02-floater-unfolding.jpg`、`02-floater-frame-*.jpg`、`02-floater-win.jpg` |
| Bomber 爆破，键 3 | 头顶从 5 开始倒计时，阻挡动作在倒计时期间保留；之后爆炸、出现碎屑并留下地形缺口，爆破者消失。薄桥和薄墙均已实际炸开 | `03-bomber-countdown.jpg`、`03-bomber-frame-*.jpg`、`03-bomber-hole-result.jpg`、`03-bomber-wall-result.jpg` |
| Blocker 阻挡，键 4 | 张开双臂站在原地，后来者接近后掉头。可再分配爆破，将爆点固定在桥或墙旁 | `04-blocker-before.jpg`、`04-blocker-assigned.jpg`、`04-blocker-turn-result.jpg`、`03-bomber-wall-countdown.jpg` |
| Builder 造桥，键 5 | 弯身放砖、踏上新砖并前移，逐阶上升。先搭出高台楼梯，再搭跨坑斜桥；建完后恢复行走。施工期间同伴不会自动等桥，已实际落坑五只 | `05-builder-assigned.jpg`、`05-builder-active.jpg`、`05-builder-stair-result.jpg`、`05-builder-gap-active.jpg`、`05-builder-gap-result.jpg` |
| Basher 横挖，键 6 | 挥臂向面朝方向逐渐清除侧面地形。面朝空处或距离太远会白耗次数；合适位置能挖穿细柱，再持续穿厚岩层，后来者通过已挖出的通道 | `06-basher-assigned.jpg`、`06-basher-frame-*.jpg`、`06-basher-column-result.jpg`、`06-basher-rock-active.jpg` |
| Miner 斜挖，键 7 | 挥镐，同时前移和下沉，留下斜向通道；挖穿地板后落到下层，后来者也可经过通道。另在 Fun 4 补拍了地层尚未挖通时的近程挥镐和逐步下沉 | `07-miner-close-before.jpg`、`07-miner-close-assigned.jpg`、`07-miner-close-active.jpg`、`07-miner-close-frame-*.jpg`、`07-miner-tunnel-result.jpg` |
| Digger 向下挖，键 8 | 原地向下施工，坑逐渐加深，挖穿地层后自己和同伴落到下层。补拍了尚未打穿时的动作 | `08-digger-before.jpg`、`08-digger-assigned.jpg`、`08-digger-active.jpg`、`08-digger-hole-result.jpg` |

上表文件位于截图目录的 `skills/`。其中 `skills-overview.jpg`只是实际截图的裁切拼图，完整画面均另行保存。连续图片序号是截图顺序，不是原游戏动画帧编号，也不代表固定录制帧率。

## 其他实际操作

- 公开下拉框可直接选择 120 关，不需把前关通关；前后关按钮也已操作。
- P 或技能栏暂停按钮能停止进程；恢复后继续施工。F 或双箭头切换快进。正式动作记录尽量在正常速度下进行，赶路时使用快进。
- R／Restart 重置本关地形、人物、技能与计时，不保留已经挖出的通道。
- 参考版切关和重开会保留暂停状态，但会取消快进。不能在每次重开后无条件再按一次 P，否则反而会恢复运行；开局截图已经另外检查 OUT 0。
- 点击缩略地图能立即改变可见范围，暂停期间也可查看别处。Fun 5 和 Fun 7 均实际滚动到后半段处理机关。
- 音乐与 SFX 两个开关分别点击过，状态文字分别变化；未作扬声器录音或波形比对。
- 造桥关已实际操作 Nuke：五只被困者进入倒计时，爆炸后结算；已获救的 45 只计数保留。
- 达到要求后不会立即停止：Fun 7 已有 90% 获救时仍有五只活着，游戏继续运行，直到这些对象结束行动才显示结算。

### 钢块关补充观察

Mayhem 1 Steel Works 中，在高处坠落期间给一只旅鼠分配降落伞，落到钢平台后仍能继续行走并从后续落差下降；未保护的后来者可见摔碎状态。对已带降落伞的同一对象再次点降落伞，剩余 4 次保持不变。该对象到下方钢地面行走后，尝试分配向下挖掘，剩余 5 次保持不变，钢地面未出现挖通口，对象继续行走。截图为 `edge-steel-before.jpg`、`edge-floater-duplicate.jpg`、`edge-steel-digger-walking-attempt.jpg`和 `edge-steel-digger-result.jpg`。攀爬／降落伞等永久能力会影响悬停文字，因此悬停的 FLOATER 不能单独用来判断对象当时是否仍在空中。

### 顶檐与两种永久技能叠加

Fun 9 中，暂停后对同一只向右行走的旅鼠先分配攀爬，再分配降落伞，两项均从 20 变为 19。恢复后实际看到了爬上中央柱、在外伸顶檐下受阻、掉落、展开降落伞、回到地面的一整段过程。对应 `edge-athlete-before.jpg`、`edge-athlete-assigned.jpg`、`edge-athlete-climbing.jpg`、`edge-athlete-floater.jpg`、`edge-athlete-returned.jpg`；连续过程为 `edge-athlete-frame-00..49.jpg`。再对这只对象分配攀爬，次数仍为 19，见 `edge-athlete-duplicate-climb.jpg`。悬停的 ATHLETE 表示攀爬＋降落伞能力叠加，不代表当时正在爬墙。

Fun 8 的“矿工挖空阻挡者支撑”尝试中，矿工实际朝左挖开通道，未挖到右侧阻挡者的脚下。这组 `edge-blocker-support-*.jpg`只记录了失败布置，不能算验证了阻挡者恢复移动。Fun 9 的造桥贴墙尝试和 Tricky 20 的单向墙接近过程也保留了截图，但尚不足以作全部限制行为的结论。

## 参考程序暂停计时问题

在线副本暂停较久后恢复，会快速追赶暂停期间累计的计时。源码固定步长循环在暂停时仍累加 `acc`，与实际看到的异常加速相符。120＋600 张地图截图均在未修改的线上版中拍摄，暂停时地形与计数仍是开局。

Fun 1、Fun 2 及最初的 Fun 3 动作在该线上版试玩。之后在独立参考目录的本地副本修正了墙钟累计：暂停时把 `acc`归零，恢复后才累加时间。只改这个计时条件，没有更改技能、地形、关卡、碰撞、计数和结算规则；Fun 4–7 和补拍的挖掘动作在 `http://127.0.0.1:4177/`中操作。补丁随截图目录保存，便于复查。

## 原版仍待继续核查

以下仍需补实际画面，不能把源码中的规则算成已经试玩验证：阻挡者脚下被挖空后恢复移动、钢块对横挖／斜挖及单向地形对挖掘的限制、水／火／不同机关的死亡差异、建桥撞墙或顶棚的确切停止过程。原 DOS 与网页端在暂停分配、快捷键、快进和 Nuke 的触发方式也需分开记录。八种技能的基本动作、攀爬遇顶檐掉落、攀爬与降落伞叠加、攀爬及降落伞重复分配均已有实际画面。

## 手机版的交互草案

用户随后要求开始编写可玩的版本，现已按上述研究实现本站原创关卡，见 [实现与验证](IMPLEMENTATION.md)。重点是足够大的命中区域、对象朝向与施工方向、失败分配不扣次数、暂停瞄准、可拖动场地、小地图和跟随视野。原版未测边界继续独立列出，不把自制引擎测试冒充原版试玩。

本项目沿用统一保存、进入关卡通知、暂停恢复、广告遮挡与本局结果接口。当前自制角色、技能动画和 24 个原创关卡均已编写并实际操作通过，资料和调试产物已迁往 SANDISK，旧路径保留符号链接。
