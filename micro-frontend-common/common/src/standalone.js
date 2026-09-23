/**
 * 僅供直接開啟 Common preview 時的獨立預覽（非 Host 載入路徑）。
 * 正式整合請走 Module Federation 的 `./mount`。
 */
import { mount } from './mount.js'

const app = document.querySelector('#app')
if (app) {
  mount(app, {
    sessionId: 'sess_standalone',
    caseId: 'CASE-STANDALONE',
    step: 'otp',
    onSuccess: (r) => alert(`success: ${r.receiptId}`),
    onCancel: (r) => alert(`cancel: ${r.message ?? ''}`),
    onError: (r) => alert(`error: ${r.message ?? ''}`),
  })
}
