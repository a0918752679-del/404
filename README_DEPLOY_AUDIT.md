# 部署巡檢紀錄

本版已完成：

- npm ci --omit=dev
- npm audit --omit=dev：0 vulnerabilities
- Node 語法檢查：server.js、public/app.js、public/admin.js、LINE Rich Menu scripts
- Smoke test：首頁、後台、健康檢查、會員、商品、訂單、付款確認、線上刮刮樂、最新賠率上傳、靜態圖檔
- Rich Menu 設定檢查：單頁三功能，立即刮刮樂 / 最新賠率 / 最新活動

Zeabur 部署後請先測：

```text
/health
```

再進入首頁與後台。
