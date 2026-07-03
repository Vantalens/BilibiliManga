# BiliManga progress

版本：v0.6.0
作者：Codex
状态：草稿
最后更新：2026-07-03

## Done

- 已确认开发计划。
- 已确认参考官方 B 站 PC 客户端的架构模式，不切换 Electron。
- 已初始化 Git 仓库并设置 origin 为 https://github.com/Vantalens/BilibiliManga.git。
- 已建立 DevDocsKit 文档基线。
- 已实现 Tauri + React + TypeScript 桌面骨架。
- 已用 TDD 实现 reader/cache/library/entitlement/apiAdapter/releasePolicy 纯逻辑。
- 已实现 Rust keyring 数据库密钥基线；前端无法读取密钥明文。
- 已验证 SQLCipher 加密 SQLite 实际数据库文件：同密钥可读、错误密钥失败、文件头不是明文 SQLite。
- 已将本地书库和阅读进度写入/读取接入 SQLCipher 数据库，并通过 Rust round-trip 测试验证。
- 已将书库分组、标签、评分、备注和未读章节写入/读取 SQLCipher 数据库，前端加载时保留这些管理字段。
- 已将 UI 的示例书库初始化、读取和分页阅读进度保存接入受控 Tauri storage commands。
- 已将阅读模式和沉浸状态作为阅读偏好写入/读取 SQLCipher 数据库，并通过 Rust round-trip 测试覆盖。
- 已实现受控 `clear_image_cache`，只清理应用图片缓存目录。
- 已实现 SQLCipher 缓存索引、缓存状态查询和按过期/容量策略清理；UI 可显示缓存条目、过期条目和占用。
- 已建立 API 边界文档，阻止购买/充值/解锁等敏感链路进入原生 adapter。
- 已将阅读器接入权益状态 gate；未解锁或未知状态会显示失败恢复面板，敏感流程只打开官方网页并在返回后刷新状态。
- 已新增登录状态 gate；未登录或登录过期时阻止账号功能，只打开官方登录页或使用本地调试态验证界面流程，不保存 Cookie/Token。
- 已记录公开 PC 首页和公开静态 JS 中观察到的 Twirp 基础路径、请求固定参数、书架/历史/搜索建议方法名和钱包/权益类禁止端点。
- 已验证公开搜索建议端点 `SearchSug` 的请求体、同站运行时基址、成功响应 schema 和 `.co` 裸域失败模式。
- 已新增 Rust 受控 `search_suggestions` 命令和前端 bridge，只允许访问 verified 的 `SearchSug`，未验证 `Search` 不接入。
- 已将 `search_suggestions` 接入 UI 的书库搜索区，采用手动请求、建议回填和官方网页降级。
- 已确认关键词 `Search` 端点请求体为 `key_word/page_num/page_size`，但公开裸调返回 `code=99`，当前标记为 failed，不进入真实 adapter。
- 已记录详情页 JS 中观察到的 `ComicDetail`、`GetImageIndex`、`ImageToken` 方法名，并阻断购买、租借、支付、订单和钱包相关端点。
- 已新增 GitHub 工作流文档，并将文档同步、提交、推送和验证门禁接入 README、AGENT_RULES、TEST_PLAN、SECURITY。
- 已建立 release gate 文档；当前仅支持内测安装包。
- 已生成 Windows 内测 NSIS 安装包。
- ✅ **新增**：已扩展 Rust API 模块，添加 `QrCodeResult`、`LoginStatus`、`BookshelfItem`、`BookshelfResult` 类型和占位函数。
- ✅ **新增**：已注册 Tauri 命令：`generate_login_qrcode`、`poll_login_status`、`fetch_user_bookshelf`。
- ✅ **新增**：已扩展前端 Bridge，添加对应的 TypeScript 类型和调用函数。
- ✅ **新增**：已提取官方 B 站客户端的登录页地址（`https://passport.bilibili.com/login`）和架构模式（WebView 登录、混淆代码）。

## In Progress

- 阶段 3：真实哔哩哔哩漫画接口调研继续推进；已完成 API 结构预留，等待真实账号验证登录、书架、详情、章节、图片和进度接口。

## Next

- 用浏览器开发者工具和真实账号验证登录、书架、历史、详情、章节、图片、进度接口的请求体、响应 schema、失败模式和降级路径。
- 将已验证的真实接口返回书库/进度映射到已验证的 SQLCipher 数据库。
- 配置 updater 签名私钥、公钥和 HTTPS 更新源。
- 做真实 Windows GUI 路径验证，包括安装、启动、初始化安全存储、清理缓存、阅读器模式切换。

## Blockers

- 尚未完成真实登录账号路径调研，无法声明书架、历史、章节、图片和进度接口可稳定使用。
- 尚未配置 updater 签名私钥、公钥和更新源；当前只能生成内测安装包。
- 尚未完成真实账号连续阅读 1-2 小时验证。

## Codegraph

- 当前未初始化：`mcp__codegraph.codegraph_files` 返回 `CodeGraph not initialized`。
- 本轮替代检查方式：Git 状态、文件检查、前端测试、Rust 测试、前端构建、Tauri 构建。
- 进入接口适配器扩展、存储重构或跨模块修改前，应执行 codegraph 初始化。
## 2026-07-03 接手复核：真实接口状态修正

- 已分析两份深度研究报告，将 `GetAutoBuyComics` 降级为候选接口：请求体和响应字段来自报告/社区资料，仍未经过真实 Cookie 浏览器路径验证。
- 已参考 `0xlau/biliplus`：该项目是 B 站浏览器扩展，不是漫画客户端；可借鉴的是浏览器上下文、后台监听、受控 API 封装方式，不能复制为漫画 API 实现。
- 已在 `src/domain/apiAdapter.ts` 增加 `USER-PURCHASED-COMICS` 候选端点、请求构造和响应解析；该 domain 层不接触真实 Cookie。
- 已补充 `GetAutoBuyComics` 请求构造、分页校验、响应 schema、`bug_type` 兼容和异常 schema 测试。
- 当前真实接口完成度不能声明 80%；可确认的是 `SearchSug` 已验证，`GetAutoBuyComics` 进入候选适配阶段，书架/详情/章节/图片/进度仍待真实账号验证。
