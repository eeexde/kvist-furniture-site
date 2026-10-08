// Checkout form rules and Stripe mapping. Pure functions, no DOM.

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PH', name: 'Philippines' },
  { code: 'AU', name: 'Australia' },
]

const MAX_LEN = 120
const filled = (v) => v.length > 0 && v.length <= MAX_LEN

const RULES = {
  email: [(v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= MAX_LEN, 'Enter an email like name@example.com'],
  name: [filled, 'Enter your full name'],
  line1: [filled, 'Enter your street address'],
  line2: [(v) => v.length <= MAX_LEN, 'Keep this under 120 characters'],
  city: [filled, 'Enter your city'],
  postal: [(v) => /^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/.test(v), 'Enter a valid postal code'],
  country: [(v) => COUNTRIES.some((c) => c.code === v), 'Choose a country'],
}

const clean = (values, key) => String((values && values[key]) ?? '').trim()

/** Returns { field: message } for every invalid field; {} when the form is valid. */
export function validate(values) {
  const errors = {}
  for (const [key, [ok, message]] of Object.entries(RULES)) {
    if (!ok(clean(values, key))) errors[key] = message
  }
  return errors
}

export function toShipping(values) {
  const address = {
    line1: clean(values, 'line1'),
    city: clean(values, 'city'),
    postal_code: clean(values, 'postal'),
    country: clean(values, 'country'),
  }
  const line2 = clean(values, 'line2')
  if (line2) address.line2 = line2
  return { name: clean(values, 'name'), address }
}

export const orderRef = (intentId) => `KV-${String(intentId).slice(-8).toUpperCase()}`

export function resultView(status) {
  if (status === 'succeeded') return 'success'
  if (status === 'processing' || status === 'requires_capture') return 'processing'
  return 'failed'
}
