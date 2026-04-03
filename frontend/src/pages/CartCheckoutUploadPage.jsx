import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  getCartLinesRequiringUpload,
  getRequiredUploadCountForLine,
  getFirstIncompleteCartUploadIndex,
} from '../utils/orderFlow'
import { useOrderFlow } from '../context/OrderFlowContext'

export default function CartCheckoutUploadPage() {
  const { uploadIndex } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    checkoutSource,
    cartSnapshot,
    setCheckoutFromCart,
    cartLineFiles,
    addCartLineFiles,
    removeCartLineFileAt,
    clearCartLineFiles,
  } = useOrderFlow()
  const [pickHint, setPickHint] = useState(null)

  useEffect(() => {
    const items = location.state?.cartItems
    if (Array.isArray(items) && items.length && checkoutSource !== 'cart') {
      setCheckoutFromCart(items)
    }
  }, [location.state, checkoutSource, setCheckoutFromCart])

  useEffect(() => {
    if (checkoutSource !== 'cart' || !cartSnapshot?.length) {
      navigate('/', { replace: true })
    }
  }, [checkoutSource, cartSnapshot, navigate])

  const uploadQueue = useMemo(
    () => getCartLinesRequiringUpload(cartSnapshot ?? []),
    [cartSnapshot],
  )
  const idxRaw = Number.parseInt(uploadIndex ?? '0', 10)
  const idx = Number.isFinite(idxRaw) && idxRaw >= 0 ? idxRaw : 0
  const currentLine =
    idx >= 0 && idx < uploadQueue.length ? uploadQueue[idx] : null

  useEffect(() => {
    if (!cartSnapshot?.length) return
    if (uploadQueue.length === 0) {
      navigate('/checkout/customer', { replace: true })
      return
    }
    if (idx < 0 || idx >= uploadQueue.length) {
      navigate('/checkout/upload/0', { replace: true })
      return
    }
    const incomplete = getFirstIncompleteCartUploadIndex(
      uploadQueue,
      cartLineFiles,
    )
    if (incomplete >= 0 && incomplete < idx) {
      navigate(`/checkout/upload/${incomplete}`, { replace: true })
    }
  }, [cartSnapshot, uploadQueue, cartLineFiles, idx, navigate])

  if (
    checkoutSource !== 'cart' ||
    !cartSnapshot?.length ||
    uploadQueue.length === 0 ||
    !currentLine
  ) {
    return null
  }

  const lineId = currentLine.lineId
  const files = cartLineFiles[lineId] ?? []
  const requiredCount = getRequiredUploadCountForLine(currentLine)
  const atPhotoLimit = requiredCount != null && files.length >= requiredCount
  const canContinue =
    requiredCount != null
      ? files.length === requiredCount
      : files.length > 0

  const onPick = (e) => {
    setPickHint(null)
    const list = e.target.files
    if (!list?.length) return
    let incoming = Array.from(list)
    if (requiredCount != null) {
      const space = requiredCount - files.length
      if (space <= 0) {
        setPickHint(
          `This product needs exactly ${requiredCount} pictures — remove one to add a different photo.`,
        )
        e.target.value = ''
        return
      }
      if (incoming.length > space) {
        incoming = incoming.slice(0, space)
        setPickHint(
          `Only ${requiredCount} photos are needed. Extra files were not added.`,
        )
      }
    }
    addCartLineFiles(lineId, incoming)
    e.target.value = ''
  }

  const onContinue = () => {
    if (!canContinue) return
    if (idx < uploadQueue.length - 1) {
      navigate(`/checkout/upload/${idx + 1}`)
      return
    }
    navigate('/checkout/customer')
  }

  const stepLabel = `Step ${idx + 1} of ${uploadQueue.length}`
  const backTo =
    idx > 0 ? `/checkout/upload/${idx - 1}` : '/'

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <Link
        to={backTo}
        className="mb-6 inline-flex text-sm font-medium text-[#9d174d] hover:text-[#831843]"
      >
        {idx > 0 ? '← Previous upload' : '← Back to shop'}
      </Link>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#be185d]">
        {stepLabel} · Cart checkout
      </p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-[#fce7f3] bg-[#fffafc] p-6 shadow-inner shadow-pink-100/40 sm:p-8"
      >
        <h1 className="font-semibold text-2xl text-[#831843] sm:text-3xl">
          Upload photos for {currentLine.name}
        </h1>
        {currentLine.qty > 1 && (
          <p className="mt-1 text-xs text-[#6b7280]">
            Line quantity ×{currentLine.qty} — one set of photos for this line.
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
          {requiredCount != null ? (
            <>
              Upload exactly{' '}
              <span className="font-semibold text-[#9d174d]">{requiredCount}</span>{' '}
              photos for this item. Not more, not less — you can swap photos by
              removing one first.
            </>
          ) : (
            <>
              Add the images we should use for{' '}
              <span className="font-medium text-[#9d174d]">{currentLine.name}</span>
              {currentLine.summary ? (
                <>
                  {' '}
                  <span className="text-[#9ca3af]">({currentLine.summary})</span>
                </>
              ) : null}
              .
            </>
          )}
        </p>

        {pickHint && (
          <p
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            {pickHint}
          </p>
        )}

        <div className="mt-6">
          <label
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#fbcfe8] bg-white px-6 py-10 transition hover:border-[#f9a8d4] hover:bg-[#fdf2f8] ${
              atPhotoLimit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            <span className="mt-2 text-sm font-semibold text-[#831843]">
              {atPhotoLimit ? 'Photo limit reached' : 'Tap to upload images'}
            </span>
            <span className="mt-1 text-xs text-[#9ca3af]">
              {requiredCount != null
                ? `PNG, JPG — add up to ${requiredCount} images total`
                : 'PNG, JPG — multiple files supported'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={atPhotoLimit}
              onChange={onPick}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#be185d]">
              Preview (
              {requiredCount != null
                ? `${files.length} / ${requiredCount}`
                : files.length}
              )
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((item, i) => (
                <li
                  key={item.previewUrl}
                  className="relative overflow-hidden rounded-2xl border border-[#fce7f3] bg-white shadow-sm"
                >
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeCartLineFileAt(lineId, i)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-sm font-bold text-white transition hover:bg-black/70"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => clearCartLineFiles(lineId)}
              className="mt-3 text-xs font-medium text-[#db2777] underline hover:text-[#be185d]"
            >
              Clear all for this item
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/"
            className="rounded-2xl border border-[#fbcfe8] bg-white px-6 py-3 text-center text-sm font-semibold text-[#db2777] transition hover:bg-[#fdf2f8]"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="rounded-2xl bg-gradient-to-r from-[#f472b6] to-[#ec4899] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-300/40 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {idx < uploadQueue.length - 1 ? 'Next item' : 'Continue to details'}
          </button>
        </div>
      </motion.div>
    </main>
  )
}
