import './style.css'
import {
  STEPS,
  buildCommonUrl,
  isCommonMessage,
} from '@shared/protocol.js'

/** Common SPA 的來源網域 — 正式環境即為你的 CDN 網址 */
const COMMON_ORIGIN = 'http://localhost:5174'

const state = {
  caseId: 'CASE-1001',
  sessionId: createSessionId(),
  lastResult: null,
}

const app = document.querySelector('#app')

app.innerHTML = `
  <header>
    <h1>宿主應用</h1>
    <p>
      業務流程留在這一頁。驗證步驟會在全螢幕 iframe 外殼中開啟，
      載入獨立的 Common SPA — 全程不做整頁轉址。
    </p>
  </header>

  <section class="panel">
    <h2>目前案件</h2>
    <div class="meta" id="meta"></div>
    <div class="actions">
      ${STEPS.map(
        (step) =>
          `<button type="button" data-step="${step}">開啟：${labelFor(step)}</button>`,
      ).join('')}
      <button type="button" class="secondary" id="new-session">建立新 session</button>
    </div>
    <div class="log" id="log">等待 Common 回傳結果…</div>
  </section>

  <div class="shell" id="shell" aria-hidden="true">
    <div class="shell-bar">
      <span>外殼 · 嵌入 Common · <strong id="shell-step"></strong></span>
      <button type="button" class="secondary" id="shell-close">關閉</button>
    </div>
    <iframe id="common-frame" title="Common 驗證"></iframe>
  </div>
`

const metaEl = document.querySelector('#meta')
const logEl = document.querySelector('#log')
const shellEl = document.querySelector('#shell')
const shellStepEl = document.querySelector('#shell-step')
const frameEl = document.querySelector('#common-frame')

renderMeta()

document.querySelectorAll('[data-step]').forEach((btn) => {
  btn.addEventListener('click', () => openShell(btn.dataset.step))
})

document.querySelector('#new-session').addEventListener('click', () => {
  state.sessionId = createSessionId()
  state.lastResult = null
  renderMeta()
  setLog('等待 Common 回傳結果…')
})

document.querySelector('#shell-close').addEventListener('click', () => {
  closeShell()
  setLog('宿主主動關閉外殼（未收到 Common 訊息）。', 'cancel')
})

window.addEventListener('message', (event) => {
  if (event.origin !== COMMON_ORIGIN) return
  if (!isCommonMessage(event.data)) return

  const msg = event.data

  if (msg.type === 'ready') {
    shellStepEl.textContent = `${msg.step} · v${msg.version ?? '?'}`
    return
  }

  if (msg.sessionId !== state.sessionId) {
    console.warn('已忽略屬於其他 session 的訊息', msg)
    return
  }

  state.lastResult = msg
  closeShell()
  renderMeta()

  if (msg.type === 'success') {
    setLog(
      `成功 (success)\nstep=${msg.step}\nreceiptId=${msg.receiptId}\nversion=${msg.version}`,
      'ok',
    )
  } else if (msg.type === 'cancel') {
    setLog(`取消 (cancel)\nstep=${msg.step}\n${msg.message ?? ''}`, 'cancel')
  } else {
    setLog(`錯誤 (error)\nstep=${msg.step}\n${msg.message ?? ''}`, 'error')
  }
})

/**
 * @param {import('@shared/protocol.js').Step} step
 */
function openShell(step) {
  const url = buildCommonUrl(COMMON_ORIGIN, {
    sessionId: state.sessionId,
    step,
    caseId: state.caseId,
  })

  frameEl.src = url
  shellStepEl.textContent = step
  shellEl.classList.add('open')
  shellEl.setAttribute('aria-hidden', 'false')
}

function closeShell() {
  shellEl.classList.remove('open')
  shellEl.setAttribute('aria-hidden', 'true')
  // 卸載內容，讓下次開啟時是全新的 Common session
  frameEl.src = 'about:blank'
}

function renderMeta() {
  metaEl.innerHTML = `
    <div>caseId：<strong>${state.caseId}</strong></div>
    <div>sessionId：<strong>${state.sessionId}</strong></div>
    <div>commonOrigin：<strong>${COMMON_ORIGIN}</strong></div>
  `
}

/**
 * @param {string} text
 * @param {'ok'|'cancel'|'error'|''} [kind]
 */
function setLog(text, kind = '') {
  logEl.className = `log${kind ? ` ${kind}` : ''}`
  logEl.textContent = text
}

function createSessionId() {
  return `sess_${Math.random().toString(36).slice(2, 10)}`
}

/** @param {string} step */
function labelFor(step) {
  const map = {
    otp: 'OTP',
    mid: 'MID',
    'sign-preview': '簽名預覽',
  }
  return map[step] ?? step
}
