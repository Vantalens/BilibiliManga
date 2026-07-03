# BiliManga Interface Research

版本：v0.3.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 目标

记录哔哩哔哩漫画接口调研结果、权限边界、失败模式和降级路径。本文档当前包含公开 PC 首页和公开静态 JS 的观察结果；登录态接口、章节图片、进度同步仍必须通过浏览器开发者工具和真实账号路径验证后才能进入实现。

## 调研边界

- 只调研公开元数据、章节目录、免费/试读章节、用户已授权或已解锁内容。
- 不调研或实现充值、支付、购买、解锁、权益变更接口。
- 未购买漫画允许展示公开详情和章节目录；未解锁章节图片统一跳转官方网页处理，返回后刷新状态。
- 不记录真实 Cookie、Token、账号、订单或生产密钥。

## 已建立的本地边界

- `src/domain/apiAdapter.ts` 定义接口调研目录、已观察 Twirp 端点和敏感链路阻断规则。
- `src/domain/entitlement.ts` 定义章节权益状态决策，未解锁和未知状态都必须走官方网页。
- `src/domain/browsingPolicy.ts` 定义未购买漫画浏览策略：公开信息和章节目录可展示，锁定章节图片不可渲染或缓存。
- `docs/api-boundaries.md` 记录原生接口允许和禁止范围。

## 公开页面观察

观察时间：2026-07-02。

公开来源：

- `https://manga.bilibili.com/`
- `https://s1.hdslb.com/bfs/manga-static/manga-pc-ssr/assets/entries/pages_index.B7vjAQej.js`
- `https://s1.hdslb.com/bfs/manga-static/manga-pc-ssr/assets/chunks/chunk-A-ZFq6o-.js`

确认事实：

- PC 首页是 SSR 页面，meta 中出现 `build-time=2026-06-15 18:04:42（北京时间）` 和 `version=0.3.12`。
- 首页 SSR 数据包含公开漫画字段：`comic_id`、`title`、`author`、`vertical_cover`、`is_finish`、`last_ord`、`last_short_title`、`styles`、`total`、`fans`、`last_ep`、`allow_wait_free`、`discount_type`、`home_block_jump_value`、`comic_introduction`、`tags`。
- 公开前端 JS 中观察到 Twirp 基础路径：`http://manga.bilibili.co/twirp`。本机裸请求该域返回 TLS/empty reply 失败；同站代理 `https://manga.bilibili.com/twirp` 可访问，客户端运行时先使用同站 HTTPS 基址。
- 公开前端 JS 为请求附加查询参数：`device=pc`、`platform=web`、`nov=27`。
- 公开前端 JS 为请求附加 header：`content-type=application/json`、`x-bili-manga-from=c-int-v1`。
- 登录状态检查还会访问 B 站主站接口：`https://api.bilibili.com/x/web-interface/nav`，返回 `code=-101` 时前端按未登录处理。


## 已验证公开响应

观察时间：2026-07-02。

搜索建议：

- 端点：`POST https://manga.bilibili.com/twirp/comic.v1.Comic/SearchSug?device=pc&platform=web&nov=27`
- 请求体：`{"term":"有兽焉","num":5}`
- 请求头：`content-type=application/json`、`x-bili-manga-from=c-int-v1`，并带浏览器 `origin`/`referer` 时返回正常。
- 响应：HTTP 200，JSON 包络为 `{"code":0,"msg":"","data":["有兽焉"]}`。
- 当前固化：`parseSearchSuggestionsResponse` 只接受 `data` 为字符串数组；非零 `code` 映射为 server error；缺少 `code` 或 data 形态不符映射为 schema error。
- 已新增受控后端命令 `search_suggestions(term, limit)`：只调用已验证 `SearchSug`，限制空输入、最大 80 字符和 1-20 条建议，不处理 Cookie、登录态、支付或图片。
- UI 接入策略：书库搜索区手动请求建议，建议项只回填本地筛选关键词；失败时保留本地筛选并提供官方网页降级。
- 失败模式：`https://manga.bilibili.co/twirp/...` 在本机 TLS 握手 EOF；`http://manga.bilibili.co/twirp/...` 返回 empty reply。运行时不得硬编码依赖该裸域成功。

关键词搜索：

- 端点：`POST https://manga.bilibili.com/twirp/comic.v1.Comic/Search?device=pc&platform=web&nov=27`
- 官方搜索页 JS 请求体：`{"key_word":"有兽焉","page_num":1,"page_size":10}`。
- 搜索页 JS 响应模型包含 `list`、`total_page`、`total_num`。
- 当前本机复核：带 `x-bili-manga-from` 和不带该 header 两种方式均返回 `{"code":99,"msg":"请求失败,请稍后重试。"}`。
- 当前固化：`SEARCH-KEYWORD-TWIRP` 标记为 `verificationStatus=failed`，不得进入真实 adapter 调用；继续使用官方搜索页作为降级路径。
## 详情页观察

观察时间：2026-07-02。

公开来源：

- `https://manga.bilibili.com/detail/mc33354`
- `https://s1.hdslb.com/bfs/manga-static/manga-pc/static/js/detail.5ef82910de.js`

确认事实：

- PC 详情页仍使用旧版 `manga-pc` Vue 包，页面注释显示 build time `2026-06-15 16:17:27`、version `1.20.18`。
- 详情页 HTML 不直接注入详情 SSR 数据，只加载 `vendors.2a7240b158.js`、`bili.a839caa9f3.js`、`detail.5ef82910de.js`。
- 详情页 JS 观察到读类/待验证端点：`/comic.v1.Comic/ComicDetail`、`/comic.v1.Comic/Search`、`/comic.v1.Comic/GetImageIndex`、`/comic.v1.Comic/ImageToken`。
- 详情页 JS 观察到必须阻断的敏感端点：`/comic.v1.Comic/BuyEpisode`、`/comic.v1.Comic/RentEpisode`、`/comic.v1.Comic/GetEpisodeBuyInfo`、`/pay.v1.Pay/CreateOrder`、`/pay.v1.Pay/PayBCoin`、`/pay.v1.Pay/CreateCardOrder`、`/pay.v1.Pay/GetBCoin`、`/card.v1.Card/GetCardOrders`、`/user.v1.User/GetPayOrders`。
- 使用公开首页中出现的 `comic_id` 直接请求 `POST https://manga.bilibili.com/twirp/comic.v1.Comic/ComicDetail?device=pc&platform=web&nov=27`，尝试 `comic_id`、`comicId`、`id`、`season_id`、`seasonId`、`mc_id` 字段均返回 `{"code":99,"msg":"请求失败,请稍后重试。"}`。
- 当前结论：`ComicDetail` 方法名已观察，但请求体或上下文未验证成功，不能进入真实 adapter 调用；章节图片 `GetImageIndex`/`ImageToken` 必须等权益状态和真实章节路径验证后才能实现。
## 已观察 Twirp 方法

| 模块 | 方法 | 登录要求 | 原生允许 | 降级路径 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 用户/登录态 | `https://api.bilibili.com/x/web-interface/nav` | 是 | 允许调研 | 官方网页登录页 | ✅ 已确认：`code=-101`表示未登录 |
| 已购漫画 | `/user.v1.User/GetAutoBuyComics` | 是 | 允许调研 | 官方网页 https://manga.bilibili.com/account-center | 候选：本地研究报告和社区资料给出请求体/响应结构，仍需真实 Cookie 验证 |
| 书架 | `/bookshelf.v1.Bookshelf/ListFavorite` | 是 | 允许调研 | 官方网页版书架 https://manga.bilibili.com/account-center | ✅ RSSHub生产实现已验证：`code=-6`表示Cookie过期 |
| 阅读历史 | `/bookshelf.v1.Bookshelf/ListHistory` | 是 | 允许调研 | 官方网页版历史 | 结构已就绪，等待真实验证 |
| 漫画详情 | `/comic.v1.Comic/ComicDetail` | 否/是 | 允许调研 | 官方详情页 https://manga.bilibili.com/detail/mc{id} | 已观察，公开裸调返回`code=99` |
| 章节图片索引 | `/comic.v1.Comic/GetImageIndex` | 是 | 允许调研 | 官方阅读页 | 已观察方法名，需Cookie上下文 |
| 图片令牌 | `/comic.v1.Comic/ImageToken` | 是 | 允许调研 | 官方阅读页 | 已观察方法名，返回带token的访问材料 |
| 搜索建议 | `/comic.v1.Comic/SearchSug` | 否 | 允许调研 | 官方搜索页 | ✅ 已验证公开响应 schema |
| 钱包 | `/user.v1.User/GetWallet` | 是 | 禁止原生实现 | 官方钱包页 | 已阻断 |
| 用户权益卡 | `/card.v1.Card/GetUserCardInfo` | 是 | 禁止原生实现 | 官方用户权益页 | 已阻断 |

## 待调研接口

| 模块 | 状态 | 验证内容 | 降级路径 |
| --- | --- | --- | --- |
| 扫码登录 | 实现中 | 二维码获取、轮询、登录态保存、过期 | 官方网页登录页 https://passport.bilibili.com/login |
| 书架 | 实现中 | 请求体、分页、排序、异常状态、真实响应字段 | 官方网页版书架 https://manga.bilibili.com/account-center |
| 详情 | 实现中 | ComicDetail 正确请求体、章节列表、权益状态字段 | 官方详情页 https://manga.bilibili.com/detail/mc{id} |
| 章节图片 | 未开始 | GetImageIndex、ImageToken 请求体和响应、图片 URL 构造 | 官方阅读页 |
| 阅读历史 | 未开始 | ListHistory 请求体、响应字段、时间戳格式 | 官方历史页 https://manga.bilibili.com/account-center/history |
| 进度同步 | 未开始 | 上报接口（如存在）、频率限制、冲突处理 | 本地优先，不强制同步 |

## 2026-07-03 状态修正（接手 Claude 代码后复核）

### 已完成结构性工作

1. **深度研究报告分析**
   - 分析了两份详细的接口研究报告
   - 提取了已购漫画接口 `GetAutoBuyComics` 的候选请求体和响应结构；尚未完成真实账号验证
   - 确认了登录检查接口 `https://api.bilibili.com/x/web-interface/nav`
   - 确认了错误码：`-101`未登录，`-6`会话过期，`99`上下文不匹配

2. **Rust API 模块完整实现** (`src-tauri/src/api.rs`)
   - ✅ 新增 `check_login_status()` - 使用 B 站主站 nav 接口检查登录态
   - 新增 `fetch_purchased_comics()` 原型；当前只能视为候选实现，不能作为稳定可用接口声明
   - `fetch_bookshelf()` 仍是未实现占位，只做 Cookie 入参校验和官方网页降级错误
   - ✅ 新增类型：`LoginCheckResult`、`PurchasedComic`、`PurchasedComicsResult`
   - ✅ 实现错误码处理：`-101`、`-6`、`99` 的特定错误消息

3. **Tauri 命令完整注册** (`src-tauri/src/lib.rs`)
   - ✅ `check_login_status` - 检查登录状态
   - ✅ `fetch_purchased_comics` - 获取已购漫画列表
   - ✅ 保留占位：`generate_login_qrcode`、`poll_login_status`、`fetch_user_bookshelf`

4. **前端 Bridge 完整实现** (`src/bridge/tauriBridge.ts`)
   - ✅ 新增类型：`LoginCheckResult`、`PurchasedComic`、`PurchasedComicsResult`
   - ✅ 新增函数：`checkLoginStatus()`、`fetchPurchasedComics()`
   - ✅ 所有类型定义与 Rust 端完全对齐

### 关键发现（来自研究报告）

1. **已购漫画接口**：`/user.v1.User/GetAutoBuyComics`
   - 请求体：`{"page_num":1,"page_size":15}`
   - 候选响应：`data` 为数组，无 `total` 字段；分页停止条件推断为返回空数组或长度小于 `page_size`
   - 字段兼容：同时支持 `buy_type` 和 `bug_type`（API 拼写差异）

2. **登录检查**：`https://api.bilibili.com/x/web-interface/nav`
   - 使用主站接口，不是漫画站接口
   - `code=-101` 表示未登录
   - 成功时返回 `isLogin` 和 `mid`（用户ID）

3. **鉴权方式**
   - Web 端：Cookie (`SESSDATA` 为核心)
   - 必需 Header：`Referer: https://manga.bilibili.com/account-center`
   - 必需 Header：`x-bili-manga-from: c-int-v1`
   - 必需 Query：`device=pc&platform=web&nov=27`

4. **错误码含义**
   - `0`：成功
   - `-101`：未登录（nav 接口）
   - `-6`：会话过期（书架接口，来自 RSSHub 观察）
   - `99`：上下文不匹配/风控（裸调详情接口）

5. **图片访问机制**
   - 三段式：`GetImageIndex` → `ImageToken` → 带 token 的图片 URL
   - 不是视频式 DRM，是应用层授权 + URL 签名

### 验证状态

- 既有记录显示曾运行过 `cargo check`、`npm run build`、`npm test`；本轮仍需重新运行后才能声明当前工作树通过。
- `SearchSug` 是当前唯一已验证公开 Twirp 响应 schema。
- `GetAutoBuyComics` 仅完成 domain 层候选请求构造和响应解析测试；真实 Cookie、浏览器上下文、分页稳定性和失败模式仍未验证。

### 安全边界确认

研究报告明确支持项目当前边界：
- ✅ 只处理公开元数据、章节目录、免费/试读章节、用户已授权或已解锁内容
- ✅ 未购买漫画可浏览公开详情和章节目录；未解锁章节图片统一回退官方网页
- ✅ 支付、解锁、订单、充值全部阻断
- ✅ Cookie 不记录日志，只存系统密钥环
- ✅ 图片缓存仅限免费/试读或已解锁章节，短期、不可导出、可清理

### 下一步

根据研究报告建议：

1. **真实浏览器验证**（最优先）
   - 打开 Chrome DevTools
   - 访问 https://manga.bilibili.com/account-center
   - 登录后点击"已购漫画"
   - 观察 `GetAutoBuyComics` 实际请求和响应
   - 确认字段与社区文档一致性

2. **Cookie 管理实现**
   - 在 Rust 中使用 keyring 存储 Cookie
   - 实现 Cookie 验证和过期检测
   - UI 添加登录态显示

3. **UI 接入**
   - 添加"我的已购"入口
   - 显示已购漫画列表
   - 点击进入详情页

4. **完善其他接口**
   - 实现 `ListFavorite`（书架）
   - 实现 `ComicDetail`（详情）
   - 实现 `GetImageIndex` + `ImageToken`（章节图片）
| 阅读历史 | 已观察方法名 | 最近阅读、进度字段、同步方向、真实响应字段 | 本地最近阅读 |
| 搜索 | 搜索建议已验证；关键词 Search 请求字段已确认但裸调失败 | 关键词搜索成功响应 schema、分页、空结果、限流 | 官方搜索页 |
| 漫画详情 | 已观察方法名，裸调失败 | `ComicDetail` 请求体、上下文、标题、作者、简介、封面、状态 | 官方详情页 |
| 章节列表 | 详情页 JS 已观察相关字段，接口未验证 | 章节 ID、顺序、付费状态、是否需要登录上下文 | 官方详情页 |
| 章节图片 | 已观察 `GetImageIndex`/`ImageToken` 方法名 | 图片 URL、尺寸、鉴权、失败、缓存限制 | 显示错误页 |
| 进度同步 | 未开始 | 上传/读取进度、冲突策略 | 本地进度 |
| 未解锁状态 | 未开始 | 状态识别、提示文案 | 官方购买页 |

## 当前实现策略

- `apiAdapter` 记录观察到的端点、安全分类、候选请求构造和响应解析；真实网络调用必须等对应接口完成实测。
- 允许类端点必须先通过响应 schema 测试和失败模式测试，再接入 Rust/前端 bridge。
- 钱包、用户权益卡、购买、充值、支付、券、余额、订单和权益变更端点必须保持 `nativeImplementationAllowed=false`。
- 未解锁章节、未知权益状态和任何权益变更入口统一打开官方网页。

## 禁止项

任何发现的购买、充值、支付、券、余额、订单和权益变更接口只能记录“禁止原生实现”，不得写入可调用 adapter。
