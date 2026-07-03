# BiliManga TEST_PLAN

版本：v0.2.0
作者：Codex
状态：草稿
最后更新：2026-07-03

## 提交前默认门禁

- `git diff --check`。
- `npm test`。
- `npm run build`。
- 涉及 Rust/Tauri/storage/security 时追加 `cargo test`、`cargo check`、`npm run tauri -- build`。
- 任何无法运行的验证必须记录阻断原因和未验证风险。

## 自动化测试

- 单元测试：接口解析、错误映射、阅读进度、阅读偏好、筛选统计、缓存索引、缓存清理、数据库迁移。
- 集成测试：登录态恢复、书架同步、本地书库写入、章节加载、未解锁跳官方网页后刷新状态。

## 真实 GUI 验证

- Windows 安装、启动、扫码登录。
- 打开书架漫画并连续阅读 1-2 小时。
- 长滚动和分页各验证一轮。
- 全屏、隐藏 UI、快捷键、深浅主题切换。

## 异常路径

- 断网。
- 接口失败。
- 图片失败。
- 登录过期。
- 缓存满。
- 数据库解锁失败。
- 更新失败。

## 发布阻断

- 自动更新 artifact 需要 `TAURI_SIGNING_PRIVATE_KEY` 和 updater 公钥；未配置前只允许生成内测安装包。
