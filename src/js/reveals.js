// One-shot entrance reveals + section parallax scrubs (Design Brief §8).
// Initial hidden states are set here in JS so the page is fully visible without it.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, ensureTransformable } from './utils.js'

/** Fire `fn` once when `trigger` crosses `start`. */
function once(trigger, fn, start = 'top 85%') {
  if (!trigger) return
  ScrollTrigger.create({ trigger, start, once: true, onEnter: fn })
}

export function initReveals({ reduced } = {}) {
  if (reduced) {
    $$('.product').forEach((p) => p.classList.add('is-in'))
    return
  }
  lineReveals()
  headButtons()
  products()
  categories()
  loved()
  perks()
  whyParallax()
  reviews()
  cta()
  footer()
}

function lineReveals() {
  $$('[data-lines]').forEach((h) => {
    const spans = $$('.line > span', h)
    if (!spans.length) return
    ensureTransformable(spans)
    gsap.set(spans, { yPercent: 110, rotation: 2, transformOrigin: '0% 100%' })
    once(h, () =>
      gsap.to(spans, { yPercent: 0, rotation: 0, duration: 1.1, ease: 'power4.out', stagger: 0.1 }),
    )
  })
}

function headButtons() {
  $$('.head .btn').forEach((btn) => {
    gsap.set(btn, { x: 30, opacity: 0 })
    once(btn, () => gsap.to(btn, { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }), 'top 90%')
  })
}

function products() {
  $$('.products').forEach((grid) => {
    const cards = $$('.product', grid)
    if (!cards.length) return
    gsap.set(cards, { y: 80, opacity: 0 })
    $$('.product__media img', grid).forEach((img) => gsap.set(img, { scale: 1.3, rotation: 6 }))

    once(grid, () => {
      gsap.to(cards, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        clearProps: 'transform',
        onComplete: () => cards.forEach((c) => c.classList.add('is-in')),
      })
      cards.forEach((card, i) => {
        const media = $('.product__media', card)
        const img = media && $('img', media)
        // Missing images are removed by the loader; then the placeholder box itself settles in (softer).
        const target = img && img.isConnected ? img : media
        if (!target) return
        const fromVars = target === img ? { scale: 1.3, rotation: 6 } : { scale: 1.12, rotation: 4 }
        gsap.fromTo(target, fromVars, {
          scale: 1,
          rotation: 0,
          duration: 1.4,
          ease: 'expo.out',
          delay: i * 0.1,
          clearProps: 'transform', // hand hover scale back to CSS
        })
      })
    })
  })
}

function categories() {
  const section = $('.cats')
  const chips = $$('.cat', section)
  if (!chips.length) return
  gsap.set(chips, { y: 50, scale: 0.9, opacity: 0 })
  once(
    section,
    () =>
      gsap.to(chips, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: 'back.out(1.7)',
        stagger: 0.05,
        clearProps: 'transform',
      }),
    'top 75%',
  )
}

function loved() {
  $$('.lcard').forEach((card, i) => {
    const mask = $('.lcard__mask', card)
    const media = $('.lcard__media', card)
    const extras = [$('.lcard__badge', card), $('.lcard__cap', card)].filter(Boolean)
    if (mask) gsap.set(mask, { yPercent: 100 })
    if (media) gsap.set(media, { yPercent: -80, scale: 1.3 })
    if (extras.length) gsap.set(extras, { y: 24, opacity: 0 })

    once(
      card,
      () => {
        const tl = gsap.timeline({ delay: i * 0.14 })
        if (mask) tl.to(mask, { yPercent: 0, duration: 1.2, ease: 'expo.out' }, 0)
        if (media) {
          tl.to(media, { yPercent: 0, scale: 1, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }, 0)
        }
        if (extras.length) {
          tl.to(extras, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.55)
        }
      },
      'top 85%',
    )
  })
}

function perks() {
  const wrap = $('.perks')
  const items = $$('.perk', wrap)
  if (!items.length) return
  items.forEach((perk) => {
    gsap.set(perk, { '--draw': 0 })
    gsap.set(perk.children, { y: 24, opacity: 0 })
  })
  once(wrap, () => {
    items.forEach((perk, i) => {
      gsap.to(perk, { '--draw': 1, duration: 1.1, ease: 'expo.inOut', delay: i * 0.12 })
      gsap.to(perk.children, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.25 + i * 0.12,
        stagger: 0.06,
      })
    })
  })
}

function whyParallax() {
  const section = $('.why')
  if (!section) return
  const st = { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
  const big = $('.why__big', section)
  const small = $('.why__small', section)
  if (big) gsap.fromTo(big, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: st })
  if (small) {
    gsap.fromTo(small, { y: 150, rotation: -3 }, { y: -90, rotation: 2, ease: 'none', scrollTrigger: { ...st } })
  }
}

function reviews() {
  const wrap = $('.quotes')
  const cards = $$('.quote', wrap)
  if (!cards.length) return
  const marks = $$('.quote__mark', wrap)
  ensureTransformable(marks)

  gsap.set(cards, { y: 100, rotation: (i) => (i - 1) * 6, opacity: 0, transformOrigin: '50% 100%' })
  if (marks.length) gsap.set(marks, { scale: 0, rotation: -30 })

  once(
    wrap,
    () => {
      gsap.to(cards, {
        y: 0,
        rotation: 0,
        opacity: 1,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.12,
        clearProps: 'transform',
      })
      if (marks.length) {
        gsap.to(marks, { scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(2.4)', delay: 0.5, stagger: 0.12 })
      }
    },
    'top 80%',
  )
}

function cta() {
  const section = $('.cta')
  if (!section) return
  const bg = $('.cta__bg', section)
  const card = $('.cta__card', section)

  if (bg) {
    gsap.fromTo(
      bg,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
  }
  if (!card) return
  // Headings already have their own line reveal.
  const kids = Array.from(card.children).filter((c) => !c.hasAttribute('data-lines'))
  gsap.set(card, { y: 90, scale: 0.94, opacity: 0 })
  if (kids.length) gsap.set(kids, { y: 30, opacity: 0 })

  once(
    card,
    () => {
      gsap.to(card, { y: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' })
      if (kids.length) {
        gsap.to(kids, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.35 })
      }
    },
    'top 85%',
  )
}

function footer() {
  const top = $('.footer__top')
  const kids = top ? Array.from(top.children) : []
  if (kids.length) {
    gsap.set(kids, { y: 40, opacity: 0 })
    once(top, () => gsap.to(kids, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1 }))
  }

  const word = $('.footer__word')
  const letters = $$('span', word)
  if (!letters.length) return
  ensureTransformable(letters)
  gsap.fromTo(
    letters,
    { yPercent: 100 },
    {
      yPercent: 0,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: word, start: 'top bottom', end: 'clamp(bottom bottom)', scrub: 0.6 },
    },
  )
}
