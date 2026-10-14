// chrome.mjs - announcement, glass header with image mega menus, mobile menu, footer, mobile dock, age gate.
// Every label and link comes from the live header (#783), footer (#951), menu popup (#1302) and age-gate popups
// (#1731 / #1729) in src/content/site.json. The mega-menu cards reuse labels and links that exist on the live site.
import { esc, attr, strip, ICON, findBlock, findBlocks } from './util.mjs';
import { socials } from './blocks.mjs';

const PHONE_TEL = 'tel:7712161684';

function siteFacts(site) {
  const hdrNav = findBlock(site.header, (b) => b.t === 'nav');
  const announce = findBlock(site.header, (b) => b.t === 'heading');
  const phoneBtn = findBlock(site.header, (b) => b.t === 'button' && /^tel:/.test(b.href || ''));
  const footSocial = findBlock(site.footer, (b) => b.t === 'social');
  const menuSocial = findBlock(site.menuPopup, (b) => b.t === 'social');
  const lists = findBlocks(site.footer, (b) => b.t === 'list');
  const heads = findBlocks(site.footer, (b) => b.t === 'heading');
  const texts = findBlocks(site.footer, (b) => b.t === 'text');
  const dock = findBlocks(site.footer, (b) => b.t === 'iconbox');
  const gateTexts = findBlocks(site.ageGate, (b) => b.t === 'text').map((t) => strip(t.html));
  const gateBtns = findBlocks(site.ageGate, (b) => b.t === 'button');
  const no = { heading: (findBlock(site.ageNo, (b) => b.t === 'heading') || {}).text, text: strip((findBlock(site.ageNo, (b) => b.t === 'text') || {}).html), button: findBlock(site.ageNo, (b) => b.t === 'button') };
  return { nav: hdrNav ? hdrNav.items : [], announce: announce ? announce.text : '', phone: phoneBtn ? phoneBtn.text : '(771) 216-1684', footSocial, menuSocial, lists, heads, texts, dock, gateTexts, gateBtns, no };
}

// mega cards: label + href from the live nav / home sections; image = a real photo the live page uses, or a generated
// still where the live site has none (decorative, alt="")
const MEGA = {
  '/about/': { label: 'Locations', cards: [
    { href: '/about/lifted-dispensary-dc/', text: 'Lifted Shop', img: 'G-HERO-SKY', logo: 'assets/source/2024-06-lifted-rocket-logo-1.png' },
    { href: '/orbit-shop/', text: 'Orbit Shop', img: 'assets/source/2024-08-https-dispensaryindc.com-wp-content-uploads-2024-03-20221220_162733-1-scaled-1-e1723134889260.jpg' },
    { href: '/lifted-lounge/', text: 'Lifted Lounge', img: 'assets/source/2024-11-weed-bar-dc.jpg' },
    { href: '/reviews/', text: 'Reviews', img: 'G-AURORA' },
  ] },
  '/shop/': { label: 'Shop Categories', cards: [
    { href: '/shop/', text: 'Cannabis Flower', img: 'assets/source/2024-06-flower-square.webp' },
    { href: '/shop/', text: 'Cannabis Edibles', img: 'assets/source/2024-06-edibles-square.webp' },
    { href: '/shop/', text: 'Cannabis Concentrates', img: 'assets/source/2024-06-concentrates-square.webp' },
    { href: '/shop/', text: 'Cannabis Carts', img: 'assets/source/2024-06-carts-square.webp' },
  ] },
  '/delivery/': { label: 'Our Delivery Areas include:', cards: [
    { href: '/same-day-weed-delivery-in-dc/', text: 'Same-Day Weed Delivery in DC', img: 'G-PARCEL' },
    { href: '/delivery/maryland/', text: 'Maryland', img: 'G-CITY-GLOW' },
    { href: '/delivery/virginia/', text: 'Virginia', img: 'G-AURORA' },
    { href: '/delivery/', text: 'Weed Delivery', img: 'G-DUSK' },
  ] },
};

function megaCards(conf, ctx) {
  return '<div class="mega__grid"><p class="mega__label">' + esc(conf.label) + '</p>' + conf.cards.map((c) => {
    let im = '';
    try { im = ctx.img(c.img, { alt: '', sizes: '200px', widths: [320, 480] }); } catch (e) { ctx.warn('mega: ' + e.message); }
    let logo = '';
    if (c.logo) { try { logo = ctx.img(c.logo, { alt: '', sizes: '120px', widths: [160, 320], cls: 'mcard__logo' }); } catch (e) { ctx.warn('mega logo: ' + e.message); } }
    return '<a class="mcard' + (c.logo ? ' mcard--logo' : '') + '" href="' + attr(c.href) + '">' + im + logo + '<span>' + esc(c.text) + ICON.arrow + '</span></a>';
  }).join('') + '</div>';
}

export function header(ctx, page) {
  const f = siteFacts(ctx.site);
  const cur = page ? page.path : '';
  const isCur = (h) => h && h !== '#' && (h === cur || (h !== '/' && cur.startsWith(h)));
  const items = f.nav.map((it, i) => {
    const conf = MEGA[it.href];
    if (conf || it.children.length) {
      // the live "About" dropdown: About > Locations > (Lifted Shop, Orbit Shop, Lifted Lounge), Reviews
      const mega = conf ? megaCards(conf, ctx) : '';
      return '<li class="has-mega"><a class="nav__link" href="' + attr(it.href) + '"' + (isCur(it.href) ? ' aria-current="page"' : '') + '>' + esc(it.text) + '</a>'
        + '<button class="nav__link mega-toggle" type="button" aria-expanded="false" aria-label="' + attr(it.text + ' menu') + '" style="padding:0 10px;margin-left:-12px">' + ICON.down + '</button>'
        + '<div class="mega">' + mega + '</div></li>';
    }
    return '<li><a class="nav__link" href="' + attr(it.href) + '"' + (isCur(it.href) ? ' aria-current="page"' : '') + '>' + esc(it.text) + '</a></li>';
  }).join('');
  let word = '', badge = '';
  try { word = ctx.img('assets/source/2024-06-lifted-shop-1-1.png', { alt: 'Lifted Shop', sizes: '220px', loading: 'eager', fetchpriority: 'high', widths: [220, 442] }); } catch (e) { ctx.warn(e.message); }
  try { badge = ctx.img('assets/source/2024-07-lifted-logo-black.png', { alt: '', sizes: '46px', loading: 'eager', widths: [96, 160], cls: 'badge' }); } catch (e) { ctx.warn(e.message); }
  const ann = f.announce ? '<div class="announce" role="note"><div class="marquee" aria-hidden="true">' + ('<div class="marquee__run">' + ('<span>' + esc(f.announce) + '</span>').repeat(4) + '</div>').repeat(2) + '</div><span class="sr-only">' + esc(f.announce) + '</span></div>' : '';
  return ann + '<header class="hdr" data-hdr><div class="hdr__bar">'
    + '<a class="hdr__logo" href="/" aria-label="Lifted Shop home">' + badge + word + '</a>'
    + '<nav class="nav" aria-label="Main"><ul>' + items + '</ul></nav>'
    + '<div class="hdr__actions"><a class="hdr__phone" href="' + PHONE_TEL + '">' + ICON.phone + '<span>' + esc(f.phone) + '</span></a>'
    + '<a class="btn btn--primary btn--sm" href="/shop/">Order Delivery<span class="ico">' + ICON.arrow + '</span></a>'
    + '<button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mmenu"><span></span></button></div>'
    + '</div></header>' + mobileMenu(ctx, f);
}

function mobileMenu(ctx, f) {
  const rec = (items, d) => '<ul>' + items.map((it) => {
    const label = it.href === '#' ? '<span class="mmenu__label">' + esc(it.text) + '</span>' : '<a href="' + attr(it.href) + '">' + esc(it.text) + '</a>';
    return '<li>' + label + (it.children.length ? rec(it.children, d + 1) : '') + '</li>';
  }).join('') + '</ul>';
  return '<div class="mmenu" id="mmenu" aria-hidden="true"><nav aria-label="Mobile">' + rec(f.nav, 0) + '</nav>'
    + '<div class="mmenu__foot"><a class="btn btn--primary" href="' + PHONE_TEL + '">' + esc(f.phone) + '<span class="ico">' + ICON.phone + '</span></a>'
    + (f.menuSocial ? socials(f.menuSocial.items) : '') + '</div></div>';
}

export function footer(ctx) {
  const f = siteFacts(ctx.site);
  let logo = '', bg = '';
  try { logo = ctx.img('assets/source/2024-07-lifted-logo-black.png', { alt: 'Lifted Shop logo', sizes: '150px', widths: [160, 320], cls: 'ftr__logo' }); } catch (e) { ctx.warn(e.message); }
  try { bg = ctx.img('G-ORBIT', { alt: '', sizes: '100vw' }); } catch (e) { ctx.warn(e.message); }
  const [tag, infoText, copyText] = [f.texts[0], f.texts[1], f.texts[2]].map((t) => (t ? t.html : ''));
  const navH = f.heads.find((h) => /navigate/i.test(h.text));
  const helpH = f.heads.find((h) => /help/i.test(h.text));
  const delH = f.heads.find((h) => /delivery only/i.test(h.text));
  const list = (l) => '<ul class="flinks">' + (l ? l.items.map((it) => '<li>' + (it.href ? '<a href="' + attr(it.href) + '">' + ICON.right.replace('<svg', '<svg width="12" height="12"') + it.html + '</a>' : '<span>' + it.html + '</span>') + '</li>').join('') : '') + '</ul>';
  const contact = f.lists[2];
  // the agency credit ("| Website by Local SEO") belongs to the old build and is not carried (docs/DECISIONS.md D3)
  const copy = strip(copyText).replace(/\s*\|\s*Website by\s+.*$/i, '');
  return '<footer class="ftr"><div class="ftr__bg" aria-hidden="true">' + bg + '</div>'
    + '<p class="ftr__big" aria-hidden="true" data-depth="0.06">Lifted</p>'
    + '<div class="wrap"><div class="ftr__grid glass edge" data-reveal>'
    + '<div class="ftr__brand">' + logo + '<p class="ftr__tag">' + strip(tag) + '</p>' + (f.footSocial ? socials(f.footSocial.items) : '') + '</div>'
    + '<div><h2>' + esc(navH ? navH.text : 'Navigate') + '</h2>' + list(f.lists[0]) + '</div>'
    + '<div><h2>' + esc(helpH ? helpH.text : 'Help & Info') + '</h2>' + list(f.lists[1]) + '</div>'
    + '<div class="ftr__info"><p class="big">' + infoText.replace(/<\/?p>/g, ' ').replace(/<br>/g, '<br>') + '</p><h2>' + esc(delH ? delH.text : 'Delivery only') + '</h2>'
    + (contact ? '<ul class="ilist">' + contact.items.map((it) => '<li><span class="dot">' + (/^tel:/.test(it.href || '') ? ICON.phone : ICON.pin) + '</span><span>' + (it.href ? '<a href="' + attr(it.href) + '">' + it.html + '</a>' : it.html) + '</span></li>').join('') + '</ul>' : '') + '</div>'
    + '</div><div class="ftr__copy"><span>' + esc(copy) + '</span><span class="muted">Redesign preview</span></div></div></footer>';
}

export function dock(ctx) {
  const f = siteFacts(ctx.site);
  const ic = (h) => (/^tel:/.test(h) ? ICON.phone : /^mailto:/.test(h) ? ICON.mail : ICON.bag);
  return '<nav class="dock" aria-label="Quick actions">' + f.dock.map((d) => '<a href="' + attr(d.href || '#') + '">' + ic(d.href || '') + esc(d.title) + '</a>').join('') + '</nav>';
}

export function ageGate(ctx) {
  const f = siteFacts(ctx.site);
  let logo = '';
  try { logo = ctx.img('assets/source/2024-07-lifted-logo-black.png', { alt: 'Lifted Shop logo', sizes: '120px', widths: [160, 320], cls: 'agegate__logo', loading: 'eager' }); } catch (e) { ctx.warn(e.message); }
  const [welcome, q] = f.gateTexts;
  const [bNo, bYes] = f.gateBtns;
  return '<div class="agegate" hidden role="dialog" aria-modal="true" aria-labelledby="age-q"><div class="agegate__card glass glass--strong edge">' + logo
    + '<div class="agegate__ask"><p>' + esc(welcome || '') + '</p><p class="agegate__q" id="age-q">' + esc(q || 'Are you at least 21?') + '</p>'
    + '<div class="agegate__btns"><button class="btn btn--ghost" type="button" data-age="no">' + esc(bNo ? bNo.text : 'No') + '</button><button class="btn btn--primary" type="button" data-age="yes">' + esc(bYes ? bYes.text : 'Yes') + '</button></div></div>'
    + '<div class="agegate__no"><h2>' + esc(f.no.heading || '') + '</h2><p>' + esc(f.no.text || '') + '</p><p><a class="btn btn--primary" href="/">' + esc(f.no.button ? f.no.button.text : 'Return to Home') + '<span class="ico">' + ICON.arrow + '</span></a></p></div>'
    + '</div></div>';
}
