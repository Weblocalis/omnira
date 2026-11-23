import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const app = express();
app.disable('x-powered-by');

// Security and cache headers compatible with iframe embedding in AI Studio
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  next();
});

// Serve Android Digital Asset Links for TWA verification
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(ROOT, '.well-known', 'assetlinks.json'), { dotfiles: 'allow' });
});

// Service worker must never be aggressively cached
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(ROOT, 'service-worker.js'));
});

// Block access to server/config/tooling files that should not be exposed as static assets
app.use(['/server.js', '/package.json', '/package-lock.json', '/tools', '/tests'], (req, res) => {
  res.status(404).sendFile(path.join(ROOT, '404.html'));
});

// Serve static site files (extensionless HTML supported to match Cloudflare Pages routing)
app.use(
  express.static(ROOT, {
    extensions: ['html'],
    dotfiles: 'ignore',
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}vendor${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.includes(`${path.sep}assets${path.sep}logos${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
    }
  })
);

// 404 fallback matching Cloudflare Pages behavior
app.use((req, res) => {
  res.status(404).sendFile(path.join(ROOT, '404.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Omnira server listening on http://${HOST}:${PORT}`);
});
