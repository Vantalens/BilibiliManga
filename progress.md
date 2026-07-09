# BiliManga progress

版本：v0.6.0
作者：Codex
状态：草稿
最后更新：2026-07-04

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
- 已新增未购买漫画浏览策略：允许公开信息和章节目录浏览，免费/试读或已解锁章节可读，锁定章节图片仍阻止应用内渲染和缓存。
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

- 阶段 3：真实哔哩哔哩漫画接口调研继续推进；登录、公开分类、公开详情、登录态搜索、书架同步和本机最近阅读已进入应用内路径；章节图片接口已按参考实现改为表单请求，但仍需真实 Cookie 验证。

## Next

- 用真实账号验证 `GetImageIndex` / `ImageToken` 表单请求在扫码登录 Cookie 下是否返回图片列表和 token。
- 用真实账号验证 `Search` 和 `ListFavorite` 在应用内的稳定性、分页和失败模式。
- 继续补官网阅读历史同步；当前“最近”先使用本机 SQLCipher 阅读进度。
- 配置 updater 签名私钥、公钥和 HTTPS 更新源。
- 做真实 Windows GUI 路径验证，包括安装、启动、初始化安全存储、清理缓存、阅读器模式切换。

## Blockers

- `GetImageIndex` 当前真实冒烟仍返回 `code=99`，无法声明章节图片应用内阅读已稳定可用。
- 真实账号路径下的书架、搜索、图片接口仍需人工 GUI 验收；当前自动化只覆盖请求构造和响应解析。
- 官网历史同步接口尚未接入；当前使用本机阅读进度。
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
- 已参考 `Zeal-L/BiliBili-Manga-Downloader`：官方 B 站解析路径只支持免费和已解锁章节；BiliPlus/未解锁下载路径不纳入本项目。
- 已按 B 站 PC 客户端方向重做前端主框架：左侧窄栏、顶部频道导航、搜索框、简约漫画网格；首页不放横幅广告位，不使用伪造推荐内容。
- 已将顶部搜索接入 verified `SearchSug` 建议；回车或点击建议只打开官方搜索页，不调用当前 failed 的关键词 `Search` 接口。
- 已将普通用户可见的“已购”入口改为“书架”；登录、购买和账号相关操作统一打开哔哩哔哩漫画官网，隐藏 Cookie/接口等技术语义。
- 已接入本机书架优先路径：首页漫画可加入书架，书架页优先显示本机保存内容；官网登录和购买仍统一跳转官网。
- 已修复公开首页漫画列表解析：支持官网当前 `vike_pageContext` 内嵌数据格式，首页可从公开官网 HTML 提取漫画卡片。
- 已接入 B 站 Passport 扫码登录生成和轮询流程，账号页改为应用内二维码登录并保存返回登录态；外部官网只保留为购买/账号操作入口。
- 已修复首页分类和卡片可用性：分类按钮会重新加载对应公开分类页，漫画卡片进入应用内详情页，封面通过受控后端代理加载以规避 WebView 来源限制。
- 已新增应用内搜索结果页：官方关键词 `Search` 裸调仍返回 `code=99`，当前用已验证公开分类索引做本地匹配，不再跳转官网搜索。
- 已新增应用内漫画详情页：从 `https://manga.bilibili.com/m/detail/mc{id}` 的 `vike_pageContext` 解析漫画信息和章节目录。
- 已新增应用内阅读页入口：免费/已解锁候选章节会调用 `GetImageIndex` + `ImageToken`；锁定章节不会获取图片。
- 已实际冒烟：`/m/detail/mc33354` 返回 200 且包含 `vike_pageContext`；`GetImageIndex` 对当前无有效上下文请求仍返回 `{"code":99,"msg":"请求失败,请稍后重试。"}`，因此不能声明章节图片闭环已完成。

- 已参考 `Zeal-L/BiliBili-Manga-Downloader` 的官方 B 站解析路径，将 `Search`、`ComicDetail`、`GetImageIndex`、`ImageToken` 的请求方式从 JSON 修正为 `application/x-www-form-urlencoded` 表单模式；未接入其 BiliPlus/未解锁下载路径。
- 已将登录态搜索接入官方 `Search`，失败时回退公开分类索引，搜索不再跳转官网。
- 已将书架页主路径改为 `bookshelf.v1.Bookshelf/ListFavorite`，并保留本机书架兜底；书架卡片进入应用内详情。
- 已新增本机“最近”页：从 SQLCipher `reading_progress` 列表读取最近阅读并可回到应用内漫画详情。
- 已补齐阅读器基础交互：长滚动/分页切换、上一页/下一页、隐藏 UI、Esc 退出沉浸、方向键/PageUp/PageDown/F/P/S 快捷键、阅读偏好和页码进度持久化。
- 已将“最近”页从技术 ID 列表改为普通用户可读的漫画标题和章节标题展示；详情加载失败时保留稳定兜底。
- 已新增普通用户可读的接口失败说明：`code=99`、登录失效、网络失败和接口 schema 变化会在书架、搜索、详情、阅读器和最近页显示明确原因。
