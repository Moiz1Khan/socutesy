/**
 * Must match frontend getRequiredUploadCount (orderFlow.js).
 * @param {string | null | undefined} slug
 * @param {string | null | undefined} selectionSummary
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
