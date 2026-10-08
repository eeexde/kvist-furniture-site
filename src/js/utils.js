// Small DOM + environment helpers shared by every module.

export const $ = (sel, root = document) => (root ? root.querySelector(sel) : null)
export const $$ = (sel, root = document) => (root ? Array.from(root.querySelectorAll(sel)) : [])

const root = document.documentElement

/** Reduced motion is decided once by the inline <head> script (html.reduced) so CSS and JS agree. */
export const prefersReduced = () => root.classList.contains('reduced')

/** True on real hover/fine-pointer devices with motion allowed. */
export const canHover = () =>
  !prefersReduced() &&
  !root.classList.contains('coarse') &&
  window.matchMedia('(hover: hover)').matches

/** Current header height in px (falls back to the --nav-h token, then 72). */
export function navHeight() {
  const header = $('[data-nav]') || $('header.nav')
  if (header && header.offsetHeight) return header.offsetHeight
  const token = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h'))
  return Number.isFinite(token) && token > 0 ? token : 72
}

/** Transforms do nothing on inline boxes; promote them to inline-block if CSS left them inline. */
export function ensureTransformable(els) {
  els.forEach((el) => {
    if (el && getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'
  })
}

/** Set every [data-count] element to its final value (reduced motion / fallback). */
export function setCountersFinal() {
  $$('[data-count]').forEach((el) => {
    el.textContent = String(Math.round(parseFloat(el.dataset.count) || 0))
  })
}

/** Resolve when an <img> has loaded or failed (or immediately if missing/complete). */
export function imgSettled(img) {
  return new Promise((resolve) => {
    if (!img || !img.isConnected || img.complete) return resolve()
    img.addEventListener('load', resolve, { once: true })
    img.addEventListener('error', resolve, { once: true })
  })
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))
