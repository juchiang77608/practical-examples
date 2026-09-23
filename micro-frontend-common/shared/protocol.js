/**
 * Host 與 Common 之間共用的契約常數。
 * 微前端走 mount／callback；語意對齊 embedded-common-shell 的 postMessage 欄位。
 */

export const COMMON_SOURCE = 'common-verify'

/** 本範例支援的驗證步驟 */
export const STEPS = /** @type {const} */ ([
  'otp',
  'mid',
  'sign-preview',
])

/** @typedef {typeof STEPS[number]} Step */

/**
 * @typedef {object} MountOptions
 * @property {string} sessionId
 * @property {Step} step
 * @property {string} caseId
 * @property {(result: { receiptId: string, step: Step, version: string, sessionId: string }) => void} onSuccess
 * @property {(info: { step: Step, message?: string, sessionId: string, version: string }) => void} onCancel
 * @property {(info: { step: Step, message?: string, sessionId: string, version: string }) => void} onError
 * @property {(info: { step: Step, version: string, sessionId: string }) => void} [onReady]
 */

/**
 * @param {unknown} step
 * @returns {step is Step}
 */
export function isStep(step) {
  return STEPS.includes(/** @type {any} */ (step))
}
