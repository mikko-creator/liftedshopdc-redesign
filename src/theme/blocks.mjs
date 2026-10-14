// blocks.mjs - the generic block renderer: every typed block from src/lib/extract.mjs -> redesigned markup.
// Copy is carried verbatim (block html is already sanitised by the extractor); only the presentation changes.
import { esc, attr, strip, ICON, linkAttrs, stars, initials, socialIcon, findBlock } from './util.mjs';

let FORM_N = 0;
const PRIMARY = /order|shop now|place order|book now|view all products|subscribe/i;

export function btn(text, href, opts = {}) {
  const kind = opts.kind || (PRIMARY.test(text) ? 'primary' : 'ghost');
  const h = href || '/shop/';
  return '<a class="btn btn--' + kind + (opts.sm ? ' btn--sm' : '') + '" href="' + attr(h) + '"' + linkAttrs(h) + '>' + esc(text) + '<span class="ico">' + (/^tel:/.test(h) ? ICON.phone : ICON.arrow) + '</span></a>';
}

/** replace <img data-ref> placeholders inside extracted rich text with responsive images */
export function richText(html, ctx, sizes = '(max-width: 760px) 100vw, 720px') {
  return String(html || '').replace(/<img data-ref="([^"]+)" alt="([^"]*)">/g, (m, ref, alt) => {
    try { return '<figure class="frame">' + ctx.img(ref.replace(/&amp;/g, '&'), { alt: alt.replace(/&quot;/g, '"').replace(/&amp;/g, '&'), sizes }) + '</figure>'; }
    catch (e) { ctx.warn('rich image: ' + e.message); return ''; }
  });
}

const isCut = (src) => /\.png(\.webp)?($|\?)/i.test(src) || /removebg|cutout|-bag|bag-|logo/i.test(src);

export function figure(b, ctx, opts = {}) {
  const src = b.img.src;
  const cut = opts.cut != null ? opts.cut : isCut(src);
  let im;
  try { im = ctx.img(src, { alt: b.img.alt || '', sizes: opts.sizes || (cut ? '(max-width: 760px) 70vw, 420px' : '(max-width: 760px) 100vw, 640px'), cls: opts.imgCls }); }
  catch (e) { ctx.warn('image: ' + e.message); return ''; }
  const inner = b.href ? '<a href="' + attr(b.href) + '"' + linkAttrs(b.href) + '>' + im + '</a>' : im;
  const cap = b.caption ? '<figcaption>' + b.caption + '</figcaption>' : '';
  return '<figure class="' + (cut ? 'cutout' : 'frame') + (opts.cls ? ' ' + opts.cls : '') + '"' + (opts.reveal === false ? '' : ' data-reveal="zoom"') + '>' + inner + cap + '</figure>';
}

export function rail(items, opts = {}) {
  const id = opts.id ? ' id="' + attr(opts.id) + '"' : '';
  const head = opts.head || '';
  const nav = '<div class="rail__nav"><button class="rail__btn" type="button" data-rail="prev" aria-label="Previous">' + ICON.left + '</button><button class="rail__btn" type="button" data-rail="next" aria-label="Next">' + ICON.right + '</button></div>';
  return '<div class="rail' + (opts.cls ? ' ' + opts.cls : '') + '"' + id + (opts.w ? ' style="--rail-w:' + opts.w + '"' : '') + '>'
    + '<div class="rail__head">' + head + nav + '</div>'
    + '<div class="rail__track" role="list">' + items.map((x) => '<div role="listitem">' + x + '</div>').join('') + '</div></div>';
}

export function tiles(b, ctx, opts = {}) {
  const shape = opts.shape || 'tile';
  const items = b.items.map((it) => {
    let im = '';
    try { im = ctx.img(it.img.src, { alt: it.img.alt || '', sizes: '(max-width: 760px) 70vw, 300px' }); } catch (e) { ctx.warn('tile: ' + e.message); }
    const link = it.href ? '<a href="' + attr(it.href) + '"' + linkAttrs(it.href) + ' aria-label="' + attr(strip(it.caption) || it.img.alt || 'View') + '"></a>' : '';
    return '<figure class="' + shape + '" data-tilt>' + im + (it.caption ? '<figcaption>' + it.caption + '</figcaption>' : '') + link + '</figure>';
  });
  return rail(items, opts);
}

export function quotes(items, opts = {}) {
  return rail(items.map((q) => '<blockquote class="quote" data-tilt><div class="quote__mark" aria-hidden="true">&ldquo;</div><p class="quote__text">' + esc(q.text) + '</p>'
    + '<footer class="quote__who"><span class="quote__av" aria-hidden="true">' + esc(initials(q.name)) + '</span><span>' + esc(q.name || '') + (q.title ? '<span class="quote__meta">' + esc(q.title) + '</span>' : '') + (q.date ? '<span class="quote__meta">' + esc(q.date) + '</span>' : '') + '</span>' + (q.stars ? stars(q.stars) : '') + '</footer></blockquote>'), { w: 'clamp(280px, 30vw, 380px)', ...opts });
}

export function reviews(b, ctx, opts = {}) {
  const s = b.summary || {};
  const m = /(\d[\d,]*)\s+reviews?/i.exec(s.text || '');
  let raw = String(s.text || '');
  if (s.label && raw.toUpperCase().startsWith(String(s.label).toUpperCase())) raw = raw.slice(String(s.label).length).trim();
  let txt = esc(raw);
  if (m) txt = txt.replace(m[1], '<span data-count="' + m[1].replace(/,/g, '') + '">' + m[1] + '</span>');
  const head = '<div class="rating" data-reveal>' + ICON.google + '<span class="rating__label">' + esc(s.label || '') + '</span>' + stars(5) + '<span class="rating__text">' + txt + '</span></div>';
  return '<div class="reviews">' + head + quotes(b.items.map((r) => ({ text: r.text, name: r.name, date: r.date, stars: r.stars })), opts) + '</div>';
}

export function faq(b, ctx) {
  return '<div class="faq">' + b.items.map((it, i) => '<details' + (i === 0 ? ' open' : '') + ' data-reveal style="--d:' + (i * 0.05).toFixed(2) + 's"><summary><span>' + esc(it.q) + '</span><span class="pm" aria-hidden="true"></span></summary><div class="faq__a prose">' + renderBlocks(it.blocks, ctx, { inFaq: true }) + '</div></details>').join('') + '</div>';
}

export function storeEmbed(b, ctx, opts = {}) {
  ctx.stores = (ctx.stores || 0) + 1;
  if (ctx.stores > 1) return '';   // an identical second embed of the same store on one page: one menu, unique ids
  return '<div class="store glass glass--strong edge" id="' + attr(opts.anchor || 'orderdelivery') + '" data-reveal>'
    + (opts.head || '')
    + '<div class="store__mount" id="my-store-' + attr(b.storeId) + '" data-ecwid="' + attr(b.storeId) + '"></div>'
    + '<div class="skel" aria-hidden="true">' + '<span class="skel__card"><i></i><b></b><b></b></span>'.repeat(6) + '</div>'
    + '<noscript><p>' + btn('Shop Now', '/shop/', { kind: 'dark' }) + '</p></noscript></div>';
}

export function mapEmbed(b) {
  return '<div class="mapframe" data-reveal><iframe data-src="' + attr(b.src) + '" title="' + attr(b.title || 'Map') + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>';
}

export function board(items) {
  return '<ul class="board">' + items.map((it, i) => {
    const m = /^(.*?),\s*([A-Z]{2})$/.exec(it.text);
    const label = m ? '<span>' + esc(m[1]) + ',</span><span>' + esc(m[2]) + '</span>' : '<span>' + esc(it.text) + '</span><span>' + ICON.right + '</span>';
    return '<li data-reveal style="--d:' + Math.min(0.6, i * 0.012).toFixed(3) + 's"><a href="' + attr(it.href || '#') + '"' + linkAttrs(it.href) + '>' + label + '</a></li>';
  }).join('') + '</ul>';
}

export function formBlock(b) {
  const id = 'f-' + (++FORM_N);
  const fields = b.fields.map((f, i) => {
    const fid = id + '-' + i;
    if (f.type === 'checkbox') return '<label class="check"><input type="checkbox" name="' + attr(f.name) + '" value="' + attr(f.value || f.label) + '"> <span>' + esc(f.label) + '</span></label>';
    const label = f.label || f.placeholder || f.name;
    const tag = f.type === 'textarea' ? '<textarea id="' + fid + '" name="' + attr(f.name) + '" placeholder="' + attr(f.placeholder) + '"' + (f.required ? ' required' : '') + '></textarea>'
      : f.type === 'select' ? '<select id="' + fid + '" name="' + attr(f.name) + '">' + (f.options || []).map((o) => '<option>' + esc(o) + '</option>').join('') + '</select>'
      : '<input id="' + fid + '" type="' + attr(['email', 'tel', 'number', 'date'].includes(f.type) ? f.type : 'text') + '" name="' + attr(f.name) + '" placeholder="' + attr(f.placeholder) + '"' + (f.required ? ' required' : '') + '>';
    return '<div class="form__row"><label for="' + fid + '">' + esc(label) + '</label>' + tag + '</div>';
  }).join('');
  const notes = (b.notes || []).map((n) => '<p class="muted">' + esc(n) + '</p>').join('');
  return '<form class="form" method="post" action="/__form-endpoint-not-configured__" data-reveal>' + notes + fields
    + '<button class="btn btn--primary" type="submit" disabled>' + esc(b.submit || 'Submit') + '<span class="ico">' + ICON.arrow + '</span></button>'
    + '<p class="form__note">This preview form is not connected yet.</p></form>';
}

export function posts(items, ctx, opts = {}) {
  return '<div class="posts grid grid--3">' + items.map((p, i) => {
    let im = '';
    if (p.img) { try { im = ctx.img(p.img.src, { alt: p.img.alt || '', sizes: '(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 400px' }); } catch (e) { ctx.warn('post card: ' + e.message); } }
    return '<article class="pcard" data-reveal style="--d:' + ((i % 3) * 0.08).toFixed(2) + 's" data-tilt><a class="pcard__img" href="' + attr(p.href) + '" tabindex="-1" aria-hidden="true">' + im + '</a><div class="pcard__body">'
      + (p.date ? '<p class="pcard__date">' + esc(p.date) + '</p>' : '')
      + '<h3 class="pcard__title"><a href="' + attr(p.href) + '">' + esc(p.title) + '</a></h3>'
      + (p.excerpt ? '<p class="pcard__ex">' + esc(p.excerpt.replace(/^Get ready for liftoff!\s*ORDER DELIVERY\s*/i, '')) + '</p>' : '')
      + '<a class="pcard__more" href="' + attr(p.href) + '" aria-label="' + attr((p.more || 'Read more') + ': ' + p.title) + '">' + esc(p.more || 'Read more') + ' ' + ICON.right + '</a></div></article>';
  }).join('') + '</div>' + postsPager(opts.pagination);
}

/** the live posts widget's numbered pagination (arrows, page numbers, current page) */
export function postsPager(list) {
  if (!list || !list.length) return '';
  return '<nav class="ppager" aria-label="Pagination">' + list.map((p) => {
    const label = esc(p.text).replace(/^Page(\d+)$/, '<span class="sr-only">Page </span>$1');
    if (p.current) return '<span class="ppager__n is-current" aria-current="page">' + label + '</span>';
    if (!p.href) return '<span class="ppager__n is-off" aria-hidden="true">' + label + '</span>';
    return '<a class="ppager__n" href="' + attr(p.href) + '">' + label + '</a>';
  }).join('') + '</nav>';
}

export function crumbs(items) {
  return '<nav aria-label="Breadcrumb"><ol class="crumbs">' + items.map((c) => '<li>' + (c.href ? '<a href="' + attr(c.href) + '">' + esc(c.text) + '</a>' : '<span aria-current="page">' + esc(c.text) + '</span>') + '</li>').join('') + '</ol></nav>';
}

export function socials(items) {
  return '<ul class="socials">' + items.filter((s) => s.href).map((s) => '<li><a href="' + attr(s.href) + '" target="_blank" rel="noopener" aria-label="' + attr(s.label || 'Social') + '">' + socialIcon(s) + '</a></li>').join('') + '</ul>';
}

function heading(b, opts) {
  if (b.level === 'h1' && opts.skipH1) return '';
  let lv = b.level === 'p' ? 'p' : b.level;
  if (lv === 'h1' && opts.demoteH1) lv = 'h2';
  if (opts.inFaq && /^h[1-3]$/.test(lv)) lv = 'h4';
  const cls = lv === 'p' ? 'kicker' : lv === 'h2' ? 'split' : '';
  return '<' + lv + (cls ? ' class="' + cls + '"' : '') + (lv === 'p' ? '' : ' data-reveal') + '>' + b.html + '</' + lv + '>';
}

/** render one block */
export function block(b, ctx, opts = {}) {
  switch (b.t) {
    case 'group': return group(b, ctx, opts);
    case 'heading': return heading(b, opts);
    case 'text': return '<div class="prose" data-reveal>' + richText(b.html, ctx) + '</div>';
    case 'image': return figure(b, ctx, opts.figure || {});
    case 'button': return '<p class="btns" data-reveal>' + btn(b.text, b.href) + '</p>';
    case 'list': return '<ul class="ilist" data-reveal>' + b.items.map((it) => '<li><span class="dot">' + ICON.check + '</span><span>' + (it.href && !/<a /.test(it.html) ? '<a href="' + attr(it.href) + '"' + linkAttrs(it.href) + '>' + it.html + '</a>' : it.html) + '</span></li>').join('') + '</ul>';
    case 'iconbox': return '<div class="card" data-reveal data-tilt>' + (b.title ? '<h3>' + (b.href ? '<a href="' + attr(b.href) + '">' + esc(b.title) + '</a>' : esc(b.title)) + '</h3>' : '') + (b.html ? '<div class="prose">' + b.html + '</div>' : '') + '</div>';
    case 'carousel': return tiles(b, ctx);
    case 'testimonials': return quotes(b.items, {});
    case 'reviews': return reviews(b, ctx);
    case 'faq': return faq(b, ctx);
    case 'store': return storeEmbed(b, ctx);
    case 'map': return mapEmbed(b);
    case 'embed': return '<div class="mapframe" data-reveal><iframe data-src="' + attr(b.src) + '" title="' + attr(b.title || 'Embedded content') + '" loading="lazy"></iframe></div>';
    case 'links': return board(b.items);
    case 'breadcrumbs': return opts.skipCrumbs ? '' : crumbs(b.items);
    case 'posts': return posts(b.items, ctx, { pagination: b.pagination });
    case 'form': return formBlock(b);
    case 'slides': return '<ul class="chips" data-reveal>' + b.items.map((s) => '<li>' + (s.button ? '<a class="chip" href="' + attr(s.button.href || '/shop/') + '">' + esc(s.heading) + ' &middot; ' + esc(s.button.text) + '</a>' : '<span class="chip">' + esc(s.heading) + '</span>') + '</li>').join('') + '</ul>';
    case 'social': return socials(b.items);
    case 'nav': case 'icon': case 'dropped': return '';
    default: ctx.warn('unknown block ' + b.t); return '';
  }
}

export function renderBlocks(blocks, ctx, opts = {}) { return (blocks || []).map((b) => block(b, ctx, opts)).join(''); }

const hasText = (g) => (g.children || []).some((c) => c.t === 'heading' || c.t === 'text');
const onlyImage = (g) => (g.children || []).length === 1 && g.children[0].t === 'image';

/** group layout heuristics: columns become a grid, feature boxes become glass cards, an image column becomes a split */
export function group(g, ctx, opts = {}) {
  const kids = g.children || [];
  const subs = kids.filter((k) => k.t === 'group');
  let inner;
  if (subs.length >= 2 && subs.length === kids.length) {
    const imgCol = subs.find(onlyImage);
    if (subs.length === 2 && imgCol) {
      const txt = subs.find((s) => s !== imgCol);
      inner = '<div class="split2' + (subs[0] === imgCol ? ' split2--rev' : '') + '"><div class="stack">' + renderBlocks(txt.children, ctx, opts) + '</div>' + figure(imgCol.children[0], ctx, { cls: 'split2__media' }) + '</div>';
    } else {
      const cards = subs.every((s) => hasText(s) && !(s.children || []).some((c) => c.t === 'group' || c.t === 'store' || c.t === 'faq' || c.t === 'testimonials' || c.t === 'reviews' || c.t === 'map'));
      const n = Math.min(subs.length, subs.length === 4 ? 4 : 3);
      inner = '<div class="grid grid--' + n + (cards ? ' cards' : '') + '">' + subs.map((s, i) => cards
        ? '<div class="card card--num' + (s.bg ? ' card--bg' : '') + '" data-reveal data-tilt style="--d:' + (i * 0.08).toFixed(2) + 's">' + (s.bg ? bgLayer(s.bg, ctx) : '') + '<div class="stack">' + renderBlocks(s.children, ctx, opts) + '</div></div>'
        : '<div class="col stack">' + group(s, ctx, opts) + '</div>').join('') + '</div>';
    }
  } else {
    inner = '<div class="stack">' + renderBlocks(kids, ctx, opts) + '</div>';
  }
  if (g.bg && opts.depth !== 0 && !opts.noBg) return '<div class="panel panel--bg">' + bgLayer(g.bg, ctx) + inner + '</div>';
  return inner;
}

export function bgLayer(ref, ctx, cls = '') {
  let src = null;
  try { src = ctx.imgSrc(ref, 1920); } catch (e) { ctx.warn('bg: ' + e.message); }
  return src ? '<div class="panel__bg ' + cls + '" aria-hidden="true" style="background-image:url(' + src + ')"></div>' : '';
}

export { findBlock };
