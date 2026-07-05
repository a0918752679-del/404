# V8.7 Zeabur 直上部署版

請優先閱讀 `README_ZEABUR_UPLOAD.md`。本版已包 Dockerfile，可直接上傳 Zeabur。

# 萬萬沒想到｜驚喜研究所 V8.5 Docker 版

黑金品牌風格平台，包含消費者前台、隱藏式後台入口、線上刮刮樂、最新賠率上傳、銀行匯款訂單、商品上下架與 LINE Rich Menu 同步。

## 主要功能

- 前台整站黑金風格：萬萬沒想到、驚喜研究所
- 後台入口隱藏：前台左上品牌區連點 5 下進入 `/admin`
- 前台不顯示後台與開發者提示
- 線上刮刮樂：會員登入後可直接開刮
- 公平公開：獎項權重、剩餘數、預估機率、公開紀錄、SHA-256 驗證雜湊
- 商品上下架、補庫存、售完防呆
- 銀行匯款付款單與後台人工確認
- 最新賠率圖片上傳與前台顯示
- 單頁 LINE Rich Menu：立即刮刮樂／最新賠率／最新活動
- Dockerfile 已內建，可直接以 Docker 部署到 Zeabur

## Zeabur 部署設定

建議使用 Docker 部署。若使用一般 Node.js 部署：

```bash
Build Command: npm install
Start Command: npm start
```

## 必填環境參數

```env
PORT=8080
BASE_URL=https://你的網域
NODE_ENV=production
JWT_SECRET=請換成至少32字元以上長隨機字串
ADMIN_PASSWORD=69677323
BANK_ACCOUNT=銀行：XXX銀行 / 代碼：000 / 帳號：0000-0000-0000 / 戶名：萬萬沒想到

LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
```

## 使用方式

- 前台：`/`
- 後台：前台左上品牌區連點 5 下，或直接進 `/admin`
- 健康檢查：`/api/health`
- 後台密碼：依 `ADMIN_PASSWORD`

## 刮刮樂公平性

平台使用後端 `crypto.randomInt` 產生抽取結果。每次開刮會寫入公開紀錄，包含獎項、時間與 SHA-256 驗證雜湊。實體獎項剩餘數為 0 後會自動停止抽出。


## V8.6 修正

- 後台登出後會自動跳轉回前台 `/`。
- `/api/admin/logout` 回傳 `redirectTo: '/'`，前端也會強制導回首頁。
