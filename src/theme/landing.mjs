// landing.mjs - LANDING layout (owner: lane LANDING). H1 + intro hero, then reviews, menu, features, testimonials + map, FAQ.
// Every block of the page model still renders with its own words; only structure and presentation change.
// Section shapes handled bespoke (census of the 36 landing pages): reviews band, store band, map band, feature pairs,
// FAQ (seven shapes: lead content -> cards, heading + accordion, closing CTA), testimonials + map/form, standalone CTA.
import { esc, strip, ICON, findBlock, stars, initials } from './util.mjs';
import { renderBlocks, block, btn, reviews, storeEmbed, faq, mapEmbed, richText } from './blocks.mjs';
import { backdrop, cloudBank, protrude } from './parts.mjs';
import { heroArt, stripBlocks, genericSection, storeHead } from './inner.mjs';

const isH = (b) => b.t === 'heading';
/** flatten nested groups into a leaf list (faq/testimonials/map stay leaves) */
const flat = (blocks) => { const out = []; for (const b of blocks || []) { if (b.t === 'group') out.push(...flat(b.children)); else out.push(b); } return out; };
const leafy = (page) => /pre-roll|live-resin|concentrate/.test(page.path);

/** per-page image picker: never repeats the hero still; DUSK / HERO-SKY are kept for the closing CTA */
function picker(page) {
  const art = heroArt(page);
  const used = new Set([art.still]);
  const p = page.path;
  const first = /pre-roll/.test(p) ? ['G-PREROLL', 'G-SMOKE'] : /live-resin|concentrate/.test(p) ? ['G-RESIN'] : /recreational/.test(p) ? ['G-CITY-GLOW'] : [];
  const pool = [...first, 'G-PARCEL', 'G-CITY-GLOW', 'G-PREROLL', 'G-RESIN', 'G-ORBIT', 'G-SMOKE'];
  return {
    take(pref) { const list = [...(pref || []), ...pool]; const hit = list.find((x) => !used.has(x)) || list[0]; used.add(hit); return hit; },
  };
}

function pic(ctx, ref, sizes, cls) {
  try { return ctx.img(ref, { alt: '', sizes, cls }); } catch (e) { ctx.warn('landing img: ' + e.message); return ''; }
}

/* ---------- rich text: drop empty headings, number the step paragraphs (words untouched) ---------- */
const cleanHtml = (h) => String(h || '').replace(/<h([1-6])[^>]*>(?:\s|&nbsp;|&#160;)*<\/h\1>/g, '');
function stepify(html) {
  const nNum = (html.match(/<p>\s*<strong>\s*\d{1,2}\.\s/g) || []).length;
  const nStep = (html.match(/<p>\s*<strong>\s*Step\s+\d{1,2}/gi) || []).length;
  if (nNum >= 2) return { steps: true, html: html.replace(/<p>(\s*)<strong>(\s*)(\d{1,2}\.)/g, '<p class="lx-step">$1<strong>$2<span class="lx-n">$3</span>') };
  if (nStep >= 2) return { steps: true, html: html.replace(/<p>(\s*)<strong>(\s*)(Step\s+\d{1,2}:?)/gi, '<p class="lx-step lx-step--word">$1<strong>$2<span class="lx-n">$3</span>') };
  if (/<ol[\s>]/.test(html)) return { steps: true, html };
  return { steps: false, html };
}
function textBlock(b, ctx) {
  const s = stepify(cleanHtml(b.html));
  return '<div class="prose' + (s.steps ? ' lx-steps' : '') + '" data-reveal>' + richText(s.html, ctx) + '</div>';
}
/** leaf renderer used by every bespoke panel; anything unusual falls back to the shared block renderer */
function leaves(blocks, ctx) {
  return blocks.map((b) => b.t === 'text' ? textBlock(b, ctx) : b.t === 'button' ? '<p class="btns" data-reveal>' + btn(b.text, b.href) + '</p>' : block(b, ctx, {})).join('');
}
const hasSteps = (blocks) => blocks.some((b) => b.t === 'text' && stepify(cleanHtml(b.html)).steps);

/* ---------- hero ---------- */
function titleTier(html) { const n = strip(html).length; return n <= 18 ? 'xl' : n <= 34 ? 'l' : n <= 48 ? 'm' : 's'; }

function landingHero(page, ctx, s0, pick) {
  const h1 = findBlock([s0], (b) => b.t === 'heading' && b.level === 'h1') || findBlock([s0], isH);
  const rest = flat(stripBlocks([s0], (b) => b === h1));
  const lede = rest.filter((b) => b.t !== 'button');
  const ctas = rest.filter((b) => b.t === 'button');
  const art = heroArt(page);
  const port = pick.take(art.still === 'G-TRICHOME' ? ['G-RESIN'] : ['G-TRICHOME']);
  const cut = leafy(page)
    ? protrude(ctx, 'G-LEAF', 'lx-pro lx-pro--leaf', { depth: 0.12, sizes: '(max-width: 900px) 60vw, 360px', rot: -14 })
    : protrude(ctx, 'G-BUD', 'lx-pro lx-pro--bud', { depth: 0.12, sizes: '(max-width: 900px) 46vw, 300px', rot: 8 });
  const title = h1 ? h1.html : esc(page.h1 || '');
  return '<section class="ihero lx-hero">' + backdrop(ctx, { ...art, eager: true })
    + '<div class="ihero__scrim lx-hero__scrim" aria-hidden="true"></div><div class="lx-hero__haze" aria-hidden="true"></div>'
    + '<div class="wrap lx-hero__grid"><div class="lx-hero__copy hero-fade">'
    + '<p class="kicker">' + (page.path.startsWith('/delivery/') ?'Lifted Shop &middot; Delivery' : 'Lifted Shop') + '</p>'
    + '<h1 class="lx-hero__title lx-t-' + titleTier(title) + ' display split">' + title + '</h1>'
    + '<div class="lx-hero__lede glass edge">' + leaves(lede, ctx)
    + (ctas.length ? '<p class="btns">' + ctas.map((b) => btn(b.text, b.href)).join('') + '</p>' : '') + '</div>'
    + '</div><div class="lx-hero__art" aria-hidden="true">'
    + '<div class="lx-port" data-depth="0.05"><div class="lx-port__orbit"></div><div class="lx-port__ring"></div><div class="lx-port__in">' + pic(ctx, port, '(max-width: 900px) 76vw, 420px') + '</div>' + cut + '</div>'
    + protrude(ctx, 'G-PLANE', 'lx-pro lx-pro--plane', { depth: 0.3, sizes: '(max-width: 900px) 32vw, 220px', rot: -10 })
    + '</div></div>' + cloudBank(ctx, 'bottom') + '</section>';
}

/* ---------- bands ---------- */
function reviewsBand(b, ctx) {
  // long reviews get a double-width card so the track height is not set by one tall card
  const html = reviews(b, ctx, { w: 'min(82vw, 340px)' }).replace(/<div role="listitem">(<blockquote class="quote"[^>]*><div class="quote__mark"[^>]*>[^<]*<\/div><p class="quote__text">)([^<]*)<\/p>/g,
    (m, a, t) => (t.length > 200 ? '<div role="listitem" class="lx-wide">' + a + t + '</p>' : m));
  return '<section class="sec lx-reviews"><div class="wrap">' + html + '</div></section>';
}

function storeBand(b, ctx, page) {
  const cut = leafy(page) ? 'G-BUD' : 'G-LEAF';
  return '<section class="sec sec--store lx-store"><div class="lx-store__halo" aria-hidden="true"></div><div class="wrap">' + storeEmbed(b, ctx, { head: storeHead() }) + '</div>'
    + protrude(ctx, cut, 'pro--store-bud lx-pro--store', { depth: 0.22, sizes: '260px', rot: -10 }) + '</section>';
}

function mapBand(b) {
  return '<section class="sec lx-mapband"><div class="wrap"><div class="lx-mapband__frame"><div class="lx-mapph" aria-hidden="true">' + ICON.pin + '</div>' + mapEmbed(b) + '</div></div></section>';
}

/* ---------- feature cards ---------- */
function card(blocks, ctx, { i = 0, media = null, cut = '' } = {}) {
  return '<article class="lx-card glass edge' + (media ? ' lx-card--media' : '') + (hasSteps(blocks) ? ' lx-card--steps' : '') + '" data-reveal style="--d:' + (i * 0.12).toFixed(2) + 's">'
    + (media ? '<figure class="lx-card__media" aria-hidden="true">' + media + '</figure>' + cut : '')
    + '<div class="lx-card__body stack">' + leaves(blocks, ctx) + '</div></article>';
}

function features(cards, ctx, pick, st, page) {
  st.feat = (st.feat || 0) + 1;
  const n = st.feat;
  // the image goes on the first card without numbered steps (steps read better on a clean panel)
  const mi = Math.max(0, cards.findIndex((c) => !hasSteps(c)));
  const cutRef = (n % 2 === 1) === leafy(page) ? 'G-BUD' : 'G-LEAF';
  const html = cards.map((c, i) => i === mi
    ? card(c, ctx, { i, media: pic(ctx, pick.take(), cards.length > 1 ? '(max-width: 900px) 100vw, 620px' : '(max-width: 900px) 100vw, 560px'), cut: protrude(ctx, cutRef, 'lx-pro lx-pro--card', { depth: 0.1, sizes: '190px', rot: n % 2 ? -12 : 10 }) })
    : card(c, ctx, { i })).join('');
  const cls = cards.length === 1 ? ' lx-feat--solo' : cards.length > 2 ? ' lx-feat--many' : '';
  return '<section class="sec lx-feat' + cls + (n % 2 === 0 ? ' lx-feat--flip' : '') + '"><div class="sec__aura" aria-hidden="true"></div><div class="wrap"><div class="lx-feat__grid">' + html + '</div></div></section>';
}

/* ---------- closing CTA ---------- */
function ctaPanel(blocks, ctx, pick, page) {
  const bg = pick.take(['G-DUSK', 'G-HERO-SKY']);
  return '<div class="lx-cta" data-reveal><div class="lx-cta__bg" aria-hidden="true">' + pic(ctx, bg, '(max-width: 900px) 100vw, 1240px') + '</div>'
    + '<div class="lx-cta__copy">' + leaves(blocks, ctx) + '</div>'
    + protrude(ctx, leafy(page) ? 'G-LEAF' : 'G-BUD', 'lx-pro lx-pro--cta', { depth: 0.16, sizes: '200px', rot: 12 }) + '</div>';
}
const isCta = (ls) => ls.length && ls.every((b) => ['heading', 'text', 'button'].includes(b.t)) && ls[ls.length - 1].t === 'button'
  && ls.filter(isH).length <= 1 && ls.filter((b) => b.t === 'text').reduce((a, b) => a + strip(b.html).length, 0) < 700;

/* ---------- FAQ ---------- */
function faqSection(s, ctx, faqB, pick, st, page) {
  const kids = s.children || [];
  const holder = kids.includes(faqB) ? null : kids.find((k) => k.t === 'group' && findBlock([k], (b) => b === faqB));
  const hi = holder ? kids.indexOf(holder) : -1;
  const before = holder ? kids.slice(0, hi) : [];
  const after = holder ? kids.slice(hi + 1) : [];
  const seq = flat(holder ? holder.children : kids);
  const at = seq.indexOf(faqB);
  let hs = at; while (hs > 0 && isH(seq[hs - 1])) hs--;
  const lead = seq.slice(0, hs), head = seq.slice(hs, at), tail = seq.slice(at + 1);
  const tailCta = tail.some((b) => b.t !== 'button');
  const cards = [...before.map((g) => flat([g])), ...(lead.length ? [lead] : [])];
  let out = cards.length ? features(cards, ctx, pick, st, page) : '';
  out += '<section class="sec lx-faq"><div class="lx-faq__smoke" aria-hidden="true">' + pic(ctx, 'G-SMOKE', '60vw') + '</div><div class="wrap">'
    + '<div class="lx-faq__grid' + (head.length ? '' : ' lx-faq__grid--solo') + '">'
    + (head.length ? '<div class="lx-faq__head">' + leaves(head, ctx)
      + '<div class="lx-faq__art" aria-hidden="true"><div class="lx-faq__frame">' + pic(ctx, pick.take(['G-ORBIT', 'G-CITY-GLOW']), '(max-width: 900px) 90vw, 420px') + '</div>'
      + protrude(ctx, 'G-PLANE', 'lx-pro lx-pro--faq', { depth: 0.05, sizes: '160px', rot: -16 }) + '</div></div>' : '')
    + '<div class="lx-faq__list">' + faq(faqB, ctx) + (tail.length && !tailCta ? leaves(tail, ctx) : '') + '</div></div>'
    + (tailCta ? ctaPanel(tail, ctx, pick, page) : '') + '</div></section>';
  if (after.length) out += features(after.map((g) => flat([g])), ctx, pick, st, page);
  return out;
}

/* ---------- testimonials + map (or form) ---------- */
function quoteStack(items) {
  return '<div class="lx-quotes">' + items.map((q, i) => '<blockquote class="quote lx-quote" data-reveal data-tilt style="--d:' + (i * 0.1).toFixed(2) + 's"><div class="quote__mark" aria-hidden="true">&ldquo;</div><p class="quote__text">' + esc(q.text) + '</p>'
    + '<footer class="quote__who"><span class="quote__av" aria-hidden="true">' + esc(initials(q.name)) + '</span><span>' + esc(q.name || '') + (q.title ? '<span class="quote__meta">' + esc(q.title) + '</span>' : '') + (q.date ? '<span class="quote__meta">' + esc(q.date) + '</span>' : '') + '</span>' + (q.stars ? stars(q.stars) : '') + '</footer></blockquote>').join('') + '</div>';
}
function proofSection(s, ctx) {
  const kids = s.children || [];
  const tg = kids.find((k) => findBlock([k], (b) => b.t === 'testimonials'));
  const others = kids.filter((k) => k !== tg);
  const left = flat([tg]).map((b) => b.t === 'testimonials' ? quoteStack(b.items) : leaves([b], ctx)).join('');
  const right = others.map((g) => {
    const ls = flat([g]);
    return ls.length === 1 && ls[0].t === 'map' ? '<div class="lx-proof__map"><div class="lx-mapph" aria-hidden="true">' + ICON.pin + '</div>' + mapEmbed(ls[0]) + '</div>' : '<div class="lx-proof__side glass edge">' + leaves(ls, ctx) + '</div>';
  }).join('');
  return '<section class="sec lx-proof"><div class="sec__aura" aria-hidden="true"></div><div class="wrap"><div class="lx-proof__grid"><div class="lx-proof__quotes">' + left + '</div><div class="lx-proof__aside">' + right + '</div></div></div></section>';
}

/* ---------- router ---------- */
const SPECIAL = ['store', 'reviews', 'map', 'carousel', 'form', 'posts', 'links', 'embed', 'slides', 'image'];
function section(s, ctx, idx, page, pick, st) {
  const kids = s.children || [];
  const only = kids.length === 1 ? kids[0] : null;
  if (only && only.t === 'reviews') return reviewsBand(only, ctx);
  if (only && only.t === 'store') return storeBand(only, ctx, page);
  if (only && only.t === 'map') return mapBand(only);
  const faqB = findBlock([s], (b) => b.t === 'faq');
  if (faqB) return faqSection(s, ctx, faqB, pick, st, page);
  if (findBlock([s], (b) => b.t === 'testimonials')) return proofSection(s, ctx);
  if (findBlock([s], (b) => SPECIAL.includes(b.t))) return genericSection(s, ctx, idx, page);
  const groups = kids.filter((k) => k.t === 'group');
  if (groups.length >= 2 && groups.length === kids.length) return features(groups.map((g) => flat([g])), ctx, pick, st, page);
  const ls = flat(kids);
  if (isCta(ls)) return '<section class="sec lx-ctasec"><div class="wrap">' + ctaPanel(ls, ctx, pick, page) + '</div></section>';
  return features([ls], ctx, pick, st, page);
}

export function landingPage(page, ctx) {
  const [s0, ...rest] = page.sections;
  const pick = picker(page);
  const st = {};
  return landingHero(page, ctx, s0, pick) + rest.map((s, i) => section(s, ctx, i + 1, page, pick, st)).join('');
}
