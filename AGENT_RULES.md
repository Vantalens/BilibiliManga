# BiliManga AGENT_RULES

版本：v0.1.0
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

## 禁止行为

- 不实现支付、充值、购买、解锁、权益变更接口。
- 不绕过付费、鉴权、风控或官方访问限制。
- 不提供图片导出、永久离线包、批量下载。
- 不记录真实 Cookie、Token、账号、订单或密钥。
- 不把构建通过当作真实 GUI 路径通过。

## 质量门禁

- 新功能先写失败测试，再写实现。
- 阶段完成前运行单元测试、构建和真实路径验证。
- P0/P1、安全问题必须当前阶段修复或明确阻断。

