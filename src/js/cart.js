// Fly-to-cart: clone the product image (or its placeholder box) and arc it into the header cart.
// The cart itself lives in store.js; this module animates adds and keeps the header counter in sync.
import { gsap } from 'gsap'
import { $, ensureTransformable } from './utils.js'
import { showHeader } from './nav.js'
import { cart } from './store.js'
import { PRODUCTS, MAX_QTY } from '../data/products.js'

let cartBtn = null
let countEl = null
let liveEl = null
let reducedMode = false

export function initCart({ reduced } = {}) {
  reducedMode = !!reduced
  cartBtn = $('[data-cart]')
  countEl = $('[data-cart-n]')
  liveEl = $('[data-cart-live]')
  if (!reducedMode) ensureTransformable([countEl])

  render(false)
  cart.onChange((change) => render(change.type === 'add'))

  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-add]')
    if (!btn) return
    e.preventDefault()
    addToCart(btn)
  })
}

function cartLabel() {
  const n = cart.count()
  return `Cart, ${n} item${n === 1 ? '' : 's'}`
}

function announce(msg) {
  if (!liveEl) return
  liveEl.textContent = ''
  requestAnimationFrame(() => (liveEl.textContent = msg))
}

function addToCart(btn) {
  const id = btn.dataset.id
  const product = PRODUCTS[id]
  if (!product) return
  if (cart.qtyOf(id) >= MAX_QTY) {
    announce(`${product.name}: maximum of ${MAX_QTY} per order.`)
    return
  }
  const commit = () => {
    if (cart.add(id)) announce(`Added ${product.name}. ${cartLabel()}.`)
  }

  if (reducedMode || !cartBtn) return commit()
  const card = btn.closest('.product, .lcard')
  const media = card && $('.product__media, .lcard__media', card)
  if (!media) return commit()
  showHeader()
  fly(media, commit)
}

function makeClone(media) {
  const img = $('img', media)
  const useImg = img && img.isConnected && img.complete && img.naturalWidth > 0
  const src = useImg ? img : media
  const rect = src.getBoundingClientRect()
  const cs = getComputedStyle(src)

  const clone = src.cloneNode(true)
  clone.removeAttribute('id')
  clone.setAttribute('aria-hidden', 'true')
  clone.classList.remove('is-in')
  // Styles scoped to the card won't reach a clone on <body>, so carry the essentials inline.
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    zIndex: '9999',
    pointerEvents: 'none',
    opacity: '1',
    transform: 'none',
    borderRadius: cs.borderRadius,
    overflow: 'hidden',
    willChange: 'transform',
  })
  if (!useImg) {
    clone.style.background = cs.backgroundImage !== 'none' ? cs.background : '#D8CFC1'
    clone.querySelectorAll('img').forEach((n) => n.remove())
  } else {
    clone.style.objectFit = cs.objectFit
  }
  document.body.appendChild(clone)
  return { clone, rect }
}

function cartCentre() {
  const r = cartBtn.getBoundingClientRect()
  // If the header is currently slid up, aim where it will be once shown.
  const header = cartBtn.closest('header')
  const shift = header ? header.getBoundingClientRect().top : 0
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 - Math.min(0, shift) }
}

function fly(media, onLand) {
  const { clone, rect } = makeClone(media)
  const to = cartCentre()
  const dx = to.x - (rect.left + rect.width / 2)
  const dy = to.y - (rect.top + rect.height / 2)

  const d = 0.9
  gsap
    .timeline({
      onComplete: () => {
        clone.remove()
        onLand()
      },
    })
    .set(clone, { transformOrigin: '50% 50%' })
    .to(clone, { x: dx, duration: d, ease: 'power1.inOut' }, 0)
    .to(clone, { y: dy, duration: d, ease: 'back.in(1.6)' }, 0)
    .to(clone, { scale: 0.1, rotation: 28, duration: d, ease: 'power2.in' }, 0)
    .to(clone, { opacity: 0, duration: 0.12, ease: 'none' }, d - 0.12)
}

/** Sync counter + label from the store; `pop` plays the add feedback. */
function render(pop) {
  const n = cart.count()
  if (countEl) countEl.textContent = String(n)
  if (!cartBtn) return
  cartBtn.classList.toggle('has-items', n > 0)
  cartBtn.setAttribute('aria-label', cartLabel())
  if (!pop || reducedMode) return

  if (countEl) {
    gsap.fromTo(countEl, { scale: 1.8 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, .4)', overwrite: 'auto' })
  }
  const svg = $('svg', cartBtn)
  if (svg) {
    gsap.fromTo(
      svg,
      { rotation: -14, transformOrigin: '50% 60%' },
      { rotation: 0, duration: 1, ease: 'elastic.out(1.2, .35)', overwrite: 'auto' },
    )
  }
}
