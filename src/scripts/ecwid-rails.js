/* ecwid-rails.js - the Ecwid storefront's root page as two one-row infinite carousels: the top-level categories and
   Featured Products. The live store draws both as 3-up grids of tall cards before anything else (8 categories,
   1,617px at 1280px; 15 products, 3,355px). Ecwid's Vue app owns every node inside the mount, so nothing is cloned,
   moved or inserted into its tree: each grid itself becomes the viewport, its tiles are rotated with CSS `order` and
   slide together through one shared translate, and the arrows sit in the mount beside Ecwid's root. The links stay
   Ecwid's own. Category pages, subcategory grids and product pages are untouched, and if Ecwid's markup changes so a
   grid is not found, that grid stays as Ecwid draws it. */
(function () {
  'use strict';
  var d = document, w = window;
  var mount = d.querySelector('[data-ecwid]');
  if (!mount || !('MutationObserver' in w) || !('AbortController' in w)) return;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = reduce ? 0 : 650, AUTO = 3800;
  var LEFT = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M13 4l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var RIGHT = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // the two rails of the root page; products start half a beat later so the rows never slide in lockstep
  var KINDS = [
    { key: 'cats', grid: '.grid__categories', tile: 'grid-category', img: '.grid-category__image', label: 'Shop categories', item: 'category', delay: 0 },
    { key: 'products', grid: '.grid__products', tile: 'grid-product', img: '.grid-product__image', label: 'Featured products', item: 'product', delay: AUTO / 2 }
  ];
  var cur = {}, queued = false;

  var tilesOf = function (g, cls) { return Array.prototype.filter.call(g.children, function (c) { return c.classList.contains(cls); }); };
  // cards in view by grid width; the last one is a peek so the row reads as a carousel
  var visFor = function (gw) { return gw >= 980 ? 4.3 : gw >= 720 ? 3.3 : gw >= 470 ? 2.3 : 1.55; };

  // order 0 is a buffer card parked off the left edge, order 1 the first card in view
  function paint(st) {
    var n = st.tiles.length;
    st.tiles.forEach(function (t, i) { t.style.order = String((i - st.start + 1 + 2 * n) % n); });
  }
  // offset in card widths (-1 = at rest) plus a drag in px; a jump re-seats without animating
  function shift(st, off, px, animate) {
    var g = st.grid;
    if (!animate && !st.drag) g.setAttribute('data-lc-jump', '');
    g.style.setProperty('--lc-off', String(off));
    g.style.setProperty('--lc-drag', (px || 0) + 'px');
    if (!animate && !st.drag) { void g.offsetWidth; g.removeAttribute('data-lc-jump'); }
  }
  // slide one card (next: -1 -> -2, prev: -1 -> 0), then rotate the order and jump back to rest: the same picture.
  // A user step that lands mid-slide is queued, not dropped, and it holds autoplay off for a while.
  function go(st, dir, user) {
    if (user) st.lastUser = Date.now();
    if (st.drag || !st.grid.isConnected) return;
    if (st.busy) { if (user) st.pending = dir; return; }
    st.busy = true;
    shift(st, -1 - dir, 0, true);
    settle(st, dir);
  }
  function settle(st, dir) {
    var n = st.tiles.length;
    setTimeout(function () {
      st.start = (st.start + dir + n) % n; paint(st); shift(st, -1, 0, false); st.busy = false;
      if (st.pending) { var p = st.pending; st.pending = 0; go(st, p); }
    }, DUR + 30);
  }
  function layout(st) {
    var gw = st.grid.clientWidth; if (!gw) return;
    st.vis = Math.max(1, Math.min(visFor(gw), st.tiles.length - 2));
    st.grid.style.setProperty('--lc-vis', String(st.vis));
    place(st);
  }
  // the arrows live in the mount (outside Ecwid's tree), centred on the card images of their grid
  function place(st) {
    if (!st.nav.isConnected) return;
    var mr = mount.getBoundingClientRect(), gr = st.grid.getBoundingClientRect();
    var t = st.tiles[st.start], im = (t && t.querySelector(st.K.img)) || t || st.grid;
    var ir = im.getBoundingClientRect();
    st.nav.style.setProperty('--lc-top', Math.round(ir.top + ir.height / 2 - mr.top - mount.clientTop + mount.scrollTop) + 'px');
    st.nav.style.setProperty('--lc-left', Math.round(gr.left - mr.left - mount.clientLeft + mount.scrollLeft) + 'px');
    st.nav.style.setProperty('--lc-width', Math.round(gr.width) + 'px');
  }

  function setup(g, K) {
    var tiles = tilesOf(g, K.tile);
    if (tiles.length < 3) return null;
    var ac = new AbortController(), on = { signal: ac.signal };
    var st = { K: K, grid: g, tiles: tiles, first: tiles[0], start: 0, vis: 4, busy: false, pending: 0, lastUser: 0, drag: null, dragged: false, hover: false, focus: false, seen: true, ac: ac };
    g.setAttribute('data-lc-rail', K.key);
    g.setAttribute('aria-roledescription', 'carousel');
    g.setAttribute('aria-label', K.label);
    // a lazy image clipped off the row's edge would load only as it slides in: load them all now
    tiles.forEach(function (t) { Array.prototype.forEach.call(t.querySelectorAll('img[loading="lazy"]'), function (im) { im.loading = 'eager'; }); });
    paint(st); shift(st, -1, 0, false);

    st.nav = d.createElement('div');
    st.nav.className = 'lc-rail-nav';
    st.nav.setAttribute('data-rail', K.key);
    st.nav.innerHTML = '<button class="lc-rail-nav__btn" type="button" data-dir="-1" aria-label="Previous ' + K.item + '">' + LEFT + '</button>'
      + '<button class="lc-rail-nav__btn" type="button" data-dir="1" aria-label="Next ' + K.item + '">' + RIGHT + '</button>';
    st.nav.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(st, Number(b.getAttribute('data-dir')), true); }, on);
    mount.appendChild(st.nav);
    layout(st);

    /* drag / swipe: the row follows the pointer and re-seats whenever a whole card has passed, so it never runs out */
    g.addEventListener('pointerdown', function (e) {
      st.dragged = false; st.lastUser = Date.now();
      if (e.button !== 0 || st.busy || (e.target.closest && e.target.closest('input, select, textarea, [contenteditable]'))) return;
      st.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, live: false, tw: st.tiles[0].getBoundingClientRect().width || 1 };
    }, on);
    g.addEventListener('pointermove', function (e) {
      var D = st.drag; if (!D || e.pointerId !== D.id) return;
      var dx = e.clientX - D.x, dy = e.clientY - D.y, n = st.tiles.length;
      if (!D.live) {
        if (Math.abs(dx) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { st.drag = null; return; }   // a vertical gesture belongs to the page
        D.live = true; st.dragged = true; g.setAttribute('data-lc-dragging', '');
        try { g.setPointerCapture(D.id); } catch (err) { /* capture is a nicety */ }
      }
      while (dx <= -D.tw) { st.start = (st.start + 1) % n; D.x -= D.tw; dx += D.tw; paint(st); }
      while (dx >= D.tw) { st.start = (st.start - 1 + n) % n; D.x += D.tw; dx -= D.tw; paint(st); }
      D.dx = dx; shift(st, -1, dx, false);
    }, on);
    var end = function (e) {
      var D = st.drag; if (!D || (e.pointerId !== undefined && e.pointerId !== D.id)) return;
      st.drag = null; g.removeAttribute('data-lc-dragging');
      if (!D.live) return;
      var dir = D.dx < -D.tw * 0.18 ? 1 : D.dx > D.tw * 0.18 ? -1 : 0;
      st.lastUser = Date.now();
      if (!dir) { shift(st, -1, 0, true); return; }
      st.busy = true; shift(st, -1 - dir, 0, true);
      settle(st, dir);
    };
    g.addEventListener('pointerup', end, on);
    g.addEventListener('pointercancel', end, on);
    // a touch is implicitly captured by the card it starts on; taking that capture fires lostpointercapture on the
    // card, which bubbles here and must not end the drag: only the grid's own loss counts
    g.addEventListener('lostpointercapture', function (e) { if (e.target === g) end(e); }, on);
    // a drag is not a click: stop it before Ecwid's link sees it
    g.addEventListener('click', function (e) { if (st.dragged) { e.preventDefault(); e.stopPropagation(); st.dragged = false; } }, Object.assign({ capture: true }, on));
    g.addEventListener('dragstart', function (e) { e.preventDefault(); }, on);

    /* keyboard: arrows step; tabbing to a card outside the window brings it in */
    g.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(st, e.key === 'ArrowRight' ? 1 : -1, true); }
    }, on);
    g.addEventListener('focusin', function (e) {
      st.focus = true;
      var t = e.target.closest && e.target.closest('.' + K.tile), i = st.tiles.indexOf(t), n = st.tiles.length;
      if (i < 0 || st.busy) return;
      var slot = (i - st.start + n) % n, full = Math.max(1, Math.floor(st.vis));
      if (slot >= full) { st.start = (i - full + 1 + n) % n; paint(st); shift(st, -1, 0, false); place(st); }
    }, on);
    g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) st.focus = false; }, on);

    /* autoplay: pauses on hover, focus, drag, an off-screen grid and a hidden tab, and for 6s after any tap, swipe or
       key (a phone has no hover to pause it); off under reduced motion */
    [g, st.nav].forEach(function (el) {
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') st.hover = true; }, on);
      el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') st.hover = false; }, on);
    });
    if ('IntersectionObserver' in w) { st.io = new IntersectionObserver(function (es) { st.seen = es[0].isIntersecting; }); st.io.observe(g); }
    if (!reduce) {
      st.wait = setTimeout(function () {
        st.timer = setInterval(function () { if (!st.hover && !st.focus && st.seen && !d.hidden && Date.now() - st.lastUser > 6000) go(st, 1); }, AUTO);
      }, K.delay);
    }

    // resize work waits a frame: re-sizing the cards inside a ResizeObserver callback re-triggers it in the same frame
    var relayout = function () { w.cancelAnimationFrame(st.raf); st.raf = w.requestAnimationFrame(function () { layout(st); }); };
    if ('ResizeObserver' in w) { st.ro = new ResizeObserver(relayout); st.ro.observe(g); if (mount.firstElementChild) st.ro.observe(mount.firstElementChild); }
    w.addEventListener('resize', relayout, on);
    return st;
  }

  function teardown(st) {
    st.ac.abort(); clearTimeout(st.wait); clearInterval(st.timer); w.cancelAnimationFrame(st.raf);
    if (st.ro) st.ro.disconnect();
    if (st.io) st.io.disconnect();
    if (st.nav.parentNode) st.nav.parentNode.removeChild(st.nav);
    ['data-lc-rail', 'data-lc-jump', 'data-lc-dragging', 'aria-roledescription', 'aria-label'].forEach(function (a) { st.grid.removeAttribute(a); });
    ['--lc-off', '--lc-drag', '--lc-vis'].forEach(function (p) { st.grid.style.removeProperty(p); });
    st.tiles.forEach(function (t) { t.style.removeProperty('order'); });
  }

  // Ecwid renders, navigates, sorts and re-renders on its own schedule: re-check each rail after its DOM settles
  function scan() {
    queued = false;
    KINDS.forEach(function (K) {
      var st = cur[K.key];
      var g = mount.querySelector('.ec-store__category-page--0 ' + K.grid);
      var tiles = g ? tilesOf(g, K.tile) : [];
      if (st && (st.grid !== g || !g.isConnected || st.first !== tiles[0] || st.tiles.length !== tiles.length)) { teardown(st); st = cur[K.key] = null; }
      if (!st && g && tiles.length) st = cur[K.key] = setup(g, K);
      if (st && !st.nav.isConnected) mount.appendChild(st.nav);
      if (st) place(st);
    });
  }
  new MutationObserver(function () { if (!queued) { queued = true; setTimeout(scan, 120); } }).observe(mount, { childList: true, subtree: true });
  var placeRaf = 0;
  if ('ResizeObserver' in w) new ResizeObserver(function () {
    w.cancelAnimationFrame(placeRaf);
    placeRaf = w.requestAnimationFrame(function () { KINDS.forEach(function (K) { if (cur[K.key]) place(cur[K.key]); }); });
  }).observe(mount);
})();
