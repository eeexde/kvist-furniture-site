// Desktop/mobile variants for the categories row and the immerse section (gsap.matchMedia).
import { gsap } from 'gsap'
import { $, $$, ensureTransformable } from './utils.js'

const root = document.documentElement

export function initPinned() {
  const mm = gsap.matchMedia()

  mm.add('(min-width: 821px)', () => {
    root.classList.add('pin-h')
    categoriesDesktop()
    immerseDesktop()
    return () => root.classList.remove('pin-h')
  })

  mm.add('(max-width: 820px)', () => {
    immerseMobile()
    return () => {}
  })

  return () => mm.revert()
}

function categoriesDesktop() {
  const section = $('.cats')
  const viewport = $('.cats__viewport', section)
  const row = $('.cats__row', section)
  if (!section || !row) return

  const visibleWidth = () => (viewport ? viewport.clientWidth : window.innerWidth)
  gsap.fromTo(
    row,
    { x: () => window.innerWidth * 0.12 },
    {
      x: () => -Math.max(0, row.scrollWidth - visibleWidth()) - window.innerWidth * 0.04,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    },
  )
}

function immerseParts() {
  const section = $('.immerse')
  const words = $$('.immerse__words [data-from]', section)
  ensureTransformable(words)
  return {
    section,
    frame: $('.immerse__frame', section),
    media: $('.immerse__media', section),
    words,
  }
}

const from = (el) => parseFloat(el.dataset.from) || 0

function immerseDesktop() {
  const { section, frame, media, words } = immerseParts()
  if (!section) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=170%',
      pin: true,
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })
  if (frame) tl.fromTo(frame, { scale: 0.52 }, { scale: 1, duration: 1, ease: 'power2.inOut' }, 0)
  if (media) tl.fromTo(media, { scale: 1.45 }, { scale: 1, duration: 1, ease: 'power2.inOut' }, 0)
  if (words.length) {
    tl.fromTo(
      words,
      { xPercent: (i, el) => from(el) * 140, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.12 },
      0.6,
    )
  }
  tl.to({}, { duration: 0.35 }) // hold
}

function immerseMobile() {
  const { section, frame, words } = immerseParts()
  if (!section) return

  if (frame) {
    gsap.fromTo(
      frame,
      { scale: 0.84 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'center center', scrub: true },
      },
    )
  }
  if (words.length) {
    gsap.fromTo(
      words,
      { xPercent: (i, el) => from(el) * 60, opacity: 0 },
      {
        xPercent: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: section, start: 'top 55%', once: true },
      },
    )
  }
}
