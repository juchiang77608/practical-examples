import './style.css'
import { STEPS } from '@shared/protocol.js'

/** Common remote 的 preview／CDN 位址（僅供顯示；實際載入由 federation remotes 決定） */
const COMMON_REMOTE = 'http://localhost:5184/assets/remoteEntry.js'

const state = {
  caseId: 'CASE-1001',
  sessionId: createSessionId(),
  lastResult: null,
  /** @type {{ unmount: () => void } | null} */
  handle: null,
}

const app = document.querySelector('#app')

app.innerHTML = `
  <header>
    <h1>宿主應用</h1>
    <p>
      業務流程留在這一頁。驗證步驟以 <strong>Module Federation</strong>
      動態載入 Common remote，掛進全螢幕殼層的同 DOM 容器 — 不做整頁轉址、也不用 iframe。
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
    <div class="log" id="log">等待 Common callback…</div>
  </section>

  <div class="shell" id="shell" aria-hidden="true">
    <div class="shell-bar">
      <span>外殼 · Micro Frontend · <strong id="shell-step"></strong></span>
      <button type="button" class="secondary" id="shell-close">關閉</button>
    </div>
    <div id="common-root"></div>
  </div>
`

const metaEl = document.querySelector('#meta')
const logEl = document.querySelector('#log')
const shellEl = document.querySelector('#shell')
const shellStepEl = document.querySelector('#shell-step')
const rootEl = document.querySelector('#common-root')

renderMeta()

document.querySelectorAll('[data-step]').forEach((btn) => {
  btn.addEventListener('click', () => openShell(btn.dataset.step))
})

document.querySelector('#new-session').addEventListener('click', () => {
  state.sessionId = createSessionId()
  state.lastResult = null
  renderMeta()
  setLog('等待 Common callback…')
})

document.querySelector('#shell-close').addEventListener('click', () => {
  closeShell()
  setLog('宿主主動關閉外殼（未收到 Common callback）。', 'cancel')
})

/**
 * @param {import('@shared/protocol.js').Step} step
 */
async function openShell(step) {
  setLog(`正在載入 Common remote…\n${COMMON_REMOTE}`)
  shellStepEl.textContent = step
  shellEl.classList.add('open')
  shellEl.setAttribute('aria-hidden', 'false')

  try {
    // federation 會把 'common/mount' 解析到 remoteEntry
    const remote = await import('common/mount')
    const mount = remote.mount ?? remote.default

    state.handle?.unmount()
    state.handle = mount(rootEl, {
      sessionId: state.sessionId,
      step,
      caseId: state.caseId,
      onReady({ version }) {
        shellStepEl.textContent = `${step} · v${version ?? '?'}`
      },
      onSuccess(result) {
        if (result.sessionId !== state.sessionId) return
        state.lastResult = result
        closeShell()
        renderMeta()
        setLog(
          `成功 (onSuccess)\nstep=${result.step}\nreceiptId=${result.receiptId}\nversion=${result.version}`,
          'ok',
        )
      },
      onCancel(info) {
        if (info.sessionId !== state.sessionId) return
        state.lastResult = info
        closeShell()
        renderMeta()
        setLog(`取消 (onCancel)\nstep=${info.step}\n${info.message ?? ''}`, 'cancel')
      },
      onError(info) {
        if (info.sessionId !== state.sessionId) return
        state.lastResult = info
        closeShell()
        renderMeta()
        setLog(`錯誤 (onError)\nstep=${info.step}\n${info.message ?? ''}`, 'error')
      },
    })
  } catch (err) {
    console.error(err)
    closeShell()
    setLog(
      `載入 remote 失敗。請確認 Common 已 build 並在 :5184 preview。\n${String(err)}`,
      'error',
    )
  }
}

function closeShell() {
  state.handle?.unmount()
  state.handle = null
  rootEl.replaceChildren()
  shellEl.classList.remove('open')
  shellEl.setAttribute('aria-hidden', 'true')
}

function renderMeta() {
  metaEl.innerHTML = `
    <div>caseId：<strong>${state.caseId}</strong></div>
    <div>sessionId：<strong>${state.sessionId}</strong></div>
    <div>remote：<strong>${COMMON_REMOTE}</strong></div>
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
