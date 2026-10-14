# Lifted Shop — "Night Flight" redesign (pitch preview)

A complete visual redesign of [liftedshopdc.com](https://www.liftedshopdc.com/), rebuilt as a fast static site.
It keeps the live site's structure, URLs, copy and branding: the LIFTED airplane and rocket marks, the rasta red, gold
and leaf green on black, and the "liftoff / Frequent Flyer" voice. All of it is re-staged in an ethereal glass design
with layered depth.

**Preview:** https://mikko-creator.github.io/liftedshopdc-redesign/ (noindex; a pitch preview, not the live site)

## What is in it

- **Every live page, at its live path.** That is 97 pages: home, 61 site pages (about, the lounge, shop, merch,
  promos, reviews, contact, the delivery hub and every delivery town), 31 blog posts, the blog and the author archives.
  It also carries the three live redirects (`/home/`, `/orbit/`, `/delivery/laurel-md/`) as refresh stubs plus
  `_redirects`.
- **The copy is the live copy.** `tools/extract.mjs` turns each harvested page into a typed model
  (`src/content/pages/*.json`) and proves word recall against the live text: minimum 0.9955 over 97 pages, with a
  planted control that must fail.
- **The real things still work.** The live Ecwid storefront (store 125946269) loads in place on the home page, `/shop/`
  and the delivery pages. The Google Maps embeds and the Trustindex Google reviews are carried over as content.
- **Design system "Night Flight".** It has five parts:
  - a fixed night sky behind every page;
  - frosted glass panels, with light glass for black logos;
  - Unbounded display type, Manrope for body text and Instrument Serif accents;
  - cut-outs that protrude across section edges with parallax: the product bags, buds, a fan leaf and a rolling-paper
    plane;
  - cloud banks at the seams, scroll-reveal headings, a pinned horizontal "Exclusives" flight, a kinetic category band,
    hover tilt and lift, an image mega menu, an age gate, and `prefers-reduced-motion` honoured throughout.
- **Imagery.** Real Lifted Shop photos are harvested into `assets/source/`. Added industry imagery was generated with
  fal (flux-pro ultra, plus birefnet cut-outs) and three motion loops with Higgsfield (Kling image-to-video). Every
  generated file carries the IPTC `trainedAlgorithmicMedia` label. None of it depicts a person, a real place, or a
  product or package of Lifted Shop.

## Build

Requires Node 18+ and `cwebp`/`webpmux` (libwebp) on PATH. There are no npm dependencies.

```bash
node src/build.mjs                    # -> dist/ (97 pages + 404 + redirects, hashed WebP variants)
node tools/serve.mjs --root dist --port 8791 --not-found 404.html
```

`node tools/extract.mjs` re-derives the page models from a harvest in `audit/raw/`. The harvest is not committed; run
`node tools/crawl.mjs` first.

## Layout

| Path | What |
|---|---|
| `src/content/pages/*.json` | one model per live page: head/SEO, sections, typed blocks |
| `src/content/site.json` | header, footer, menu, age gate and redirects from the live chrome |
| `src/theme/` | `home.mjs`, `liftoff.mjs`, `landing.mjs`, `archive.mjs`, shared `blocks.mjs`, `parts.mjs`, `chrome.mjs`, `shell.mjs` |
| `src/styles/` | tokens, base, components, chrome, motion, blocks and one file per template |
| `src/scripts/site.js` | menus, age gate, reveals, parallax, pinned rail, tilt, loops, the lazy Ecwid loader |
| `assets/source/` | real Lifted Shop imagery (harvested) |
| `assets/generated/` | fal stills and cut-outs, Higgsfield loops (AI-labelled) |
| `tools/` | crawl, extract, asset harvest, fal and Higgsfield runners, loop maker, screenshots, Pages preview, link and secret checks |

Forms are not connected in this preview. They post to a placeholder and start disabled.
