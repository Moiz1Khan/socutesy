/**
 * Dynamic price helpers for products with fixed price, flat variants, or paper + sides options.
 */

function emptyKeepsakeCustomization(layout) {
  const o = {}
  for (const f of layout?.textFields ?? []) {
    o[f.key] = ''
  }
  return o
}

export function isKeepsakeCustomizationComplete(product, selection) {
  if (selection.kind !== 'keepsake') return true
  const layout = product.frameLayouts?.[selection.layoutIndex]
  if (!layout) return false
  for (const f of layout.textFields ?? []) {
    if (!selection.customization[f.key]?.trim()) return false
  }
  return true
}

export function getMinPrice(product) {
  if (product.price != null) return product.price
  if (product.options?.length) {
    let min = Infinity
    for (const g of product.options) {
      for (const v of g.variants) {
        min = Math.min(min, v.price)
      }
    }
    return Number.isFinite(min) ? min : 0
  }
  if (product.variants?.length) {
    return Math.min(...product.variants.map((v) => v.price))
  }
  return 0
}

/**
 * @returns {{ kind: 'simple' } | { kind: 'options', paperIndex: number, sideIndex: number } | { kind: 'variants', index: number } | { kind: 'keepsake', sizeIndex: number, layoutIndex: number, customization: Record<string, string> }}
 */
export function defaultSelection(product) {
  if (
    product.frameLayouts?.length &&
    product.variants?.length
  ) {
    const layout = product.frameLayouts[0]
    return {
      kind: 'keepsake',
      sizeIndex: 0,
      layoutIndex: 0,
      customization: emptyKeepsakeCustomization(layout),
    }
  }
  if (product.price != null) return { kind: 'simple' }
  if (product.options?.length) {
    return { kind: 'options', paperIndex: 0, sideIndex: 0 }
  }
  if (product.variants?.length) {
    return { kind: 'variants', index: 0 }
  }
  return { kind: 'simple' }
}

export function getPrice(product, selection) {
  if (product.price != null) return product.price
  if (selection.kind === 'keepsake') {
    const v = product.variants?.[selection.sizeIndex]
    return v?.price ?? 0
  }
  if (selection.kind === 'options') {
    const g = product.options[selection.paperIndex]
    if (!g) return 0
    const v = g.variants[selection.sideIndex]
    return v?.price ?? 0
  }
  if (selection.kind === 'variants') {
    const v = product.variants[selection.index]
    return v?.price ?? 0
  }
  return 0
}

export function getSelectionSummary(product, selection) {
  if (selection.kind === 'simple') return 'Standard'
  if (selection.kind === 'keepsake') {
    const size = product.variants?.[selection.sizeIndex]
    const layout = product.frameLayouts?.[selection.layoutIndex]
    const sizeLabel = size?.size ? `Size ${size.size}` : ''
    const layoutPart = layout
      ? `${layout.name} (${layout.photoCount} photos)`
      : ''
    const head = [sizeLabel, layoutPart].filter(Boolean).join(' · ')
    const textLines = []
    for (const field of layout?.textFields ?? []) {
      const val = selection.customization[field.key]?.trim()
      if (val) textLines.push(`${field.label}: ${val}`)
    }
    return [head, ...textLines].join('\n')
  }
  if (selection.kind === 'options') {
    const g = product.options[selection.paperIndex]
    const v = g?.variants[selection.sideIndex]
    if (!g || !v) return ''
    return `${g.type} · ${v.sides} sides`
  }
  if (selection.kind === 'variants') {
    const v = product.variants[selection.index]
    if (!v) return ''
    if (v.label) return v.label
    if (v.size) return `Size ${v.size}`
    if (v.sides != null) return `${v.sides} sides`
    return 'Selected'
  }
  return ''
}

/** Normalize side index when paper type changes (all groups have same side counts in our catalog). */
export function clampSideIndex(product, paperIndex, sideIndex) {
  const g = product.options?.[paperIndex]
  if (!g?.variants?.length) return 0
  const max = g.variants.length - 1
  return Math.min(Math.max(0, sideIndex), max)
}
