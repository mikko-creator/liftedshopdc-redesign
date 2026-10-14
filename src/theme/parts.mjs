// parts.mjs - shared bespoke parts: video/photo backdrops, cloud banks, protruding cut-outs, the product-bag fan,
// the CTA box, the aside, section wrappers.
import { esc, attr, ICON, strip } from './util.mjs';
import { btn } from './blocks.mjs';

export const BAGS = ['assets/source/2024-06-higher-frequency-bag-2.png', 'assets/source/2024-06-casanova-fly-bag.png', 'assets/source/2024-06-bag-2.png', 'assets/source/2024-06-dust-mac-bag-2.png'];

/** a full-bleed backdrop: a loop video (poster first) or a still; always decorative */
export function backdrop(ctx, { loop = null, still = null, pos = '50% 50%', eager = false, cls = '' } = {}) {
  let v = null;
  if (loop) { try { v = ctx.video(loop, { posterWidth: 1920 }); } catch (e) { ctx.warn('loop: ' + e.message); } }
  if (v) {
    return '<div class="bgwrap ' + cls + '"><div class="loop" data-loop>'
      + '<img src="' + attr(v.poster) + '" srcset="' + attr(v.posterSrcset) + '" sizes="100vw" alt="" ' + (eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"') + ' decoding="async" style="object-position:' + pos + '">'
      + '<video muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" poster="' + attr(v.poster) + '"' + (v.mp4Phone ? ' data-src-phone="' + attr(v.mp4Phone) + '"' : '') + ' style="object-position:' + pos + '">'
      + (v.webm ? '<source data-src="' + attr(v.webm) + '" type="video/webm">' : '') + '<source data-src="' + attr(v.mp4) + '" type="video/mp4"></video></div>'
      + '<button class="loop__toggle" type="button" aria-label="Pause background motion">' + ICON.pause + ICON.play + '</button></div>';
  }
  if (still) {
    let im = '';
    try { im = ctx.img(still, { alt: '', sizes: '100vw', loading: eager ? 'eager' : 'lazy', fetchpriority: eager ? 'high' : undefined, attrs: { style: 'object-position:' + pos } }); } catch (e) { ctx.warn('still: ' + e.message); }
    return '<div class="bgwrap ' + cls + '"><div class="loop">' + im + '</div></div>';
  }
  return '';
}

export function cloudBank(ctx, where = 'bottom', extra = '') {
  let im = '';
  try { im = ctx.img('G-CLOUD-PLATE', { alt: '', sizes: '120vw', widths: [960, 1600, 2400] }); } catch (e) { ctx.warn(e.message); return ''; }
  return '<div class="cloudbank cloudbank--' + where + ' ' + extra + '" aria-hidden="true" data-depth="0.08">' + im + '</div>';
}

/** a protruding cut-out layer: absolutely placed by the caller's class, parallax depth, gentle float */
export function protrude(ctx, ref, cls, { depth = 0.15, sizes = '30vw', rot = 0, float = true, alt = '' } = {}) {
  let im = '';
  try { im = ctx.img(ref, { alt, sizes }); } catch (e) { ctx.warn('protrude: ' + e.message); return ''; }
  return '<div class="pro ' + cls + '" aria-hidden="' + (alt ? 'false' : 'true') + '" data-depth="' + depth + '"><div class="cutout' + (float ? ' float' : '') + '" style="--rot:' + rot + 'deg">' + im + '</div></div>';
}

/** the four product bags from the live liftoff carousel, fanned (decorative copies; the carousel's own alts are empty) */
export function bagFan(ctx, items) {
  const list = (items && items.length ? items.map((i) => i.img.src) : BAGS).slice(0, 4);
  return '<div class="bagfan" aria-hidden="true">' + list.map((src, i) => {
    let im = '';
    try { im = ctx.img(src, { alt: '', sizes: '(max-width: 760px) 34vw, 220px', widths: [240, 360, 500] }); } catch (e) { ctx.warn('bag: ' + e.message); }
    return '<div class="bagfan__bag bagfan__bag--' + (i + 1) + '" data-depth="' + (0.05 + i * 0.04).toFixed(2) + '"><div class="cutout float' + (i % 2 ? ' float--rev' : '') + '" style="animation-delay:-' + (i * 1.3).toFixed(1) + 's">' + im + '</div></div>';
  }).join('') + '</div>';
}

/** the live sidebar call box: phone button + "OR VIEW OUR MENU OF CANNABIS PRODUCTS" + Shop Now */
export function ctaBox(blocks) {
  const phone = blocks.find((b) => b.t === 'button' && /^tel:/.test(b.href || ''));
  const text = blocks.find((b) => b.t === 'text');
  const shop = blocks.find((b) => b.t === 'button' && !/^tel:/.test(b.href || ''));
  return '<div class="ctabox glass edge" data-reveal><div class="ctabox__glow" aria-hidden="true"></div>'
    + (phone ? '<a class="ctabox__phone" href="' + attr(phone.href) + '">' + ICON.phone + '<span>' + esc(phone.text) + '</span></a>' : '')
    + (text ? '<p class="ctabox__or">' + strip(text.html) + '</p>' : '')
    + (shop ? btn(shop.text, shop.href, { kind: 'primary' }) : '') + '</div>';
}

export function section(inner, { cls = '', id = '', bg = '' } = {}) {
  return '<section class="sec ' + cls + '"' + (id ? ' id="' + attr(id) + '"' : '') + '>' + bg + '<div class="wrap">' + inner + '</div></section>';
}
