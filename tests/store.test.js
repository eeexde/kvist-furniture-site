import { describe, it, expect, vi } from 'vitest'
import { createStore, STORAGE_KEY } from '../src/js/store.js'
import { MAX_QTY } from '../src/data/products.js'

function memStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v)
    },
    data,
  }
}

describe('cart store', () => {
  it('starts empty', () => {
    const s = createStore(memStorage())
    expect(s.getItems()).toEqual([])
    expect(s.count()).toBe(0)
    expect(s.subtotal()).toBe(0)
  })

  it('adds and increments, persisting to storage', () => {
    const st = memStorage()
    const s = createStore(st)
    expect(s.add('skal-bowl')).toBe(true)
    expect(s.add('skal-bowl')).toBe(true)
    expect(s.add('lin-cushion')).toBe(true)
    expect(s.getItems()).toEqual([
      { id: 'skal-bowl', qty: 2 },
      { id: 'lin-cushion', qty: 1 },
    ])
    expect(s.count()).toBe(3)
    expect(s.subtotal()).toBe(4400 * 2 + 5800)
    expect(JSON.parse(st.data[STORAGE_KEY])).toEqual(s.getItems())
  })

  it('ignores unknown ids', () => {
    const s = createStore(memStorage())
    expect(s.add('nope')).toBe(false)
    expect(s.add('__proto__')).toBe(false)
    expect(s.count()).toBe(0)
  })

  it('caps quantity at MAX_QTY', () => {
    const s = createStore(memStorage())
    for (let i = 0; i < MAX_QTY; i++) s.add('skal-bowl')
    expect(s.add('skal-bowl')).toBe(false)
    expect(s.qtyOf('skal-bowl')).toBe(MAX_QTY)
    s.setQty('skal-bowl', 99)
    expect(s.qtyOf('skal-bowl')).toBe(MAX_QTY)
  })

  it('setQty 0 removes, NaN is ignored, fractions floor', () => {
    const s = createStore(memStorage())
    s.add('skal-bowl')
    s.setQty('skal-bowl', 'abc')
    expect(s.qtyOf('skal-bowl')).toBe(1)
    s.setQty('skal-bowl', 3.7)
    expect(s.qtyOf('skal-bowl')).toBe(3)
    s.setQty('skal-bowl', 0)
    expect(s.getItems()).toEqual([])
  })

  it('remove and clear', () => {
    const s = createStore(memStorage())
    s.add('skal-bowl')
    s.add('lin-cushion')
    s.remove('skal-bowl')
    expect(s.getItems()).toEqual([{ id: 'lin-cushion', qty: 1 }])
    s.clear()
    expect(s.count()).toBe(0)
  })

  it('getItems returns copies', () => {
    const s = createStore(memStorage())
    s.add('skal-bowl')
    s.getItems()[0].qty = 9
    expect(s.qtyOf('skal-bowl')).toBe(1)
  })

  it('notifies listeners with the change type and supports unsubscribe', () => {
    const s = createStore(memStorage())
    const fn = vi.fn()
    const off = s.onChange(fn)
    s.add('skal-bowl')
    s.setQty('skal-bowl', 2)
    s.remove('skal-bowl')
    expect(fn.mock.calls.map((c) => c[0].type)).toEqual(['add', 'set', 'remove'])
    off()
    s.add('skal-bowl')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('sanitizes stored data', () => {
    const st = memStorage({
      [STORAGE_KEY]: JSON.stringify([
        { id: 'skal-bowl', qty: 2 },
        { id: 'retired-sofa', qty: 1 },
        { id: 'lin-cushion', qty: '3' },
        { id: 'myk-throw', qty: -1 },
        { id: 'glod-lamp', qty: 1.5 },
        { id: 'skal-bowl', qty: 20 },
        null,
        'junk',
      ]),
    })
    const s = createStore(st)
    expect(s.getItems()).toEqual([{ id: 'skal-bowl', qty: MAX_QTY }])
  })

  it('recovers from non-JSON storage', () => {
    const s = createStore(memStorage({ [STORAGE_KEY]: '{not json' }))
    expect(s.getItems()).toEqual([])
  })

  it('works in memory when storage throws', () => {
    const bad = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const s = createStore(bad)
    expect(s.add('skal-bowl')).toBe(true)
    expect(s.count()).toBe(1)
  })

  it('works with null storage', () => {
    const s = createStore(null)
    s.add('skal-bowl')
    expect(s.count()).toBe(1)
  })

  it('reload() picks up external writes and notifies', () => {
    const st = memStorage()
    const a = createStore(st)
    const b = createStore(st)
    const fn = vi.fn()
    b.onChange(fn)
    a.add('fjell-chair')
    b.reload()
    expect(b.getItems()).toEqual([{ id: 'fjell-chair', qty: 1 }])
    expect(fn).toHaveBeenCalledWith({ type: 'sync' })
  })
})
