# BiliManga

Windows 桌面端哔哩哔哩漫画阅读器 MVP

## 🚀 项目状态

**完成度：90%** ⬆️ | **最后更新：2026-07-03 18:20**

✅ **已完成**
- Tauri 2 + React 19 + TypeScript 完整架构
- SQLCipher 加密数据库 + 系统密钥环
- 本地书库管理（标签、分组、评分、备注）
- 阅读器（长滚动/分页）+ 进度持久化
- 图片缓存索引 + 容量清理
- **真实 API 实现**：登录检查、已购漫画接口 ✨
- **Cookie 持久化**：系统密钥环安全存储 ✨
- **验证工具套件**：PowerShell/批处理/UI 面板 ✨
- 47 个测试全部通过（21 Rust + 26 Frontend）

⚠️ **待完成（10%）**
- UI 集成：我的已购页面
- 登录流程优化
- 完整 GUI 测试

📖 **快速开始**：[`QUICKSTART.md`](QUICKSTART.md) | **里程碑**：[`MILESTONE_COOKIE_PERSISTENCE.md`](MILESTONE_COOKIE_PERSISTENCE.md)

---

## ⚡ 快速开始

### 方法 1：一键验证 API（推荐）

```powershell
# 1. 从浏览器获取 Cookie
# Chrome → F12 → Network → 登录 → 复制 Cookie

# 2. 保存到文件
notepad test-cookie.txt
# 粘贴后保存

# 3. 运行测试
.\test-cookie-quick.bat
```

### 方法 2：开发模式

```powershell
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run tauri dev

# 3. 在 UI 中测试：
# - 点击"本地调试通过"
# - 滚动到底部的 "🧪 API 测试面板"
# - 粘贴 Cookie
# - 测试 API 调用
# - 保存到密钥环
```

---

## 🎯 核心功能

### 已实现 ✅

**1. 安全存储**
- SQLCipher 加密数据库
- Windows 凭据管理器存储 Cookie
- 系统密钥环保护

**2. 真实 API**
- `check_login_status()` - B站主站登录检查
- `fetch_purchased_comics()` - 已购漫画列表
- 完整错误码处理（-101, -6, 99）

**3. Cookie 管理**
- 一键保存到密钥环
- 自动加载和验证
- 过期检测

**4. 本地书库**
- 标签、分组、评分、备注
- 筛选和统计
- 完全离线管理

**5. 阅读器**
- 长滚动/分页切换
- 全屏沉浸模式
- 进度自动保存

**6. 测试工具**
- PowerShell 自动化脚本
- Windows 批处理快速测试
- 内置 UI 测试面板

### 待实现 ⏳

- UI：我的已购页面（3-4 小时）
- 登录流程优化（1-2 小时）
- 书架/详情接口（可选）

---

## 📋 今日重大突破

### 2026-07-03：从 70% 跃升至 90%（+20%）

**上午**
- ✅ 分析两份深度研究报告
- ✅ 确认所有 API 端点和鉴权机制

**中午**
- ✅ 实现真实 API 调用
- ✅ 完整错误码处理

**下午**
- ✅ 创建验证工具套件
- ✅ 实现 Cookie 持久化系统

**成果**
- 8 次 Git 提交
- 21 个 Rust 测试通过（新增 3 个）
- 完整文档更新

详见：[`UPDATE_2026-07-03.md`](UPDATE_2026-07-03.md)

---

## 🔒 安全特性

### Cookie 保护
- ✅ 存储在 Windows 凭据管理器（OS 级加密）
- ✅ 零明文暴露（不记录日志，不保存文件）
- ✅ 用户完全控制（一键删除）

### 数据库加密
- ✅ SQLCipher 全库加密
- ✅ 密钥存储在系统密钥环
- ✅ 前端无法读取明文密钥

### 安全边界
- ❌ **禁止实现**：支付、充值、购买、解锁
- ✅ **降级到官方**：未解锁章节、敏感操作
- ✅ **缓存策略**：短期、可清理、不可导出

详见：[`SECURITY.md`](SECURITY.md)

---

## 🛠️ 技术栈

- **前端**：Tauri 2.11 + React 19 + TypeScript 5.7 + Vite 7
- **后端**：Rust 1.95 + reqwest + keyring
- **数据库**：SQLCipher (rusqlite with bundled-sqlcipher)
- **测试**：Vitest (前端) + Rust built-in
- **平台**：Windows 优先（结构预留跨平台）

---

## 📊 测试覆盖

```bash
✅ 前端：26 tests passing
✅ Rust：21 tests passing
✅ 总计：47 tests, 100% passing
```

**覆盖范围**
- 登录状态决策（authenticated/unauthenticated/expired）
- 权益状态决策（accessible/locked/unknown）
- Cookie 解析和持久化（roundtrip, validation）
- SQLCipher 加密验证（同密钥可读、错误密钥拒绝）
- 阅读器导航（长滚动/分页）
- 书库筛选和统计
- 缓存清理策略（过期优先 + LRU）

---

## 📁 项目结构

```
BiliManga/
├── src/                          # React 前端
│   ├── domain/                   # 业务逻辑（纯函数 + TDD）
│   │   ├── auth.ts              # 登录状态决策
│   │   ├── entitlement.ts       # 权益状态决策
│   │   ├── reader.ts            # 阅读器逻辑
│   │   ├── library.ts           # 书库管理
│   │   ├── cache.ts             # 缓存策略
│   │   └── apiAdapter.ts        # 接口分类和边界
│   ├── bridge/tauriBridge.ts    # Tauri 命令封装
│   ├── components/              
│   │   └── ApiTestPanel.tsx    # API 测试面板 ✨
│   └── App.tsx                   # 主界面
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── api.rs               # 真实 API 调用 ✨
│       ├── cookies.rs           # Cookie 持久化 ✨
│       ├── storage.rs           # SQLCipher 存储
│       ├── security.rs          # 密钥管理
│       └── lib.rs               # Tauri 命令注册
├── docs/                         # 完整文档
│   ├── COOKIE_VERIFICATION_GUIDE.md  # Cookie 验证指南 ✨
│   ├── interface-research.md         # API 调研状态
│   └── NEXT_STEPS.md                 # 开发指南
├── test-api.ps1                 # PowerShell 测试脚本 ✨
├── test-cookie-quick.bat        # 快速测试批处理 ✨
├── QUICKSTART.md                # 快速开始 ✨
├── MILESTONE_COOKIE_PERSISTENCE.md  # 里程碑报告 ✨
└── README.md                     # 本文件
```

---

## 📚 核心文档

### 必读
- **[`QUICKSTART.md`](QUICKSTART.md)** - 快速启动指南，立即开始验证
- **[`MILESTONE_COOKIE_PERSISTENCE.md`](MILESTONE_COOKIE_PERSISTENCE.md)** - 最新里程碑报告
- **[`UPDATE_2026-07-03.md`](UPDATE_2026-07-03.md)** - 今日详细更新

### 验证工具
- **[`docs/COOKIE_VERIFICATION_GUIDE.md`](docs/COOKIE_VERIFICATION_GUIDE.md)** - Cookie 完整验证指南
- `test-api.ps1` - PowerShell 自动化测试
- `test-cookie-quick.bat` - Windows 快速测试

### 技术规范
- [`SECURITY.md`](SECURITY.md) - 安全边界
- [`TECH_STACK.md`](TECH_STACK.md) - 技术栈
- [`TEST_PLAN.md`](TEST_PLAN.md) - 测试计划
- [`docs/interface-research.md`](docs/interface-research.md) - API 状态

### 进度跟踪
- [`progress.md`](progress.md) - 实时进度

---

## 🚀 下一步

### 今晚（可选，1 小时）

**验证真实 Cookie**
```bash
test-cookie-quick.bat
```

### 明天（优先，4-5 小时）

**1. UI 集成 - "我的已购"页面**
- 创建 PurchasedComicsPage 组件
- 从密钥环加载 Cookie
- 显示真实漫画列表

**2. 登录流程优化**
- 启动时自动检查密钥环
- 自动验证登录态

### 预计完成时间

```
✅ Day 1 (今天): 70% → 90%
⏭️ Day 2 (明天): 90% → 97%
⏭️ Day 3 (后天): 97% → 100% 🎉
```

**3 天完成 MVP！**

---

## 🧪 开发命令

```powershell
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 测试
npm test                    # 前端测试
cd src-tauri && cargo test  # Rust 测试

# 构建
npm run build               # 前端构建
npm run tauri build         # 生成安装包
```

---

## 📞 常见问题

### Q: 如何验证 API？
**A**: 运行 `test-cookie-quick.bat` 或查看 [`QUICKSTART.md`](QUICKSTART.md)

### Q: Cookie 存在哪里？
**A**: Windows 凭据管理器（OS 加密保护）

### Q: 如何添加新接口？
**A**: 
1. 在 `src-tauri/src/api.rs` 添加函数
2. 在 `src-tauri/src/lib.rs` 注册命令
3. 在 `src/bridge/tauriBridge.ts` 添加 TypeScript 封装

### Q: 测试失败怎么办？
```powershell
npm test -- --reporter=verbose
cd src-tauri && cargo test -- --nocapture
```

---

## 🎯 项目目标

Windows 桌面端哔哩哔哩漫画阅读器，目标是登录后能连续阅读 1-2 小时，并可靠保存进度、书库管理数据和阅读偏好。

**当前状态**：核心功能完成（90%），等待 UI 集成（10%）  
**预计完成**：3 天

---

## 🤝 贡献

这是一个内部技术验证项目。

---

## 📄 License

UNLICENSED - 内部技术验证项目

---

## 🎉 项目亮点

1. **安全性**：系统密钥环 + SQLCipher 双重保护
2. **类型安全**：Rust ↔ TypeScript 完全对齐
3. **测试覆盖**：47 个测试，100% 通过
4. **工具完善**：3 种验证方式（脚本/批处理/UI）
5. **文档齐全**：14 个核心文档

---

## 📈 进度历史

- **2026-07-03 早期**：基础架构完成（70%）
- **2026-07-03 中午**：真实 API 实现（80%）
- **2026-07-03 下午**：验证工具套件（85%）
- **2026-07-03 18:15**：Cookie 持久化（90%）

---

**Git 仓库**: https://github.com/Vantalens/BilibiliManga  
**最新提交**: `f91107f` - Cookie persistence milestone

🚀 **现在就开始验证：[`QUICKSTART.md`](QUICKSTART.md)**
