# BiliBili-Manga-Downloader Reference Notes

版本：v0.1.0
作者：Codex
状态：草稿
最后更新：2026-07-03

## 来源

参考仓库：<https://github.com/Zeal-L/BiliBili-Manga-Downloader>

本地只读检查路径：`.temp-zeal-downloader/`。该目录是临时参考克隆，不应提交到项目仓库。

## 已确认事实

- README 声明该项目主要功能因 B 站后台 API 收紧已经失效，暂不更新。
- README 将解析方式分成两类：B 站解析和 BiliPlus 解析。B 站解析只下载免费章节和用户已解锁章节。
- README 的 BiliPlus 解析依赖第三方 ComicWebReader 和第三方 Cookie，存在账号与内容权益风险。
- 源码结构集中在 `Comic.py`、`Episode.py`、`SearchComic.py`、`DownloadManager.py`、`BiliPlus.py`。可借鉴的是搜索、详情、章节状态、重试、错误提示和本地任务管理分层。
- 源码会区分章节锁定状态；合法产品策略应使用该思想区分“可浏览信息”和“可读图片”。

## 不采用内容

- 不采用“下载未解锁章节”的实现。
- 不接入 BiliPlus、ComicWebReader、共享账号、共享 Cookie 或第三方托管 Cookie。
- 不实现图片导出、永久离线包、批量下载、压缩包/PDF/CBZ 生成。
- 不复用该仓库代码；AGPL 代码只做架构观察，不能复制进本项目。

## 对 BiliManga 的策略调整

- 放宽“浏览”定义：未购买漫画允许进入搜索结果、公开详情页、章节目录和免费/试读章节。
- 不放宽“阅读图片”定义：锁定、未解锁或未知状态章节不得在应用内获取图片、缓存图片或渲染阅读页。
- 详情和章节目录接口可以继续调研，但必须把章节状态映射到 `free`、`unlocked`、`locked`、`unknown`。
- 阅读器只接受 `free` 或 `unlocked` 章节；其他状态打开官方网页。
- 本地缓存只服务性能，不作为内容保存功能。
