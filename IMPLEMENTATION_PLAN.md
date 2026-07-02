# BiliManga IMPLEMENTATION_PLAN

版本：v0.1.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 阶段 1：项目基线

- TASK-001：初始化 Git、文档基线、前端测试配置。
- TASK-002：用 TDD 实现 reader/cache/library 纯逻辑。
- TASK-003：搭建 Tauri/React 桌面骨架和静态数据 UI。
- TASK-004：建立接口调研报告模板和安全边界。

## 阶段 2：技术验证

- TASK-005：验证 Tauri Windows 启动、构建、Rust invoke。
- TASK-006：验证加密 SQLite 和系统密钥环方案。当前已完成系统密钥环基线，SQLCipher 实际数据库文件验证仍未完成。
- TASK-007：验证 updater 签名、静态 JSON 更新源和失败回滚。未配置签名私钥前，``createUpdaterArtifacts`` 保持关闭，只生成内测安装包。

## 阶段 3：接口调研

- TASK-008：调研登录、书架、历史、搜索、详情、章节、图片、进度。
- TASK-009：按稳定性和敏感性分类接口。当前已建立 apiAdapter 边界和敏感链路阻断测试。
- TASK-010：确认不可逆向实现的敏感链路并接入官方网页降级。

## 阶段 4：MVP 功能

- TASK-011：实现登录和登录态恢复。
- TASK-012：实现书库同步和本地管理。
- TASK-013：实现阅读器、短期缓存和进度恢复。
- TASK-014：实现官方网页跳转和状态刷新。

## 验收

- 自动化测试和真实 Windows GUI 路径都必须通过。
- P0 路径通过率 100%。
- 检查覆盖率达到 80% 以上，或记录阻断原因。


## Codegraph

当前项目尚未初始化 codegraph。阶段 2 之后的跨模块实现应先初始化索引，用于确认模块影响面。
