// extract.mjs - liftedshopdc.com (WordPress + Elementor 4.3 + Hello Elementor) raw HTML -> page models (Node builtins only).
// The live site is the source of truth for copy and structure: every Elementor container becomes a node, every widget a
// typed block, and no visible text is rewritten. Platform runtime (Elementor/Swiper/Trustindex/CF7 classes, scripts,
// settings JSON) never reaches the model: only text, links, images and structure do.
import fs from 'node:fs';
import path from 'node:path';
import { parse, findAll, findFirst, textOf, squash, inlineHtml, decode, cls, isEl, elChildren, esc, escAttr } from './html-util.mjs';

export const ORIGIN = 'https://www.liftedshopdc.com';
const OWN = /^(?:https?:)?\/\/(?:www\.)?liftedshopdc\.com/i;

/** own-origin absolute URL -> root-relative path (query/hash kept); other hosts unchanged; image file links -> null */
export function linkOf(href) {
  if (href == null) return null;
  let h = decode(String(href)).trim();
  if (!h || h === '#') return h || null;
  if (/^#elementor-action/i.test(h)) return null;
  if (/^(tel|mailto|sms):/i.test(h)) return h.replace(/\s+/g, '');
  if (OWN.test(h) || h.startsWith('/')) {
    const u = new URL(h.replace(OWN, '') || '/', ORIGIN);
    if (/^\/wp-content\//i.test(u.pathname)) return null; // lightbox links to image files: the image itself is carried
    let p = u.pathname;
    if (!/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith('/')) p += '/';
    return p + u.search + u.hash;
  }
  return h;
}
const linkFn = (attrs) => ({ href: linkOf(attrs.href) });

/** best image URL from an <img>: the largest srcset candidate, else src / data-src */
export function imgOf(n) {
  if (!n) return null;
  const a = n.attrs;
  let best = a['data-src'] || a.src || null, bw = 0;
  for (const k of ['srcset', 'data-srcset']) if (a[k]) for (const c of a[k].split(',')) {
    const [u, d] = c.trim().split(/\s+/); const w = parseInt(d, 10) || 0;
    if (u && w >= bw) { bw = w; best = u; }
  }
  if (!best || /^data:/.test(best)) return null;
  return { src: best.replace(/^\/\//, 'https://'), alt: squash(a.alt || ''), w: Number(a.width) || null, h: Number(a.height) || null };
}

// ---------- rich text: keep block structure, drop platform markup ----------
const BLOCK_KEEP = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'figure', 'figcaption']);
const INLINE_KEEP = new Set(['a', 'strong', 'b', 'em', 'i', 'u', 'sup', 'sub', 'small', 'mark', 'code', 'br', 'span', 's']);
const DROP = new Set(['script', 'style', 'noscript', 'template', 'svg', 'iframe', 'form', 'input', 'button', 'select', 'textarea', 'link', 'meta']);
export function richHtml(nodes) {
  let out = '';
  const rec = (x) => {
    if (x.tag === '#text') { if (!x.raw) out += esc(decode(x.text)); return; }
    if (x.tag === '#comment' || DROP.has(x.tag)) return;
    if (x.tag === 'img') { const im = imgOf(x); if (im) out += '<img data-ref="' + escAttr(im.src) + '" alt="' + escAttr(im.alt) + '">'; return; }
    if (x.tag === 'br') { out += '<br>'; return; }
    if (x.tag === 'i' && /\bfa[srlbd]?\b|\bfa-/.test(x.attrs.class || '') && !squash(textOf(x))) return;
    if (x.tag === 'a') {
      const h = linkOf(x.attrs.href);
      out += h ? '<a href="' + escAttr(h) + '"' + (/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : '') + '>' : '';
      for (const c of x.children || []) rec(c);
      out += h ? '</a>' : '';
      return;
    }
    if (BLOCK_KEEP.has(x.tag)) { out += '<' + x.tag + '>'; for (const c of x.children || []) rec(c); out += '</' + x.tag + '>'; return; }
    if (INLINE_KEEP.has(x.tag) && x.tag !== 'span') {
      const t = x.tag === 'b' ? 'strong' : x.tag === 'i' ? 'em' : x.tag;
      out += '<' + t + '>'; for (const c of x.children || []) rec(c); out += '</' + t + '>'; return;
    }
    if (x.tag === 'div' || x.tag === 'section' || x.tag === 'article') {
      // a div holding inline content only becomes a paragraph; otherwise it is transparent
      const kids = x.children || [];
      const blocky = kids.some((k) => isEl(k) && (BLOCK_KEEP.has(k.tag) || k.tag === 'div'));
      if (!blocky && squash(textOf(x))) { out += '<p>'; for (const c of kids) rec(c); out += '</p>'; return; }
    }
    for (const c of x.children || []) rec(c);
  };
  for (const n of nodes) rec(n);
  return out.replace(/<(strong|em|u|s|small|mark|code|sup|sub)>(\s*)<\/\1>/g, '$2')
    .replace(/<p>(\s|&nbsp;| |<br>)*<\/p>/g, '').replace(/\s{2,}/g, ' ').replace(/<p>\s+/g, '<p>').replace(/\s+<\/p>/g, '</p>').trim();
}
export const htmlToText = (h) => squash(decode(String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|li|h\d|td|th|blockquote|figcaption)>/gi, ' ').replace(/<[^>]+>/g, ' ')));

const container = (n) => n.attrs['data-element_type'] === 'container';
const widgetType = (n) => n.attrs['data-widget_type'] || null;
const wc = (n) => findFirst(n, (x) => cls(x).includes('elementor-widget-container')) || n;
const settingsOf = (n) => { try { return JSON.parse(n.attrs['data-settings'] || '{}'); } catch { return {}; } };

// ---------- per-page CSS backgrounds ----------
export function cssBackgrounds(cssText) {
  const map = new Map(); // element id -> url (desktop, first seen)
  if (!cssText) return map;
  const flat = cssText.replace(/@media[^{]+\{([\s\S]*?\})\s*\}/g, ''); // desktop rules only
  for (const m of flat.matchAll(/([^{}]+)\{([^{}]*background-image\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)[^{}]*)\}/g)) {
    for (const sel of m[1].split(',')) {
      const id = /\.elementor-element-([0-9a-f]{6,8})(?![\w-])/.exec(sel);
      if (id && !/:hover|::?before|::?after|elementor-motion-effects-layer/.test(sel) && !map.has(id[1])) map.set(id[1], m[3]);
    }
  }
  return map;
}

// ---------- widgets ----------
function widget(n, ctx) {
  const t = widgetType(n);
  const box = wc(n);
  const anim = settingsOf(n)._animation || null;
  const base = (o) => (anim && anim !== 'none' ? { ...o, anim } : o);
  switch (t) {
    case 'heading.default': {
      const h = findFirst(box, (x) => cls(x).includes('elementor-heading-title')) || box;
      const html = inlineHtml(h.children || [], { link: linkFn });
      if (!squash(textOf(h))) return null;
      const level = /^h[1-6]$/.test(h.tag) ? h.tag : 'p';
      return base({ t: 'heading', level, html, text: squash(textOf(h)) });
    }
    case 'text-editor.default': {
      const html = richHtml(box.children || []);
      return html ? base({ t: 'text', html }) : null;
    }
    case 'image.default': {
      const img = findFirst(box, (x) => x.tag === 'img');
      const im = imgOf(img); if (!im) return null;
      const a = findFirst(box, (x) => x.tag === 'a');
      const cap = findFirst(box, (x) => x.tag === 'figcaption');
      return base({ t: 'image', img: im, href: a ? linkOf(a.attrs.href) : null, caption: cap ? inlineHtml(cap.children, { link: linkFn }) : null });
    }
    case 'button.default': {
      const a = findFirst(box, (x) => x.tag === 'a' || x.tag === 'button');
      const txt = squash(textOf(box));
      if (!txt) return null;
      return base({ t: 'button', text: txt, href: a ? linkOf(a.attrs.href) : null });
    }
    case 'icon-list.default': {
      const items = findAll(box, (x) => x.tag === 'li').map((li) => {
        const a = findFirst(li, (x) => x.tag === 'a');
        const tx = findFirst(li, (x) => cls(x).includes('elementor-icon-list-text')) || li;
        return { html: inlineHtml(tx.children || [], { link: linkFn }), text: squash(textOf(tx)), href: a ? linkOf(a.attrs.href) : null };
      }).filter((i) => i.text);
      return items.length ? base({ t: 'list', items }) : null;
    }
    case 'icon-box.default': {
      const title = findFirst(box, (x) => cls(x).includes('elementor-icon-box-title'));
      const desc = findFirst(box, (x) => cls(x).includes('elementor-icon-box-description'));
      const a = findFirst(box, (x) => x.tag === 'a' && x.attrs.href);
      const o = { t: 'iconbox', title: title ? squash(textOf(title)) : '', html: desc ? richHtml(desc.children) : '', href: a ? linkOf(a.attrs.href) : null };
      return o.title || o.html ? base(o) : null;
    }
    case 'image-carousel.default': {
      const items = findAll(box, (x) => cls(x).includes('swiper-slide')).map((s) => {
        const im = imgOf(findFirst(s, (x) => x.tag === 'img'));
        const cap = findFirst(s, (x) => x.tag === 'figcaption');
        const a = findFirst(s, (x) => x.tag === 'a');
        return im ? { img: im, caption: cap ? inlineHtml(cap.children, { link: linkFn }).replace(/<\/?br>\s*/g, '<br>') : null, href: a ? linkOf(a.attrs.href) : null } : null;
      }).filter(Boolean);
      // Swiper duplicates slides for loop mode on some builds: keep the first occurrence of each src+caption
      const seen = new Set();
      const uniq = items.filter((i) => { const k = i.img.src + '|' + (i.caption || ''); if (seen.has(k)) return false; seen.add(k); return true; });
      return uniq.length ? base({ t: 'carousel', items: uniq }) : null;
    }
    case 'testimonial-carousel.default': {
      const items = findAll(box, (x) => cls(x).includes('elementor-testimonial')).filter((x) => findFirst(x, (y) => cls(y).includes('elementor-testimonial__text'))).map((x) => ({
        text: squash(textOf(findFirst(x, (y) => cls(y).includes('elementor-testimonial__text')))),
        name: squash(textOf(findFirst(x, (y) => cls(y).includes('elementor-testimonial__name')) || { children: [] })),
        title: squash(textOf(findFirst(x, (y) => cls(y).includes('elementor-testimonial__title')) || { children: [] })),
      })).filter((i) => i.text);
      const seen = new Set();
      const uniq = items.filter((i) => { if (seen.has(i.text)) return false; seen.add(i.text); return true; });
      return uniq.length ? base({ t: 'testimonials', items: uniq }) : null;
    }
    case 'nested-accordion.default': {
      const items = findAll(box, (x) => x.tag === 'details').map((d) => {
        const q = findFirst(d, (x) => cls(x).includes('e-n-accordion-item-title-text')) || findFirst(d, (x) => x.tag === 'summary');
        const region = findFirst(d, (x) => x.attrs.role === 'region') || d;
        const blocks = walkChildren(region, ctx);
        return { q: squash(textOf(q)), blocks };
      }).filter((i) => i.q);
      return items.length ? base({ t: 'faq', items }) : null;
    }
    case 'shortcode.default': {
      const ti = findFirst(box, (x) => cls(x).includes('ti-widget') && cls(x).includes('ti-goog'));
      if (ti) return trustindex(ti);
      const html = richHtml(box.children || []);
      return html ? { t: 'text', html } : null;
    }
    case 'html.default': return htmlWidget(box);
    case 'google_maps.default': {
      const f = findFirst(box, (x) => x.tag === 'iframe');
      return f ? { t: 'map', src: decode(f.attrs.src || ''), title: squash(f.attrs.title || f.attrs['aria-label'] || '') } : null;
    }
    case 'breadcrumbs.default': {
      const items = [];
      const p = findFirst(box, (x) => x.tag === 'p' || cls(x).includes('breadcrumbs')) || box;
      for (const x of findAll(p, (y) => y.tag === 'a' || (y.tag === 'span' && cls(y).includes('breadcrumb_last')) || y.attrs['aria-current'])) {
        if (x.tag === 'a') items.push({ text: squash(textOf(x)), href: linkOf(x.attrs.href) });
        else items.push({ text: squash(textOf(x)), href: null });
      }
      return items.length ? { t: 'breadcrumbs', items } : null;
    }
    case 'posts.classic': {
      const items = findAll(box, (x) => x.tag === 'article').map((ar) => {
        const ttl = findFirst(ar, (x) => cls(x).includes('elementor-post__title'));
        const a = ttl ? findFirst(ttl, (x) => x.tag === 'a') : findFirst(ar, (x) => x.tag === 'a');
        const ex = findFirst(ar, (x) => cls(x).includes('elementor-post__excerpt'));
        const date = findFirst(ar, (x) => cls(x).includes('elementor-post-date'));
        const more = findFirst(ar, (x) => cls(x).includes('elementor-post__read-more'));
        return { title: squash(textOf(ttl || a)), href: a ? linkOf(a.attrs.href) : null, img: imgOf(findFirst(ar, (x) => x.tag === 'img')), excerpt: ex ? squash(textOf(ex)) : '', date: date ? squash(textOf(date)) : '', more: more ? squash(textOf(more)) : '' };
      });
      const pag = findAll(box, (x) => x.tag === 'a' && /page-numbers/.test(x.attrs.class || '') || (x.tag === 'span' && /page-numbers/.test(x.attrs.class || ''))).map((x) => ({ text: squash(textOf(x)), href: x.tag === 'a' ? linkOf(x.attrs.href) : null, current: /current/.test(x.attrs.class || '') }));
      return { t: 'posts', items, pagination: pag };
    }
    case 'form.default': return formOf(box, 'newsletter');
    case 'htcontactform-addons.default': return formOf(box, 'order');
    case 'slides.default': {
      const items = findAll(box, (x) => cls(x).includes('swiper-slide') && !cls(x).includes('swiper-slide-duplicate')).map((s) => ({
        heading: squash(textOf(findFirst(s, (x) => cls(x).includes('elementor-slide-heading')) || { children: [] })),
        html: (() => { const d = findFirst(s, (x) => cls(x).includes('elementor-slide-description')); return d ? richHtml(d.children) : ''; })(),
        button: (() => { const b = findFirst(s, (x) => cls(x).includes('elementor-slide-button')); return b ? { text: squash(textOf(b)), href: linkOf((findFirst(s, (x) => x.tag === 'a') || b).attrs.href) } : null; })(),
        id: (/elementor-repeater-item-([0-9a-f]+)/.exec(s.attrs.class || '') || [])[1] || null,
      })).filter((i) => i.heading || i.html);
      return items.length ? { t: 'slides', items } : null;
    }
    case 'social-icons.default': {
      const items = findAll(box, (x) => x.tag === 'a').map((a) => ({ href: linkOf(a.attrs.href), label: squash(textOf(a)) || (/elementor-social-icon-([a-z-]+)/.exec(a.attrs.class || '') || [])[1] }));
      return items.length ? { t: 'social', items } : null;
    }
    case 'icon.default': {
      const a = findFirst(box, (x) => x.tag === 'a'); const h = a ? linkOf(a.attrs.href) : null;
      return h ? { t: 'icon', href: h } : null;
    }
    case 'nav-menu.default': return { t: 'nav', items: navTree(box) };
    case 'divider.default': case 'spacer.default': case 'share-buttons.default': return null;
    default: {
      const html = richHtml(box.children || []);
      ctx.unknown.add(t);
      return html ? { t: 'text', html, from: t } : null;
    }
  }
}

function navTree(box) {
  const ul = findFirst(box, (x) => x.tag === 'ul');
  const rec = (u) => elChildren(u).filter((li) => li.tag === 'li').map((li) => {
    const a = elChildren(li).find((x) => x.tag === 'a') || findFirst(li, (x) => x.tag === 'a');
    const sub = elChildren(li).find((x) => x.tag === 'ul');
    return { text: squash(textOf(a)), href: a ? linkOf(a.attrs.href) : null, children: sub ? rec(sub) : [] };
  });
  return ul ? rec(ul) : [];
}

function trustindex(ti) {
  const summary = {
    label: squash(textOf(findFirst(ti, (x) => cls(x).includes('ti-rating-text')) || { children: [] })),
    text: squash(textOf(findFirst(ti, (x) => cls(x).includes('ti-rating-text') || cls(x).includes('ti-footer')) || { children: [] })),
  };
  const foot = findFirst(ti, (x) => cls(x).includes('ti-footer'));
  if (foot) summary.text = squash(textOf(foot));
  const items = findAll(ti, (x) => cls(x).includes('ti-review-item')).map((r) => ({
    name: squash(textOf(findFirst(r, (x) => cls(x).includes('ti-name')) || { children: [] })),
    date: squash(textOf(findFirst(r, (x) => cls(x).includes('ti-date')) || { children: [] })),
    stars: findAll(findFirst(r, (x) => cls(x).includes('ti-stars')) || { children: [] }, (x) => x.tag === 'img' || cls(x).includes('ti-star')).filter((x) => !/empty/.test(x.attrs.class || '') && !/empty/.test(x.attrs.src || '')).length || 5,
    text: squash(textOf(findFirst(r, (x) => cls(x).includes('ti-review-content')) || { children: [] })),
    source: 'Google',
  })).filter((i) => i.name || i.text);
  const seen = new Set();
  return { t: 'reviews', provider: 'Trustindex (Google reviews)', summary, items: items.filter((i) => { const k = i.name + '|' + i.text; if (seen.has(k)) return false; seen.add(k); return true; }) };
}

function htmlWidget(box) {
  const raw = box;
  const ecwid = findFirst(raw, (x) => x.tag === 'script' && /app\.ecwid\.com\/script\.js\?(\d+)/.test(x.attrs.src || ''));
  if (ecwid) return { t: 'store', provider: 'ecwid', storeId: /\?(\d+)/.exec(ecwid.attrs.src)[1] };
  const iframe = findFirst(raw, (x) => x.tag === 'iframe');
  if (iframe && /google\.com\/maps/.test(iframe.attrs.src || '')) return { t: 'map', src: decode(iframe.attrs.src), title: squash(iframe.attrs.title || '') };
  if (iframe) return { t: 'embed', src: decode(iframe.attrs.src || ''), title: squash(iframe.attrs.title || '') };
  const links = findAll(raw, (x) => x.tag === 'a' && x.attrs.href);
  const txt = squash(textOf(raw));
  if (links.length >= 4 && links.map((a) => squash(textOf(a))).join(' ').length >= txt.length * 0.8) {
    return { t: 'links', items: links.map((a) => ({ text: squash(textOf(a)), href: linkOf(a.attrs.href) })).filter((i) => i.text) };
  }
  if (!txt) {
    const scripts = findAll(raw, (x) => x.tag === 'script').length;
    return scripts ? { t: 'dropped', why: 'script-only html widget' } : null;
  }
  return { t: 'text', html: richHtml(raw.children || []), from: 'html.default' };
}

function formOf(box, kind) {
  const fields = [];
  for (const el of findAll(box, (x) => ['input', 'select', 'textarea'].includes(x.tag))) {
    const type = (el.attrs.type || el.tag).toLowerCase();
    if (['hidden', 'submit'].includes(type) || /^_wpcf7|^form_id|^post_id|^queried_id|^referer/.test(el.attrs.name || '')) continue;
    const id = el.attrs.id;
    const lab = id ? findFirst(box, (x) => x.tag === 'label' && x.attrs.for === id) : null;
    let label = lab ? squash(textOf(lab)) : '';
    if (!label && type === 'checkbox') { const l = el.parent && el.parent.tag === 'label' ? el.parent : null; label = l ? squash(textOf(l)) : decode(el.attrs.value || ''); }
    fields.push({ type, name: el.attrs.name || '', label, placeholder: el.attrs.placeholder || '', required: 'required' in el.attrs || /wpcf7-validates-as-required/.test(el.attrs.class || ''), value: type === 'checkbox' ? decode(el.attrs.value || '') : undefined,
      options: el.tag === 'select' ? findAll(el, (x) => x.tag === 'option').map((o) => squash(textOf(o))) : undefined });
  }
  const btn = findFirst(box, (x) => x.tag === 'button' || (x.tag === 'input' && x.attrs.type === 'submit'));
  // visible text in the form that is not a field label (e.g. the merch price list headings, notes)
  const notes = findAll(box, (x) => x.tag === 'p' || /^h[2-6]$/.test(x.tag)).map((x) => squash(textOf(x))).filter((s) => s && !fields.some((f) => f.label === s));
  return { t: 'form', kind, fields, submit: btn ? squash(textOf(btn) || btn.attrs.value || '') : 'Submit', notes };
}

/** children of a container node -> blocks (nested containers become groups) */
function walkChildren(n, ctx) {
  const out = [];
  const kids = elChildren(n);
  for (const k of kids) {
    if (container(k)) { const g = group(k, ctx); if (g) out.push(g); continue; }
    if (widgetType(k)) { const w = widget(k, ctx); if (w) out.push(w); continue; }
    // transparent wrappers (e-con-inner etc.)
    out.push(...walkChildren(k, ctx));
  }
  return out;
}
function group(n, ctx) {
  const children = walkChildren(n, ctx);
  if (!children.length) return null;
  const id = n.attrs['data-id'];
  const bg = ctx.bgs.get(id) || null;
  const anim = settingsOf(n).animation || null;
  const o = { t: 'group', id, children };
  if (bg) o.bg = bg;
  if (anim && anim !== 'none') o.anim = anim;
  // collapse a group holding exactly one group with no background of its own
  if (!bg && children.length === 1 && children[0].t === 'group' && !o.anim) return children[0];
  return o;
}

// ---------- page ----------
export function extractPage(rec, proj) {
  const html = fs.readFileSync(path.join(proj, rec.file), 'utf8');
  const root = parse(html);
  const ctx = { unknown: new Set(), bgs: new Map() };
  // backgrounds from every per-page Elementor CSS this page links
  for (const m of html.matchAll(/\/uploads\/elementor\/css\/(post-\d+\.css)/g)) {
    const f = path.join(proj, 'audit/css', m[1]);
    if (fs.existsSync(f)) for (const [k, v] of cssBackgrounds(fs.readFileSync(f, 'utf8'))) if (!ctx.bgs.has(k)) ctx.bgs.set(k, v);
  }
  // inline style backgrounds too
  for (const n of findAll(root, (x) => x.attrs['data-id'] && /background-image/.test(x.attrs.style || ''))) {
    const m = /url\(\s*['"]?([^'")]+)/.exec(n.attrs.style); if (m && !ctx.bgs.has(n.attrs['data-id'])) ctx.bgs.set(n.attrs['data-id'], m[1]);
  }
  const head = findFirst(root, (x) => x.tag === 'head') || root;
  const meta = (sel) => { const n = findFirst(head, sel); return n ? decode(n.attrs.content || '') : null; };
  const tn = findFirst(head, (x) => x.tag === 'title');
  const title = tn && tn.children[0] ? squash(decode(tn.children[0].text)) : '';   // <title> is a raw-text element: textOf skips it
  const linkRel = (r) => { const n = findFirst(head, (x) => x.tag === 'link' && (x.attrs.rel || '').split(/\s+/).includes(r)); return n ? n.attrs.href : null; };
  const og = {};
  for (const n of findAll(head, (x) => x.tag === 'meta' && /^(og:|article:|twitter:)/.test(x.attrs.property || x.attrs.name || ''))) og[n.attrs.property || n.attrs.name] = decode(n.attrs.content || '');
  const jsonld = findAll(root, (x) => x.tag === 'script' && x.attrs.type === 'application/ld+json').map((s) => { try { return JSON.parse(s.children[0] ? s.children[0].text : ''); } catch { return null; } }).filter(Boolean);
  const body = findFirst(root, (x) => x.tag === 'body');
  const bc = cls(body);
  const pathName = new URL(rec.url).pathname;
  const kind = bc.includes('home') ? 'home' : bc.includes('single-post') ? 'post' : bc.includes('author') ? 'author' : 'page';
  const doc = findFirst(root, (x) => /^wp-(page|post)$/.test(x.attrs['data-elementor-type'] || ''));
  let sections = [];
  if (doc) sections = elChildren(doc).filter(container).map((c) => group(c, ctx) || null).filter(Boolean).map((g) => (g.t === 'group' ? g : { t: 'group', children: [g] }));
  let archive = null;
  if (!doc) {
    const main = findFirst(root, (x) => x.tag === 'main');
    if (main) {
      const h1 = findFirst(main, (x) => x.tag === 'h1');
      const posts = findAll(main, (x) => x.tag === 'article').map((ar) => {
        const a = findFirst(ar, (x) => x.tag === 'a');
        const t = findFirst(ar, (x) => /^h[2-4]$/.test(x.tag));
        const p = findFirst(ar, (x) => x.tag === 'p');
        return { title: squash(textOf(t || a)), href: a ? linkOf(a.attrs.href) : null, img: imgOf(findFirst(ar, (x) => x.tag === 'img')), excerpt: p ? squash(textOf(p)) : '' };
      });
      const content = findFirst(main, (x) => cls(x).includes('page-content'));
      const pag = findAll(main, (x) => x.tag === 'nav' && cls(x).includes('pagination')).flatMap((nav) => findAll(nav, (x) => x.tag === 'a').map((a) => ({ text: squash(textOf(a)).replace(/\s*[→←]\s*/g, '').trim(), href: linkOf(a.attrs.href), rel: /prev/i.test(textOf(a)) || cls(a.parent).includes('nav-previous') ? 'prev' : 'next' })));
      archive = { h1: h1 ? squash(textOf(h1)) : '', h1Html: h1 ? inlineHtml(h1.children, { link: linkFn }) : '', posts, pagination: pag, html: !posts.length && content ? richHtml(content.children) : '' };
    }
  }
  const h1n = findFirst(doc || body, (x) => x.tag === 'h1');
  return {
    path: pathName, url: rec.url, kind,
    head: {
      title, description: meta((x) => x.tag === 'meta' && x.attrs.name === 'description'), robots: meta((x) => x.tag === 'meta' && x.attrs.name === 'robots'),
      canonical: linkRel('canonical'), og, jsonld,
    },
    h1: h1n ? squash(textOf(h1n)) : (archive ? archive.h1 : null),
    docId: doc ? doc.attrs['data-elementor-id'] : null,
    sections, archive,
    unknownWidgets: [...ctx.unknown],
  };
}

// ---------- site chrome (header, footer, popups) from the home page ----------
export function extractSite(homeFile, proj) {
  const html = fs.readFileSync(path.join(proj, homeFile), 'utf8');
  const root = parse(html);
  const ctx = { unknown: new Set(), bgs: new Map() };
  for (const m of html.matchAll(/\/uploads\/elementor\/css\/(post-\d+\.css)/g)) {
    const f = path.join(proj, 'audit/css', m[1]);
    if (fs.existsSync(f)) for (const [k, v] of cssBackgrounds(fs.readFileSync(f, 'utf8'))) if (!ctx.bgs.has(k)) ctx.bgs.set(k, v);
  }
  const docOf = (type, id) => findFirst(root, (x) => x.attrs['data-elementor-type'] === type && (!id || x.attrs['data-elementor-id'] === String(id)));
  const flat = (doc) => (doc ? elChildren(doc).filter(container).map((c) => group(c, ctx)).filter(Boolean) : []);
  return {
    header: flat(docOf('header', 783)),
    footer: flat(docOf('footer', 951)),
    menuPopup: flat(docOf('popup', 1302)),
    ageNo: flat(docOf('popup', 1729)),
    ageGate: flat(docOf('popup', 1731)),
  };
}
