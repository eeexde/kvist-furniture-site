// Server-side cart pricing. Validates the client's [{ id, qty }] and prices it from the catalog;
// any price the client sends is ignored. `_lib` is not routed by Vercel.
import { PRODUCTS, MAX_QTY, MAX_LINES, isProduct } from '../../src/data/products.js'

export class PricingError extends Error {}

export function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new PricingError('Cart is empty')
  if (items.length > MAX_LINES) throw new PricingError('Too many items')

  const seen = new Set()
  const lines = items.map((line) => {
    const id = line && line.id
    if (!isProduct(id)) throw new PricingError('Unknown product')
    if (seen.has(id)) throw new PricingError('Duplicate product')
    seen.add(id)
    const qty = line.qty
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new PricingError('Invalid quantity')
    return { id, qty, unit: PRODUCTS[id].price }
  })

  const amount = lines.reduce((sum, l) => sum + l.unit * l.qty, 0)
  return { amount, lines }
}
