import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const SOLUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';
const FETCH_TIMEOUT_MS = 8000;

const app = express();
app.disable('x-powered-by');

// Security and cache headers compatible with iframe embedding in AI Studio
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()'
  );
  next();
});

function getMapsApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();
}

function isQuotaError(status, payload) {
  return status === 429 || payload?.error?.status === 'RESOURCE_EXHAUSTED';
}

function extractCityName(result) {
  if (!result || typeof result !== 'object') return '';
  const comps = Array.isArray(result.addressComponents) ? result.addressComponents : [];
  const pick = (type) => {
    const found = comps.find((c) => Array.isArray(c.types) && c.types.includes(type));
    return found ? String(found.longText || found.shortText || '').trim() : '';
  };
  const locality =
    pick('locality') ||
    pick('postal_town') ||
    pick('administrative_area_level_2') ||
    pick('administrative_area_level_1');
  const country = pick('country');
  if (locality && country && locality !== country) return `${locality}, ${country}`;
  if (locality) return locality;
  if (country) return country;
  return String(result.formattedAddress || '').trim();
}

async function fetchJsonWithTimeout(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  } finally {
    clearTimeout(timer);
  }
}

async function forwardGeocode(city, lang, apiKey) {
  const url = new URL(
    `https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(city)}`
  );
  url.searchParams.set('languageCode', lang);
  return fetchJsonWithTimeout(url.toString(), {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'results.location,results.formattedAddress,results.addressComponents',
    'X-Goog-Maps-Solution-ID': SOLUTION_ID
  });
}

async function reverseGeocode(lat, lng, lang, apiKey) {
  const url = new URL('https://geocode.googleapis.com/v4/geocode/location');
  url.searchParams.set('location.latitude', String(lat));
  url.searchParams.set('location.longitude', String(lng));
  url.searchParams.set('languageCode', lang);
  return fetchJsonWithTimeout(url.toString(), {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'results.formattedAddress,results.addressComponents',
    'X-Goog-Maps-Solution-ID': SOLUTION_ID
  });
}

async function fetchCurrentWeather(lat, lng, lang, units, apiKey) {
  const url = new URL('https://weather.googleapis.com/v1/currentConditions:lookup');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('location.latitude', String(lat));
  url.searchParams.set('location.longitude', String(lng));
  url.searchParams.set('unitsSystem', units);
  url.searchParams.set('languageCode', lang);
  return fetchJsonWithTimeout(url.toString(), {
    'X-Goog-Maps-Solution-ID': SOLUTION_ID
  });
}

// Server-side proxy for Google Maps Platform Weather API + Geocoding API v4
app.get('/api/weather', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    res.status(503).json({ error: 'weather_unconfigured' });
    return;
  }

  const rawLang = typeof req.query.lang === 'string' ? req.query.lang.trim().toLowerCase() : 'en';
  const lang = rawLang === 'fr' ? 'fr' : 'en';
  const rawUnits = typeof req.query.units === 'string' ? req.query.units.trim().toUpperCase() : 'METRIC';
  const units = rawUnits === 'IMPERIAL' ? 'IMPERIAL' : 'METRIC';
  const city = typeof req.query.city === 'string' ? req.query.city.trim().slice(0, 120) : '';

  const hasCoords = req.query.lat !== undefined && req.query.lng !== undefined;
  let lat = hasCoords ? Number(req.query.lat) : NaN;
  let lng = hasCoords ? Number(req.query.lng) : NaN;

  if (hasCoords) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'invalid_coordinates' });
      return;
    }
  } else if (!city) {
    res.status(400).json({ error: 'missing_location' });
    return;
  }

  try {
    let locationName = '';

    if (!hasCoords) {
      const geo = await forwardGeocode(city, lang, apiKey);
      if (isQuotaError(geo.status, geo.data)) {
        res.status(429).json({ error: 'quota_exceeded', quotaExceeded: true });
        return;
      }
      if (!geo.ok) {
        res.status(502).json({ error: 'geocode_failed' });
        return;
      }
      const first = Array.isArray(geo.data?.results) ? geo.data.results[0] : null;
      const gLat = Number(first?.location?.latitude);
      const gLng = Number(first?.location?.longitude);
      if (!first || !Number.isFinite(gLat) || !Number.isFinite(gLng)) {
        res.status(404).json({ error: 'location_not_found' });
        return;
      }
      lat = gLat;
      lng = gLng;
      locationName = extractCityName(first) || city;
    }

    const weatherPromise = fetchCurrentWeather(lat, lng, lang, units, apiKey);
    const reversePromise = hasCoords
      ? reverseGeocode(lat, lng, lang, apiKey).catch(() => null)
      : Promise.resolve(null);

    const [weatherRes, reverseRes] = await Promise.all([weatherPromise, reversePromise]);

    if (isQuotaError(weatherRes.status, weatherRes.data) || (reverseRes && isQuotaError(reverseRes.status, reverseRes.data))) {
      res.status(429).json({ error: 'quota_exceeded', quotaExceeded: true });
      return;
    }

    if (!weatherRes.ok || !weatherRes.data || typeof weatherRes.data !== 'object') {
      res.status(502).json({ error: 'weather_unavailable' });
      return;
    }

    if (hasCoords && reverseRes && reverseRes.ok) {
      const firstRev = Array.isArray(reverseRes.data?.results) ? reverseRes.data.results[0] : null;
      locationName = extractCityName(firstRev);
    }

    const w = weatherRes.data;
    const rawIconBase = typeof w.weatherCondition?.iconBaseUri === 'string' ? w.weatherCondition.iconBaseUri : '';
    const safeIconUrl = rawIconBase.startsWith('https://maps.gstatic.com/') ? `${rawIconBase}.svg` : '';

    res.json({
      locationName: locationName || `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      latitude: lat,
      longitude: lng,
      isDaytime: w.isDaytime !== false,
      currentTime: typeof w.currentTime === 'string' ? w.currentTime : '',
      timeZone: typeof w.timeZone?.id === 'string' ? w.timeZone.id : '',
      temperature: {
        degrees: Number.isFinite(w.temperature?.degrees) ? w.temperature.degrees : null,
        unit: w.temperature?.unit || 'CELSIUS'
      },
      feelsLike: {
        degrees: Number.isFinite(w.feelsLikeTemperature?.degrees) ? w.feelsLikeTemperature.degrees : null,
        unit: w.feelsLikeTemperature?.unit || 'CELSIUS'
      },
      minTemperature: {
        degrees: Number.isFinite(w.currentConditionsHistory?.minTemperature?.degrees)
          ? w.currentConditionsHistory.minTemperature.degrees
          : null,
        unit: w.currentConditionsHistory?.minTemperature?.unit || 'CELSIUS'
      },
      maxTemperature: {
        degrees: Number.isFinite(w.currentConditionsHistory?.maxTemperature?.degrees)
          ? w.currentConditionsHistory.maxTemperature.degrees
          : null,
        unit: w.currentConditionsHistory?.maxTemperature?.unit || 'CELSIUS'
      },
      humidity: Number.isFinite(w.relativeHumidity) ? w.relativeHumidity : null,
      wind: {
        speed: Number.isFinite(w.wind?.speed?.value) ? w.wind.speed.value : null,
        unit: w.wind?.speed?.unit || 'KILOMETERS_PER_HOUR',
        cardinal: typeof w.wind?.direction?.cardinal === 'string' ? w.wind.direction.cardinal : ''
      },
      precipitationProbability: Number.isFinite(w.precipitation?.probability?.percent)
        ? w.precipitation.probability.percent
        : null,
      uvIndex: Number.isFinite(w.uvIndex) ? w.uvIndex : null,
      condition: {
        type: typeof w.weatherCondition?.type === 'string' ? w.weatherCondition.type : '',
        text: typeof w.weatherCondition?.description?.text === 'string' ? w.weatherCondition.description.text : '',
        iconUrl: safeIconUrl
      }
    });
  } catch (err) {
    console.error('Weather API proxy error:', err && err.message ? err.message : err);
    res.status(502).json({ error: 'weather_unavailable' });
  }
});

// Serve ads.txt for Google AdSense verification
app.get('/ads.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(ROOT, 'ads.txt'));
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

// Block access to server/config/tooling/cache files that should not be exposed as static assets
app.use(['/server.js', '/package.json', '/package-lock.json', '/.env', '/.env.example', '/.gmp_cache', '/tools', '/tests'], (req, res) => {
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
