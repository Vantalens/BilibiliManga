# BiliManga Release Gate

版本：v0.1.0
作者：Codex
状态：草稿
最后更新：2026-07-02

## 当前发布状态

- 当前可以生成 Windows NSIS 内测安装包。
- 当前不能声明自动更新发布完成。
- `src-tauri/tauri.conf.json` 中 `createUpdaterArtifacts` 当前为 `false`，避免没有签名私钥时构建失败。

## 正式发布前必须完成

1. 生成 Tauri updater 签名密钥。
2. 将公钥写入 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`。
3. 配置 HTTPS 更新源到 `plugins.updater.endpoints`。
4. 在发布环境设置 `TAURI_SIGNING_PRIVATE_KEY`。
5. 将 `bundle.createUpdaterArtifacts` 改为 `true`。
6. 运行 `npm run tauri -- build` 并确认生成 `.sig` 更新签名文件。
7. 验证旧版本可检查、下载、安装新版本；失败时旧版本仍可启动。

## 内测构建命令

```powershell
npm run tauri -- build
```

预期产物：

```text
src-tauri/target/release/bundle/nsis/BiliManga_0.1.0_x64-setup.exe
```

## 发布阻断

- 未配置签名私钥、公钥和 HTTPS 更新源。
- 未完成真实 Windows GUI 路径验证。
- 未完成真实接口调研。
- 未验证加密 SQLite 实际数据库文件。


## Windows SQLCipher Build Dependency

- Strawberry Perl 5.42.2.1 is required to build vendored OpenSSL for SQLCipher on Windows.
- If installed during an active shell session, prepend `C:\Strawberry\perl\bin;C:\Strawberry\c\bin;C:\Strawberry\perl\site\bin` to `PATH` before running `cargo` or `tauri build`.
