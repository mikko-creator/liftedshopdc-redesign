// home.mjs - the bespoke home page. Every word, link and photo comes from the live home model (16 sections),
// re-ordered into a flight: hero above the clouds -> the menu -> exclusives -> partners -> why DC -> categories ->
// the final call -> Frequent Flyer Club. Duplicates the live page carries for responsive variants are shown once.
import { esc, attr, strip, ICON, findBlock, findBlocks } from './util.mjs';
import { btn, richText, figure, tiles, storeEmbed, formBlock } from './blocks.mjs';
import { backdrop, cloudBank, protrude, bagFan } from './parts.mjs';
import { storeHead } from './inner.mjs';

const FEATURE_ICONS = ['bolt', 'leaf', 'tag', 'shield'];

export function homePage(page, ctx) {
  const S = page.sections;
  const s0 = S[0], s3 = S[3];
  const heroText = findBlock([s0], (b) => b.t === 'text');
  const heroBadge = findBlock([s0], (b) => b.t === 'image' && /removebg/i.test(b.img.src));
  const kicker = findBlock([s3], (b) => b.t === 'text' && /FAST/.test(b.html));
  const h1 = findBlock([s3], (b) => b.t === 'heading' && b.level === 'h1');
  const introText = findBlocks([s3], (b) => b.t === 'text' && b !== kicker)[0];
  const orderBtn = findBlock([s3], (b) => b.t === 'button') || { text: 'ORDER DELIVERY', href: '/shop/' };
  const plant = findBlock([s3], (b) => b.t === 'image');
  const store = findBlock(S, (b) => b.t === 'store');
  const reviewIcons = findBlocks([S[4]], (b) => b.t === 'image');
  const exHead = findBlock([S[6]], (b) => b.t === 'heading');
  const exSub = findBlock([S[6]], (b) => b.t === 'text');
  const exBtns = findBlocks([S[6]], (b) => b.t === 'button');
  const exCards = findBlock([S[7]], (b) => b.t === 'carousel');
  const partners = findBlocks([S[8]], (b) => b.t === 'image');
  const whyH = findBlock([S[9]], (b) => b.t === 'heading');
  const whyList = findBlock([S[9]], (b) => b.t === 'text');
  const whyRail = findBlock([S[9]], (b) => b.t === 'carousel');
  const bud = findBlock([S[10]], (b) => b.t === 'image');
  const catH = findBlock([S[11]], (b) => b.t === 'heading');
  const cats = (S[12].children || []).flatMap((row) => row.children || []).filter((g) => g.t === 'group');
  const slides = findBlock([S[13]], (b) => b.t === 'slides');
  const ctaText = findBlock([S[14]], (b) => b.t === 'text');
  const ctaBtn = findBlock([S[14]], (b) => b.t === 'button');
  const ffH = findBlock([S[15]], (b) => b.t === 'heading');
  const ffText = findBlock([S[15]], (b) => b.t === 'text');
  const ffForm = findBlock([S[15]], (b) => b.t === 'form');

  /* 1. hero: above the clouds */
  const titleHtml = h1 ? h1.html.replace(/\bDC\b(?![^<]*>)/, '<span class="grad">DC</span>') : '';
  let badge = '';
  let rocket = '';
  try { rocket = ctx.img('assets/source/2024-06-lifted-rocket-logo-1.png', { alt: 'Lifted Washington, DC', sizes: '(max-width: 760px) 58vw, 460px', loading: 'eager', widths: [320, 480, 640, 1000] }); } catch (e) { ctx.warn(e.message); }
  badge = '<div class="hhero__badge" data-depth="0.1"><div class="cutout float float--slow">' + rocket + '</div><span class="hhero__ring" aria-hidden="true"></span></div>'
    + (heroBadge ? '<div class="hhero__sticker" data-depth="0.22">' + figure(heroBadge, ctx, { cut: true, reveal: false, sizes: '160px', cls: '' }) + '</div>' : '');
  const hero = '<section class="hhero">'
    + backdrop(ctx, { loop: 'V-HERO', still: 'G-HERO-SKY', pos: '50% 62%', eager: true })
    + '<div class="hhero__scrim" aria-hidden="true"></div>'
    + '<p class="hhero__word" aria-hidden="true" data-depth="-0.12">Lifted</p>'
    + '<div class="wrap hhero__grid"><div class="hhero__copy hero-fade">'
    + (kicker ? '<p class="kicker">' + strip(kicker.html) + '</p>' : '')
    + '<h1 class="hhero__title display split">' + titleHtml + '</h1>'
    + (heroText ? '<div class="hhero__lede lede" data-reveal style="--d:.2s">' + richText(heroText.html, ctx) + '</div>' : '')
    + '<div class="btns" data-reveal style="--d:.35s">' + btn(orderBtn.text, orderBtn.href, { kind: 'primary' }) + btn('(771) 216-1684', 'tel:7712161684', { kind: 'ghost' }) + '</div>'
    + '</div><div class="hhero__art">' + badge + bagFan(ctx, null)
    + protrude(ctx, 'G-PLANE', 'pro--plane', { depth: 0.35, sizes: '(max-width: 760px) 34vw, 300px', rot: -10 })
    + '</div></div>'
    + '<div class="trust wrap" data-reveal><a class="trust__in glass glass--light" href="/reviews/" aria-label="Reviews">' + reviewIcons.map((r) => { try { return ctx.img(r.img.src, { alt: r.img.alt.replace(/^icon-\d$/, '') || 'Review platform rating', sizes: '150px', widths: [150, 280] }); } catch (e) { ctx.warn(e.message); return ''; } }).join('') + '</a></div>'
    + cloudBank(ctx, 'bottom', 'cloudbank--hero') + '</section>';

  /* 2. intro: the boarding pass */
  const intro = '<section class="sec hintro"><div class="wrap"><div class="pass glass edge" data-reveal>'
    + '<div class="pass__body"><p class="kicker">' + (h1 ? esc(h1.text) : '') + '</p>' + (introText ? '<div class="prose lede">' + richText(introText.html, ctx) + '</div>' : '')
    + '<div class="btns">' + btn(orderBtn.text, orderBtn.href, { kind: 'primary' }) + '</div></div>'
    + '<div class="pass__stub" aria-hidden="true"><span class="pass__hole"></span><span class="pass__code">LFT&nbsp;&rarr;&nbsp;DC</span><span class="pass__bars"></span></div>'
    + (plant ? '<div class="pass__plant" data-depth="0.14">' + figure(plant, ctx, { cut: true, reveal: false, sizes: '(max-width: 760px) 50vw, 420px', cls: 'float float--slow' }) + '</div>' : '')
    + '</div></div></section>';

  /* 3. the menu */
  const menu = store ? '<section class="sec sec--store hmenu">' + '<div class="wrap">' + storeEmbed(store, ctx, { head: storeHead() }) + '<p class="store__more">' + btn('Shop Now', '/shop/', { kind: 'primary' }) + '</p></div>'
    + protrude(ctx, 'G-LEAF', 'pro--menu-leaf', { depth: 0.2, sizes: '(max-width: 760px) 36vw, 320px', rot: 24 }) + '</section>' : '';

  /* 4. exclusives: a pinned horizontal flight of collectible cards */
  const cards = exCards ? exCards.items.map((it, i) => {
    let im = '';
    try { im = ctx.img(it.img.src, { alt: it.img.alt || '', sizes: '(max-width: 900px) 70vw, 340px' }); } catch (e) { ctx.warn(e.message); }
    return '<figure class="xcard" data-tilt><div class="xcard__img">' + im + '</div><figcaption class="xcard__cap">' + (it.caption || '') + '</figcaption>'
      + '<span class="xcard__no" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' + (it.href ? '<a href="' + attr(it.href) + '" aria-label="' + attr(strip(it.caption) || 'Shop') + '"></a>' : '') + '</figure>';
  }).join('') : '';
  const exclusives = '<section class="hx hpin"><div class="hpin__stage"><div class="wrap hx__head">'
    + '<div><h2 class="hx__title display split">' + (exHead ? exHead.html : '') + '</h2>' + (exSub ? '<p class="hx__sub">' + strip(exSub.html) + '</p>' : '') + '</div>'
    + '<div class="btns">' + exBtns.map((b, i) => btn(b.text, b.href, { kind: i ? 'ghost' : 'primary' })).join('') + '</div></div>'
    + '<div class="hpin__track">' + cards + '</div><p class="hx__echo" aria-hidden="true">' + (exHead ? esc(exHead.text) : '') + '</p></div></section>';

  /* 5. partners */
  const logos = partners.map((p) => { try { return '<span class="plogo">' + ctx.img(p.img.src, { alt: p.img.alt.replace(/^logo-icon-\d$/, '') || 'Partner brand logo', sizes: '160px', widths: [160, 320] }) + '</span>'; } catch (e) { ctx.warn(e.message); return ''; } }).join('');
  const partnerBand = '<section class="sec sec--tight hpartners" aria-label="Partner brands"><div class="marquee" style="--dur:42s"><div class="marquee__run">' + logos + '</div><div class="marquee__run" aria-hidden="true">' + logos + '</div></div></section>';

  /* 6. why DC */
  const items = whyList ? [...whyList.html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]) : [];
  const why = '<section class="sec hwhy">' + backdrop(ctx, { still: whyH && S[9].bg ? S[9].bg : 'G-CITY-GLOW', pos: '60% 40%', cls: 'hwhy__bg' })
    + '<div class="hwhy__scrim" aria-hidden="true"></div>'
    + '<div class="wrap"><div class="shead"><p class="kicker">Lifted Shop</p><h2 class="split">' + (whyH ? whyH.html : '') + '</h2></div>'
    + '<ul class="feats">' + items.map((it, i) => '<li class="feat glass edge" data-reveal data-tilt style="--d:' + (i * 0.08).toFixed(2) + 's"><span class="feat__ic">' + ICON[FEATURE_ICONS[i % 4]] + '</span><span class="feat__t">' + it + '</span><span class="feat__n" aria-hidden="true">0' + (i + 1) + '</span></li>').join('') + '</ul>'
    + (whyRail ? tiles(whyRail, ctx, { w: 'clamp(200px, 20vw, 260px)', cls: 'hwhy__rail' }) : '') + '</div>'
    + (bud ? '<div class="pro pro--bud" aria-hidden="true" data-depth="0.25">' + figure(bud, ctx, { cut: true, reveal: false, sizes: '(max-width: 760px) 50vw, 460px', cls: 'float' }) + '</div>' : '')
    + '</section>';

  /* 7. shop categories (bento) + the slides as a kinetic band */
  const catCards = cats.map((g, i) => {
    const h = findBlock([g], (b) => b.t === 'heading');
    const im = findBlock([g], (b) => b.t === 'image');
    const b = findBlock([g], (x) => x.t === 'button');
    let pic = '';
    if (im) { try { pic = ctx.img(im.img.src, { alt: im.img.alt || '', sizes: '(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw' }); } catch (e) { ctx.warn(e.message); } }
    return '<article class="cat cat--' + (i + 1) + '" data-reveal data-tilt style="--d:' + (i * 0.07).toFixed(2) + 's"><div class="cat__img">' + pic + '</div><div class="cat__body"><h3 class="cat__t">' + (h ? h.html : '') + '</h3>' + (b ? btn(b.text, b.href, { kind: 'ghost', sm: true }) : '') + '</div>' + (b ? '<a class="cat__link" href="' + attr(b.href || '/shop/') + '" tabindex="-1" aria-hidden="true"></a>' : '') + '</article>';
  }).join('');
  const kinetic = slides ? '<div class="kinetic" aria-label="Categories"><div class="marquee" style="--dur:34s"><div class="marquee__run">' + slides.items.map((s) => '<a class="kinetic__w" href="' + attr(s.button ? s.button.href : '/shop/') + '">' + esc(s.heading) + '<span>' + esc(s.button ? s.button.text : '') + ' ' + ICON.arrow + '</span></a>').join('') + '</div><div class="marquee__run" aria-hidden="true">' + slides.items.map((s) => '<a class="kinetic__w" href="' + attr(s.button ? s.button.href : '/shop/') + '" tabindex="-1">' + esc(s.heading) + '<span>' + esc(s.button ? s.button.text : '') + ' ' + ICON.arrow + '</span></a>').join('') + '</div></div></div>' : '';
  const categories = '<section class="sec hcats"><div class="wrap"><div class="shead shead--center"><p class="kicker">Lifted Shop</p><h2 class="split">' + (catH ? catH.html : '') + '</h2></div><div class="bento">' + catCards + '</div></div>' + kinetic + '</section>';

  /* 8. the final call */
  const cta = '<section class="hcta">' + backdrop(ctx, { loop: 'V-SMOKE', still: 'G-SMOKE', pos: '50% 50%', cls: 'hcta__bg' })
    + '<div class="wrap hcta__in"><div class="hcta__copy prose" data-reveal>' + (ctaText ? richText(ctaText.html, ctx) : '') + '</div>'
    + (ctaBtn ? '<div class="btns" data-reveal>' + btn(ctaBtn.text, ctaBtn.href, { kind: 'primary' }) + btn('(771) 216-1684', 'tel:7712161684', { kind: 'ghost' }) + '</div>' : '') + '</div>'
    + '</section>';   // revision 3: the paper plane and bud cut-outs removed on the operator's request

  /* 9. Frequent Flyer Club */
  const ffField = ffForm && ffForm.fields[0];
  let ffLogo = '';
  try { ffLogo = ctx.img('assets/source/2024-06-lifted-rocket-logo-1.png', { alt: '', sizes: '120px', widths: [160, 320], cls: 'ffc__logo' }); } catch (e) { ctx.warn(e.message); }
  const ff = '<section class="sec hff">' + backdrop(ctx, { still: S[15].bg || 'G-DUSK', pos: '50% 50%', cls: 'hff__bg' }) + '<div class="hff__scrim" aria-hidden="true"></div>'
    + '<div class="wrap"><div class="ffc glass edge" data-reveal="rise">' + ffLogo
    + '<p class="kicker">' + (ffText ? strip(ffText.html) : '') + '</p><h2 class="ffc__title display split">' + (ffH ? ffH.html : '') + '</h2>'
    + (ffField ? '<form class="inline-form" method="post" action="/__form-endpoint-not-configured__"><label class="sr-only" for="ff-name">' + esc(ffField.label || 'Name') + '</label><input id="ff-name" type="text" name="name" placeholder="' + attr(ffField.placeholder || '') + '" required><button class="btn btn--primary" type="submit" disabled>' + esc(ffForm.submit) + '<span class="ico">' + ICON.arrow + '</span></button></form><p class="form__note">This preview form is not connected yet.</p>' : '')
    + '<span class="ffc__chip" aria-hidden="true"></span><span class="ffc__holo" aria-hidden="true"></span></div></div>'
    // depth 0.12 (was 0.3): the parallax lift stays inside this section, never rising into the final call above it
    + protrude(ctx, 'G-PLANE', 'pro--ff-plane', { depth: 0.12, sizes: '(max-width: 760px) 36vw, 320px', rot: -6 }) + '</section>';

  return hero + intro + menu + exclusives + partnerBand + why + categories + cta + ff;
}
