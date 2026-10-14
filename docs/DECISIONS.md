# Decisions and open items (pitch build, 2026-10-14)

This is a fast-track redesign pitch for a prospect. The full site-reforge gate (`sr-gate`), the handoff zip and
independent QA were skipped at the operator's request ("no need for long hours of verification"). The checks that did
run are listed in "Checks run" below.

## Decisions

- **D1. Structure kept, presentation replaced.** Every live URL (97 pages) is rebuilt at its own path. The live
  Elementor sections are re-composed into four templates:
  - home;
  - LIFTOFF: the rocket-logo hero with a main column and a sidebar;
  - LANDING: delivery towns and the service pages;
  - archive.

  No live copy is rewritten. Duplicate copies of blocks that the live page shows for responsive variants are rendered
  once.
- **D2. The hero H1 moves.** On inner pages the page's own H1, which on the live site sits in the main column, is shown
  in the full-bleed hero. "Get ready for liftoff!" becomes its kicker.
- **D3. The agency credit is dropped.** "| Website by Local SEO" is the old build's credit, not Lifted Shop copy.
- **D4. Embeds stay live.**
  - The Ecwid storefront (store 125946269) is loaded only when the menu nears the viewport.
  - Ecwid's own dark theme sits in a dark glass frame.
  - On the home page the full 5,500px menu is contained in a scrolling panel with a Shop Now button; the full menu is on
    `/shop/`.
  - The Google Maps embeds are lazy-loaded.
- **D5. Real versus generated imagery.**
  - Real photos are used where the live site uses them: the category squares, the lounge photos, the Orbit storefront,
    the product bags, and the hip-hop exclusive cards.
  - Generated stills and loops are decorative only: sky, clouds, smoke, aurora, orbit, a bud, a leaf, a paper plane, a
    resin macro, a pre-roll, a parcel and city glow.
  - Generated media shows no people, no text, no logos and no real place or packaging.
- **D6. Black logos sit on light chips.** The review platforms (Leafly, Weedmaps, Google, AllBud, Yelp) and the partner
  brands are black artwork, so they sit on light glass.
- **D7. Forms are not connected.** The forms post to a placeholder action and their submit buttons start disabled:
  - the Frequent Flyer newsletter;
  - the merch order form;
  - the contact embed.

## Open for the client (B items)

- **B1. Dead in-page anchors inherited from the live site:**
  - `#locationcontact` (14 pages);
  - `#references` (3 posts);
  - `/shop/#Premium_Flowers`, `/shop/#Exotic_Flowers` and `/shop/#Designer_Flowers`;
  - `#orderdelivery` on `/delivery/south-laurel-md/`, which has no menu embed.
- **B2. Form backends** for the newsletter, merch orders and contact (see D7).
- **B3. Two Instagram handles are in use:** `@lifteddmv` in the footer and `@liftedindc` in the mobile menu.
- **B4. The copyright line reads "© 2025".**
- **B5. Compliance copy** (I-71 gifting wording, "No medical card needed", "Delivery up to 100 miles") is carried
  verbatim. The client should confirm it is current.

## Checks run

- **Extraction recall** (`tools/extract.mjs`):
  - minimum 0.9955 and median 1.0 over 97 pages;
  - the positive control fires: home recall without its 3 largest sections drops to 0.45.
- **Build** (`node src/build.mjs`): 97 pages, 3 redirect stubs, 0 image failures, 0 warnings.
- **Link check** (`tools/link-check.mjs`):
  - 0 broken page, image, video or CSS references;
  - 35 dead fragments, all inherited (B1);
  - the control fires.
- **Pages preview rewrite:** 0 root-absolute references left outside the `/liftedshopdc-redesign` prefix.
- **Screenshots** at 1280x585 at DPR 1.5 and at 390x844: no horizontal overflow, and the age gate and the mega menu
  were checked.
- **Ecwid:** the storefront renders inside the rebuild off liftedshopdc.com (localhost check with only the Ecwid hosts
  allowed).

## Added after the template lanes (2026-10-14 10:25)

- **D8. Excerpt residue is stripped.** The live WordPress excerpts on the author archives and the blog grid start with
  the liftoff hero's own text, "Get ready for liftoff! ORDER DELIVERY". That is template residue, not authored copy, so
  it is removed from the card excerpts only (`blocks.mjs posts()`).
- **D9. One menu per page.** The `/shop/` model carries two identical Ecwid embeds. The first renders and the second is
  skipped, so the ids stay unique.
- **D10. One rating label.** The rating bar shows the Trustindex label once ("EXCELLENT"). The summary text follows it
  ("Based on 2410 reviews").
- **D11. The store's categories are a one-row carousel** (revision 1, 2026-10-14, on the operator's request).
  - The Ecwid storefront draws its 8 top-level categories as a 3-up grid of tall cards before any product: 1,617px
    at 1280px wide.
  - `src/scripts/ecwid-rails.js` and `src/styles/ecwid-rails.css` (first named `ecwid-cats.*`) turn that grid into a
    one-row infinite carousel on every page with the store. It has autoplay (paused on hover, focus, off-screen,
    under reduced motion, and for 6 s after any tap, swipe or key), arrows, drag and swipe, and keyboard arrows. A
    drag never opens a category.
  - The row is 394px at 1280 and 280px at 390.
  - Nothing is added to or moved inside Ecwid's own markup: the cards keep Ecwid's links and the client's category
    images. Subcategory and product grids are unchanged.
  - Check: `tools/ecwid-rail-check.mjs` (15 checks against the real store) passed on home at 1280 and at 390 with
    touch, and on `/shop/` at 1280.
- **D12. Featured Products is a one-row carousel too** (revision 2, 2026-10-14, on the operator's request).
  - On the store's root page Ecwid lists 15 featured products three to a row: 3,355px at 1280px wide.
  - The same script runs a second rail on that grid, with its own arrows. Its autoplay starts half a beat after the
    categories', so the two rows never slide together.
  - The row is 584px at 1280. On the home page the whole store panel's content drops from 4,303px to 1,532px.
  - A category's own product listing (after tapping a category) stays a grid, with Ecwid's sorting.
  - Check: `tools/ecwid-rail-check.mjs <url> <w> <h> <shot> products`.
- **D13. The home final call has no cut-outs** (revision 3, 2026-10-14, on the operator's request).
  - The paper plane and the bud are removed from "Ready for the Best Weed Delivery in DC?".
  - The Frequent Flyer Club section's own plane rose into that section on its parallax, by up to about 140px on a
    phone. It stays, with its depth cut from 0.3 to 0.12 and placed lower (top 14%, 13% on phones). A scroll sweep at
    390, 1280, 1440 and 1920 finds no cut-out inside the final call at any scroll position.
  - Also fixed, found while checking this: on phones the Frequent Flyer card's single grid column grew to the email
    form's min-content (421px on a 298px card), pushing the title and the form off the right edge. This was in the
    first build too. The column is now `minmax(0, 1fr)`, and under 480px the button sits under the input.
- **D14. The mobile menu's phone button is a normal button again** (revision 4, 2026-10-14, on the operator's
  request).
  - The menu's link rule `.mmenu a` out-ranked `.btn`, so the phone button in the menu footer took the nav links'
    block display, lost its side padding and used the 1.3-1.9rem display face. The number sat left and the icon
    dropped to a second line. The social icons took the extra padding too.
  - The rule is now `.mmenu nav a`. At 390px the button is a 358 × 52px pill with the number and icon centred on one
    line, and the social icons are 44px circles.
- **Lanes.** Three parallel template lanes ran, each owning its own files (`liftoff.*`, `landing.*` and `archive.*`).
  Each lane checked its built pages for copy against the models and reported 0 missing strings:
  - liftoff: 1,270 strings across 56 pages, with a control;
  - landing: 404 strings across 11 pages, with a control;
  - archive: 71 strings.
