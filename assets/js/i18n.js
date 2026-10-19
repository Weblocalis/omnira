/*
 * Omnira — i18n engine (native JavaScript, no dependency, no build step).
 *
 * Dictionaries live in assets/js/locales/<code>.js, one file per language, loaded BEFORE app.js:
 *     I18N.register('en', { nativeName: 'English' }, { 'nav.home': 'Home', ... });
 * English ("en") is the reference dictionary and the fallback for any missing key or language.
 *
 * Usage
 *   I18N.t('key', { name: 'x' })      translated text, {name} placeholders are replaced
 *   I18N.tn('key', n, params)         plural: uses key.one / key.other / ... (Intl.PluralRules); {n} is formatted
 *   I18N.number(n)                    number formatted for the current language (Intl.NumberFormat)
 *   data-i18n="key"                   in HTML: sets the element's text (textContent)
 *   data-i18n-aria-label | -title | -placeholder | -content="key"   same for the matching attribute
 *   I18N.applyTo(root)                translates every marked element under root (default: the document)
 *   I18N.setLanguage('auto' | 'fr')   changes + saves the user's choice, then notifies I18N.onChange listeners
 *
 * Language choice: saved explicit choice (if that language is still registered) > browser/device language
 * (if registered) > English. A saved choice is never overwritten by detection.
 * Translations are only ever inserted with textContent / setAttribute (never innerHTML).
 */
(function (global) {
  'use strict';

  const DEFAULT_LANGUAGE = 'en';
  const STORAGE_KEY = 'radio.lang';          // same "radio.*" namespace as the other saved settings
  const AUTO = 'auto';
  const ATTRIBUTES = [
    ['aria-label', 'data-i18n-aria-label'],
    ['title', 'data-i18n-title'],
    ['placeholder', 'data-i18n-placeholder'],
    ['content', 'data-i18n-content']
  ];

  const locales = {};                         // code -> { nativeName, messages }
  const listeners = [];
  const warned = new Set();
  let preference = AUTO;
  let current = DEFAULT_LANGUAGE;
  let numberFormat = null;

  const has = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const normalizeCode = (code) => String(code || '').toLowerCase().replace(/_/g, '-');

  function register(code, meta, messages) {
    const id = normalizeCode(code);
    const entry = locales[id] || (locales[id] = { nativeName: id, messages: {} });
    if (meta && meta.nativeName) entry.nativeName = meta.nativeName;
    Object.assign(entry.messages, messages || {});
  }

  /** Registered languages, e.g. [{ code: 'en', nativeName: 'English' }]. */
  function languages() {
    return Object.keys(locales).map((code) => ({ code: code, nativeName: locales[code].nativeName }));
  }

  /** Browser / device language among the registered ones, or the default language. */
  function detect() {
    const nav = global.navigator || {};
    const list = nav.languages && nav.languages.length ? nav.languages : [nav.language];
    for (let i = 0; i < list.length; i++) {
      const full = normalizeCode(list[i]);
      if (!full) continue;
      if (has(locales, full)) return full;
      const base = full.split('-')[0];
      if (has(locales, base)) return base;
    }
    return DEFAULT_LANGUAGE;
  }

  function resolve(pref) {
    return pref !== AUTO && has(locales, pref) ? pref : detect();
  }

  function warnOnce(message) {
    if (warned.has(message)) return;
    warned.add(message);
    if (global.console && global.console.warn) global.console.warn('[i18n] ' + message);
  }

  function lookup(key) {
    if (locales[current] && has(locales[current].messages, key)) return locales[current].messages[key];
    const reference = locales[DEFAULT_LANGUAGE];
    if (reference && has(reference.messages, key)) {
      if (current !== DEFAULT_LANGUAGE) warnOnce('missing "' + key + '" in "' + current + '": using English');
      return reference.messages[key];
    }
    warnOnce('unknown key "' + key + '"');
    return '';                                // never show a technical key to the user
  }

  function updateFormats() {
    try { numberFormat = new Intl.NumberFormat(current); } catch (e) { numberFormat = null; }
  }

  function number(n) { return numberFormat ? numberFormat.format(n) : String(n); }

  function t(key, params) {
    const text = lookup(key);
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (m, name) => {
      if (params[name] === undefined) return m;
      return typeof params[name] === 'number' ? number(params[name]) : String(params[name]);
    });
  }

  function tn(key, n, params) {
    let category = 'other';
    try { category = new Intl.PluralRules(current).select(n); } catch (e) { /* Intl unavailable */ }
    const specific = key + '.' + category;
    const own = locales[current] && has(locales[current].messages, specific);
    const ref = locales[DEFAULT_LANGUAGE] && has(locales[DEFAULT_LANGUAGE].messages, specific);
    return t(own || ref ? specific : key + '.other', Object.assign({ n: n }, params));
  }

  /** Translates the elements marked with data-i18n* under root. */
  function applyTo(root) {
    const scope = root || global.document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
    ATTRIBUTES.forEach((pair) => {
      scope.querySelectorAll('[' + pair[1] + ']').forEach((el) => { el.setAttribute(pair[0], t(el.getAttribute(pair[1]))); });
    });
  }

  function readSaved() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      const value = raw === null ? AUTO : JSON.parse(raw);
      return typeof value === 'string' ? normalizeCode(value) : AUTO;
    } catch (e) { return AUTO; }               // storage blocked or corrupted: automatic choice
  }

  function writeSaved(value) {
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); return true; } catch (e) { return false; }
  }

  function apply(pref) {
    preference = pref;
    current = resolve(pref);
    updateFormats();
    if (global.document) global.document.documentElement.setAttribute('lang', current);
  }

  /** Reads the saved choice and computes the effective language. Call once, before translating. */
  function init() {
    apply(readSaved());
    return current;
  }

  /**
   * choice: 'auto' (follow the browser / device) or a registered language code.
   * Returns { language, saved } ; saved is false when local storage is unavailable (the choice then lasts for the session).
   */
  function setLanguage(choice) {
    const wanted = choice === AUTO ? AUTO : normalizeCode(choice);
    if (wanted !== AUTO && !has(locales, wanted)) return { language: current, saved: true };   // unknown language: ignored
    const saved = writeSaved(wanted);
    apply(wanted);
    listeners.slice().forEach((fn) => fn(current));
    return { language: current, saved: saved };
  }

  /** Re-evaluates 'auto' (e.g. after the browser's "languagechange" event). */
  function refresh() {
    if (preference !== AUTO) return current;
    apply(AUTO);
    listeners.slice().forEach((fn) => fn(current));
    return current;
  }

  global.I18N = {
    DEFAULT_LANGUAGE: DEFAULT_LANGUAGE,
    STORAGE_KEY: STORAGE_KEY,
    AUTO: AUTO,
    register: register,
    languages: languages,
    detect: detect,
    init: init,
    setLanguage: setLanguage,
    refresh: refresh,
    getPreference: () => preference,
    getLanguage: () => current,
    t: t,
    tn: tn,
    number: number,
    applyTo: applyTo,
    onChange: (fn) => { listeners.push(fn); }
  };
})(window);
