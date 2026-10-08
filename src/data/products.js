// Product catalog — the single source of truth for names and prices (in cents).
// Imported by the browser (cart, drawer, checkout) and by the payment API, so no DOM here.

export const PRODUCTS = Object.freeze({
  'stubbe-stool': { name: 'Stubbe Oak Stool', price: 22000, image: '/images/arr-stool.webp' },
  'sky-pendant': { name: 'Sky Paper Pendant', price: 18000, image: '/images/arr-pendant.webp' },
  'lin-cushion': { name: 'Lin Linen Cushion', price: 5800, image: '/images/arr-cushion.webp' },
  'skal-bowl': { name: 'Skål Ceramic Bowl', price: 4400, image: '/images/arr-bowl.webp' },
  'fjell-chair': { name: 'Fjell Lounge Chair', price: 129000, image: '/images/best-chair.webp' },
  'myk-throw': { name: 'Myk Wool Throw', price: 14800, image: '/images/best-throw.webp' },
  'glod-lamp': { name: 'Glød Table Lamp', price: 24000, image: '/images/best-lamp.webp' },
})

export const MAX_QTY = 10
export const MAX_LINES = 20

export const isProduct = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PRODUCTS, id)

/** 129000 → "$1,290", 5850 → "$58.50". */
export function formatPrice(cents) {
  const whole = cents % 100 === 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100)
}
