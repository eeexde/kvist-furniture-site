// Magnetic buttons: [data-magnetic] follows the pointer, elastic return on leave.
import { gsap } from 'gsap'
import { $$, canHover } from './utils.js'

const bound = new WeakSet()

export function initMagnetic() {
  if (!canHover()) return

  $$('[data-magnetic]').forEach((el) => {
    if (bound.has(el)) return
    bound.add(el)

    const opts = { duration: 0.7, ease: 'elastic.out(1, .4)' }
    const xTo = gsap.quickTo(el, 'x', opts)
    const yTo = gsap.quickTo(el, 'y', opts)

    el.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      // Measure from the untransformed centre so the offset doesn't feed back on itself.
      const cx = r.left + r.width / 2 - (gsap.getProperty(el, 'x') || 0)
      const cy = r.top + r.height / 2 - (gsap.getProperty(el, 'y') || 0)
      xTo((e.clientX - cx) * 0.25)
      yTo((e.clientY - cy) * 0.4)
    })
    el.addEventListener('pointerleave', () => {
      xTo(0)
      yTo(0)
    })
  })
}
