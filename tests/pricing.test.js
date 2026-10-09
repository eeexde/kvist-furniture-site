import { describe, it, expect } from 'vitest'
import { priceItems, PricingError } from '../api/_lib/pricing.js'
import { createStore } from '../src/js/store.js'

const bad = (items) => expect(() => priceItems(items)).toThrow(PricingError)

describe('priceItems', () => {
  it('prices a mixed cart from the catalog', () => {
    const { amount, lines } = priceItems([
      { id: 'fjell-chair', qty: 1 },
      { id: 'skal-bowl', qty: 3 },
    ])
    expect(amount).toBe(129000 + 4400 * 3)
    expect(lines).toEqual([
      { id: 'fjell-chair', qty: 1, unit: 129000 },
      { id: 'skal-bowl', qty: 3, unit: 4400 },
    ])
  })

  it('ignores client-sent prices', () => {
    const { amount } = priceItems([{ id: 'fjell-chair', qty: 1, price: 1, unit: 1 }])
    expect(amount).toBe(129000)
  })

  it('charges exactly the store subtotal', () => {
    const s = createStore(null)
    ;['fjell-chair', 'skal-bowl', 'skal-bowl', 'lin-cushion', 'glod-lamp', 'myk-throw', 'sky-pendant', 'stubbe-stool'].forEach(
      (id) => s.add(id),
    )
    expect(priceItems(s.getItems()).amount).toBe(s.subtotal())
  })

  it('rejects bad shapes', () => {
    bad(undefined)
    bad(null)
    bad({})
    bad('fjell-chair')
    bad([])
    bad([null])
  })

  it('rejects unknown and duplicate ids', () => {
    bad([{ id: 'nope', qty: 1 }])
    bad([{ id: '__proto__', qty: 1 }])
    bad([{ id: 42, qty: 1 }])
    bad([
      { id: 'skal-bowl', qty: 1 },
      { id: 'skal-bowl', qty: 1 },
    ])
  })

  it('rejects bad quantities', () => {
    bad([{ id: 'skal-bowl', qty: 0 }])
    bad([{ id: 'skal-bowl', qty: 11 }])
    bad([{ id: 'skal-bowl', qty: 1.5 }])
    bad([{ id: 'skal-bowl', qty: '2' }])
    bad([{ id: 'skal-bowl' }])
  })

  it('rejects more than 20 lines', () => {
    bad(Array.from({ length: 21 }, () => ({ id: 'skal-bowl', qty: 1 })))
  })
})
