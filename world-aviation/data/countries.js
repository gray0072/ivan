'use strict';

// ============================================================
// World Aviation — the countries of the airports
// flag:  how art/flags.js draws the national flag
//          ['h', colours, weights?]   horizontal stripes (top first)
//          ['v', colours, weights?]   vertical stripes (hoist first)
//          ['nordic', field, cross, inner cross?]
//          [name]                     a drawing of its own (Flags.special)
// hello: "welcome" in the local language, under the English one on
//        the terminal banner (scenery, like a real airport sign)
// tz:    the standard time's offset from UTC in hours (no summer time);
//        an airport in another zone of a big country has its own tz
// ============================================================

const COUNTRIES = {
  'Sweden': { flag: ['nordic', '#006aa7', '#fecc00'], tz: 1, hello: 'Välkommen' },
  'Norway': { flag: ['nordic', '#ba0c2f', '#ffffff', '#00205b'], tz: 1, hello: 'Velkommen' },
  'Svalbard': { flag: ['nordic', '#ba0c2f', '#ffffff', '#00205b'], tz: 1, hello: 'Velkommen' },
  'Finland': { flag: ['nordic', '#ffffff', '#002f6c'], tz: 2, hello: 'Tervetuloa' },
  'Denmark': { flag: ['nordic', '#c8102e', '#ffffff'], tz: 1, hello: 'Velkommen' },
  'Iceland': { flag: ['nordic', '#02529c', '#ffffff', '#dc1e35'], tz: 0, hello: 'Velkomin' },
  'Faroe Islands': { flag: ['nordic', '#ffffff', '#0065bd', '#ef303e'], tz: 0, hello: 'Vælkomin' },
  'Greenland': { flag: ['greenland'], tz: -2, hello: 'Tikilluarit' },
  'United Kingdom': { flag: ['uk'], tz: 0, hello: 'Welcome' },
  'Ireland': { flag: ['v', ['#169b62', '#ffffff', '#ff883e']], tz: 0, hello: 'Fáilte' },
  'Netherlands': { flag: ['h', ['#ae1c28', '#ffffff', '#21468b']], tz: 1, hello: 'Welkom' },
  'Belgium': { flag: ['v', ['#000000', '#fdda24', '#ef3340']], tz: 1, hello: 'Welkom · Bienvenue' },
  'France': { flag: ['v', ['#0055a4', '#ffffff', '#ef4135']], tz: 1, hello: 'Bienvenue' },
  'Germany': { flag: ['h', ['#000000', '#dd0000', '#ffce00']], tz: 1, hello: 'Willkommen' },
  'Switzerland': { flag: ['swiss'], tz: 1, hello: 'Willkommen · Bienvenue' },
  'Austria': { flag: ['h', ['#c8102e', '#ffffff', '#c8102e']], tz: 1, hello: 'Willkommen' },
  'Czechia': { flag: ['czech'], tz: 1, hello: 'Vítejte' },
  'Poland': { flag: ['h', ['#ffffff', '#dc143c']], tz: 1, hello: 'Witamy' },
  'Latvia': { flag: ['h', ['#9e3039', '#ffffff', '#9e3039'], [2, 1, 2]], tz: 2, hello: 'Laipni lūdzam' },
  'Estonia': { flag: ['h', ['#0072ce', '#000000', '#ffffff']], tz: 2, hello: 'Tere tulemast' },
  'Hungary': { flag: ['h', ['#ce2939', '#ffffff', '#477050']], tz: 1, hello: 'Üdvözöljük' },
  'Italy': { flag: ['v', ['#009246', '#ffffff', '#ce2b37']], tz: 1, hello: 'Benvenuti' },
  'Spain': { flag: ['h', ['#aa151b', '#f1bf00', '#aa151b'], [1, 2, 1]], tz: 1, hello: 'Bienvenidos' },
  'Portugal': { flag: ['portugal'], tz: 0, hello: 'Bem-vindos' },
  'Greece': { flag: ['greece'], tz: 2, hello: 'Kalós írthate' },
  'Turkey': { flag: ['turkey'], tz: 3, hello: 'Hoş geldiniz' },
  'Russia': { flag: ['h', ['#ffffff', '#0039a6', '#d52b1e']], tz: 3, hello: 'Dobro pozhalovat' },
  'Israel': { flag: ['israel'], tz: 2, hello: 'Bruchim haba\'im' },
  'Egypt': { flag: ['egypt'], tz: 2, hello: 'Ahlan wa sahlan' },
  'United Arab Emirates': { flag: ['uae'], tz: 4, hello: 'Ahlan wa sahlan' },
  'Qatar': { flag: ['qatar'], tz: 3, hello: 'Ahlan wa sahlan' },
  'Morocco': { flag: ['morocco'], tz: 1, hello: 'Marhaba' },
  'Ethiopia': { flag: ['ethiopia'], tz: 3, hello: 'Enkwan dehna metu' },
  'Kenya': { flag: ['kenya'], tz: 3, hello: 'Karibu' },
  'South Africa': { flag: ['southafrica'], tz: 2, hello: 'Welkom · Siyakwamukela' },
  'Nigeria': { flag: ['v', ['#008751', '#ffffff', '#008751']], tz: 1, hello: 'Kaabo' },
  'United States': { flag: ['us'], tz: -5, hello: 'Welcome' },
  'Canada': { flag: ['canada'], tz: -5, hello: 'Welcome · Bienvenue' },
  'Mexico': { flag: ['mexico'], tz: -6, hello: 'Bienvenidos' },
  'Colombia': { flag: ['h', ['#fcd116', '#003893', '#ce1126'], [2, 1, 1]], tz: -5, hello: 'Bienvenidos' },
  'Peru': { flag: ['v', ['#d91023', '#ffffff', '#d91023']], tz: -5, hello: 'Bienvenidos' },
  'Brazil': { flag: ['brazil'], tz: -3, hello: 'Bem-vindos' },
  'Argentina': { flag: ['argentina'], tz: -3, hello: 'Bienvenidos' },
  'Chile': { flag: ['chile'], tz: -4, hello: 'Bienvenidos' },
  'India': { flag: ['india'], tz: 5.5, hello: 'Swagat hai' },
  'Thailand': { flag: ['h', ['#a51931', '#f4f5f8', '#2d2a4a', '#f4f5f8', '#a51931'], [1, 1, 2, 1, 1]], tz: 7, hello: 'Sawasdee' },
  'Singapore': { flag: ['singapore'], tz: 8, hello: 'Selamat datang' },
  'Malaysia': { flag: ['malaysia'], tz: 8, hello: 'Selamat datang' },
  'Indonesia': { flag: ['h', ['#ce1126', '#ffffff']], tz: 7, hello: 'Selamat datang' },
  'China': { flag: ['china'], tz: 8, hello: 'Huānyíng' },
  'South Korea': { flag: ['korea'], tz: 9, hello: 'Hwanyeong-hamnida' },
  'Japan': { flag: ['japan'], tz: 9, hello: 'Yōkoso' },
  'Taiwan': { flag: ['taiwan'], tz: 8, hello: 'Huānyíng' },
  'Philippines': { flag: ['philippines'], tz: 8, hello: 'Mabuhay' },
  'Australia': { flag: ['australia'], tz: 10, hello: 'G\'day' },
  'New Zealand': { flag: ['newzealand'], tz: 12, hello: 'Haere mai' }
};
