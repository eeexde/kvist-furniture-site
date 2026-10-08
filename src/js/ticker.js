// Infinite marquee driven by gsap.ticker; speed and direction follow Lenis velocity.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $ } from './utils.js'
import { getLenis } from './scroll.js'

const BASE = 40 // px per second

export function initTicker({ reduced } = {}) {
  const section = $('.ticker')
  const row = $('.ticker__row', section)
  if (!section || !row || reduced) return

  let half = 0
  let x = 0
  let dir = 1
  let speed = BASE
  let visible = true

  const setX = gsap.quickSetter(row, 'x', 'px')
  const measure = () => (half = row.scrollWidth / 2)
  measure()
  ScrollTrigger.addEventListener('refresh', measure)

  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (visible = self.isActive),
  })

  gsap.ticker.add((_time, deltaMs) => {
    if (!visible || !half) return
    const lenis = getLenis()
    const v = lenis ? lenis.velocity || 0 : 0
    if (v > 0.01) dir = 1
    else if (v < -0.01) dir = -1
    // Lenis velocity is px per frame; brief: add |v| * 0.6 per frame (≈ ×60 per second).
    const target = BASE + Math.abs(v) * 0.6 * 60
    speed += (target - speed) * 0.12
    x -= (dir * speed * Math.min(deltaMs, 64)) / 1000
    x = ((x % half) - half) % half // keep x in (-half, 0]
    setX(x)
  })
}
