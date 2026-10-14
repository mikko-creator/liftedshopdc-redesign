/* site.js - Lifted Shop redesign runtime: header, menus, age gate, reveals, parallax, rails, tilt, loops, store embed.
   No dependencies. Everything degrades: without JS every section is visible and every link works. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  w.__lifted = true;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------- header state + progress ---------- */
  var hdr = $('[data-hdr]'), prog = $('.progress');
  var onScroll = function () {
    var y = w.scrollY || 0;
    if (hdr) hdr.classList.toggle('is-scrolled', y > 24);
    if (prog) { var h = root.scrollHeight - w.innerHeight; prog.style.setProperty('--p', h > 0 ? Math.min(1, y / h).toFixed(4) : 0); }
  };
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mega menu (hover is CSS; click/keyboard here) ---------- */
  $$('.has-mega').forEach(function (li) {
    var btn = $('.mega-toggle', li);
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = !li.classList.contains('is-open');
      $$('.has-mega.is-open').forEach(function (o) { o.classList.remove('is-open'); var b = $('.mega-toggle', o); if (b) b.setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.has-mega')) $$('.has-mega.is-open').forEach(function (o) { o.classList.remove('is-open'); var b = $('.mega-toggle', o); if (b) b.setAttribute('aria-expanded', 'false'); }); });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('.has-mega.is-open').forEach(function (o) { o.classList.remove('is-open'); var b = $('.mega-toggle', o); if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); } });
    if (d.body.classList.contains('menu-open')) toggleMenu(false);
  });

  /* ---------- mobile menu ---------- */
  var burger = $('.burger');
  function toggleMenu(open) {
    d.body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    var mm = $('.mmenu'); if (mm) mm.setAttribute('aria-hidden', open ? 'false' : 'true');
    d.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { toggleMenu(!d.body.classList.contains('menu-open')); });
  $$('.mmenu a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });

  /* ---------- age gate ---------- */
  var gate = $('.agegate');
  var okKey = 'lifted-age-ok', ok = false;
  try { ok = w.localStorage.getItem(okKey) === '1'; } catch (e) { ok = false; }
  if (gate && !ok) {
    gate.hidden = false; d.body.style.overflow = 'hidden';
    var yes = $('[data-age="yes"]', gate), no = $('[data-age="no"]', gate);
    setTimeout(function () { if (yes) yes.focus(); }, 60);
    if (yes) yes.addEventListener('click', function () { try { w.localStorage.setItem(okKey, '1'); } catch (e) { /* private mode */ } gate.hidden = true; d.body.style.overflow = ''; });
    if (no) no.addEventListener('click', function () { gate.classList.add('is-no'); var r = $('.agegate__no a', gate); if (r) r.focus(); });
  }

  /* ---------- split headings (wrap words, keep every character) ---------- */
  $$('.split').forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
            var o = d.createElement('span'); o.className = 'w';
            var inn = d.createElement('span'); inn.textContent = p; inn.style.setProperty('--i', i++);
            o.appendChild(inn); frag.appendChild(o);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    })(el);
  });

  /* ---------- reveals ---------- */
  var revealEls = $$('[data-reveal], .split');
  var release = function (el) {
    el.classList.add('is-in');
    if (el.hasAttribute('data-reveal')) setTimeout(function () { el.removeAttribute('data-reveal'); }, 1300);
  };
  if (!('IntersectionObserver' in w) || reduce) revealEls.forEach(release);
  else {
    var delivered = false;
    var io = new IntersectionObserver(function (entries) {
      delivered = true;
      entries.forEach(function (en) { if (en.isIntersecting) { release(en.target); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: '0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // fail-safe only when the observer never delivered (a working one always reports an initial entry)
    setTimeout(function () { if (!delivered && d.visibilityState === 'visible') revealEls.forEach(release); }, 3000);
    w.addEventListener('beforeprint', function () { revealEls.forEach(release); });
  }

  /* ---------- parallax + pinned horizontal rails ---------- */
  var layers = reduce ? [] : $$('[data-depth]');
  var pins = $$('.hpin');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = w.innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i], r = el.getBoundingClientRect();
      if (r.bottom < -400 || r.top > vh + 400) continue;
      var depth = parseFloat(el.getAttribute('data-depth')) || 0.1;
      var off = (r.top + r.height / 2 - vh / 2) * -depth;
      el.style.setProperty('--py', off.toFixed(1) + 'px');
    }
    for (var j = 0; j < pins.length; j++) {
      var p = pins[j], track = $('.hpin__track', p), stage = $('.hpin__stage', p);
      if (!track || !stage || w.innerWidth <= 900 || reduce) continue;
      var dist = Math.max(0, track.scrollWidth - stage.clientWidth);
      var pr = p.getBoundingClientRect(), total = p.offsetHeight - stage.offsetHeight;
      var prog = total > 0 ? Math.min(1, Math.max(0, -pr.top / total)) : 0;
      track.style.setProperty('--hx', (-dist * prog).toFixed(1) + 'px');
    }
  }
  function sizePins() {
    pins.forEach(function (p) {
      var track = $('.hpin__track', p), stage = $('.hpin__stage', p);
      if (!track || !stage) return;
      if (w.innerWidth <= 900 || reduce) { p.style.height = ''; return; }
      var dist = Math.max(0, track.scrollWidth - stage.clientWidth);
      p.style.height = (stage.offsetHeight + dist + w.innerHeight * 0.25) + 'px';
    });
  }
  var req = function () { if (!ticking) { ticking = true; w.requestAnimationFrame(frame); } };
  if (layers.length || pins.length) {
    sizePins(); frame();
    w.addEventListener('scroll', req, { passive: true });
    w.addEventListener('resize', function () { sizePins(); req(); });
    w.addEventListener('load', function () { sizePins(); req(); });
  }

  /* ---------- rails: drag on desktop, arrows ---------- */
  $$('.rail').forEach(function (rail) {
    var track = $('.rail__track', rail); if (!track) return;
    var step = function () { var c = track.children[0]; return c ? c.getBoundingClientRect().width + 20 : 300; };
    var prev = $('[data-rail="prev"]', rail), next = $('[data-rail="next"]', rail);
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (!fine) return;
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
    w.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-drag'); } track.scrollLeft = sl - dx; });
    w.addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { track.classList.remove('is-drag'); }, 30); });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* ---------- tilt + spotlight ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
        el.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(1) + '%'); el.style.setProperty('--my', ((y + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- loop videos: play in view, pause out of view, a visible toggle ---------- */
  var narrow = w.matchMedia('(max-width: 700px) and (orientation: portrait)').matches;
  $$('[data-loop]').forEach(function (box) {
    var v = $('video', box); if (!v || reduce) return;
    var src = narrow && v.getAttribute('data-src-phone') ? v.getAttribute('data-src-phone') : null;
    var loaded = false, userPaused = false;
    var load = function () {
      if (loaded) return; loaded = true;
      if (src) { v.src = src; }
      else $$('source', v).forEach(function (s) { if (s.getAttribute('data-src')) s.src = s.getAttribute('data-src'); });
      v.load();
    };
    v.addEventListener('playing', function () { box.classList.add('is-playing'); });
    var btn = $('.loop__toggle', box.parentNode) || $('.loop__toggle', box);
    if (btn) btn.addEventListener('click', function () {
      if (v.paused) { userPaused = false; load(); v.play().catch(function () {}); box.parentNode.classList.remove('is-paused'); btn.setAttribute('aria-label', 'Pause background motion'); }
      else { userPaused = true; v.pause(); box.parentNode.classList.add('is-paused'); btn.setAttribute('aria-label', 'Play background motion'); }
    });
    if (!('IntersectionObserver' in w)) { load(); v.play().catch(function () {}); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { load(); if (!userPaused) v.play().catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0, rootMargin: '200px 0px' }).observe(box);
  });

  /* ---------- count-up ---------- */
  $$('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10); if (!target || reduce || !('IntersectionObserver' in w)) return;
    var done = false;
    var o = new IntersectionObserver(function (es) {
      if (done || !es[0].isIntersecting) return; done = true; o.disconnect();
      var t0 = performance.now(), dur = 1600;
      (function tick(t) { var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(target * e).toLocaleString('en-US').replace(/,/g, ''); if (k < 1) w.requestAnimationFrame(tick); else el.textContent = String(target); })(t0);
    }, { threshold: 0 });
    o.observe(el);
  });

  /* ---------- Ecwid store: load the vendor script only when the menu is near the viewport ---------- */
  var mounts = $$('[data-ecwid]');
  if (mounts.length) {
    var m = mounts[0], id = m.getAttribute('data-ecwid');
    var boot = function () {
      if (m.getAttribute('data-booted')) return; m.setAttribute('data-booted', '1');
      var s = d.createElement('script');
      s.src = 'https://app.ecwid.com/script.js?' + id + '&data_platform=code'; s.async = true; s.setAttribute('data-cfasync', 'false');
      s.onload = function () {
        try { w.xProductBrowser('categoriesPerRow=3', 'views=grid(20,3) list(60) table(60)', 'categoryView=grid', 'searchView=list', 'id=my-store-' + id); m.classList.add('is-live'); } catch (e) { m.classList.add('is-failed'); }
      };
      s.onerror = function () { m.classList.add('is-failed'); };
      d.body.appendChild(s);
    };
    if ('IntersectionObserver' in w) new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { boot(); ob.disconnect(); } }, { rootMargin: '600px 0px' }).observe(m);
    else boot();
  }

  /* ---------- lazy map iframes ---------- */
  $$('iframe[data-src]').forEach(function (f) {
    if (!('IntersectionObserver' in w)) { f.src = f.getAttribute('data-src'); return; }
    new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { f.src = f.getAttribute('data-src'); ob.disconnect(); } }, { rootMargin: '400px 0px' }).observe(f);
  });
})();

;
/* ecwid-cats.js - the Ecwid storefront's top-level categories as a one-row infinite carousel.
   The live store draws its categories as a 3-up grid of tall cards (8 cards, 1,617px at 1280px) before any product.
   Ecwid's Vue app owns every node inside the mount, so nothing is cloned, moved or inserted into its tree: the root grid
   itself becomes the viewport, its tiles are rotated with CSS `order` and slide together through one shared translate,
   and the arrows sit in the mount beside Ecwid's root. The category links stay Ecwid's own. Subcategory and product
   grids are untouched, and if Ecwid's markup changes so the root grid is not found, nothing changes. */
(function () {
  'use strict';
  var d = document, w = window;
  var mount = d.querySelector('[data-ecwid]');
  if (!mount || !('MutationObserver' in w) || !('AbortController' in w)) return;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = reduce ? 0 : 650, AUTO = 3800;
  var LEFT = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M13 4l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var RIGHT = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var cur = null, queued = false;

  var tilesOf = function (g) { return Array.prototype.filter.call(g.children, function (c) { return c.classList.contains('grid-category'); }); };
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
  // the arrows live in the mount (outside Ecwid's tree), centred on the card images of the grid
  function place(st) {
    if (!st.nav.isConnected) return;
    var mr = mount.getBoundingClientRect(), gr = st.grid.getBoundingClientRect();
    var t = st.tiles[st.start], im = (t && t.querySelector('.grid-category__image')) || t || st.grid;
    var ir = im.getBoundingClientRect();
    st.nav.style.setProperty('--lc-top', Math.round(ir.top + ir.height / 2 - mr.top - mount.clientTop + mount.scrollTop) + 'px');
    st.nav.style.setProperty('--lc-left', Math.round(gr.left - mr.left - mount.clientLeft + mount.scrollLeft) + 'px');
    st.nav.style.setProperty('--lc-width', Math.round(gr.width) + 'px');
  }

  function setup(g) {
    var tiles = tilesOf(g);
    if (tiles.length < 3) return null;
    var ac = new AbortController(), on = { signal: ac.signal };
    var st = { grid: g, tiles: tiles, first: tiles[0], start: 0, vis: 4, busy: false, pending: 0, lastUser: 0, drag: null, dragged: false, hover: false, focus: false, seen: true, ac: ac };
    g.setAttribute('data-lc-rail', '');
    g.setAttribute('aria-roledescription', 'carousel');
    g.setAttribute('aria-label', 'Shop categories');
    tiles.forEach(function (t) { Array.prototype.forEach.call(t.querySelectorAll('img[loading="lazy"]'), function (im) { im.loading = 'eager'; }); });
    paint(st); shift(st, -1, 0, false);

    st.nav = d.createElement('div');
    st.nav.className = 'lc-cats-nav';
    st.nav.innerHTML = '<button class="lc-cats-nav__btn" type="button" data-dir="-1" aria-label="Previous category">' + LEFT + '</button>'
      + '<button class="lc-cats-nav__btn" type="button" data-dir="1" aria-label="Next category">' + RIGHT + '</button>';
    st.nav.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(st, Number(b.getAttribute('data-dir')), true); }, on);
    mount.appendChild(st.nav);
    layout(st);

    /* drag / swipe: the row follows the pointer and re-seats whenever a whole card has passed, so it never runs out */
    g.addEventListener('pointerdown', function (e) {
      st.dragged = false; st.lastUser = Date.now();
      if (e.button !== 0 || st.busy) return;
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
      var t = e.target.closest && e.target.closest('.grid-category'), i = st.tiles.indexOf(t), n = st.tiles.length;
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
    if (!reduce) st.timer = setInterval(function () { if (!st.hover && !st.focus && st.seen && !d.hidden && Date.now() - st.lastUser > 6000) go(st, 1); }, AUTO);

    var relayout = function () { layout(st); };
    if ('ResizeObserver' in w) { st.ro = new ResizeObserver(relayout); st.ro.observe(g); if (mount.firstElementChild) st.ro.observe(mount.firstElementChild); }
    w.addEventListener('resize', relayout, on);
    return st;
  }

  function teardown(st) {
    st.ac.abort(); clearInterval(st.timer);
    if (st.ro) st.ro.disconnect();
    if (st.io) st.io.disconnect();
    if (st.nav.parentNode) st.nav.parentNode.removeChild(st.nav);
    ['data-lc-rail', 'data-lc-jump', 'data-lc-dragging', 'aria-roledescription', 'aria-label'].forEach(function (a) { st.grid.removeAttribute(a); });
    ['--lc-off', '--lc-drag', '--lc-vis'].forEach(function (p) { st.grid.style.removeProperty(p); });
    st.tiles.forEach(function (t) { t.style.removeProperty('order'); });
  }

  // Ecwid renders, navigates and re-renders on its own schedule: re-check after its DOM settles
  function scan() {
    queued = false;
    var g = mount.querySelector('.ec-store__category-page--0 .grid__categories');
    var tiles = g ? tilesOf(g) : [];
    if (cur && (cur.grid !== g || !g.isConnected || cur.first !== tiles[0] || cur.tiles.length !== tiles.length)) { teardown(cur); cur = null; }
    if (!cur && g && tiles.length) cur = setup(g);
    if (cur && !cur.nav.isConnected) { mount.appendChild(cur.nav); }
    if (cur) place(cur);
  }
  new MutationObserver(function () { if (!queued) { queued = true; setTimeout(scan, 120); } }).observe(mount, { childList: true, subtree: true });
  if ('ResizeObserver' in w) new ResizeObserver(function () { if (cur) place(cur); }).observe(mount);
})();
