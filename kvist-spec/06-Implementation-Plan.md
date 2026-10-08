# 6. Implementation Plan — KVIST

## 1. Overview
This plan sets what gets built and in what order. Markup/CSS and animation JS are built **in parallel by separate agents** against the class contract in `03-App-Flow.md §6`. A QA pass and an image swap follow.

## 2. Goals
- Working site with placeholders: day 1.
- Real images swapped in: whenever the owner finishes generating them. Only files change, no code.
- Production deploy to Vercel: after QA passes.

## 3. Implementation Phases
| Phase | What Gets Built | Key Deliverables | Timeline |
|---|---|---|---|
| 1. Planning | Spec docs, content deck, image prompts | `kvist-spec/*`, `IMAGE-PROMPTS.md` | Day 1 |
| 2. Scaffold | Vite project, deps, folder layout, inline head script, fonts | `package.json`, `index.html` shell, `src/main.js`, `src/styles/` | Day 1 |
| 3a. Markup + CSS (Agent A) | Full `index.html` sections and all CSS partials, responsive, placeholder system, no-JS-safe | `index.html`, `src/styles/*.css` | Day 1 |
| 3b. Motion JS (Agent B) | Lenis, intro, hero swap/tilt, all ScrollTriggers, fly-to-cart, magnetic, ticker, nav, reduced motion | `src/js/*.js` | Day 1 (parallel with 3a) |
| 4. Backend | None (static) | — | — |
| 5. Testing | Build, browser QA at 1440 and 390 px, reduced motion, Lighthouse, console clean | QA report and fixes | Day 1–2 |
| 6. Deployment | Git repo, Vercel project, `vercel.json` headers, domain | Live URL | When owner is ready |

### File layout
```
index.html
public/images/            (20 files from appendix-content.md; .gitkeep until generated)
public/favicon.svg
src/main.js               imports styles + js/index.js
src/styles/
  tokens.css base.css nav.css hero.css ticker.css products.css cats.css
  loved.css immerse.css why.css reviews.css cta.css footer.css
src/js/
  index.js        boot: reduced-motion check, image loader, split text, init modules, error fallback
  utils.js        $, $$, prefersReduced, canHover
  scroll.js       Lenis + gsap.ticker bridge, anchor scrolling, export lenis
  nav.js          burger, hide on scroll, active link
  intro.js        hero intro timeline
  hero.js         rail swap + pointer tilt + hero scrub
  ticker.js       marquee
  reveals.js      line reveals, head buttons, products, cats, loved, perks, reviews, cta, footer
  pinned.js       gsap.matchMedia: categories scrub + immerse pin (desktop/mobile)
  cart.js         fly-to-cart + counter
  magnetic.js     magnetic buttons
```

### CSS rule for "hidden until animated"
Initial hidden states live in **JS** (`gsap.set`), not CSS. The one exception is under `html.js:not(.reduced)`: CSS may hide hero copy, title and rail (`opacity:0`) and the header (`transform: translateY(-100%)`) to avoid a flash before the intro. Without JS, everything is visible.

## 4. Milestones
| Milestone | Definition of done | Target |
|---|---|---|
| M1 Spec | 6 docs + appendix + prompts reviewed | Day 1 |
| M2 Static page | All sections are visible and responsive with placeholders, and nothing breaks with JS disabled | Day 1 |
| M3 Motion | Every row in Design Brief §8 is observable, with no console errors | Day 1 |
| M4 QA | Lighthouse targets met, reduced motion verified, 390px has no horizontal scroll | Day 2 |
| M5 Images | 20 images in place, cutouts transparent | Owner-dependent |
| M6 Live | Vercel production URL | Owner-dependent |

## 5. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Markup and JS agents diverge on class names | A single contract in App Flow §6. QA greps every JS selector against `index.html`. |
| Nano Banana can't output transparent PNGs | Prompts ask for a pure flat background. Remove it with remove.bg / Photoshop / Canva, then export WebP. Fallback: a `mix-blend-mode: multiply` class on the cutouts. |
| Pinned section jumps on mobile URL-bar resize | Ignore height-only resizes. Pin only on ≥ 821px. |
| Heavy images hurt LCP | WebP, size caps, lazy loading, `fetchpriority="high"` on the hero only |
| Intro blocks the user too long | Intro ≤ 3.2s. Any click/keypress after 1.2s fast-forwards it (`tl.progress(1)`). |

## 6. First Prompt for Your AI Coding Tool
> Read all docs in `/kvist-spec` (01–06 plus `appendix-content.md`). Start Phase 2:
> - Scaffold a Vite vanilla-JS project in the repo root and install `gsap` and `lenis`.
> - Create the file layout from §3.
> - Add the Google Fonts links and the inline `<head>` script that adds `js` / `coarse` / `reduced` classes to `<html>`.
> - Add `public/images/.gitkeep`.
>
> Do not build sections yet. Then run Phase 3a and 3b in parallel, following `03-App-Flow.md §6` exactly.
