# BiliManga

Windows 桌面端哔哩哔哩漫画阅读器 - 技术验证 MVP

## 🚀 项目状态

**完成度：70%** | **最后更新：2026-07-03**

✅ **已完成**
- Tauri 2 + React 19 + TypeScript 完整架构
- SQLCipher 加密数据库 + 系统密钥环
- 本地书库管理（标签、分组、评分、备注）
- 阅读器（长滚动/分页）+ 进度持久化
- 图片缓存索引 + 容量清理
- 搜索建议接口已验证并接入 UI
- 44 个测试全部通过

⚠️ **待完成（核心阻塞）**
- 真实账号接口验证（登录、书架、详情、章节图片）
- UI 登录流程接入
- 真实 GUI 路径测试

📖 **详细说明**：[`HANDOVER.md`](HANDOVER.md) | **开发指南**：[`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md)

---

## ⚡ 快速开始

### 前置要求

- Node.js 24+
- Rust 1.95+
- Strawberry Perl（Windows 构建 SQLCipher 所需）

```powershell
# 安装 Strawberry Perl
winget install --id StrawberryPerl.StrawberryPerl --exact

# 如果当前 shell 打开在 Perl 安装之前，临时添加到 PATH
$env:Path = 'C:\Strawberry\perl\bin;C:\Strawberry\c\bin;C:\Strawberry\perl\site\bin;' + $env:Path
```

### 开发环境运行

```powershell
# 1. 安装依赖
npm install

# 2. 运行开发服务器
npm run tauri dev

# 3. 体验已完成功能
# - 书库搜索（已接入真实搜索建议 API）
# - 示例阅读器（长滚动/分页切换）
# - 缓存状态查看
# - 登录状态 gate（当前显示"未登录"提示）
```

### 测试

```powershell
# 前端测试（26 tests）
npm test

# Rust 测试（18 tests）
cd src-tauri
cargo test

# 构建验证
npm run build
cargo check
```

### 生成安装包

```powershell
npm run tauri -- build

# 输出：src-tauri/target/release/bundle/nsis/BiliManga_0.1.0_x64-setup.exe
```

---

## 📋 下一步开发

**核心任务：真实接口验证**（详见 [`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md)）

1. **浏览器抓包**（2-4 小时）
   - 访问 https://manga.bilibili.com
   - DevTools → Network → 扫码登录
   - 记录登录、书架、详情接口

2. **实现真实 API**（1-2 天）
   - 更新 `src-tauri/src/api.rs` 占位函数
   - 实现 Cookie 持久化
   - 添加登录态检查

3. **UI 接入**（1-2 天）
   - `src/App.tsx` 添加登录流程
   - 登录成功后加载真实书架
   - 映射数据到本地 SQLCipher

4. **测试验证**（1-2 天）
   - 真实环境：安装 → 登录 → 阅读 1-2 小时
   - 异常场景：断网、登录过期、未解锁章节

**预计完成时间**：4-7 个工作日

---

## 🔒 安全边界

### 禁止实现
- ❌ 支付、充值、购买、解锁
- ❌ 券、余额、订单、权益变更
- ❌ 绕过官方风控、鉴权或访问限制

### 必须降级到官方网页
- 未解锁章节
- 购买流程
- 账号敏感操作

### 缓存策略
- 短期性能优化
- 容量上限 + 过期清理
- 不可导出，不提供永久离线包

---

## 🏗️ 技术栈

- **前端**：Tauri 2 + React 19 + TypeScript + Vite 7
- **后端**：Rust + reqwest + SQLCipher (rusqlite)
- **安全**：系统密钥环 (keyring) + 全库加密
- **测试**：Vitest (前端) + Rust built-in test
- **目标平台**：Windows MVP（结构预留 macOS/Linux）

---

## 📁 项目结构

```
BiliManga/
├── src/                          # 前端代码
│   ├── domain/                   # 业务逻辑（TDD）
│   │   ├── auth.ts              # 登录状态决策
│   │   ├── entitlement.ts       # 权益状态决策
│   │   ├── reader.ts            # 阅读器逻辑
│   │   ├── library.ts           # 书库管理
│   │   ├── cache.ts             # 缓存策略
│   │   └── apiAdapter.ts        # 接口分类
│   ├── bridge/                   # Tauri Bridge
│   └── App.tsx                   # 主 UI
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── api.rs               # API 调用（待验证）
│       ├── storage.rs           # 加密存储
│       ├── security.rs          # 密钥管理
│       └── lib.rs               # Tauri 命令
├── docs/                         # 项目文档
│   ├── NEXT_STEPS.md           # 开发指南 👈 必读
│   ├── interface-research.md   # API 调研状态
│   └── api-boundaries.md       # 安全边界
├── HANDOVER.md                  # 交接报告 👈 必读
├── progress.md                   # 实时进度
└── *.md                         # 其他文档
```

---

## 📚 关键文档

### 必读
- **[`HANDOVER.md`](HANDOVER.md)** - 项目交接报告，当前状态总结
- **[`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md)** - 详细开发指南，接口验证方法

### 规范
- [`PRD.md`](PRD.md) - 产品需求
- [`SECURITY.md`](SECURITY.md) - 安全边界
- [`TEST_PLAN.md`](TEST_PLAN.md) - 测试计划
- [`AGENT_RULES.md`](AGENT_RULES.md) - 开发规范

### 技术
- [`TECH_STACK.md`](TECH_STACK.md) - 技术栈详情
- [`APP_FLOW.md`](APP_FLOW.md) - 应用流程
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) - 实现计划

### 接口调研
- [`docs/interface-research.md`](docs/interface-research.md) - API 状态
- [`docs/api-boundaries.md`](docs/api-boundaries.md) - 接口边界
- [`docs/api-research-plan.md`](docs/api-research-plan.md) - 验证方法

### 进度
- [`progress.md`](progress.md) - 实时进度跟踪

---

## 🧪 测试覆盖

- ✅ 前端单元测试：26 tests passing
- ✅ Rust 测试：18 tests passing
- ✅ 登录状态决策（authenticated/unauthenticated/expired）
- ✅ 权益状态决策（accessible/locked/unknown）
- ✅ 阅读器导航（长滚动/分页）
- ✅ 书库筛选和统计
- ✅ 缓存清理策略（过期优先 + LRU）
- ✅ SQLCipher 加密验证（同密钥可读、错误密钥拒绝）

---

## 🤝 开发工作流

1. **提交前验证**
   ```powershell
   git diff --check
   npm test
   npm run build
   cd src-tauri && cargo test && cargo check
   ```

2. **文档同步**
   - 代码变更 → 更新相关文档
   - 接口调研 → 更新 `docs/interface-research.md`
   - 完成阶段 → 更新 `progress.md`

3. **Git 提交**
   - 使用 Conventional Commits 格式
   - 提交后必须 `git push`

详细工作流：[`docs/github-workflow.md`](docs/github-workflow.md)

---

## ⚠️ 已知限制

- 登录、书架、详情、章节图片接口尚未验证
- UI 未接入真实登录流程
- 未配置 Updater 签名密钥
- 未完成真实 GUI 路径测试（连续阅读 1-2 小时）

---

## 📞 问题排查

### Q: 编译失败？
```powershell
npm install
npm run build
cd src-tauri && cargo clean && cargo build
```

### Q: 测试失败？
```powershell
npm test -- --reporter=verbose
cd src-tauri && cargo test -- --nocapture
```

### Q: 接口调用失败？
1. 查看 `docs/interface-research.md` 确认接口状态
2. 检查 DevTools Console 和 Rust 日志
3. 验证请求头、Cookie 是否正确

---

## 📄 License

UNLICENSED - 内部技术验证项目

---

## 🎯 项目目标

Windows 桌面端哔哩哔哩漫画阅读器，目标是登录后能连续阅读 1-2 小时，并可靠保存进度、书库管理数据和阅读偏好。

**当前状态**：基础架构完成（70%），等待真实接口验证（30%）。  
**预计完成**：4-7 个工作日。

🚀 立即开始：阅读 [`HANDOVER.md`](HANDOVER.md) 和 [`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md)！
