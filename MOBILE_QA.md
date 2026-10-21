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

## 蚂蚁多米诺（v11）

- 12 个原创固定关卡的记录解法：逐步执行实际行走、搬起、放下与一次推动；全部开门且出口可达。交换骨牌遍历顺序后结果一致。
- 规则回归：出口与其他牌同时倒下不算最后；延时改变两侧先后；分叉只接受从上方落牌；普通牌被落牌击中会撞坏；搭桥支持左右方向、真实补地面并让人物通过。
- 390×844 页面实测：第一关推倒、走进门才获胜，通关后撤销；第二关失败反馈、保留摆放重试、搬牌携带状态刷新恢复；第六关绕梯搬搭桥牌、启动连锁、从新桥走过进门；第七关上下层搬运与落牌分叉。
- 320×740 英文界面：无横向溢出，无中文遗漏，按钮可见；繁体界面与图鉴／帮助文本均有翻译。方向按钮至少 44×44 CSS px。
- 开启动画后查看人物走动、骨牌依次倒下和搭桥；播放中取消能回到原摆放，播放中刷新可恢复已完成的连锁结果。关闭动画也能执行同样规则。
- 本机存储校验：拒绝缺牌、重复牌、移动的出口牌、非法人物位置；允许已铺桥上的人物位置恢复。12 关的提示针对初始布置，不是运行时任意局面求解。
- 验证环境为桌面浏览器的手机尺寸预览；这次没有安装 App 或连接实体手机测试。
