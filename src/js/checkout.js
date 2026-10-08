// Checkout: views (empty / form / done), order summary, Stripe Payment Element and return handling.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { loadStripe } from '@stripe/stripe-js'
import { $, $$ } from './utils.js'
import { cart } from './store.js'
import { PRODUCTS, formatPrice } from '../data/products.js'
import { COUNTRIES, validate, toShipping, orderRef, resultView } from './checkout-form.js'

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
const SNAPSHOT_KEY = 'kvist-last-order'

const APPEARANCE = {
  theme: 'flat',
  variables: {
    colorPrimary: '#2B3A31',
    colorBackground: '#F7F4EE',
    colorText: '#1C211D',
    colorTextSecondary: '#676C63',
    colorDanger: '#B23B2E',
    fontFamily: '"Instrument Sans", system-ui, sans-serif',
    fontSizeBase: '16px',
    borderRadius: '14px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #1C211D38', boxShadow: 'none', padding: '14px 16px' },
    '.Input:focus': { borderColor: '#2B3A31', boxShadow: '0 0 0 2px #B5683C55' },
    '.Input--invalid': { borderColor: '#B23B2E' },
    '.Label': {
      fontFamily: '"DM Mono", ui-monospace, monospace',
      fontSize: '12px',
      fontWeight: '500',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#676C63',
    },
    '.Tab': { border: '1px solid #1C211D38', boxShadow: 'none' },
    '.Tab--selected': { borderColor: '#2B3A31', boxShadow: '0 0 0 1px #2B3A31' },
  },
}
const FONTS = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap' },
]

let page = null
let form = null
let payBtn = null
let payLabel = null
let payError = null
let reducedMode = false
let current = null

let stripe = null
let elements = null
let paymentEl = null
let intentAmount = 0
let intentToken = 0
let busy = false
let ready = false
let refreshTimer = 0

export async function initCheckout({ reduced } = {}) {
  page = $('[data-checkout]')
  if (!page) return
  reducedMode = !!reduced
  form = $('[data-form]', page)
  payBtn = $('[data-pay]', page)
  payLabel = $('[data-pay-label]', page)
  payError = $('[data-pay-error]', page)

  fillCountries()
  bindForm()
  setupSummaryToggle()
  cart.onChange(onCartChange)

  const params = new URLSearchParams(location.search)
  const returned = params.get('payment_intent_client_secret')
  if (returned) return handleReturn(returned)

  startForm()
}

/* ---------- views ---------- */

function show(name) {
  if (current === name) return
  current = name
  $$('[data-view]', page).forEach((v) => (v.hidden = v.dataset.view !== name))
  reveal($(`[data-view="${name}"]`, page))
  ScrollTrigger.refresh()
}

function reveal(view) {
  if (!view || reducedMode) return
  const lines = $$('.co__h .line > span', view)
  const blocks = $$('[data-rise]', view)
  gsap.fromTo(
    lines,
    { yPercent: 110, rotation: 2, transformOrigin: '0% 100%' },
    { yPercent: 0, rotation: 0, duration: 1.1, ease: 'power4.out', stagger: 0.1 },
  )
  gsap.fromTo(
    blocks,
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.15, clearProps: 'transform,opacity' },
  )
}

function startForm({ notice, values } = {}) {
  if (!cart.count()) return show('empty')
  show('form')
  renderSummary()
  if (values) prefill(values)
  if (notice) showPayError(notice)

  if (!PK) return showNotice('Stripe isn’t configured yet. Add your test keys to .env and restart the dev server.')
  if (!PK.startsWith('pk_test_')) return showNotice('Sandbox only: use a Stripe test publishable key (pk_test_…).')
  setupPayment()
}

function onCartChange() {
  if (current === 'done') return
  if (!cart.count()) return show('empty')
  if (current === 'empty' || current === null) return startForm()
  renderSummary()
  // The amount changed: re-create the PaymentIntent once the edits settle.
  clearTimeout(refreshTimer)
  if (PK.startsWith('pk_test_')) refreshTimer = setTimeout(setupPayment, 300)
}

/* ---------- summary ---------- */

function summaryRow({ id, qty }) {
  const p = PRODUCTS[id]
  const li = document.createElement('li')
  li.className = 'co__item'
  li.innerHTML = `
    <div class="co__thumb"><img src="${p.image}" alt="" width="64" height="64" loading="lazy" decoding="async"><span class="co__qty" aria-hidden="true">${qty}</span></div>
    <p class="co__iname">${p.name}<span class="sr">, quantity ${qty}</span></p>
    <p class="co__iprice">${formatPrice(p.price * qty)}</p>`
  return li
}

function renderSummary() {
  const items = cart.getItems()
  $('[data-sum-items]', page).replaceChildren(...items.map(summaryRow))
  const total = formatPrice(cart.subtotal())
  $('[data-sum-subtotal]', page).textContent = total
  $('[data-sum-total]', page).textContent = total
  $('[data-sum-short]', page).textContent = total
  updatePayLabel()
}

function setupSummaryToggle() {
  const box = $('[data-summary]', page)
  if (!box) return
  const narrow = window.matchMedia('(max-width: 899px)')
  const sync = () => (box.open = !narrow.matches)
  sync()
  narrow.addEventListener('change', sync)
  // On wide screens the summary is always open.
  $('summary', box).addEventListener('click', (e) => {
    if (!narrow.matches) e.preventDefault()
  })
}

/* ---------- form ---------- */

function fillCountries() {
  const select = $('#f-country', page)
  if (!select) return
  select.replaceChildren(
    ...COUNTRIES.map((c) => {
      const o = document.createElement('option')
      o.value = c.code
      o.textContent = c.name
      return o
    }),
  )
}

function readValues() {
  return Object.fromEntries(new FormData(form))
}

function prefill(values) {
  for (const [k, v] of Object.entries(values)) {
    const input = form.elements.namedItem(k)
    if (input && typeof v === 'string') input.value = v
  }
}

function setFieldError(name, message) {
  const input = form.elements.namedItem(name)
  const err = $(`#e-${name}`, form)
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false')
  if (err) err.textContent = message || ''
}

function bindForm() {
  if (!form) return
  form.addEventListener('submit', onSubmit)
  // Once a field has been flagged, re-check it as the user fixes it.
  form.addEventListener('input', (e) => {
    const name = e.target.name
    if (!name || e.target.getAttribute('aria-invalid') !== 'true') return
    setFieldError(name, validate(readValues())[name])
  })
  const retry = $('[data-pay-retry]', page)
  if (retry) retry.addEventListener('click', setupPayment)
}

/* ---------- payment ---------- */

function updatePayLabel() {
  if (!payLabel) return
  const amount = ready && intentAmount ? intentAmount : cart.subtotal()
  payLabel.textContent = busy ? 'Processing…' : `Pay ${formatPrice(amount)}`
}

function setBusy(on) {
  busy = on
  payBtn.classList.toggle('is-busy', on)
  payBtn.disabled = on || !ready
  updatePayLabel()
}

function setReady(on) {
  ready = on
  payBtn.disabled = busy || !on
  updatePayLabel()
}

function showNotice(text, { retry = false } = {}) {
  const box = $('[data-pay-notice]', page)
  $('[data-pay-notice-text]', box).textContent = text
  $('[data-pay-retry]', box).hidden = !retry
  box.hidden = false
  setReady(false)
}

function hideNotice() {
  $('[data-pay-notice]', page).hidden = true
}

function showPayError(text) {
  payError.textContent = text || ''
}

async function createIntent(items) {
  const res = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  let data = {}
  try {
    data = await res.json()
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok || !data.clientSecret) throw new Error(data.error || `Payment setup failed (${res.status})`)
  return data
}

async function setupPayment() {
  const token = ++intentToken
  setReady(false)
  hideNotice()
  try {
    stripe = stripe || (await loadStripe(PK))
    if (!stripe) throw new Error('Stripe.js could not load. Check your connection.')
    const { clientSecret, amount } = await createIntent(cart.getItems())
    if (token !== intentToken) return // a newer cart change superseded this one

    if (paymentEl) paymentEl.destroy()
    elements = stripe.elements({ clientSecret, appearance: APPEARANCE, fonts: FONTS })
    paymentEl = elements.create('payment', { layout: 'tabs' })
    paymentEl.on('ready', () => {
      if (token === intentToken) setReady(true)
    })
    paymentEl.mount('#payment-element')
    intentAmount = amount
    updatePayLabel()
  } catch (err) {
    if (token !== intentToken) return
    showNotice(err.message || 'Payment setup failed.', { retry: true })
  }
}

function saveSnapshot() {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ items: cart.getItems(), values: readValues() }))
  } catch {
    /* ignore */
  }
}

function readSnapshot() {
  try {
    return JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || 'null')
  } catch {
    return null
  }
}

async function onSubmit(e) {
  e.preventDefault()
  if (busy || !ready) return
  showPayError('')

  const values = readValues()
  const errors = validate(values)
  Object.keys(Object.fromEntries(new FormData(form))).forEach((k) => setFieldError(k, errors[k]))
  const firstBad = Object.keys(errors)[0]
  if (firstBad) {
    form.elements.namedItem(firstBad).focus()
    return
  }

  setBusy(true)
  saveSnapshot()
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${location.origin}${location.pathname}`,
      receipt_email: values.email.trim(),
      shipping: toShipping(values),
    },
  })
  // Only reached when confirmation fails before a redirect.
  setBusy(false)
  const userFacing =
    error &&
    (error.type === 'card_error' ||
      error.type === 'validation_error' ||
      error.code === 'payment_intent_authentication_failure')
  showPayError(userFacing ? error.message : 'Something went wrong with the payment. Please try again.')
}

/* ---------- return from Stripe ---------- */

async function handleReturn(clientSecret) {
  if (!PK.startsWith('pk_test_')) return startForm()
  try {
    stripe = await loadStripe(PK)
    const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret)
    const view = error || !paymentIntent ? 'failed' : resultView(paymentIntent.status)
    const snap = readSnapshot()

    if (view === 'failed') {
      history.replaceState(null, '', location.pathname)
      return startForm({ notice: 'That payment didn’t go through. Try another card.', values: snap && snap.values })
    }
    // Keep the URL so a refresh shows this result again.
    cart.clear()
    renderDone(view, paymentIntent, snap)
  } catch (err) {
    console.error('[KVIST] Could not read payment result.', err)
    history.replaceState(null, '', location.pathname)
    startForm({ notice: 'We couldn’t confirm that payment. Please try again.' })
  }
}

function renderDone(view, pi, snap) {
  $('[data-done-ref]', page).textContent = `Order ${orderRef(pi.id)}`
  $('[data-done-title]', page).textContent = view === 'success' ? 'Thank you' : 'Almost there'
  const email = pi.receipt_email || (snap && snap.values && snap.values.email) || ''
  $('[data-done-lead]', page).textContent =
    view === 'success'
      ? `Your test payment went through. In a real shop, a confirmation would be on its way to ${email || 'your inbox'}.`
      : 'Your payment is processing. This page will show the result once Stripe confirms it — refresh in a moment.'

  const ship = pi.shipping
  const addr = ship && ship.address
  $('[data-done-ship]', page).textContent = ship
    ? [ship.name, addr.line1, addr.line2, `${addr.city} ${addr.postal_code}`, COUNTRIES.find((c) => c.code === addr.country)?.name || addr.country]
        .filter(Boolean)
        .join('\n')
    : '—'
  $('[data-done-total]', page).textContent = formatPrice(pi.amount)

  const list = $('[data-done-items]', page)
  const items = (snap && Array.isArray(snap.items) ? snap.items : []).filter((l) => PRODUCTS[l.id])
  list.replaceChildren(
    ...items.map(({ id, qty }) => {
      const li = document.createElement('li')
      const img = document.createElement('img')
      img.src = PRODUCTS[id].image
      img.alt = `${PRODUCTS[id].name}${qty > 1 ? ` × ${qty}` : ''}`
      img.width = 88
      img.height = 88
      li.appendChild(img)
      return li
    }),
  )
  list.hidden = !items.length

  show('done')
  if (!reducedMode && items.length) {
    gsap.fromTo(
      $$('li', list),
      { y: 60, opacity: 0, rotation: -6 },
      { y: 0, opacity: 1, rotation: 0, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.08, delay: 0.35 },
    )
  }
}
