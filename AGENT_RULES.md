# BiliManga AGENT_RULES

版本：v0.2.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 执行顺序

每次开发前先阅读：

1. `PRD.md`
2. `APP_FLOW.md`
3. `TECH_STACK.md`
4. `IMPLEMENTATION_PLAN.md`
5. `TEST_PLAN.md`
6. `SECURITY.md`
7. `progress.md`
8. `docs/github-workflow.md`
9. 涉及接口时读取 `docs/interface-research.md` 和 `docs/api-boundaries.md`

## 禁止行为

- 不实现支付、充值、购买、解锁、权益变更接口。
- 不绕过付费、鉴权、风控或官方访问限制。
- 不提供图片导出、永久离线包、批量下载。
- 不记录真实 Cookie、Token、账号、订单或密钥。
- 不把构建通过当作真实 GUI 路径通过。

## 文档同步

- 每个非 trivial 代码改动必须同步更新相关文档。
- 接口调研必须更新 `docs/interface-research.md`，记录来源、时间、请求体、响应样例、失败模式和降级路径。
- 安全边界变化必须更新 `SECURITY.md` 和 `docs/api-boundaries.md`。
- 阶段状态变化必须更新 `progress.md` 和必要的 `IMPLEMENTATION_PLAN.md`。

## GitHub 提交

- 开发前后都要检查 `git status -sb`。
- 只暂存与当前任务相关的文件，不提交临时调研快照、构建产物或密钥。
- 提交前默认运行 `git diff --check`、`npm test`、`npm run build`；涉及 Rust/Tauri 时加跑 `cargo test`、`cargo check` 和 `npm run tauri -- build`。
- commit message 使用简短英文 Conventional 风格。
- 提交后必须 `git push`，并确认本地 `HEAD` 与 `origin/main` 同步。

## 质量门禁

- 新功能先写失败测试，再写实现。
- 阶段完成前运行单元测试、构建和真实路径验证。
- P0/P1、安全问题必须当前阶段修复或明确阻断。
