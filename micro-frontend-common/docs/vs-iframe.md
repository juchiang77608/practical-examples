# 微前端 vs iframe 殼（對照筆記）

本目錄示範 **Module Federation**；對照範例見 `../embedded-common-shell`。

| | Micro Frontend（本範例） | Embedded iframe |
|---|---|---|
| 載入 | `import('common/mount')` ← remoteEntry | `iframe.src = commonUrl` |
| DOM | 同文件，掛進 `#common-root` | 隔離文件 |
| 結束通知 | `onSuccess` / `onCancel` / `onError` | `postMessage` |
| 開發 | Common 需先 build＋preview | 兩邊都能純 `vite dev` |
| 樣式 | 需前綴／scoped（本範例用 `.mfe-common`） | 天然隔離 |
| iOS | 跑在 Host Web（WKWebView）內才有意義 | 也可直接開 Common URL |

契約欄位（`sessionId`、`step`、`caseId`、`receiptId`）兩邊對齊，方便日後備援切換。
