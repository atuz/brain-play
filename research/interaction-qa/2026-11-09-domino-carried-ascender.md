# 抱着上升牌下梯子或跳下

现场：HTML 75 电子世界 35，p8 的 DOM stage 为 dropping，仍画在 (12,4)，蚂蚁已空手到 (11,6)。上升牌专用引擎分支截走 carried-land，专用绘制也没有使用 dropX/dropY。

修复：carried-land 与随后 splitter impact-end 使用已有的普通抱牌落地流程。上升牌释放时先在出手位置重设绘制锚点，再按已有 carriedDropTiming 垂直落到 dropX/dropY；不启动上升或翻转。正常激活后的上升机制不变。

引擎/绘制测试：新增释放上升牌落空地后站立、再次推动后才上升、落分叉牌后消耗、绘制目标与普通抱牌时钟一致。相关 25 项测试通过；骨牌专项共 226 项通过。梯子与台阶不释放持牌的既有测试也通过。

真实网页：localhost 独立 HTML 75，通过公开控件搬起 (14,4) 上升牌，沿梯子到 (14,6)：蚂蚁 carrying=true，原场地节点 hidden=true。再抱回上层，从 (13,4) 跳到 (11,6)：采样 146ms 看到上升牌 dropping，绘制 top 向下移动；350ms 已在 (11,6) upright，蚂蚁仍在上层等待；随后蚂蚁也到下层，搬起按钮可用。没有尝试全关通关。未操作用户主页面。

App 通信模拟：未测。真机：未测。

产物：`/Volumes/SANDISK/Codex/brain-play/carried-ascender/` 的 browser.json、ladder.png、landed.png；专项日志为 `/Volumes/SANDISK/Codex/brain-play/bomb-contact-animation/carried-ascender-tests.log`。
