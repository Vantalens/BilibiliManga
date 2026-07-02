# BiliManga progress

版本：v0.2.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## Done

- 已确认开发计划。
- 已确认参考官方 B 站 PC 客户端的架构模式，不切换 Electron。
- 已初始化 Git 仓库并设置 origin 为 https://github.com/Vantalens/BilibiliManga.git。
- 已建立 DevDocsKit 文档基线。
- 已实现 Tauri + React + TypeScript 桌面骨架。
- 已用 TDD 实现 reader/cache/library/entitlement/apiAdapter/releasePolicy 纯逻辑。
- 已实现 Rust keyring 数据库密钥基线；前端无法读取密钥明文。
- 已实现受控 `clear_image_cache`，只清理应用图片缓存目录。
- 已建立 API 边界文档，阻止购买/充值/解锁等敏感链路进入原生 adapter。
- 已建立 release gate 文档；当前仅支持内测安装包。
- 已生成 Windows 内测 NSIS 安装包。

## In Progress

- 阶段 2：SQLCipher 或等价全库加密实际数据库文件验证仍未完成。
- 阶段 3：真实哔哩哔哩漫画接口调研仍未开始。

## Next

- 验证 SQLCipher 或等价全库加密方案，并接入真实本地数据库迁移。
- 配置 updater 签名私钥、公钥和 HTTPS 更新源。
- 开始真实接口调研并填充 `docs/interface-research.md`。
- 做真实 Windows GUI 路径验证，包括安装、启动、初始化安全存储、清理缓存、阅读器模式切换。

## Blockers

- 尚未进行真实接口调研。
- 尚未验证加密 SQLite 实际数据库文件。
- 尚未配置 updater 签名私钥、公钥和更新源；当前只能生成内测安装包。
- 尚未完成真实账号连续阅读 1-2 小时验证。
## Codegraph

- 当前未初始化：`mcp__codegraph.codegraph_files` 返回 `CodeGraph not initialized`。
- 本轮替代检查方式：Git 状态、文件检查、前端测试、Rust 测试、前端构建、Tauri 构建。
- 进入接口适配器扩展、存储重构或跨模块修改前，应执行 codegraph 初始化。
