// Boot: image loader, text splitting, module init, reduced-motion path and error fallback.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, prefersReduced, setCountersFinal } from './utils.js'
import { initScroll, destroyScroll, scrollToTarget } from './scroll.js'
import { initNav, closeMenu, enableHeaderAutoHide } from './nav.js'
import { initIntro } from './intro.js'
import { initHero, heroReady } from './hero.js'
import { initTicker } from './ticker.js'
import { initReveals } from './reveals.js'
import { initPinned } from './pinned.js'
import { initCart } from './cart.js'
import { initMagnetic } from './magnetic.js'

gsap.registerPlugin(ScrollTrigger)

const root = document.documentElement

/* ---------- images ---------- */

function watchImage(img, onFail) {
  const ok = () => img.classList.add('is-loaded')
  if (img.complete) {
    if (img.naturalWidth > 0) ok()
    else onFail()
    return
  }
  img.addEventListener('load', ok, { once: true })
  img.addEventListener('error', onFail, { once: true })
}

function initImages() {
  // Placeholder-backed images: drop the broken <img>, the .ph gradient + label stays.
  $$('.ph img').forEach((img) => watchImage(img, () => img.remove()))
  const fly = $('img.hero__fly')
  if (fly) watchImage(fly, () => fly.remove())
  // Any other image (avatars, faces) keeps its box but never shows a broken icon.
  $$('img').forEach((img) => {
    if (img.closest('.ph') || img.classList.contains('hero__fly')) return
    watchImage(img, () => (img.style.visibility = 'hidden'))
  })
}

/* ---------- text prep ---------- */

function splitHeroTitle() {
  const title = $('.hero__title')
  const lines = $$('.line', title)
  if (!lines.length) return
  const labels = []
  lines.forEach((line) => {
    if (line.dataset.split) return
    const text = line.textContent.replace(/\s+/g, ' ').trim()
    labels.push(text)
    line.setAttribute('aria-label', text)
    line.textContent = ''
    for (const ch of text) {
      const span = document.createElement('span')
      span.className = 'ch'
      span.setAttribute('aria-hidden', 'true')
      span.style.display = 'inline-block'
      span.textContent = ch === ' ' ? ' ' : ch
      line.appendChild(span)
    }
    line.dataset.split = '1'
  })
  // aria-label on a generic span isn't reliably announced; the heading carries the full name too.
  if (labels.length && !title.getAttribute('aria-label')) title.setAttribute('aria-label', labels.join(' '))
}

function wrapLines() {
  $$('[data-lines] .line').forEach((line) => {
    if (line.dataset.wrapped) return
    const inner = document.createElement('span')
    inner.style.display = 'inline-block'
    while (line.firstChild) inner.appendChild(line.firstChild)
    line.appendChild(inner)
    line.dataset.wrapped = '1'
  })
}

/** Repeat the ticker set until it is wider than the viewport, then double it for a seamless loop. */
function loopTicker() {
  const row = $('.ticker__row')
  if (!row || row.dataset.looped) return
  const original = Array.from(row.childNodes).map((n) => n.cloneNode(true))
  if (!original.length) return
  const unit = row.scrollWidth
  const reps = unit > 0 ? Math.max(1, Math.ceil((window.innerWidth * 1.1) / unit)) : 2
  for (let r = 1; r < reps; r++) original.forEach((n) => row.appendChild(n.cloneNode(true)))
  Array.from(row.childNodes).forEach((n) => row.appendChild(n.cloneNode(true)))
  row.dataset.looped = '1'
}

/* ---------- refresh ---------- */

function setupRefresh() {
  let lastW = window.innerWidth
  let t = 0
  window.addEventListener('resize', () => {
    clearTimeout(t)
    t = setTimeout(() => {
      if (window.innerWidth === lastW) return // ignore mobile URL-bar height changes
      lastW = window.innerWidth
      ScrollTrigger.refresh()
    }, 150)
  })

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh())

  const onLoad = () => {
    ScrollTrigger.refresh()
    if (location.hash && location.hash !== '#') scrollToTarget(location.hash, true)
  }
  if (document.readyState === 'complete') onLoad()
  else window.addEventListener('load', onLoad, { once: true })
}

/* ---------- reduced motion ---------- */

function showStatic() {
  setCountersFinal()
  const shown = $$('.hero__title, .hero__sub, .hero__copy .btn, .proof, .rail__item, .hero__tag')
  if (shown.length) gsap.set(shown, { opacity: 1 })
}

/* ---------- boot ---------- */

function boot() {
  // Cancels the CSS failsafe that reveals the hero if this bundle never runs.
  root.classList.add('booted')
  const reduced = prefersReduced()

  // The intro expects to start at the top; deep links keep their target.
  if (!reduced && !location.hash) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }

  initImages()

  const ctx = gsap.context(() => {})
  let pinnedCleanup = null
  let failed = false

  const fail = (err) => {
    if (failed) return
    failed = true
    console.error('[KVIST] Animation init failed; showing the static page instead.', err)
    try {
      ctx.revert()
    } catch {
      /* keep going */
    }
    try {
      pinnedCleanup && pinnedCleanup()
    } catch {
      /* keep going */
    }
    ScrollTrigger.getAll().forEach((st) => st.kill())
    destroyScroll()
    root.classList.remove('js', 'pin-h')
    setCountersFinal()
  }

  const onIntroDone = () => {
    try {
      heroReady()
      enableHeaderAutoHide()
      initMagnetic()
    } catch (err) {
      fail(err)
    }
  }

  try {
    splitHeroTitle()
    wrapLines()
    loopTicker()

    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' })
    initScroll({ reduced, onBeforeAnchor: closeMenu })

    ctx.add(() => {
      // Pins first so triggers further down are measured with the pin spacing in place.
      if (!reduced) pinnedCleanup = initPinned()
      initHero({ reduced })
      initReveals({ reduced })
      initTicker({ reduced })
      initNav({ reduced })
      initCart({ reduced })
      if (reduced) showStatic()
      else initIntro({ ctx, onDone: onIntroDone, onError: fail })
    })
  } catch (err) {
    fail(err)
  }

  setupRefresh()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
else boot()
