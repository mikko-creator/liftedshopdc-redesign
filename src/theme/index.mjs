// index.mjs - the theme contract: renderPage(page, ctx) and render404(ctx).
import { esc, attr, ICON } from './util.mjs';
import { shell } from './shell.mjs';
import { posts, btn } from './blocks.mjs';
import { backdrop, cloudBank, protrude, bagFan } from './parts.mjs';
import { layoutOf, heroArt } from './inner.mjs';
import { liftoffPage } from './liftoff.mjs';
import { landingPage } from './landing.mjs';
import { archivePage, render404 } from './archive.mjs';
export { render404 };
import { homePage } from './home.mjs';

export function renderPage(page, ctx) {
  const layout = layoutOf(page);
  let main, ogImage = null, crumbs = null;
  if (layout === 'home') { main = homePage(page, ctx); ogImage = 'G-HERO-SKY'; }
  else if (layout === 'liftoff') { main = liftoffPage(page, ctx); ogImage = heroArt(page).still; }
  else if (layout === 'archive') { main = archivePage(page, ctx); ogImage = 'G-ORBIT'; }
  else { main = landingPage(page, ctx); ogImage = heroArt(page).still; }
  const bc = page.sections && JSON.stringify(page.sections).includes('"breadcrumbs"') ? null : null;
  return shell(ctx, { page, main, ogImage, crumbs: crumbs || bc, bodyClass: 'l-' + layout + (page.kind === 'post' ? ' is-post' : '') });
}

