@echo off
echo ================================================
echo BiliManga Cookie 快速验证工具
echo ================================================
echo.
echo 步骤 1: 获取 Cookie
echo   1. 打开 Chrome 浏览器
echo   2. 访问 https://manga.bilibili.com
echo   3. 按 F12 打开开发者工具
echo   4. 切换到 Network 标签
echo   5. 登录（如果未登录）
echo   6. 在 Network 中找到任意请求
echo   7. 点击请求 -^> Headers -^> 找到 Cookie
echo   8. 右键 Cookie 行 -^> Copy value
echo.
echo 步骤 2: 保存 Cookie
echo   9. 将复制的 Cookie 粘贴到 test-cookie.txt
echo.
pause
echo.
echo 正在检查 test-cookie.txt...
if not exist test-cookie.txt (
    echo [错误] 找不到 test-cookie.txt
    echo 请创建该文件并粘贴 Cookie
    pause
    exit /b 1
)

echo [OK] 找到 test-cookie.txt
echo.
echo 正在运行 PowerShell 测试脚本...
echo.
powershell -ExecutionPolicy Bypass -File test-api.ps1
echo.
echo ================================================
echo 测试完成！
echo.
echo 如果看到绿色的 ✓ 表示成功
echo 如果看到红色的 ✗ 请检查 Cookie 是否正确
echo.
echo 下一步：
echo   - 成功：继续实现 Cookie 持久化
echo   - 失败：检查 docs/COOKIE_VERIFICATION_GUIDE.md
echo ================================================
pause
