// Cart state: [{ id, qty }] persisted to localStorage, with change listeners and cross-tab sync.
import { PRODUCTS, MAX_QTY, isProduct } from '../data/products.js'

export const STORAGE_KEY = 'kvist-cart'

/** Keep only known products with whole positive quantities; merge duplicates; cap at MAX_QTY. */
function sanitize(raw) {
  if (!Array.isArray(raw)) return []
  const merged = new Map()
  for (const line of raw) {
    if (!line || !isProduct(line.id)) continue
    const qty = line.qty
    if (!Number.isInteger(qty) || qty < 1) continue
    merged.set(line.id, Math.min(MAX_QTY, (merged.get(line.id) || 0) + qty))
  }
  return Array.from(merged, ([id, qty]) => ({ id, qty }))
}

export function createStore(storage) {
  const listeners = new Set()
  let items = load()

  function load() {
    try {
      const raw = storage && storage.getItem(STORAGE_KEY)
      return raw ? sanitize(JSON.parse(raw)) : []
    } catch {
      return []
    }
  }

  function commit(change) {
    try {
      if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* private mode / quota: keep working in memory */
    }
    listeners.forEach((fn) => fn(change))
  }

  return {
    getItems: () => items.map((l) => ({ ...l })),
    count: () => items.reduce((n, l) => n + l.qty, 0),
    subtotal: () => items.reduce((sum, l) => sum + PRODUCTS[l.id].price * l.qty, 0),
    qtyOf: (id) => {
      const line = items.find((l) => l.id === id)
      return line ? line.qty : 0
    },

    add(id) {
      if (!isProduct(id)) return false
      const line = items.find((l) => l.id === id)
      if (line) {
        if (line.qty >= MAX_QTY) return false
        line.qty += 1
      } else {
        items.push({ id, qty: 1 })
      }
      commit({ type: 'add', id })
      return true
    },

    setQty(id, qty) {
      const i = items.findIndex((l) => l.id === id)
      const n = Math.floor(Number(qty))
      if (i < 0 || !Number.isFinite(n)) return
      if (n < 1) items.splice(i, 1)
      else items[i].qty = Math.min(MAX_QTY, n)
      commit({ type: 'set', id })
    },

    remove(id) {
      const before = items.length
      items = items.filter((l) => l.id !== id)
      if (items.length !== before) commit({ type: 'remove', id })
    },

    clear() {
      if (!items.length) return
      items = []
      commit({ type: 'clear' })
    },

    /** Re-read storage (another tab changed it) and notify without writing back. */
    reload() {
      items = load()
      listeners.forEach((fn) => fn({ type: 'sync' }))
    },

    onChange(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const hasWindow = typeof window !== 'undefined'

export const cart = createStore(hasWindow ? browserStorage() : null)

if (hasWindow) {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) cart.reload()
  })
}
