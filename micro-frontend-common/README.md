# Micro Frontend Common 範例

一個可執行的範例，展示 **Host + Common remote（Vite Module Federation）+ 同 DOM 掛載 + callback 契約**。

宿主在全螢幕殼層內動態載入 Common；完成／取消／錯誤以 callback 回傳，宿主再卸載模組並關閉殼層。不做整頁轉址、也不使用 iframe。

對照範例（iframe + postMessage）：[`../embedded-common-shell`](../embedded-common-shell)。

## 你會看到什麼

1. **宿主應用**（`http://localhost:5183`）— 模擬業務流程，有「開啟驗證」按鈕。
2. 點擊後開啟全螢幕殼，**動態 import** Common remote（`http://localhost:5184/assets/remoteEntry.js`）。
3. Common 掛進 `#common-root`（同 DOM）→ 完成或取消 → callback → 殼關閉 → 宿主顯示結果。

## 快速開始

```bash
cd micro-frontend-common
npm install
npm run dev
```

腳本會：

1. build Common remote  
2. 以 `vite preview` 在 `:5184` 提供 `remoteEntry.js`（並 watch rebuild）  
3. 等 remote 就緒後啟動 Host `:5183`

| 應用 | 埠號 | 角色 |
|---|---|---|
| host | 5183 | 業務 UI ＋ 殼層容器 |
| common | 5184 | Federation remote（exposes `./mount`） |

> Module Federation 開發時 remote 通常需 **build + preview**（不能只靠兩邊純 HMR）。這是工具限制，不是業務需求。

## 掛載契約

見 `shared/protocol.js`。Host 呼叫：

```js
const { mount } = await import('common/mount')

const handle = mount(container, {
  sessionId,
  step,      // 'otp' | 'mid' | 'sign-preview'
  caseId,
  onReady,
  onSuccess,
  onCancel,
  onError,
})

// 關閉時
handle.unmount()
```

## 專案結構

```
micro-frontend-common/
  package.json
  shared/protocol.js
  host/                 # Vite host — remotes.common
  common/               # Vite remote — exposes ./mount
  docs/vs-iframe.md
```

## 模擬「更新 CDN 而不需重新建置宿主」

1. `npm run dev` 執行中，編輯 `common/src/version.js`。
2. Common watch rebuild 完成後，關閉再開啟驗證殼。
3. Host 程式未變，但殼內會顯示新的 Common 版本。

## 不在範圍內

- 真實 OTP / OCR / API
- Vue／React shared runtime 優化
- 正式 CSP／CDN 簽章
- 離線打包 remote
