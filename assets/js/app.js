/*
 * Omnira — logique du lecteur (JavaScript natif, sans dépendance).
 * Le catalogue est lu depuis window.STATIONS (assets/js/stations.js).
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
    theme: 'radio.theme'
  };
  const CONNECT_TIMEOUT_MS = 15000;
  const ALL = ''; // valeur « tous » des filtres
  const UNSPECIFIED = '__unspecified__';   // valeur interne d'un champ de catalogue absent (affichée via i18n : data.unspecified)
  const HISTORY_MAX = 12;
  // Après une interruption plus longue que ça, le flux en direct est relancé pour rattraper le direct (au lieu de rejouer un tampon périmé).
  const LIVE_REFRESH_MS = 20000;
  const THEME_COLOR = { dark: '#0f1216', light: '#f4f6f9' };    // couleur de la barre du navigateur

  /* ---------- Thèmes d'écoute et familles de genres (page d'accueil) ----------
   * Rien n'est recopié depuis le catalogue : les stations de stations.js sont classées d'après leur genre et leur nom
   * (mots-clés ci-dessous, comparés sans accents ni majuscules). Une catégorie sans station n'est pas affichée.
   * Une station peut aussi imposer ses thèmes avec un champ facultatif dans stations.js : themes: ["focus", "work"]. */

const THEMES = [
  { id: 'focus', icon: 'bi-code-slash',
    match: 'ambient|concentration|lo-?fi|chillhop|chillsynth|synthwave|idm|glitch|programmation|informatique|hacking|drone' },
  { id: 'work', icon: 'bi-briefcase',
    match: 'musique classique|^classique \\||orchestr|jazz|instrumental|lo-?fi|chill|downtempo|ambient' },
  { id: 'sport', icon: 'bi-lightning-charge-fill',
    match: 'sport|fitness|workout|energique|dance|running' },
  { id: 'relax', icon: 'bi-cup-hot',
    match: 'relax|detente|chill|downtempo|lounge|tarab|andalou|musique classique|^classique \\||orchestr|jazz|ambient' },
  { id: 'sleep', icon: 'bi-moon-stars',
    match: 'sommeil|sleep|calme|ambient|drone|deep space' },
  { id: 'drive', icon: 'bi-car-front-fill',
    match: '\\bpop\\b|\\brock\\b|route|voyage|conduite|synthwave|outrun|retrowave|dance|eclectique|variete|electro' },
  { id: 'discover', icon: 'bi-compass',
    match: 'eclectique|decouverte|monde|world|tarab|andalou|oriental|vaporwave|idm|space disco' },
  { id: 'news', icon: 'bi-newspaper',
    match: 'information|actualit|news|journal|generaliste|culture|sciences|philosophie|idees|debat' }
];
  

const FAMILIES = [
  { id: 'ambient', icon: 'bi-cloud-haze2', match: 'ambient|drone' },
  { id: 'lofi', icon: 'bi-headphones', match: 'lo-?fi|chillhop|hip-?hop' },
  { id: 'electro', icon: 'bi-soundwave',
    match: 'electro|synthwave|idm|vaporwave|chillsynth|techno|house|edm|glitch|space disco|cyberpunk' },
  { id: 'classique', icon: 'bi-music-note-list', match: '^classique$|musique classique|orchestr|symphon|opera' },
  { id: 'jazz', icon: 'bi-music-note', match: 'jazz' },
  { id: 'rock', icon: 'bi-speaker', match: '\\brock\\b|metal' },
  { id: 'pop', icon: 'bi-stars', match: '\\bpop\\b' },
  { id: 'monde', icon: 'bi-globe-europe-africa',
    match: 'monde|world|tarab|arabo|andalou|oriental|flamenco|gnawa|reggae|latin|afro|celtique' },
  { id: 'instru', icon: 'bi-feather',
    match: 'instrumental|relax|detente|chill|downtempo|lounge|sommeil|calme' }
];
  
  THEMES.forEach((t) => { t.re = new RegExp(t.match); });
  FAMILIES.forEach((f) => { f.re = new RegExp(f.match); });
  const INSTRUMENTAL_KEY = 'instrumental';

  /* ---------- Stockage local (tolérant aux navigateurs qui le bloquent) ---------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    /** Renvoie true si l'écriture a réussi. */
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    /** Teste que le stockage local est utilisable (navigation privée, stockage bloqué...). */
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
  const normalize = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

  /* ---------- i18n : toute la chaîne affichée passe par I18N (assets/js/i18n.js + assets/js/locales/*.js) ---------- */
  const tr = (key, params) => I18N.t(key, params);
  const trn = (key, n, params) => I18N.tn(key, n, params);
  const loc = () => I18N.getLanguage();                         // langue de l'INTERFACE (tri des listes)
  const shown = (value) => (value === UNSPECIFIED ? tr('data.unspecified') : value);   // champ de catalogue absent
  const langLabel = (key) => (key === INSTRUMENTAL_KEY ? tr('lang.instrumental') : (state.langLabels.get(key) || key));

  function isHttpUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) { return false; }
  }

  /** Valide une entrée du catalogue ; renvoie null si elle est inutilisable. */
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
      logoUrl: isHttpUrl(raw.logoUrl) ? String(raw.logoUrl).trim() : '',
      website: isHttpUrl(raw.website) ? String(raw.website).trim() : '',
      themes: Array.isArray(raw.themes) ? raw.themes.map(String) : null,
      // flux HTTP sur page HTTPS : probablement bloqué par le navigateur (contenu mixte)
      insecure: location.protocol === 'https:' && /^http:/i.test(streamUrl)
    };
  }

  /* ---------- État ---------- */
  const state = {
    stations: [],
    byId: new Map(),
    favorites: new Set(),
    filters: { query: '', country: ALL, language: ALL, genre: ALL, theme: '', family: '' },
    view: 'home',        // 'home', 'radios' (catalogue) ou 'favorites'
    history: [],
    langLabels: new Map(),
    theme: 'auto',       // 'light', 'dark' ou 'auto' (suit le système)
    interrupted: false,  // lecture mise en pause par le système (appel, autre application...), pas par l'utilisateur
    interruptedAt: 0,
    current: null,
    wantPlay: false,     // l'utilisateur veut écouter (connexion, tampon ou lecture)
    status: 'idle',
    statusKey: 'status.idle',   // clé + paramètres du texte affiché (pour le retraduire au changement de langue)
    statusParams: null,
    volume: 80,
    muted: false
  };

  const audio = new Audio();
  audio.preload = 'none';
  let playToken = 0;
  let connectTimer = null;

  const el = {
    list: $('station-list'), empty: $('empty-state'), count: $('result-count'),
    search: $('search'), country: $('filter-country'), language: $('filter-language'), genre: $('filter-genre'),
    reset: $('btn-reset'), filtersSection: $('filters-section'), storageWarning: $('storage-warning'),
    orphans: $('orphans-notice'), orphansText: $('orphans-text'), forgetOrphans: $('btn-forget-orphans'),
    emptyIcon: $('empty-icon'), emptyText: $('empty-text'), emptyAction: $('empty-action'),
    navRadios: $('nav-radios'), navFavorites: $('nav-favorites'), navCurrent: $('nav-current'), favBadge: $('fav-badge'),
    navHome: $('nav-home'), headerFav: $('header-fav'),
    homeView: $('home-view'), catalogView: $('catalog-view'), viewTitle: $('view-title'), chips: $('active-chips'),
    homeEmpty: $('home-empty'), clearHistory: $('btn-clear-history'),
    recents: $('recents-list'), picks: $('picks-list'), themes: $('themes-list'), genres: $('genres-list'),
    countries: $('countries-list'), languages: $('languages-list'),
    themeInputs: [...document.querySelectorAll('input[name="theme"]')], themeHint: $('theme-hint'),
    langFieldset: $('language-settings'), langOptions: $('language-options'), langHint: $('language-hint'),
    player: $('player'), logo: $('player-logo'), name: $('player-name'),
    dot: $('status-dot'), statusText: $('status-text'), eq: $('player-eq'),
    play: $('btn-play'), retry: $('btn-retry'), mute: $('btn-mute'), volume: $('volume'), volumeValue: $('volume-value')
  };

  /** Langues parlées d'une station. « Instrumental » = sans paroles (jamais une langue) ; « Mixte », « International »… ignorés. */
  function parseLanguages(value) {
    const out = [];
    String(value).replace(/\([^)]*\)/g, ' ').split(/[\/,;&]|\bet\b/i).forEach((part) => {
      const label = part.trim();
      const key = normalize(label);
      if (!label) return;
      if (key.startsWith('instrumental') || key.includes('sans paroles')) {
        out.push({ key: INSTRUMENTAL_KEY, label: '' });          // libellé affiché : tr('lang.instrumental')
      } else if (/^(international|mixte|multilingue|divers|non precis|__unspecified)/.test(key)) {
        return;
      } else {
        out.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
      }
    });
    return out;
  }

  function annotate(st) {
    const full = normalize(st.genre) + ' | ' + normalize(st.name);   // texte « genre | nom » : un motif commençant par ^ cible le genre
    const genre = normalize(st.genre);
    st.themeIds = st.themes
      ? THEMES.filter((t) => st.themes.includes(t.id)).map((t) => t.id)
      : THEMES.filter((t) => t.re.test(full)).map((t) => t.id);
    st.families = FAMILIES.filter((f) => f.re.test(genre)).map((f) => f.id);
    const langs = parseLanguages(st.language);
    st.langs = [...new Set(langs.map((l) => l.key))];
    langs.forEach((l) => { if (!state.langLabels.has(l.key)) state.langLabels.set(l.key, l.label); });
  }


/* Drapeau : généré depuis le nom du pays (Intl.DisplayNames),
   en français ou en anglais, uniquement si le système sait afficher les emoji-drapeaux */
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
  } catch (e) { /* Pas de canvas : on garde l'icône */ }

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

            if (n && n !== code) {
              regionByName.set(normalize(n), code);
            }
          }
        }
      }
    } catch (e) { /* Intl.DisplayNames indisponible */ }
  }

  const code = regionByName.get(normalize(name));
  return code
    ? String.fromCodePoint(...[...code].map(
        c => 0x1F1E6 + c.charCodeAt(0) - 65
      ))
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
    meta.textContent = [st.country, st.language, st.genre].map(shown).join(' · ');
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

    if (st.website) {
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
    const on = state.favorites.has(st.id);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', tr(on ? 'station.fav.removeAria' : 'station.fav.addAria', { name: st.name }));
    btn.title = tr(on ? 'station.fav.remove' : 'station.fav.add');
    btn.replaceChildren(icon(on ? 'bi-heart-fill' : 'bi-heart'));
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

  function fillFilterSelects() {
    fillSelect(el.country, tr('filters.allCountries'), state.stations.map((s) => s.country));
    fillLanguageSelect();
    fillSelect(el.genre, tr('filters.allGenres'), state.stations.map((s) => s.genre));
  }

  function filteredStations() {
    const f = state.filters;
    const q = normalize(f.query);
    return state.stations
      .filter((s) =>
        (!q || normalize(s.name).includes(q)) &&
        (f.country === ALL || s.country === f.country) &&
        (f.language === ALL || s.langs.includes(f.language)) &&
        (f.genre === ALL || s.genre === f.genre) &&
        (!f.theme || s.themeIds.includes(f.theme)) &&
        (!f.family || s.families.includes(f.family)))
      .sort((a, b) => a.name.localeCompare(b.name, loc()));
  }

  /* ---------- Favoris ----------
   * state.favorites contient les identifiants enregistrés (même ceux absents du catalogue, pour ne rien
   * perdre si le catalogue est momentanément vide ou modifié). Seuls ceux présents dans le catalogue sont affichés. */
  function favoriteStations(q) {
    return state.stations
      .filter((s) => state.favorites.has(s.id) && (!q || normalize(s.name).includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, loc()));
  }

  function paintAllFavButtons() {
    document.querySelectorAll('.station-card .btn-fav').forEach((btn) => {
      const st = state.byId.get(btn.closest('.station-card').dataset.id);
      if (st) paintFavoriteButton(btn, st);
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
    if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    persistFavorites();
    if (state.view === 'favorites') {
      renderList();                    // la station disparaît (ou apparaît) immédiatement
    } else {
      paintAllFavButtons();            // une station peut apparaître dans plusieurs sections de l'accueil
      paintNav();
    }
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

  /** Pastilles pour les filtres qui n'ont pas de liste déroulante (activité, famille de genre). */
  function renderChips() {
    const f = state.filters;
    const chips = [];
    if (f.theme) chips.push({ key: 'theme', label: tr('theme.' + f.theme + '.title') });
    if (f.family) chips.push({ key: 'family', label: tr('family.' + f.family) });
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
    if (orphans > 0) {
      el.orphansText.textContent = trn('orphans.text', orphans);
    }
    el.viewTitle.textContent = viewTitleText();
    renderChips();
    paintNav();
    paintCardStates();
  }

  /* ---------- Accueil : sections construites à partir du catalogue ---------- */
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

  /** Remplit une section de cards ; la masque s'il n'y en a aucune. */
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

  function renderRecents() {
    const list = state.history.map((id) => state.byId.get(id)).filter(Boolean).slice(0, 3);
    stationCards(list, el.recents);
    paintCardStates();
  }

  /** Sélection du jour : ordre éditorial déterministe (même résultat toute la journée, change chaque jour). */
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
    // Activités
    fillSection(el.themes, THEMES.map((t) => [t, st.filter((s) => s.themeIds.includes(t.id)).length]).filter(([, n]) => n > 0)
      .map(([t, n]) => makeCategoryCard({ icon: t.icon, title: tr('theme.' + t.id + '.title'), lines: [tr('theme.' + t.id + '.desc'), count(n)], patch: { theme: t.id } })));
    // Genres : familles non vides, puis genres du catalogue qui n'entrent dans aucune famille
    const genreCards = FAMILIES.map((f) => [f, st.filter((s) => s.families.includes(f.id)).length]).filter(([, n]) => n > 0)
      .map(([f, n]) => makeCategoryCard({ icon: f.icon, title: tr('family.' + f.id), lines: [count(n)], patch: { family: f.id } }));
    const loose = new Map();
    st.filter((s) => s.families.length === 0).forEach((s) => loose.set(s.genre, (loose.get(s.genre) || 0) + 1));
    [...loose.entries()].sort((a, b) => shown(a[0]).localeCompare(shown(b[0]), loc())).forEach(([g, n]) =>
      genreCards.push(makeCategoryCard({ icon: 'bi-vinyl', title: shown(g), lines: [count(n)], patch: { genre: g } })));
    fillSection(el.genres, genreCards);
    // Pays
    const byCountry = new Map();
    st.forEach((s) => byCountry.set(s.country, (byCountry.get(s.country) || 0) + 1));
    fillSection(el.countries, [...byCountry.entries()].sort((a, b) => b[1] - a[1] || shown(a[0]).localeCompare(shown(b[0]), loc()))
      .map(([c, n]) => makeCategoryCard({ icon: 'bi-geo-alt-fill', flag: countryFlag(c), title: shown(c), lines: [count(n)], patch: { country: c } })));
    // Langues (parlées) + « Instrumental » à part
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
      [el.recents, el.picks, el.themes, el.genres, el.countries, el.languages].forEach((l) => fillSection(l, []));
      return;
    }
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

  /** Ouvre le catalogue filtré par une card de l'accueil (les filtres de la vue Radios restent combinables ensuite). */
  function openFiltered(patch) {
    resetFilters();
    Object.assign(state.filters, patch);
    syncFilterControls();
    if (state.view === 'radios') applyView('radios', true); else goTo('radios');
  }

  /* ---------- Navigation entre les vues ----------
   * Le lecteur (barre fixe + unique objet Audio) est indépendant des vues : changer de vue ne touche pas à la lecture.
   * La vue est mémorisée dans l'adresse (#favoris), ce qui permet le bouton Retour et l'actualisation. */
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
    el.country.value = f.country;
    el.language.value = f.language;
    el.genre.value = f.genre;
  }

  function resetFilters() {
    state.filters = { query: '', country: ALL, language: ALL, genre: ALL, theme: '', family: '' };
    syncFilterControls();
  }

  /** « En lecture » : amène la station en cours à l'écran (changement de vue / filtres si nécessaire). */
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

  function paintCardStates() {
    document.querySelectorAll('.station-card').forEach((card) => {
      const isCurrent = !!state.current && card.dataset.id === state.current.id;
      card.classList.toggle('is-current', isCurrent);
      card.querySelector('.eq').classList.toggle('is-playing', isCurrent && state.status === 'playing');
    });
  }

  /* ---------- Statut et lecteur ---------- */
  /* ---------- Media Session (notification Android, écran verrouillé, casque) ----------
   * Utile pour : nom de la station dans la notification et boutons Lecture/Pause traités comme des actions de
   * l'utilisateur (donc jamais confondus avec une interruption). Ne détecte PAS les appels ni les annonces d'autres applis. */
  const hasMediaSession = 'mediaSession' in navigator && typeof window.MediaMetadata === 'function';
  let mediaSessionStation = null;

  function updateMediaSession() {
    if (!hasMediaSession) return;
    try {
      const st = state.current;
      if (st && mediaSessionStation !== st.id) {
        const artwork = st.logoUrl
          ? [{ src: st.logoUrl, sizes: '128x128' }]
          : [{ src: new URL('assets/icons/icon-512.png', location.href).href, sizes: '512x512', type: 'image/png' }];
        navigator.mediaSession.metadata = new MediaMetadata({ title: st.name, artist: tr('app.name'), artwork });
        mediaSessionStation = st.id;
      } else if (!st) {
        navigator.mediaSession.metadata = null;
        mediaSessionStation = null;
      }
      navigator.mediaSession.playbackState = state.wantPlay ? 'playing' : (st ? 'paused' : 'none');
    } catch (e) { /* Media Session indisponible : sans conséquence */ }
  }

  function initMediaSession() {
    if (!hasMediaSession) return;
    const handle = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* action non prise en charge */ } };
    handle('play', () => { if (state.current && !state.wantPlay) startPlayback(); });
    handle('pause', () => { if (state.current) stopPlayback(); });
    handle('stop', () => { if (state.current) stopPlayback(); });
  }

  /** kind : état visuel ; key/params : texte affiché (clé i18n, 'status.<kind>' par défaut). params.insecure ajoute l'avertissement HTTP. */
  function setStatus(kind, key, params) {
    state.status = kind;
    state.statusKey = key || ('status.' + kind);
    state.statusParams = params || null;
    el.dot.className = 'status-dot status-' + kind;
    el.statusText.textContent = tr(state.statusKey) + (params && params.insecure ? ' ' + tr('error.insecure') : '');
    el.eq.classList.toggle('is-playing', kind === 'playing');
    const active = state.wantPlay;
    el.play.replaceChildren(icon(active ? 'bi-pause-fill' : 'bi-play-fill'));
    el.play.setAttribute('aria-label', active ? tr('player.pause') : tr('player.play'));
    el.play.disabled = !state.current;
    el.navCurrent.disabled = !state.current;
    el.retry.classList.toggle('d-none', !state.current || kind === 'idle' || kind === 'ready');
    updateMediaSession();
    paintCardStates();
  }

  function paintPlayerStation() {
    const st = state.current;
    el.name.textContent = st ? st.name : tr('player.none');
    const logo = makeLogo(st, true);
    el.logo.replaceChildren(...logo.childNodes);
  }

  /* ---------- Lecture audio ---------- */
  function clearConnectTimer() {
    if (connectTimer) { clearTimeout(connectTimer); connectTimer = null; }
  }

  function armConnectTimer() {
    clearConnectTimer();
    connectTimer = setTimeout(() => {
      if (state.wantPlay && (state.status === 'connecting' || state.status === 'buffering')) {
        state.wantPlay = false;
        releaseAudio();
        setStatus('error', 'error.timeout');
      }
    }, CONNECT_TIMEOUT_MS);
  }

  /** Coupe le flux et libère la connexion réseau (indispensable pour un flux en direct). */
  function releaseAudio() {
    clearConnectTimer();
    state.interrupted = false;      // plus de source : aucune reprise automatique possible après un arrêt voulu
    playToken++;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function errorKey(code) {
    return code === 2 ? 'error.network' : code === 3 ? 'error.decode' : code === 4 ? 'error.unsupported' : 'error.generic';
  }

  /** Flux HTTP sur page HTTPS : le message d'erreur ajoute l'avertissement de contenu mixte. */
  function insecureParams() {
    return state.current && state.current.insecure ? { insecure: true } : null;
  }

  function startPlayback() {
    const st = state.current;
    if (!st) return;
    releaseAudio();                     // arrête tout flux précédent (un seul flux actif)
    const token = ++playToken;
    state.wantPlay = true;
    audio.src = st.streamUrl;
    setStatus('connecting');
    armConnectTimer();
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
          setStatus('error', errorKey(0), insecureParams());
        }
      });
    }
  }

  function stopPlayback() {
    state.wantPlay = false;
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
    releaseAudio();                     // coupe le flux précédent
    state.current = st;
    store.set(KEYS.last, st.id);
    paintPlayerStation();
    setStatus('ready');
    if (autoplay) startPlayback();
  }

  /* Événements de l'élément Audio */
  audio.addEventListener('playing', () => {
    if (state.interrupted) {                 // Chrome a repris la lecture après l'interruption (une seule fois)
      const away = Date.now() - state.interruptedAt;
      state.interrupted = false;
      if (away >= LIVE_REFRESH_MS) { startPlayback(); return; }   // longue interruption : on se recale sur le direct
      state.wantPlay = true;
    }
    if (!state.wantPlay) return;
    clearConnectTimer();
    if (state.current && state.history[0] !== state.current.id) recordListen(state.current.id);
    setStatus('playing');
  });
  audio.addEventListener('waiting', () => {
    if (!state.wantPlay || !audio.getAttribute('src')) return;
    setStatus('buffering');
    armConnectTimer();
  });
  audio.addEventListener('error', () => {
    if (!audio.getAttribute('src')) return;   // erreur due à la libération volontaire du flux
    state.wantPlay = false;
    clearConnectTimer();
    setStatus('error', errorKey(audio.error && audio.error.code), insecureParams());
  });
  audio.addEventListener('ended', () => {
    if (!state.wantPlay) return;
    state.wantPlay = false;
    setStatus('error', 'error.ended');
  });
  audio.addEventListener('pause', () => {
    // Nos boutons retirent la source avant que cet événement n'arrive : ils ne passent jamais ici.
    // Une pause avec source conservée vient donc du système (appel, autre appli qui prend le focus audio...).
    // On garde le flux : Chrome Android reprend de lui-même quand l'autre appli rend le focus, et le bouton Lecture relance si besoin.
    if (!audio.paused || !state.wantPlay || !audio.getAttribute('src')) return;
    clearConnectTimer();
    state.wantPlay = false;
    state.interrupted = true;
    state.interruptedAt = Date.now();
    setStatus('interrupted');
  });
  window.addEventListener('offline', () => {
    if (state.wantPlay) setStatus('error', 'error.offline');
  });
  window.addEventListener('online', () => {
    if (state.current && state.status === 'error') {
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

  /* ---------- Langue de l'interface ----------
   * Le sélecteur (Paramètres) est construit depuis I18N.languages() ; il reste masqué tant qu'une seule langue est enregistrée.
   * Changer de langue : textes statiques retraduits (data-i18n), puis rendu des vues/états dynamiques. Ni la lecture audio,
   * ni les favoris, l'historique, les filtres ou la vue courante ne sont touchés. */
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
        if (o.name) { label.textContent = o.name; label.setAttribute('lang', o.value); }      // native name, never translated
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
  }

  /* ---------- Volume ---------- */
  function applyVolume() {
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

  /* ---------- Événements d'interface ---------- */
  function onStationClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const card = btn.closest('.station-card');
    if (!card) return;
    const id = card.dataset.id;
    if (btn.dataset.action === 'play') selectStation(id, true);
    else if (btn.dataset.action === 'favorite') toggleFavorite(id);
  }
  [el.list, el.recents, el.picks].forEach((c) => c.addEventListener('click', onStationClick));

  [el.themes, el.genres, el.countries, el.languages].forEach((c) => c.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-card');
    if (!btn) return;
    try { openFiltered(JSON.parse(btn.dataset.patch)); } catch (err) { /* card illisible : ignorée */ }
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
    if (state.view !== 'home') renderList();
    else if (el.search.value.trim()) goTo('radios');     // taper une recherche depuis l'accueil ouvre les résultats
  });
  el.country.addEventListener('change', () => { state.filters.country = el.country.value; renderList(); });
  el.language.addEventListener('change', () => { state.filters.language = el.language.value; renderList(); });
  el.genre.addEventListener('change', () => { state.filters.genre = el.genre.value; renderList(); });
  el.reset.addEventListener('click', () => { resetFilters(); renderList(); });
  el.forgetOrphans.addEventListener('click', () => {
    orphanIds().forEach((id) => state.favorites.delete(id));
    persistFavorites();
    renderList();
  });
  el.navCurrent.addEventListener('click', revealCurrent);
  window.addEventListener('hashchange', () => {
    const view = viewFromHash();
    if (view !== state.view) applyView(view, true);
  });

  el.themeInputs.forEach((input) => input.addEventListener('change', () => { if (input.checked) setTheme(input.value); }));
  if (systemDark) {
    const onSystemChange = () => { if (state.theme === 'auto') applyTheme(); };   // le choix explicite n'est jamais écrasé
    if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);
  }

  window.addEventListener('languagechange', () => I18N.refresh());     // suit la langue de l'appareil si le choix est « Automatique »

  el.play.addEventListener('click', togglePlay);
  el.retry.addEventListener('click', startPlayback);
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

  /* ---------- Initialisation ---------- */
  function init() {
    I18N.init();                      // langue : choix enregistré > langue de l'appareil > anglais
    I18N.applyTo(document);
    I18N.onChange(refreshLanguage);
    const savedTheme = store.get(KEYS.theme, 'auto');
    state.theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'auto';
    applyTheme();
    initMediaSession();

    const raw = Array.isArray(window.STATIONS) ? window.STATIONS : [];
    raw.forEach((r) => {
      const st = normalizeStation(r);
      if (!st) return;
      if (state.byId.has(st.id)) { console.warn('Duplicate station id ignored:', st.id); return; }
      state.byId.set(st.id, st);
      state.stations.push(st);
      annotate(st);
    });

    fillFilterSelects();

    const favs = store.get(KEYS.favorites, []);
    // Set => pas de doublons ; on garde aussi les identifiants absents du catalogue (voir « Favoris » plus haut)
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

    // Restaure la dernière station SANS lancer la lecture
    const last = store.get(KEYS.last, null);
    if (typeof last === 'string' && state.byId.has(last)) selectStation(last, false);

    // Réserve la place de la barre de lecture en bas de page
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
