import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

/**
 * @typedef {{ file: File; previewUrl: string }} OrderFile
 * @typedef {{
 *   lineId: string
 *   productId: string
 *   name: string
 *   slug: string
 *   unitPrice: number
 *   summary: string
 *   qty: number
 * }} CartLineSnapshot
 * @typedef {{
 *   fullName: string
 *   phone: string
 *   city: string
 *   address: string
 *   notes: string
 *   includeDelivery: boolean
 * }} CustomerData
 */

const OrderFlowContext = createContext(null)

export function OrderFlowProvider({ children }) {
  /** 'product' = single product order; 'cart' = cart checkout snapshot */
  const [checkoutSource, setCheckoutSource] = useState('product')
  /** Set when checkoutSource === 'cart' (copy of cart lines at checkout start) */
  const [cartSnapshot, setCartSnapshot] = useState(null)
  const [slug, setSlug] = useState(null)
  const [productName, setProductName] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  /** Units ordered (line quantity); subtotal = unitPrice × orderQty */
  const [orderQty, setOrderQty] = useState(1)
  const [selectionSummary, setSelectionSummary] = useState('')
  /** Exact photo count when set from product page (e.g. KeepSake layout). */
  const [requiredUploadCount, setRequiredUploadCount] = useState(null)
  /** @type {[OrderFile[], function]} */
  const [files, setFiles] = useState([])
  /** @type {[CustomerData | null, function]} */
  const [customer, setCustomer] = useState(null)
  /** Set after order + uploads are persisted on the server (short order ref). */
  const [serverOrderId, setServerOrderId] = useState(null)
  /** Per cart line (lineId) — photos for multi-item checkout. */
  const [cartLineFiles, setCartLineFiles] = useState({})

  const revokeCartLineFiles = useCallback((prev) => {
    for (const arr of Object.values(prev)) {
      arr?.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    }
  }, [])

  const clearOrder = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.previewUrl))
      return []
    })
    setCartLineFiles((prev) => {
      revokeCartLineFiles(prev)
      return {}
    })
    setCheckoutSource('product')
    setCartSnapshot(null)
    setSlug(null)
    setProductName('')
    setUnitPrice(0)
    setOrderQty(1)
    setSelectionSummary('')
    setRequiredUploadCount(null)
    setCustomer(null)
    setServerOrderId(null)
  }, [revokeCartLineFiles])

  const setCheckoutFromCart = useCallback((items) => {
    if (!items?.length) return
    const snapshot = items.map((i) => ({ ...i }))
    const subtotal = snapshot.reduce((s, i) => s + i.unitPrice * i.qty, 0)
    const nameLine = snapshot.map((i) => i.name).join(', ')
    setCartLineFiles((prev) => {
      revokeCartLineFiles(prev)
      return {}
    })
    setCheckoutSource('cart')
    setCartSnapshot(snapshot)
    setSlug('checkout')
    setProductName(nameLine)
    setUnitPrice(subtotal)
    setOrderQty(1)
    setSelectionSummary(
      snapshot.map((i) => `${i.name} ×${i.qty}`).join('; '),
    )
    setRequiredUploadCount(null)
  }, [revokeCartLineFiles])

  const setOrderMeta = useCallback(
    ({
      slug: s,
      name,
      price,
      summary,
      quantity,
      requiredUploadCount: exactPhotos,
    }) => {
      setCheckoutSource('product')
      setCartSnapshot(null)
      setCartLineFiles((prev) => {
        revokeCartLineFiles(prev)
        return {}
      })
      setServerOrderId(null)
      setSlug(s)
      setProductName(name ?? '')
      setUnitPrice(typeof price === 'number' ? price : 0)
      setSelectionSummary(summary ?? '')
      setRequiredUploadCount(
        typeof exactPhotos === 'number' && exactPhotos > 0 ? exactPhotos : null,
      )
      const q = Math.max(1, Math.min(99, Math.floor(Number(quantity)) || 1))
      setOrderQty(q)
    },
    [revokeCartLineFiles],
  )

  const addCartLineFiles = useCallback((lineId, fileList) => {
    const incoming = Array.from(fileList ?? [])
    if (!lineId || !incoming.length) return
    setCartLineFiles((prev) => {
      const existing = prev[lineId] ?? []
      const added = incoming.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))
      return { ...prev, [lineId]: [...existing, ...added] }
    })
  }, [])

  const removeCartLineFileAt = useCallback((lineId, index) => {
    setCartLineFiles((prev) => {
      const arr = [...(prev[lineId] ?? [])]
      const [removed] = arr.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return { ...prev, [lineId]: arr }
    })
  }, [])

  const clearCartLineFiles = useCallback((lineId) => {
    setCartLineFiles((prev) => {
      const arr = prev[lineId]
      if (arr) arr.forEach((f) => URL.revokeObjectURL(f.previewUrl))
      const next = { ...prev }
      delete next[lineId]
      return next
    })
  }, [])

  const clearFiles = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.previewUrl))
      return []
    })
  }, [])

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList ?? [])
    setFiles((prev) => {
      const added = incoming.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))
      return [...prev, ...added]
    })
  }, [])

  const removeFileAt = useCallback((index) => {
    setFiles((prev) => {
      const copy = [...prev]
      const [removed] = copy.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return copy
    })
  }, [])

  const value = useMemo(
    () => ({
      checkoutSource,
      cartSnapshot,
      slug,
      productName,
      unitPrice,
      orderQty,
      selectionSummary,
      requiredUploadCount,
      files,
      cartLineFiles,
      customer,
      serverOrderId,
      setCheckoutFromCart,
      setOrderMeta,
      clearFiles,
      addFiles,
      removeFileAt,
      addCartLineFiles,
      removeCartLineFileAt,
      clearCartLineFiles,
      setCustomer,
      setServerOrderId,
      clearOrder,
    }),
    [
      checkoutSource,
      cartSnapshot,
      slug,
      productName,
      unitPrice,
      orderQty,
      selectionSummary,
      requiredUploadCount,
      files,
      cartLineFiles,
      customer,
      serverOrderId,
      setCheckoutFromCart,
      setOrderMeta,
      clearFiles,
      addFiles,
      removeFileAt,
      addCartLineFiles,
      removeCartLineFileAt,
      clearCartLineFiles,
      setCustomer,
      clearOrder,
    ],
  )

  return (
    <OrderFlowContext.Provider value={value}>
      {children}
    </OrderFlowContext.Provider>
  )
}

export function useOrderFlow() {
  const ctx = useContext(OrderFlowContext)
  if (!ctx) {
    throw new Error('useOrderFlow must be used within OrderFlowProvider')
  }
  return ctx
}
