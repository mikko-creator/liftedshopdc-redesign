// ecwid-rail-check.mjs - the Ecwid root categories as an infinite carousel, against the real store (Ecwid hosts allowed):
// layout, autoplay, arrows, drag (no click-through), a tap opens the category, back re-arms the rail, page overflow.
//   SR_CHROME_ALLOW="app.ecwid.com,*.ecwid.com,*.cloudfront.net,..." node tools/ecwid-rail-check.mjs <url> <width> <height> <shot>
import { launch, sleep } from './cdp-realsb.mjs';
const [url = 'http://127.0.0.1:8791/', W0 = '1280', H0 = '900', shot = 'tmp/shots/rail'] = process.argv.slice(2);
const W = Number(W0), H = Number(H0), touch = W < 600;
const b = await launch({ port: 0 });
const page = await b.newPage({ width: W, height: H, mobile: touch });
if (touch) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await page.send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('lifted-age-ok','1'); window.__errs = []; addEventListener('error', function (e) { window.__errs.push(String(e.message) + ' @ ' + String(e.filename || '').split('/').pop() + ':' + e.lineno); });" });
await page.goto(url);
const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };

const PROBE = `(() => {
  const m = document.querySelector('[data-ecwid]'); const g = m && m.querySelector('.grid__categories[data-lc-rail]');
  const T = (t) => t.querySelector('.grid-category__title-inner').textContent.trim();
  if (!g) return { rail: false, root: !!(m && m.querySelector('.ec-store__category-page--0')), hash: location.hash, pageSW: document.documentElement.scrollWidth, iw: innerWidth };
  const gr = g.getBoundingClientRect();
  const tiles = [...g.children].filter((c) => c.classList.contains('grid-category'));
  const seen = tiles.map((t) => ({ t: T(t), r: t.getBoundingClientRect() })).filter((x) => x.r.right > gr.left + 4 && x.r.left < gr.right - 4).sort((a, c) => a.r.left - c.r.left);
  const firstTile = tiles.find((t) => T(t) === (seen[0] && seen[0].t));
  const img = firstTile && firstTile.querySelector('.grid-category__image').getBoundingClientRect();
  const btns = [...m.querySelectorAll('.lc-cats-nav button')].map((x) => x.getBoundingClientRect());
  return { rail: true, n: tiles.length, vis: g.style.getPropertyValue('--lc-vis'), gridH: Math.round(gr.height), gridW: Math.round(gr.width), gridTop: Math.round(gr.top),
    tileW: Math.round(tiles[0].getBoundingClientRect().width), first: seen[0] && seen[0].t, seen: seen.map((x) => x.t + '@' + Math.round(x.r.left - gr.left)),
    oneRow: new Set(tiles.map((t) => Math.round(t.getBoundingClientRect().top))).size === 1,
    navY: btns[0] && Math.round(btns[0].top + btns[0].height / 2), imgY: img && Math.round(img.top + img.height / 2),
    prev: btns[0] && { x: Math.round(btns[0].left + btns[0].width / 2), y: Math.round(btns[0].top + btns[0].height / 2) },
    next: btns[1] && { x: Math.round(btns[1].left + btns[1].width / 2), y: Math.round(btns[1].top + btns[1].height / 2) },
    tileC: seen[0] && { x: Math.round(gr.left + gr.width * 0.45), y: Math.round(seen[0].r.top + seen[0].r.height * 0.4) },   // mid-row: clear of both arrows
    titleC: (() => { const t = tiles.map((x) => [x, x.getBoundingClientRect()]).filter(([, r]) => r.left >= gr.left - 2 && r.right <= gr.right + 2).sort((a, c) => a[1].left - c[1].left)[0]; if (!t) return null; const a = t[0].querySelector('a.grid-category__title').getBoundingClientRect(); return { x: Math.round(a.left + a.width / 2), y: Math.round(a.top + a.height / 2), name: T(t[0]) }; })(),
    firstC: seen[0] && { x: Math.round(Math.max(seen[0].r.left, gr.left) + 40), y: Math.round(seen[0].r.top + seen[0].r.height * 0.4) },
    panelScrollH: m.scrollHeight, panelH: Math.round(m.getBoundingClientRect().height), pageSW: document.documentElement.scrollWidth, iw: innerWidth, hash: location.hash };
})()`;
const probe = () => page.eval(PROBE);
const waitRail = async (ms) => { for (let t = 0; t < ms; t += 500) { const s = await probe(); if (s.rail && s.first) return s; await sleep(500); } return probe(); };
const mouse = (type, x, y, buttons = 0) => page.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' && !buttons ? 'none' : 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1 });
const tap = async (p) => {
  if (touch) { await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] }); await sleep(60); await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { await mouse('mouseMoved', p.x, p.y); await mouse('mousePressed', p.x, p.y, 1); await sleep(50); await mouse('mouseReleased', p.x, p.y); }
};
const center = () => page.eval(`(() => { const g = document.querySelector('[data-ecwid] .grid__categories[data-lc-rail]'); if (g) g.scrollIntoView({ block: 'center' }); return !!g; })()`);

await sleep(1200);
await page.eval("(document.querySelector('[data-ecwid]') || document.body).scrollIntoView({ block: 'start' })");
let s0 = await waitRail(30000);
check('rail armed on the root category grid', s0.rail, JSON.stringify({ n: s0.n, vis: s0.vis }));
if (!s0.rail) { await page.screenshot(shot + '.fail.png'); await b.close(); process.exit(1); }
await center(); await sleep(400); { const q = await probe(); if (touch) await sleep(4000 + 700); else { await mouse('mouseMoved', q.tileC.x, q.tileC.y); await sleep(900); } } s0 = await probe();
console.log('layout', JSON.stringify({ gridH: s0.gridH, gridW: s0.gridW, tileW: s0.tileW, seen: s0.seen, panelScrollH: s0.panelScrollH, panelH: s0.panelH, pageSW: s0.pageSW, iw: s0.iw }));
check('one row', s0.oneRow);
check('grid height under 560px (was 1,617 at 1280)', s0.gridH < 560, s0.gridH + 'px');
check('no horizontal page overflow', s0.pageSW <= s0.iw, s0.pageSW + ' <= ' + s0.iw);
check('arrows centred on the card images', Math.abs(s0.navY - s0.imgY) <= 3, 'nav ' + s0.navY + ' img ' + s0.imgY);
await page.screenshot(shot + '.' + W + '.png');

// autoplay: one step after ~3.8s with no pointer over the rail
if (!touch) await mouse('mouseMoved', Math.round(W / 2), 6);
await sleep(4700);
let s1 = await probe();
check('autoplay advanced', [1, 2].map((k) => (s0.seen[k] || '').split('@')[0]).includes(s1.first), s0.first + ' -> ' + s1.first);
if (!touch) { await mouse('mouseMoved', s1.next.x, s1.next.y); await sleep(900); s1 = await probe(); }

// arrows: any tap holds autoplay off for 6s (a phone has no hover), so measure from the second tap; the first may
// have been queued behind an autoplay step already in flight
await tap(s1.next); await sleep(1000);
const sA = await probe();
await tap(sA.next); await sleep(1000);
const s2 = await probe();
check('next arrow steps one card', s2.first === sA.seen[1].split('@')[0], sA.first + ' -> ' + s2.first);
await tap(s2.prev); await sleep(1000);
const s3 = await probe();
check('prev arrow steps back', s3.first === sA.first, s2.first + ' -> ' + s3.first);
// loop: 9 nexts on 8 cards wraps past the end and keeps going
for (let i = 0; i < s3.n + 1; i++) { await tap(s3.next); await sleep(760); }
const s3b = await probe();
check('wraps around the end (n+1 steps = 1 step)', s3b.first === s3.seen[1].split('@')[0] && s3b.oneRow && s3b.seen.length >= Math.floor(Number(s3b.vis)), s3.first + ' -> ' + s3b.first + ' seen ' + s3b.seen.length);

// drag/swipe left by ~1.3 cards: the row follows, then settles further on, and nothing navigates
const hash0 = s3b.hash, p = s3b.tileC, dist = Math.round(s3b.tileW * 1.3);
if (touch) {
  await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
  for (let i = 1; i <= 12; i++) { await page.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x - (dist * i) / 12, y: p.y }] }); await sleep(16); }
  await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
} else {
  await mouse('mouseMoved', p.x, p.y); await mouse('mousePressed', p.x, p.y, 1);
  for (let i = 1; i <= 12; i++) { await mouse('mouseMoved', p.x - (dist * i) / 12, p.y, 1); await sleep(16); }
  await mouse('mouseReleased', p.x - dist, p.y);
}
await sleep(1200);
const s4 = await probe();
check('drag moved the row on', s4.first !== s3b.first && s4.rail, s3b.first + ' -> ' + s4.first);
check('a drag does not open a category', s4.hash === hash0, 'hash ' + JSON.stringify(s4.hash));

// a tap/click on a card opens that category in Ecwid, and Back re-arms the rail
const want = s4.titleC.name;
await tap(s4.titleC); await sleep(3500);
const s5 = await probe();
check('tap opens the category', /\/c\/\d+/.test(s5.hash) && s5.hash.toLowerCase().indexOf(want.split('/')[0].replace(/ /g, '-').toLowerCase()) > 0 && !s5.rail, 'hash ' + s5.hash + ' (wanted ' + want + ')');
await page.eval('history.back()');
const s6 = await waitRail(15000);
check('Back re-arms the rail', s6.rail && s6.oneRow && !!s6.first, JSON.stringify({ rail: s6.rail, first: s6.first, hash: s6.hash }));
const navs = await page.eval("document.querySelectorAll('.lc-cats-nav').length");
check('exactly one set of arrows', navs === 1, String(navs));
const errs = await page.eval('window.__errs || []');
check('no page errors from site.js', !errs.some((e) => / @ site\.js/.test(e)), errs.join(' | ') || 'none');
console.log(results.filter((r) => !r.ok).length ? 'FAILED ' + results.filter((r) => !r.ok).map((r) => r.name).join(' | ') : 'ALL ' + results.length + ' PASS');
await b.close();
process.exitCode = results.some((r) => !r.ok) ? 1 : 0;
