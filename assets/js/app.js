/*
 * Omnira — lecteur radio international (JavaScript natif, sans dépendance).
 * Le catalogue est lu depuis window.STATIONS (assets/js/stations.js) + flux personnalisés (localStorage).
 * Toutes les données de station sont affichées via textContent : aucune injection HTML.
 */
(() => {
  'use strict';

  const KEYS = {
    favorites: 'radio.favorites',
    last: 'radio.lastStation',
    volume: 'radio.volume',
    muted: 'radio.muted',
    history: 'radio.history',
    theme: 'radio.theme',
    custom: 'radio.customStations'
  };
  const CONNECT_TIMEOUT_MS = 14000;
  const RECONNECT_DELAYS_MS = [1200, 2500, 5000, 9000];
  const STALL_THRESHOLD_MS = 12000;
  const ALL = '';
  const UNSPECIFIED = '__unspecified__';
  const HISTORY_MAX = 12;
  const LIVE_REFRESH_MS = 15000;
  const THEME_COLOR = { dark: '#0f1216', light: '#f4f6f9' };

  /* ---------- Activities (themes) and genre families ---------- */
  const THEMES = [
    { id: 'focus', icon: 'bi-code-slash',
      match: 'ambient|concentration|lo-?fi|chillhop|chillsynth|synthwave|spacesynth|idm|glitch|programm|coding|informatique|drone' },
    { id: 'work', icon: 'bi-briefcase',
      match: 'classical|classique|orchestr|film score|jazz|instrumental|lo-?fi|chill|downtempo|ambient' },
    { id: 'sport', icon: 'bi-lightning-charge-fill',
      match: 'fitness|workout|energetic|energique|\\bdance\\b|club|running|house|techno|hip-?hop|\\brap\\b|metal' },
    { id: 'relax', icon: 'bi-cup-hot',
      match: 'relax|detente|chill|downtempo|lounge|mellow|acoustic|soul|tarab|andalou|classical|classique|orchestr|baroque|jazz|ambient' },
    { id: 'sleep', icon: 'bi-moon-stars',
      match: 'sleep|sommeil|calm|ambient|drone|deep space' },
    { id: 'drive', icon: 'bi-car-front-fill',
      match: '\\bpop\\b|\\brock\\b|hits|top 40|road|route|voyage|conduite|synthwave|outrun|retrowave|\\bdance\\b|eclectic|eclectique|variety|variete|soul|funk|new wave|americana|electronic' },
    { id: 'discover', icon: 'bi-compass',
      match: 'eclectic|eclectique|discovery|decouverte|world|monde|tarab|andalou|oriental|vaporwave|idm|indie|alternative|folk|traditional|reggae' },
    { id: 'news', icon: 'bi-newspaper',
      match: 'news|information|actualit|current affairs|journal|general interest|generaliste|culture|science|philosoph|ideas|idees|debat|talk|analysis|documentar' }
  ];

  const FAMILIES = [
    { id: 'pop', icon: 'bi-stars', match: '\\bpop\\b|hits|top 40|variety|variete|popular' },
    { id: 'rock', icon: 'bi-speaker', match: '\\brock\\b|metal|indie|alternative' },
    { id: 'electro', icon: 'bi-soundwave',
      match: 'electro|synthwave|spacesynth|chillsynth|idm|vaporwave|techno|house|edm|glitch|space disco|cyberpunk|\\bdance\\b|club' },
    { id: 'hiphop', icon: 'bi-mic', match: 'hip-?hop|\\brap\\b|r&b|rnb' },
    { id: 'soul', icon: 'bi-vinyl', match: 'soul|funk|blues|motown|disco|groove' },
    { id: 'lofi', icon: 'bi-headphones', match: 'lo-?fi|chillhop' },
    { id: 'ambient', icon: 'bi-cloud-haze2', match: 'ambient|drone' },
    { id: 'classique', icon: 'bi-music-note-list', match: 'classical|classique|orchestr|symphon|opera|baroque|film score|soundtrack' },
    { id: 'jazz', icon: 'bi-music-note', match: 'jazz' },
    { id: 'monde', icon: 'bi-globe-europe-africa',
      match: 'world|monde|tarab|arab|andalou|oriental|morocc|maghreb|chaabi|flamenco|gnawa|reggae|\\bdub\\b|latin|afro|celtic|celtique|folk|americana|traditional' },
    { id: 'eclectic', icon: 'bi-shuffle', match: 'eclectic|eclectique|music discovery|new releases' },
    { id: 'instru', icon: 'bi-feather', match: 'instrumental|relax|detente|downtempo|lounge|sleep|sommeil|calm' },
    { id: 'news', icon: 'bi-newspaper', match: 'news|information|actualit|current affairs|debat|talk|analysis|general interest|generaliste' },
    { id: 'culture', icon: 'bi-book-half', match: 'culture|arts\\b|science|philosoph|ideas|idees|documentar' },
    { id: 'spiritual', icon: 'bi-moon', match: 'quran|coran|religio|gospel|spiritual|prayer|sacred' }
  ];
  THEMES.forEach((t) => { t.re = new RegExp(t.match); });
  FAMILIES.forEach((f) => { f.re = new RegExp(f.match); });
  const INSTRUMENTAL_KEY = 'instrumental';

  /* ---------- Stockage local ---------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    available() {
      try {
        localStorage.setItem('radio.probe', '1');
        localStorage.removeItem('radio.probe');
        return true;
      } catch (e) { return false; }
    }
  };

  /* ---------- Utilitaires ---------- */
  const $ = (id) => document.getElementById(id);
  const normalize = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

  const tr = (key, params) => I18N.t(key, params);
  const trn = (key, n, params) => I18N.tn(key, n, params);
  const loc = () => I18N.getLanguage();
  const shown = (value) => (value === UNSPECIFIED ? tr('data.unspecified') : value);
  const langLabel = (key) => (key === INSTRUMENTAL_KEY ? tr('lang.instrumental') : (state.langLabels.get(key) || key));

  function isHttpUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) { return false; }
  }

  function resolveUrl(value) {
    if (!value) return '';
    try {
      const u = new URL(String(value).trim(), location.href);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
    } catch (e) { return ''; }
  }

  const isHls = (url) => /\.m3u8(\?|#|$)/i.test(url);
  const isPlaylistFile = (url) => /\.(m3u|pls)(\?|#|$)/i.test(url);

  function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function normalizeStation(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || '').trim();
    const name = String(raw.name || '').trim();
    const streamUrl = String(raw.streamUrl || '').trim();
    if (!id || !name || !isHttpUrl(streamUrl)) {
      console.warn('Station skipped (invalid id, name or http(s) streamUrl):', raw);
      return null;
    }
    const text = (v, d) => (String(v || '').trim() || d);
    return {
      id, name, streamUrl,
      country: text(raw.country, UNSPECIFIED),
      language: text(raw.language, UNSPECIFIED),
      genre: text(raw.genre, UNSPECIFIED),
      logoUrl: resolveUrl(raw.logoUrl),
      website: isHttpUrl(raw.website) ? String(raw.website).trim() : '',
      themes: Array.isArray(raw.themes) ? raw.themes.map(String) : null,
      custom: raw.custom === true,
      hls: isHls(streamUrl),
      insecure: location.protocol === 'https:' && /^http:/i.test(streamUrl)
    };
  }

  /* ---------- État ---------- */
  const state = {
    stations: [],
    byId: new Map(),
    customStations: [],
    favorites: new Set(),
    filters: { query: '', country: ALL, language: ALL, genre: ALL, theme: '', family: '' },
    view: 'home',
    history: [],
    langLabels: new Map(),
    theme: 'auto',
    interrupted: false,
    interruptedAt: 0,
    current: null,
    wantPlay: false,
    status: 'idle',
    statusKey: 'status.idle',
    statusParams: null,
    volume: 80,
    muted: false,
    reconnectAttempts: 0,
    autoResumeOnOnline: false,
    playStartedAt: 0,
    streamInfoKey: '',
    streamInfoParams: null,
    sleepEndsAt: 0,
    sleepMinutes: 0
  };

  const audio = new Audio();
  audio.preload = 'none';
  let playToken = 0;
  let connectTimer = null;
  let reconnectTimer = null;
  let stallTimer = null;
  let lastAudioTime = -1;
  let stallElapsedMs = 0;
  let fadeRaf = null;
  let liveTickTimer = null;
  let sleepTickTimer = null;
  let toastTimer = null;
  let hls = null;
  let hlsLoader = null;
  const HLS_SCRIPT = 'assets/vendor/hls.js-1.7.3/hls.light.min.js';

  const el = {
    list: $('station-list'), empty: $('empty-state'), count: $('result-count'),
    search: $('search'), clearSearch: $('btn-clear-search'),
    country: $('filter-country'), language: $('filter-language'), genre: $('filter-genre'),
    reset: $('btn-reset'), filtersSection: $('filters-section'), storageWarning: $('storage-warning'),
    orphans: $('orphans-notice'), orphansText: $('orphans-text'), forgetOrphans: $('btn-forget-orphans'),
    emptyIcon: $('empty-icon'), emptyText: $('empty-text'), emptyAction: $('empty-action'),
    navRadios: $('nav-radios'), navFavorites: $('nav-favorites'), navCurrent: $('nav-current'), favBadge: $('fav-badge'),
    navHome: $('nav-home'), headerFav: $('header-fav'),
    homeView: $('home-view'), catalogView: $('catalog-view'), viewTitle: $('view-title'), chips: $('active-chips'),
    homeHero: $('home-hero'), heroSummary: $('hero-summary'),
    btnRandomHome: $('btn-random-home'), btnResumeHome: $('btn-resume-home'), btnResumeLabel: $('btn-resume-label'),
    btnCatalogRandom: $('btn-catalog-random'),
    homeEmpty: $('home-empty'), clearHistory: $('btn-clear-history'),
    recents: $('recents-list'), picks: $('picks-list'), themes: $('themes-list'), genres: $('genres-list'),
    countries: $('countries-list'), languages: $('languages-list'),
    themeInputs: [...document.querySelectorAll('input[name="theme"]')], themeHint: $('theme-hint'),
    langFieldset: $('language-settings'), langOptions: $('language-options'), langHint: $('language-hint'),
    player: $('player'), playerOpen: $('player-open'), logo: $('player-logo'), name: $('player-name'),
    dot: $('status-dot'), statusText: $('status-text'), playerMeta: $('player-meta'), eq: $('player-eq'),
    play: $('btn-play'), prev: $('btn-prev'), next: $('btn-next'), retry: $('btn-retry'),
    playerFav: $('btn-player-fav'), btnSleep: $('btn-sleep'), sleepBadge: $('sleep-badge'),
    expandPlayer: $('btn-expand-player'),
    mute: $('btn-mute'), volume: $('volume'), volumeValue: $('volume-value'),
    sheet: $('now-playing-sheet'), sheetLogo: $('sheet-logo'), sheetName: $('sheet-name'),
    sheetMeta: $('sheet-meta'), sheetDot: $('sheet-dot'), sheetStatus: $('sheet-status'),
    sheetTimer: $('sheet-timer'), sheetQuality: $('sheet-quality'), sheetEq: $('sheet-eq'),
    sheetRandom: $('sheet-random'), sheetPrev: $('sheet-prev'), sheetPlay: $('sheet-play'),
    sheetNext: $('sheet-next'), sheetFav: $('sheet-fav'),
    sheetSleepRemaining: $('sheet-sleep-remaining'), sleepOptions: $('sleep-options'),
    sheetShare: $('sheet-share'), sheetLocate: $('sheet-locate'), sheetWebsite: $('sheet-website'),
    customModal: $('custom-station-modal'), customError: $('custom-form-error'),
    customName: $('custom-name'), customUrl: $('custom-url'),
    customCountry: $('custom-country'), customGenre: $('custom-genre'),
    btnSaveCustom: $('btn-save-custom'), btnSettingsCustom: $('btn-settings-custom'),
    settingsPanel: $('settings-panel'), toast: $('app-toast')
  };

  function showToast(message) {
    if (!el.toast || !message) return;
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.remove('d-none');
    toastTimer = setTimeout(() => { el.toast.classList.add('d-none'); }, 2800);
  }

  function parseLanguages(value) {
    const out = [];
    String(value).replace(/\([^)]*\)/g, ' ').split(/[\/,;&]|\bet\b|\band\b/i).forEach((part) => {
      const label = part.trim();
      const key = normalize(label);
      if (!label) return;
      if (key.startsWith('instrumental') || key.includes('sans paroles')) {
        out.push({ key: INSTRUMENTAL_KEY, label: '' });
      } else if (/^(international|mixte|mixed|multilingu|divers|various|non precis|not specified|__unspecified)/.test(key)) {
        return;
      } else {
        out.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
      }
    });
    return out;
  }

  function annotate(st) {
    const full = normalize(st.genre) + ' | ' + normalize(st.name);
    const genre = normalize(st.genre);
    st.themeIds = st.themes
      ? THEMES.filter((t) => st.themes.includes(t.id)).map((t) => t.id)
      : THEMES.filter((t) => t.re.test(full)).map((t) => t.id);
    st.families = FAMILIES.filter((f) => f.re.test(genre)).map((f) => f.id);
    st.looseGenre = st.families.length ? '' : (st.genre === UNSPECIFIED ? UNSPECIFIED : st.genre.split(/[,&/]/)[0].trim());
    const langs = parseLanguages(st.language);
    st.langs = [...new Set(langs.map((l) => l.key))];
    langs.forEach((l) => { if (!state.langLabels.has(l.key)) state.langLabels.set(l.key, l.label); });
    st.searchText = normalize([st.name, st.country, st.language, st.genre].join(' '));
  }

  /* Drapeau : généré depuis le nom du pays (Intl.DisplayNames) */
  let flagSupport = null;
  let regionByName = null;

  function flagsSupported() {
    if (flagSupport !== null) return flagSupport;
    flagSupport = false;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      const x = c.getContext('2d');
      if (!x) return false;
      x.textBaseline = 'top';
      x.font = '14px sans-serif';
      x.fillText('\uD83C\uDDEB\uD83C\uDDF7', 0, 0);
      const d = x.getImageData(0, 0, 16, 16).data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 0 && Math.abs(d[i] - d[i + 2]) > 40) {
          flagSupport = true;
          break;
        }
      }
    } catch (e) { /* Pas de canvas */ }
    return flagSupport;
  }

  function countryFlag(name) {
    if (!flagsSupported() || !name) return '';
    if (!regionByName) {
      regionByName = new Map();
      try {
        for (const locale of ['en', 'fr']) {
          const dn = new Intl.DisplayNames([locale], { type: 'region' });
          for (let a = 65; a <= 90; a++) {
            for (let b = 65; b <= 90; b++) {
              const code = String.fromCharCode(a, b);
              const n = dn.of(code);
              if (n && n !== code) regionByName.set(normalize(n), code);
            }
          }
        }
      } catch (e) { /* Intl.DisplayNames indisponible */ }
    }
    const code = regionByName.get(normalize(name));
    return code
      ? String.fromCodePoint(...[...code].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65))
      : '';
  }

  /* ---------- Éléments d'interface ---------- */
  function icon(name) {
    const i = document.createElement('i');
    i.className = 'bi ' + name;
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  function makeLogo(station, large) {
    const box = document.createElement('div');
    box.className = 'logo' + (large ? ' logo-lg' : '');
    box.setAttribute('aria-hidden', 'true');
    const fallback = () => box.replaceChildren(icon('bi-broadcast'));
    if (station && station.logoUrl) {
      const img = new Image();
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', fallback);
      img.src = station.logoUrl;
      box.appendChild(img);
    } else {
      fallback();
    }
    return box;
  }

  function createCard(st) {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'station-card';
    card.dataset.id = st.id;

    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'station-main';
    main.dataset.action = 'play';
    main.setAttribute('aria-label', tr('station.listen', { name: st.name }));

    const text = document.createElement('div');
    text.className = 'min-w-0 flex-grow-1';
    const name = document.createElement('div');
    name.className = 'station-name text-truncate';
    name.textContent = st.name;
    const meta = document.createElement('div');
    meta.className = 'station-meta text-truncate';
    const flag = st.country !== UNSPECIFIED ? countryFlag(st.country) : '';
    const countryShown = (flag ? flag + ' ' : '') + shown(st.country);
    meta.textContent = [countryShown, shown(st.language), shown(st.genre)].join(' · ');
    if (st.custom) {
      const cBadge = document.createElement('span');
      cBadge.className = 'badge-custom';
      cBadge.textContent = '· ' + tr('station.custom.badge');
      meta.appendChild(cBadge);
    }
    if (st.insecure) {
      const b = document.createElement('span');
      b.className = 'badge-http';
      b.textContent = 'HTTP';
      b.title = tr('station.http');
      meta.appendChild(b);
    }
    text.append(name, meta);

    const eq = document.createElement('span');
    eq.className = 'eq';
    eq.setAttribute('aria-hidden', 'true');
    eq.append(document.createElement('span'), document.createElement('span'), document.createElement('span'));

    main.append(makeLogo(st, false), text, eq);
    card.appendChild(main);

    if (st.custom) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'station-action';
      del.dataset.action = 'remove-custom';
      del.title = tr('station.custom.remove');
      del.setAttribute('aria-label', tr('station.custom.removeAria', { name: st.name }));
      del.appendChild(icon('bi-x-lg'));
      card.appendChild(del);
    } else if (st.website) {
      const a = document.createElement('a');
      a.className = 'station-action';
      a.href = st.website;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = tr('station.website');
      a.setAttribute('aria-label', tr('station.websiteAria', { name: st.name }));
      a.appendChild(icon('bi-box-arrow-up-right'));
      card.appendChild(a);
    }

    const fav = document.createElement('button');
    fav.type = 'button';
    fav.className = 'station-action btn-fav';
    fav.dataset.action = 'favorite';
    card.appendChild(fav);

    col.appendChild(card);
    return col;
  }

  function paintFavoriteButton(btn, st) {
    if (!btn || !st) return;
    const on = state.favorites.has(st.id);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', tr(on ? 'station.fav.removeAria' : 'station.fav.addAria', { name: st.name }));
    btn.title = tr(on ? 'station.fav.remove' : 'station.fav.add');
    btn.replaceChildren(icon(on ? 'bi-heart-fill' : 'bi-heart'));
  }

  /* ---------- Catalogue combiné (officiel + flux personnalisés) ---------- */
  function rebuildCatalog() {
    state.stations = [];
    state.byId.clear();
    state.langLabels.clear();

    const builtin = Array.isArray(window.STATIONS) ? window.STATIONS : [];
    const custom = Array.isArray(state.customStations) ? state.customStations : [];

    builtin.concat(custom).forEach((r) => {
      const st = normalizeStation(r);
      if (!st) return;
      if (state.byId.has(st.id)) return;
      state.byId.set(st.id, st);
      state.stations.push(st);
      annotate(st);
    });

    fillFilterSelects();
  }

  /* ---------- Filtres et liste ---------- */
  function fillSelect(select, label, values) {
    select.replaceChildren();
    const all = document.createElement('option');
    all.value = ALL;
    all.textContent = label;
    select.appendChild(all);
    [...new Set(values)].sort((a, b) => a.localeCompare(b, loc())).forEach((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = shown(v);
      select.appendChild(o);
    });
  }

  function fillLanguageSelect() {
    el.language.replaceChildren();
    const all = document.createElement('option');
    all.value = ALL;
    all.textContent = tr('filters.allLanguages');
    el.language.appendChild(all);
    [...state.langLabels.keys()].map((key) => [key, langLabel(key)])
      .sort((a, b) => a[1].localeCompare(b[1], loc())).forEach(([key, label]) => {
        const o = document.createElement('option');
        o.value = key;
        o.textContent = label;
        el.language.appendChild(o);
      });
  }

  function fillGenreSelect() {
    const option = (value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; return o; };
    const families = FAMILIES.filter((f) => state.stations.some((s) => s.families.includes(f.id)))
      .map((f) => ['f:' + f.id, tr('family.' + f.id)]);
    const loose = [...new Set(state.stations.map((s) => s.looseGenre).filter(Boolean))].map((g) => ['g:' + g, shown(g)]);
    el.genre.replaceChildren(option(ALL, tr('filters.allGenres')),
      ...families.concat(loose).sort((a, b) => a[1].localeCompare(b[1], loc())).map(([v, l]) => option(v, l)));
  }

  function fillFilterSelects() {
    fillSelect(el.country, tr('filters.allCountries'), state.stations.map((s) => s.country));
    fillLanguageSelect();
    fillGenreSelect();
  }

  function matchesSearch(st, q) {
    if (!q) return true;
    const terms = q.split(/\s+/).filter(Boolean);
    return terms.every((t) => st.searchText.includes(t));
  }

  function filteredStations() {
    const f = state.filters;
    const q = normalize(f.query);
    return state.stations
      .filter((s) =>
        matchesSearch(s, q) &&
        (f.country === ALL || s.country === f.country) &&
        (f.language === ALL || s.langs.includes(f.language)) &&
        (f.genre === ALL || s.looseGenre === f.genre) &&
        (!f.theme || s.themeIds.includes(f.theme)) &&
        (!f.family || s.families.includes(f.family)))
      .sort((a, b) => a.name.localeCompare(b.name, loc()));
  }

  function favoriteStations(q) {
    return state.stations
      .filter((s) => state.favorites.has(s.id) && matchesSearch(s, q))
      .sort((a, b) => a.name.localeCompare(b.name, loc()));
  }

  function getNavigationQueue() {
    const q = normalize(state.filters.query);
    if (state.view === 'favorites') {
      const favs = favoriteStations(q);
      if (favs.length) return favs;
    }
    if (state.view === 'radios') {
      const list = filteredStations();
      if (list.length) return list;
    }
    return [...state.stations].sort((a, b) => a.name.localeCompare(b.name, loc()));
  }

  function paintAllFavButtons() {
    document.querySelectorAll('.station-card .btn-fav').forEach((btn) => {
      const st = state.byId.get(btn.closest('.station-card').dataset.id);
      if (st) paintFavoriteButton(btn, st);
    });
    paintPlayerFav();
  }

  function paintPlayerFav() {
    const st = state.current;
    const on = !!st && state.favorites.has(st.id);
    [el.playerFav, el.sheetFav].forEach((btn) => {
      if (!btn) return;
      btn.disabled = !st;
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('is-fav-active', on);
      btn.setAttribute('aria-label', st ? tr(on ? 'station.fav.removeAria' : 'station.fav.addAria', { name: st.name }) : tr('station.fav.add'));
      btn.title = tr(on ? 'station.fav.remove' : 'station.fav.add');
      btn.replaceChildren(icon(on ? 'bi-heart-fill' : 'bi-heart'));
    });
  }

  function orphanIds() {
    return [...state.favorites].filter((id) => !state.byId.has(id));
  }

  function showStorageWarning() { el.storageWarning.classList.remove('d-none'); }

  function persistFavorites() {
    if (!store.set(KEYS.favorites, [...state.favorites])) showStorageWarning();
  }

  function toggleFavorite(id) {
    const st = state.byId.get(id);
    if (!st) return;
    const adding = !state.favorites.has(id);
    if (adding) state.favorites.add(id); else state.favorites.delete(id);
    persistFavorites();
    if (state.view === 'favorites') {
      renderList();
      paintPlayerFav();
    } else {
      paintAllFavButtons();
      paintNav();
    }
    showToast(tr(adding ? 'station.fav.add' : 'station.fav.remove'));
  }

  function removeCustomStation(id) {
    const idx = state.customStations.findIndex((s) => s.id === id);
    if (idx === -1) return;
    state.customStations.splice(idx, 1);
    if (!store.set(KEYS.custom, state.customStations)) showStorageWarning();
    if (state.favorites.delete(id)) persistFavorites();
    state.history = state.history.filter((x) => x !== id);
    store.set(KEYS.history, state.history);
    if (state.current && state.current.id === id) {
      state.wantPlay = false;
      releaseAudio();
      state.current = null;
      paintPlayerStation();
      setStatus('idle');
    }
    rebuildCatalog();
    syncFilterControls();
    if (state.view === 'home') renderHome(); else renderList();
    showToast(tr('custom.removed'));
  }

  function showEmpty(iconName, text, withAction) {
    el.emptyIcon.className = 'bi ' + iconName + ' fs-1 d-block mb-2';
    el.emptyText.textContent = text;
    el.emptyAction.classList.toggle('d-none', !withAction);
    el.empty.classList.remove('d-none');
  }

  function viewTitleText() {
    if (state.view === 'favorites') return tr('view.favorites');
    const f = state.filters;
    const parts = [];
    if (f.theme) parts.push(tr('theme.' + f.theme + '.title'));
    if (f.family) parts.push(tr('family.' + f.family));
    if (f.genre) parts.push(shown(f.genre));
    if (f.country) parts.push(shown(f.country));
    if (f.language) parts.push(langLabel(f.language));
    if (parts.length) return parts.join(' · ');
    return f.query ? tr('view.search') : tr('view.all');
  }

  function renderChips() {
    const f = state.filters;
    const chips = [];
    if (f.theme) chips.push({ key: 'theme', label: tr('theme.' + f.theme + '.title') });
    el.chips.replaceChildren(...chips.map((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.clear = c.key;
      b.setAttribute('aria-label', tr('chip.remove', { name: c.label }));
      const t = document.createElement('span');
      t.textContent = c.label;
      b.append(t, icon('bi-x-lg'));
      return b;
    }));
    el.chips.classList.toggle('d-none', chips.length === 0 || state.view !== 'radios');
  }

  function renderList() {
    const inFav = state.view === 'favorites';
    const q = normalize(state.filters.query);
    const items = inFav ? favoriteStations(q) : filteredStations();
    const frag = document.createDocumentFragment();
    items.forEach((st) => {
      const col = createCard(st);
      paintFavoriteButton(col.querySelector('.btn-fav'), st);
      frag.appendChild(col);
    });
    el.list.replaceChildren(frag);

    const total = state.stations.length;
    if (inFav) {
      el.count.textContent = trn('count.favorites', items.length);
    } else {
      el.count.textContent = trn('count.stations', items.length) +
        (items.length !== total ? ' ' + tr('count.of', { total: total }) : '');
    }

    if (total === 0) {
      el.count.textContent = '';
      showEmpty('bi-exclamation-triangle', tr('empty.catalog'), false);
    } else if (items.length === 0 && inFav) {
      if (q && favoriteStations('').length > 0) showEmpty('bi-search', tr('empty.noFavoritesMatch'), false);
      else showEmpty('bi-heart', tr('empty.noFavorites'), true);
    } else if (items.length === 0) {
      showEmpty('bi-search', tr('empty.noMatch'), false);
    } else {
      el.empty.classList.add('d-none');
    }

    const orphans = inFav && total > 0 ? orphanIds().length : 0;
    el.orphans.classList.toggle('d-none', orphans === 0);
    if (orphans > 0) el.orphansText.textContent = trn('orphans.text', orphans);
    el.viewTitle.textContent = viewTitleText();
    renderChips();
    paintNav();
    paintCardStates();
  }

  /* ---------- Accueil ---------- */
  function makeCategoryCard(opts) {
    const col = document.createElement('div');
    col.className = 'col';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card cat-card';
    btn.dataset.patch = JSON.stringify(opts.patch);
    const body = document.createElement('span');
    body.className = 'card-body d-flex align-items-center gap-2 p-2';
    const ico = document.createElement('span');
    ico.className = 'cat-icon' + (opts.flag ? ' cat-flag' : '');
    ico.setAttribute('aria-hidden', 'true');
    if (opts.flag) ico.textContent = opts.flag; else ico.appendChild(icon(opts.icon));
    const txt = document.createElement('span');
    txt.className = 'min-w-0';
    const title = document.createElement('span');
    title.className = 'cat-title d-block';
    title.textContent = opts.title;
    txt.appendChild(title);
    (opts.lines || []).forEach((line) => {
      const sub = document.createElement('span');
      sub.className = 'cat-sub d-block';
      sub.textContent = line;
      txt.appendChild(sub);
    });
    body.append(ico, txt);
    btn.appendChild(body);
    col.appendChild(btn);
    return col;
  }

  function fillSection(listEl, cards) {
    listEl.replaceChildren(...cards);
    listEl.closest('section').classList.toggle('d-none', cards.length === 0);
  }

  function stationCards(list, target) {
    const frag = list.map((st) => {
      const col = createCard(st);
      paintFavoriteButton(col.querySelector('.btn-fav'), st);
      return col;
    });
    fillSection(target, frag);
  }

  function renderHero() {
    const total = state.stations.length;
    el.homeHero.classList.toggle('d-none', total === 0);
    if (total === 0) return;
    const countries = new Set(state.stations.map((s) => s.country).filter((c) => c !== UNSPECIFIED)).size;
    el.heroSummary.textContent = tr('home.hero.summary', { stations: I18N.number(total), countries: I18N.number(countries) });
    if (state.current && !state.wantPlay) {
      el.btnResumeLabel.textContent = tr('home.hero.resume', { name: state.current.name });
      el.btnResumeHome.classList.remove('d-none');
    } else {
      el.btnResumeHome.classList.add('d-none');
    }
  }

  function renderRecents() {
    const list = state.history.map((id) => state.byId.get(id)).filter(Boolean).slice(0, 3);
    stationCards(list, el.recents);
    paintCardStates();
  }

  function dailyPicks(count) {
    const d = new Date();
    const seed = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    return state.stations.map((s) => ({ s, h: hash(seed + '|' + s.id) })).sort((a, b) => a.h - b.h || a.s.id.localeCompare(b.s.id))
      .slice(0, count).map((x) => x.s);
  }

  function renderPicks() {
    stationCards(dailyPicks(4), el.picks);
    paintCardStates();
  }

  function renderCategories() {
    const st = state.stations;
    const count = (n) => trn('count.stations', n);
    fillSection(el.themes, THEMES.map((t) => [t, st.filter((s) => s.themeIds.includes(t.id)).length]).filter(([, n]) => n > 0)
      .map(([t, n]) => makeCategoryCard({ icon: t.icon, title: tr('theme.' + t.id + '.title'), lines: [tr('theme.' + t.id + '.desc'), count(n)], patch: { theme: t.id } })));
    const genreCards = FAMILIES.map((f) => [f, st.filter((s) => s.families.includes(f.id)).length]).filter(([, n]) => n > 0)
      .map(([f, n]) => makeCategoryCard({ icon: f.icon, title: tr('family.' + f.id), lines: [count(n)], patch: { family: f.id } }));
    const loose = new Map();
    st.filter((s) => s.looseGenre).forEach((s) => loose.set(s.looseGenre, (loose.get(s.looseGenre) || 0) + 1));
    [...loose.entries()].sort((a, b) => shown(a[0]).localeCompare(shown(b[0]), loc())).forEach(([g, n]) =>
      genreCards.push(makeCategoryCard({ icon: 'bi-vinyl', title: shown(g), lines: [count(n)], patch: { genre: g } })));
    fillSection(el.genres, genreCards);
    const byCountry = new Map();
    st.forEach((s) => byCountry.set(s.country, (byCountry.get(s.country) || 0) + 1));
    fillSection(el.countries, [...byCountry.entries()].sort((a, b) => b[1] - a[1] || shown(a[0]).localeCompare(shown(b[0]), loc()))
      .map(([c, n]) => makeCategoryCard({ icon: 'bi-geo-alt-fill', flag: countryFlag(c), title: shown(c), lines: [count(n)], patch: { country: c } })));
    const byLang = new Map();
    st.forEach((s) => s.langs.forEach((k) => byLang.set(k, (byLang.get(k) || 0) + 1)));
    fillSection(el.languages, [...byLang.entries()].sort((a, b) => b[1] - a[1] || langLabel(a[0]).localeCompare(langLabel(b[0]), loc()))
      .map(([k, n]) => makeCategoryCard({ icon: k === INSTRUMENTAL_KEY ? 'bi-music-note-beamed' : 'bi-translate',
        title: langLabel(k), lines: [count(n)], patch: { language: k } })));
  }

  function renderHome() {
    const empty = state.stations.length === 0;
    el.homeEmpty.classList.toggle('d-none', !empty);
    if (empty) {
      el.homeEmpty.textContent = tr('empty.catalog');
      el.homeHero.classList.add('d-none');
      [el.recents, el.picks, el.themes, el.genres, el.countries, el.languages].forEach((l) => fillSection(l, []));
      return;
    }
    renderHero();
    renderRecents();
    renderPicks();
    renderCategories();
    paintCardStates();
  }

  function recordListen(id) {
    state.history = [id, ...state.history.filter((x) => x !== id)].slice(0, HISTORY_MAX);
    if (!store.set(KEYS.history, state.history)) showStorageWarning();
    if (state.view === 'home') renderRecents();
  }

  function openFiltered(patch) {
    resetFilters();
    Object.assign(state.filters, patch);
    syncFilterControls();
    if (state.view === 'radios') applyView('radios', true); else goTo('radios');
  }

  /* ---------- Navigation ---------- */
  const VIEW_HASH = { home: '#accueil', radios: '#radios', favorites: '#favoris' };

  function viewFromHash() {
    if (location.hash === VIEW_HASH.favorites) return 'favorites';
    return location.hash === VIEW_HASH.radios ? 'radios' : 'home';
  }

  function setCurrentPage(link, on) {
    if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }

  function paintNav() {
    const inFav = state.view === 'favorites';
    setCurrentPage(el.navHome, state.view === 'home');
    setCurrentPage(el.navRadios, state.view === 'radios');
    setCurrentPage(el.navFavorites, inFav);
    el.navFavorites.querySelector('i').className = 'bi ' + (inFav ? 'bi-heart-fill' : 'bi-heart');
    el.headerFav.querySelector('i').className = 'bi ' + (inFav ? 'bi-heart-fill' : 'bi-heart');
    const n = favoriteStations('').length;
    el.favBadge.textContent = I18N.number(n);
    el.favBadge.classList.toggle('d-none', n === 0);
    el.navFavorites.setAttribute('aria-label', n ? tr('nav.favoritesCount', { n: n }) : tr('nav.favorites'));
  }

  function applyView(view, scrollTop) {
    state.view = view;
    const home = view === 'home';
    el.homeView.classList.toggle('d-none', !home);
    el.catalogView.classList.toggle('d-none', home);
    el.filtersSection.classList.toggle('d-none', view !== 'radios');
    if (home) { renderHome(); paintNav(); } else renderList();
    if (scrollTop) window.scrollTo(0, 0);
  }

  function goTo(view) {
    if (state.view === view) return;
    try { history.pushState(null, '', VIEW_HASH[view]); } catch (e) { /* ignoré */ }
    applyView(view, true);
  }

  function syncFilterControls() {
    const f = state.filters;
    el.search.value = f.query;
    el.clearSearch.classList.toggle('d-none', !f.query);
    el.country.value = f.country;
    el.language.value = f.language;
    el.genre.value = f.family ? 'f:' + f.family : (f.genre ? 'g:' + f.genre : ALL);
  }

  function resetFilters() {
    state.filters = { query: '', country: ALL, language: ALL, genre: ALL, theme: '', family: '' };
    syncFilterControls();
  }

  function revealCurrent() {
    const st = state.current;
    if (!st) return;
    const view = state.view === 'favorites' && state.favorites.has(st.id) ? 'favorites' : 'radios';
    if (view === 'radios' && !filteredStations().some((s) => s.id === st.id)) resetFilters();
    if (state.view !== view) goTo(view); else renderList();
    const card = [...el.list.querySelectorAll('.station-card')].find((c) => c.dataset.id === st.id);
    if (!card) return;
    card.scrollIntoView({ block: 'nearest' });
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 1200);
  }

  function openNowPlayingSheet() {
    if (!state.current || !window.bootstrap || !el.sheet) return;
    window.bootstrap.Offcanvas.getOrCreateInstance(el.sheet).show();
  }

  function closeNowPlayingSheet() {
    if (!window.bootstrap || !el.sheet) return;
    const inst = window.bootstrap.Offcanvas.getInstance(el.sheet);
    if (inst) inst.hide();
  }

  function paintCardStates() {
    document.querySelectorAll('.station-card').forEach((card) => {
      const isCurrent = !!state.current && card.dataset.id === state.current.id;
      card.classList.toggle('is-current', isCurrent);
      card.querySelector('.eq').classList.toggle('is-playing', isCurrent && state.status === 'playing');
    });
  }

  /* ---------- Media Session ---------- */
  const hasMediaSession = 'mediaSession' in navigator && typeof window.MediaMetadata === 'function';
  let mediaSessionStation = null;

  function updateMediaSession() {
    if (!hasMediaSession) return;
    try {
      const st = state.current;
      if (st && mediaSessionStation !== st.id) {
        const artwork = st.logoUrl
          ? [{ src: st.logoUrl }]
          : [{ src: new URL('assets/icons/icon-512.png', location.href).href, sizes: '512x512', type: 'image/png' }];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: st.name,
          artist: st.country !== UNSPECIFIED ? st.country + ' · ' + tr('app.name') : tr('app.name'),
          album: st.genre !== UNSPECIFIED ? st.genre : undefined,
          artwork
        });
        mediaSessionStation = st.id;
      } else if (!st) {
        navigator.mediaSession.metadata = null;
        mediaSessionStation = null;
      }
      navigator.mediaSession.playbackState = state.wantPlay ? 'playing' : (st ? 'paused' : 'none');
    } catch (e) { /* Media Session indisponible */ }
  }

  function initMediaSession() {
    if (!hasMediaSession) return;
    const handle = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* non pris en charge */ } };
    handle('play', () => { if (state.current && !state.wantPlay) startPlayback(); });
    handle('pause', () => { if (state.current) stopPlayback(); });
    handle('stop', () => { if (state.current) stopPlayback(); });
    handle('previoustrack', () => { stepStation(-1); });
    handle('nexttrack', () => { stepStation(1); });
  }

  /* ---------- Métadonnées temps réel (durée + qualité de flux) ---------- */
  function updateLiveMeta() {
    const st = state.current;
    const streaming = state.status === 'playing';
    const quality = state.streamInfoKey ? tr(state.streamInfoKey, state.streamInfoParams) : (st ? tr(st.hls ? 'player.streamHls' : 'player.streamDirect') : '');
    const elapsed = streaming && state.playStartedAt ? formatDuration(Date.now() - state.playStartedAt) : '';

    if (el.playerMeta) {
      const parts = [];
      if (elapsed) parts.push(tr('player.live') + ' ' + elapsed);
      if (st && quality) parts.push(quality);
      el.playerMeta.textContent = parts.join(' · ');
      el.playerMeta.classList.toggle('d-none', !st || parts.length === 0);
    }
    if (el.sheetTimer) {
      el.sheetTimer.textContent = elapsed ? '· ' + elapsed : '';
      el.sheetTimer.classList.toggle('d-none', !elapsed);
    }
    if (el.sheetQuality) {
      el.sheetQuality.textContent = st && quality ? '· ' + quality : '';
      el.sheetQuality.classList.toggle('d-none', !st || !quality);
    }
  }

  function startLiveTick() {
    if (liveTickTimer) return;
    liveTickTimer = setInterval(updateLiveMeta, 1000);
  }

  function stopLiveTick() {
    if (liveTickTimer) { clearInterval(liveTickTimer); liveTickTimer = null; }
  }

  /* ---------- Statut et lecteur ---------- */
  function setStatus(kind, key, params) {
    state.status = kind;
    state.statusKey = key || ('status.' + kind);
    state.statusParams = params || null;
    const streaming = kind === 'playing';
    const buffering = kind === 'connecting' || kind === 'buffering';
    const text = tr(state.statusKey, state.statusParams) + (params && params.insecure ? ' ' + tr('error.insecure') : '');

    el.dot.className = 'status-dot status-' + kind;
    el.statusText.textContent = text;
    el.eq.classList.toggle('is-playing', streaming);
    el.player.dataset.status = kind;
    el.player.classList.toggle('is-streaming', streaming);
    el.navCurrent.classList.toggle('is-streaming', streaming);

    if (el.sheet) {
      el.sheet.classList.toggle('is-streaming', streaming);
      el.sheetDot.className = 'status-dot status-' + kind;
      el.sheetStatus.textContent = text;
      el.sheetEq.classList.toggle('is-playing', streaming);
      el.sheetEq.classList.toggle('is-buffering', buffering && !streaming);
    }

    const active = state.wantPlay;
    const playIcon = active ? 'bi-pause-fill' : 'bi-play-fill';
    const playLabel = active ? tr('player.pause') : tr('player.play');
    [el.play, el.sheetPlay].forEach((btn) => {
      if (!btn) return;
      btn.replaceChildren(icon(playIcon));
      btn.setAttribute('aria-label', playLabel);
      btn.disabled = !state.current;
    });

    const hasStation = !!state.current;
    const canZap = state.stations.length > 1;
    el.navCurrent.disabled = !hasStation;
    el.playerOpen.disabled = !hasStation;
    el.expandPlayer.disabled = !hasStation;
    el.prev.disabled = !canZap;
    el.next.disabled = !canZap;
    el.sheetPrev.disabled = !canZap;
    el.sheetNext.disabled = !canZap;
    el.retry.classList.toggle('d-none', !hasStation || kind === 'idle' || kind === 'ready');

    if (streaming) {
      if (!state.playStartedAt) state.playStartedAt = Date.now();
      startLiveTick();
    } else if (!state.wantPlay) {
      state.playStartedAt = 0;
      stopLiveTick();
    }

    updateLiveMeta();
    updateMediaSession();
    paintCardStates();
    if (state.view === 'home') renderHero();
  }

  function paintPlayerStation() {
    const st = state.current;
    el.name.textContent = st ? st.name : tr('player.none');
    const logo = makeLogo(st, true);
    el.logo.replaceChildren(...logo.childNodes);

    if (el.sheet) {
      el.sheetName.textContent = st ? st.name : tr('player.none');
      const sLogo = makeLogo(st, true);
      el.sheetLogo.replaceChildren(...sLogo.childNodes);
      if (st) {
        const flag = st.country !== UNSPECIFIED ? countryFlag(st.country) : '';
        const countryShown = (flag ? flag + ' ' : '') + shown(st.country);
        el.sheetMeta.textContent = [countryShown, shown(st.language), shown(st.genre)].join(' · ');
        if (st.website) {
          el.sheetWebsite.href = st.website;
          el.sheetWebsite.classList.remove('d-none');
        } else {
          el.sheetWebsite.classList.add('d-none');
        }
      } else {
        el.sheetMeta.textContent = '';
        el.sheetWebsite.classList.add('d-none');
      }
    }
    paintPlayerFav();
  }

  /* ---------- Minuterie de sommeil ---------- */
  function clearSleepTimer(silent) {
    state.sleepEndsAt = 0;
    state.sleepMinutes = 0;
    if (sleepTickTimer) { clearInterval(sleepTickTimer); sleepTickTimer = null; }
    updateSleepUi();
    if (!silent) showToast(tr('nowPlaying.sleepCancelled'));
  }

  function updateSleepUi() {
    const active = state.sleepEndsAt > Date.now();
    const remaining = active ? formatDuration(state.sleepEndsAt - Date.now()) : '';
    if (el.btnSleep) el.btnSleep.classList.toggle('is-active', active);
    if (el.sleepBadge) {
      el.sleepBadge.textContent = remaining;
      el.sleepBadge.classList.toggle('d-none', !active);
    }
    if (el.sheetSleepRemaining) {
      el.sheetSleepRemaining.textContent = active ? tr('player.sleepActive', { time: remaining }) : '';
    }
    if (el.sleepOptions) {
      el.sleepOptions.querySelectorAll('button[data-sleep]').forEach((b) => {
        const val = Number(b.dataset.sleep);
        b.classList.toggle('active', active ? val === state.sleepMinutes : val === 0);
      });
    }
  }

  function setSleepTimer(minutes) {
    if (!minutes || minutes <= 0) {
      clearSleepTimer(false);
      return;
    }
    state.sleepMinutes = minutes;
    state.sleepEndsAt = Date.now() + minutes * 60000;
    if (!sleepTickTimer) {
      sleepTickTimer = setInterval(() => {
        const left = state.sleepEndsAt - Date.now();
        if (left <= 0) {
          clearSleepTimer(true);
          if (state.wantPlay) {
            fadeOutAndStop(() => showToast(tr('nowPlaying.sleepEnded')));
          } else {
            showToast(tr('nowPlaying.sleepEnded'));
          }
          return;
        }
        updateSleepUi();
      }, 1000);
    }
    updateSleepUi();
    showToast(tr('nowPlaying.sleepSet', { m: minutes }));
  }

  /* ---------- Lecture audio résiliente ---------- */
  function clearConnectTimer() {
    if (connectTimer) { clearTimeout(connectTimer); connectTimer = null; }
  }

  function clearReconnectTimer() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  }

  function stopStallWatchdog() {
    if (stallTimer) { clearInterval(stallTimer); stallTimer = null; }
    lastAudioTime = -1;
    stallElapsedMs = 0;
  }

  function startStallWatchdog() {
    stopStallWatchdog();
    lastAudioTime = audio.currentTime;
    stallTimer = setInterval(() => {
      if (!state.wantPlay || state.status !== 'playing') {
        stallElapsedMs = 0;
        return;
      }
      const nowTime = audio.currentTime;
      if (Math.abs(nowTime - lastAudioTime) < 0.05) {
        stallElapsedMs += 3000;
        if (stallElapsedMs >= STALL_THRESHOLD_MS) {
          stallElapsedMs = 0;
          if (hls) {
            setStatus('buffering');
            try { hls.startLoad(); } catch (e) { startPlayback(true); }
          } else {
            startPlayback(true);
          }
        }
      } else {
        lastAudioTime = nowTime;
        stallElapsedMs = 0;
      }
    }, 3000);
  }

  function cancelFade() {
    if (fadeRaf) { cancelAnimationFrame(fadeRaf); fadeRaf = null; }
  }

  function fadeInVolume() {
    cancelFade();
    const target = state.muted ? 0 : state.volume / 100;
    if (target <= 0) { audio.volume = 0; return; }
    const start = performance.now();
    const duration = 240;
    audio.volume = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      audio.volume = target * p;
      if (p < 1 && state.wantPlay) fadeRaf = requestAnimationFrame(tick);
      else fadeRaf = null;
    };
    fadeRaf = requestAnimationFrame(tick);
  }

  function fadeOutAndStop(done) {
    cancelFade();
    const startVol = audio.volume;
    const start = performance.now();
    const duration = 2200;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      audio.volume = startVol * (1 - p);
      if (p < 1 && state.wantPlay) {
        fadeRaf = requestAnimationFrame(tick);
      } else {
        fadeRaf = null;
        stopPlayback();
        audio.volume = state.volume / 100;
        if (done) done();
      }
    };
    fadeRaf = requestAnimationFrame(tick);
  }

  function armConnectTimer() {
    clearConnectTimer();
    connectTimer = setTimeout(() => {
      if (state.wantPlay && (state.status === 'connecting' || state.status === 'buffering')) {
        if (!scheduleReconnect('error.timeout')) {
          state.wantPlay = false;
          releaseAudio();
          setStatus('error', 'error.timeout');
        }
      }
    }, CONNECT_TIMEOUT_MS);
  }

  function releaseAudio() {
    cancelFade();
    clearConnectTimer();
    clearReconnectTimer();
    stopStallWatchdog();
    state.interrupted = false;
    playToken++;
    if (hls) { try { hls.destroy(); } catch (e) { /* already detached */ } hls = null; }
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function errorKey(code) {
    return code === 2 ? 'error.network' : code === 3 ? 'error.decode' : code === 4 ? 'error.unsupported' : 'error.generic';
  }

  function insecureParams() {
    return state.current && state.current.insecure ? { insecure: true } : null;
  }

  function scheduleReconnect(fallbackErrorKey) {
    if (!state.wantPlay || !state.current) return false;
    if (navigator.onLine === false) {
      state.autoResumeOnOnline = true;
      releaseAudio();
      state.wantPlay = false;
      setStatus('error', 'error.offline');
      return true;
    }
    if (state.reconnectAttempts >= RECONNECT_DELAYS_MS.length) {
      state.reconnectAttempts = 0;
      return false;
    }
    const delay = RECONNECT_DELAYS_MS[state.reconnectAttempts];
    state.reconnectAttempts++;
    const attempt = state.reconnectAttempts;
    const max = RECONNECT_DELAYS_MS.length;
    clearConnectTimer();
    clearReconnectTimer();
    stopStallWatchdog();
    if (hls) { try { hls.destroy(); } catch (e) { /* detached */ } hls = null; }
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    setStatus('connecting', 'status.reconnecting', { attempt, max });
    reconnectTimer = setTimeout(() => {
      if (state.wantPlay && state.current) startPlayback(true);
    }, delay);
    if (fallbackErrorKey) state.lastErrorKey = fallbackErrorKey;
    return true;
  }

  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!hlsLoader) {
      hlsLoader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = HLS_SCRIPT;
        script.async = true;
        script.onload = () => (window.Hls ? resolve(window.Hls) : reject(new Error('hls.js missing')));
        script.onerror = () => { hlsLoader = null; script.remove(); reject(new Error('hls.js not loaded')); };
        document.head.appendChild(script);
      });
    }
    return hlsLoader;
  }

  function playbackFailed(token, key) {
    if (token !== playToken) return;
    if (scheduleReconnect(key)) return;
    state.wantPlay = false;
    releaseAudio();
    setStatus('error', key, insecureParams());
  }

  async function resolvePlaylistUrl(url) {
    if (!isPlaylistFile(url)) return url;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) return url;
      const body = await res.text();
      const match = body.match(/https?:\/\/[^\s"'<>]+/i);
      return match ? match[0] : url;
    } catch (e) {
      return url;
    }
  }

  function startPlayback(isRetry) {
    const st = state.current;
    if (!st) return;
    if (!isRetry) state.reconnectAttempts = 0;
    state.autoResumeOnOnline = false;
    state.streamInfoKey = st.hls ? 'player.streamHls' : 'player.streamDirect';
    state.streamInfoParams = null;

    releaseAudio();
    const token = ++playToken;
    state.wantPlay = true;
    if (!isRetry) setStatus('connecting');
    armConnectTimer();

    const beginStream = (targetUrl) => {
      if (token !== playToken || !state.wantPlay) return;
      const useHls = isHls(targetUrl) || st.hls;
      if (useHls && !audio.canPlayType('application/vnd.apple.mpegurl')) {
        loadHls().then((Hls) => {
          if (token !== playToken || !state.wantPlay) return;
          if (!Hls.isSupported()) { playbackFailed(token, errorKey(4)); return; }
          let hlsNetRetries = 0;
          let hlsMediaRecovered = false;
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            fragLoadingMaxRetry: 4,
            manifestLoadingMaxRetry: 3
          });
          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            if (token !== playToken) return;
            const lv = data && Array.isArray(data.levels) && data.levels[0];
            if (lv && lv.bitrate) {
              state.streamInfoKey = 'player.streamHlsBitrate';
              state.streamInfoParams = { kbps: Math.round(lv.bitrate / 1000) };
              updateLiveMeta();
            }
          });
          hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            if (token !== playToken || !hls || !hls.levels) return;
            const lv = hls.levels[data.level];
            if (lv && lv.bitrate) {
              state.streamInfoKey = 'player.streamHlsBitrate';
              state.streamInfoParams = { kbps: Math.round(lv.bitrate / 1000) };
              updateLiveMeta();
            }
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (token !== playToken || !data || !data.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && hlsNetRetries < 2) {
              hlsNetRetries++;
              setStatus('buffering');
              hls.startLoad();
              return;
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !hlsMediaRecovered) {
              hlsMediaRecovered = true;
              hls.recoverMediaError();
              return;
            }
            playbackFailed(token, data.type === Hls.ErrorTypes.NETWORK_ERROR ? 'error.network' : 'error.generic');
          });
          hls.attachMedia(audio);
          hls.loadSource(targetUrl);
          playPromise(token);
        }, () => playbackFailed(token, 'error.network'));
        return;
      }
      audio.src = targetUrl;
      playPromise(token);
    };

    if (isPlaylistFile(st.streamUrl)) {
      resolvePlaylistUrl(st.streamUrl).then(beginStream);
    } else {
      beginStream(st.streamUrl);
    }
  }

  function playPromise(token) {
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        if (token !== playToken || (err && err.name === 'AbortError')) return;
        state.wantPlay = false;
        clearConnectTimer();
        if (err && err.name === 'NotAllowedError') {
          setStatus('error', 'error.blocked');
        } else if (err && err.name === 'NotSupportedError') {
          setStatus('error', errorKey(4), insecureParams());
        } else {
          playbackFailed(token, errorKey(0));
        }
      });
    }
  }

  function stopPlayback() {
    state.wantPlay = false;
    state.autoResumeOnOnline = false;
    state.reconnectAttempts = 0;
    releaseAudio();
    setStatus(state.current ? 'ready' : 'idle');
  }

  function togglePlay() {
    if (!state.current) return;
    if (state.wantPlay) stopPlayback(); else startPlayback();
  }

  function selectStation(id, autoplay) {
    const st = state.byId.get(id);
    if (!st) return;
    if (state.current && state.current.id === st.id) {
      if (autoplay) togglePlay();
      return;
    }
    state.wantPlay = false;
    state.reconnectAttempts = 0;
    state.playStartedAt = 0;
    state.streamInfoKey = '';
    state.streamInfoParams = null;
    releaseAudio();
    state.current = st;
    store.set(KEYS.last, st.id);
    paintPlayerStation();
    setStatus('ready');
    if (autoplay) startPlayback();
  }

  function stepStation(delta) {
    const queue = getNavigationQueue();
    if (!queue.length) return;
    if (!state.current) {
      selectStation(queue[0].id, true);
      return;
    }
    const idx = queue.findIndex((s) => s.id === state.current.id);
    const nextIdx = idx === -1 ? 0 : (idx + delta + queue.length) % queue.length;
    selectStation(queue[nextIdx].id, true);
  }

  function playRandomStation() {
    const pool = state.stations.length > 1 && state.current
      ? state.stations.filter((s) => s.id !== state.current.id)
      : state.stations;
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    selectStation(pick.id, true);
  }

  /* Événements de l'élément Audio */
  audio.addEventListener('playing', () => {
    if (state.interrupted) {
      const away = Date.now() - state.interruptedAt;
      state.interrupted = false;
      if (away >= LIVE_REFRESH_MS) { startPlayback(); return; }
      state.wantPlay = true;
    }
    if (!state.wantPlay) return;
    clearConnectTimer();
    clearReconnectTimer();
    state.reconnectAttempts = 0;
    if (!state.playStartedAt) state.playStartedAt = Date.now();
    fadeInVolume();
    startStallWatchdog();
    if (state.current && state.history[0] !== state.current.id) recordListen(state.current.id);
    setStatus('playing');
  });

  audio.addEventListener('waiting', () => {
    if (!state.wantPlay || !audio.getAttribute('src')) return;
    setStatus('buffering');
    armConnectTimer();
  });

  audio.addEventListener('stalled', () => {
    if (!state.wantPlay || !audio.getAttribute('src')) return;
    setStatus('buffering');
    armConnectTimer();
  });

  audio.addEventListener('error', () => {
    if (!audio.getAttribute('src')) return;
    const key = errorKey(audio.error && audio.error.code);
    if (state.wantPlay && scheduleReconnect(key)) return;
    state.wantPlay = false;
    clearConnectTimer();
    setStatus('error', key, insecureParams());
  });

  audio.addEventListener('ended', () => {
    if (!state.wantPlay) return;
    if (scheduleReconnect('error.ended')) return;
    state.wantPlay = false;
    setStatus('error', 'error.ended');
  });

  audio.addEventListener('pause', () => {
    if (!audio.paused || !state.wantPlay || !audio.getAttribute('src')) return;
    clearConnectTimer();
    stopStallWatchdog();
    state.wantPlay = false;
    state.interrupted = true;
    state.interruptedAt = Date.now();
    setStatus('interrupted');
  });

  window.addEventListener('offline', () => {
    if (state.wantPlay) {
      state.autoResumeOnOnline = true;
      releaseAudio();
      state.wantPlay = false;
      setStatus('error', 'error.offline');
    }
  });

  window.addEventListener('online', () => {
    if (state.autoResumeOnOnline && state.current) {
      state.autoResumeOnOnline = false;
      startPlayback();
    } else if (state.current && state.status === 'error') {
      setStatus('error', 'error.online');
    }
  });

  /* ---------- Thème clair / sombre / automatique ---------- */
  const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolveTheme(pref) {
    return pref === 'dark' || (pref === 'auto' && !!systemDark && systemDark.matches) ? 'dark' : 'light';
  }

  function applyTheme() {
    const resolved = resolveTheme(state.theme);
    document.documentElement.setAttribute('data-bs-theme', resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[resolved]);
    el.themeInputs.forEach((input) => { input.checked = input.value === state.theme; });
    el.themeHint.textContent = state.theme === 'auto'
      ? tr('settings.theme.hintAuto', { mode: tr(resolved === 'dark' ? 'settings.theme.modeDark' : 'settings.theme.modeLight') }) : '';
  }

  function setTheme(pref) {
    if (pref !== 'light' && pref !== 'dark' && pref !== 'auto') return;
    state.theme = pref;
    if (!store.set(KEYS.theme, pref)) showStorageWarning();
    applyTheme();
  }

  /* ---------- Langue de l'interface ---------- */
  let languageControlsBuilt = false;

  function nativeName(code) {
    const found = I18N.languages().find((l) => l.code === code);
    return found ? found.nativeName : code;
  }

  function changeLanguage(choice) {
    if (!I18N.setLanguage(choice).saved) showStorageWarning();
  }

  function updateLanguageControls() {
    const list = I18N.languages();
    el.langFieldset.classList.toggle('d-none', list.length < 2);
    if (list.length < 2) return;
    if (!languageControlsBuilt) {
      languageControlsBuilt = true;
      [{ value: I18N.AUTO }].concat(list.map((l) => ({ value: l.code, name: l.nativeName }))).forEach((o) => {
        const input = document.createElement('input');
        input.type = 'radio';
        input.className = 'btn-check';
        input.name = 'ui-language';
        input.id = 'ui-language-' + o.value;
        input.value = o.value;
        input.autocomplete = 'off';
        const label = document.createElement('label');
        label.className = 'btn btn-outline-secondary btn-touch text-start';
        label.htmlFor = input.id;
        if (o.name) { label.textContent = o.name; label.setAttribute('lang', o.value); }
        else label.setAttribute('data-i18n', 'settings.language.auto');
        input.addEventListener('change', () => { if (input.checked) changeLanguage(o.value); });
        el.langOptions.append(input, label);
      });
      I18N.applyTo(el.langOptions);
    }
    el.langOptions.querySelectorAll('input').forEach((i) => { i.checked = i.value === I18N.getPreference(); });
    el.langHint.textContent = I18N.getPreference() === I18N.AUTO
      ? tr('settings.language.hintAuto', { lang: nativeName(I18N.getLanguage()) }) : '';
  }

  function refreshLanguage() {
    I18N.applyTo(document);
    fillFilterSelects();
    syncFilterControls();
    applyTheme();
    applyVolume();
    paintPlayerStation();
    setStatus(state.status, state.statusKey, state.statusParams);
    applyView(state.view, false);
    updateLanguageControls();
    updateSleepUi();
  }

  /* ---------- Volume ---------- */
  function applyVolume() {
    cancelFade();
    audio.volume = state.volume / 100;
    audio.muted = state.muted;
    const silent = state.muted || state.volume === 0;
    const name = silent ? 'bi-volume-mute-fill' : state.volume < 50 ? 'bi-volume-down-fill' : 'bi-volume-up-fill';
    el.mute.replaceChildren(icon(name));
    el.mute.setAttribute('aria-pressed', String(state.muted));
    el.mute.setAttribute('aria-label', state.muted ? tr('player.unmute') : tr('player.mute'));
    el.volume.value = String(state.volume);
    el.volumeValue.textContent = state.muted ? '0' : String(state.volume);
  }

  /* ---------- Partage et stations personnalisées ---------- */
  function shareCurrentStation() {
    const st = state.current;
    if (!st) return;
    const shareUrl = new URL(location.href);
    shareUrl.hash = '';
    shareUrl.searchParams.set('station', st.id);
    const urlStr = shareUrl.toString();
    if (navigator.share) {
      navigator.share({
        title: st.name + ' — ' + tr('app.name'),
        text: tr('nowPlaying.shareText', { name: st.name }),
        url: urlStr
      }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlStr).then(() => showToast(tr('nowPlaying.copied')), () => {});
    }
  }

  function saveCustomStation() {
    const name = el.customName.value.trim();
    const url = el.customUrl.value.trim();
    const country = el.customCountry.value.trim();
    const genre = el.customGenre.value.trim();

    if (!name) {
      el.customError.textContent = tr('custom.invalidName');
      el.customError.classList.remove('d-none');
      el.customName.focus();
      return;
    }
    if (!isHttpUrl(url)) {
      el.customError.textContent = tr('custom.invalidUrl');
      el.customError.classList.remove('d-none');
      el.customUrl.focus();
      return;
    }
    el.customError.classList.add('d-none');

    const slug = normalize(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'stream';
    const id = 'custom-' + slug + '-' + Date.now().toString(36);
    const entry = {
      id,
      name,
      streamUrl: url,
      country: country || UNSPECIFIED,
      language: 'Mixed',
      genre: genre || 'Eclectic',
      custom: true
    };
    state.customStations.push(entry);
    if (!store.set(KEYS.custom, state.customStations)) showStorageWarning();

    rebuildCatalog();
    syncFilterControls();
    if (state.view === 'home') renderHome(); else renderList();

    el.customName.value = '';
    el.customUrl.value = '';
    el.customCountry.value = '';
    el.customGenre.value = '';
    if (window.bootstrap && el.customModal) {
      const m = window.bootstrap.Modal.getInstance(el.customModal);
      if (m) m.hide();
    }
    selectStation(id, true);
    showToast(tr('custom.added', { name }));
  }

  /* ---------- Événements d'interface ---------- */
  function onStationClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const card = btn.closest('.station-card');
    if (!card) return;
    const id = card.dataset.id;
    if (btn.dataset.action === 'play') selectStation(id, true);
    else if (btn.dataset.action === 'favorite') toggleFavorite(id);
    else if (btn.dataset.action === 'remove-custom') removeCustomStation(id);
  }
  [el.list, el.recents, el.picks].forEach((c) => c.addEventListener('click', onStationClick));

  [el.themes, el.genres, el.countries, el.languages].forEach((c) => c.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-card');
    if (!btn) return;
    try { openFiltered(JSON.parse(btn.dataset.patch)); } catch (err) { /* ignoré */ }
  }));
  el.chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-clear]');
    if (!b) return;
    state.filters[b.dataset.clear] = '';
    renderList();
  });
  el.clearHistory.addEventListener('click', () => {
    state.history = [];
    store.set(KEYS.history, []);
    renderRecents();
  });

  el.search.addEventListener('input', () => {
    state.filters.query = el.search.value;
    el.clearSearch.classList.toggle('d-none', !el.search.value);
    if (state.view !== 'home') renderList();
    else if (el.search.value.trim()) goTo('radios');
  });
  el.clearSearch.addEventListener('click', () => {
    state.filters.query = '';
    el.search.value = '';
    el.clearSearch.classList.add('d-none');
    if (state.view !== 'home') renderList();
    el.search.focus();
  });

  el.country.addEventListener('change', () => { state.filters.country = el.country.value; renderList(); });
  el.language.addEventListener('change', () => { state.filters.language = el.language.value; renderList(); });
  el.genre.addEventListener('change', () => {
    const v = el.genre.value;
    state.filters.family = v.startsWith('f:') ? v.slice(2) : '';
    state.filters.genre = v.startsWith('g:') ? v.slice(2) : ALL;
    renderList();
  });
  el.reset.addEventListener('click', () => { resetFilters(); renderList(); });
  el.forgetOrphans.addEventListener('click', () => {
    orphanIds().forEach((id) => state.favorites.delete(id));
    persistFavorites();
    renderList();
  });

  el.navCurrent.addEventListener('click', openNowPlayingSheet);
  el.playerOpen.addEventListener('click', openNowPlayingSheet);

  window.addEventListener('hashchange', () => {
    const view = viewFromHash();
    if (view !== state.view) applyView(view, true);
  });

  el.themeInputs.forEach((input) => input.addEventListener('change', () => { if (input.checked) setTheme(input.value); }));
  if (systemDark) {
    const onSystemChange = () => { if (state.theme === 'auto') applyTheme(); };
    if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);
  }

  window.addEventListener('languagechange', () => I18N.refresh());

  el.play.addEventListener('click', togglePlay);
  el.sheetPlay.addEventListener('click', togglePlay);
  el.prev.addEventListener('click', () => stepStation(-1));
  el.next.addEventListener('click', () => stepStation(1));
  el.sheetPrev.addEventListener('click', () => stepStation(-1));
  el.sheetNext.addEventListener('click', () => stepStation(1));
  el.btnRandomHome.addEventListener('click', playRandomStation);
  el.btnCatalogRandom.addEventListener('click', playRandomStation);
  el.sheetRandom.addEventListener('click', playRandomStation);
  el.btnResumeHome.addEventListener('click', () => { if (state.current) startPlayback(); });
  el.retry.addEventListener('click', () => startPlayback());

  [el.playerFav, el.sheetFav].forEach((btn) => {
    if (btn) btn.addEventListener('click', () => { if (state.current) toggleFavorite(state.current.id); });
  });

  el.sleepOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sleep]');
    if (!btn) return;
    setSleepTimer(Number(btn.dataset.sleep));
  });

  el.sheetShare.addEventListener('click', shareCurrentStation);
  el.sheetLocate.addEventListener('click', () => {
    closeNowPlayingSheet();
    revealCurrent();
  });

  if (el.btnSettingsCustom) {
    el.btnSettingsCustom.addEventListener('click', () => {
      if (window.bootstrap) {
        const s = window.bootstrap.Offcanvas.getInstance(el.settingsPanel);
        if (s) s.hide();
        window.bootstrap.Modal.getOrCreateInstance(el.customModal).show();
      }
    });
  }
  el.btnSaveCustom.addEventListener('click', saveCustomStation);
  [el.customName, el.customUrl, el.customCountry, el.customGenre].forEach((inp) => {
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveCustomStation(); });
  });

  el.mute.addEventListener('click', () => {
    state.muted = !state.muted;
    store.set(KEYS.muted, state.muted);
    applyVolume();
  });
  el.volume.addEventListener('input', () => {
    state.volume = Math.min(100, Math.max(0, parseInt(el.volume.value, 10) || 0));
    if (state.muted && state.volume > 0) { state.muted = false; store.set(KEYS.muted, false); }
    store.set(KEYS.volume, state.volume);
    applyVolume();
  });

  /* Raccourcis clavier (ordinateur) */
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement && document.activeElement.isContentEditable)) {
      return;
    }
    if (e.key === '/' ) {
      e.preventDefault();
      el.search.focus();
    } else if ((e.key === ' ' || e.key.toLowerCase() === 'k') && state.current) {
      e.preventDefault();
      togglePlay();
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      state.muted = !state.muted;
      store.set(KEYS.muted, state.muted);
      applyVolume();
    } else if (e.key.toLowerCase() === 'f' && state.current) {
      e.preventDefault();
      toggleFavorite(state.current.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepStation(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepStation(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.volume = Math.min(100, state.volume + 5);
      state.muted = false;
      store.set(KEYS.volume, state.volume);
      store.set(KEYS.muted, false);
      applyVolume();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.volume = Math.max(0, state.volume - 5);
      store.set(KEYS.volume, state.volume);
      applyVolume();
    }
  });

  /* ---------- Initialisation ---------- */
  function init() {
    I18N.init();
    I18N.applyTo(document);
    I18N.onChange(refreshLanguage);
    const savedTheme = store.get(KEYS.theme, 'auto');
    state.theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'auto';
    applyTheme();
    initMediaSession();

    const savedCustom = store.get(KEYS.custom, []);
    state.customStations = Array.isArray(savedCustom) ? savedCustom : [];
    rebuildCatalog();

    const favs = store.get(KEYS.favorites, []);
    state.favorites = new Set((Array.isArray(favs) ? favs : []).filter((id) => typeof id === 'string' && id));
    if (!store.available()) showStorageWarning();
    const hist = store.get(KEYS.history, []);
    state.history = (Array.isArray(hist) ? hist : []).filter((id) => typeof id === 'string').slice(0, HISTORY_MAX);
    const vol = Number(store.get(KEYS.volume, 80));
    state.volume = Number.isFinite(vol) ? Math.min(100, Math.max(0, Math.round(vol))) : 80;
    state.muted = store.get(KEYS.muted, false) === true;
    applyVolume();

    applyView(viewFromHash(), false);
    setStatus('idle');
    updateLanguageControls();
    updateSleepUi();

    const params = new URLSearchParams(location.search);
    const linkedId = params.get('station');
    const last = store.get(KEYS.last, null);
    if (linkedId && state.byId.has(linkedId)) {
      selectStation(linkedId, false);
    } else if (typeof last === 'string' && state.byId.has(last)) {
      selectStation(last, false);
    }

    const syncPlayerHeight = () =>
      document.documentElement.style.setProperty('--player-h', el.player.offsetHeight + 'px');
    syncPlayerHeight();
    if ('ResizeObserver' in window) new ResizeObserver(syncPlayerHeight).observe(el.player);

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => { /* PWA facultative */ });
      });
    }
  }

  init();
})();
