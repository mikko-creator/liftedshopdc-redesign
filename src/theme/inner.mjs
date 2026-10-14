// inner.mjs - the two inner layouts of the live site, redesigned:
//  LIFTOFF: section 0 = rocket (or Lifted Lounge) logo + "Get ready for liftoff!" + product-bag carousel + ORDER DELIVERY;
//           section 1 = main column (H1, copy) + sidebar (testimonials, Exclusives, call box); then extra sections.
//  LANDING: section 0 = H1 + intro + ORDER DELIVERY; then reviews, the menu (store), features, testimonials + map, FAQ.
// Both move the page's own H1 into a full-bleed hero; no copy is added or removed.
import { esc, attr, strip, ICON, findBlock, findBlocks, walkBlocks } from './util.mjs';
import { renderBlocks, block, group, btn, crumbs, tiles, quotes, reviews, storeEmbed, faq, mapEmbed, figure, bgLayer } from './blocks.mjs';
import { backdrop, cloudBank, protrude, bagFan, ctaBox, section } from './parts.mjs';

const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const ROTATE = ['G-DUSK', 'G-HERO-SKY', 'G-AURORA', 'G-ORBIT', 'G-TRICHOME', 'G-CITY-GLOW'];
// hero art per page: a generated still/loop, or a real photo the live page itself uses
export function heroArt(page) {
  const p = page.path;
  if (p === '/lifted-lounge/') return { still: 'assets/source/2024-06-flyer-bg.jpg', pos: '50% 40%' };
  if (/orbit/.test(p)) return { still: 'G-ORBIT', pos: '50% 60%' };
  if (p === '/delivery/') return { still: 'G-PARCEL', pos: '50% 55%' };
  if (/^\/delivery\//.test(p)) return { loop: 'V-AURORA', still: 'G-AURORA', pos: '60% 50%' };
  if (/pre-roll/.test(p)) return { still: 'G-PREROLL', pos: '60% 50%' };
  if (/live-resin|concentrate/.test(p)) return { still: 'G-RESIN', pos: '50% 50%' };
  if (/same-day/.test(p)) return { still: 'G-PARCEL', pos: '50% 55%' };
  if (/recreational|premium-weed|where-to-buy/.test(p)) return { still: 'G-CITY-GLOW', pos: '50% 60%' };
  if (p === '/shop/') return { loop: 'V-HERO', still: 'G-HERO-SKY', pos: '50% 60%' };
  if (p === '/cannabis-dispensary-photos/') return { still: 'G-TRICHOME', pos: '50% 50%' };
  if (page.kind === 'post') return { still: ROTATE[hash(p) % ROTATE.length], pos: '50% 55%' };
  return { still: ROTATE[hash(p) % 3], pos: '50% 55%' };
}

const isLiftoffHero = (s) => !!findBlock([s], (b) => b.t === 'image' && /lifted-rocket-logo|ll-logo/i.test(b.img.src)) || !!findBlock([s], (b) => b.t === 'carousel' && b.items.some((i) => /bag/i.test(i.img.src)));
export function layoutOf(page) {
  if (page.kind === 'home') return 'home';
  if (page.kind === 'author') return 'archive';
  if (page.sections.length && isLiftoffHero(page.sections[0])) return 'liftoff';
  return 'landing';
}

export function stripBlocks(blocks, pred) {
  // remove blocks matching pred (deep), keep everything else; returns a new tree
  const out = [];
  for (const b of blocks || []) {
    if (pred(b)) continue;
    if (b.t === 'group') { const ch = stripBlocks(b.children, pred); if (ch.length) out.push({ ...b, children: ch }); }
    else out.push(b);
  }
  return out;
}

/* ---------------- generic section (both layouts, and anything else) ---------------- */
export function genericSection(s, ctx, idx, page) {
  // special whole-section blocks get full-width bands
  const only = (s.children || []).length === 1 ? s.children[0] : null;
  if (only && only.t === 'reviews') return '<section class="sec sec--tight sec--reviews"><div class="wrap">' + reviews(only, ctx) + '</div></section>';
  if (only && only.t === 'store') return '<section class="sec sec--store"><div class="wrap">' + storeEmbed(only, ctx, { head: storeHead() }) + '</div>' + protrude(ctx, 'G-BUD', 'pro--store-bud', { depth: 0.22, sizes: '260px', rot: -10 }) + '</section>';
  const faqB = findBlock([s], (b) => b.t === 'faq');
  if (faqB) return faqSection(s, ctx, faqB);
  const deco = idx % 2 ? '<div class="sec__aura" aria-hidden="true"></div>' : '';
  return '<section class="sec sec--gen' + (s.bg ? ' sec--hasbg' : '') + '">' + deco + '<div class="wrap">' + group(s, ctx, { depth: 1 }) + '</div></section>';
}

export function storeHead() {
  return '<div class="store__head"><div><p class="kicker">Order Delivery</p><h2 class="store__title">Shop Now</h2></div>' + btn('(771) 216-1684', 'tel:7712161684', { kind: 'ghost' }) + '</div>';
}

function faqSection(s, ctx, faqB) {
  // heading(s) before the accordion go left (sticky); the accordion right; anything after it (closing CTA) below
  const flat = [];
  walkBlocks([s], (b) => { if (b.t !== 'group' && b !== faqB) flat.push(b); });
  const inFaq = new Set(); walkBlocks(faqB.items.flatMap((i) => i.blocks), (b) => inFaq.add(b));
  const others = flat.filter((b) => !inFaq.has(b));
  // split: blocks that come before the accordion in document order vs after
  const order = []; walkBlocks([s], (b) => { if (b === faqB || (b.t !== 'group' && !inFaq.has(b))) order.push(b); });
  const at = order.indexOf(faqB);
  const before = order.slice(0, at), after = order.slice(at + 1);
  const pre = before.filter((b) => others.includes(b));
  const post = after.filter((b) => others.includes(b));
  return '<section class="sec sec--faq"><div class="wrap"><div class="faqgrid"><div class="faqgrid__head">' + renderBlocks(pre, ctx, {}) + '</div><div>' + faq(faqB, ctx) + '</div></div>'
    + (post.length ? '<div class="closing glass edge" data-reveal>' + renderBlocks(post, ctx, {}) + '</div>' : '') + '</div></section>';
}
