// Hero: product rail swap (tabs), pointer tilt on the stage, scroll-out scrub.
import { gsap } from 'gsap'
import { $, $$, canHover, ensureTransformable } from './utils.js'

let slots = []
let items = []
let floor = null
let tagSpans = []
let current = 0
let animating = false
let queued = null
let ready = false
let reducedMode = false
let tilt = null // { x, y, r } quickTo setters for the active slot

export function initHero({ reduced } = {}) {
  reducedMode = !!reduced
  const hero = $('.hero')
  if (!hero) return

  slots = $$('.hero__slot', hero)
  items = $$('.rail__item', hero)
  floor = $('.hero__floor', hero)
  tagSpans = [$('.hero__tag-name', hero), $('.hero__tag-price', hero)].filter(Boolean)
  if (!reducedMode) ensureTransformable(tagSpans)

  const onIdx = items.findIndex((el) => el.classList.contains('is-on'))
  const slotIdx = slots.findIndex((el) => el.classList.contains('is-on'))
  current = Math.max(0, onIdx >= 0 ? onIdx : slotIdx)

  initRail()
  // Reduced motion has no intro, so the rail is usable straight away.
  if (reducedMode) ready = true
  else {
    initTilt(hero)
    initScrub(hero)
  }
}

/** Called by the intro once the stage is in place. */
export function heroReady() {
  ready = true
  makeTilt(slots[current])
  flushQueue()
}

/* ---------- rail (tabs) ---------- */

function initRail() {
  if (!items.length) return
  markSelected(current)

  items.forEach((item, i) => item.addEventListener('click', () => go(i)))

  const rail = items[0].closest('.rail') || items[0].parentElement
  rail.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement)
    if (i < 0) return
    let next = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % items.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    if (next === null) return
    e.preventDefault()
    items[next].focus()
    go(next)
  })
}

function markSelected(i) {
  items.forEach((item, k) => {
    const on = k === i
    item.classList.toggle('is-on', on)
    item.setAttribute('aria-selected', on ? 'true' : 'false')
    item.tabIndex = on ? 0 : -1
  })
}

function setTag(i) {
  const item = items[i]
  if (!item) return
  const name = $('.hero__tag-name')
  const price = $('.hero__tag-price')
  if (name && item.dataset.name) name.textContent = item.dataset.name
  if (price && item.dataset.price) price.textContent = item.dataset.price
}

function go(i) {
  if (i < 0 || i >= items.length) return
  if (!ready || animating) {
    queued = i
    if (!animating) markSelected(i)
    return
  }
  if (i === current) return
  play(i)
}

function flushQueue() {
  if (queued === null) return
  const q = queued
  queued = null
  if (q !== current) play(q)
  else markSelected(current)
}

function play(to) {
  const from = current
  const out = slots[from]
  const inn = slots[to]
  current = to
  markSelected(to)

  if (reducedMode || !out || !inn) {
    out && out.classList.remove('is-on')
    inn && inn.classList.add('is-on')
    if (!reducedMode) {
      out && gsap.set(out, { opacity: 0 })
      inn && gsap.set(inn, { opacity: 1 })
    }
    setTag(to)
    return
  }

  animating = true
  killTilt()

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(out, { x: 0, y: 0, scale: 1, rotation: 0 }) // opacity stays 0
      animating = false
      makeTilt(inn)
      flushQueue()
    },
  })

  tl.to(out, { y: 40, scale: 0.8, rotation: -7, opacity: 0, duration: 0.45, ease: 'power3.in' }, 0)
  if (floor) tl.to(floor, { scaleX: 0.45, opacity: 0.3, duration: 0.45, ease: 'power3.in' }, 0)
  if (tagSpans.length) tl.to(tagSpans, { yPercent: -110, duration: 0.4, ease: 'power3.in', stagger: 0.04 }, 0)
  tl.add(() => {
    out.classList.remove('is-on')
    inn.classList.add('is-on')
    setTag(to)
  }, 0.45)
  tl.fromTo(
    inn,
    { x: 0, y: -90, scale: 0.78, rotation: 8, opacity: 0, immediateRender: false },
    { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 1.05, ease: 'back.out(1.5)' },
    0.45,
  )
  if (floor) tl.to(floor, { scaleX: 1, opacity: 1, duration: 1.1, ease: 'elastic.out(1, .5)' }, 0.5)
  if (tagSpans.length) {
    tl.fromTo(
      tagSpans,
      { yPercent: 110, immediateRender: false },
      { yPercent: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 },
      0.5,
    )
  }
}

/* ---------- pointer tilt ---------- */

let tiltEnabled = false

function initTilt(hero) {
  const stage = $('.hero__stage', hero)
  if (!stage || !canHover()) return
  tiltEnabled = true

  stage.addEventListener('pointermove', (e) => {
    if (!tilt || e.pointerType !== 'mouse') return
    const r = stage.getBoundingClientRect()
    const dx = gsap.utils.clamp(-0.5, 0.5, (e.clientX - r.left) / r.width - 0.5)
    const dy = gsap.utils.clamp(-0.5, 0.5, (e.clientY - r.top) / r.height - 0.5)
    tilt.x(-34 * dx)
    tilt.y(-18 * dy)
    tilt.r(-3 * dx)
  })
  stage.addEventListener('pointerleave', () => {
    if (!tilt) return
    tilt.x(0)
    tilt.y(0)
    tilt.r(0)
  })
}

// Swap tweens and tilt share x/y/rotation on the slot, so tilt is torn down during a swap
// and rebuilt (fresh quickTo, starting from the slot's real values) afterwards.
function makeTilt(slot) {
  if (!tiltEnabled || !slot) return
  killTilt()
  const opts = { duration: 0.8, ease: 'power3.out' }
  tilt = {
    x: gsap.quickTo(slot, 'x', opts),
    y: gsap.quickTo(slot, 'y', opts),
    r: gsap.quickTo(slot, 'rotation', opts),
  }
}

function killTilt() {
  if (!tilt) return
  Object.values(tilt).forEach((fn) => fn.tween && fn.tween.kill())
  tilt = null
}

/* ---------- scroll-out scrub ---------- */

function initScrub(hero) {
  const lines = $$('.hero__title .line', hero)
  const copy = $('.hero__copy', hero)
  const stage = $('.hero__stage', hero)
  const rail = $('.rail', hero)

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  })
  if (lines[0]) tl.to(lines[0], { xPercent: -18 }, 0)
  if (lines[1]) tl.to(lines[1], { xPercent: 14 }, 0)
  if (copy) tl.to(copy, { y: -60, opacity: 0.15 }, 0)
  if (stage) tl.to(stage, { yPercent: -12, scale: 1.08 }, 0)
  if (rail) tl.to(rail, { yPercent: -30 }, 0)
}
