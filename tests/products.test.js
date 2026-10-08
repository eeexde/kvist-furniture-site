import { describe, it, expect } from 'vitest'
import { PRODUCTS, MAX_QTY, MAX_LINES, isProduct, formatPrice } from '../src/data/products.js'

describe('catalog', () => {
  it('has the 7 shop products with integer cent prices', () => {
    expect(Object.keys(PRODUCTS).sort()).toEqual(
      ['fjell-chair', 'glod-lamp', 'lin-cushion', 'myk-throw', 'skal-bowl', 'sky-pendant', 'stubbe-stool'],
    )
    for (const p of Object.values(PRODUCTS)) {
      expect(Number.isInteger(p.price)).toBe(true)
      expect(p.price).toBeGreaterThan(0)
      expect(p.image).toMatch(/^\/images\/.+\.webp$/)
    }
    expect(PRODUCTS['fjell-chair'].price).toBe(129000)
  })

  it('exposes limits', () => {
    expect(MAX_QTY).toBe(10)
    expect(MAX_LINES).toBe(20)
  })

  it('isProduct only accepts own keys', () => {
    expect(isProduct('skal-bowl')).toBe(true)
    expect(isProduct('toString')).toBe(false)
    expect(isProduct('__proto__')).toBe(false)
    expect(isProduct(undefined)).toBe(false)
  })
})

describe('formatPrice', () => {
  it('drops cents for whole dollars', () => {
    expect(formatPrice(129000)).toBe('$1,290')
    expect(formatPrice(4400)).toBe('$44')
    expect(formatPrice(0)).toBe('$0')
  })
  it('keeps two decimals otherwise', () => {
    expect(formatPrice(5850)).toBe('$58.50')
    expect(formatPrice(1)).toBe('$0.01')
  })
})
