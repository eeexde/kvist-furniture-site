# 4. Design Brief — KVIST

## 1. Overview
This doc sets KVIST's visual and motion direction. The look is warm paper backgrounds, a deep pine-green hero panel, tall condensed display type and calm product photography. The motion is confident and physical: products have weight, they bounce and settle.

## 2. Brand Identity
KVIST makes honest, soft-edged furniture for people who stay home on purpose.
**Adjectives:** calm, tactile, assured.
**Not:** sterile minimalism, luxury-gold glam, playful/cartoony, or "tech startup".

Tone of copy: short, warm, concrete sentences. Talk about materials, time and rooms. No exclamation marks.

## 3. Color Palette
| Role | Hex | Usage |
|---|---|---|
| Primary (Pine) | `#2B3A31` | Hero panel, dark buttons, footer background |
| Primary-2 | `#3A4B40` | Panel gradient highlight, hover on dark buttons |
| Secondary (Ochre) | `#B5683C` | Ticker ✦, sale prices, badges, focus ring |
| Background | `#ECE7DF` | Page background |
| Background-2 | `#E3DDD3` | Alternating sections, placeholder base |
| Paper | `#F7F4EE` | Cards, CTA card |
| Cream (on dark) | `#F2EEE5` | Text on pine; `#F2EEE5B8` for muted on pine |
| Text (Ink) | `#1C211D` | Body, headings |
| Muted | `#676C63` | Secondary text, stock labels |
| Line | `#1C211D1F` | Borders, dividers (`#1C211D38` stronger) |
| Success | `#4F7A55` | "In stock" dot |
| Error | `#B23B2E` | Low-stock (< 10) text |

Placeholder gradient (`.ph`): `linear-gradient(135deg, #D8CFC1, #B9AC97)`, with a label in DM Mono 11px uppercase, `#1C211D80`, centred. On pine: `radial-gradient(closest-side, #F2EEE529, transparent)`.

## 4. Typography
| Style | Font | Size / Weight | Use |
|---|---|---|---|
| Hero | Anton | `clamp(3.6rem, 1.2rem + 6.8vw, 8.6rem)` / 400, line-height .9, uppercase | `h1.hero__title` |
| Huge | Anton | `clamp(6rem, 1rem + 24vw, 26rem)` / 400, line-height .8 | Footer wordmark |
| Immerse | Anton | `clamp(3rem, 1rem + 8vw, 9rem)` / 400 uppercase | Immerse words |
| H2 | Anton | `clamp(2rem, 1.3rem + 2.6vw, 3.6rem)` / 400, lh .95, uppercase | Section headings |
| H3 | Instrument Sans | `clamp(1.15rem, 1rem + .6vw, 1.5rem)` / 600 | Card titles |
| Body | Instrument Sans | `clamp(.94rem, .9rem + .22vw, 1.04rem)` / 400, lh 1.55 | Paragraphs |
| Small | Instrument Sans | `clamp(.8rem, .76rem + .2vw, .9rem)` / 500 | Prices, meta |
| Label | DM Mono | `clamp(.75rem, .72rem + .1vw, .8rem)` / 500, uppercase, letter-spacing .12em | Ticker, badges, eyebrow, nav |

## 5. Layout & Spacing
- **Max width:** 1360px, centred, with a side gutter of `clamp(16px, 4vw, 56px)`.
- **Section padding:** `clamp(72px, 10vw, 160px)` top and bottom.
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- **Radius:**
  - Cards: 20px.
  - Buttons: pill (999px).
  - Thumbs: 14px.
  - CTA card: 28px.
  - Images inside cards inherit the card radius.
- **Shadows:** almost none. Use the floor shadow under hero products and `0 30px 60px -30px #1C211D40` on the CTA card.
- **Header:** height `--nav-h` 72px (62px ≤ 820px). Background `#ECE7DFDB` with `backdrop-filter: blur(12px)`.
- **Breakpoints:** 1100, 820 (main mobile switch), 560, 420.
- **Section layouts:**
  - **Hero:** 2 columns on desktop (copy left over the panel, stage right). The panel covers the left 74%. The rail is a vertical column on the far right. ≤ 820: stacked, the panel is full width, and the rail is a horizontal row under the stage.
  - **Products:** 4 columns, then 2 (≤1100), then a horizontal swipe row (≤560).
  - **Best sellers:** 3 columns with the first card taller (grid rows). Stacked on mobile.
  - **Why:** copy left 55%, media right with the small image overlapping the big one's bottom-left.
  - **Reviews:** 3 columns, then a stack.

## 6. UI Components
| Component | Variants | States |
|---|---|---|
| Button | `btn--light` (cream on pine), `btn--dark` (pine on paper), `btn--sm` | default; hover: arrow translates 4px right and background lightens; focus-visible: 2px ochre outline, 3px offset; magnetic follow on hover devices |
| Icon button | search, cart, burger | 44px hit area; hover: background `#1C211D0F`; cart `has-items` shows ochre dot |
| Product card | regular | default; hover: image scale 1.05 (0.8s `--ease-out`) and "+" rotates 90°; `+` focus-visible ring |
| Rail thumb | — | default 60% opacity; `is-on`: full opacity + 2px cream ring; hover: 85% |
| Category chip | — | hover: thumb lifts −6px and label underline draws |
| Best seller card | 3 badge texts | hover: image scale 1.06 |
| Quote card | — | static |
| Nav link | — | hover/`is-here`: underline scaleX 0→1 from left |
| Burger menu | closed/open | open: full-screen pine sheet, links stagger in, `Esc` closes |

## 7. Imagery & Icons
- **Product cutouts** (hero, arrivals, categories):
  - Single object, three-quarter view, soft studio light from the upper left.
  - Shot on a pure background, then the background is removed to a transparent WebP.
  - Must look grounded when the CSS floor shadow sits under it.
- **Lifestyle photos** (best sellers, immerse, why, CTA, footer):
  - Natural daylight Scandinavian interiors, warm, slightly desaturated, with linen/oak/stoneware textures.
  - 35mm-film feel, with no people except hands or the backs of figures.
- **Avatars:** natural-light head-and-shoulders portraits on soft neutral backgrounds.
- **Icons:** inline SVG line icons, 24px grid, stroke 1.5, round caps.
- Full generation prompts are in `../IMAGE-PROMPTS.md`.

## 8. Motion
Global easing token `--ease-out: cubic-bezier(.16,1,.3,1)`. Lenis `lerp: 0.1`, `wheelMultiplier: 1`, `smoothWheel: true`. Lenis is driven by `gsap.ticker` with `lagSmoothing(0)`.

| Effect | Spec |
|---|---|
| Intro (t = seconds) | 0.15: fly img opacity→1 (0.4s), scale→0.09 (0.7s, sine.inOut). The fly img starts translated to the viewport centre. 0.8: x/y→0, scale→1, rotation→0 (1.6s expo.inOut). 1.1: panel scaleX 0→1 (1.3s expo.inOut). 1.45: title `.ch` x from 1em, opacity→1, stagger .035 (1.4s expo.out). 1.9: floor scaleX→1 (1s). 2.0: header y→0. 2.1: sub, button, proof y 30→0 stagger .09; rail items back.out(1.6) stagger .07. 2.3: counter 0→12 (1.8s power2.out). 2.5: tag fades in. At the end: hide the fly img, show slot 0, start Lenis, init magnetic. |
| Hero swap | Out: y 40, scale .8, rotation −7, opacity 0 (0.45s power3.in). Floor scaleX .45 / opacity .3. Tag text yPercent −110. In: from y −90, scale .78, rotation 8 → rest (1.05s back.out(1.5)). Floor elastic.out(1, .5). Tag yPercent 110→0 stagger .06. |
| Hero scrub | trigger `.hero` top top → bottom top, scrub true: line 1 xPercent −18, line 2 +14, copy y −60 / opacity .15, stage yPercent −12 / scale 1.08, rail yPercent −30 |
| Header hide | scroll down > 120px: yPercent −110 (0.45s power2.in). Up: 0 (0.5s power3.out) |
| Ticker | base speed 40px/s via gsap.ticker. Velocity from Lenis adds `abs(v)*0.6`, and the direction follows the sign of v. Wrap with modulo at half the width |
| Line reveal | `.line > span` yPercent 110, rotation 2 → 0, 1.1s power4.out, stagger .1, start `top 85%`, once |
| Head buttons | x 30, opacity 0 → in, 0.9s power3.out, `top 90%` |
| Products | cards y 80 / opacity 0 → stagger .1 (1s power3.out). Images scale 1.3, rotation 6 → 1/0 (1.4s expo.out) |
| Fly to cart | clone at image rect, fixed position. x linear (power1.inOut), y back.in(1.6), scale .1, rotation 28, duration 0.9, fade last 0.12s. Counter scale 1.8→1 elastic.out(1, .4). Cart svg rotation −14→0 elastic.out(1.2, .35) |
| Categories | Desktop: row x from `innerWidth*.12` to `-(scrollWidth − viewport) − innerWidth*.04`, scrub .8 over the section's full pass. Chips y 50, scale .9 → back.out(1.7), stagger .05 |
| Best sellers | mask yPercent 100→0 (1.2s expo.out). Media yPercent −80, scale 1.3 → 0/1 (1.6s expo.out). Badge and caption at +0.55. Cards delayed `i*0.14` |
| Immerse (≥821) | pin, end `+=170%`, scrub .7. Frame scale .52→1, media 1.45→1 (power2.inOut). At 0.6: words xPercent `data-from*140` → 0, stagger .12. Then hold .35 |
| Immerse (≤820) | frame .84→1 scrub (top bottom → center center). Words xPercent `data-from*60` once at `top 55%` |
| Perks | `--draw` 0→1 (1.1s expo.inOut, delay i*.12). Children y 24 → 0, delay .25+i*.12, stagger .06 |
| Why parallax | big y 60→−60, small y 150→−90 and rotation −3→2, scrub over the section |
| Reviews | cards y 100, rotation (i−1)*6 from bottom centre → flat, 1.1s power4.out, stagger .12. Marks scale 0, rot −30 → back.out(2.4), delay .5 |
| CTA | bg yPercent −8→8 scrub. Card y 90, scale .94, opacity 0 → 1.2s expo.out. Children stagger .1, delay .35 |
| Footer | top children y 40 stagger .1. Wordmark letters yPercent 100→0 stagger .1, scrub .6 (top bottom → bottom bottom) |
| Magnetic | `gsap.quickTo` x/y, 0.7s elastic.out(1, .4). Offset × .25 (x) and × .4 (y). Reset on leave |
| Pointer tilt (hero) | `quickTo` per slot: x = −34·dx, y = −18·dy, rotation = −3·dx (dx, dy in −.5….5) |
