# Brain Play 网页游戏项目交接报告

更新时间：2026-11-05  
线上地址：[https://atuz.github.io/brain-play/](https://atuz.github.io/brain-play/)  
本地仓库：`/Users/pingzheng/Study/brain-play`  
远程仓库：`https://github.com/atuz/brain-play.git`

## 项目成果

这是一个以手机浏览器和 iOS／Android WebView 为目标的纯前端益智游戏合集。首页直接列出游戏，页面支持简体中文、繁体中文和英语；URL 可带 `lang`、`country`、`app` 参数。网页没有服务端账号依赖，普通浏览器进度使用 localStorage。

目前有 15 款可玩的游戏：2048／斐波那契合并、24 点、水果连连看、消灭星星、熄灯、数字拼图、接水管、迷你数织、猜数字、蚂蚁多米诺、机关工坊、激光坦克、分子拼图、蘑菇花园、百战小旅鼠。后五款及较复杂的原创关卡有独立引擎、固定关卡、触屏交互、动画、撤销／续玩等功能；详情见仓库根目录 `README.md` 和各游戏研究文档。

“百战小旅鼠”是独立实现的作品：24 个原创关卡、3 个主题章节、8 种技能，人物和场景由 Canvas 代码绘制。它参考了原版玩法和动作节奏，但没有把原版 DOS 的关卡、人物素材或音乐作为网站运行资源。其实现与实际试玩记录在 `research/lemmings/IMPLEMENTATION.md`。

网页与 App 已约定统一的 WebView 消息接口：页面就绪、页面／关卡导航、App 暂停／恢复、广告放行、结果上报、存档与返回 App。iOS 端相关代码在另一个仓库 `MyKatago2/ios/GoAI/UI/SettingsViews.swift`。完整协议、编码和调用时机见 `README.md` 的 App 章节。国家码由 App URL 提供；普通浏览器可从浏览器地区偏好读取，不做 IP 定位。

## 当前进度与验证边界

- 最近提交在分支 `codex/webview83-compat`：`abe50e6 Support legacy WebView and fix launcher SVG sizing`。远程为 GitHub `atuz/brain-play`；线上已有可访问页面。
- `README.md` 记录了版本 47 的旧 WebView、Chrome、桌面 WebKit 检查，以及版本 48 的 iPhone 图标修复验证。`research/lemmings/IMPLEMENTATION.md` 记录 24 关逐关操作及其边界。请按各文档注明的测试范围理解结果，不要把浏览器夹具测试当成 iOS 真机验证。
- 当前工作树有未提交变更：`app-host.js` 已修改；本报告尚未提交。近期 Atomix、LaserTank、Zeek 的本地通关截图、交互证据与 App 消息记录已归档到 `/Volumes/SANDISK/Codex/brain-play/debug/handoff-20261105/research/`，不进入游戏包或 Git 提交。
- 仓库根目录 `vendor/` 中的 Matter.js 0.20.0 是“机关工坊”实际运行依赖，随网页提供；对应许可证在 `vendor/matter-LICENSE.txt`。大部分自制视觉素材由 SVG、Canvas、CSS 和 JavaScript 绘制，而不是下载原游戏图片。

## 下载的原版／参考资料、截图与试玩资源位置

原版安装包、源码副本、参考网页和大批截图集中放在外置盘：

`/Volumes/SANDISK/Codex/brain-play/references/game-references/`

仓库中有一个便于访问的符号链接：

`/Users/pingzheng/Study/brain-play/game-references` → `/Volumes/SANDISK/Codex/brain-play/references/game-references`

外置盘参考资料顶层包括：

- `atomiks-1.0.4.1/`、`atomiks-1.0.4.1.tar.gz`、`atomiks-1.0.4.1-win32.zip`：Atomix／Atomiks 参考程序、图片、音效和关卡文件。
- `lasertank-re.mac.dmg`、`lasertank-re.linux.tar.gz`、`lasertank-re.win.zip`：LaserTank Re 参考程序包。
- `lemmings-eric/`：Lemmings 相关参考实现／工具材料。
- `zeek-html5/`、`zeek3d-mac-inspected/`、`zeek3d-linux.zip`、`zeek3d-mac.zip`、`zeek3d-win-64.zip`：Zeek 参考网页源码和不同平台程序。
- `katomic-master-958-macos-clang-x86_64.dmg`：KAtomic 参考程序。
- `captures/`：原版或参考游戏页面的开局、关卡、道具动作和试玩截图，以及索引、manifest、校验／审计资料。主要子目录有 `lemmings-dos-1991/`、`push-over-dos-1992/`、`incredible-machine-1993/`、`atomix-original/`、`lasertank-main/`、`domino-chain/`、`zeek-original/` 等。Lemmings 初代 DOS 120 关的资料归档在 `captures/lemmings-dos-1991/`；目录内 `manifest.json`、`index.html` 和审计 JSON 记录截图范围与检查结果。

最近一轮项目自身的本地试玩和 QA 截图归档在外置盘：

- `/Volumes/SANDISK/Codex/brain-play/debug/handoff-20261105/research/atomix/`
- `/Volumes/SANDISK/Codex/brain-play/debug/handoff-20261105/research/lasertank/`
- `/Volumes/SANDISK/Codex/brain-play/debug/handoff-20261105/research/zeek/`
- `/Volumes/SANDISK/Codex/brain-play/debug/handoff-20261105/research/interaction-qa/`、`local-home.jpg`、`app-bridge-events.txt`
- 长期研究与说明文档仍在仓库的 `research/atomix/`、`research/lasertank/`、`research/zeek/`、`research/interaction-qa/`；Lemmings 文档在 `research/lemmings/`。
- `research/lemmings/IMPLEMENTATION.md`、`research/lemmings/RESEARCH.md`：试玩说明和验证边界；临时大量调试截图、浏览器记录和缓存已按项目约定放到外置盘。

外置盘其他调试输出在 `/Volumes/SANDISK/Codex/brain-play/debug/`；浏览器审计／兼容性资料在 `/Volumes/SANDISK/Codex/brain-play/compat-audit-20261023/`。不要把这些原版参考包、截图或调试输出误认为网站的线上静态资源；网站运行不依赖外置盘。

## 后续接手建议

1. 先读根目录 `AGENTS.md`、`README.md`，再读目标游戏的研究／实现文档。
2. 修改前确认上面列出的未提交工作树内容，尤其 `app-host.js` 和三款游戏的研究截图，不要覆盖或误丢。
3. 参考资料盘若未挂载，`game-references` 符号链接将不可用；网站源码和运行所需文件仍在本地仓库。
4. 发布前按项目约定验证相应浏览器／WebView，再明确检查变更并提交、push。当前未提交内容不要默认视为已经上线。
