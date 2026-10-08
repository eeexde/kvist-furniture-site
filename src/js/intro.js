// Hero intro timeline (Design Brief §8 "Intro"). Scroll is locked until it finishes.
import { gsap } from 'gsap'
import { $, $$, imgSettled, wait } from './utils.js'
import { lockScroll, unlockScroll } from './scroll.js'

const FAST_FORWARD_AFTER = 1200

/**
 * @param {{ ctx: gsap.Context, onDone: () => void, onError: (e: unknown) => void }} opts
 * onDone fires at ~3.2s (or on fast-forward); remaining tweens (counter) keep playing.
 */
export function initIntro({ ctx, onDone, onError }) {
  const hero = $('.hero')
  if (!hero) {
    onDone()
    return
  }

  const el = {
    title: $('.hero__title', hero),
    chars: $$('.hero__title .ch', hero),
    copy: [$('.hero__sub', hero), $('.hero__copy .btn', hero), $('.proof', hero)].filter(Boolean),
    rail: $$('.rail__item', hero),
    tag: $('.hero__tag', hero),
    panel: $('.hero__panel', hero),
    floor: $('.hero__floor', hero),
    header: $('[data-nav]') || $('header.nav'),
    slot: $('.hero__slot.is-on', hero) || $('.hero__slot', hero),
    fly: $('img.hero__fly', hero),
    counters: $$('[data-count]'),
  }

  lockScroll('intro')
  setInitialState(el)

  // Visitors landing on /#section skip straight to the end state.
  const hash = location.hash
  const deepLink = hash && hash !== '#top' && hash !== '#main' && document.getElementById(hash.slice(1))

  const heroImg = el.fly || (el.slot && $('img', el.slot))
  const ready = deepLink
    ? Promise.resolve()
    : Promise.race([Promise.all([document.fonts ? document.fonts.ready : null, imgSettled(heroImg)]), wait(2500)])

  ready
    .then(() => {
      ctx.add(() => {
        const tl = build(el, onDone)
        if (deepLink) tl.progress(1)
        else armFastForward(tl)
      })
    })
    .catch((err) => {
      unlockScroll('intro')
      onError(err)
    })
}

function setInitialState(el) {
  if (el.chars.length) gsap.set(el.chars, { xPercent: 100, opacity: 0 })
  if (el.copy.length) gsap.set(el.copy, { y: 30, opacity: 0 })
  if (el.rail.length) gsap.set(el.rail, { x: 30, opacity: 0 })
  if (el.tag) gsap.set(el.tag, { opacity: 0 })
  if (el.panel) gsap.set(el.panel, { scaleX: 0, transformOrigin: '0% 50%' })
  if (el.floor) gsap.set(el.floor, { scaleX: 0, opacity: 0 })
  if (el.header) gsap.set(el.header, { yPercent: -100, y: 0 })
  if (el.slot) gsap.set(el.slot, { opacity: 0 })
  if (el.fly) gsap.set(el.fly, { autoAlpha: 0 })
  el.counters.forEach((c) => (c.textContent = '0'))
}

/** The fly img is only worth flying if it actually loaded; otherwise the slot placeholder flies. */
function pickFlier(el) {
  const f = el.fly
  if (f && f.isConnected && f.complete && f.naturalWidth > 0) {
    if (getComputedStyle(f).display === 'none') f.style.display = 'block'
    return f
  }
  return el.slot
}

function build(el, onDone) {
  const flier = pickFlier(el)
  let done = false

  const finish = () => {
    if (done) return
    done = true
    if (el.fly && flier === el.fly) gsap.set(el.fly, { autoAlpha: 0 })
    if (el.slot) gsap.set(el.slot, { opacity: 1, clearProps: 'transform,visibility' })
    unlockScroll('intro')
    onDone()
  }

  const cleanup = () => {
    finish()
    if (el.chars.length) gsap.set(el.chars, { clearProps: 'transform,opacity' })
    if (el.copy.length) gsap.set(el.copy, { clearProps: 'transform' }) // opacity stays inline: CSS hides them pre-intro
    if (el.rail.length) gsap.set(el.rail, { clearProps: 'transform' })
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: cleanup })

  if (flier) {
    const r = flier.getBoundingClientRect()
    const dx = window.innerWidth / 2 - (r.left + r.width / 2)
    const dy = window.innerHeight / 2 - (r.top + r.height / 2)
    gsap.set(flier, { x: dx, y: dy, scale: 0.02, rotation: -12, autoAlpha: 0, transformOrigin: '50% 50%' })
    tl.to(flier, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, 0.15)
      .to(flier, { scale: 0.09, duration: 0.7, ease: 'sine.inOut' }, 0.15)
      .to(flier, { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.6, ease: 'expo.inOut' }, 0.8)
  }

  if (el.panel) tl.to(el.panel, { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 1.1)

  if (el.title) tl.set(el.title, { opacity: 1 }, 1.45)
  if (el.chars.length) {
    tl.to(el.chars, { xPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, 1.45)
  }

  if (el.floor) tl.to(el.floor, { scaleX: 1, opacity: 1, duration: 1, ease: 'expo.out' }, 1.9)
  if (el.header) tl.to(el.header, { yPercent: 0, y: 0, duration: 0.9 }, 2.0)

  if (el.copy.length) tl.to(el.copy, { y: 0, opacity: 1, duration: 0.9, stagger: 0.09 }, 2.1)
  if (el.rail.length) {
    tl.to(el.rail, { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.07 }, 2.1)
  }

  el.counters.forEach((c) => {
    const target = parseFloat(c.dataset.count) || 0
    const state = { v: 0 }
    tl.to(
      state,
      {
        v: target,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => (c.textContent = String(Math.round(state.v))),
      },
      2.3,
    )
  })

  if (el.tag) tl.to(el.tag, { opacity: 1, duration: 0.6 }, 2.5)

  tl.call(finish, null, 3.2)
  return tl
}

/** Any click / key / wheel / touch after 1.2s jumps the intro to its end. */
function armFastForward(tl) {
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart']
  const t0 = performance.now()
  const skip = () => {
    if (performance.now() - t0 < FAST_FORWARD_AFTER) return
    off()
    if (tl.progress() < 1) tl.progress(1)
  }
  const off = () => events.forEach((ev) => window.removeEventListener(ev, skip))
  events.forEach((ev) => window.addEventListener(ev, skip, { passive: true }))
  tl.eventCallback('onComplete', ((orig) => () => {
    off()
    orig && orig()
  })(tl.eventCallback('onComplete')))
}
