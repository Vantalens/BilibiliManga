# BiliManga Interface Research

版本：v0.3.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 目标

记录哔哩哔哩漫画接口调研结果、权限边界、失败模式和降级路径。本文档当前包含公开 PC 首页和公开静态 JS 的观察结果；登录态接口、章节图片、进度同步仍必须通过浏览器开发者工具和真实账号路径验证后才能进入实现。

## 调研边界

- 只调研用户已授权、已购买或公开可访问内容。
- 不调研或实现充值、支付、购买、解锁、权益变更接口。
- 未解锁章节统一跳转官方网页处理，返回后刷新状态。
- 不记录真实 Cookie、Token、账号、订单或生产密钥。

## 已建立的本地边界

- `src/domain/apiAdapter.ts` 定义接口调研目录、已观察 Twirp 端点和敏感链路阻断规则。
- `src/domain/entitlement.ts` 定义章节权益状态决策，未解锁和未知状态都必须走官方网页。
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
- 公开前端 JS 中观察到 Twirp 基础路径：`https://manga.bilibili.co/twirp`。
- 公开前端 JS 为请求附加查询参数：`device=pc`、`platform=web`、`nov=27`。
- 公开前端 JS 为请求附加 header：`content-type=application/json`、`x-bili-manga-from=c-int-v1`。
- 登录状态检查还会访问 B 站主站接口：`https://api.bilibili.com/x/web-interface/nav`，返回 `code=-101` 时前端按未登录处理。

## 已观察 Twirp 方法

| 模块 | 方法 | 登录要求 | 原生允许 | 降级路径 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 用户/登录态 | `/user.v1.User/GetNewbieInfo` | 是 | 允许调研 | 官方网页登录页 | 已观察，未真实登录验证 |
| 书架 | `/bookshelf.v1.Bookshelf/ListFavorite` | 是 | 允许调研 | 官方网页版书架 | 已观察，未真实登录验证 |
| 阅读历史 | `/bookshelf.v1.Bookshelf/ListHistory` | 是 | 允许调研 | 官方网页版历史 | 已观察，未真实登录验证 |
| 搜索建议 | `/comic.v1.Comic/SearchSug` | 否 | 允许调研 | 官方搜索页 | 已观察，未做响应 schema 固化 |
| 钱包 | `/user.v1.User/GetWallet` | 是 | 禁止原生实现 | 官方钱包页 | 已阻断 |
| 用户权益卡 | `/card.v1.Card/GetUserCardInfo` | 是 | 禁止原生实现 | 官方用户权益页 | 已阻断 |

## 待调研接口

| 模块 | 状态 | 验证内容 | 降级路径 |
| --- | --- | --- | --- |
| 扫码登录 | 未开始 | 二维码获取、轮询、登录态保存、过期 | 官方网页登录页 |
| 书架 | 已观察方法名 | 请求体、分页、排序、异常状态、真实响应字段 | 官方网页版书架 |
| 阅读历史 | 已观察方法名 | 最近阅读、进度字段、同步方向、真实响应字段 | 本地最近阅读 |
| 搜索 | 部分开始 | 搜索建议响应 schema、关键词搜索、分页、空结果、限流 | 官方搜索页 |
| 漫画详情 | 未开始 | 标题、作者、简介、封面、状态 | 官方详情页 |
| 章节列表 | 未开始 | 章节 ID、顺序、付费状态 | 官方详情页 |
| 章节图片 | 未开始 | 图片 URL、尺寸、鉴权、失败 | 显示错误页 |
| 进度同步 | 未开始 | 上传/读取进度、冲突策略 | 本地进度 |
| 未解锁状态 | 未开始 | 状态识别、提示文案 | 官方购买页 |

## 当前实现策略

- `apiAdapter` 只记录观察到的端点和安全分类，不直接发起网络请求。
- 允许类端点必须先通过响应 schema 测试和失败模式测试，再接入 Rust/前端 bridge。
- 钱包、用户权益卡、购买、充值、支付、券、余额、订单和权益变更端点必须保持 `nativeImplementationAllowed=false`。
- 未解锁章节、未知权益状态和任何权益变更入口统一打开官方网页。

## 禁止项

任何发现的购买、充值、支付、券、余额、订单和权益变更接口只能记录“禁止原生实现”，不得写入可调用 adapter。
