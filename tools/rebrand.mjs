#!/usr/bin/env node
/*
 * Changes the app name, tagline, domain and/or Android package everywhere, in one command.
 * The current values are read from site.config.json, replaced in every text file of the site, then saved.
 *
 *   node tools/rebrand.mjs --name "NewName" --tagline "Radio from everywhere." --domain newname.app
 *   node tools/rebrand.mjs --domain newname.app --dry-run     (only lists what would change)
 *
 * Afterwards: node tools/make-og-image.mjs (share image with the new name), review `git diff`, commit.
 * The Android package (--android-package) must match the Play Store app: only change it before the first release.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'site.config.json');
const FILES = ['index.html', '404.html', 'privacy-policy.html', 'legal-notice.html', 'terms-of-use.html',
  'manifest.webmanifest', 'robots.txt', 'sitemap.xml', 'README.md', '.well-known/assetlinks.json',
  'assets/js/app.js', 'assets/js/i18n.js', 'assets/js/locales'];

function args() {
  const out = { dryRun: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (['--name', '--tagline', '--domain', '--android-package'].includes(a) && argv[i + 1]) {
      out[a.slice(2).replace(/-(\w)/g, (m, c) => c.toUpperCase())] = argv[++i].trim();
    } else {
      console.error('Unknown or incomplete option: ' + a);
      process.exit(1);
    }
  }
  return out;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const listFiles = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isDirectory()) return fs.readdirSync(abs).map((f) => path.join(rel, f));
  return [rel];
};

const opts = args();
const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const next = { ...cfg };
if (opts.name) next.name = opts.name;
if (opts.tagline) next.tagline = opts.tagline;
if (opts.domain) next.domain = opts.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
if (opts.androidPackage) next.androidPackage = opts.androidPackage;
if (JSON.stringify(next) === JSON.stringify(cfg)) {
  console.log('Nothing to change. Current values:', cfg);
  process.exit(0);
}

// Order matters: tagline before name (the tagline may follow the name), package before name (it may contain it in lowercase)
const rules = [];
if (next.tagline !== cfg.tagline) rules.push([new RegExp(escape(cfg.tagline), 'g'), next.tagline]);
if (next.androidPackage !== cfg.androidPackage) rules.push([new RegExp(escape(cfg.androidPackage), 'g'), next.androidPackage]);
if (next.domain !== cfg.domain) {
  rules.push([new RegExp('https://' + escape(cfg.domain), 'g'), 'https://' + next.domain]);
  // Legal pages: the website placeholder becomes a real link
  rules.push([/<mark class="legal-placeholder">\[WEBSITE URL\]<\/mark>/g, `<a href="https://${next.domain}/">https://${next.domain}/</a>`]);
}
if (next.name !== cfg.name) rules.push([new RegExp('\\b' + escape(cfg.name) + '\\b', 'g'), next.name]);

let changed = 0;
for (const rel of FILES.flatMap(listFiles)) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  const after = rules.reduce((text, [re, value]) => text.replace(re, () => value), before);
  if (after === before) continue;
  changed++;
  console.log((opts.dryRun ? 'would update ' : 'updated ') + rel);
  if (!opts.dryRun) fs.writeFileSync(file, after);
}

if (!opts.dryRun) {
  // New cache version so installed apps pick up the new texts
  const sw = path.join(ROOT, 'service-worker.js');
  const text = fs.readFileSync(sw, 'utf8').replace(/CACHE_VERSION = 'v(\d+)'/, (m, n) => `CACHE_VERSION = 'v${Number(n) + 1}'`);
  fs.writeFileSync(sw, text);
  fs.writeFileSync(CONFIG, JSON.stringify(next, null, 2) + '\n');
  console.log(`\n${changed} file(s) updated, site.config.json saved, CACHE_VERSION bumped.`);
  if (next.name !== cfg.name || next.tagline !== cfg.tagline) console.log('Now run: node tools/make-og-image.mjs');
  if (next.domain !== cfg.domain) console.log('Remember: .well-known/assetlinks.json and the Play Console must use the same domain.');
}
