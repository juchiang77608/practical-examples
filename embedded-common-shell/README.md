# Embedded Common Shell 範例

一個小而可實際執行的範例，展示 **獨立的 Common SPA + 宿主外殼（iframe）+ postMessage 契約**。

不使用微前端，也不做整頁轉址。宿主應用在全螢幕覆蓋層中開啟 Common；Common 回報成功 / 取消 / 錯誤，宿主再關閉外殼。

## 你會看到什麼

1. **宿主應用**（`http://localhost:5173`）— 一個模擬的業務流程，畫面上有「Continue to verify」按鈕。
2. 點擊按鈕會開啟 **全螢幕 iframe 外殼**，載入 Common（`http://localhost:5174`）。
3. 在 Common 內完成或取消 → 透過 `postMessage` 回傳宿主 → 外殼關閉 → 宿主顯示結果。

這對應「CDN SPA + 外殼」架構中的 Web 部分。在 iOS 上，相同的 Common URL 會以全螢幕 `WKWebView` 載入，並搭配等效的原生訊息橋接（參見 `docs/ios-bridge.md`）。

## 快速開始

```bash
cd embedded-common-shell
npm install
npm run dev
```

會同時啟動兩個應用。請在瀏覽器開啟宿主的網址。

| 應用 | 埠號 | 角色 |
|---|---|---|
| host | 5173 | 業務 UI ＋ iframe 外殼 |
| common | 5174 | 獨立的驗證 SPA（模擬流程步驟） |

## 訊息契約

請參見 `shared/protocol.js`（透過 import 供兩個應用共用）。

**宿主 → Common**（開啟時的查詢字串，可搭配選用的啟動訊息）：

| 欄位 | 範例 |
|---|---|
| `sessionId` | `sess_…` |
| `step` | `otp` \| `mid` \| `sign-preview` |
| `caseId` | `CASE-1001` |

**Common → 宿主**（`postMessage` 的內容）：

```json
{
  "source": "common-verify",
  "type": "success" | "cancel" | "error",
  "sessionId": "sess_…",
  "step": "otp",
  "receiptId": "rcpt_…",
  "message": "optional"
}
```

宿主**必須**驗證 `event.origin` 是否為 Common 的來源網域。

## 專案結構

```
embedded-common-shell/
  package.json          # 安裝並執行兩個應用
  shared/protocol.js    # 共用的契約常數
  host/                 # Vite 應用 — 外殼
  common/               # Vite 應用 — 驗證 SPA
  docs/ios-bridge.md    # 相同概念如何對應到 WKWebView
```

## 模擬「更新 CDN 而不需重新建置宿主」

1. 在 `npm run dev` 執行中的狀態下，編輯 `common/src/version.js`（修改版本字串）。
2. Vite 只會熱重載 Common。
3. 若外殼已開啟就先關閉，再重新開啟驗證流程 — 宿主程式碼完全沒變，但你仍會拿到新的 Common 版本。

這正是把 Common 部署成獨立靜態應用的用意。

## 不在範圍內

- 真實的 OTP / OCR / 身分證件 API
- 與後端的權杖交換
- Module Federation / qiankun
- 離線打包
