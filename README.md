# BiliManga

哔哩哔哩漫画 Windows 桌面客户端

---

## 简介

BiliManga 是一个基于 Tauri 的哔哩哔哩漫画桌面阅读器，提供更好的阅读体验和本地书库管理功能。

### 核心特性

- **安全存储**：SQLCipher 加密数据库 + 系统密钥环保护
- **本地书库**：标签、分组、评分、备注，完全离线管理
- **阅读器**：长滚动/分页模式，全屏沉浸阅读
- **自动同步**：阅读进度自动保存
- **智能缓存**：短期性能缓存，自动清理
- **Cookie 管理**：系统密钥环安全存储，自动加载

---

## 快速开始

### 环境要求

- Node.js 24+
- Rust 1.95+
- Windows 10/11

### 安装依赖

```powershell
npm install
```

### 开发模式

```powershell
npm run tauri dev
```

### 构建应用

```powershell
npm run tauri build
```

生成的安装包位于：`src-tauri/target/release/bundle/nsis/`

---

## 使用方法

### 首次使用

1. 启动应用
2. 从浏览器获取 Cookie（Chrome → F12 → Network → Cookie）
3. 在 API 测试面板中粘贴并保存
4. 点击导航栏"我的已购"查看漫画列表

### Cookie 获取方式

详见：[docs/COOKIE_VERIFICATION_GUIDE.md](docs/COOKIE_VERIFICATION_GUIDE.md)

---

## 功能特性

### 已实现

- 登录状态管理
- 已购漫画列表
- Cookie 安全存储（Windows 凭据管理器）
- 本地书库管理
- 阅读器（长滚动/分页）
- 阅读进度自动保存
- 图片缓存管理

### 计划中

- 书架同步
- 章节详情
- 离线阅读
- 多设备同步

---

## 技术栈

- **前端**：React 19 + TypeScript + Vite
- **桌面框架**：Tauri 2
- **后端**：Rust + reqwest
- **数据库**：SQLCipher（加密 SQLite）
- **安全存储**：keyring（系统密钥环）
- **测试**：Vitest + Rust 内置测试

---

## 项目结构

```
BiliManga/
├── src/                      # React 前端
│   ├── components/          # UI 组件
│   ├── domain/              # 业务逻辑
│   └── bridge/              # Tauri 桥接
├── src-tauri/               # Rust 后端
│   └── src/
│       ├── api.rs          # API 调用
│       ├── cookies.rs      # Cookie 管理
│       ├── storage.rs      # 数据库
│       └── security.rs     # 安全模块
└── docs/                    # 文档
```

---

## 安全声明

### 数据保护

- Cookie 存储在 Windows 凭据管理器（系统加密）
- 数据库使用 SQLCipher 全库加密
- 密钥由系统密钥环保护
- 不记录敏感信息到日志

### 功能边界

本项目**仅**实现以下功能：
- 查看已购漫画
- 本地书库管理
- 阅读已解锁内容

本项目**不会**实现：
- ❌ 支付、充值、购买
- ❌ 解锁付费内容
- ❌ 绕过官方限制

未解锁内容将跳转到官方网页处理。

---

## 测试

```powershell
# 前端测试
npm test

# Rust 测试
cd src-tauri
cargo test

# 构建验证
npm run build
cargo check
```

---

## 文档

- [快速开始](QUICKSTART.md) - 快速上手指南
- [Cookie 验证指南](docs/COOKIE_VERIFICATION_GUIDE.md) - 详细验证步骤
- [安全边界](SECURITY.md) - 安全声明和边界
- [技术栈](TECH_STACK.md) - 技术栈详情

---

## 开发

### 命令

```powershell
npm install              # 安装依赖
npm run tauri dev        # 开发模式
npm test                 # 运行测试
npm run build            # 前端构建
npm run tauri build      # 生成安装包
```

### 贡献

欢迎提交 Issue 和 Pull Request。

---

## License

UNLICENSED - 个人项目

---

## 致谢

- [Tauri](https://tauri.app/) - 桌面应用框架
- [React](https://react.dev/) - UI 框架
- [SQLCipher](https://www.zetetic.net/sqlcipher/) - 加密数据库

---

**注意**：本项目仅供学习交流使用，请遵守哔哩哔哩相关服务条款。
