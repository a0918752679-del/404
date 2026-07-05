# Docker 部署

本版已內建 Dockerfile。Zeabur 可直接用 Docker 部署。

## Dockerfile 重點

- Node.js 20 alpine
- `npm install --omit=dev`
- `EXPOSE 8080`
- `npm start`
- 服務監聽 `0.0.0.0`

## 環境參數

```env
PORT=8080
BASE_URL=https://你的網域
NODE_ENV=production
JWT_SECRET=請換成至少32字元以上長隨機字串
ADMIN_PASSWORD=69677323
BANK_ACCOUNT=銀行：XXX銀行 / 代碼：000 / 帳號：0000-0000-0000 / 戶名：萬萬沒想到
```

LINE Rich Menu 同步：

```env
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
```

會員登入：

```env
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
