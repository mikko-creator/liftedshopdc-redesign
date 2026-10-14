// archive.mjs - author archives, the 404 (owner: lane ARCHIVE). Blog index pages (/blog/, /blog/2/) are LIFTOFF pages whose main column holds a posts block.
// Copy: the archive H1, post titles/excerpts and the pagination labels come from the model verbatim; the 404 keeps its short UI copy.
// Everything else here (orb monogram, contrail, flight path, window) is an aria-hidden ornament.
import { esc, attr, strip, ICON } from './util.mjs';
import { shell } from './shell.mjs';
import { posts, btn } from './blocks.mjs';
import { backdrop, cloudBank, protrude } from './parts.mjs';

/** "Author: kevin" -> a small label + the name, same words in the same order; anything else renders as-is */
function archiveTitle(a, page) {
  const raw = a.h1Html || esc(page.h1 || '');
  const m = /^\s*(Author:)\s*([^<>]+?)\s*$/.exec(raw);
  if (!m) return { html: raw, initial: '' };
  const initial = strip(m[2]).charAt(0).toUpperCase();
  return { html: '<span class="ahero__pre">' + m[1] + '</span> <span class="ahero__name">' + m[2] + '</span>', initial };
}

const TRAIL = '<svg class="ahero__trail" viewBox="0 0 640 70" fill="none" aria-hidden="true"><defs><linearGradient id="ahero-trail-g" x1="0" x2="1" y1="0" y2="0">'
  + '<stop offset="0" stop-color="#fe1915" stop-opacity="0"/><stop offset=".25" stop-color="#fe1915"/><stop offset=".6" stop-color="#fed705"/><stop offset="1" stop-color="#2fc25b"/></linearGradient></defs>'
  + '<path class="ahero__trail-path" d="M4 52 C 150 66, 290 18, 420 30 S 600 40, 636 8" stroke="url(#ahero-trail-g)" stroke-width="3.2" stroke-linecap="round"/></svg>';

function pager(list) {
  if (!list.length) return '';
  const link = (rel) => {
    const p = list.find((x) => x.rel === rel);
    if (!p) return '<span class="apager__ghost" aria-hidden="true"></span>';
    return '<a class="btn ' + (rel === 'next' ? 'btn--primary' : 'btn--ghost') + ' apager__btn apager__btn--' + rel + '" href="' + attr(p.href) + '" rel="' + rel + '">'
      + (rel === 'prev' ? '<span class="apager__ico">' + ICON.left + '</span>' : '') + '<span>' + esc(p.text) + '</span>' + (rel === 'next' ? '<span class="apager__ico">' + ICON.right + '</span>' : '') + '</a>';
  };
  return '<nav class="apager" aria-label="Pagination" data-reveal>' + link('prev')
    + '<span class="apager__path" aria-hidden="true"><span class="apager__dash"></span><span class="apager__plane">' + ICON.plane + '</span></span>'
    + link('next') + '</nav>';
}

export function archivePage(page, ctx) {
  const a = page.archive || { posts: [], pagination: [] };
  const t = archiveTitle(a, page);
  let smoke = '';
  try { smoke = '<div class="decor decor--screen ahero__smoke" aria-hidden="true" data-depth="0.06">' + ctx.img('G-SMOKE', { alt: '', sizes: '80vw' }) + '</div>'; } catch (e) { ctx.warn('smoke: ' + e.message); }
  const orb = '<div class="ahero__orb" aria-hidden="true" data-depth="0.1"><span class="ahero__ring ahero__ring--dash"><i></i></span><span class="ahero__ring ahero__ring--comet"></span>'
    + '<span class="ahero__disc">' + (t.initial ? '<b>' + esc(t.initial) + '</b>' : ICON.plane) + '</span></div>';
  const hero = '<section class="ihero ahero">' + backdrop(ctx, { still: 'G-ORBIT', pos: '50% 72%', eager: true }) + '<div class="ihero__scrim" aria-hidden="true"></div>' + smoke
    + '<div class="wrap ahero__grid"><div class="ahero__copy">'
    + '<p class="kicker"><a href="/blog/">Blog</a></p>'
    + '<h1 class="ahero__title split">' + t.html + '</h1>' + TRAIL
    + '</div><div class="ahero__art">' + orb + '</div></div>' + cloudBank(ctx, 'bottom') + '</section>';
  const grid = '<section class="sec arch">' + protrude(ctx, 'G-PLANE', 'pro--arch-plane', { depth: 0.16, sizes: '(max-width: 760px) 42vw, 320px', rot: -6 })
    + '<div class="wrap">' + posts(a.posts, ctx) + pager(a.pagination)
    + (a.html ? '<div class="paper glass glass--strong prose">' + a.html + '</div>' : '') + '</div></section>';
  return hero + grid;
}

export function render404(ctx) {
  let sky = '';
  try { sky = ctx.img('G-HERO-SKY', { alt: '', sizes: '(max-width: 760px) 40vw, 300px' }); } catch (e) { ctx.warn('404 window: ' + e.message); }
  const code = '<div class="e404__code"><span class="sr-only">404</span><span class="e404__digits" aria-hidden="true"><span class="e404__d">4</span>'
    + '<span class="e404__win"><span class="e404__glass">' + sky + '<span class="e404__shade"></span><span class="e404__glare"></span></span></span>'
    + '<span class="e404__d">4</span></span>' + protrude(ctx, 'G-PLANE', 'pro--404-plane', { depth: 0.22, sizes: '(max-width: 760px) 36vw, 280px', rot: -10 }) + '</div>';
  const main = '<section class="ihero e404">' + backdrop(ctx, { loop: 'V-AURORA', still: 'G-AURORA', pos: '50% 50%', eager: true }) + '<div class="ihero__scrim e404__scrim" aria-hidden="true"></div>'
    + '<div class="wrap e404__in">' + code
    + '<h1 class="e404__title display split">Lost in the clouds</h1><p class="lede e404__lede" data-reveal style="--d:.2s">This page took off without you.</p>'
    + '<div class="btns e404__btns" data-reveal style="--d:.3s">' + btn('Return to Home', '/', { kind: 'primary' }) + btn('Shop Now', '/shop/', { kind: 'ghost' }) + '</div></div>'
    + cloudBank(ctx, 'bottom') + '</section>';
  return shell(ctx, { page: { path: '/404.html', head: { title: 'Page not found | Lifted Shop', robots: 'noindex' } }, main, bodyClass: 'l-404' });
}
