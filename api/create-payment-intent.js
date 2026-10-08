// POST /api/create-payment-intent — prices the cart on the server and creates a Stripe
// PaymentIntent. Test mode only: live keys are refused.
import Stripe from 'stripe'
import { priceItems, PricingError } from './_lib/pricing.js'

const MAX_BODY = 10_000

async function readBody(req) {
  const b = req.body
  if (b !== undefined && b !== null) {
    if (Buffer.isBuffer(b)) return JSON.parse(b.toString('utf8') || '{}')
    if (typeof b === 'string') return JSON.parse(b || '{}')
    return b
  }
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new Error('Body too large')
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return text ? JSON.parse(text) : {}
}

export function createHandler({ getStripe }) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const key = process.env.STRIPE_SECRET_KEY
    if (!key) return res.status(503).json({ error: 'Stripe not configured' })
    if (!key.startsWith('sk_test_')) return res.status(503).json({ error: 'Sandbox only: use a Stripe test key' })

    let body
    try {
      body = await readBody(req)
    } catch {
      return res.status(400).json({ error: 'Invalid request body' })
    }

    let priced
    try {
      priced = priceItems(body && body.items)
    } catch (err) {
      if (err instanceof PricingError) return res.status(400).json({ error: err.message })
      throw err
    }

    try {
      const intent = await getStripe(key).paymentIntents.create({
        amount: priced.amount,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        description: 'KVIST demo order',
        metadata: { cart: priced.lines.map((l) => `${l.id}×${l.qty}`).join(',') },
      })
      return res.status(200).json({ clientSecret: intent.client_secret, amount: priced.amount })
    } catch (err) {
      console.error('[api] PaymentIntent create failed:', err && err.message)
      return res.status(500).json({ error: 'Payment setup failed' })
    }
  }
}

let client = null
export default createHandler({
  getStripe: (key) => (client ??= new Stripe(key)),
})
