/**
 * 宿主（Host）與 Common 之間共用的訊息契約。
 * 請讓這個檔案維持為欄位名稱／型別的唯一真實來源。
 */

export const COMMON_SOURCE = 'common-verify'

/** 本範例支援的驗證步驟 */
export const STEPS = /** @type {const} */ ([
  'otp',
  'mid',
  'sign-preview',
])

/** Common 可以送給宿主的訊息類型 */
export const MESSAGE_TYPES = /** @type {const} */ ([
  'ready',
  'success',
  'cancel',
  'error',
])

/**
 * @typedef {typeof STEPS[number]} Step
 * @typedef {typeof MESSAGE_TYPES[number]} MessageType
 *
 * @typedef {object} CommonToHostMessage
 * @property {typeof COMMON_SOURCE} source
 * @property {MessageType} type
 * @property {string} sessionId
 * @property {Step} [step]
 * @property {string} [receiptId]
 * @property {string} [message]
 * @property {string} [version]
 */

/**
 * @param {unknown} data
 * @returns {data is CommonToHostMessage}
 */
export function isCommonMessage(data) {
  if (!data || typeof data !== 'object') return false
  const m = /** @type {Record<string, unknown>} */ (data)
  return m.source === COMMON_SOURCE && typeof m.type === 'string'
}

/**
 * 組出外殼要載入的 Common 網址。
 * @param {string} commonOrigin 例如 http://localhost:5174
 * @param {{ sessionId: string, step: Step, caseId: string }} params
 */
export function buildCommonUrl(commonOrigin, params) {
  const url = new URL(commonOrigin)
  url.searchParams.set('sessionId', params.sessionId)
  url.searchParams.set('step', params.step)
  url.searchParams.set('caseId', params.caseId)
  return url.toString()
}
