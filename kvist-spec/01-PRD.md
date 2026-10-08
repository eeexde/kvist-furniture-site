# 1. Product Requirements Document — KVIST

**Assumptions** (correct any that are wrong)
- Brand is an invented, original Scandinavian furniture/homeware label called **KVIST** ("twig" in Norwegian). All copy is original. Layout and motion follow a reference template, but its code, text and brand are not copied.
- Single landing page. Nav links scroll to sections. No real shop, cart or checkout. "Add to cart" only plays an animation and bumps a counter.
- Images come from Google Nano Banana (Gemini image) prompts the owner generates. Until then, every image slot shows a styled placeholder with a label.
- Contact is `mailto:` / `tel:` links only. No form backend.
- English only, USD prices.

## 1. Overview
KVIST is a one-page marketing site for a slow-living furniture and homeware brand. It is aimed at design-minded homeowners and renters aged 25–50. This doc lists, feature by feature, what the page must do. The page should feel like a high-end editorial site, with animation layered on every section.

## 2. Product Goal
Make a strong first impression that sends visitors to "Shop now" or "Contact us".
- Lighthouse Performance ≥ 85 on mobile and ≥ 95 on desktop, even with all animations on.
- All animations run at 60fps on a mid-range laptop. No layout shift from animations (CLS < 0.05).
- Every section is readable and usable with `prefers-reduced-motion: reduce`.

## 3. Target Users
| User Type | Needs | What they do in the app |
|---|---|---|
| Browsing homeowner | Inspiration, sense of quality, price range | Scrolls the full page, hovers products, clicks hero rail items |
| Ready buyer | Find a product and price quickly | Uses nav to jump to New arrivals / Best sellers, clicks "Add" |
| Unsure buyer | Help choosing | Reads perks + reviews, clicks "Contact us" in the CTA |
| Mobile visitor | Same content, thumb-friendly | Uses burger menu, swipes through the page |

## 4. Features
| Feature | Description | Expected Behavior | Priority |
|---|---|---|---|
| Sticky header | Logo, 5 nav links, search icon, cart icon with counter, burger on mobile | Hides (slides up) when scrolling down past 120px, shows again on scroll up. Active link gets `is-here` as its section enters view. On ≤820px, burger toggles the menu. `Esc` closes it. | Must |
| Smooth scroll | Lenis inertia scroll synced to GSAP ticker | Wheel scroll is eased. Anchor links scroll smoothly with a header offset. Disabled under reduced motion. | Must |
| Hero intro | Green panel, two-line display title "SLOW / LIVING", subtitle, CTA, social proof counter, product stage, product rail | On load, the featured product scales from tiny to full in the screen centre, flies to the stage, the panel wipes in, the title letters slide in one after another, then copy, proof and rail fade up. The counter counts 0→12. The whole sequence lasts about 3.2s. | Must |
| Hero product rail | 5 thumbnails (chair, lamp, vase, throw, side table) | Clicking or arrow-keying a thumb drops the current product out (down, rotate, fade), drops the new one in with a `back.out` bounce, squashes and restores the floor shadow, and swaps the tag name and price. Clicks during the animation are queued. | Must |
| Hero pointer tilt | Stage reacts to pointer | On hover-capable devices the active product follows the pointer (x ±17px, y ±9px, rotate ±1.5°) and eases back when the pointer leaves | Should |
| Hero scroll parallax | Scrubbed on scroll out of hero | Title lines drift apart horizontally (-18% / +14%), copy rises and fades, stage scales to 1.08, rail moves up | Must |
| Ticker | Infinite marquee of 5 brand promises separated by ✦ | Loops seamlessly. Speeds up with scroll velocity and reverses direction with scroll direction. | Must |
| New arrivals | Heading + "Shop new arrivals" button + 4 product cards (image, name, price, sale price, stock) | Cards rise in on enter with staggered images de-rotating. "+" button: the product image clone flies in an arc to the cart icon, the counter pops (elastic), the cart icon wiggles. | Must |
| Categories | Horizontal row of 9 category chips (thumb + label) | On desktop the row is scrubbed horizontally while the section scrolls by. Chips pop in with `back.out` on enter. On mobile it is a native swipe row. | Must |
| Best sellers | 3 large cards with badge, image, name, price, old price | Mask wipe from bottom while the image counter-slides and de-scales. Badge and caption fade up. Hover zooms the image to 1.06. | Must |
| Immerse section | Pinned full-bleed interior photo with 3 stacked words "BUILT / FOR / SLOW DAYS" | Desktop: pinned for 170% of viewport height. The frame scales 0.52→1, the inner image 1.45→1, and the words slide in from alternating sides. Mobile: no pin. The frame scales 0.84→1 and the words slide in once. | Must |
| Why us (perks) | Heading, 4 perks with drawn top rule, 2 parallax images | Each perk's top rule draws left→right (`--draw` 0→1), then its content fades up. The big image parallaxes ±60px, the small image moves faster and rotates. | Must |
| Reviews | 3 quote cards with mark, text, avatar, name, role | Cards rise from a fanned rotation (-6°, 0°, 6°) to flat. Quote marks pop with `back.out(2.4)`. | Must |
| CTA | Parallax background image + cream card with heading, copy, "Contact us" | Background scrubs ±8% yPercent. Card rises and scales from 0.94, then its copy and button stagger in. | Must |
| Footer | "Let's talk" + email + phone, link columns, giant wordmark K-V-I-S-T, socials, legal | Top block fades up. The giant wordmark letters rise from yPercent 100 one by one, scrubbed to scroll. | Must |
| Magnetic buttons | Primary CTAs + cart | On hover-capable devices the button follows the pointer (x×0.25, y×0.4) with an elastic return | Should |
| Line reveals | All section headings with `data-lines` | Each line slides up from yPercent 110 with a 2° rotation on enter, staggered 0.1s | Must |
| Image placeholders | `.ph` wrapper with `data-ph` label | A missing image shows a tinted gradient block with a mono label (e.g. "HERO — CHAIR"). The real image fades in on load. | Must |
| Reduced motion | `prefers-reduced-motion` | No Lenis, no pin, no intro. Everything is visible at once, and counters jump to their final value. | Must |
| Skip link | "Skip to content" | Visible on focus and jumps to `#main` | Must |

## 5. Out of Scope (v1)
- Real cart, checkout, payments, product detail pages
- Search functionality (icon only, no results)
- CMS, blog, user accounts
- Contact form backend (mailto only)
- Multi-language / currency switching
- Cookie banner / analytics consent (no tracking cookies used)

## 6. Success Criteria
- `npm run build` succeeds, and `npm run preview` serves the page with zero console errors.
- Every feature row above can be observed in the browser at 1440×900 and 390×844.
- Under reduced motion all content is visible without scrolling glitches.
- Swapping in the 20 generated images (same filenames) needs no code changes.
- Lighthouse targets in §2 are met on the production build.
