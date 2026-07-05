# v8.7 Style Update｜活潑化與立體化調整

本版在不改動後端功能與部署設定的前提下，調整前台與後台視覺呈現。

## 前台調整

- 文案改成較活潑、消費者容易理解的語氣。
- Hero 區改為更強烈的黑金實驗室氛圍。
- 卡片、按鈕、商品區、刮刮樂區增加立體光影、玻璃質感與金屬漸層。
- 保留「公平公開、後端抽獎、紀錄透明」等核心說明。
- 手機版仍維持底部導覽與 RWD 排版。

## 後台調整

- 後台標題、商品管理與賠率上傳文字調整為更直覺。
- 管理卡片、側邊欄、按鈕與上傳區增加 3D 光影層次。
- 不改動 API、登入、訂單、商品、賠率、Rich Menu 同步功能。

## 巡檢結果

已執行：

```bash
node --check server.js
node --check public/app.js
node --check public/admin.js
npm ci --omit=dev --ignore-scripts --no-audit --no-fund
npm run smoke
```

結果：39 項 smoke test 通過。
