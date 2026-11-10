# 上升牌碰延时牌和再次碰停止牌的反弹

原来首次接触只识别 stopper。延时牌被启动后，上升牌继续翻到水平。反向翻转碰到另一停止牌时，只记录 rebound effect，没有进入 ceiling-return；旧 ascender-rest 还会把后续返回覆盖掉。

修复复用 resistsDomino 对停止牌和等待/倾倒中的延时牌的判断。未启动的延时牌先启动，再决定反弹。首次与反向接触共用同一个上升牌返回函数；反向接触也按实际接触角停下，旧 rest 事件只对仍在原方向反向翻转的牌生效。延时牌已经倒下后不再作为反弹障碍。没有修改普通牌动画或时钟。

引擎测试：左右两向延时牌 → 对侧停止牌 → 再反向；双停止牌至少连续三次反弹，且每次实际进入返回状态。232 项骨牌专项通过，包含原有上升牌完成顺序与顶部转轴测试。

真实网页：独立 localhost HTML 77，把 (14,6) 普通牌暂放 (3,6)，把 (9,8) 上升牌 p43 搬到 (14,6)，从左间隙向右推。p43 接触 (15,4) 延时牌后，在延时牌仍 waiting 时返回，再向左翻。左侧连锁随后触发 p14，实际碰左上停止牌并返回、向右翻。采样保存在 browser.json。

首次采样中 p43 的初始 CSS 转动没有得到有效画面证据，因此额外在新页面重跑同一摆放；swing-check.json 确认接触前矩阵逐渐转到约 -42°，随后 ceiling-return 返回 0°，再 ceiling-reversing 向左翻转。contact.png 是这轮真实接触前画面。只验证动作，没有尝试全关通关，未操作用户主页面。

App 通信模拟：未测。真机：未测。

产物：`/Volumes/SANDISK/Codex/brain-play/ascender-rebound/`；专项日志为 `/Volumes/SANDISK/Codex/brain-play/carried-ascender/rebound-tests.log`。
