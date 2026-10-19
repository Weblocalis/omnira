# Ma Radio — lecteur radio Internet personnel

Site 100 % statique (HTML, CSS, JavaScript natif, Bootstrap 5.3.3 + Bootstrap Icons 1.11.3 via CDN, versions fixées avec SRI).
Aucun backend, aucune compilation, aucun secret.

## Arborescence

```
radio-player/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── README.md
└── assets/
    ├── css/style.css
    ├── js/stations.js      ← catalogue des stations (à modifier)
    ├── js/app.js           ← logique du lecteur
    ├── icons/              ← favicon.svg, icon-192.png, icon-512.png, apple-touch-icon.png
    └── images/             ← (vide, pour tes logos éventuels)
```

## Ajouter une station

Ouvre `assets/js/stations.js`, copie un bloc existant à la fin du tableau (sans oublier la virgule entre les blocs) :

```js
{
  id: "ma-radio",                       // unique, sans espace, ne plus le changer ensuite
  name: "Ma Radio",
  country: "France",
  language: "Français",
  genre: "Pop",
  streamUrl: "https://exemple.org/flux.mp3",   // http(s) uniquement, préfère https
  logoUrl: "https://exemple.org/logo.png",     // facultatif
  website: "https://exemple.org"               // facultatif
}
```

Les stations invalides (id/nom manquant, URL non http(s), id en double) sont ignorées, avec un avertissement dans la console du navigateur.
Où trouver l'URL d'un flux ? Sur la page « écouter en direct » de la radio (clic droit sur le lecteur, outils développeur > Réseau), ou dans la documentation publique de la radio. Vérifie toujours le flux dans ton navigateur.

## Déploiement (GitHub + Cloudflare Pages)

1. **Créer le dépôt** : sur github.com, « New repository », nom `ma-radio`, visibilité au choix, sans README initial.
2. **Ajouter les fichiers** : décompresse le projet ; sur la page du dépôt vide, « uploading an existing file », glisse **le contenu** du dossier `radio-player` (index.html à la racine du dépôt, pas dans un sous-dossier), puis « Commit changes ». (Ou en ligne de commande : `git init`, `git add .`, `git commit -m "Première version"`, `git branch -M main`, `git remote add origin https://github.com/TON-COMPTE/ma-radio.git`, `git push -u origin main`.)
3. **Envoyer les modifications** : c'est fait par le commit ci-dessus (ou `git push`).
4. **Connecter à Cloudflare Pages** : dash.cloudflare.com > Workers & Pages > Create > Pages > « Connect to Git », autorise GitHub, choisis le dépôt `ma-radio`.
5. **Configuration** : Framework preset = **None** ; Build command = **vide** ; Build output directory = **`/`** (ou `.`, ou vide selon l'interface, la racine du dépôt). Cliquer « Save and Deploy ».
6. **Vérifier en HTTPS** : ouvre l'adresse `https://ma-radio.pages.dev` (ou celle indiquée). Le cadenas doit apparaître ; choisis une station et lance la lecture. Pour l'installer : menu Chrome Android > « Installer l'application » / « Ajouter à l'écran d'accueil ».
7. **Mettre à jour** : modifie un fichier sur GitHub (icône crayon > Commit changes). Cloudflare redéploie seul en 1 à 2 minutes. Si l'ancienne version s'affiche, recharge la page (le service worker privilégie le réseau).

## Navigation, accueil et favoris

- Quatre entrées en bas de l'écran, sous le lecteur : **Accueil**, **Radios** (catalogue + filtres), **Favoris** (avec compteur) et **En lecture** (ramène la station en cours à l'écran). L'en-tête contient le logo (retour à l'accueil), la recherche et un accès rapide aux favoris.
- **Accueil** (page d'ouverture) : « Dernières écoutes » (historique local de 12 stations max, bouton Effacer), « À découvrir » (sélection du jour : ordre déterministe tiré du catalogue, sans statistiques d'écoute), puis des cards par activité, genre, pays et langue. Chaque card ouvre la vue Radios filtrée, avec un bouton « Accueil » pour revenir.
- **Tout est calculé depuis `stations.js`** (aucune donnée dupliquée) ; une catégorie sans station n'est jamais affichée.
  - *Pays* : lus dans le champ `country` ; le drapeau est généré automatiquement et n'apparaît que si l'appareil sait afficher les drapeaux (sinon une icône).
  - *Langues* : lues dans `language`. « Instrumental » est traité à part (sans paroles) ; « Mixte », « International », « Multilingue » ne sont pas des langues et ne créent pas de card. Plusieurs langues : sépare-les par `/` ou `,` (ex. `"Français / Arabe"`).
  - *Genres* : les cards « familles » (Ambient, Lo-fi et chillhop, Électro et synthwave, Classique et orchestral, Jazz, Rock, Pop, Musiques du monde, Instrumental et relaxation) regroupent les stations dont le **genre** contient certains mots-clés ; les genres qui n'entrent dans aucune famille ont leur propre card.
  - *Activités* (concentration, travail, sport, détente, sommeil, conduite, découverte, actualités) : classement par mots-clés sur le genre et le nom. Les mots-clés sont dans `THEMES` et `FAMILIES`, en haut de `assets/js/app.js`. Pour forcer le classement d'une station, ajoute dans `stations.js` un champ facultatif : `themes: ["focus", "work"]` (ids : focus, work, sport, relax, sleep, drive, discover, news).
- Les filtres pays/langue/genre se combinent entre eux ; les filtres « activité » et « famille » s'affichent sous forme de pastilles à retirer d'un clic. La recherche (par nom) s'applique au catalogue et aux favoris ; taper depuis l'accueil ouvre les résultats.
- Le cœur de chaque carte ajoute ou retire un favori (`localStorage`, clé `radio.favorites`). Si l'`id` d'une station disparaît du catalogue, son favori reste enregistré sans être affiché ; la vue Favoris propose « Oublier ». Un simple changement de nom ou d'URL (même `id`) se propage automatiquement.
- La vue active est dans l'adresse (`#accueil`, `#radios`, `#favoris`) : bouton Retour d'Android et actualisation fonctionnent. Le lecteur et son unique objet Audio sont hors des vues : naviguer ne coupe jamais la lecture.
- Si le stockage du navigateur est bloqué, un avertissement s'affiche : favoris et historique fonctionnent pendant la session mais ne sont pas conservés.

## Interruptions audio (appels, WhatsApp, GPS)

Ce qu'une page web peut faire, et ce qu'elle ne peut pas faire :

- **Chrome Android gère le « focus audio » lui-même.** Quand une autre application prend le focus audio, Chrome met la lecture en pause ou baisse son volume de sa propre initiative, puis la reprend ou la rétablit quand le focus est rendu. La page n'est pas prévenue de ces décisions, sauf par les événements `pause` et `playing` de l'élément audio.
- **Aucune API disponible sur Chrome Android ne signale un appel, un message vocal WhatsApp ou une annonce GPS.** L'Audio Session API (`navigator.audioSession`, état « interrupted ») n'existe aujourd'hui que dans Safari, pas dans Chrome ni Chrome Android. Masquer la page (`visibilitychange`) n'a aucun rapport avec une annonce vocale : Ma Radio ne s'en sert pas.
- **Pas de baisse de volume « maison ».** Une page ne peut ni détecter une annonce de navigation ni demander de baisser le son. Si une application demande un focus « baisser le volume », c'est Chrome qui applique la baisse, sans toucher au curseur de Ma Radio. Ajouter une baisse en JavaScript se cumulerait avec celle de Chrome, c'est pourquoi elle n'est pas faite. Le volume choisi n'est jamais modifié par ces situations.
- **Ce que Ma Radio fait désormais :**
  - Une pause qui ne vient pas d'un de ses boutons est traitée comme une interruption : le flux est conservé (état « Interrompu »), pour que la reprise par Chrome puisse avoir lieu. Avant, le flux était coupé et la reprise automatique était impossible.
  - À la reprise, si l'interruption a duré moins de 20 secondes, la lecture continue ; sinon le flux est relancé pour revenir au direct. Une seule reprise est prise en compte et il n'y a toujours qu'un seul objet Audio.
  - Une pause volontaire (bouton, notification, casque) libère le flux : aucune reprise automatique n'est alors possible.
  - **Media Session** : la notification Android affiche le nom de la station avec Lecture/Pause (les boutons de la notification, du casque ou de l'écran verrouillé sont traités comme des actions volontaires).
- **Reste hors de portée d'une PWA :** savoir pourquoi la lecture s'est arrêtée, choisir entre pause et baisse de volume selon l'application, ou demander un focus audio précis. Cela exige une application Android native (AudioManager / `AudioFocusRequest`). Le projet n'est pas transformé en application native.
- Si, sur ton téléphone, la radio ne reprend pas seule après un appel ou un message vocal, c'est que Chrome n'a pas repris : le bouton Lecture (ou celui de la notification) relance le flux.

## Thème clair / sombre / automatique

- Réglage dans **Paramètres** (engrenage en haut à droite) : Clair, Sombre ou Auto. Auto est le choix par défaut et suit le thème d'Android ou du navigateur, y compris quand il change pendant l'utilisation. Un choix explicite n'est jamais modifié par le système.
- Le choix est enregistré dans `localStorage` (clé `radio.theme` : `light`, `dark` ou `auto`). Un petit script dans l'en-tête de `index.html` pose `data-bs-theme` avant le premier affichage, sans flash. Les couleurs sont des variables CSS (`:root` pour le sombre, `[data-bs-theme="light"]` pour le clair) dans `assets/css/style.css`.
- Contrastes calculés (WCAG) dans les deux thèmes : textes courants, textes secondaires, accent, bouton principal, badges et avertissements au-dessus du seuil de lisibilité (4,5:1 pour le texte, 3:1 pour les icônes).
- Limite : l'écran de démarrage de la PWA installée utilise les couleurs fixes de `manifest.webmanifest` (fond sombre), même en thème clair.

## Ce qui a été testé

- Syntaxe JavaScript (`node --check`), identifiants HTML uniques, icônes Bootstrap Icons vérifiées dans le paquet 1.11.3, empreintes SRI recalculées depuis les paquets npm officiels, contrastes calculés.
- Dans jsdom, avec un élément audio, une Media Session et `matchMedia` **simulés** (aucun appel, WhatsApp ni GPS réel) : 63 vérifications de non-régression (favoris, navigation, lecteur, cas limites), 44 pour l'accueil, 43 pour les interruptions et le thème. Elles couvrent : pause système puis reprise avec ou sans relance du flux, absence de reprise après une pause volontaire, absence de double reprise, un seul objet Audio, volume inchangé, actions Media Session, changement de station pendant une interruption, thème auto/clair/sombre, persistance, changement de thème système, valeur invalide, stockage indisponible.
- **Non testé dans un vrai navigateur ni sur Android** : tout ce qui précède reste une simulation d'événements. Restent à vérifier sur le téléphone : reprise après un appel réel, comportement avec WhatsApp et le GPS, notification Media Session, rendu des deux thèmes, flash au démarrage, installation PWA, service worker.

## Limitations connues

- Les URL Radio France du catalogue sont documentées publiquement mais non vérifiées par lecture réelle ; elles peuvent changer.
- Certains flux HTTP sont bloqués sur un site HTTPS (contenu mixte) ; une station HTTP affiche un badge « HTTP ». Certains serveurs refusent aussi l'écoute depuis un navigateur (CORS/restrictions), sans proxy ce n'est pas contournable ici.
- Les formats pris en charge dépendent du navigateur (MP3 et AAC en général ; les flux HLS `.m3u8` ne passent pas dans l'élément audio de Chrome/Firefox).
- Les activités et familles de genres reposent sur des mots-clés : certains classements peuvent être discutables ; ajuste `THEMES`/`FAMILIES` ou le champ `themes` d'une station.
- Pas de titre de morceau ni d'émission : les métadonnées ne sont pas disponibles de façon fiable avec l'élément Audio.
- Pas d'écoute hors ligne : seul l'interface est mise en cache. Hors ligne, la mise en forme Bootstrap (CDN) peut manquer si elle n'est pas déjà dans le cache du navigateur.
- Sur Android, la lecture peut s'interrompre si le système suspend l'onglet ; Relancer remet le flux en route. Sur iOS, le volume du site est contrôlé par les boutons physiques.
- Pause = arrêt du flux (en direct, on ne reprend pas un tampon périmé) ; reprendre relance la connexion.
- Les logos sont chargés depuis l'adresse indiquée ; un logo HTTP ou introuvable est remplacé par une icône.
- Les favoris et préférences sont propres à chaque navigateur/appareil (pas de synchronisation) ; vider les données du site les efface.
- Retirer un favori depuis la vue Favoris le fait disparaître immédiatement, sans annulation possible.

## Internationalisation (i18n)

L'interface est en **anglais par défaut** ; tous les textes affichés passent par un moteur centralisé.

| Fichier | Rôle |
|---|---|
| `assets/js/i18n.js` | Moteur : `I18N.t()`, `I18N.tn()` (pluriels), `I18N.number()`, `I18N.applyTo()`, `I18N.setLanguage()`, détection, persistance |
| `assets/js/locales/en.js` | Dictionnaire de référence et langue de repli (clés stables : `nav.home`, `player.none`, `error.network`…) |
| `assets/js/locales/<code>.js` | Un dictionnaire par langue ajoutée |

- **HTML statique** : `data-i18n="clé"` (texte) et `data-i18n-aria-label`, `-title`, `-placeholder`, `-content` (attributs). Le texte anglais écrit dans le HTML sert de contenu initial.
- **Texte dynamique (JavaScript)** : `tr('clé', { paramètre })` et `trn('clé', n)` dans `app.js`. Le statut du lecteur mémorise sa clé : il est retraduit au changement de langue sans toucher à l'audio.
- Les traductions sont insérées avec `textContent` / `setAttribute`, jamais `innerHTML`. Une clé absente de la langue choisie est lue en anglais ; absente de l'anglais, elle n'affiche rien (avertissement dans la console).
- **Choix de la langue** : choix enregistré par l'utilisateur (`localStorage`, clé `radio.lang`, valeur `"auto"` ou un code) > langue du navigateur/de l'appareil si elle est disponible > anglais. Un choix manuel n'est jamais remplacé par la détection.
- **Langue de l'interface ≠ langue des stations.** Noms, pays, langues et genres du catalogue (`stations.js`) s'affichent tels quels. Seuls les libellés générés par l'application (activités, familles de genres, « Instrumental (no lyrics) », « Not specified »…) sont traduits.
- Les mots-clés de classement (`THEMES`, `FAMILIES` dans `app.js`) lisent les données du catalogue : ce sont des données de référence, pas des textes d'interface ; ils ne se traduisent pas.

### Ajouter une langue (exemple : français)

1. Copier `assets/js/locales/en.js` en `assets/js/locales/fr.js`.
2. Dans le nouveau fichier, remplacer `I18N.register('en', { nativeName: 'English' }, {` par `I18N.register('fr', { nativeName: 'Français' }, {`, puis traduire **les valeurs** (garder les clés et les `{paramètres}` ; les clés `.one` / `.other` servent aux pluriels).
3. Dans `index.html`, ajouter `<script src="assets/js/locales/fr.js"></script>` juste après celle de `en.js` (avant `stations.js`).
4. Dans `service-worker.js`, ajouter `'./assets/js/locales/fr.js'` à `APP_FILES` et incrémenter `CACHE_VERSION`.
5. C'est tout : la langue apparaît automatiquement dans **Paramètres > Interface language** (le sélecteur est masqué tant qu'une seule langue existe), avec son nom natif, et la détection automatique la prend en compte. Pour une langue qui s'écrit de droite à gauche, il faudra en plus gérer l'attribut `dir`.

Une traduction incomplète est possible : les clés manquantes s'affichent en anglais.

### Tests

`tests/i18n.test.js` (livré à part, non déployé) : DOM simulé avec jsdom, **pas un vrai navigateur**. `cd tests && npm i jsdom && node i18n.test.js <dossier du projet>`.
