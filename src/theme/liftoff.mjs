// liftoff.mjs - LIFTOFF layout (owner: lane LIFTOFF). Rocket/Lifted Lounge logo hero + main paper + sticky aside.
// Copy is carried verbatim: blocks are only regrouped (labels into rail heads, h3+text runs into Q&A cards,
// a short loose intro into the hero) and restyled; decorative copies of images are aria-hidden with empty alts.
import { esc, attr, strip, ICON, findBlock, findBlocks, walkBlocks } from './util.mjs';
import { renderBlocks, block, group, btn, crumbs, tiles, quotes, reviews, storeEmbed, faq, mapEmbed, figure, bgLayer, richText } from './blocks.mjs';
import { backdrop, cloudBank, protrude, bagFan, ctaBox, section } from './parts.mjs';
import { heroArt, stripBlocks, genericSection } from './inner.mjs';

const isGroup = (b) => !!b && b.t === 'group';
const isTel = (b) => b.t === 'button' && /^tel:/.test(b.href || '');
const subGroups = (g) => (g.children || []).filter(isGroup);
const isColumns = (g) => { const s = subGroups(g); return s.length >= 2 && s.length === (g.children || []).length; };
const BARE = new Set(['store', 'reviews', 'posts', 'testimonials']);
const RICH = new Set(['store', 'posts', 'faq', 'map', 'testimonials', 'reviews', 'carousel', 'form', 'links', 'embed']);

/** container groups dissolve into one ordered list; column layouts and background panels stay intact */
function flatten(blocks) {
  const out = [];
  for (const b of blocks || []) {
    if (isGroup(b) && !isColumns(b) && !b.bg) out.push(...flatten(b.children));
    else out.push(b);
  }
  return out;
}

const titleCls = (html) => { const n = strip(html).length; return n <= 14 ? 'is-s' : n <= 28 ? 'is-m' : n <= 48 ? 'is-l' : 'is-xl'; };
const isLabel = (b) => (b.t === 'heading' && b.level !== 'h1' && b.level !== 'h2') || (b.t === 'text' && !/data-ref/.test(b.html || '') && strip(b.html).length <= 60);
const textLen = (list) => list.reduce((n, b) => n + strip(b.html || b.text || '').length, 0);

/* ---------------- hero ---------------- */
function liftoffHero(page, ctx, hero, h1Block, crumbItems, lede, bagsHtml) {
  const logo = findBlock([hero], (b) => b.t === 'image');
  const kick = findBlock([hero], (b) => b.t === 'heading');
  const cta = findBlock([hero], (b) => b.t === 'button');
  const art = heroArt(page);
  const title = h1Block ? h1Block.html : esc(page.h1 || strip(page.head.title).split('|')[0]);
  const lounge = !!logo && /ll-logo/i.test(logo.img.src);
  const logoFig = logo ? '<div class="ihero__logo lo-logo" data-depth="0.1"><div class="lo-halo" aria-hidden="true"></div><div class="lo-orbit" aria-hidden="true"><span></span></div>'
    + figure(logo, ctx, { cut: true, reveal: false, sizes: '(max-width: 760px) 50vw, 360px', cls: 'float float--slow' }) + '</div>' : '';
  const notice = (lede || []).filter((b) => b.t === 'heading').map((b) => '<p class="lo-notice">' + b.html + '</p>').join('');
  const ledeTxt = (lede || []).filter((b) => b.t === 'text');
  return '<section class="ihero lo-hero' + (lounge ? ' lo-hero--lounge' : '') + (bagsHtml ? ' lo-hero--bags' : '') + '">' + backdrop(ctx, { ...art, eager: true })
    + '<div class="ihero__scrim" aria-hidden="true"></div><div class="lo-beam" aria-hidden="true"></div>'
    + '<div class="wrap ihero__grid"><div class="ihero__copy hero-fade">'
    + (crumbItems ? crumbs(crumbItems) : '')
    + (kick ? '<p class="kicker lo-kicker">' + esc(kick.text) + '</p>' : '')
    + notice
    + '<h1 class="ihero__title display split ' + titleCls(title) + '">' + title + '</h1>'
    + (ledeTxt.length ? '<div class="ihero__lede prose" data-reveal style="--d:.2s">' + ledeTxt.map((b) => richText(b.html, ctx)).join('') + '</div>' : '')
    + '<div class="btns" data-reveal style="--d:.25s">' + (cta ? btn(cta.text, cta.href || '/shop/', { kind: 'primary' }) : '') + btn('(771) 216-1684', 'tel:7712161684', { kind: 'ghost' }) + '</div>'
    + '</div><div class="ihero__art">' + logoFig + (bagsHtml || '') + '</div></div>'
    + cloudBank(ctx, 'bottom') + '</section>';
}

/* ---------------- main column ---------------- */
function qaCard(heads, texts, ctx) {
  return '<div class="lo-qa" data-reveal>' + heads.map((h) => '<' + h.level + '>' + h.html + '</' + h.level + '>').join('')
    + texts.map((t) => '<div class="prose">' + richText(t.html, ctx) + '</div>').join('') + '</div>';
}

function shelf(car, labels, ctx) {
  const head = labels.length ? '<div class="lo-shelf__label">' + labels.map((l) => l.t === 'heading'
    ? (l.level === 'p' ? '<p class="kicker">' + l.html + '</p>' : '<' + l.level + ' class="lo-shelf__t">' + l.html + '</' + l.level + '>')
    : '<div class="lo-shelf__t">' + l.html + '</div>').join('') + '</div>' : '';
  return tiles(car, ctx, { head, w: 'clamp(168px, 18vw, 224px)', cls: 'lo-shelf' });
}

/** the paper's ordered blocks: lede, Q&A runs, labelled shelves, everything else through the shared renderer */
function paperItems(list, ctx) {
  const out = [];
  let qas = [];
  const flushQ = () => { if (qas.length) { out.push('<div class="lo-qas">' + qas.join('') + '</div>'); qas = []; } };
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    // a run of labels directly before a carousel becomes the rail's head
    if (isLabel(b) || b.t === 'carousel') {
      let j = i; const labels = [];
      while (j < list.length && isLabel(list[j])) labels.push(list[j++]);
      if (j < list.length && list[j].t === 'carousel') { flushQ(); out.push(shelf(list[j], labels, ctx)); i = j; continue; }
    }
    // a run of h3s followed by text(s) becomes a Q&A card
    if (b.t === 'heading' && b.level === 'h3') {
      let j = i; const heads = [];
      while (j < list.length && list[j].t === 'heading' && list[j].level === 'h3') heads.push(list[j++]);
      const texts = [];
      while (j < list.length && list[j].t === 'text') texts.push(list[j++]);
      if (texts.length) { qas.push(qaCard(heads, texts, ctx)); i = j - 1; continue; }
    }
    flushQ();
    if (i === 0 && b.t === 'text' && !/data-ref/.test(b.html || '') && strip(b.html).length <= 160) { out.push('<div class="prose lo-lede" data-reveal>' + richText(b.html, ctx) + '</div>'); continue; }
    out.push(block(b, ctx, { skipH1: true }));
  }
  flushQ();
  return out.join('');
}

const isAside = (g) => !!findBlock([g], (b) => b.t === 'testimonials' || (b.t === 'heading' && /^exclusives$/i.test(b.text)) || isTel(b))
  && !findBlock([g], (b) => b.t === 'heading' && b.level === 'h1');

function aside(g, ctx) {
  // dissolve wrapper groups, keep the call box group whole
  const kids = [];
  const unwrap = (list) => { for (const b of list || []) { if (isGroup(b) && !b.children.some(isTel)) unwrap(b.children); else kids.push(b); } };
  unwrap([g]); // starts at the aside group itself: when it IS the call box group it stays whole
  const parts = [];
  for (let i = 0; i < kids.length; i++) {
    const b = kids[i];
    if (b.t === 'testimonials') parts.push('<div class="aside__block">' + quotes(b.items, { w: '100%', cls: 'rail--aside' }) + '</div>');
    else if (b.t === 'reviews') parts.push('<div class="aside__block">' + reviews(b, ctx, { w: '100%', cls: 'rail--aside' }) + '</div>');
    else if (b.t === 'heading' && kids[i + 1] && kids[i + 1].t === 'carousel') {
      const car = kids[++i];
      parts.push('<div class="aside__block">' + tiles(car, ctx, { w: '78%', cls: 'rail--aside lo-ex', head: '<h2 class="aside__h">' + b.html + '</h2>' }) + '</div>');
    } else if (b.t === 'heading' && kids[i + 1] && kids[i + 1].t !== 'heading' && !isGroup(kids[i + 1])) {
      const nx = kids[++i];
      parts.push('<div class="aside__block lo-aside-note glass edge" data-reveal><h2 class="aside__h">' + b.html + '</h2>' + block(nx, ctx, {}) + '</div>');
    } else if (isGroup(b) && b.children.some(isTel)) parts.push(ctaBox(b.children));
    else parts.push('<div class="aside__block">' + block(b, ctx, {}) + '</div>');
  }
  return '<aside class="body-aside"><div class="body-aside__in">' + parts.join('') + '</div></aside>';
}

function bodySection(list, asideG, ctx, bagsHtml) {
  const bare = list.length > 0 && list.every((b) => BARE.has(b.t));
  const main = !list.length ? '' : bare ? '<div class="lo-bare">' + renderBlocks(list, ctx, {}) + '</div>'
    : '<div class="paper glass glass--strong edge lo-paper">' + paperItems(list, ctx) + '</div>';
  return '<section class="sec sec--body lo-body' + (asideG ? ' lo-body--aside' : '') + '"><div class="wrap body-grid' + (asideG ? '' : ' body-grid--solo') + '">'
    + (bagsHtml || '')
    + '<article class="body-main' + (bare ? ' body-main--bare' : '') + '">' + main + '</article>'
    + (asideG ? aside(asideG, ctx) : '') + '</div></section>';
}

/* ---------------- extra sections ---------------- */
function photosOf(page) {
  // real photos from the page's own galleries (not the product bags or product cards), for decorative frames
  const out = [];
  walkBlocks(page.sections.slice(1), (b) => { if (b.t === 'carousel') for (const it of b.items) if (!/bag|prodcard/i.test(it.img.src)) out.push(it.img.src); });
  return out;
}

function duo(s, ctx, n, photos) {
  const cards = s.children.map((g, i) => '<article class="lo-card glass glass--strong edge" data-reveal style="--d:' + (i * 0.12).toFixed(2) + 's"><span class="lo-card__n" aria-hidden="true">0' + (i + 1) + '</span><div class="stack">'
    + renderBlocks(flatten(g.children), ctx, {}) + '</div></article>').join('');
  const src = photos.length ? photos[(n * 3) % photos.length] : null;
  let media = '';
  if (src) {
    try { media = '<figure class="lo-duo__media frame" aria-hidden="true" data-reveal="zoom">' + ctx.img(src, { alt: '', sizes: '(max-width: 860px) 92vw, 44vw' }) + '</figure>'; } catch (e) { ctx.warn('duo photo: ' + e.message); }
  }
  const pro = protrude(ctx, n % 2 ? 'G-LEAF' : 'G-PLANE', 'lo-pro lo-pro--duo' + (n % 2 ? ' is-r' : ''), { depth: 0.18, sizes: '(max-width: 760px) 34vw, 260px', rot: n % 2 ? 14 : -10 });
  return '<section class="sec lo-sec lo-duo' + (n % 2 ? ' lo-duo--rev' : '') + (media ? ' lo-duo--photo' : '') + '"><div class="sec__aura" aria-hidden="true"></div>' + pro
    + '<div class="wrap lo-duo__grid">' + media + '<div class="lo-duo__cards">' + cards + '</div></div></section>';
}

function visit(s, ctx) {
  const mapG = s.children.find((g) => findBlock([g], (b) => b.t === 'map'));
  const other = s.children.find((g) => g !== mapG);
  const map = findBlock([mapG], (b) => b.t === 'map');
  const items = flatten(other.children);
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const b = items[i], nx = items[i + 1];
    const headed = b.t === 'heading' && nx && (nx.t === 'testimonials' || nx.t === 'reviews');
    const head = headed ? '<' + (b.level === 'p' ? 'p' : b.level) + ' class="lo-says__h">' + b.html + '</' + (b.level === 'p' ? 'p' : b.level) + '>' : '';
    const q = headed ? nx : b;
    if (q.t === 'testimonials') { out.push(quotes(q.items, { w: 'min(86%, 400px)', cls: 'lo-says', head })); if (headed) i++; }
    else if (q.t === 'reviews') { out.push(reviews(q, ctx, { w: 'min(86%, 400px)', cls: 'lo-says', head })); if (headed) i++; }
    else out.push(block(b, ctx, {}));
  }
  return '<section class="sec lo-sec lo-visit"><div class="wrap lo-visit__grid"><div class="lo-visit__map" data-reveal="left">' + mapEmbed(map)
    + protrude(ctx, 'G-PLANE', 'lo-pro lo-pro--map', { depth: 0.06, sizes: '(max-width: 760px) 36vw, 240px', rot: -12 }) + '</div>'
    + '<div class="lo-visit__says">' + out.join('') + '</div></div></section>';
}

function gallery(car, ctx) {
  return '<section class="sec lo-sec lo-gallery"><div class="lo-gallery__glow" aria-hidden="true"></div><div class="wrap">' + tiles(car, ctx, { w: 'clamp(220px, 23vw, 320px)', cls: 'lo-gallery__rail' }) + '</div></section>';
}

function extraSection(s, ctx, idx, page, photos, count) {
  const kids = s.children || [];
  const only = kids.length === 1 ? kids[0] : null;
  if (findBlock([s], (b) => b.t === 'faq' || b.t === 'store' || b.t === 'posts')) return genericSection(s, ctx, idx, page);
  if (only && only.t === 'carousel') return gallery(only, ctx);
  if (kids.length === 2 && kids.every(isGroup) && findBlock([s], (b) => b.t === 'map')) return visit(s, ctx);
  if (kids.length === 2 && kids.every((g) => isGroup(g) && findBlock([g], (b) => b.t === 'heading') && !findBlock([g], (b) => RICH.has(b.t)))) return duo(s, ctx, count.duo++, photos);
  return genericSection(s, ctx, idx, page);
}

const isProse = (s) => (s.children || []).some((c) => !isGroup(c)) && !findBlock([s], (b) => RICH.has(b.t));

export function liftoffPage(page, ctx) {
  const [hero, body, ...more] = page.sections;
  let rest = more;
  const h1Block = findBlock(page.sections, (b) => b.t === 'heading' && b.level === 'h1');
  const bc = findBlock(page.sections, (b) => b.t === 'breadcrumbs');
  const bagCar = findBlock([hero], (b) => b.t === 'carousel');
  const bags = bagFan(ctx, bagCar ? bagCar.items : null);
  let mainHtml = '', lede = null, asideG = null;
  if (body) {
    const kids = body.children || [];
    asideG = kids.find((k) => isGroup(k) && isAside(k)) || null;
    let list = flatten(stripBlocks(kids.filter((k) => k !== asideG), (b) => (b.t === 'heading' && b.level === 'h1') || b.t === 'breadcrumbs'));
    // an H1-only body: the next loose prose section becomes the paper
    if (!list.length && rest.length && isProse(rest[0])) { list = flatten(rest[0].children); rest = rest.slice(1); }
    // a short loose intro (heading + a few lines) rides in the hero instead of a near-empty paper
    if (!asideG && list.length && list.every((b) => b.t === 'heading' || b.t === 'text') && textLen(list) <= 420) { lede = list; list = []; }
    if (list.length || asideG) mainHtml = bodySection(list, asideG, ctx, asideG ? bags : '');
  }
  const photos = photosOf(page);
  const count = { duo: 0 };
  const extra = rest.map((s, i) => extraSection(s, ctx, i + 2, page, photos, count)).join('');
  // the first band after the hero rides up over the hero's lower edge (layering); see .lo-first
  const first = (html) => html.replace(/^<section class="sec /, '<section class="sec lo-first ');
  return liftoffHero(page, ctx, hero, h1Block, bc ? bc.items : null, lede, asideG && mainHtml ? '' : bags) + (mainHtml ? first(mainHtml) + extra : first(extra));
}
