# iOS：以 WKWebView 實作相同架構

Web 範例使用 iframe。在 iOS 的原生畫面中沒有 iframe，取而代之的是呈現一個 **全螢幕 `WKWebView`**，載入同一組 Common 網址。

## 流程

1. 使用者在原生宿主 App 中點擊「驗證」。
2. 宿主建立一組短時效 session（正常情況下由你的後端呼叫 Common API 產生）。
3. 宿主推出一個包含 `WKWebView` 的 view controller。
4. 載入 `https://common.example.com/?sessionId=…&step=otp&caseId=…`。
5. Common 呼叫 `window.webkit.messageHandlers.host.postMessage({…})`。
6. 原生端的 handler 收到成功 / 取消 / 錯誤 → 關閉 WebView → 繼續原本流程。

## 橋接範例（Swift）

```swift
// 註冊
userContentController.add(self, name: "host")

// 接收
func userContentController(
  _ userContentController: WKUserContentController,
  didReceive message: WKScriptMessage
) {
  guard message.name == "host",
        let body = message.body as? [String: Any],
        body["source"] as? String == "common-verify" else { return }

  switch body["type"] as? String {
  case "success":
    dismiss(animated: true) { /* 繼續業務流程 */ }
  case "cancel", "error":
    dismiss(animated: true)
  default:
    break
  }
}
```

## Common 端的輔助函式（在 iOS 內執行時）

```js
function notifyHost(payload) {
  if (window.webkit?.messageHandlers?.host) {
    window.webkit.messageHandlers.host.postMessage(payload)
    return
  }
  // Web 外殼的後備做法
  window.parent.postMessage(payload, hostOrigin)
}
```

**契約欄位完全相同**，改變的只有傳輸方式（postMessage 對比 WKScriptMessageHandler）。
