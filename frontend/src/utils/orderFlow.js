/**
 * Product-specific ordering: upload vs contact-only WhatsApp flows.
 */

/** @type {Set<string>} */
export const UPLOAD_PRODUCT_SLUGS = new Set([
  'polaroids',
  'mini-photobook',
  'photobooth-strips',
  'mini-bouquet',
  'keepsake-frame',
])

/** @type {Set<string>} */
export const CONTACT_PRODUCT_SLUGS = new Set([
  'custom-magazine',
  'newspaper',
  'mini-album',
  'coloring-book',
  'mini-frame',
])

/**
 * @param {string} slug
 * @returns {'upload' | 'contact'}
 */
export function getOrderFlowType(slug) {
  if (UPLOAD_PRODUCT_SLUGS.has(slug)) return 'upload'
  if (CONTACT_PRODUCT_SLUGS.has(slug)) return 'contact'
  return 'contact'
}

/**
 * Exact number of photos required for upload (not less, not more). Null = any positive count.
 * For keepsake-frame, pass `selectionSummary` so the count matches the chosen layout.
 * @param {string | null | undefined} slug
 * @param {string | undefined} selectionSummary
 * @returns {number | null}
 */
export function getRequiredUploadCount(slug, selectionSummary) {
  if (slug === 'mini-photobook') return 10
  if (slug === 'mini-bouquet') return 5
  if (slug === 'keepsake-frame' && selectionSummary) {
    const m = /\((\d+) photos\)/.exec(selectionSummary)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

/**
 * @param {{ slug: string; summary?: string }} line
 * @returns {number | null}
 */
export function getRequiredUploadCountForLine(line) {
  return getRequiredUploadCount(line.slug, line.summary)
}

/**
 * Cart lines that need customer photo uploads before checkout can continue.
 * @param {Array<{ slug?: string }> | null | undefined} cartLines
 */
export function getCartLinesRequiringUpload(cartLines) {
  if (!Array.isArray(cartLines)) return []
  return cartLines.filter(
    (line) => line?.slug && UPLOAD_PRODUCT_SLUGS.has(line.slug),
  )
}

/**
 * @param {{ slug: string; summary?: string }} line
 * @param {Array<{ file?: File }> | null | undefined} files
 */
export function isCartLineUploadComplete(line, files) {
  const req = getRequiredUploadCountForLine(line)
  const n = files?.length ?? 0
  if (req != null) return n === req
  return n > 0
}

/**
 * @param {Array<{ lineId: string; slug: string; summary?: string }>} uploadQueue
 * @param {Record<string, unknown>} cartLineFiles
 * @returns {number} index of first incomplete line, or -1 if all complete
 */
export function getFirstIncompleteCartUploadIndex(uploadQueue, cartLineFiles) {
  for (let i = 0; i < uploadQueue.length; i++) {
    const line = uploadQueue[i]
    const files = cartLineFiles[line.lineId]
    if (!isCartLineUploadComplete(line, files)) return i
  }
  return -1
}

/**
 * All files for upload lines, in cart snapshot order (for a single order upload).
 * @param {Array<{ lineId: string; slug: string }> | null} cartSnapshot
 * @param {Record<string, Array<{ file: File; previewUrl?: string }>>} cartLineFiles
 */
export function collectCartUploadFiles(cartSnapshot, cartLineFiles) {
  const out = []
  if (!cartSnapshot?.length || !cartLineFiles) return out
  for (const line of cartSnapshot) {
    if (!UPLOAD_PRODUCT_SLUGS.has(line.slug)) continue
    const arr = cartLineFiles[line.lineId] ?? []
    for (const item of arr) {
      if (item?.file instanceof File) out.push(item)
    }
  }
  return out
}

/** Fixed delivery charge (PKR) when customer opts in. */
export const DELIVERY_CHARGE_RS = 400

/**
 * @param {number} unitPrice
 * @param {boolean} includeDelivery
 */
export function getOrderTotalAmount(unitPrice, includeDelivery) {
  const n = typeof unitPrice === 'number' && !Number.isNaN(unitPrice) ? unitPrice : 0
  return n + (includeDelivery ? DELIVERY_CHARGE_RS : 0)
}

/**
 * 50% advance now, 50% on delivery. Uses floor/remainder so amounts sum to full total.
 * @param {number} fullTotal
 * @returns {{ advance: number, balanceOnDelivery: number }}
 */
export function splitAdvancePayment(fullTotal) {
  const n =
    typeof fullTotal === 'number' && !Number.isNaN(fullTotal)
      ? Math.max(0, Math.round(fullTotal))
      : 0
  const advance = Math.floor(n / 2)
  return { advance, balanceOnDelivery: n - advance }
}

/**
 * @param {{
 *   productName: string
 *   selectionLine?: string
 *   unitPrice: number
 *   quantity?: number
 *   includeDelivery?: boolean
 *   customer: { fullName: string; phone: string; city: string; address: string; notes?: string; includeDelivery?: boolean }
 *   imageCount?: number
 *   selectionLine?: string
 *   orderRef?: string | null
 * }} p
 */
export function buildOrderWhatsAppMessage(p) {
  const qty = Math.max(1, Math.min(99, Math.floor(Number(p.quantity) || 1)))
  const unit =
    typeof p.unitPrice === 'number' && !Number.isNaN(p.unitPrice)
      ? p.unitPrice
      : 0
  const subtotal = unit * qty
  const includeDel =
    (p.includeDelivery ?? p.customer.includeDelivery) !== false
  const total = getOrderTotalAmount(subtotal, includeDel)
  const c = p.customer
  const ref =
    p.orderRef && String(p.orderRef).trim()
      ? `\nOrder ref: ${String(p.orderRef).trim()}\n`
      : '\n'
  const sel = p.selectionLine?.trim()
  const productLine =
    sel && sel.length > 0 ? `${p.productName} — ${sel}` : p.productName
  return `Hey socutesy! I've completed the advance payment — below is the ss.${ref}
Product: ${productLine}

Total payment: RS. ${total.toLocaleString()}

Customer details:
Name: ${c.fullName}
Phone: ${c.phone}
City: ${c.city}
Address: ${c.address}`
}

/**
 * Contact-only products (no upload) — short WhatsApp intro.
 * @param {{ productName: string; selectionLine?: string; unitPrice?: number }} p
 */
export function buildContactWhatsAppMessage(p) {
  const price =
    p.unitPrice != null
      ? `\nEstimated price: RS. ${p.unitPrice.toLocaleString()}`
      : ''
  const sel = p.selectionLine?.trim()
  const opt = sel ? `\nOptions: ${sel}` : ''
  return `Hi SoCutesy! I'd like to discuss a custom order for: ${p.productName}${opt}${price}

Please advise on next steps. Thank you!`
}
