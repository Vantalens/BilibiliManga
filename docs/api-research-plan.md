# BiliManga API Research Plan

版本：v1.0.0
作者：Codex
状态：执行中
最后更新：2026-07-03

## 研究目标

通过浏览器开发者工具和真实账号验证哔哩哔哩漫画核心接口，记录请求体、响应 schema、失败模式和降级路径。

## 研究环境

- 浏览器：Chrome/Edge DevTools
- 测试站点：`https://manga.bilibili.com`
- 官方登录页：`https://passport.bilibili.com/login`（从官方客户端 core.js 确认）
- Twirp 基础路径：`https://manga.bilibili.com/twirp`
- 固定参数：`?device=pc&platform=web&nov=27`
- 固定 Header：`content-type: application/json`, `x-bili-manga-from: c-int-v1`

## 核心接口优先级

### P0 接口（必须验证）

1. **扫码登录流程**
   - 二维码获取
   - 登录状态轮询
   - Cookie/Token 保存
   - 过期处理

2. **书架接口**
   - `/bookshelf.v1.Bookshelf/ListFavorite`
   - 分页、排序、响应字段映射

3. **详情接口**
   - `/comic.v1.Comic/ComicDetail`
   - 章节列表、权益状态字段

4. **章节图片**
   - `/comic.v1.Comic/GetImageIndex`
   - `/comic.v1.Comic/ImageToken`
   - 图片 URL 构造、有效期

5. **阅读历史**
   - `/bookshelf.v1.Bookshelf/ListHistory`

### P1 接口（可选）

- 进度同步接口（如果存在）
- 搜索详情（当前关键词搜索返回 code=99）

## 研究方法

### Step 1: 登录态获取

```bash
# 操作步骤
1. 打开 Chrome，清除 manga.bilibili.com 所有 Cookie
2. 打开 DevTools → Network 标签
3. 访问 https://manga.bilibili.com
4. 点击登录 → 扫码登录
5. 记录所有 network 请求：
   - 二维码生成请求
   - 轮询请求 (poll interval)
   - 登录成功后的 Cookie 设置
   - 登录后首次 API 调用
6. 导出 HAR 文件或手动记录关键请求

# 关键信息
- 二维码请求 URL
- 轮询请求 URL 和 payload
- 登录成功标识 (response code/field)
- Cookie 字段：SESSDATA、bili_jct、DedeUserID 等
- Token 有效期和刷新机制
```

### Step 2: 书架接口验证

```bash
# 操作步骤
1. 登录成功后，访问 https://manga.bilibili.com/account-center
2. DevTools → Network → 过滤 twirp
3. 观察 ListFavorite 请求：
   - 请求体 (page_num, page_size, order)
   - 响应字段 (list[], total, has_more)
   - 每个漫画项的完整字段
4. 测试分页：翻页观察参数变化
5. 测试空书架场景（清空后观察）
6. 记录错误响应：登录过期、网络失败

# 映射到 LibraryItem
- comic_id → id
- title → title
- vertical_cover → coverUrl
- is_finish → status (完结/连载)
- last_ord/last_short_title → lastChapter
- 本地字段 (tags, rating, notes, group) 仍存 SQLCipher
```

### Step 3: 详情和章节接口

```bash
# 操作步骤
1. 从书架点击一本漫画进入详情页
2. DevTools → Network → 观察 ComicDetail 请求
3. 记录请求体字段（comic_id 的准确参数名）
4. 记录响应：
   - 漫画基础信息
   - 章节列表 (ep_list[])
   - 权益状态字段 (is_locked, is_in_free, unlock_type)
5. 点击章节 → 观察 GetImageIndex 和 ImageToken
6. 记录图片 URL 构造规则和 token 参数
```

### Step 4: 历史接口验证

```bash
# 操作步骤
1. 访问 https://manga.bilibili.com/account-center/history
2. 观察 ListHistory 请求体和响应
3. 对比 ListFavorite 字段差异
4. 记录历史记录的时间戳和进度字段
```

## 文档输出

每个接口验证完成后更新 `docs/interface-research.md`：

```markdown
### 接口名称

观察时间：YYYY-MM-DD
验证方式：浏览器真实请求

请求：
- 端点：POST https://manga.bilibili.com/twirp/...
- Header：{...}
- Body：{...}

响应（脱敏）：
- 成功：{"code":0,"data":{...}}
- 失败：{"code":99,"msg":"..."}

失败模式：
- 登录过期 → code=-101
- 参数错误 → code=...
- 限流 → code=...

映射到本地：
- response.data.field → domain/model.ts

降级路径：
- 官方网页 URL

实现状态：verified ✅
```

## 安全约束

- 不记录真实 Cookie、Token、账号 ID、订单信息
- 响应样例必须脱敏（用占位符替换敏感字段）
- 只记录 API 结构，不记录个人数据
- 抓包文件不提交到 Git

## 下一步

接口验证完成后：
1. 更新 `docs/interface-research.md` 所有 P0 接口为 `verified`
2. 在 `src/domain/apiAdapter.ts` 中补充 endpoint 定义
3. 实现 Rust `src-tauri/src/api.rs` 受控命令
4. 编写 Rust 单元测试验证解析逻辑
5. 前端接入真实接口替换示例数据
