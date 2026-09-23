import styles from './style.css?inline'
import { isStep } from '@shared/protocol.js'
import { COMMON_VERSION } from './version.js'

/**
 * Module Federation 對外暴露的掛載入口。
 *
 * @param {HTMLElement} container
 * @param {import('@shared/protocol.js').MountOptions} options
 */
export function mount(container, options) {
  const sessionId = options.sessionId ?? ''
  const caseId = options.caseId ?? ''
  const stepParam = options.step ?? 'otp'
  const step = isStep(stepParam) ? stepParam : 'otp'

  const root = document.createElement('div')
  root.className = 'mfe-common'
  root.setAttribute('data-common-version', COMMON_VERSION)

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  root.appendChild(styleEl)

  const inner = document.createElement('div')
  inner.className = 'mfe-inner'
  root.appendChild(inner)

  inner.innerHTML = `
    <span class="badge">Common Remote · v${COMMON_VERSION}</span>
    <section class="card">
      <h1>${titleFor(step)}</h1>
      <p class="lead">${leadFor(step)}</p>
      <div class="kv">
        <div>sessionId：<strong>${escapeHtml(sessionId || '(未帶入)')}</strong></div>
        <div>caseId：<strong>${escapeHtml(caseId || '(未帶入)')}</strong></div>
        <div>step：<strong>${escapeHtml(step)}</strong></div>
        <div>load：<strong>Module Federation</strong></div>
      </div>
      <div data-step-body></div>
      <div class="actions" data-actions></div>
      <p class="hint">
        編輯 <code>common/src/version.js</code> 後等 watch rebuild，
        關閉再開啟殼層即可看到新版本 — Host 無需重新建置。
      </p>
    </section>
  `

  container.replaceChildren(root)

  const bodyEl = /** @type {HTMLElement} */ (inner.querySelector('[data-step-body]'))
  const actionsEl = /** @type {HTMLElement} */ (inner.querySelector('[data-actions]'))

  renderStep(step, bodyEl, actionsEl, {
    sessionId,
    onSuccess: options.onSuccess,
    onCancel: options.onCancel,
    onError: options.onError,
  })

  options.onReady?.({ step, version: COMMON_VERSION, sessionId })

  return {
    unmount() {
      container.replaceChildren()
    },
  }
}

export default mount

/**
 * @param {import('@shared/protocol.js').Step} s
 * @param {HTMLElement} bodyEl
 * @param {HTMLElement} actionsEl
 * @param {{
 *   sessionId: string,
 *   onSuccess: import('@shared/protocol.js').MountOptions['onSuccess'],
 *   onCancel: import('@shared/protocol.js').MountOptions['onCancel'],
 *   onError: import('@shared/protocol.js').MountOptions['onError'],
 * }} handlers
 */
function renderStep(s, bodyEl, actionsEl, handlers) {
  const finish = {
    success(receiptId) {
      handlers.onSuccess({
        receiptId,
        step: s,
        version: COMMON_VERSION,
        sessionId: handlers.sessionId,
      })
    },
    cancel(message) {
      handlers.onCancel({
        step: s,
        message,
        sessionId: handlers.sessionId,
        version: COMMON_VERSION,
      })
    },
    error(message) {
      handlers.onError({
        step: s,
        message,
        sessionId: handlers.sessionId,
        version: COMMON_VERSION,
      })
    },
  }

  if (s === 'otp') {
    bodyEl.innerHTML = `
      <label for="mfe-otp">一次性驗證碼</label>
      <input id="mfe-otp" inputmode="numeric" maxlength="6" placeholder="6 位數驗證碼" autocomplete="one-time-code" />
    `
    actionsEl.innerHTML = `
      <button type="button" class="primary" data-act="submit">驗證 OTP</button>
      <button type="button" class="ghost" data-act="cancel">取消</button>
      <button type="button" class="danger" data-act="fail">模擬錯誤</button>
    `
    actionsEl.querySelector('[data-act="submit"]')?.addEventListener('click', () => {
      const code = /** @type {HTMLInputElement} */ (bodyEl.querySelector('#mfe-otp')).value.trim()
      if (!/^\d{6}$/.test(code)) {
        finish.error('請輸入 6 位數驗證碼（範例中任意 6 位數皆可）。')
        return
      }
      finish.success(`rcpt_otp_${code}`)
    })
    actionsEl.querySelector('[data-act="fail"]')?.addEventListener('click', () => {
      finish.error('模擬 Common API 失敗。')
    })
  } else if (s === 'mid') {
    bodyEl.innerHTML = `
      <p class="lead" style="margin:0 0 1rem">模擬 MID 驗證 — 於「裝置端」核准後按下確認。</p>
    `
    actionsEl.innerHTML = `
      <button type="button" class="primary" data-act="submit">確認 MID</button>
      <button type="button" class="ghost" data-act="cancel">取消</button>
    `
    actionsEl.querySelector('[data-act="submit"]')?.addEventListener('click', () => {
      finish.success(`rcpt_mid_${Date.now().toString(36)}`)
    })
  } else {
    bodyEl.innerHTML = `
      <label>簽名預覽（可用滑鼠或手指書寫）</label>
      <div class="canvas-wrap"><canvas data-pad width="440" height="140"></canvas></div>
    `
    const canvas = /** @type {HTMLCanvasElement} */ (bodyEl.querySelector('[data-pad]'))
    setupPad(canvas)
    actionsEl.innerHTML = `
      <button type="button" class="primary" data-act="submit">確認簽名</button>
      <button type="button" class="ghost" data-act="clear">清除</button>
      <button type="button" class="ghost" data-act="cancel">取消</button>
    `
    actionsEl.querySelector('[data-act="clear"]')?.addEventListener('click', () => {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      canvas.dataset.dirty = '0'
    })
    actionsEl.querySelector('[data-act="submit"]')?.addEventListener('click', () => {
      if (canvas.dataset.dirty !== '1') {
        finish.error('請先簽名。')
        return
      }
      finish.success(`rcpt_sign_${Date.now().toString(36)}`)
    })
  }

  actionsEl.querySelector('[data-act="cancel"]')?.addEventListener('click', () => {
    finish.cancel('使用者在 Common 內取消。')
  })
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
      otp: '以 Module Federation 掛進宿主 DOM 的 OTP 步驟。',
      mid: '模擬行動身分識別步驟，未串接真實電信商。',
      'sign-preview': '模擬簽名擷取；宿主只會收到收據編號 callback。',
    }[s] ?? ''
  )
}

/** @param {string} value */
function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
