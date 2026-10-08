// Cart drawer: list, quantity editing, subtotal, focus trap and slide-in motion.
import { gsap } from 'gsap'
import { $, $$ } from './utils.js'
import { cart } from './store.js'
import { PRODUCTS, MAX_QTY, formatPrice } from '../data/products.js'
import { lockScroll, unlockScroll } from './scroll.js'
import { closeMenu } from './nav.js'

let drawer = null
let panel = null
let scrim = null
let list = null
let empty = null
let foot = null
let subtotalEl = null
let closeBtn = null
let opener = null
let isOpen = false
let reducedMode = false
let tl = null

export function initDrawer({ reduced } = {}) {
  drawer = $('[data-drawer]')
  if (!drawer) return
  reducedMode = !!reduced
  panel = $('.drawer__panel', drawer)
  scrim = $('.drawer__scrim', drawer)
  list = $('.drawer__list', drawer)
  empty = $('.drawer__empty', drawer)
  foot = $('.drawer__foot', drawer)
  subtotalEl = $('[data-drawer-subtotal]', drawer)
  closeBtn = $('.drawer__close', drawer)

  render()
  cart.onChange(render)

  const cartBtn = $('[data-cart]')
  if (cartBtn) cartBtn.addEventListener('click', () => openDrawer())
  $$('[data-drawer-close]', drawer).forEach((el) => el.addEventListener('click', closeDrawer))
  drawer.addEventListener('keydown', onKey)
  list.addEventListener('click', onListClick)
}

/** True when the URL asked for the drawer (`?cart=open`); strips the param. */
export function consumeCartParam() {
  const params = new URLSearchParams(location.search)
  if (params.get('cart') !== 'open') return false
  params.delete('cart')
  const qs = params.toString()
  try {
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash)
  } catch {
    /* sandboxed */
  }
  return true
}

/* ---------- render ---------- */

function row({ id, qty }) {
  const p = PRODUCTS[id]
  const li = document.createElement('li')
  li.className = 'drawer__item'
  li.dataset.id = id
  li.innerHTML = `
    <img class="drawer__thumb" src="${p.image}" alt="" width="72" height="72" loading="lazy" decoding="async">
    <div class="drawer__info">
      <p class="drawer__name">${p.name}</p>
      <p class="drawer__unit">${formatPrice(p.price)}</p>
      <div class="qty" role="group" aria-label="Quantity for ${p.name}">
        <button class="qty__btn" type="button" data-step="-1" aria-label="Decrease quantity of ${p.name}"${qty <= 1 ? ' disabled' : ''}>−</button>
        <span class="qty__n">${qty}</span>
        <button class="qty__btn" type="button" data-step="1" aria-label="Increase quantity of ${p.name}"${qty >= MAX_QTY ? ' disabled' : ''}>+</button>
      </div>
    </div>
    <div class="drawer__end">
      <p class="drawer__line">${formatPrice(p.price * qty)}</p>
      <button class="drawer__remove" type="button" data-remove>Remove<span class="sr"> ${p.name}</span></button>
    </div>`
  return li
}

function render() {
  if (!list) return
  const items = cart.getItems()
  list.replaceChildren(...items.map(row))
  const has = items.length > 0
  list.hidden = !has
  foot.hidden = !has
  empty.hidden = has
  subtotalEl.textContent = formatPrice(cart.subtotal())
}

/* ---------- editing ---------- */

function onListClick(e) {
  const btn = e.target.closest('button')
  const item = btn && btn.closest('.drawer__item')
  if (!item) return
  const id = item.dataset.id

  if (btn.hasAttribute('data-remove')) {
    const next = item.nextElementSibling || item.previousElementSibling
    const nextId = next && next.dataset.id
    cart.remove(id)
    const target = nextId && $(`.drawer__item[data-id="${nextId}"] [data-remove]`, list)
    ;(target || (empty.hidden ? closeBtn : $('button', empty))).focus()
    return
  }

  const step = Number(btn.dataset.step)
  if (!step) return
  cart.setQty(id, cart.qtyOf(id) + step)
  // render() replaced the row; put focus back on the same control (or its sibling if now disabled).
  const fresh = $(`.drawer__item[data-id="${id}"]`, list)
  if (!fresh) return
  const same = $(`[data-step="${step}"]`, fresh)
  ;(same && !same.disabled ? same : $(`[data-step="${-step}"]`, fresh)).focus()
}

/* ---------- open / close ---------- */

function focusables() {
  return $$('a[href], button:not([disabled])', panel).filter((el) => !el.closest('[hidden]'))
}

function onKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    closeDrawer()
    return
  }
  if (e.key !== 'Tab') return
  const f = focusables()
  if (!f.length) return
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

export function openDrawer() {
  if (!drawer || isOpen) return
  isOpen = true
  closeMenu()
  opener = document.activeElement
  drawer.hidden = false
  lockScroll('drawer')
  if (tl) tl.kill()

  if (!reducedMode) {
    const rows = $$('.drawer__item', list)
    tl = gsap
      .timeline()
      .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.7, ease: 'power3.out' }, 0)
    if (rows.length) {
      tl.fromTo(
        rows,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, clearProps: 'transform,opacity' },
        0.2,
      )
    }
  }
  closeBtn.focus({ preventScroll: true })
}

export function closeDrawer() {
  if (!drawer || !isOpen) return
  isOpen = false
  const done = () => {
    drawer.hidden = true
    unlockScroll('drawer')
    if (opener && opener.isConnected && opener.focus) opener.focus({ preventScroll: true })
  }
  if (tl) tl.kill()
  if (reducedMode) return done()
  tl = gsap
    .timeline({ onComplete: done })
    .to(panel, { xPercent: 100, duration: 0.45, ease: 'power3.in' }, 0)
    .to(scrim, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.1)
}
