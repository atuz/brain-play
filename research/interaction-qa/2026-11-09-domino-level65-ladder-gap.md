# 统一梯子与地面的地形规则

先前为太空 25 添加的梯口横向通行不符合用户要求，已撤回。现在所有关卡统一使用连续地面判断横向行走；梯子只提供纵向通行，不自动构成地面。真实搭桥生成地面后才可横穿。

根因是生成脚本自动把邻接平台的 H/V 梯子格补成地面。已删除此推断，也删除了第 25 关的专用平台覆盖。依照原始 H/V 地形统一清除其余 20 个关卡中 28 个误补地面格，保留其他布局。审计记录：`/Volumes/SANDISK/Codex/brain-play/ladder-floor-audit.json`。

## 引擎测试

121 项骨牌专项测试通过，涵盖带梯子与不带梯子的空隙、实际搭桥后的横向行走，以及多个编号和 H/V 两种字符的生成结果。不为具体空隙设置通行开关。静态检查与 diff 空白检查通过。未包含先前全套运行已有失败的 domino.test.js 和 domino-actor.test.js。

日志：`/Volumes/SANDISK/Codex/brain-play/ladder-floor-unified-tests.log`、`ladder-floor-unified-check.log`。

## 真实网页操作

Chrome 重新加载本地太空 25。右侧平台向左走入断口后，蚂蚁落到下一层，没有横穿。随后由下一层沿梯子爬回第二层断口，确认左右方向按钮均禁用，上下通行保留。未进行本关通关验证。

截图：`/Volumes/SANDISK/Codex/brain-play/ladder-floor-unified.png`。

## App 通信模拟

未测。

## 真机测试

未测。
