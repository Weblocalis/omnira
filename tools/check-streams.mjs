#!/usr/bin/env node
/*
 * Plays every station of the catalog in a real (headless) Chromium, through the app itself, and reports which ones
 * reach the "Playing" state. More reliable than a plain HTTP request: some servers reject non-browser clients.
 *
 *   node tools/check-streams.mjs                 all stations
 *   node tools/check-streams.mjs fip-france ...  only these ids
 *   NOHLS=1 node tools/check-streams.mjs         force hls.js for .m3u8 (as on Firefox / browsers without native HLS)
 *
 * Requires Playwright (npm i -g playwright && npx playwright install chromium).
 * A failure can be a geo-restriction of your location: test from the target country before removing a station.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)('playwright');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const PARALLEL = 6;
const WAIT_S = 20;

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/#radios`;

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'], proxy });
const ctx = await browser.newContext({ ignoreHTTPSErrors: !!proxy });
if (process.env.NOHLS) {
  await ctx.addInitScript(() => {
    const orig = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function (t) { return /mpegurl/i.test(t) ? '' : orig.call(this, t); };
  });
}

const probe = await ctx.newPage();
await probe.goto(base);
await probe.waitForSelector('.station-card');
const wanted = process.argv.slice(2);
const ids = (await probe.$$eval('.station-card', (cards) => cards.map((c) => c.dataset.id))).filter((id) => !wanted.length || wanted.includes(id));
await probe.close();

async function check(id) {
  const page = await ctx.newPage();
  try {
    await page.goto(base);
    await page.waitForSelector('.station-card');
    await page.evaluate((sid) => document.querySelector(`.station-card[data-id="${sid}"] .station-main`).click(), id);
    let status = '';
    for (let i = 0; i < WAIT_S; i++) {
      await page.waitForTimeout(1000);
      status = await page.locator('#status-text').innerText();
      if (await page.evaluate(() => document.getElementById('status-dot').className.match(/status-(playing|error)/))) break;
    }
    const playing = await page.evaluate(() => document.getElementById('status-dot').classList.contains('status-playing'));
    return { id, playing, status };
  } finally {
    await page.close();
  }
}

const results = [];
for (let i = 0; i < ids.length; i += PARALLEL) {
  results.push(...await Promise.all(ids.slice(i, i + PARALLEL).map(check)));
}
for (const r of results) console.log(`${r.playing ? ' OK ' : 'FAIL'}  ${r.id.padEnd(32)} ${r.status}`);
const failed = results.filter((r) => !r.playing).length;
console.log(`\n${results.length - failed}/${results.length} stations playing.`);
await browser.close();
server.close();
process.exitCode = failed ? 1 : 0;
