import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Readable } from 'node:stream'
import { createHandler } from '../api/create-payment-intent.js'

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(obj) {
      this.body = obj
      return this
    },
    setHeader(k, v) {
      this.headers[k] = v
    },
  }
}

function fakeStripe(impl) {
  const create = vi.fn(impl || (async (params) => ({ id: 'pi_123', client_secret: 'pi_123_secret_abc', ...params })))
  return { create, getStripe: () => ({ paymentIntents: { create } }) }
}

const post = (body) => ({ method: 'POST', body })
const items = [{ id: 'skal-bowl', qty: 2 }]

describe('POST /api/create-payment-intent', () => {
  const env = process.env.STRIPE_SECRET_KEY
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
  })
  afterEach(() => {
    if (env === undefined) delete process.env.STRIPE_SECRET_KEY
    else process.env.STRIPE_SECRET_KEY = env
  })

  it('405 on non-POST', async () => {
    const res = mockRes()
    await createHandler(fakeStripe())({ method: 'GET' }, res)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('POST')
  })

  it('503 when the key is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const res = mockRes()
    await createHandler(fakeStripe())(post({ items }), res)
    expect(res.statusCode).toBe(503)
    expect(res.body.error).toMatch(/not configured/i)
  })

  it('503 and never calls Stripe with a live key', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_live_real'
    const s = fakeStripe()
    const res = mockRes()
    await createHandler(s)(post({ items }), res)
    expect(res.statusCode).toBe(503)
    expect(res.body.error).toMatch(/sandbox only/i)
    expect(s.create).not.toHaveBeenCalled()
  })

  it('400 on invalid items and never calls Stripe', async () => {
    const s = fakeStripe()
    for (const body of [{}, { items: [] }, { items: [{ id: 'nope', qty: 1 }] }, { items: [{ id: 'skal-bowl', qty: '2' }] }]) {
      const res = mockRes()
      await createHandler(s)(post(body), res)
      expect(res.statusCode).toBe(400)
      expect(typeof res.body.error).toBe('string')
    }
    expect(s.create).not.toHaveBeenCalled()
  })

  it('400 on invalid JSON string body', async () => {
    const res = mockRes()
    await createHandler(fakeStripe())(post('{bad'), res)
    expect(res.statusCode).toBe(400)
  })

  it('creates a PaymentIntent with the server-computed amount', async () => {
    const s = fakeStripe()
    const res = mockRes()
    await createHandler(s)(post({ items: [{ id: 'skal-bowl', qty: 2, price: 1 }] }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ clientSecret: 'pi_123_secret_abc', amount: 8800 })
    const params = s.create.mock.calls[0][0]
    expect(params).toMatchObject({
      amount: 8800,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: 'KVIST demo order',
      metadata: { cart: 'skal-bowl×2' },
    })
  })

  it('reads a streamed JSON body (dev middleware)', async () => {
    const s = fakeStripe()
    const req = Readable.from([Buffer.from(JSON.stringify({ items }))])
    req.method = 'POST'
    const res = mockRes()
    await createHandler(s)(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.amount).toBe(8800)
  })

  it('413 on an oversized streamed body and never calls Stripe', async () => {
    const s = fakeStripe()
    const req = Readable.from([Buffer.alloc(10_001, 'a')])
    req.method = 'POST'
    const res = mockRes()
    await createHandler(s)(req, res)
    expect(res.statusCode).toBe(413)
    expect(s.create).not.toHaveBeenCalled()
  })

  it('400 on an invalid-JSON streamed body', async () => {
    const req = Readable.from([Buffer.from('{bad')])
    req.method = 'POST'
    const res = mockRes()
    await createHandler(fakeStripe())(req, res)
    expect(res.statusCode).toBe(400)
  })

  it('500 with a generic message when Stripe fails', async () => {
    const s = fakeStripe(async () => {
      throw new Error('secret detail')
    })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = mockRes()
    await createHandler(s)(post({ items }), res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Payment setup failed' })
    spy.mockRestore()
  })
})
