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
  initCheckout({ reduced }).catch((err) => console.error('[KVIST] Checkout init failed.', err))
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
else boot()
