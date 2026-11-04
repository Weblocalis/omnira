/*
 * Station catalog. Each entry:
 *   id         unique, stable identifier (favorites and history are stored by id: never change it afterwards)
 *   name       displayed name
 *   country    country in English (a flag is generated from it), or "International"
 *   language   spoken language(s), separated by "/" or ","; "Instrumental" = no lyrics; "Mixed" is not listed as a language
 *   genre      comma-separated genres in English (they are grouped into families on the home page, see FAMILIES in app.js)
 *   streamUrl  direct https audio stream (MP3 / AAC) or an HLS playlist (.m3u8, played with hls.js)
 *   logoUrl    optional: local file in assets/logos/ (preferred) or an https URL
 *   website    optional: official website
 *   themes     optional: force the activities, e.g. ["focus", "work"] (ids: focus, work, sport, relax, sleep, drive, discover, news)
 *
 * Check every new stream with: node tools/check-streams.mjs
 */
window.STATIONS = [
  {
    id: "quran-shuraim",
    name: "Quran — Saud Al-Shuraim",
    country: "Saudi Arabia",
    language: "Arabic",
    genre: "Quran Recitation",
    streamUrl: "https://radio.mp3islam.com/listen/alshuraim/radio.mp3",
    logoUrl: "assets/logos/quran-shuraim.jpg",
    website: "https://qurangallery.com/listen/fr/radio/radio-saud-al-shuraim"
  },
  {
    id: "tarab-radio",
    name: "Tarab Radio",
    country: "Morocco",
    language: "Arabic",
    genre: "Classic Arabic Tarab",
    streamUrl: "https://stream.zeno.fm/fy8achbq97zuv",
    website: "https://www.tarabradio.ma/"
  },
  {
    id: "medina-fm-andalou",
    name: "Medina FM Andalou",
    country: "Morocco",
    language: "Arabic",
    genre: "Arab-Andalusian Music",
    streamUrl: "https://medinaandalou.ice.infomaniak.ch/medinaandalou-128.mp3",
    logoUrl: "assets/logos/medina-fm-andalou.jpg",
    website: "https://medinafm.ma/radio/medina-andalou"
  },
  {
    id: "medina-fm-tarab",
    name: "Medina FM Tarab",
    country: "Morocco",
    language: "Arabic",
    genre: "Classic Oriental Tarab",
    streamUrl: "https://medinatarab.ice.infomaniak.ch/medinatarab-128.mp3",
    logoUrl: "assets/logos/medina-fm-tarab.jpg",
    website: "https://medinafm.ma/"
  },
  {
    id: "nightride-fm",
    name: "Nightride FM",
    country: "International",
    language: "Mixed",
    genre: "Synthwave, Cyberpunk",
    streamUrl: "https://stream.nightride.fm/nightride.mp3",
    logoUrl: "assets/logos/nightride-fm.png",
    website: "https://nightride.fm/"
  },
  {
    id: "nightride-chillsynth",
    name: "Chillsynth FM (Nightride)",
    country: "International",
    language: "Instrumental",
    genre: "Chillsynth, Synthwave",
    streamUrl: "https://stream.nightride.fm/chillsynth.mp3",
    logoUrl: "assets/logos/nightride-chillsynth.png",
    website: "https://nightride.fm/"
  },
  {
    id: "nightride-datawave",
    name: "Datawave FM (Nightride)",
    country: "International",
    language: "Instrumental",
    genre: "Electronic, IDM",
    streamUrl: "https://stream.nightride.fm/datawave.mp3",
    logoUrl: "assets/logos/nightride-datawave.png",
    website: "https://nightride.fm/"
  },
  {
    id: "nightride-spacesynth",
    name: "Spacesynth FM (Nightride)",
    country: "International",
    language: "Instrumental",
    genre: "Spacesynth, Synthwave",
    streamUrl: "https://stream.nightride.fm/spacesynth.mp3",
    logoUrl: "assets/logos/nightride-spacesynth.png",
    website: "https://nightride.fm/"
  },
  {
    id: "bbc-world-service",
    name: "BBC Radio World Service",
    country: "United Kingdom",
    language: "English",
    genre: "International News, Current Affairs",
    streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    logoUrl: "assets/logos/bbc-world-service.png",
    website: "https://www.bbc.co.uk/sounds/play/live/bbc_world_service"
  },
  {
    id: "classic-fm-uk",
    name: "Classic FM",
    country: "United Kingdom",
    language: "English",
    genre: "Classical, Film Scores, Orchestral",
    streamUrl: "https://media-ssl.musicradio.com/ClassicFM",
    logoUrl: "assets/logos/classic-fm-uk.png",
    website: "https://www.globalplayer.com/live/classicfm/"
  },
  {
    id: "kexp-seattle",
    name: "KEXP",
    country: "United States",
    language: "English",
    genre: "Alternative Rock, Indie, Music Discovery",
    streamUrl: "https://kexp.streamguys1.com/kexp160.aac",
    logoUrl: "assets/logos/kexp-seattle.png",
    website: "https://kexp.org/"
  },
  {
    id: "radio-paradise",
    name: "Radio Paradise",
    country: "United States",
    language: "English",
    genre: "Rock, Pop, Eclectic",
    streamUrl: "https://stream.radioparadise.com/mp3-128",
    logoUrl: "assets/logos/radio-paradise.png",
    website: "https://radioparadise.com/"
  },
  {
    id: "code-radio",
    name: "Code Radio (freeCodeCamp)",
    country: "United States",
    language: "Instrumental",
    genre: "Lo-fi & Chillhop, Instrumental",
    streamUrl: "https://coderadio-admin-v2.freecodecamp.org/listen/coderadio/radio.mp3",
    logoUrl: "assets/logos/code-radio.png",
    website: "https://coderadio.freecodecamp.org/"
  },
  {
    id: "deutschlandfunk",
    name: "Deutschlandfunk",
    country: "Germany",
    language: "German",
    genre: "News, Analysis & Debates",
    streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    logoUrl: "assets/logos/deutschlandfunk.png",
    website: "https://www.deutschlandfunk.de/"
  },
  {
    id: "radio-swiss-classic",
    name: "Radio Swiss Classic",
    country: "Switzerland",
    language: "Instrumental",
    genre: "Classical, Relaxation",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128",
    logoUrl: "assets/logos/radio-swiss-classic.png",
    website: "https://radioswissclassic.ch/"
  },
  {
    id: "fip-france",
    name: "FIP",
    country: "France",
    language: "Mixed",
    genre: "Eclectic, Jazz, Rock, Classical & World Music",
    streamUrl: "https://icecast.radiofrance.fr/fip-midfi.mp3",
    logoUrl: "assets/logos/fip-france.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "france-inter",
    name: "France Inter",
    country: "France",
    language: "French",
    genre: "News, Culture & Debates",
    streamUrl: "https://icecast.radiofrance.fr/franceinter-midfi.mp3?id=openapi",
    logoUrl: "assets/logos/france-inter.png",
    website: "https://www.radiofrance.fr/franceinter"
  },
  {
    id: "rtl-france",
    name: "RTL",
    country: "France",
    language: "French",
    genre: "General Interest, News & Entertainment",
    streamUrl: "https://icecast.rtl.fr/rtl-1-44-128",
    logoUrl: "assets/logos/rtl-france.png",
    website: "https://www.rtl.fr/direct"
  },
  {
    id: "franceinfo",
    name: "Franceinfo",
    country: "France",
    language: "French",
    genre: "News & Information",
    streamUrl: "https://icecast.radiofrance.fr/franceinfo-midfi.mp3?id=openapi",
    logoUrl: "assets/logos/franceinfo.png",
    website: "https://www.radiofrance.fr/franceinfo"
  },
  {
    id: "nrj-france",
    name: "NRJ",
    country: "France",
    language: "French",
    genre: "Pop, Hits & Dance",
    streamUrl: "https://streaming.nrjaudio.fm/oufdfatx4thg",
    logoUrl: "assets/logos/nrj-france.png",
    website: "https://www.nrj.fr/"
  },
  {
    id: "france-musique-classique-plus",
    name: "France Musique Classique Plus",
    country: "France",
    language: "French",
    genre: "Classical Music & Orchestras",
    streamUrl: "https://icecast.radiofrance.fr/francemusiqueclassiqueplus-midfi.mp3",
    logoUrl: "assets/logos/france-musique-classique-plus.png",
    website: "https://www.radiofrance.fr/francemusique"
  },
  {
    id: "hotmix-sport-workout",
    name: "Hotmix Sport Workout",
    country: "France",
    language: "Mixed",
    genre: "Sports, Fitness & Energetic Music",
    streamUrl: "https://streaming.hotmixradio.com/hotmix-sport-plus-en-mp3",
    logoUrl: "assets/logos/hotmix-sport-workout.png",
    website: "https://www.hotmixradio.com/"
  },
  {
    id: "france-culture",
    name: "France Culture",
    country: "France",
    language: "French",
    genre: "Culture, Science, Philosophy & Ideas",
    streamUrl: "https://icecast.radiofrance.fr/franceculture-midfi.mp3?id=openapi",
    logoUrl: "assets/logos/france-culture.png",
    website: "https://www.radiofrance.fr/franceculture"
  },
  {
    id: "nostalgie-fr",
    name: "Nostalgie",
    country: "France",
    language: "French",
    genre: "French Variety & Retro Hits",
    streamUrl: "https://streaming.nrjaudio.fm/oug7girb92oc",
    logoUrl: "assets/logos/nostalgie-fr.png",
    website: "https://www.nostalgie.fr/"
  },
  {
    id: "fun-radio-fr",
    name: "Fun Radio",
    country: "France",
    language: "French",
    genre: "Dance, Electronic & Hits",
    streamUrl: "https://icecast.funradio.fr/fun-1-44-128",
    logoUrl: "assets/logos/fun-radio-fr.png",
    website: "https://www.funradio.fr/"
  },
  {
    id: "los40-es",
    name: "LOS40",
    country: "Spain",
    language: "Spanish",
    genre: "Pop, Spanish & International Hits",
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3",
    logoUrl: "assets/logos/los40-es.png",
    website: "https://los40.com/"
  },
  {
    id: "cadena-ser-es",
    name: "Cadena SER",
    country: "Spain",
    language: "Spanish",
    genre: "News, Debates & Sports",
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3",
    logoUrl: "assets/logos/cadena-ser-es.png",
    website: "https://cadenaser.com/"
  },
  {
    id: "cope-es",
    name: "COPE",
    country: "Spain",
    language: "Spanish",
    genre: "News, Debates & Sports",
    streamUrl: "https://madrid-cope-rrcast.flumotion.com/cope/madrid.mp3",
    logoUrl: "assets/logos/cope-es.png",
    website: "https://www.cope.es/"
  },
  {
    id: "deutschlandfunk-kultur-de",
    name: "Deutschlandfunk Kultur",
    country: "Germany",
    language: "German",
    genre: "Culture, Arts, Debates & Music",
    streamUrl: "https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3",
    logoUrl: "assets/logos/deutschlandfunk-kultur-de.png",
    website: "https://www.deutschlandfunkkultur.de/"
  },
  {
    id: "n-joy-de",
    name: "N-JOY",
    country: "Germany",
    language: "German",
    genre: "Pop & Contemporary Hits",
    streamUrl: "https://icecast.ndr.de/ndr/njoy/live/mp3/128/stream.mp3",
    logoUrl: "assets/logos/n-joy-de.png",
    website: "https://www.n-joy.de/"
  },
  {
    id: "radio-deejay-it",
    name: "Radio Deejay",
    country: "Italy",
    language: "Italian",
    genre: "Popular Music & Entertainment",
    streamUrl: "https://streamcdnm4-4c4b867c89244861ac216426883d1ad0.msvdn.net/radiodeejay/radiodeejay/play1.m3u8",
    logoUrl: "assets/logos/radio-deejay-it.png",
    website: "https://www.deejay.it/"
  },
  {
    id: "rai-radio-1-it",
    name: "Rai Radio 1",
    country: "Italy",
    language: "Italian",
    genre: "News, Sports & General Interest",
    streamUrl: "https://radiounoita-live.akamaized.net/hls/live/2032820/radiounoita/radiounoita/playlist.m3u8",
    logoUrl: "assets/logos/rai-radio-1-it.png",
    website: "https://www.raiplaysound.it/"
  },
  {
    id: "npo-radio-2-nl",
    name: "NPO Radio 2",
    country: "Netherlands",
    language: "Dutch",
    genre: "Pop & Classics",
    streamUrl: "https://icecast.omroep.nl/radio2-bb-mp3",
    logoUrl: "assets/logos/npo-radio-2-nl.png",
    website: "https://www.nporadio2.nl/"
  },
  {
    id: "qmusic-nl",
    name: "Qmusic",
    country: "Netherlands",
    language: "Dutch",
    genre: "Hits & Popular Music",
    streamUrl: "https://audio-streaming.qmusic.nl/Qmusic_nl_live_high.aac",
    logoUrl: "assets/logos/qmusic-nl.png",
    website: "https://qmusic.nl/"
  },
  {
    id: "sveriges-radio-p1-se",
    name: "Sveriges Radio Finska",
    country: "Sweden",
    language: "Swedish",
    genre: "News, Society & Culture",
    streamUrl: "https://www.sverigesradio.se/topsy/direkt/srapi/226.mp3",
    logoUrl: "assets/logos/sveriges-radio-p1-se.png",
    website: "https://www.sverigesradio.se/"
  },
  {
    id: "nrk-p1-no",
    name: "NRK P1",
    country: "Norway",
    language: "Norwegian",
    genre: "General Interest & News",
    streamUrl: "https://nrk-live-radio-world.akamaized.net/p1/muxed.m3u8",
    logoUrl: "assets/logos/nrk-p1-no.png",
    website: "https://radio.nrk.no/"
  },
  {
    id: "top-albania-radio",
    name: "Top Albania Radio",
    country: "Albania",
    language: "Albanian",
    genre: "Pop, Top 40 & Entertainment",
    streamUrl: "https://live.top-media.al/tar",
    logoUrl: "assets/logos/top-albania-radio.png",
    website: "https://www.topalbaniaradio.com/"
  },
  {
    id: "club-fm-al",
    name: "Club FM",
    country: "Albania",
    language: "Albanian",
    genre: "Dance, House & Electronic Music",
    streamUrl: "https://cp1.sednastream.com/proxy/clubfm?mp=/stream",
    logoUrl: "assets/logos/club-fm-al.png",
    website: "https://clubfm.al/"
  },
  {
    id: "radio-nacional-andorra",
    name: "Ràdio Nacional d'Andorra",
    country: "Andorra",
    language: "Catalan",
    genre: "News, Current Affairs & General Interest",
    streamUrl: "https://livesg.rtva.hiway.media/restreamer/rtva_client/gpu-f-c0-7/restreamer/outgest/578e48f3-c654-4638-948a-be990c90807b/manifest.m3u8",
    logoUrl: "assets/logos/radio-nacional-andorra.png",
    website: "https://www.rtva.ad/en-directe/rna"
  },
  {
    id: "andorra-musica",
    name: "Andorra Música",
    country: "Andorra",
    language: "Catalan",
    genre: "Pop, Rock & International Music",
    streamUrl: "https://livesg.rtva.hiway.media/restreamer/rtva_client/gpu-g-c0-3/restreamer/outgest/e2b4dcb0-7ae3-4335-992a-23ba82e529b3/manifest.m3u8",
    logoUrl: "assets/logos/andorra-musica.png",
    website: "https://www.rtva.ad/"
  },
  {
    id: "radio-aurora-am",
    name: "Radio Aurora",
    country: "Armenia",
    language: "Armenian",
    genre: "Pop, Top 40 & International Hits",
    streamUrl: "https://de.auroramedia.am/aurora.mp3",
    website: "https://www.radioaurora.am/"
  },
  {
    id: "oe3-at",
    name: "Hitradio Ö3",
    country: "Austria",
    language: "German",
    genre: "Pop, Top 40 & Mainstream Hits",
    streamUrl: "https://orf-live.ors-shoutcast.at/oe3-q1a",
    logoUrl: "assets/logos/oe3-at.png",
    website: "https://oe3.orf.at/"
  },
  {
    id: "oe1-at",
    name: "Ö1",
    country: "Austria",
    language: "German",
    genre: "News, Culture, Classical Music & Documentaries",
    streamUrl: "https://orf-live.ors-shoutcast.at/oe1-q1a",
    logoUrl: "assets/logos/oe1-at.png",
    website: "https://oe1.orf.at/"
  },
  {
    id: "fm4-at",
    name: "FM4",
    country: "Austria",
    language: "German / English",
    genre: "Alternative, Indie, Electronic & Youth Culture",
    streamUrl: "https://orf-live.ors-shoutcast.at/fm4-q1a",
    logoUrl: "assets/logos/fm4-at.png",
    website: "https://fm4.orf.at/"
  },
  {
    id: "yurd-fm-az",
    name: "Yurd FM",
    country: "Azerbaijan",
    language: "Azerbaijani",
    genre: "Azerbaijani Folk & Traditional Music",
    streamUrl: "https://icecast.livetv.az/yurdfm",
    logoUrl: "assets/logos/yurd-fm-az.png",
    website: "https://www.yurdfm.az/"
  },
  {
    id: "europa-plus-ru",
    name: "Europa Plus",
    country: "Russia",
    language: "Russian",
    genre: "Pop, Top 40 & International Hits",
    streamUrl: "https://ep256.hostingradio.ru:8052/europaplus256.mp3",
    website: "https://europaplus.ru/"
  },
  {
    id: "russkoe-radio-ru",
    name: "Russkoe Radio",
    country: "Russia",
    language: "Russian",
    genre: "Russian Pop & Contemporary Music",
    streamUrl: "https://rusradio.hostingradio.ru/rusradio96.aacp",
    website: "https://rusradio.ru/"
  },
  {
    id: "radio-record-ru",
    name: "Radio Record",
    country: "Russia",
    language: "Russian",
    genre: "Electronic, Dance & Club Music",
    streamUrl: "https://radiorecord.hostingradio.ru/rr_main96.aacp",
    logoUrl: "assets/logos/radio-record-ru.png",
    website: "https://radiorecord.ru/"
  }
];

/*
 * Disabled stations (kept for reference, not loaded). Move an entry back into the array above once its stream works over HTTPS.
 *
 * HTTP stream on a raw IP address: blocked on an HTTPS site (mixed content) and not responding.
 * {
 *   id: "radio-tirana-1-al",
 *   name: "Radio Tirana 1",
 *   country: "Albania",
 *   language: "Albanian",
 *   genre: "News, Culture, Talk & Public Broadcasting",
 *   streamUrl: "http://79.106.48.2:8000/radiotirana1",
 *   website: "https://rtsh.al/radio/kanale/radio-tirana-1/"
 * }
 *
 * HTTP stream redirecting to a non-standard port: blocked on an HTTPS site (mixed content).
 * {
 *   id: "araz-fm-az",
 *   name: "Araz FM 103.3",
 *   country: "Azerbaijan",
 *   language: "Azerbaijani",
 *   genre: "Pop, Local Music & Entertainment",
 *   streamUrl: "http://s39.myradiostream.com/5458/listen.mp3",
 *   website: "https://arazfm.az/"
 * }
 *
 * HTTP stream on a raw IP address: blocked on an HTTPS site (mixed content) and not responding.
 * {
 *   id: "asan-radio-az",
 *   name: "ASAN Radio",
 *   country: "Azerbaijan",
 *   language: "Azerbaijani",
 *   genre: "News, Talk & Music",
 *   streamUrl: "http://94.20.74.206:4448/stream1",
 *   website: "https://asanradio.az/"
 * }
 */
