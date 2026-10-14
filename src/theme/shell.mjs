// shell.mjs - the document: head (SEO from the live page), the sky, chrome, main, scripts.
import { esc, attr } from './util.mjs';
import { header, footer, dock, ageGate } from './chrome.mjs';

const ORIGIN = 'https://www.liftedshopdc.com';
const ORG = {
  '@type': 'Organization', '@id': ORIGIN + '/#organization', name: 'Lifted Shop', url: ORIGIN + '/', telephone: '(771) 216-1684',
  address: { '@type': 'PostalAddress', streetAddress: '2622 Georgia Ave NW', addressLocality: 'Washington', addressRegion: 'DC', postalCode: '20001', addressCountry: 'US' },
  sameAs: ['https://twitter.com/liftedshopdc', 'https://www.facebook.com/people/LiftedShop-DC/100072248696245/', 'https://www.instagram.com/lifteddmv/', 'https://www.tiktok.com/@liftedshopcafe'],
};

export function shell(ctx, o) {
  const p = o.page || {};
  const h = p.head || {};
  const title = o.title || h.title || 'Lifted Shop';
  const desc = o.description != null ? o.description : (h.description || '');
  const canonical = h.canonical || (p.path ? ORIGIN + p.path : ORIGIN + '/');
  const og = h.og || {};
  let ogImg = null;
  if (o.ogImage) { try { ogImg = ORIGIN + ctx.imgSrc(o.ogImage, 1280); } catch (e) { ctx.warn('og: ' + e.message); } }
  const graph = [ORG, { '@type': p.kind === 'post' ? 'Article' : 'WebPage', '@id': canonical + '#webpage', url: canonical, name: title, ...(desc ? { description: desc } : {}),
    isPartOf: { '@id': ORIGIN + '/#organization' },
    ...(p.kind === 'post' ? { headline: p.h1 || title, datePublished: og['article:published_time'], dateModified: og['article:modified_time'], publisher: { '@id': ORIGIN + '/#organization' } } : {}) }];
  if (o.crumbs && o.crumbs.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: o.crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.text, ...(c.href ? { item: ORIGIN + c.href } : {}) })) });
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    + '<title>' + esc(title) + '</title>'
    + (desc ? '<meta name="description" content="' + attr(desc) + '">' : '')
    + '<link rel="canonical" href="' + attr(canonical) + '">'
    + (h.robots ? '<meta name="robots" content="' + attr(h.robots) + '">' : '')
    + '<meta property="og:type" content="' + (p.kind === 'post' ? 'article' : 'website') + '"><meta property="og:site_name" content="Lifted Shop"><meta property="og:title" content="' + attr(og['og:title'] || title) + '">'
    + (desc ? '<meta property="og:description" content="' + attr(og['og:description'] || desc) + '">' : '') + '<meta property="og:url" content="' + attr(canonical) + '">'
    + (ogImg ? '<meta property="og:image" content="' + attr(ogImg) + '"><meta name="twitter:card" content="summary_large_image">' : '')
    + (og['article:published_time'] ? '<meta property="article:published_time" content="' + attr(og['article:published_time']) + '">' : '')
    + (og['article:modified_time'] ? '<meta property="article:modified_time" content="' + attr(og['article:modified_time']) + '">' : '')
    + '<meta name="theme-color" content="#07050f"><link rel="icon" href="/favicon.png" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">'
    + '<link rel="preload" href="/assets/fonts/unbounded-var.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/manrope-var.woff2" as="font" type="font/woff2" crossorigin>'
    + (o.preload || '')
    + '<link rel="stylesheet" href="' + ctx.assets.css + '">'
    + '<script>document.documentElement.classList.add("js-motion");setTimeout(function(){if(!window.__lifted)document.documentElement.classList.remove("js-motion")},2500)</script>'
    + '<script type="application/ld+json">' + ld + '</script>'
    + '</head><body class="' + attr(o.bodyClass || '') + '">'
    + '<a class="skip" href="#main">Skip to content</a><div class="sky" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div><div class="progress" aria-hidden="true"></div>'
    + header(ctx, p)
    + '<main id="main">' + o.main + '</main>'
    + footer(ctx) + dock(ctx) + ageGate(ctx)
    + '<script src="' + ctx.assets.js + '" defer></script></body></html>';
}
