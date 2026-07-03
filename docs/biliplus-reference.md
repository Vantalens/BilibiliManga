# biliplus Reference Notes

版本：v0.1.0
作者：Codex
状态：草稿
最后更新：2026-07-03

## 来源

参考仓库：<https://github.com/0xlau/biliplus>

本地只读检查路径：`.temp-biliplus/`。该目录是临时参考克隆，不应提交到项目仓库。

## 结论

- `biliplus` 是 Chrome/Edge/Firefox 浏览器扩展，目标是优化 `bilibili.com` 使用体验，不是哔哩哔哩漫画客户端。
- 仓库内没有可直接复用的漫画 Twirp 接口实现，也没有 `GetAutoBuyComics`、`ListFavorite`、`ComicDetail`、`GetImageIndex`、`ImageToken` 的实现。
- 可借鉴的是架构模式：content script 注入页面上下文，background 监听指定 B 站请求，API 封装集中在 `scripts/common/bilibili-api.js`。
- `scripts/background/api-listener.js` 只监听页面发起的 `api.bilibili.com/x/player/wbi/v2` XMLHttpRequest，并过滤扩展自身请求，避免重复触发。
- `scripts/common/bilibili-api.js` 采用显式 API base、函数级请求封装、HTTP 状态和 JSON 存在性检查，然后只返回 `data`。

## 对 BiliManga 的约束

- 不复制 `biliplus` 代码；只借鉴调用边界和分层方式。
- 原生客户端不能让普通 UI 直接持有系统能力或绕过官方登录/权益链路。
- 漫画接口应先在 domain adapter 中固化请求 shape、响应 schema 和失败映射，再接入 Rust bridge。
- 登录 Cookie、图片 token、订单和权益材料不得写日志，不进入可导出缓存。
- 购买、充值、解锁、订单、钱包和权益变更继续只走官方网页降级。

## 当前应用

- `SearchSug`：已完成公开响应 schema 验证，可作为受控只读接口。
- `GetAutoBuyComics`：本轮只补候选请求构造和响应解析测试；真实 Cookie 验证前不得声明为可用。
- `ListFavorite`、`ComicDetail`、`GetImageIndex`、`ImageToken`：仍必须走真实账号 DevTools 验证后再实现。
