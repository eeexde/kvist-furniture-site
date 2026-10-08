// Header: burger menu, hide-on-scroll, active section link.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$ } from './utils.js'
import { lockScroll, unlockScroll } from './scroll.js'

const SECTIONS = ['top', 'arrivals', 'best', 'about', 'contact']

let header = null
let burger = null
let isOpen = false
let hidden = false
let autoHide = false
let reducedMode = false

export function initNav({ reduced } = {}) {
  reducedMode = !!reduced
  header = $('[data-nav]') || $('header.nav')
  if (!header) return
  burger = $('.nav__burger', header)

  initBurger()
  initActiveLinks()
  if (!reducedMode) initAutoHide()
}

/* ---------- burger ---------- */

function initBurger() {
  if (!burger) return
  burger.setAttribute('aria-expanded', 'false')
  if (!burger.getAttribute('aria-label')) burger.setAttribute('aria-label', 'Open menu')

  burger.addEventListener('click', () => (isOpen ? closeMenu() : openMenu()))

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeMenu()
      burger.focus()
    }
  })

  // Any link inside the header closes the sheet (anchor scrolling also calls closeMenu first).
  $$('.nav__links a', header).forEach((a) => a.addEventListener('click', () => closeMenu()))

  // Leaving the mobile layout with the sheet open would strand the scroll lock.
  let lastW = window.innerWidth
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return
    lastW = window.innerWidth
    if (isOpen && window.innerWidth > 820) closeMenu()
  })
}

function openMenu() {
  if (!header || isOpen) return
  isOpen = true
  if (autoHide) {
    hidden = true // force an instant show so the sheet isn't inside a transformed header
    setHidden(false, true)
  }
  header.classList.add('is-open')
  burger && burger.setAttribute('aria-expanded', 'true')
  burger && burger.setAttribute('aria-label', 'Close menu')
  lockScroll('menu')
  const first = $('.nav__links a', header)
  if (first) first.focus({ preventScroll: true })
}

export function closeMenu() {
  if (!header || !isOpen) return
  isOpen = false
  header.classList.remove('is-open')
  burger && burger.setAttribute('aria-expanded', 'false')
  burger && burger.setAttribute('aria-label', 'Open menu')
  unlockScroll('menu')
}

/* ---------- hide on scroll ---------- */

// A transformed header becomes the containing block for its fixed children (the mobile
// sheet), so at rest we pin transform to 'none' inline (CSS hides it under html.js pre-intro).
function settle() {
  if (header && !hidden) {
    gsap.set(header, { clearProps: 'transform' })
    header.style.transform = 'none'
  }
}

function setHidden(next, instant = false) {
  if (!header || next === hidden) return
  hidden = next
  gsap.killTweensOf(header)
  if (instant) {
    gsap.set(header, { yPercent: next ? -110 : 0, y: 0 })
    settle()
    return
  }
  gsap.to(
    header,
    next
      ? { yPercent: -110, y: 0, duration: 0.45, ease: 'power2.in' }
      : { yPercent: 0, y: 0, duration: 0.5, ease: 'power3.out', onComplete: settle },
  )
}

function initAutoHide() {
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      if (!autoHide || isOpen) return
      const y = self.scroll()
      if (y <= 120 || self.direction === -1) setHidden(false)
      else if (self.direction === 1) setHidden(true)
    },
  })
  header.addEventListener('focusin', () => setHidden(false))
}

/** Called by the intro when the header has slid in. */
export function enableHeaderAutoHide() {
  autoHide = !reducedMode
  settle()
}

/** Bring the header back (used by fly-to-cart so the target is on screen). */
export function showHeader() {
  setHidden(false)
}

/* ---------- active link ---------- */

function initActiveLinks() {
  const links = $$('.nav__links a[href^="#"]', header)
  if (!links.length) return

  const setActive = (id) => {
    links.forEach((a) => {
      const on = a.getAttribute('href') === `#${id}`
      a.classList.toggle('is-here', on)
      if (on) a.setAttribute('aria-current', 'true')
      else a.removeAttribute('aria-current')
    })
  }

  const present = SECTIONS.filter((id) => document.getElementById(id))
  present.forEach((id, i) => {
    ScrollTrigger.create({
      trigger: document.getElementById(id),
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => setActive(id),
      onEnterBack: () => setActive(id),
      onLeaveBack: () => i > 0 && setActive(present[i - 1]),
    })
  })

  // The footer may be too short to reach 50% of the viewport: light "Contact" at the very end.
  const last = present[present.length - 1]
  if (last) {
    ScrollTrigger.create({
      start: () => ScrollTrigger.maxScroll(window) - 2,
      end: () => ScrollTrigger.maxScroll(window),
      onEnter: () => setActive(last),
    })
  }

  setActive(present[0] || 'top')
}
