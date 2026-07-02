# BiliManga TECH_STACK

版本：v0.3.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 技术栈

- Node.js：v24.14.1（本机已验证）
- npm：11.11.0（本机已验证）
- Rust：rustc 1.95.0 / cargo 1.95.0（本机已验证）
- Tauri CLI：2.11.4
- Tauri API：2.11.1
- React：19.2.7
- TypeScript：6.0.3
- Vite：7.3.6（@vitejs/plugin-react 5.1.2 当前 peer 范围支持 Vite 4-7，暂不使用 Vite 8）
- Vitest：4.1.9
- keyring：4.1.2（系统密钥环基线）
- base64：0.22.1（数据库密钥编码）
- getrandom：0.3.4（数据库密钥生成）
- rusqlite：0.40.1 + bundled-sqlcipher-vendored-openssl（加密 SQLite）
- Strawberry Perl：5.42.2.1（Windows 上编译 vendored OpenSSL/SQLCipher 所需）

## 架构决策

ADR-001：保留 Tauri，不切换 Electron。

原因：官方 B 站 PC 客户端是 Electron/Chromium，多入口页、登录 WebView、失败页和 updater 模式值得参考；BiliManga 仍优先控制安装体积、系统资源和跨平台边界。

ADR-002：敏感权益链路使用官方网页。

原因：支付、充值、购买、解锁和权益变更涉及账号与资金安全，不进入逆向实现范围。

ADR-003：本地数据全库加密。

原因：书库、阅读历史、偏好和账号状态属于隐私数据。密钥由系统密钥环或等价安全存储保护。当前已实现 keyring 保护的数据库密钥基线，并已通过 SQLCipher 实际数据库文件验证：同密钥可读、错误密钥失败、数据库文件头不是明文 SQLite。

## 模块边界

- `auth`：登录态、扫码登录、Cookie 调试导入。
- `api-adapter`：接口封装、错误映射、限流、重试。
- `entitlement`：可访问状态判断和官方网页跳转。
- `library`：本地书库、标签、分组、评分、备注、统计。
- `reader`：阅读模式、进度、预加载、快捷键。
- `storage`：加密数据库、迁移、缓存索引、系统密钥环。
- `updater`：签名更新和失败回滚。