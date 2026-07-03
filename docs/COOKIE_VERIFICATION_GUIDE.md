# Cookie 验证指南

**目标**：验证已实现的 API 接口在真实环境中可用  
**预计时间**：1-2 小时  
**优先级**：🔴 最高

---

## 准备工作

### 1. 安装工具

**选项 A：使用浏览器（推荐）**
- Chrome 或 Edge（已内置 DevTools）
- 无需额外安装

**选项 B：使用命令行工具**
```bash
# 安装 curl（Windows 通常已内置）
curl --version

# 或安装 Postman Desktop
# https://www.postman.com/downloads/
```

---

## 步骤 1：获取真实 Cookie

### 使用 Chrome DevTools（推荐）

1. **打开浏览器**
   ```
   Chrome → 新建隐私窗口（Ctrl+Shift+N）
   ```

2. **打开开发者工具**
   ```
   按 F12 或 右键 → 检查
   切换到 Network 标签
   勾选 "Preserve log"
   ```

3. **访问并登录**
   ```
   访问：https://manga.bilibili.com
   点击右上角"登录"
   使用手机扫码或密码登录
   ```

4. **进入个人中心**
   ```
   登录成功后，点击右上角头像
   选择"个人中心"或直接访问：
   https://manga.bilibili.com/account-center
   ```

5. **找到 API 请求**
   ```
   在 Network 标签中过滤：
   - 输入 "twirp" 或 "nav"
   - 找到对 api.bilibili.com 或 manga.bilibili.com 的请求
   ```

6. **复制 Cookie**
   ```
   点击某个请求 → Headers 标签
   找到 "Request Headers" 部分
   找到 "Cookie:" 行
   复制完整 Cookie 字符串（非常长）
   
   应该包含类似：
   SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx; ...
   ```

7. **保存 Cookie**
   ```
   创建文件：D:\BiliManga\test-cookie.txt
   粘贴 Cookie 字符串
   注意：此文件仅用于本地测试，不要提交到 Git！
   ```

---

## 步骤 2：验证登录检查接口

### 使用 curl（命令行）

```bash
# 设置 Cookie（替换为你的实际 Cookie）
$cookie = Get-Content D:\BiliManga\test-cookie.txt

# 测试登录检查接口
curl "https://api.bilibili.com/x/web-interface/nav" `
  -H "Cookie: $cookie" `
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**预期响应**（成功）：
```json
{
  "code": 0,
  "message": "0",
  "data": {
    "isLogin": true,
    "mid": 123456789,
    "uname": "你的用户名",
    ...
  }
}
```

**预期响应**（失败）：
```json
{
  "code": -101,
  "message": "账号未登录",
  "data": {
    "isLogin": false
  }
}
```

---

## 步骤 3：验证已购漫画接口

### 使用 curl（命令行）

```bash
# 确保已设置 Cookie 变量（见上一步）

# 测试已购漫画接口
curl "https://manga.bilibili.com/twirp/user.v1.User/GetAutoBuyComics?device=pc&platform=web&nov=27" `
  -X POST `
  -H "Content-Type: application/json" `
  -H "Origin: https://manga.bilibili.com" `
  -H "Referer: https://manga.bilibili.com/account-center" `
  -H "x-bili-manga-from: c-int-v1" `
  -H "Cookie: $cookie" `
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" `
  -d '{"page_num":1,"page_size":15}' | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**预期响应**（成功）：
```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 20276887,
      "comic_id": 26554,
      "comic_title": "示例漫画名称",
      "vcover": "https://i0.hdslb.com/bfs/manga-static/xxx.jpg",
      "bought_ep_count": 13,
      "last_ord": 235,
      "last_short_title": "235",
      ...
    }
  ]
}
```

**可能的错误**：
```json
// 未登录
{"code": -101, "msg": "账号未登录"}

// 会话过期
{"code": -6, "msg": "Cookie已过期"}

// 上下文不匹配
{"code": 99, "msg": "请求失败,请稍后重试。"}
```

---

## 步骤 4：使用项目内置测试工具

### 创建测试脚本

保存以下内容为 `D:\BiliManga\test-api.ps1`：

```powershell
# BiliManga API 测试脚本
param(
    [string]$CookieFile = "test-cookie.txt"
)

Write-Host "=== BiliManga API 测试工具 ===" -ForegroundColor Cyan

# 读取 Cookie
if (-not (Test-Path $CookieFile)) {
    Write-Host "错误: 找不到 Cookie 文件: $CookieFile" -ForegroundColor Red
    Write-Host "请先创建 test-cookie.txt 并粘贴你的 Cookie" -ForegroundColor Yellow
    exit 1
}

$cookie = Get-Content $CookieFile -Raw
$cookie = $cookie.Trim()

if ($cookie.Length -lt 50) {
    Write-Host "错误: Cookie 长度过短，可能无效" -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/2] 测试登录状态..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.bilibili.com/x/web-interface/nav" `
        -Headers @{
            "Cookie" = $cookie
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    
    if ($response.code -eq 0) {
        Write-Host "✓ 登录成功" -ForegroundColor Green
        Write-Host "  用户ID: $($response.data.mid)" -ForegroundColor Gray
        Write-Host "  用户名: $($response.data.uname)" -ForegroundColor Gray
    } elseif ($response.code -eq -101) {
        Write-Host "✗ 未登录 (code=-101)" -ForegroundColor Red
        Write-Host "  请检查 Cookie 是否正确" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✗ 登录检查失败 (code=$($response.code))" -ForegroundColor Red
        Write-Host "  消息: $($response.message)" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ 请求失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/2] 测试已购漫画接口..." -ForegroundColor Yellow

try {
    $body = @{
        page_num = 1
        page_size = 15
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri "https://manga.bilibili.com/twirp/user.v1.User/GetAutoBuyComics?device=pc&platform=web&nov=27" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Origin" = "https://manga.bilibili.com"
            "Referer" = "https://manga.bilibili.com/account-center"
            "x-bili-manga-from" = "c-int-v1"
            "Cookie" = $cookie
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        } `
        -Body $body
    
    if ($response.code -eq 0) {
        Write-Host "✓ 已购漫画获取成功" -ForegroundColor Green
        Write-Host "  总数: $($response.data.Count)" -ForegroundColor Gray
        
        if ($response.data.Count -gt 0) {
            Write-Host "`n  前 3 条漫画:" -ForegroundColor Cyan
            $response.data | Select-Object -First 3 | ForEach-Object {
                Write-Host "    - [$($_.comic_id)] $($_.comic_title)" -ForegroundColor Gray
                Write-Host "      已购章节: $($_.bought_ep_count)" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "  (暂无已购漫画)" -ForegroundColor Gray
        }
    } elseif ($response.code -eq -6) {
        Write-Host "✗ 会话过期 (code=-6)" -ForegroundColor Red
        Write-Host "  请重新登录并更新 Cookie" -ForegroundColor Yellow
        exit 1
    } elseif ($response.code -eq 99) {
        Write-Host "✗ 请求上下文不匹配 (code=99)" -ForegroundColor Red
        Write-Host "  可能需要完整的浏览器环境" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✗ 获取失败 (code=$($response.code))" -ForegroundColor Red
        Write-Host "  消息: $($response.msg)" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ 请求失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 所有测试通过 ✓ ===" -ForegroundColor Green
Write-Host "下一步: 将 Cookie 接入 Tauri 应用进行 UI 测试`n" -ForegroundColor Cyan
```

### 运行测试

```powershell
cd D:\BiliManga
.\test-api.ps1
```

---

## 验证清单

完成以下检查项：

- [ ] 成功获取真实 Cookie
- [ ] Cookie 保存到 `test-cookie.txt`（不要提交到 Git）
- [ ] 登录检查接口返回 `code=0` 和 `isLogin=true`
- [ ] 已购漫画接口返回 `code=0` 和数据数组
- [ ] 响应字段与代码实现一致（`comic_id`, `comic_title`, `vcover` 等）
- [ ] 记录任何字段差异或错误码

---

## 常见问题

### Q1: Cookie 太长，无法复制完整？
**A**: 在 DevTools 中右键 Cookie 行 → "Copy value"，或者点击请求 → "Copy as cURL"。

### Q2: 返回 `code=99` 怎么办？
**A**: 说明缺少浏览器上下文。尝试：
1. 添加更多 Header（如 `sec-ch-ua`）
2. 确保 Referer 和 Origin 正确
3. 在真实浏览器中测试（不要用命令行）

### Q3: 返回 `code=-6` 怎么办？
**A**: Cookie 已过期，重新登录并更新 Cookie。

### Q4: 没有已购漫画怎么办？
**A**: 
- 先在官方网站购买一些免费章节
- 或者测试书架接口 `ListFavorite`（需要收藏一些漫画）

---

## 下一步

验证成功后：

1. **更新接口文档**
   - 记录实际响应字段
   - 更新 `docs/interface-research.md`

2. **接入 Tauri 应用**
   - 将 Cookie 存入 keyring
   - 在 UI 中调用 `checkLoginStatus()` 和 `fetchPurchasedComics()`

3. **继续实现其他接口**
   - 书架 `ListFavorite`
   - 详情 `ComicDetail`
   - 章节图片 `GetImageIndex` + `ImageToken`

---

**安全提醒**：
- ⚠️ Cookie 包含敏感信息，切勿分享或提交到 Git
- ⚠️ 添加 `test-cookie.txt` 到 `.gitignore`
- ⚠️ 测试完成后删除测试文件
