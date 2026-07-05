# 404 修正版說明

本版針對 Zeabur 部署後首頁顯示 404 做以下補強：

1. 新增 `/health`，保留 `/api/health`。
2. 新增明確 `/`、`/index.html`、`/admin`、`/admin.html` 路由。
3. 新增 `zbpack.json`，指定 Zeabur Node.js 模式：
   - build_command: `npm ci --omit=dev`
   - start_command: `npm start`
4. Dockerfile 加入 `HOST=0.0.0.0` 與 HEALTHCHECK。
5. `package.json` 指定 `packageManager: npm@10.8.2`，避免 Zeabur 誤用 yarn。

## 部署後先測

- `/health` 應回 200 JSON
- `/api/health` 應回 200 JSON
- `/` 應開啟前台
- `/admin` 應開啟後台

## Zeabur 設定建議

若 Zeabur 沒有顯示 Docker 圖示，代表沒有走 Dockerfile，請確認它至少有讀到 `zbpack.json`。

必要環境變數：

```env
PORT=8080
BASE_URL=https://你的-zeabur網域
NODE_ENV=production
JWT_SECRET=請換成至少32字元以上長隨機字串
ADMIN_PASSWORD=69677323
```
