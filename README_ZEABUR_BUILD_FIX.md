# Zeabur build 卡在 npm ci 的修正說明

## 問題原因

前一版 `package-lock.json` 內的套件下載來源被鎖到 ChatGPT 產包環境的內部 npm proxy：

```text
packages.applied-caas-gateway1.internal.api.openai.org
```

這個網址 Zeabur 外部建置環境無法存取，所以 Docker build 會卡在：

```dockerfile
RUN npm ci --omit=dev ...
```

最後導致部署失敗。

## 本版修正

1. 已將 `package-lock.json` 全部改回公開 npm registry：

```text
https://registry.npmjs.org/
```

2. 移除後端不需要的 `scratchcard-js` npm dependency。
   - 前台仍保留：`public/vendor/scratchcard.min.js`
   - 刮刮樂功能不受影響。

3. Dockerfile 改成更穩定的安裝方式：

```dockerfile
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
```

4. 移除 `postinstall`，避免 Zeabur build 階段多跑一次 dependency check。

## 部署後檢查

部署完成後先測：

```text
/health
```

正常應回：

```json
{"ok":true,"service":"ww-kuji-v8.7"}
```
