# 三款经典智力游戏的研究与开发

用户要求：按 LaserTank → Atomix → Zeek 的顺序逐个进行。每款先找到能运行的网站／程序，充分实际试玩，将细节、道具、互动和动画写成文档；再开发本项目的 JavaScript 游戏。检查 Linux、macOS、Windows 重制版的下载与运行可能性。

## 证据标准

- **实际观察**：通过真实页面／程序的操作和画面观察；保留关卡、步骤、结果和截图。
- **资料记载**：来源说明书／作者项目页面，不能写成已经实际验证。
- **待验证**：尚未运行、没有覆盖到或不同版本的差异。不能因看过图鉴就宣称动作全部测完。
- 同一物品分别检查：初始外观、可执行操作、启动、持续状态、碰撞／触发、终止／破坏、撤销／重开、边界和组合。
- 不用原项目的私有状态、内部函数、自动通关或修改胜负；原项目以可见界面操作。原项目源码可辅助核查，须另行标注。
- 本项目关卡需独立设计，记录可执行解法，再从正常界面手动验证。

## 顺序与进度

| 顺序 | 项目 | 试玩研究 | 文档 | 本地开发 | 本项目实际试玩 |
| --- | --- | --- | --- | --- | --- |
| 1 | LaserTank | 主要规则已实测，边界见文档 | [记录](lasertank/RESEARCH.md)／[实验](lasertank/EXPERIMENTS.md) | 16 关本地完成 | 16 关全部界面通关 |
| 2 | Atomix | DOS＋两种网页版已实玩 | [记录](atomix/RESEARCH.md)／[实现](atomix/IMPLEMENTATION.md) | 18 关本地完成 | 18 关全部界面通关 |
| 3 | Zeek the Geek | HTML5 原关＋15 个道具实验 | [记录](zeek/RESEARCH.md)／[实现](zeek/IMPLEMENTATION.md) | 24 关本地完成 | 24 关全部界面通关（思考模式） |

研究程序／安装包放在 `/Users/pingzheng/Study/game-references`，不混入游戏站点。当前主机为 Intel macOS；没有现成的 Wine、DOSBox 或 Godot。浏览器可操作；原生 App 的自动化界面能力当前不可用，因此原生版本必须区分“下载成功”“可启动”“可操作试玩”。

## 已找到的入口（尚未全部验证）

| 项目 | 类型 | 地址 | 当前核查 |
| --- | --- | --- | --- |
| LaserTank-RE | 浏览器／Godot 重制版 | https://lasertank.pages.dev/ | 已启动，正常显示棋盘和游戏内图鉴 |
| LaserTank-RE | 作者发布页，提供 Mac／Win／Linux | https://antaciid.itch.io/lasertank | 三个系统包实际下载；Mac 架构／签名已查，原生界面试玩受限 |
| LaserTank | 原版 Windows 下载与帮助 | https://laser-tank.com/game.html | 已找到，待下载核查 |
| Atomiks | Atomix 的开源重制版 | https://atomiks.sourceforge.net/ | Win32 与源码包已下载；SDL2 依赖已查 |
| GNOME Atomix | Linux 重制版 | https://wiki.gnome.org/Apps%282f%29Atomix.html | 已找到，待核查 |
| KAtomic | KDE 重制版 | https://apps.kde.org/katomic/ | Mac 官方构建已下载、架构/签名核查；未运行 |
| Atomix | 原版 DOS 浏览器模拟候选 | https://retrogamespace.com/games/atomix | 仅搜索命中，未确认能玩 |
| Zeek the Geek | HTML5 重制版 | https://frank-deng.github.io/zeek-the-geek/ | 已实际试玩、逐项道具实验，未通关原包全部关卡 |
| Zeek 3D | 作者重制版，Mac／Win／Linux | https://atoon-lab.itch.io/zeek3d | Mac／Win／Linux 三个包已下载；Mac 通用架构、签名检查通过但系统运行评估拒绝，未运行 |

最后更新：2026-10-22（America/Toronto）。

## 本轮最终验证

本项目三款共58关均从正常界面操作通关并留图；全站417项测试通过，71个运行资源的JavaScript语法和模块路径检查通过。测试截图见各游戏 `local-play/`；本地App消息复查记录见 [app-bridge-events.txt](app-bridge-events.txt)。这不是iPhone真机安装测试。资源模块与样式统一版本40，防止旧缓存混用。当前改动保留在本地，未push。

## 控件实玩复查

[逐项操作和三处实际bug修复记录](interaction-qa/PLAYTEST.md)：帮助未暂停、空格抢走按钮操作、浏览器返回残留帮助窗口，均已通过真实界面复测。

## 百战小旅鼠与原作截图补齐

[百战小旅鼠研究](lemmings/RESEARCH.md)：已保存用户确认的初代 DOS 120 关开局和600张横向视野，八种技能实际操作留图；明确记录五关通关、一次超时和未完成的原版验证项。[本站实现](lemmings/IMPLEMENTATION.md) 已完成八种技能、24 个原创关卡并通过真实网页控件逐关通关。研究资料和调试产物存放于 SANDISK，旧资料路径保留符号链接。

[原关开局与道具截图核查](CAPTURE_AUDIT.md)覆盖此前的 Push-Over、Domino-Chain、奇妙装置、LaserTank、Atomix、Zeek；[本地截图总目录](http://127.0.0.1:4176/)可查看开局与道具图片。旧游戏尚未补齐完整原关集，不能用自制关卡的通关图代替。

[每种用过的道具都要截图](TOOL_SCREENSHOTS.md)列出逐项目录、截图阶段和缺口。本轮另补齐 Atomix original 包 30 关、Zeek 两原包 45 关开局；奇妙装置 45 种工具、LaserTank 15 类对象、Domino-Chain 12 类骨牌等已建立按道具查图的页面。
