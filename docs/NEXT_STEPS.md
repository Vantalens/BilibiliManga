# BiliManga 下一步开发指南

版本：v1.0.0
作者：Codex
日期：2026-07-03

## 当前状态总结

### ✅ 已完成

1. **技术架构**
   - Tauri 2 + React 19 + TypeScript + Vite 技术栈
   - SQLCipher 加密数据库 + 系统密钥环
   - 完整的本地书库管理（标签、分组、评分、备注）
   - 阅读器（长滚动/分页）+ 进度持久化
   - 图片缓存索引 + 容量清理策略
   - 登录状态 gate + 权益状态 gate

2. **API 基础设施**
   - ✅ 搜索建议接口已验证并接入 UI
   - ✅ 登录/书架/详情接口结构已就绪，等待真实验证
   - ✅ Rust 模块、Tauri 命令、前端 Bridge 全部打通
   - ✅ 所有代码编译通过，测试通过（26 tests）

3. **安全与规范**
   - API 边界明确：禁止支付/充值/解锁
   - 未验证接口返回 NotImplemented + 官方网页降级
   - 敏感流程只打开官方网页处理

### ⚠️ 当前阻塞

**核心阻塞：真实账号接口未验证**

以下接口已有结构，但需要浏览器 + 真实账号验证：

| 接口 | 状态 | 需要验证的内容 |
|------|------|--------------|
| 扫码登录 | 结构就绪 | 二维码获取端点、轮询端点、Cookie 字段 |
| 书架列表 | 结构就绪 | 请求体、分页参数、响应字段映射 |
| 漫画详情 | 结构就绪 | ComicDetail 请求体、权益状态字段 |
| 章节图片 | 未实现 | GetImageIndex/ImageToken 请求和响应 |

---

## 第一步：真实接口验证（关键！）

### 验证方法：浏览器 DevTools 抓包

#### 1. 登录流程验证

```bash
# 操作步骤
1. 打开 Chrome/Edge
2. 按 F12 打开 DevTools → Network 标签
3. 清除 manga.bilibili.com 所有 Cookie（Application → Storage → Clear site data）
4. 访问 https://manga.bilibili.com
5. 点击登录 → 选择扫码登录
6. 在 Network 中过滤 "qr" 或 "login" 或 "passport"
7. 观察以下请求：

   A. 二维码生成请求
      - URL: https://passport.bilibili.com/x/passport-login/web/qrcode/generate (推测)
      - 方法: GET 或 POST
      - 响应: {"code":0,"data":{"url":"...", "qrcode_key":"..."}}
      
   B. 登录状态轮询
      - URL: https://passport.bilibili.com/x/passport-login/web/qrcode/poll (推测)
      - 方法: GET
      - 参数: ?qrcode_key=...
      - 响应: {"code":0,"data":{"code":86101}} // 86101=未扫描, 86090=已扫描, 0=成功
      
   C. 登录成功后
      - 观察 Set-Cookie headers
      - 记录 SESSDATA、bili_jct、DedeUserID 等字段

8. 将观察结果记录到 docs/interface-research.md
```

**关键字段记录模板：**

```markdown
### 扫码登录流程

验证时间：2026-07-XX
验证方式：Chrome DevTools 真实账号

#### 二维码生成

- 端点：POST https://passport.bilibili.com/x/passport-login/web/qrcode/generate
- 请求头：无特殊要求
- 响应：
  ```json
  {
    "code": 0,
    "data": {
      "url": "https://passport.bilibili.com/h5-app/passport/login/scan?...",
      "qrcode_key": "xxxxxx"
    }
  }
  ```

#### 登录轮询

- 端点：GET https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key={key}
- 轮询间隔：1-2 秒
- 响应状态码：
  - 86101: 未扫描
  - 86090: 已扫描未确认
  - 0: 登录成功

#### Cookie 字段

登录成功后设置以下 Cookie：
- SESSDATA: 用户会话标识
- bili_jct: CSRF token
- DedeUserID: 用户 ID
- (其他观察到的字段)
```

#### 2. 书架接口验证

```bash
# 操作步骤
1. 确保已登录
2. 访问 https://manga.bilibili.com/account-center
3. DevTools → Network → 过滤 "twirp" 或 "bookshelf"
4. 观察 ListFavorite 请求：

   请求：
   - URL: https://manga.bilibili.com/twirp/bookshelf.v1.Bookshelf/ListFavorite?device=pc&platform=web&nov=27
   - 方法: POST
   - Header: content-type: application/json, x-bili-manga-from: c-int-v1
   - Cookie: 包含 SESSDATA 等
   - Body: {"page_num":1,"page_size":20,"order":1}
   
   响应：
   {
     "code": 0,
     "data": {
       "list": [
         {
           "comic_id": 12345,
           "title": "漫画标题",
           "vertical_cover": "https://...",
           "is_finish": 1,
           "last_ord": 10,
           "last_short_title": "第10话",
           "styles": ["类型1", "类型2"],
           ...其他字段
         }
       ],
       "total": 100,
       "has_more": true
     }
   }

5. 测试翻页（page_num=2）观察参数变化
6. 记录所有字段到 docs/interface-research.md
```

#### 3. 详情接口验证

```bash
# 操作步骤
1. 从书架点击一本漫画
2. DevTools → Network → 过滤 "ComicDetail"
3. 观察请求：

   请求 Body 可能形式（测试验证）：
   - {"comic_id": 12345}
   - {"id": 12345}
   - {"mc_id": "mc12345"}
   
   响应包含：
   - 基础信息
   - 章节列表 ep_list[]
   - 权益字段 (is_locked, is_in_free, etc.)

4. 记录正确的请求体字段名和响应结构
```

---

## 第二步：实现真实 API 调用

### 更新 Rust API 模块

根据验证结果，更新 `src-tauri/src/api.rs`：

```rust
// 示例：登录 API 实现
pub async fn generate_qrcode() -> Result<QrCodeResult, ApiError> {
    let client = reqwest::Client::new();
    let response = client
        .post("https://passport.bilibili.com/x/passport-login/web/qrcode/generate")
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .send()
        .await
        .map_err(|e| ApiError::Transport(e.to_string()))?;
    
    // 根据真实响应结构解析
    let envelope = response.json::<TwirpEnvelope<QrCodeData>>().await
        .map_err(|e| ApiError::Schema(e.to_string()))?;
    
    if envelope.code != 0 {
        return Err(ApiError::Server { 
            code: envelope.code, 
            message: envelope_message(&envelope) 
        });
    }
    
    let data = envelope.data.ok_or_else(|| 
        ApiError::Schema("missing qrcode data".to_string())
    )?;
    
    Ok(QrCodeResult {
        url: data.url,
        qrcode_key: data.qrcode_key,
    })
}

// 类似地实现 poll_login_status 和 fetch_bookshelf
```

### 添加 Cookie 管理

创建 `src-tauri/src/auth.rs` 用于 Cookie 持久化：

```rust
use keyring::Entry;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AuthCredentials {
    pub sessdata: String,
    pub bili_jct: String,
    pub dedeuserid: String,
}

pub fn save_credentials(creds: &AuthCredentials) -> Result<(), String> {
    let entry = Entry::new("bilimanga", "auth_credentials")
        .map_err(|e| e.to_string())?;
    let json = serde_json::to_string(creds)
        .map_err(|e| e.to_string())?;
    entry.set_password(&json)
        .map_err(|e| e.to_string())
}

pub fn load_credentials() -> Result<Option<AuthCredentials>, String> {
    let entry = Entry::new("bilimanga", "auth_credentials")
        .map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(json) => {
            let creds = serde_json::from_str(&json)
                .map_err(|e| e.to_string())?;
            Ok(Some(creds))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}
```

---

## 第三步：UI 接入

### 添加登录界面

更新 `src/App.tsx`：

```typescript
const [loginState, setLoginState] = useState<"idle" | "qr_shown" | "polling" | "success">("idle");
const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

async function startLogin() {
  try {
    setLoginState("qr_shown");
    const qr = await generateLoginQrcode();
    setQrCodeUrl(qr.url);
    
    // 开始轮询
    setLoginState("polling");
    const pollInterval = setInterval(async () => {
      const status = await pollLoginStatus(qr.qrcode_key);
      if (status.type === "success") {
        clearInterval(pollInterval);
        setLoginState("success");
        setAuthState("authenticated");
        await loadBookshelf();
      } else if (status.type === "expired") {
        clearInterval(pollInterval);
        setLoginState("idle");
        setSystemMessage("二维码已过期，请重新登录");
      }
    }, 2000);
  } catch (error) {
    setSystemMessage(`登录失败: ${error}`);
    setLoginState("idle");
  }
}

async function loadBookshelf() {
  try {
    // 从 Rust 加载保存的 cookies
    const result = await fetchUserBookshelf(1, 20, ""); // cookies 从 keyring 加载
    // 映射到本地 LibraryItem 并存入 SQLCipher
    const localItems = result.items.map(mapBookshelfItemToLibrary);
    for (const item of localItems) {
      await upsertStoredLibraryItem(item);
    }
    setLibraryItems(await listStoredLibraryItems());
  } catch (error) {
    setSystemMessage(`加载书架失败: ${error}`);
  }
}

function mapBookshelfItemToLibrary(remote: BookshelfItem): StoredLibraryItem {
  return {
    id: `manga-${remote.comic_id}`,
    title: remote.title,
    groups: [],
    tags: remote.styles || [],
    rating: 0,
    notes: "",
    unread_chapters: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
}
```

---

## 第四步：测试验证

### 本地开发测试

```bash
# 1. 启动开发服务器
npm run tauri dev

# 2. 测试登录流程
# - 点击登录按钮
# - 扫码登录
# - 观察控制台日志
# - 验证书架加载

# 3. 测试数据持久化
# - 关闭应用
# - 重新打开
# - 验证登录态恢复
# - 验证书架数据恢复
```

### 真实安装包测试

```bash
# 1. 生成安装包
npm run tauri build

# 2. 安装测试
# - 运行 src-tauri/target/release/bundle/nsis/*.exe
# - 完整走一遍登录 → 书架 → 阅读流程
# - 连续阅读 1-2 小时验证稳定性

# 3. 异常场景测试
# - 断网重连
# - 登录过期
# - 章节未解锁
# - 缓存清理
```

---

## 第五步：发布准备

### 配置 Updater

1. 生成签名密钥：
```bash
npm run tauri signer generate -- -w ~/.tauri/bilimanga.key
```

2. 更新 `src-tauri/tauri.conf.json`：
```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": ["https://your-update-server.com/updates/{{target}}/{{current_version}}"]
    }
  }
}
```

3. 搭建更新服务器或使用 GitHub Releases

---

## 预计时间线

| 阶段 | 任务 | 预计时间 | 状态 |
|------|------|---------|------|
| 1 | 浏览器接口验证 | 2-4 小时 | ⏳ 待开始 |
| 2 | Rust API 实现 | 1-2 天 | ⏳ 待开始 |
| 3 | UI 接入 | 1-2 天 | ⏳ 待开始 |
| 4 | 测试验证 | 1-2 天 | ⏳ 待开始 |
| 5 | 发布准备 | 0.5-1 天 | ⏳ 待开始 |

**总计：4-7 天可完成 MVP**

---

## 常见问题

### Q: 如果接口结构与预期不符怎么办？

A: 调整 Rust 类型定义和解析逻辑，更新文档记录实际结构。

### Q: 登录态如何判断过期？

A: 
1. 书架接口返回 `-101` 或类似错误码
2. 捕获后设置 `authState = "expired"`
3. UI 显示重新登录提示

### Q: Cookie 管理是否安全？

A: 使用系统密钥环存储，与数据库密钥相同安全级别。

### Q: 是否需要实现所有接口？

A: P0 接口（登录、书架、详情、章节图片）必须实现。历史、进度同步可后置。

---

## 参考资料

- [Tauri 文档](https://tauri.app/start/)
- [Rust reqwest](https://docs.rs/reqwest/)
- [TypeScript 类型](https://www.typescriptlang.org/docs/)
- 项目文档：
  - `docs/interface-research.md`
  - `docs/api-boundaries.md`
  - `SECURITY.md`
  - `TEST_PLAN.md`

---

## 联系与支持

遇到问题时：
1. 查看 `docs/interface-research.md` 确认接口状态
2. 查看 `progress.md` 确认当前进度
3. 运行 `npm test` 和 `cargo test` 确保基础功能正常
4. 查看 DevTools Console 和 Rust 日志定位问题
