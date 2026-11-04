#!/usr/bin/env node
/*
 * Generates assets/images/og-image.jpg (1200x630), the picture shown when the site is shared
 * (WhatsApp, Facebook, X, LinkedIn, Discord...). Name and tagline come from site.config.json.
 *
 *   npm i -g playwright && npx playwright install chromium   (once, if Playwright is not installed)
 *   node tools/make-og-image.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = fs.readFileSync(path.join(ROOT, 'assets/icons/favicon.svg'), 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:radial-gradient(circle at 78% 30%,#1d3b30 0,#0f1216 55%);color:#e8ecf1;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;padding:0 96px;box-sizing:border-box}
  .icon{width:220px;height:220px;flex:0 0 auto;margin-right:64px;filter:drop-shadow(0 12px 40px rgba(61,220,151,.25))}
  .icon svg{width:100%;height:100%}
  h1{font-size:104px;line-height:1;margin:0 0 20px;letter-spacing:-2px}
  p{font-size:44px;margin:0;color:#a8b2be}
  .bar{display:flex;gap:10px;margin-top:44px;align-items:flex-end;height:56px}
  .bar span{width:14px;border-radius:4px;background:#3ddc97}
</style></head><body>
  <div class="icon">${icon}</div>
  <div><h1>${esc(cfg.name)}</h1><p>${esc(cfg.tagline)}</p>
  <div class="bar">${[24, 48, 32, 56, 20, 40, 28].map((h) => `<span style="height:${h}px"></span>`).join('')}</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
const out = path.join(ROOT, 'assets/images/og-image.jpg');
await page.screenshot({ path: out, type: 'jpeg', quality: 90 });
await browser.close();
console.log('Written ' + path.relative(ROOT, out));
