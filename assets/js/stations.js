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
    streamUrl: "https://4c4b867c89244861ac216426883d1ad0.msvdn.net/radiodeejay/radiodeejay/play1.m3u8",
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
  },
  {
    id: "somafm-groovesalad",
    name: "Groove Salad (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Ambient, Downtempo, Chill",
    streamUrl: "https://ice2.somafm.com/groovesalad-128-mp3",
    logoUrl: "assets/logos/somafm-groovesalad.png",
    website: "https://somafm.com/groovesalad/"
  },
  {
    id: "somafm-dronezone",
    name: "Drone Zone (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Ambient, Drone",
    streamUrl: "https://ice2.somafm.com/dronezone-128-mp3",
    logoUrl: "assets/logos/somafm-dronezone.jpg",
    website: "https://somafm.com/dronezone/"
  },
  {
    id: "somafm-deepspaceone",
    name: "Deep Space One (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Ambient, Deep Space",
    streamUrl: "https://ice2.somafm.com/deepspaceone-128-mp3",
    logoUrl: "assets/logos/somafm-deepspaceone.png",
    website: "https://somafm.com/deepspaceone/"
  },
  {
    id: "somafm-spacestation",
    name: "Space Station Soma (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Electronic, Space Ambient",
    streamUrl: "https://ice2.somafm.com/spacestation-128-mp3",
    logoUrl: "assets/logos/somafm-spacestation.jpg",
    website: "https://somafm.com/spacestation/"
  },
  {
    id: "somafm-secretagent",
    name: "Secret Agent (SomaFM)",
    country: "United States",
    language: "Mixed",
    genre: "Lounge, Downtempo, Soundtrack",
    streamUrl: "https://ice2.somafm.com/secretagent-128-mp3",
    logoUrl: "assets/logos/somafm-secretagent.jpg",
    website: "https://somafm.com/secretagent/"
  },
  {
    id: "somafm-lush",
    name: "Lush (SomaFM)",
    country: "United States",
    language: "English",
    genre: "Downtempo, Chill, Female Vocals",
    streamUrl: "https://ice2.somafm.com/lush-128-mp3",
    logoUrl: "assets/logos/somafm-lush.jpg",
    website: "https://somafm.com/lush/"
  },
  {
    id: "somafm-indiepop",
    name: "Indie Pop Rocks! (SomaFM)",
    country: "United States",
    language: "English",
    genre: "Indie Pop, Indie Rock",
    streamUrl: "https://ice2.somafm.com/indiepop-128-mp3",
    logoUrl: "assets/logos/somafm-indiepop.jpg",
    website: "https://somafm.com/indiepop/"
  },
  {
    id: "somafm-u80s",
    name: "Underground 80s (SomaFM)",
    country: "United States",
    language: "English",
    genre: "New Wave, Synthpop, Rock",
    streamUrl: "https://ice2.somafm.com/u80s-128-mp3",
    logoUrl: "assets/logos/somafm-u80s.png",
    website: "https://somafm.com/u80s/"
  },
  {
    id: "somafm-sonicuniverse",
    name: "Sonic Universe (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Jazz, Avant-garde",
    streamUrl: "https://ice2.somafm.com/sonicuniverse-128-mp3",
    logoUrl: "assets/logos/somafm-sonicuniverse.jpg",
    website: "https://somafm.com/sonicuniverse/"
  },
  {
    id: "somafm-fluid",
    name: "Fluid (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Instrumental Hip-hop, Lo-fi",
    streamUrl: "https://ice2.somafm.com/fluid-128-mp3",
    logoUrl: "assets/logos/somafm-fluid.jpg",
    website: "https://somafm.com/fluid/"
  },
  {
    id: "somafm-beatblender",
    name: "Beat Blender (SomaFM)",
    country: "United States",
    language: "Mixed",
    genre: "Deep House, Downtempo, Electronic",
    streamUrl: "https://ice2.somafm.com/beatblender-128-mp3",
    logoUrl: "assets/logos/somafm-beatblender.png",
    website: "https://somafm.com/beatblender/"
  },
  {
    id: "somafm-thistle",
    name: "ThistleRadio (SomaFM)",
    country: "United States",
    language: "Mixed",
    genre: "Celtic, Folk, Traditional",
    streamUrl: "https://ice2.somafm.com/thistle-128-mp3",
    logoUrl: "assets/logos/somafm-thistle.png",
    website: "https://somafm.com/thistle/"
  },
  {
    id: "somafm-suburbsofgoa",
    name: "Suburbs of Goa (SomaFM)",
    country: "United States",
    language: "Mixed",
    genre: "World Music, Asian Electronica",
    streamUrl: "https://ice2.somafm.com/suburbsofgoa-128-mp3",
    logoUrl: "assets/logos/somafm-suburbsofgoa.jpg",
    website: "https://somafm.com/suburbsofgoa/"
  },
  {
    id: "somafm-reggae",
    name: "Heavyweight Reggae (SomaFM)",
    country: "United States",
    language: "English",
    genre: "Reggae, Dub",
    streamUrl: "https://ice2.somafm.com/reggae-128-mp3",
    logoUrl: "assets/logos/somafm-reggae.png",
    website: "https://somafm.com/reggae/"
  },
  {
    id: "somafm-bootliquor",
    name: "Boot Liquor (SomaFM)",
    country: "United States",
    language: "English",
    genre: "Americana, Folk, Rock",
    streamUrl: "https://ice2.somafm.com/bootliquor-128-mp3",
    logoUrl: "assets/logos/somafm-bootliquor.jpg",
    website: "https://somafm.com/bootliquor/"
  },
  {
    id: "somafm-7soul",
    name: "Seven Inch Soul (SomaFM)",
    country: "United States",
    language: "English",
    genre: "Soul, Funk, Vintage",
    streamUrl: "https://ice2.somafm.com/7soul-128-mp3",
    logoUrl: "assets/logos/somafm-7soul.png",
    website: "https://somafm.com/7soul/"
  },
  {
    id: "somafm-defcon",
    name: "DEF CON Radio (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Electronic, Coding, Hacking",
    streamUrl: "https://ice2.somafm.com/defcon-128-mp3",
    logoUrl: "assets/logos/somafm-defcon.png",
    website: "https://somafm.com/defcon/"
  },
  {
    id: "somafm-synphaera",
    name: "Synphaera (SomaFM)",
    country: "United States",
    language: "Instrumental",
    genre: "Ambient, Electronic, Space",
    streamUrl: "https://ice2.somafm.com/synphaera-128-mp3",
    logoUrl: "assets/logos/somafm-synphaera.jpg",
    website: "https://somafm.com/synphaera/"
  },
  {
    id: "somafm-metal",
    name: "Metal Detector (SomaFM)",
    country: "United States",
    language: "English",
    genre: "Metal, Rock",
    streamUrl: "https://ice2.somafm.com/metal-128-mp3",
    logoUrl: "assets/logos/somafm-metal.png",
    website: "https://somafm.com/metal/"
  },
  {
    id: "fip-jazz",
    name: "FIP Jazz",
    country: "France",
    language: "Mixed",
    genre: "Jazz",
    streamUrl: "https://icecast.radiofrance.fr/fipjazz-midfi.mp3",
    logoUrl: "assets/logos/fip-jazz.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-groove",
    name: "FIP Groove",
    country: "France",
    language: "Mixed",
    genre: "Soul, Funk, Hip-hop",
    streamUrl: "https://icecast.radiofrance.fr/fipgroove-midfi.mp3",
    logoUrl: "assets/logos/fip-groove.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-electro",
    name: "FIP Electro",
    country: "France",
    language: "Mixed",
    genre: "Electronic",
    streamUrl: "https://icecast.radiofrance.fr/fipelectro-midfi.mp3",
    logoUrl: "assets/logos/fip-electro.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-reggae",
    name: "FIP Reggae",
    country: "France",
    language: "Mixed",
    genre: "Reggae",
    streamUrl: "https://icecast.radiofrance.fr/fipreggae-midfi.mp3",
    logoUrl: "assets/logos/fip-reggae.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-world",
    name: "FIP Monde",
    country: "France",
    language: "Mixed",
    genre: "World Music",
    streamUrl: "https://icecast.radiofrance.fr/fipworld-midfi.mp3",
    logoUrl: "assets/logos/fip-world.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-rock",
    name: "FIP Rock",
    country: "France",
    language: "Mixed",
    genre: "Rock",
    streamUrl: "https://icecast.radiofrance.fr/fiprock-midfi.mp3",
    logoUrl: "assets/logos/fip-rock.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-nouveautes",
    name: "FIP Nouveautés",
    country: "France",
    language: "Mixed",
    genre: "Eclectic, New Releases",
    streamUrl: "https://icecast.radiofrance.fr/fipnouveautes-midfi.mp3",
    logoUrl: "assets/logos/fip-nouveautes.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-pop",
    name: "FIP Pop",
    country: "France",
    language: "Mixed",
    genre: "Pop",
    streamUrl: "https://icecast.radiofrance.fr/fippop-midfi.mp3",
    logoUrl: "assets/logos/fip-pop.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "fip-metal",
    name: "FIP Metal",
    country: "France",
    language: "Mixed",
    genre: "Metal",
    streamUrl: "https://icecast.radiofrance.fr/fipmetal-midfi.mp3",
    logoUrl: "assets/logos/fip-metal.png",
    website: "https://www.radiofrance.fr/fip"
  },
  {
    id: "radio-paradise-mellow",
    name: "Radio Paradise Mellow",
    country: "United States",
    language: "Mixed",
    genre: "Mellow Rock, Acoustic, Relaxation",
    streamUrl: "https://stream.radioparadise.com/mellow-128",
    logoUrl: "assets/logos/radio-paradise-mellow.png",
    website: "https://radioparadise.com/"
  },
  {
    id: "radio-paradise-rock",
    name: "Radio Paradise Rock",
    country: "United States",
    language: "Mixed",
    genre: "Rock, Classic Rock",
    streamUrl: "https://stream.radioparadise.com/rock-128",
    logoUrl: "assets/logos/radio-paradise-rock.png",
    website: "https://radioparadise.com/"
  },
  {
    id: "radio-paradise-global",
    name: "Radio Paradise Global",
    country: "United States",
    language: "Mixed",
    genre: "World Music, Eclectic",
    streamUrl: "https://stream.radioparadise.com/global-128",
    logoUrl: "assets/logos/radio-paradise-global.png",
    website: "https://radioparadise.com/"
  },
  {
    id: "france-musique",
    name: "France Musique",
    country: "France",
    language: "French",
    genre: "Classical, Jazz, Culture",
    streamUrl: "https://icecast.radiofrance.fr/francemusique-midfi.mp3",
    logoUrl: "assets/logos/france-musique.png",
    website: "https://www.radiofrance.fr/francemusique"
  },
  {
    id: "france-musique-baroque",
    name: "France Musique Baroque",
    country: "France",
    language: "Instrumental",
    genre: "Classical, Baroque",
    streamUrl: "https://icecast.radiofrance.fr/francemusiquebaroque-midfi.mp3",
    logoUrl: "assets/logos/france-musique-baroque.png",
    website: "https://www.radiofrance.fr/francemusique"
  },
  {
    id: "france-musique-jazz",
    name: "France Musique La Jazz",
    country: "France",
    language: "Instrumental",
    genre: "Jazz",
    streamUrl: "https://icecast.radiofrance.fr/francemusiquelajazz-midfi.mp3",
    logoUrl: "assets/logos/france-musique-jazz.png",
    website: "https://www.radiofrance.fr/francemusique"
  },
  {
    id: "mouv",
    name: "Mouv'",
    country: "France",
    language: "French",
    genre: "Hip-hop, Rap, R&B",
    streamUrl: "https://icecast.radiofrance.fr/mouv-midfi.mp3",
    logoUrl: "assets/logos/mouv.png",
    website: "https://www.radiofrance.fr/mouv"
  },
  {
    id: "radio-nova",
    name: "Radio Nova",
    country: "France",
    language: "French",
    genre: "Eclectic, Soul, Hip-hop, World Music",
    streamUrl: "https://novazz.ice.infomaniak.ch/novazz-128.mp3",
    logoUrl: "assets/logos/radio-nova.png",
    website: "https://www.nova.fr/"
  },
  {
    id: "tsf-jazz",
    name: "TSF Jazz",
    country: "France",
    language: "French",
    genre: "Jazz",
    streamUrl: "https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3",
    logoUrl: "assets/logos/tsf-jazz.png",
    website: "https://www.tsfjazz.com/"
  },
  {
    id: "radio-classique",
    name: "Radio Classique",
    country: "France",
    language: "French",
    genre: "Classical",
    streamUrl: "https://radioclassique.ice.infomaniak.ch/radioclassique-high.mp3",
    logoUrl: "assets/logos/radio-classique.png",
    website: "https://www.radioclassique.fr/"
  },
  {
    id: "radio-swiss-jazz",
    name: "Radio Swiss Jazz",
    country: "Switzerland",
    language: "Instrumental",
    genre: "Jazz, Blues, Soul",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/rsj/mp3/128",
    logoUrl: "assets/logos/radio-swiss-jazz.png",
    website: "https://www.radioswissjazz.ch/"
  },
  {
    id: "radio-swiss-pop",
    name: "Radio Swiss Pop",
    country: "Switzerland",
    language: "Mixed",
    genre: "Pop, Soft Rock",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/rsp/mp3/128",
    logoUrl: "assets/logos/radio-swiss-pop.png",
    website: "https://www.radioswisspop.ch/"
  },
  {
    id: "wqxr",
    name: "WQXR",
    country: "United States",
    language: "English",
    genre: "Classical",
    streamUrl: "https://stream.wqxr.org/wqxr",
    website: "https://www.wqxr.org/"
  },
  {
    id: "ambient-sleeping-pill",
    name: "Ambient Sleeping Pill",
    country: "International",
    language: "Instrumental",
    genre: "Ambient, Sleep",
    streamUrl: "https://radio.stereoscenic.com/asp-h",
    logoUrl: "assets/logos/ambient-sleeping-pill.png",
    website: "https://ambientsleepingpill.com/"
  },
  {
    id: "venice-classic-radio",
    name: "Venice Classic Radio",
    country: "Italy",
    language: "Instrumental",
    genre: "Classical",
    streamUrl: "https://uk2.streamingpulse.com/ssl/vcr1",
    logoUrl: "assets/logos/venice-classic-radio.png",
    website: "https://www.veniceclassicradio.eu/"
  },
  {
    id: "hit-radio-ma",
    name: "Hit Radio",
    country: "Morocco",
    language: "Arabic / French",
    genre: "Pop, Hits, Rap",
    streamUrl: "https://hitradio-maroc.ice.infomaniak.ch/hitradio-maroc-128.mp3",
    logoUrl: "assets/logos/hit-radio-ma.png",
    website: "https://www.hitradio.ma/"
  },
  {
    id: "monte-carlo-doualiya",
    name: "Monte Carlo Doualiya",
    country: "France",
    language: "Arabic",
    genre: "News, Culture, Arabic Music",
    streamUrl: "https://montecarlodoualiya128k.ice.infomaniak.ch/mc-doualiya.mp3",
    logoUrl: "assets/logos/monte-carlo-doualiya.png",
    website: "https://www.mc-doualiya.com/"
  },
  {
    id: "rfi-monde",
    name: "RFI Monde",
    country: "France",
    language: "French",
    genre: "International News, Current Affairs",
    streamUrl: "https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3",
    logoUrl: "assets/logos/rfi-monde.png",
    website: "https://www.rfi.fr/"
  },
  {
    id: "radio-eins",
    name: "radioeins",
    country: "Germany",
    language: "German",
    genre: "Alternative, Pop, Rock",
    streamUrl: "https://dispatcher.rndfnk.com/rbb/radioeins/live/mp3/mid",
    logoUrl: "assets/logos/radio-eins.png",
    website: "https://www.radioeins.de/"
  },
  {
    id: "rtbf-classic-21",
    name: "Classic 21",
    country: "Belgium",
    language: "French",
    genre: "Rock, Pop & Classic Rock",
    streamUrl: "https://radios.rtbf.be/classic21-128.mp3",
    logoUrl: "assets/logos/rtbf-classic-21.png",
    website: "https://www.rtbf.be/classic21"
  },
  {
    id: "rtbf-la-premiere",
    name: "La Première",
    country: "Belgium",
    language: "French",
    genre: "News, Culture & Debates",
    streamUrl: "https://radios.rtbf.be/laprem1ere-128.mp3",
    logoUrl: "assets/logos/rtbf-la-premiere.png",
    website: "https://www.rtbf.be/lapremiere"
  },
  {
    id: "rtbf-musiq3",
    name: "Musiq3",
    country: "Belgium",
    language: "French",
    genre: "Classical & Jazz",
    streamUrl: "https://radios.rtbf.be/musiq3-128.mp3",
    logoUrl: "assets/logos/rtbf-musiq3.png",
    website: "https://www.rtbf.be/musiq3"
  },
  {
    id: "rtbf-tarmac",
    name: "Tarmac",
    country: "Belgium",
    language: "French",
    genre: "Hip-hop, Rap & Urban",
    streamUrl: "https://radios.rtbf.be/tarmac-128.mp3",
    logoUrl: "assets/logos/rtbf-tarmac.png",
    website: "https://www.rtbf.be/tarmac"
  },
  {
    id: "rts-couleur-3",
    name: "Couleur 3",
    country: "Switzerland",
    language: "French",
    genre: "Alternative, Indie, Rock & Electronic",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/couleur3/mp3/128",
    logoUrl: "assets/logos/rts-couleur-3.png",
    website: "https://www.rts.ch/couleur3/"
  },
  {
    id: "rts-la-1ere",
    name: "RTS La 1ère",
    country: "Switzerland",
    language: "French",
    genre: "News, Culture & Debates",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/la-1ere/mp3/128",
    logoUrl: "assets/logos/rts-la-1ere.png",
    website: "https://www.rts.ch/la-1ere/"
  },
  {
    id: "rts-espace-2",
    name: "Espace 2",
    country: "Switzerland",
    language: "French",
    genre: "Classical & Culture",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/espace-2/mp3/128",
    logoUrl: "assets/logos/rts-espace-2.png",
    website: "https://www.rts.ch/espace-2/"
  },
  {
    id: "rts-option-musique",
    name: "Option Musique",
    country: "Switzerland",
    language: "French",
    genre: "French Variety, Pop & Chanson",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/option-musique/mp3/128",
    logoUrl: "assets/logos/rts-option-musique.png",
    website: "https://www.rts.ch/option-musique/"
  },
  {
    id: "rte-radio-1",
    name: "RTÉ Radio 1",
    country: "Ireland",
    language: "English",
    genre: "News, Talk & Culture",
    streamUrl: "https://icecast2.rte.ie/radio1",
    logoUrl: "assets/logos/rte-radio-1.png",
    website: "https://www.rte.ie/radio1/"
  },
  {
    id: "rte-lyric-fm",
    name: "RTÉ Lyric FM",
    country: "Ireland",
    language: "English",
    genre: "Classical, Orchestral & Jazz",
    streamUrl: "https://icecast2.rte.ie/lyric",
    logoUrl: "assets/logos/rte-lyric-fm.png",
    website: "https://www.rte.ie/lyricfm/"
  },
  {
    id: "rte-2fm",
    name: "RTÉ 2FM",
    country: "Ireland",
    language: "English",
    genre: "Pop, Hits & Dance",
    streamUrl: "https://icecast2.rte.ie/2fm",
    logoUrl: "assets/logos/rte-2fm.png",
    website: "https://www.rte.ie/2fm/"
  },
  {
    id: "cosmo-de",
    name: "COSMO",
    country: "Germany",
    language: "German",
    genre: "World Music, Global Pop & Urban",
    streamUrl: "https://wdr-cosmo-live.icecast.wdr.de/wdr/cosmo/live/mp3/128/stream.mp3",
    logoUrl: "assets/logos/cosmo-de.png",
    website: "https://www.wdr.de/kultur/radios/cosmo/"
  },
  {
    id: "swr3-de",
    name: "SWR3",
    country: "Germany",
    language: "German",
    genre: "Pop, Contemporary Hits & Rock",
    streamUrl: "https://liveradio.swr.de/sw282p3/swr3/mp3/128/stream.mp3",
    logoUrl: "assets/logos/swr3-de.png",
    website: "https://www.swr3.de/"
  },
  {
    id: "br-klassik-de",
    name: "BR-Klassik",
    country: "Germany",
    language: "German",
    genre: "Classical, Opera & Orchestral",
    streamUrl: "https://dispatcher.rndfnk.com/br/brklassik/live/mp3/mid",
    logoUrl: "assets/logos/br-klassik-de.png",
    website: "https://www.br-klassik.de/"
  },
  {
    id: "wnyc-fm",
    name: "WNYC-FM",
    country: "United States",
    language: "English",
    genre: "News, Culture & Debates",
    streamUrl: "https://fm939.wnyc.org/wnycfm",
    logoUrl: "assets/logos/wnyc-fm.png",
    website: "https://www.wnyc.org/"
  },
  {
    id: "dublab",
    name: "dublab",
    country: "United States",
    language: "English",
    genre: "Electronic, Ambient, Experimental & Eclectic",
    streamUrl: "https://dublab.out.airtime.pro/dublab_a",
    logoUrl: "assets/logos/dublab.png",
    website: "https://www.dublab.com/"
  },
  {
    id: "ici-musique-quebec",
    name: "ICI Musique",
    country: "Canada",
    language: "French",
    genre: "Eclectic, Jazz, Classical & Francophone",
    streamUrl: "https://rcavliveaudio.akamaized.net/hls/live/2006635/P-2QMT0_MTL/master.m3u8",
    logoUrl: "assets/logos/ici-musique-quebec.png",
    website: "https://ici.radio-canada.ca/ohdio/musique"
  },
  {
    id: "ici-premiere-montreal",
    name: "ICI Première",
    country: "Canada",
    language: "French",
    genre: "News, Culture, Society & Debates",
    streamUrl: "https://rcavliveaudio.akamaized.net/hls/live/2006635/P-2QPR0_MTL/master.m3u8",
    logoUrl: "assets/logos/ici-premiere-montreal.png",
    website: "https://ici.radio-canada.ca/premiere"
  },
  {
    id: "ouifm",
    name: "OÜI FM",
    country: "France",
    language: "French",
    genre: "Rock, Alternative & Indie",
    streamUrl: "https://ouifm.ice.infomaniak.ch/ouifm-high.mp3",
    logoUrl: "assets/logos/ouifm.png",
    website: "https://www.ouifm.fr/"
  },
  {
    id: "rfi-english",
    name: "RFI English",
    country: "France",
    language: "English",
    genre: "International News & Current Affairs",
    streamUrl: "https://rfienanglais64k.ice.infomaniak.ch/rfienanglais-64.mp3",
    logoUrl: "assets/logos/rfi-english.png",
    website: "https://www.rfi.fr/en/"
  },
  {
    id: "npo-klassiek",
    name: "NPO Klassiek",
    country: "Netherlands",
    language: "Dutch",
    genre: "Classical & Orchestral",
    streamUrl: "https://icecast.omroep.nl/radio4-bb-mp3",
    logoUrl: "assets/logos/npo-klassiek.png",
    website: "https://www.npoklassiek.nl/"
  },
  {
    id: "npo-3fm",
    name: "NPO 3FM",
    country: "Netherlands",
    language: "Dutch",
    genre: "Alternative, Pop & Rock",
    streamUrl: "https://icecast.omroep.nl/3fm-bb-mp3",
    logoUrl: "assets/logos/npo-3fm.png",
    website: "https://www.npo3fm.nl/"
  },
  {
    id: "rmc-fr",
    name: "RMC",
    country: "France",
    language: "French",
    genre: "News, Talk & Sports",
    streamUrl: "https://audio.bfmtv.com/rmcradio_128.mp3",
    website: "https://rmc.bfmtv.com/"
  },
  {
    id: "europe-1-fr",
    name: "Europe 1",
    country: "France",
    language: "French",
    genre: "News, Talk & Current Affairs",
    streamUrl: "https://europe1.lmn.fm/europe1.mp3",
    website: "https://www.europe1.fr/"
  },
  {
    id: "cherie-fm-fr",
    name: "Chérie FM",
    country: "France",
    language: "French",
    genre: "Pop, Romantic Hits & Variety",
    streamUrl: "https://streaming.nrjaudio.fm/ou2n2epw5hs7",
    website: "https://www.cheriefm.fr/"
  },
  {
    id: "skyrock-fr",
    name: "Skyrock",
    country: "France",
    language: "French",
    genre: "Rap, Hip-hop & R&B",
    streamUrl: "https://icecast.skyrock.net/s/natio_mp3_128k",
    website: "https://skyrock.fm/"
  },
  {
    id: "rtl2-fr",
    name: "RTL2",
    country: "France",
    language: "French",
    genre: "Pop-Rock",
    streamUrl: "https://icecast.rtl2.fr/rtl2-1-44-128",
    website: "https://www.rtl2.fr/"
  },
  {
    id: "radio-meuh-fr",
    name: "Radio Meuh",
    country: "France",
    language: "Mixed",
    genre: "Eclectic, Groove, Funk & Electronic",
    streamUrl: "https://radiomeuh.ice.infomaniak.ch/radiomeuh-128.mp3",
    website: "https://www.radiomeuh.com/"
  },
  {
    id: "medi1-radio-ma",
    name: "Medi 1 Radio",
    country: "Morocco",
    language: "Arabic / French",
    genre: "News, Culture & Maghreb Hits",
    streamUrl: "https://cdn.live.easybroadcast.io/live/83_medi1radio-maghreb_8s9i4bn/playlist.m3u8",
    website: "https://www.medi1.com/"
  },
  {
    id: "radio-mars-ma",
    name: "Radio Mars",
    country: "Morocco",
    language: "Arabic / French",
    genre: "Sports, News & Moroccan Music",
    streamUrl: "https://radiomars.ice.infomaniak.ch/radiomars-128.mp3",
    website: "https://www.radiomars.ma/"
  },
  {
    id: "aswat-ma",
    name: "Radio Aswat",
    country: "Morocco",
    language: "Arabic",
    genre: "News, Talk & Moroccan Hits",
    streamUrl: "https://aswat.ice.infomaniak.ch/aswat-high.mp3",
    website: "https://www.radioaswat.ma/"
  },
  {
    id: "atlantic-radio-ma",
    name: "Atlantic Radio",
    country: "Morocco",
    language: "French / Arabic",
    genre: "News, Economy & Culture",
    streamUrl: "https://atlantic-sonic.nindohost.net:9300/stream",
    website: "https://www.atlanticradio.ma/"
  },
  {
    id: "capital-fm-uk",
    name: "Capital FM",
    country: "United Kingdom",
    language: "English",
    genre: "Pop, Top 40 & Hits",
    streamUrl: "https://media-ssl.musicradio.com/CapitalUK",
    website: "https://www.capitalfm.com/"
  },
  {
    id: "heart-uk",
    name: "Heart",
    country: "United Kingdom",
    language: "English",
    genre: "Pop, Variety & Feel Good Hits",
    streamUrl: "https://media-ssl.musicradio.com/HeartUK",
    website: "https://www.heart.co.uk/"
  },
  {
    id: "lbc-uk",
    name: "LBC",
    country: "United Kingdom",
    language: "English",
    genre: "News, Debate & Talk",
    streamUrl: "https://media-ssl.musicradio.com/LBCUK",
    website: "https://www.lbc.co.uk/"
  },
  {
    id: "smooth-radio-uk",
    name: "Smooth Radio",
    country: "United Kingdom",
    language: "English",
    genre: "Relaxing, Soul, Pop & Classics",
    streamUrl: "https://media-ssl.musicradio.com/SmoothUK",
    website: "https://www.smoothradio.com/"
  },
  {
    id: "radio-x-uk",
    name: "Radio X",
    country: "United Kingdom",
    language: "English",
    genre: "Rock, Indie & Alternative",
    streamUrl: "https://media-ssl.musicradio.com/RadioXUK",
    website: "https://www.radiox.co.uk/"
  },
  {
    id: "gold-radio-uk",
    name: "Gold",
    country: "United Kingdom",
    language: "English",
    genre: "Classic Hits, 60s, 70s & 80s",
    streamUrl: "https://media-ssl.musicradio.com/Gold",
    website: "https://www.mygoldmusic.co.uk/"
  },
  {
    id: "radio-105-it",
    name: "Radio 105",
    country: "Italy",
    language: "Italian",
    genre: "Pop, Dance & Entertainment",
    streamUrl: "https://icecast.unitedradio.it/Radio105.mp3",
    website: "https://www.105.net/"
  },
  {
    id: "virgin-radio-it",
    name: "Virgin Radio Italy",
    country: "Italy",
    language: "Italian",
    genre: "Rock, Classic Rock & Hard Rock",
    streamUrl: "https://icecast.unitedradio.it/Virgin.mp3",
    website: "https://www.virginradio.it/"
  },
  {
    id: "radio-monte-carlo-it",
    name: "Radio Monte Carlo",
    country: "Italy",
    language: "Italian",
    genre: "Lounge, Pop & Soul",
    streamUrl: "https://icecast.unitedradio.it/RMC.mp3",
    website: "https://www.radiomontecarlo.net/"
  },
  {
    id: "1live-de",
    name: "1LIVE",
    country: "Germany",
    language: "German",
    genre: "Pop, Hits & Youth",
    streamUrl: "https://wdr-1live-live.icecast.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
    website: "https://www1.wdr.de/radio/1live/"
  },
  {
    id: "bayern-3-de",
    name: "Bayern 3",
    country: "Germany",
    language: "German",
    genre: "Pop & Contemporary Hits",
    streamUrl: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid",
    website: "https://www.bayern3.de/"
  },
  {
    id: "swr1-bw-de",
    name: "SWR1 Baden-Württemberg",
    country: "Germany",
    language: "German",
    genre: "Pop, Rock & Classics",
    streamUrl: "https://liveradio.swr.de/sw282p3/swr1bw/mp3/128/stream.mp3",
    website: "https://www.swr.de/swr1/bw/"
  },
  {
    id: "wdr5-de",
    name: "WDR 5",
    country: "Germany",
    language: "German",
    genre: "News, Culture & Debates",
    streamUrl: "https://wdr-wdr5-live.icecast.wdr.de/wdr/wdr5/live/mp3/128/stream.mp3",
    website: "https://www1.wdr.de/radio/wdr5/"
  },
  {
    id: "srf-1-ch",
    name: "Radio SRF 1",
    country: "Switzerland",
    language: "German",
    genre: "General Interest, News & Culture",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/srf1/mp3/128",
    website: "https://www.srf.ch/radio-srf-1"
  },
  {
    id: "srf-3-ch",
    name: "Radio SRF 3",
    country: "Switzerland",
    language: "German",
    genre: "Pop, Rock & Contemporary Hits",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/srf3/mp3/128",
    website: "https://www.srf.ch/radio-srf-3"
  },
  {
    id: "srf-4-news-ch",
    name: "Radio SRF 4 News",
    country: "Switzerland",
    language: "German",
    genre: "News & Information",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/srf4news/mp3/128",
    website: "https://www.srf.ch/radio-srf-4-news"
  },
  {
    id: "srf-virus-ch",
    name: "Radio SRF Virus",
    country: "Switzerland",
    language: "German",
    genre: "Alternative, Indie & Urban",
    streamUrl: "https://stream.srg-ssr.ch/srgssr/srfvirus/mp3/128",
    website: "https://www.srf.ch/radio-srf-virus"
  },
  {
    id: "cadena-dial-es",
    name: "Cadena Dial",
    country: "Spain",
    language: "Spanish",
    genre: "Pop, Spanish Music & Variety",
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENADIAL.mp3",
    website: "https://www.cadenadial.com/"
  },
  {
    id: "radiola-es",
    name: "Radiolé",
    country: "Spain",
    language: "Spanish",
    genre: "Spanish Music, Flamenco & Pop",
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOLE.mp3",
    website: "https://www.radiole.com/"
  },
  {
    id: "sveriges-radio-p1",
    name: "Sveriges Radio P1",
    country: "Sweden",
    language: "Swedish",
    genre: "News, Talk, Culture & Documentaries",
    streamUrl: "https://sverigesradio.se/topsy/direkt/srapi/132.mp3",
    website: "https://sverigesradio.se/p1"
  },
  {
    id: "sveriges-radio-p2",
    name: "Sveriges Radio P2",
    country: "Sweden",
    language: "Swedish",
    genre: "Classical, Jazz & Folk",
    streamUrl: "https://sverigesradio.se/topsy/direkt/srapi/163.mp3",
    website: "https://sverigesradio.se/p2"
  },
  {
    id: "sveriges-radio-p3",
    name: "Sveriges Radio P3",
    country: "Sweden",
    language: "Swedish",
    genre: "Pop, Alternative & Youth Culture",
    streamUrl: "https://sverigesradio.se/topsy/direkt/srapi/164.mp3",
    website: "https://sverigesradio.se/p3"
  },
  {
    id: "sveriges-radio-p4",
    name: "Sveriges Radio P4 Stockholm",
    country: "Sweden",
    language: "Swedish",
    genre: "News, Talk & Popular Music",
    streamUrl: "https://sverigesradio.se/topsy/direkt/srapi/701.mp3",
    website: "https://sverigesradio.se/p4stockholm"
  },
  {
    id: "nrk-p2",
    name: "NRK P2",
    country: "Norway",
    language: "Norwegian",
    genre: "Culture, News & Society",
    streamUrl: "https://nrk-live-radio-world.akamaized.net/p2/muxed.m3u8",
    website: "https://radio.nrk.no/direkte/p2"
  },
  {
    id: "nrk-p3",
    name: "NRK P3",
    country: "Norway",
    language: "Norwegian",
    genre: "Pop, Youth & Contemporary Hits",
    streamUrl: "https://nrk-live-radio-world.akamaized.net/p3/muxed.m3u8",
    website: "https://radio.nrk.no/direkte/p3"
  },
  {
    id: "nrk-klassisk",
    name: "NRK Klassisk",
    country: "Norway",
    language: "Norwegian",
    genre: "Classical & Orchestral",
    streamUrl: "https://nrk-live-radio-world.akamaized.net/klassisk/muxed.m3u8",
    website: "https://radio.nrk.no/direkte/klassisk"
  },
  {
    id: "nrk-alltid-nyheter",
    name: "NRK Alltid Nyheter",
    country: "Norway",
    language: "Norwegian",
    genre: "News & Continuous Information",
    streamUrl: "https://nrk-live-radio-world.akamaized.net/nyheter/muxed.m3u8",
    website: "https://radio.nrk.no/direkte/alltid_nyheter"
  },
  {
    id: "antena-1-pt",
    name: "Antena 1",
    country: "Portugal",
    language: "Portuguese",
    genre: "News, Talk & Culture",
    streamUrl: "https://streaming-live.rtp.pt/liveradio/antena180a/playlist.m3u8",
    website: "https://www.rtp.pt/antena1/"
  },
  {
    id: "antena-3-pt",
    name: "Antena 3",
    country: "Portugal",
    language: "Portuguese",
    genre: "Alternative, Indie & Portuguese Music",
    streamUrl: "https://streaming-live.rtp.pt/liveradio/antena380a/playlist.m3u8",
    website: "https://www.rtp.pt/antena3/"
  },
  {
    id: "quran-sudais",
    name: "Quran — Abdulrahman Alsudais",
    country: "Saudi Arabia",
    language: "Arabic",
    genre: "Quran Recitation",
    streamUrl: "https://radio.mp3islam.com/listen/sudais/radio.mp3",
    website: "https://mp3islam.com/"
  },
  {
    id: "power-turk-tr",
    name: "Power Türk",
    country: "Turkey",
    language: "Turkish",
    genre: "Pop & Turkish Hits",
    streamUrl: "https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio",
    website: "https://www.powerapp.com.tr/powerturk/"
  },
  {
    id: "power-fm-tr",
    name: "Power FM",
    country: "Turkey",
    language: "Turkish",
    genre: "Pop, Top 40 & Dance",
    streamUrl: "https://listen.powerapp.com.tr/powerfm/mpeg/icecast.audio",
    website: "https://www.powerapp.com.tr/powerfm/"
  },
  {
    id: "nhk-world-jp",
    name: "NHK World Radio",
    country: "Japan",
    language: "Japanese / English",
    genre: "International News & Culture",
    streamUrl: "https://nhkworld-radio.nhkworld.jp/hls/live/nhkworld-radio-media2/index.m3u8",
    website: "https://www3.nhk.or.jp/nhkworld/"
  },
  {
    id: "band-fm-br",
    name: "Band FM",
    country: "Brazil",
    language: "Portuguese",
    genre: "Pop, Pagode & Brazilian Hits",
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/BANDFM_SPAAC.m3u8",
    website: "https://www.band.uol.com.br/band-fm"
  },
  {
    id: "super-radio-tupi-br",
    name: "Super Rádio Tupi",
    country: "Brazil",
    language: "Portuguese",
    genre: "News, Talk & Sports",
    streamUrl: "https://8923.brasilstream.com.br/stream",
    website: "https://www.tupi.fm/"
  },
  {
    id: "rmf-fm-pl",
    name: "RMF FM",
    country: "Poland",
    language: "Polish",
    genre: "Pop, Hits & Information",
    streamUrl: "https://rs101-krk.rmfstream.pl/RMFFM48",
    website: "https://www.rmf.fm/"
  },
  {
    id: "real-fm-gr",
    name: "Real FM 97.8",
    country: "Greece",
    language: "Greek",
    genre: "News, Talk & Current Affairs",
    streamUrl: "https://realfm.live24.gr/realfm",
    website: "https://www.real.gr/"
  },
  {
    id: "cjad-800-ca",
    name: "CJAD 800",
    country: "Canada",
    language: "English",
    genre: "News, Talk & Information",
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CJADAM.mp3",
    website: "https://www.iheartradio.ca/cjad-800"
  },
  {
    id: "kiss-fm-am",
    name: "Kiss FM Armenia",
    country: "Armenia",
    language: "Armenian",
    genre: "Dance, Pop & Electronic",
    streamUrl: "https://am.radioaurora.am/kiss",
    website: "https://kissfm.am/"
  },
  {
    id: "jazz-fm-yerevan-am",
    name: "Jazz FM 106.9 Yerevan",
    country: "Armenia",
    language: "Instrumental",
    genre: "Jazz & Blues",
    streamUrl: "https://de.auroramedia.am/jazz.mp3",
    website: "https://auroramedia.am/"
  },
  {
    id: "anti-radio-az",
    name: "Anti Radio",
    country: "Azerbaijan",
    language: "Azerbaijani",
    genre: "Rock, Alternative & Indie",
    streamUrl: "https://stream.antiradio.net/radio/8000/mp3",
    website: "https://antiradio.net/"
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
