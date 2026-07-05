# 萬萬沒想到｜驚喜研究所 V8.7 Zeabur 直上版

本封包已整理成 Zeabur 可直接上傳部署版本，根目錄即包含 `package.json`、`server.js`、`Dockerfile`，不要再解壓後多包一層資料夾。

## 已保留設定

- 全站黑金風格
- 品牌：萬萬沒想到｜驚喜研究所
- 前台不顯示後台入口
- 前台左上品牌區連點 5 下進入後台
- 後台登出後自動回前台 `/`
- 最新單張 Rich Menu，舊版三頁圖已移除
- 最新賠率圖片上傳與上傳時間紀錄
- 線上刮刮樂互動
- 公平公開：獎項權重、剩餘數、開刮紀錄、SHA-256 驗證雜湊
- Docker 部署檔案已包含

## Zeabur 部署方式

### 方式 A：Docker 自動部署

直接把整包 ZIP 上傳到 Zeabur。Zeabur 偵測到 `Dockerfile` 後會用 Docker 建置。

### 方式 B：Node.js 部署

若 Zeabur 沒走 Docker，請設定：

```bash
Build Command: npm ci --omit=dev
Start Command: npm start
```

## 必填環境參數

```env
PORT=8080
BASE_URL=https://你的-zeabur-網址
NODE_ENV=production
JWT_SECRET=請換成至少32字元以上長隨機字串
ADMIN_PASSWORD=69677323
BANK_ACCOUNT=銀行：XXX銀行 / 代碼：000 / 帳號：0000-0000-0000 / 戶名：萬萬沒想到
```

## 選填環境參數

```env
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
```

## 部署後測試

```text
/api/health
/
/admin
/api/scratch/odds
/api/scratch/ledger
```

`/api/health` 正常應回應：

```json
{"ok":true}
```

## 後台進入方式

前台左上品牌區「萬萬沒想到｜驚喜研究所」連點 5 下。

後台密碼預設：`69677323`
