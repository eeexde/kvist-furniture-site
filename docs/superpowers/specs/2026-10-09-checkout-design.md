# KVIST Checkout — Design Spec

Date: 2026-10-09
Status: Draft, awaiting review

## 1. Intent

Turn the KVIST landing page's decorative cart into a working shop flow for a **portfolio demo**: add to cart, review in a drawer, check out on a branded page, and pay through **Stripe in test mode (sandbox) only**. No real money moves.

**Success looks like:**
- A visitor can add any of the 7 priced products, edit the cart, and complete a test payment with card `4242 4242 4242 4242`.
- The checkout looks and moves like the rest of KVIST: same tokens, fonts, header, footer, Lenis scroll, reveals, magnetic buttons.
- Declined cards, 3DS challenges, an empty cart and missing Stripe keys are all handled with designed states.
- `npm run dev -- --host` still works on the LAN with no extra tools; Vercel deploy works unchanged apart from env vars.

**Constraints:**
- Existing landing-page design and animations must not change, other than the cart counter now persisting and three new `+` buttons on the Loved cards.
- Secret key never reaches the browser or git.
- Prices are decided on the server, never trusted from the client.

**Out of scope:** real payments/live keys, orders database, inventory/stock decrements, accounts, tax calculation, discount codes, shipping rate options, emails/receipts (Stripe test mode sends none to customers anyway), product detail pages.

## 2. Decisions

| Topic | Choice | Why |
| --- | --- | --- |
| Payment UI | Stripe **Payment Element**, embedded on our page | Keeps KVIST design through the whole flow; styled with the Appearance API |
| Cart entry | Drawer from cart icon, then `/checkout.html` | Realistic shop feel |
| Server | One Vercel Node function `api/create-payment-intent.js` | Minimal server code, deploys with the static site |
| Local dev | Vite plugin in `vite.config.js` mounts the same handler at `/api/*` | `npm run dev` keeps working on LAN; no Vercel CLI needed |
| Delivery | Free (matches "White-glove delivery" copy) | No shipping logic |
| Currency | USD, integer cents | Matches site prices |

## 3. Architecture

```
index.html ──(+ click)──► store.js ◄──── drawer.js (edit qty / remove)
                             │                 │
                             │ localStorage     └─ "Checkout" ─► checkout.html
                             ▼                                        │
                       cart counter                                   ▼
                                                     checkout.js ──POST {items}──► /api/create-payment-intent
                                                          │                         (prices from catalog)
                                                          ◄──────── clientSecret ───┘
                                                          │
                                                Stripe Payment Element ──confirmPayment──► Stripe (test)
                                                          │
                                                return_url ─► checkout.html?payment_intent=… ─► success view
```

### Files

New:
- `src/data/products.js` — catalog, shared by browser and server.
- `src/js/store.js` — cart state.
- `src/js/drawer.js`, `src/styles/drawer.css` — cart drawer.
- `checkout.html`, `src/checkout.js` (entry), `src/js/checkout.js`, `src/styles/checkout.css` — checkout page.
- `api/create-payment-intent.js` — Vercel function.
- `api/_lib/pricing.js` — pure `priceItems(items)` used by the function (and tests).
- `vite.config.js` — multi-page input + dev `/api` middleware.
- `.env.example` — documents env vars, no values.
- `tests/store.test.js`, `tests/pricing.test.js`.

Changed:
- `index.html` — `data-id` on the 4 arrival `+` buttons; `+` buttons on the 3 Loved cards; drawer markup.
- `src/js/cart.js` — counter reads/writes through `store.js`; fly origin also supports `.lcard`.
- `src/js/index.js` — `initDrawer()`; open drawer when URL has `?cart=open`.
- `src/main.js` — import `drawer.css`.
- `src/styles/loved.css` — position the new `+` button.
- `.gitignore` — add `.env`, `.env.local`.
- `vercel.json` — add `payment=(self "https://js.stripe.com")` to `Permissions-Policy`.
- `package.json` — `stripe`, `@stripe/stripe-js`, `vitest`; `"test": "vitest run"`.
- `kvist-spec/01-PRD.md`, `03-App-Flow.md`, `05-Backend-Schema.md` — move cart/checkout into scope.

## 4. Units

### 4.1 Catalog — `src/data/products.js`

```js
export const PRODUCTS = {
  'stubbe-stool':   { name: 'Stubbe Oak Stool',   price: 22000,  image: '/images/arr-stool.webp' },
  'sky-pendant':    { name: 'Sky Paper Pendant',  price: 18000,  image: '/images/arr-pendant.webp' },
  'lin-cushion':    { name: 'Lin Linen Cushion',  price: 5800,   image: '/images/arr-cushion.webp' },
  'skal-bowl':      { name: 'Skål Ceramic Bowl',  price: 4400,   image: '/images/arr-bowl.webp' },
  'fjell-chair':    { name: 'Fjell Lounge Chair', price: 129000, image: '/images/best-chair.webp' },
  'myk-throw':      { name: 'Myk Wool Throw',     price: 14800,  image: '/images/best-throw.webp' },
  'glod-lamp':      { name: 'Glød Table Lamp',    price: 24000,  image: '/images/best-lamp.webp' },
}
export const MAX_QTY = 10
export const formatPrice = (cents) => …  // "$1,290" (no decimals when whole dollars)
```
Prices are the current sale prices on the page. Plain ESM with no browser APIs, so the Node function can import it.

### 4.2 Store — `src/js/store.js`

- Storage key `kvist-cart`, value `[{ id, qty }]`.
- API: `getItems()`, `add(id)`, `setQty(id, qty)`, `remove(id)`, `clear()`, `count()`, `subtotal()`, `onChange(fn)`.
- `qty` clamped to `1..MAX_QTY`; `setQty(id, 0)` removes. Unknown ids are ignored on add and dropped on load.
- Every mutation saves and dispatches `cart:change` on `window`. A `storage` event listener syncs other tabs.
- All `localStorage` access in try/catch; on failure the cart works in memory for the session.

### 4.3 Add to cart — `cart.js` changes

- `+` buttons carry `data-add data-id="…"`. Click calls `store.add(id)` then runs the existing fly animation unchanged.
- Fly origin: `.product__media` inside `.product`, or `.lcard__media` inside `.lcard`.
- Counter shows `store.count()` on load (no pop) and on each `cart:change`. Pop + wiggle only on adds.
- `aria-label` stays "Cart, N item(s)". `has-items` class follows `count() > 0`.

### 4.4 Loved card `+` buttons

Same `.product__add` look as arrival cards, placed in `.lcard__cap` next to the price. `aria-label="Add Fjell Lounge Chair to cart"`. 44px hit area.

### 4.5 Cart drawer — `drawer.js`, `drawer.css`

Markup (in `index.html` only; checkout has its own summary):
```
aside.drawer[role=dialog][aria-modal=true][aria-labelledby=drawer-h][hidden]
  .drawer__scrim
  .drawer__panel
    header: h2#drawer-h "Your cart" + close button
    ul.drawer__list > li.drawer__item (img, name, unit price, qty − n +, remove, line total)
    .drawer__empty "Your cart is empty." + "Keep browsing" button
    footer: subtotal, "Delivery: Free", a.btn "Checkout" [data-magnetic] → /checkout.html
```
- Open: cart icon click. Close: close button, scrim click, `Esc`.
- Motion: scrim fades in (0.4s); panel `xPercent 100 → 0`, `power3.out`, 0.7s; items stagger `y 24 → 0, opacity` 0.06s apart. Close reverses faster (0.45s). Lenis paused while open.
- Panel colours: cream background, ink text, pine Checkout button (existing `.btn` styles).
- Focus: moves to close button on open; Tab trapped inside; returns to cart icon on close. `hidden` removed during open, restored after close animation.
- Reduced motion: no transforms, instant show/hide.
- List re-renders on `cart:change`. Qty buttons disabled at 1 (−) and `MAX_QTY` (+); remove is a separate text button.

### 4.6 Checkout page — `checkout.html`

Layout (≥ 900px two columns, below that one column with summary first, collapsed into a `<details>` "Order summary · $X"):

Left — `form.co__form` (novalidate, custom messages):
1. **Contact** — email.
2. **Delivery** — full name, address, apartment (optional), city, postal code, country (select; default United States).
3. **Payment** — Stripe Payment Element mounted in `#payment-element`. Above it a sandbox note: "Test mode. Use card 4242 4242 4242 4242, any future date, any CVC."
4. Pay button `button.btn.co__pay[data-magnetic]` "Pay $X". Shows a spinner and is disabled while processing.
5. `p.co__error[role=alert]` for payment errors.

Right — `aside.co__summary` (sticky): item rows (thumb, name, qty, line total), subtotal, delivery Free, total. An "Edit cart" link goes to `/?cart=open`, which opens the drawer on load.

Header: same brand logo linking to `/`, plus "Back to shop" link. No nav menu. Footer: same footer as index.

Motion: existing `reveals.js` patterns (headings line-rise, blocks fade-up), summary rows stagger in, magnetic Pay button. Lenis smooth scroll.

### 4.7 Checkout flow — `src/js/checkout.js`

1. Read cart. Empty → show `.co__empty` ("Nothing here yet" + "Back to shop") and stop.
2. No `VITE_STRIPE_PUBLISHABLE_KEY` → render form and summary, replace the payment block with a "Stripe isn't configured — add test keys to .env" notice; Pay disabled.
3. `POST /api/create-payment-intent` with `{ items }`. On non-200 show the error notice with a Retry button.
4. Load Stripe (`loadStripe`), create `elements({ clientSecret, appearance })`, mount Payment Element.
5. Submit: validate own fields (inline messages, focus first invalid), then `stripe.confirmPayment({ elements, confirmParams: { return_url, receipt_email, shipping: { name, address } } })`.
6. Error → show `error.message` in `.co__error`, re-enable button.
7. Return (`?payment_intent_client_secret=…`) → `stripe.retrievePaymentIntent`. `succeeded` → success view, `store.clear()`. `processing` → "Payment processing" view. `requires_payment_method` → back to form with "Payment failed, try another card."

If the cart changes in another tab while the page is open, the summary updates and the PaymentIntent is re-created.

**Appearance API** maps KVIST tokens: `colorPrimary` `--c-pine` (#2B3A31), `colorBackground` `--c-paper` (#F7F4EE), `colorText` `--c-ink` (#1C211D), `colorDanger` `--c-error` (#B23B2E), `fontFamily` Instrument Sans (loaded via `fonts: [{ cssSrc }]` from the same Google Fonts URL the site uses), `borderRadius` 14px (`--r-thumb`), `spacingUnit` 4px. Our own inputs use the same visual rules so Stripe fields look native.

**Success view** — replaces the form: big heading "Thank you" with the existing line-rise reveal, order reference = last 8 chars of the PaymentIntent id uppercased (`KV-XXXXXXXX`), items and total, delivery name/address echo, "Back to shop" button. Small celebration: the summary thumbnails rise and settle with `back.out` (reduced motion: none).

### 4.8 Server — `api/create-payment-intent.js`

```
POST /api/create-payment-intent
body: { items: [{ id: string, qty: integer }] }
200: { clientSecret, amount }
400: { error } — bad JSON, empty list, unknown id, qty not 1..10, more than 20 lines
405: non-POST
500: { error: "Payment setup failed" } — Stripe error (details only in server log)
503: { error: "Stripe not configured" } — no STRIPE_SECRET_KEY
```
- `priceItems(items)` (pure, `api/_lib/pricing.js`) validates and returns `{ amount, lines }` using `PRODUCTS`.
- Refuses to run with a live key: if `STRIPE_SECRET_KEY` does not start with `sk_test_`, return 503 "Sandbox only".
- Creates PaymentIntent: `amount`, `currency: 'usd'`, `automatic_payment_methods: { enabled: true }`, `metadata: { cart: "id×qty,…" }`, `description: "KVIST demo order"`.
- Default export `(req, res)` handler — Vercel Node runtime signature. Body read from `req.body` if parsed, else streamed and parsed.

### 4.9 Local dev — `vite.config.js`

- `build.rollupOptions.input`: `index.html`, `checkout.html`.
- Plugin `apiDev()` with `configureServer`: loads `.env` via Vite `loadEnv(mode, cwd, '')` into `process.env`, then for `/api/<name>` requests `ssrLoadModule('/api/<name>.js')` and calls its default export with Node `req`/`res` (adds `res.status().json()` helpers to match Vercel). Only active in dev.

### 4.10 Env

`.env.example`:
```
# Stripe TEST keys only — https://dashboard.stripe.com/test/apikeys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```
On Vercel: same two vars in Project → Settings → Environment Variables.

## 5. Security

- Secret key only in `process.env` on the server; `.env` gitignored; client only gets `VITE_` vars.
- Amount computed server-side from the catalog; client prices ignored.
- Live keys refused by the function.
- Input caps (20 lines, qty ≤ 10) keep the endpoint from creating absurd intents.
- No new third-party scripts beyond Stripe.js loaded by `@stripe/stripe-js` from `js.stripe.com` (required by Stripe). Existing `X-Frame-Options: SAMEORIGIN` only governs framing *our* pages, so Stripe's iframes are unaffected. `Permissions-Policy` gets `payment=(self "https://js.stripe.com")` so wallet buttons can work.

## 6. Accessibility

- Drawer: dialog semantics, focus trap, Esc, focus return, live region announcing "Added Stubbe Oak Stool. Cart, 2 items."
- Form: visible labels, `autocomplete` attributes, `aria-invalid` + `aria-describedby` for errors, error summary focus on submit failure.
- All targets ≥ 44px; reduced motion respected everywhere; colour contrast uses existing tokens.

## 7. Testing

Automated (Vitest, Node env):
- `store.test.js` — add, increment, clamp to 10, setQty 0 removes, unknown id ignored, corrupt storage recovers, count/subtotal.
- `pricing.test.js` — correct amount for mixed cart, rejects unknown id, qty 0/11/1.5/"2", empty list, >20 lines; ignores any client `price` field.

Manual (browser, test mode):
- `4242 4242 4242 4242` → success view, cart cleared, counter 0.
- `4000 0000 0000 9995` → declined message, can retry.
- `4000 0025 0000 3155` → 3DS modal, complete → success; fail → error.
- Empty cart, no keys, API down (stop server mid-flow).
- Keyboard-only run through drawer and checkout; reduced-motion run; 375px phone width over LAN.
- Landing page regression: intro, hero, scroll sections, fly-to-cart unchanged.
- `npm run build` then `npm run preview` loads both pages.

## 8. Docs

Update `kvist-spec/01-PRD.md` (scope), `03-App-Flow.md` (cart + checkout journeys, DOM contract for drawer/checkout), `05-Backend-Schema.md` (catalog, cart storage, API endpoint, env vars).
