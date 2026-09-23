import './style.css'
import { COMMON_SOURCE, STEPS } from '@shared/protocol.js'
import { COMMON_VERSION } from './version.js'

/** 允許嵌入本頁 / 接收訊息的宿主來源網域 — 僅供本機範例使用 */
const HOST_ORIGIN = 'http://localhost:5173'

const params = new URLSearchParams(window.location.search)
const sessionId = params.get('sessionId') ?? ''
const caseId = params.get('caseId') ?? ''
const stepParam = params.get('step') ?? 'otp'
const step = /** @type {import('@shared/protocol.js').Step} */ (
  STEPS.includes(/** @type {any} */ (stepParam)) ? stepParam : 'otp'
)

const app = document.querySelector('#app')

app.innerHTML = `
  <span class="badge">Common SPA · v${COMMON_VERSION}</span>
  <section class="card">
    <h1>${titleFor(step)}</h1>
    <p class="lead">${leadFor(step)}</p>
    <div class="kv">
      <div>sessionId：<strong>${sessionId || '(未帶入)'}</strong></div>
      <div>caseId：<strong>${caseId || '(未帶入)'}</strong></div>
      <div>step：<strong>${step}</strong></div>
    </div>
    <div id="step-body"></div>
    <div class="actions" id="actions"></div>
    <p class="hint">
      在宿主完全不動的情況下編輯 <code>common/src/version.js</code> —
      重新開啟外殼就會看到新的 Common 版本（等同 CDN 更新）。
    </p>
  </section>
`

const bodyEl = document.querySelector('#step-body')
const actionsEl = document.querySelector('#actions')

renderStep(step)

notifyHost({
  source: COMMON_SOURCE,
  type: 'ready',
  sessionId,
  step,
  version: COMMON_VERSION,
})

/**
 * @param {import('@shared/protocol.js').Step} s
 */
function renderStep(s) {
  if (s === 'otp') {
    bodyEl.innerHTML = `
      <label for="otp">一次性驗證碼</label>
      <input id="otp" inputmode="numeric" maxlength="6" placeholder="6 位數驗證碼" autocomplete="one-time-code" />
    `
    actionsEl.innerHTML = `
      <button type="button" class="primary" id="submit">驗證 OTP</button>
      <button type="button" class="ghost" id="cancel">取消</button>
      <button type="button" class="danger" id="fail">模擬錯誤</button>
    `
    document.querySelector('#submit').addEventListener('click', () => {
      const code = /** @type {HTMLInputElement} */ (document.querySelector('#otp')).value.trim()
      if (!/^\d{6}$/.test(code)) {
        send('error', { message: '請輸入 6 位數驗證碼（範例中任意 6 位數皆可）。' })
        return
      }
      send('success', { receiptId: `rcpt_otp_${code}` })
    })
  } else if (s === 'mid') {
    bodyEl.innerHTML = `
      <p class="lead" style="margin:0 0 1rem">模擬 MID 驗證 — 於「裝置端」核准後按下確認。</p>
    `
    actionsEl.innerHTML = `
      <button type="button" class="primary" id="submit">確認 MID</button>
      <button type="button" class="ghost" id="cancel">取消</button>
    `
    document.querySelector('#submit').addEventListener('click', () => {
      send('success', { receiptId: `rcpt_mid_${Date.now().toString(36)}` })
    })
  } else {
    bodyEl.innerHTML = `
      <label>簽名預覽（可用滑鼠或手指書寫）</label>
      <div class="canvas-wrap"><canvas id="pad" width="440" height="140"></canvas></div>
    `
    setupPad(/** @type {HTMLCanvasElement} */ (document.querySelector('#pad')))
    actionsEl.innerHTML = `
      <button type="button" class="primary" id="submit">確認簽名</button>
      <button type="button" class="ghost" id="clear">清除</button>
      <button type="button" class="ghost" id="cancel">取消</button>
    `
    document.querySelector('#clear').addEventListener('click', () => {
      const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#pad'))
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      canvas.dataset.dirty = '0'
    })
    document.querySelector('#submit').addEventListener('click', () => {
      const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#pad'))
      if (canvas.dataset.dirty !== '1') {
        send('error', { message: '請先簽名。' })
        return
      }
      send('success', { receiptId: `rcpt_sign_${Date.now().toString(36)}` })
    })
  }

  document.querySelector('#cancel')?.addEventListener('click', () => {
    send('cancel', { message: '使用者在 Common 內取消。' })
  })
  document.querySelector('#fail')?.addEventListener('click', () => {
    send('error', { message: '模擬 Common API 失敗。' })
  })
}

/**
 * @param {'success'|'cancel'|'error'} type
 * @param {{ receiptId?: string, message?: string }} [extra]
 */
function send(type, extra = {}) {
  notifyHost({
    source: COMMON_SOURCE,
    type,
    sessionId,
    step,
    version: COMMON_VERSION,
    ...extra,
  })
}

/** @param {Record<string, unknown>} payload */
function notifyHost(payload) {
  // iOS WKWebView 橋接（僅在原生外殼注入時才存在）
  const wk = globalThis.webkit?.messageHandlers?.host
  if (wk) {
    wk.postMessage(payload)
    return
  }

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(payload, HOST_ORIGIN)
  }
}

/** @param {HTMLCanvasElement} canvas */
function setupPad(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = '#1b2430'
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'

  let drawing = false

  const pos = (e) => {
    const rect = canvas.getBoundingClientRect()
    const src = 'touches' in e ? e.touches[0] : e
    return {
      x: ((src.clientX - rect.left) / rect.width) * canvas.width,
      y: ((src.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const start = (e) => {
    drawing = true
    canvas.dataset.dirty = '1'
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    e.preventDefault()
  }
  const move = (e) => {
    if (!drawing) return
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    e.preventDefault()
  }
  const end = () => {
    drawing = false
  }

  canvas.addEventListener('mousedown', start)
  canvas.addEventListener('mousemove', move)
  window.addEventListener('mouseup', end)
  canvas.addEventListener('touchstart', start, { passive: false })
  canvas.addEventListener('touchmove', move, { passive: false })
  canvas.addEventListener('touchend', end)
}

/** @param {string} s */
function titleFor(s) {
  return (
    {
      otp: 'OTP 驗證',
      mid: 'MID 驗證',
      'sign-preview': '簽名預覽',
    }[s] ?? s
  )
}

/** @param {string} s */
function leadFor(s) {
  return (
    {
      otp: '在獨立的 Common 應用內模擬 OTP 步驟。',
      mid: '模擬行動身分識別步驟，未串接真實電信商。',
      'sign-preview': '模擬簽名擷取，宿主只會收到一組收據編號。',
    }[s] ?? ''
  )
}
