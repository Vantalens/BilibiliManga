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

            Write-Host "`n  完整响应已保存到 test-response.json" -ForegroundColor Gray
            $response | ConvertTo-Json -Depth 10 | Out-File "test-response.json" -Encoding UTF8
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
    Write-Host "  详细错误: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== 所有测试通过 ✓ ===" -ForegroundColor Green
Write-Host "下一步: 将 Cookie 接入 Tauri 应用进行 UI 测试`n" -ForegroundColor Cyan
