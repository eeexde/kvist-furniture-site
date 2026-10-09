import { describe, it, expect } from 'vitest'
import { COUNTRIES, validate, toShipping, orderRef, resultView } from '../src/js/checkout-form.js'

const good = {
  email: 'ed@example.com',
  name: 'Ed Pasaylo',
  line1: '12 Oak Street',
  line2: '',
  city: 'Manila',
  postal: '1000',
  country: 'PH',
}

describe('validate', () => {
  it('accepts a complete form', () => {
    expect(validate(good)).toEqual({})
  })

  it('trims before checking', () => {
    expect(validate({ ...good, name: '   ' })).toHaveProperty('name')
    expect(validate({ ...good, email: '  ed@example.com  ' })).toEqual({})
  })

  it('flags each missing required field', () => {
    const errs = validate({})
    expect(Object.keys(errs).sort()).toEqual(['city', 'country', 'email', 'line1', 'name', 'postal'])
  })

  it('rejects malformed email', () => {
    for (const email of ['ed', 'ed@', 'ed@x', '@x.com', 'ed @x.com']) {
      expect(validate({ ...good, email })).toHaveProperty('email')
    }
  })

  it('rejects bad postal codes and unknown countries', () => {
    expect(validate({ ...good, postal: '1' })).toHaveProperty('postal')
    expect(validate({ ...good, postal: '12345678901' })).toHaveProperty('postal')
    expect(validate({ ...good, postal: 'SW1A 1AA' })).toEqual({})
    expect(validate({ ...good, country: 'XX' })).toHaveProperty('country')
  })

  it('rejects overlong values', () => {
    expect(validate({ ...good, name: 'a'.repeat(121) })).toHaveProperty('name')
  })
})

describe('toShipping', () => {
  it('maps to Stripe shipping shape and drops empty line2', () => {
    expect(toShipping({ ...good, name: ' Ed Pasaylo ' })).toEqual({
      name: 'Ed Pasaylo',
      address: { line1: '12 Oak Street', city: 'Manila', postal_code: '1000', country: 'PH' },
    })
    expect(toShipping({ ...good, line2: 'Unit 4' }).address.line2).toBe('Unit 4')
  })
})

describe('orderRef', () => {
  it('uses the last 8 chars uppercased', () => {
    expect(orderRef('pi_3PabcDEFghij1234')).toBe('KV-GHIJ1234')
  })
})

describe('resultView', () => {
  it('maps PaymentIntent statuses', () => {
    expect(resultView('succeeded')).toBe('success')
    expect(resultView('processing')).toBe('processing')
    expect(resultView('requires_capture')).toBe('processing')
    expect(resultView('requires_payment_method')).toBe('failed')
    expect(resultView('canceled')).toBe('failed')
    expect(resultView(undefined)).toBe('failed')
  })
})

describe('COUNTRIES', () => {
  it('defaults to US first', () => {
    expect(COUNTRIES[0].code).toBe('US')
  })
})
