#!/usr/bin/env node
/*
 * Browser smoke test (real headless Chromium via Playwright). Serves the site locally with the CSP of _headers,
 * then checks: no console/CSP error, catalog rendered, filters, favorites, theme, language, legal pages, 404.
 *   node tests/smoke.mjs
 * Audio playback itself is NOT tested here (no sound card, streams depend on the network).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)('playwright');
const csp = /Content-Security-Policy: (.*)/.exec(fs.readFileSync(path.join(ROOT, '_headers'), 'utf8'))[1];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  let status = 200;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { file = path.join(ROOT, '404.html'); status = 404; }
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

let failures = 0;
const ok = (cond, label) => { console.log((cond ? '  ok   ' : '  FAIL ') + label); if (!cond) failures++; };

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
await ctx.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());   // no external request is needed to render the app
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(base, { waitUntil: 'load' });
ok(await page.locator('#themes-list .cat-card').count() > 3, 'home: activity cards');
ok(await page.locator('#genres-list .cat-card').count() > 5, 'home: genre family cards');
ok(await page.locator('#countries-list .cat-card').count() > 10, 'home: country cards');
ok(await page.locator('#picks-list .station-card').count() === 4, 'home: 4 daily picks');
ok((await page.title()).includes(JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'))).name), 'title contains the app name');
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.bi-gear'), '::before').fontFamily.includes('bootstrap-icons')), 'icon font applied');

await page.click('#nav-radios');
const total = await page.locator('#station-list .station-card').count();
ok(total >= 40, `catalog: ${total} stations`);
const genreOptions = await page.locator('#filter-genre option').count();
ok(genreOptions > 5 && genreOptions < 25, `genre filter: ${genreOptions} options (families, not raw strings)`);
await page.click('[data-bs-target="#filters"]');
await page.waitForSelector('#filter-genre', { state: 'visible' });
await page.selectOption('#filter-genre', 'f:news');
const news = await page.locator('#station-list .station-card').count();
ok(news > 0 && news < total, `genre filter "news": ${news} stations`);
await page.click('#btn-reset');
await page.fill('#search', 'fip');
ok(await page.locator('#station-list .station-card').count() === 1, 'search "fip"');
await page.fill('#search', '');

await page.locator('#station-list .btn-fav').first().click();
ok(await page.locator('#fav-badge').innerText() === '1', 'favorite added (badge = 1)');
await page.click('#nav-favorites');
await page.waitForFunction(() => document.getElementById('view-title').textContent === 'Favorites');
ok(await page.locator('#station-list .station-card').count() === 1, 'favorites view');
await page.reload();
ok(await page.locator('#station-list .station-card').count() === 1, 'favorite persisted after reload');

await page.click('#btn-settings');
await page.locator('label[for="theme-light"]').click();
ok(await page.evaluate(() => document.documentElement.dataset.bsTheme) === 'light', 'theme: light');
ok(await page.locator('#language-settings').isVisible(), 'language selector visible (2 languages)');
await page.locator('label[for="ui-language-fr"]').click();
ok(await page.locator('#nav-home span').innerText() === 'Accueil', 'language: French');
ok(await page.evaluate(() => document.documentElement.lang) === 'fr', 'html lang="fr"');
await page.locator('label[for="ui-language-auto"]').click();
await page.keyboard.press('Escape');

await page.click('#nav-radios');
await page.locator('#station-list .station-main').first().click();
ok((await page.locator('#player-name').innerText()).length > 0, 'player shows the selected station');

const fr = await browser.newContext({ locale: 'fr-FR' });
await fr.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
const pfr = await fr.newPage();
await pfr.goto(base);
ok(await pfr.locator('#nav-home span').innerText() === 'Accueil', 'automatic French for a French browser');

for (const legal of ['privacy-policy.html', 'legal-notice.html', 'terms-of-use.html']) {
  const r = await page.goto(base + legal);
  ok(r.status() === 200 && await page.locator('h1').count() === 1, legal);
}
const r404 = await page.goto(base + 'does/not/exist');
ok(r404.status() === 404 && (await page.locator('h1').innerText()) === 'Page not found', '404 page (styled, absolute paths)');
ok(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) !== 'rgba(0, 0, 0, 0)', '404 page stylesheet loaded');

const real = errors.filter((e) => !/net::ERR_FAILED|ERR_BLOCKED_BY_CLIENT|Failed to load resource/.test(e));
ok(real.length === 0, 'no console / CSP error' + (real.length ? ': ' + real.join(' | ') : ''));

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exitCode = failures ? 1 : 0;
