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
- **Lanes.** Three parallel template lanes ran, each owning its own files (`liftoff.*`, `landing.*` and `archive.*`).
  Each lane checked its built pages for copy against the models and reported 0 missing strings:
  - liftoff: 1,270 strings across 56 pages, with a control;
  - landing: 404 strings across 11 pages, with a control;
  - archive: 71 strings.
