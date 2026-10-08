// Checkout page boot: smooth scroll, footer reveal, magnetic buttons, then the checkout flow.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from './utils.js'
import { initScroll } from './scroll.js'
import { initReveals } from './reveals.js'
import { initMagnetic } from './magnetic.js'
import { initCheckout } from './checkout.js'

gsap.registerPlugin(ScrollTrigger)

function boot() {
  document.documentElement.classList.add('booted')
  const reduced = prefersReduced()
  initScroll({ reduced })
  try {
    initReveals({ reduced })
  } catch (err) {
    console.error('[KVIST] Reveal init failed.', err)
  }
  initMagnetic()
  // base.css hides the header (translateY(-100%)) until the landing intro runs; bring it in here.
  // No clearProps: the inline transform must stay so it keeps overriding that CSS rule.
  if (!reduced) gsap.fromTo('[data-nav]', { yPercent: -100, y: 0 }, { yPercent: 0, y: 0, duration: 0.8, ease: 'power3.out' })
  initCheckout({ reduced }).catch((err) => console.error('[KVIST] Checkout init failed.', err))
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
else boot()
