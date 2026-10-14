// crawl.mjs - polite same-origin harvest of liftedshopdc.com into audit/raw/ (Node builtins only).
//   node tools/crawl.mjs [--max 600] [--gap 600]
// Seeds: "/" plus every <loc> in the sitemaps robots.txt declares (post, page, author). BFS over same-origin <a href>.
// Breakers: ONE connection, --gap ms between requests; the first 401/403/429 stops the run (a refusal is a stop,
// never retried); 8 x 404 in a row stops the run. Redirect chains are recorded (B9), never followed off-origin.
// Writes audit/raw/<key>.html (untouched bytes) and audit/crawl.json (url, status, chain, file, bytes, contentType).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const MAX = Number(args.max || 600), GAP = Number(args.gap || 600);
const ORIGIN = 'https://www.liftedshopdc.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const RAW = path.join(PROJ, 'audit/raw');
fs.mkdirSync(RAW, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXCLUDE = [/\/wp-json/i, /\/feed\/?$/i, /\/wp-admin/i, /wp-login\.php/i, /xmlrpc\.php/i, /[?&]s=/i, /replytocom=/i,
  /\/wp-content\//i, /\/wp-includes\//i, /\.(jpe?g|png|gif|webp|svg|pdf|zip|mp4|webm|css|js|xml|ico|woff2?|ttf)(\?|$)/i, /\/comments\/feed/i];

function norm(u, base) {
  let x;
  try { x = new URL(u, base); } catch { return null; }
  if (!/^https?:$/.test(x.protocol)) return null;
  if (!/^(www\.)?liftedshopdc\.com$/i.test(x.hostname)) return null;
  x.protocol = 'https:'; x.hostname = 'www.liftedshopdc.com'; x.hash = '';
  // keep query only for pagination-like params; drop tracking
  const keep = new URLSearchParams();
  for (const [k, v] of x.searchParams) if (/^(page|paged|p)$/i.test(k)) keep.set(k, v);
  x.search = keep.toString() ? '?' + keep.toString() : '';
  let p = x.pathname.replace(/\/{2,}/g, '/');
  if (!/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith('/')) p += '/';
  x.pathname = p;
  const s = x.toString();
  return EXCLUDE.some((re) => re.test(s)) ? null : s;
}
const keyOf = (u) => {
  const x = new URL(u);
  let k = x.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'index';
  if (x.search) k += '__q_' + x.search.slice(1).replace(/[^a-z0-9]+/gi, '_');
  return k.toLowerCase();
};

async function get(u) {
  const chain = [];
  let cur = u;
  for (let hop = 0; hop < 8; hop++) {
    const res = await fetch(cur, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' } });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      const next = new URL(res.headers.get('location'), cur).toString();
      chain.push({ from: cur, status: res.status, to: next });
      await res.arrayBuffer().catch(() => {});
      if (!/^https?:\/\/(www\.)?liftedshopdc\.com/i.test(next)) return { status: res.status, chain, offOrigin: next };
      cur = next; await sleep(GAP); continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, chain, finalUrl: cur, contentType: res.headers.get('content-type') || '', buf };
  }
  return { status: 0, chain, error: 'too many redirects' };
}

async function sitemapSeeds() {
  const out = [];
  for (const sm of ['post-sitemap.xml', 'page-sitemap.xml', 'author-sitemap.xml']) {
    const r = await get(ORIGIN + '/' + sm); await sleep(GAP);
    if (r.status !== 200 || !r.buf) { console.log('sitemap', sm, r.status); continue; }
    for (const m of r.buf.toString('utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) out.push(m[1].trim());
  }
  return out;
}

const records = [];
const seen = new Set();
const queue = [];
const push = (u, from) => { const n = norm(u, from || ORIGIN); if (n && !seen.has(n)) { seen.add(n); queue.push(n); } };
push(ORIGIN + '/');
for (const s of await sitemapSeeds()) push(s);
console.log('seeds', queue.length);
let consecutive404 = 0, stopped = null;
while (queue.length && records.length < MAX) {
  const u = queue.shift();
  let r;
  try { r = await get(u); } catch (e) { records.push({ url: u, status: 0, error: String(e.message || e) }); await sleep(GAP); continue; }
  const rec = { url: u, status: r.status, chain: r.chain, finalUrl: r.finalUrl || null, contentType: r.contentType || null };
  if (r.offOrigin) rec.offOrigin = r.offOrigin;
  if ([401, 403, 429].includes(r.status)) { rec.refused = true; records.push(rec); stopped = 'refusal ' + r.status + ' at ' + u; break; }
  if (r.status === 404) { consecutive404++; if (consecutive404 >= 8) { records.push(rec); stopped = '8 x 404 in a row'; break; } } else consecutive404 = 0;
  if (r.buf && /text\/html/i.test(r.contentType || '')) {
    const key = keyOf(r.finalUrl || u);
    const file = 'audit/raw/' + key + '.html';
    fs.writeFileSync(path.join(PROJ, file), r.buf);
    rec.file = file; rec.bytes = r.buf.length;
    if (r.status === 200) {
      const html = r.buf.toString('utf8');
      for (const m of html.matchAll(/<a\b[^>]*?\shref\s*=\s*["']([^"'#][^"']*)["']/gi)) push(m[1].replace(/&amp;/g, '&'), r.finalUrl || u);
    }
    if (r.finalUrl && r.finalUrl !== u) { const n = norm(r.finalUrl); if (n) seen.add(n); }
  }
  records.push(rec);
  process.stdout.write(`${records.length} ${r.status} ${u}${r.chain.length ? ' -> ' + (r.finalUrl || r.offOrigin) : ''}\n`);
  await sleep(GAP);
}
const out = { origin: ORIGIN, at: new Date().toISOString(), robotsHonoured: true, gapMs: GAP, max: MAX,
  truncated: queue.length > 0 && !stopped, stopped, pending: queue.slice(0, 50), counts: {
    total: records.length, ok: records.filter((r) => r.status === 200).length,
    redirected: records.filter((r) => r.chain && r.chain.length).length, notFound: records.filter((r) => r.status === 404).length },
  records };
fs.writeFileSync(path.join(PROJ, 'audit/crawl.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.counts), 'stopped:', stopped, 'truncated:', out.truncated);
