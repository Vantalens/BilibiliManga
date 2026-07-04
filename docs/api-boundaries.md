# BiliManga API Boundaries

版本：v0.1.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 原生接口允许范围

- 扫码登录：允许调研，必须处理过期、风控、失败和退出。
- 书架、历史、搜索、详情、章节列表、章节图片、进度：允许调研。公开详情、章节目录、免费/试读章节和用户已解锁章节允许原生浏览；锁定章节图片不得原生获取或缓存。
- 未解锁状态：允许识别状态、展示公开元数据和章节目录，不允许原生购买、充值、支付、解锁或获取锁定章节图片。

## 原生接口禁止范围

- 购买。
- 充值。
- 支付。
- 解锁。
- 券、余额、订单、权益变更。
- 绕过官方风控、鉴权或访问限制。
- 使用第三方共享账号、共享 Cookie、BiliPlus 解析或类似方式解锁用户未获得权益的章节。
- 图片导出、永久离线包、批量下载。

## 降级策略

登录、购买和敏感链路统一打开哔哩哔哩漫画官网。客户端只在用户返回后刷新状态，不构造支付、购买或权益变更请求。未购买漫画可以渲染公开详情和章节目录；未解锁、锁定或未知章节不得渲染应用内图片阅读页。

## 详情页新增阻断

2026-07-02 从官方详情页 JS 观察到支付、订单、购买、租借和钱包相关 Twirp 方法。

必须保持原生阻断：/comic.v1.Comic/BuyEpisode、/comic.v1.Comic/RentEpisode、/comic.v1.Comic/GetEpisodeBuyInfo、/pay.v1.Pay/CreateOrder、/pay.v1.Pay/PayBCoin、/pay.v1.Pay/CreateCardOrder、/pay.v1.Pay/GetBCoin、/card.v1.Card/GetCardOrders、/user.v1.User/GetPayOrders。
