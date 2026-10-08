# 2. Technical Requirements Document — KVIST

## 1. Overview
This doc covers the tools and infrastructure for the KVIST landing page. The site is a static, animation-heavy single page. The stack is kept minimal: one HTML document, one CSS entry, and ES modules for behaviour, bundled by Vite.

## 2. Technical Goals
- **Fast:** no framework runtime. GSAP and Lenis are the only runtime deps (~75KB gz combined).
- **Maintainable:** one JS module per section and one CSS partial per section, all keyed to the class contract in `03-App-Flow.md §6`.
- **Robust:** if an image is missing, the page still works. If JS is off, all content is visible (animations only *hide* content when the `html.js` class is present).
- **Accessible motion:** every effect respects `prefers-reduced-motion` and only runs pointer effects on `(hover: hover)` devices.

## 3. Technology Stack
| Area | Tool / Technology | Purpose |
|---|---|---|
| Frontend | HTML5 + modern CSS (custom properties, `clamp()`, nesting not required) | Markup and styling, no CSS framework |
| Build | Vite 5.x | Dev server, bundling, hashed assets, `public/` for images |
| Animation | GSAP 3.12.x + ScrollTrigger (npm `gsap`) | Timelines, scroll-scrubbed and pinned effects, `quickTo`, `matchMedia` |
| Smooth scroll | Lenis 1.1.x (npm `lenis`) | Inertia scroll synced to `gsap.ticker` |
| Fonts | Google Fonts: Anton, Instrument Sans (400/500/600), DM Mono (400/500) | Display, body, labels |
| Icons | Inline SVG (hand-written, stroke 1.5) | Search, cart, arrows, socials |
| Hosting | Vercel (static) or Netlify | Auto deploy from Git |
| Domain & DNS | Owner's registrar → Vercel DNS | Custom domain + HTTPS |
| Form Handling / Email | `mailto:` / `tel:` links | No backend |
| Analytics | Optional: Vercel Web Analytics (cookieless) | Page views |
| Version Control | Git + GitHub | Source of truth, Vercel integration |

## 4. Integrations & APIs
| Service | What it's used for | Keys / env vars needed |
|---|---|---|
| Google Fonts | Webfonts with `display=swap` + preconnect | none |
| Google Nano Banana (Gemini image) | Generating the 20 site images (offline, by the owner) | none in code |

## 5. Non-Functional Requirements
- **Performance:**
  - LCP < 2.5s on 4G mobile. The hero image gets `fetchpriority="high"`. Every other image gets `loading="lazy"` and `decoding="async"`.
  - Images are WebP, ≤ 200KB each (hero cutouts ≤ 150KB), with explicit `width`/`height` attributes.
  - Animate only `transform`/`opacity` (plus the `--draw` custom prop on perks), with `will-change` only on the ticker and pinned media.
- **Security:** static site with no secrets and no third-party scripts besides fonts. Add a CSP header in `vercel.json` (`default-src 'self'; font-src fonts.gstatic.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data:`).
- **SEO:**
  - Title "KVIST — Furniture for slow living", meta description, Open Graph and Twitter card using `og.jpg` (1200×630).
  - Semantic landmarks (`header`, `main`, `section` with `aria-labelledby`, `footer`), one `h1`, plus `robots.txt` and `sitemap.xml`.
- **Accessibility:**
  - WCAG 2.1 AA contrast. Focus-visible rings.
  - Split letters use `aria-hidden` spans plus an `aria-label` on the line.
  - The hero rail is a `role="tablist"` with roving tabindex and arrow keys.
  - The burger has `aria-expanded`. The cart counter has a live `aria-label`. Hit targets are ≥ 44px.

## 6. Environments & Deployment
- **Local:** `npm install`, then `npm run dev` (Vite at http://localhost:5173).
- **Preview:** every PR gets a Vercel preview URL.
- **Production:** merging to `main` triggers a Vercel production deploy. Build command `npm run build`, output `dist/`.
- **Supported browsers:** last 2 versions of Chrome, Edge, Firefox and Safari, plus iOS Safari 16+.
