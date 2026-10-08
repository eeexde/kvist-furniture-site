// Lenis smooth scroll bridged to gsap.ticker + ScrollTrigger, plus anchor scrolling and scroll locks.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { navHeight } from './utils.js'

export let lenis = null
export const getLenis = () => lenis

const locks = new Set()
let rafFn = null
let beforeAnchor = null

export function initScroll({ reduced, onBeforeAnchor } = {}) {
  beforeAnchor = onBeforeAnchor || null

  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    rafFn = (time) => lenis && lenis.raf(time * 1000)
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)
  }

  document.addEventListener('click', onAnchorClick)
  applyLocks()
}

export function destroyScroll() {
  if (rafFn) gsap.ticker.remove(rafFn)
  rafFn = null
  if (lenis) lenis.destroy()
  lenis = null
  locks.clear()
  document.documentElement.style.overflow = ''
}

/** Named scroll locks (e.g. 'intro', 'menu'); scrolling resumes only when all are released. */
export function lockScroll(key) {
  locks.add(key)
  applyLocks()
}
export function unlockScroll(key) {
  locks.delete(key)
  applyLocks()
}
function applyLocks() {
  if (lenis) {
    if (locks.size) lenis.stop()
    else lenis.start()
  } else {
    document.documentElement.style.overflow = locks.size ? 'hidden' : ''
  }
}

function resolveTarget(hash) {
  if (!hash || hash === '#') return null
  if (hash === '#top') return document.getElementById('top') || document.body
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)))
  } catch {
    return null
  }
}

/** Scroll to an in-page hash with the header offset. `immediate` jumps without easing. */
export function scrollToTarget(hash, immediate = false) {
  const target = resolveTarget(hash)
  if (!target) return false
  const offset = -navHeight()
  const isTop = hash === '#top'

  if (lenis) {
    lenis.scrollTo(isTop ? 0 : target, {
      offset: isTop ? 0 : offset,
      duration: 1.2,
      immediate,
      force: true, // works even while Lenis is stopped (intro / hash jump)
    })
  } else {
    const top = isTop ? 0 : target.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top: Math.max(0, top), behavior: immediate ? 'instant' : 'smooth' })
  }
  if (immediate) ScrollTrigger.update()
  return true
}

function onAnchorClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const link = e.target.closest && e.target.closest('a[href^="#"]')
  if (!link) return
  const hash = link.getAttribute('href')
  if (hash === '#') {
    e.preventDefault() // placeholder links (socials) shouldn't jump to the top
    return
  }
  const target = resolveTarget(hash)
  if (!target) return

  e.preventDefault()
  if (beforeAnchor) beforeAnchor()
  scrollToTarget(hash)
  try {
    history.pushState(null, '', hash)
  } catch {
    /* file:// or sandboxed */
  }
  moveFocus(target)
}

/** Keep keyboard/screen-reader position in sync with the visual jump. */
function moveFocus(target) {
  if (!target || target === document.body) return
  if (!target.hasAttribute('tabindex') && !target.matches('a,button,input,select,textarea')) {
    target.setAttribute('tabindex', '-1')
  }
  target.focus({ preventScroll: true })
}
