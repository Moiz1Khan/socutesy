import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GiftIcon } from './GiftIcon'
import { IconSearch, IconSliders, IconCart } from './icons'
import { useCart } from '../context/CartContext'
import { useShop } from '../context/ShopContext'
import { categories } from '../utils/products'
import { getCartLinesRequiringUpload } from '../utils/orderFlow'
import { useOrderFlow } from '../context/OrderFlowContext'

export function ShopHeader() {
  const { count } = useCart()
  const {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  } = useShop()
  const [cartOpen, setCartOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5 lg:px-6">
        <Link
          to="/"
          className="inline-flex max-w-[min(100%,11rem)] shrink-0 items-center gap-2 rounded-xl bg-[#fdeef4] px-2.5 py-1.5 shadow-sm transition hover:opacity-95 sm:max-w-none sm:gap-2.5 sm:rounded-2xl sm:px-3 sm:py-2"
        >
          <GiftIcon className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          <div className="min-w-0 leading-none">
            <p className="font-logo-wordmark text-lg lowercase leading-tight sm:text-xl md:text-2xl">
              socutesy
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#c49aa8] sm:text-[10px] sm:tracking-[0.35em]">
              GIFT SHOP
            </p>
          </div>
        </Link>

        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search products</span>
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af] sm:left-3" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full min-w-0 rounded-lg border border-[#e5e7eb] bg-white py-2 pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#ff8fa3] focus:outline-none focus:ring-2 focus:ring-[#ff8fa3]/30 sm:rounded-xl sm:py-2.5 sm:pl-10 sm:pr-4"
          />
        </label>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#374151] transition hover:bg-[#f9fafb] sm:h-11 sm:w-11 sm:rounded-xl"
              aria-expanded={filterOpen}
              aria-label="Filter categories"
            >
              <IconSliders className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-[#e5e7eb] bg-white py-2 shadow-lg"
                >
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#f3f4f6]"
                    onClick={() => {
                      setCategoryFilter(null)
                      setFilterOpen(false)
                    }}
                  >
                    All categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#f3f4f6]"
                      onClick={() => {
                        setCategoryFilter(c.id)
                        setFilterOpen(false)
                        document.getElementById(`section-${c.id}`)?.scrollIntoView({
                          behavior: 'smooth',
                        })
                      }}
                    >
                      {c.title}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen((o) => !o)}
            className="relative flex h-10 items-center gap-1.5 rounded-lg bg-[#ff8fa3] px-2.5 font-semibold text-white shadow-sm transition hover:bg-[#ff7a91] sm:h-11 sm:gap-2 sm:rounded-xl sm:px-4"
          >
            <IconCart className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#111827] px-1 text-[10px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        </div>
      </div>

      <CartPopover open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  )
}

function CartPopover({ open, onClose }) {
  const navigate = useNavigate()
  const { setCheckoutFromCart } = useOrderFlow()
  const { items, removeLine, updateLineQty } = useCart()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            aria-label="Close cart"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed right-3 top-[calc(3.5rem+env(safe-area-inset-top))] z-50 max-h-[70vh] w-[min(100vw-1.5rem,22rem)] overflow-auto rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl sm:right-6 sm:top-[calc(4rem+env(safe-area-inset-top))]"
          >
            <p className="font-semibold text-[#111827]">Your cart</p>
            {items.length === 0 ? (
              <p className="mt-4 text-sm text-[#6b7280]">No items yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {items.map((line) => (
                  <li
                    key={line.lineId}
                    className="flex items-start justify-between gap-2 border-b border-[#f3f4f6] pb-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#111827]">{line.name}</p>
                      <p className="text-[#6b7280]">{line.summary}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[#6b7280]">Qty</span>
                        <div className="inline-flex items-center rounded-lg border border-[#e5e7eb] bg-white">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="px-2 py-1 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40"
                            disabled={line.qty <= 1}
                            onClick={() => updateLineQty(line.lineId, -1)}
                          >
                            −
                          </button>
                          <span className="min-w-[1.5rem] px-1 text-center text-sm font-semibold tabular-nums text-[#111827]">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="px-2 py-1 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40"
                            disabled={line.qty >= 99}
                            onClick={() => updateLineQty(line.lineId, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-[#6b7280]">
                        RS. {line.unitPrice.toLocaleString()} × {line.qty} ={' '}
                        <span className="font-semibold tabular-nums text-[#831843]">
                          RS. {(line.unitPrice * line.qty).toLocaleString()}
                        </span>
                      </p>
                      <Link
                        to={`/product/${line.slug}`}
                        className="text-xs font-medium text-[#ff8fa3]"
                        onClick={onClose}
                      >
                        View product
                      </Link>
                      <Link
                        to={`/customize/${line.slug}`}
                        className="ml-2 text-xs font-medium text-[#ff8fa3]"
                        onClick={onClose}
                      >
                        Customize
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-[#9ca3af] hover:text-[#ef4444]"
                      onClick={() => removeLine(line.lineId)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={items.length === 0}
              className="mt-4 w-full rounded-xl bg-[#ff8fa3] py-3 text-sm font-semibold text-white hover:bg-[#ff7a91] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (items.length === 0) return
                setCheckoutFromCart(items)
                const needUpload = getCartLinesRequiringUpload(items)
                if (needUpload.length > 0) {
                  navigate('/checkout/upload/0', { state: { cartItems: items } })
                } else {
                  navigate('/checkout/customer', {
                    state: { cartItems: items },
                  })
                }
                onClose()
              }}
            >
              Checkout
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
