# BiliManga GitHub Workflow

版本：v0.1.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 目标

所有开发都必须按可审计方式同步到 GitHub：先确认范围，再修改代码和文档，再验证，再提交并推送。构建通过不能替代真实路径验证。

## 开发前检查

每轮非 trivial 修改前必须确认：

- `git status -sb`，确认工作树状态和是否存在用户未提交改动。
- 阅读当前任务相关文档：至少包括 `progress.md`、`IMPLEMENTATION_PLAN.md`、`TEST_PLAN.md`、`SECURITY.md`；涉及接口时还必须读 `docs/interface-research.md` 和 `docs/api-boundaries.md`。
- 涉及跨模块、存储、接口 adapter、reader 主流程或安全边界时，应优先使用 codegraph 或记录替代检查方式。

## 修改要求

- 代码、测试、文档必须同步更新。新增行为必须在 `progress.md` 记录当前状态，并在对应专题文档补证据或边界。
- 接口调研必须记录来源、时间、请求方法、URL、请求体、必要 header、响应样例、失败模式和降级路径。
- 不提交临时网页快照、真实 Cookie、Token、账号、订单、密钥、图片鉴权 URL 或构建产物。
- 不把购买、充值、支付、解锁、钱包、券、余额、订单或权益变更接口接入原生 adapter。

## 验证顺序

默认提交前运行：

```powershell
git diff --check
npm test
npm run build
```

涉及 Rust/Tauri/storage/security 时还必须运行：

```powershell
$env:Path = 'C:\Strawberry\perl\bin;C:\Strawberry\c\bin;C:\Strawberry\perl\site\bin;' + $env:Path
cd src-tauri
cargo test
cargo check
cd ..
npm run tauri -- build
```

如果某项验证无法运行，必须在 `progress.md` 或最终交付中记录具体阻断原因和未验证风险。

## 提交要求

- 提交前再次检查 `git status --short`，只暂存与当前任务相关的文件。
- commit message 使用简短英文 imperative/Conventional 风格，例如 `docs: record search suggestion schema` 或 `feat: persist reading progress`。
- 每个提交应有明确主题：接口调研、storage、reader、release、docs 等不要混成不可审计的大包。
- 提交后执行 `git push`，再用 `git status -sb` 和 `git log --oneline --decorate -3` 确认 `HEAD` 与 `origin/main` 同步。

## GitHub 仓库

当前远端：`https://github.com/Vantalens/BilibiliManga.git`。

默认分支：`main`。

当前项目仍处于内测/MVP 阶段；没有签名证书和 HTTPS updater 源之前，不发布正式 release。
