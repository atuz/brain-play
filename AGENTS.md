# 本项目开发约定

- 用户要求节约本机硬盘：下载的参考程序、素材、研究截图、调试日志、测试产物和临时构建文件统一放在 `/Volumes/SANDISK/Codex/brain-play/`。项目目录只保留代码、运行所需资源、测试源代码和文档。
- 参考资料目录实际位于 `/Volumes/SANDISK/Codex/brain-play/references/game-references/`；`/Users/pingzheng/Study/game-references` 是兼容旧路径的符号链接。不要把外部盘内容重新复制进项目或打包发布。SANDISK 不可用时先说明，避免悄悄把大量产物写回内置硬盘。
- 新游戏要实际打开网页，通过公开控件试玩并检查动作和通关，不能用引擎模拟通过代替浏览器操作。文档分别记录引擎测试、真实网页操作、App 通信模拟和真机测试。
- 修改先在本地验证，按一批完整改动处理发布；不要每改一点就 push。
