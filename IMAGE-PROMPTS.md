# KVIST — Image Prompts for Google Nano Banana

Generate each image, then save it to `public/images/` with the **exact filename** shown, as WebP. Product cutouts must go through background removal so they end up transparent.

**Tips**
- **Keep it consistent:** generate all 9 cutouts in **one chat**. After the first one, say "same lighting, same angle, same style as the previous image".
- **Aspect ratio:** Nano Banana follows ratio hints. If it ignores one, crop afterwards.
- **Cutouts:** Nano Banana can't make true transparency. Prompt for a flat background, then remove it with remove.bg, Canva "BG Remover" or Photoshop, and export WebP with alpha.
- **File sizes:** compress with squoosh.app (WebP quality 78). Targets: cutouts ≤ 150KB, photos ≤ 200KB, avatars ≤ 40KB.

---

## A. Product cutouts (square 1:1, then remove background)

Shared style (paste at the end of every cutout prompt):
> Studio product photograph, three-quarter front view from slightly above eye level, single object centered with generous empty space around it, soft diffused key light from upper left, gentle natural shading, no cast shadow on the floor, seamless flat pure light-grey background (#E6E6E6), photorealistic, high detail on material texture, Scandinavian minimalist design, muted natural palette, no text, no props, no logo.

| # | File | Prompt |
|---|---|---|
| 1 | `hero-chair.webp` | A low, deep lounge armchair with a solid light oak frame with softly rounded edges, a thick loose seat cushion and back cushion upholstered in oatmeal bouclé wool, and wide flat oak armrests. *[shared style]* |
| 2 | `hero-lamp.webp` | A table lamp with a hand-thrown matte stoneware base in warm sand color with a subtle speckled glaze and a pleated natural linen drum shade, switched on, glowing softly warm through the linen. *[shared style]* |
| 3 | `hero-vase.webp` | A tall organic stoneware vase with a slightly asymmetric hand-thrown silhouette and a matte charcoal-brown glaze with a raw clay rim, holding three dried pampas and oat stems. *[shared style]* |
| 4 | `hero-throw.webp` | A chunky folded wool throw blanket in warm cream with a thin rust-ochre stripe near one edge and short knotted fringe, neatly folded into a soft stack and slightly draped. *[shared style]* |
| 5 | `hero-table.webp` | A round side table with a solid smoked-oak top, one thick cylindrical pedestal leg and a round base, visible wood grain, softly rounded edges. *[shared style]* |
| 6 | `arr-stool.webp` | A small three-legged stool in solid light oak with a slightly dished round seat and splayed turned legs, simple Scandinavian craft style. *[shared style]* |
| 7 | `arr-pendant.webp` | A large globe-shaped paper pendant lamp with fine horizontal ribs of washi paper on a thin black cord, glowing warmly from inside, the cord cropped at the top. *[shared style]* |
| 8 | `arr-cushion.webp` | A square stonewashed linen cushion in muted sage green with a slightly rumpled natural texture and a small piped edge, standing upright at a slight angle. *[shared style]* |
| 9 | `arr-bowl.webp` | A wide shallow hand-made ceramic serving bowl with an off-white glaze breaking to brown at the rim and a visible throwing line, shown at an angle so the inside is visible. *[shared style]* |

---

## B. Lifestyle photos

Shared style (paste at the end of each):
> Editorial interior photograph, natural soft daylight from a large window, warm and slightly desaturated colors, subtle 35mm film grain, shallow depth of field, Scandinavian home with oak floors, limewashed walls, linen and wool textures, calm and lived-in, no people's faces, no text, no logos.

| # | File | Ratio | Prompt |
|---|---|---|---|
| 10 | `best-chair.webp` | 4:5 vertical | An oatmeal bouclé lounge chair with a light oak frame placed beside a tall window with sheer linen curtains, a cream wool throw over one arm, and a small stack of books on the floor. *[shared style]* |
| 11 | `best-throw.webp` | 4:5 vertical | Close crop of a cream wool throw with a rust-ochre stripe draped over the end of a linen sofa, with a ceramic mug of tea on a wooden tray beside it, in morning light. *[shared style]* |
| 12 | `best-lamp.webp` | 4:5 vertical | A sand-colored stoneware table lamp with a pleated linen shade glowing at dusk on an oak sideboard next to a small speckled vase and a stack of art books, with blue-hour light outside the window. *[shared style]* |
| 13 | `immerse.webp` | 16:9 wide | Wide view of a serene open living room: a low oatmeal sofa, the oak lounge chair, a round smoked-oak side table, a stoneware vase with dried grasses, a large paper pendant overhead, and tall windows with soft afternoon light and long shadows across a wide-plank oak floor. Leave calm empty space in the center of the frame for overlaid text. *[shared style]* |
| 14 | `why-room.webp` | 4:5 vertical | A corner reading nook: an oak stool used as a side table holding a ceramic bowl of clementines, a linen cushion in sage green on a window bench, and a wall shelf with pottery. *[shared style]* |
| 15 | `why-detail.webp` | 1:1 square | Macro detail of a craftsman's hand running along the rounded edge of a solid oak chair arm, showing wood grain and a hand-rubbed oil finish, with the background softly blurred workshop. *[shared style]* |
| 16 | `cta.webp` | 16:9 wide | A calm dining area at golden hour: a solid oak table with a ceramic bowl and linen napkins, the warm glow of a paper pendant, and soft shadows on a limewashed wall. Keep the center and right side quiet and uncluttered for an overlaid text card. *[shared style]* |
| 17 | `footer.webp` | 3:2 landscape | A small furniture workshop with oak planks stacked against a wall, hand tools on a workbench, sawdust in a beam of window light, and an unfinished chair frame. *[shared style]* |

---

## C. Review avatars (1:1 square)

Shared style:
> Natural-light portrait photograph, head and shoulders, soft window light, relaxed genuine expression, plain warm neutral background slightly out of focus, muted earthy clothing, subtle film grain, photorealistic, no text.

| # | File | Prompt |
|---|---|---|
| 18 | `avatar-1.webp` | A woman in her late 30s with short auburn hair, wearing a rust-colored linen shirt, a ceramicist with a little clay dust on her sleeve. *[shared style]* |
| 19 | `avatar-2.webp` | A man in his early 40s with dark curly hair and a short beard, wearing a charcoal knit sweater. *[shared style]* |
| 20 | `avatar-3.webp` | A woman in her early 30s of East Asian descent with long straight black hair tied back, wearing a cream turtleneck and thin round glasses. *[shared style]* |

---

## Optional
| File | Prompt |
|---|---|
| `og.jpg` (1200×630) | Reuse `immerse.webp` cropped to 1200×630, with "KVIST" in Anton font added in Canva (cream, centered). |
