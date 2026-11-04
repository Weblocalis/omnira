# Omnira — lecteur de radios Internet (PWA)

> « Omnira » est un nom provisoire : tout renommage se fait en une commande (voir [Nom et domaine](#nom-et-domaine)).

Site 100 % statique : HTML, CSS et JavaScript natif, Bootstrap 5.3.3. **Aucun backend, aucune compilation, aucun CDN tiers** :
toutes les dépendances sont hébergées dans `assets/vendor/`. Déployé sur Cloudflare Pages, installable comme application (PWA)
et prévu pour être empaqueté en application Android (TWA, `.well-known/assetlinks.json`).

## Arborescence

```
index.html                 application (une seule page, vues #accueil / #radios / #favoris)
404.html                   page d'erreur (sinon Cloudflare Pages renverrait index.html en 200 pour toute adresse)
privacy-policy.html, legal-notice.html, terms-of-use.html    pages légales (anglais)
manifest.webmanifest       PWA (nom, icônes, captures, raccourcis)
service-worker.js          cache de l'interface (jamais des flux audio)
_headers                   en-têtes Cloudflare Pages : CSP, sécurité, cache
robots.txt, sitemap.xml    référencement
site.config.json           nom, slogan, domaine, package Android (lu par tools/rebrand.mjs)
assets/
  css/                     style.css (thèmes clair/sombre), legal.css
  js/theme-init.js         applique le thème avant l'affichage (pas de flash)
  js/i18n.js               moteur de traduction
  js/locales/en.js, fr.js  textes de l'interface
  js/stations.js           ← catalogue des stations
  js/app.js                logique du lecteur
  logos/                   logos des stations (hébergés localement)
  icons/, images/          icônes de l'app, captures, og-image.jpg (aperçu de partage)
  vendor/                  Bootstrap 5.3.3, sous-ensemble Bootstrap Icons 1.11.3, hls.js 1.7.3 (+ licences)
tools/                     scripts de maintenance (Node / Python, non nécessaires au site)
tests/smoke.mjs            test dans un vrai navigateur (Playwright)
```

## Ajouter une station

Dans `assets/js/stations.js`, copier un bloc existant (le commentaire en tête du fichier décrit chaque champ) :

```js
{
  id: "ma-radio",                                  // unique, ne plus jamais le changer (favoris/historique)
  name: "Ma Radio",
  country: "France",                               // en anglais : le drapeau est généré automatiquement
  language: "French",                              // plusieurs : "French / Arabic" ; "Instrumental" = sans paroles ; "Mixed"
  genre: "Pop, Hits",                              // en anglais, séparés par des virgules
  streamUrl: "https://exemple.org/flux.mp3",       // HTTPS obligatoire en pratique ; MP3, AAC ou HLS (.m3u8)
  logoUrl: "assets/logos/ma-radio.png",            // facultatif (fichier local de préférence)
  website: "https://exemple.org"                   // facultatif
}
```

Puis vérifier : `node tools/check-streams.mjs ma-radio` (lit le flux dans un vrai Chromium via l'application).

- Les genres sont regroupés en **familles** (Pop et tubes, Rock, Électro, Classique, Info et débats, Culture, Spirituel…) par
  mots-clés (`FAMILIES` en haut de `app.js`). Ces familles servent à la fois aux cartes de l'accueil et au filtre « Genre ».
- Les **activités** (concentration, sport, sommeil…) sont déduites de la même façon (`THEMES`), ou forcées avec `themes: ["focus"]`.
- Les flux **HLS** (`.m3u8`) sont lus nativement quand le navigateur sait le faire (Safari, Chrome récent), sinon par hls.js,
  chargé à la demande uniquement.
- Les flux **HTTP** sont bloqués par les navigateurs sur un site HTTPS : 3 stations sont désactivées pour cette raison
  (en commentaire à la fin de `stations.js`, à réactiver si une adresse HTTPS est trouvée).

## Nom et domaine

Le nom, le slogan et le domaine sont définis dans `site.config.json`. Pour les changer partout (pages, manifest, traductions,
pages légales, sitemap, balises de partage, données structurées) :

```bash
node tools/rebrand.mjs --name "NouveauNom" --tagline "Nouveau slogan." --domain nouveaunom.app
node tools/make-og-image.mjs      # régénère l'image de partage avec le nouveau nom (Playwright requis)
node tests/smoke.mjs              # vérifie que tout fonctionne
```

Tant que le domaine n'est pas défini, les adresses absolues contiennent `YOUR-DOMAIN` (canonical, og:url, sitemap…).
`--dry-run` liste les fichiers concernés sans rien modifier. Le package Android (`--android-package`) ne doit être changé
qu'avant la première publication sur le Play Store.

## Déploiement (Cloudflare Pages)

1. Workers & Pages > Create > Pages > Connect to Git, choisir ce dépôt.
2. Framework preset **None**, Build command **vide**, Build output directory **`/`**.
3. Après l'achat du domaine : Pages > Custom domains > ajouter le domaine, puis `node tools/rebrand.mjs --domain …`, commit.
4. L'adresse `*.pages.dev` reçoit `X-Robots-Tag: noindex` (fichier `_headers`) pour éviter le contenu dupliqué.
5. Déclarer le site dans Google Search Console et y soumettre `https://<domaine>/sitemap.xml`.

Cloudflare Pages sert les pages sans extension (`/privacy-policy.html` → `/privacy-policy`) : le service worker le gère.
À chaque modification d'un fichier de l'interface, incrémenter `CACHE_VERSION` dans `service-worker.js`.

## Sécurité et confidentialité

- **CSP stricte** (`_headers`) : scripts, styles et polices uniquement depuis le site ; aucun script inline.
  Les flux audio (`media-src https:`) et HLS (`connect-src https:`) restent autorisés vers toutes les radios.
- Aucun tiers contacté hormis les radios écoutées et l'hébergeur (plus de jsDelivr ni de service d'icônes Google) :
  la politique de confidentialité a été mise à jour en conséquence.
- Favoris, historique et réglages restent dans le `localStorage` de l'appareil (clés `radio.*`).

## Traductions

Interface en anglais et en français (détection automatique, choix dans Paramètres). Pour ajouter une langue : copier
`assets/js/locales/en.js` en `<code>.js`, traduire les valeurs, ajouter la balise `<script>` dans `index.html` et le fichier
dans `APP_FILES` (`service-worker.js`). Les noms et informations des stations ne sont pas traduits. Les pages légales
n'existent qu'en anglais.

## Outils

| Commande | Rôle |
|---|---|
| `node tests/smoke.mjs` | Test dans Chromium : accueil, catalogue, filtres, recherche, favoris, thème, langue, pages légales, 404, absence d'erreur CSP |
| `node tools/check-streams.mjs [ids…]` | Lit chaque flux dans Chromium et signale ceux qui ne passent pas (`NOHLS=1` force hls.js) |
| `node tools/rebrand.mjs …` | Renomme l'app / fixe le domaine partout |
| `node tools/make-og-image.mjs` | Génère `assets/images/og-image.jpg` (1200×630) |
| `python3 tools/build-icons.py` | Régénère le sous-ensemble d'icônes après l'ajout d'une icône `bi-…` |

Les scripts Node nécessitent Playwright : `npm i -g playwright && npx playwright install chromium`.

## Interruptions audio (appels, WhatsApp, GPS)

Chrome Android gère seul le focus audio : il met en pause ou baisse le son quand une autre application parle, puis reprend.
Une pause qui ne vient pas d'un bouton de l'app est traitée comme une interruption (état « Interrompu ») : le flux est
conservé pour permettre la reprise ; après plus de 20 s, il est relancé pour revenir au direct. La notification Android
(Media Session) affiche la station avec Lecture/Pause. Une PWA ne peut pas savoir *pourquoi* la lecture s'est arrêtée.

## Limitations connues

- Certaines radios sont géo-restreintes (ex. Hotmix hors de France, peut-être Europa Plus hors de Russie).
- Pas de titre du morceau en cours (métadonnées ICY non accessibles depuis l'élément audio).
- Pas d'écoute hors ligne (seule l'interface est en cache).
- Les pages légales contiennent des marqueurs `[…]` à compléter avant publication (rechercher `legal-placeholder`).
