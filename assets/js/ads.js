/*
 * Omnira — Configuration et moteur de préparation pour Google AdSense + Consent Mode v2.
 *
 * Étapes d'activation :
 * 1. Renseigner `publisherId` ('ca-pub-XXXXXXXXXXXXXXXX') et les identifiants `slots` (`home`, `catalog`).
 * 2. Passer `enabled` à `true`.
 * 3. Compléter `ads.txt` à la racine avec votre identifiant éditeur (`pub-XXXXXXXXXXXXXXXX`).
 */
(() => {
  'use strict';

  const CONFIG = {
    enabled: false,
    publisherId: '',
    slots: {
      home: '',
      catalog: ''
    }
  };

  window.OMNIRA_ADS = CONFIG;

  const isConfigured = () =>
    CONFIG.enabled === true && /^ca-pub-\d{10,20}$/.test(String(CONFIG.publisherId || '').trim());

  let scriptRequested = false;
  const mountedSlots = new Set();

  function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
    return window.gtag;
  }

  function initConsentDefaults() {
    const gtag = ensureDataLayer();
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500
    });
  }

  function ensureAdSenseMeta() {
    if (!isConfigured()) return;
    let meta = document.querySelector('meta[name="google-adsense-account"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'google-adsense-account');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', CONFIG.publisherId.trim());
  }

  function loadAdSenseScript() {
    if (!isConfigured() || scriptRequested) return;
    scriptRequested = true;
    const client = encodeURIComponent(CONFIG.publisherId.trim());
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + client;
    document.head.appendChild(script);
  }

  function mountSlot(slotKey, containerEl) {
    if (!isConfigured() || !containerEl) return false;
    const slotId = String(CONFIG.slots[slotKey] || '').trim();
    if (!/^\d{6,20}$/.test(slotId)) return false;

    const target = containerEl.querySelector('.ad-slot-box');
    if (!target) return false;
    containerEl.classList.remove('d-none');

    if (mountedSlots.has(slotKey)) return true;
    mountedSlots.add(slotKey);

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle ad-slot-ins';
    ins.setAttribute('data-ad-client', CONFIG.publisherId.trim());
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    target.replaceChildren(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      /* Le script AdSense traitera la file dès son chargement */
    }
    return true;
  }

  function applyConsent(choice, slotContainers) {
    if (!isConfigured()) return;
    const personalized = choice === 'personalized';
    const gtag = ensureDataLayer();
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: personalized ? 'granted' : 'denied',
      ad_personalization: personalized ? 'granted' : 'denied',
      analytics_storage: 'denied'
    });

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = personalized ? 0 : 1;

    ensureAdSenseMeta();
    loadAdSenseScript();

    if (slotContainers) {
      mountSlot('home', slotContainers.home);
      mountSlot('catalog', slotContainers.catalog);
    }
  }

  if (isConfigured()) {
    initConsentDefaults();
    ensureAdSenseMeta();
  }

  window.OMNIRA_AD_ENGINE = {
    isConfigured,
    applyConsent,
    mountSlot
  };
})();
