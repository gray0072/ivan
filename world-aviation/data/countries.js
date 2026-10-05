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
// ============================================================

const COUNTRIES = {
  'Sweden': { flag: ['nordic', '#006aa7', '#fecc00'], hello: 'Välkommen' },
  'Norway': { flag: ['nordic', '#ba0c2f', '#ffffff', '#00205b'], hello: 'Velkommen' },
  'Svalbard': { flag: ['nordic', '#ba0c2f', '#ffffff', '#00205b'], hello: 'Velkommen' },
  'Finland': { flag: ['nordic', '#ffffff', '#002f6c'], hello: 'Tervetuloa' },
  'Denmark': { flag: ['nordic', '#c8102e', '#ffffff'], hello: 'Velkommen' },
  'Iceland': { flag: ['nordic', '#02529c', '#ffffff', '#dc1e35'], hello: 'Velkomin' },
  'Faroe Islands': { flag: ['nordic', '#ffffff', '#0065bd', '#ef303e'], hello: 'Vælkomin' },
  'Greenland': { flag: ['greenland'], hello: 'Tikilluarit' },
  'United Kingdom': { flag: ['uk'], hello: 'Welcome' },
  'Ireland': { flag: ['v', ['#169b62', '#ffffff', '#ff883e']], hello: 'Fáilte' },
  'Netherlands': { flag: ['h', ['#ae1c28', '#ffffff', '#21468b']], hello: 'Welkom' },
  'Belgium': { flag: ['v', ['#000000', '#fdda24', '#ef3340']], hello: 'Welkom · Bienvenue' },
  'France': { flag: ['v', ['#0055a4', '#ffffff', '#ef4135']], hello: 'Bienvenue' },
  'Germany': { flag: ['h', ['#000000', '#dd0000', '#ffce00']], hello: 'Willkommen' },
  'Switzerland': { flag: ['swiss'], hello: 'Willkommen · Bienvenue' },
  'Austria': { flag: ['h', ['#c8102e', '#ffffff', '#c8102e']], hello: 'Willkommen' },
  'Czechia': { flag: ['czech'], hello: 'Vítejte' },
  'Poland': { flag: ['h', ['#ffffff', '#dc143c']], hello: 'Witamy' },
  'Latvia': { flag: ['h', ['#9e3039', '#ffffff', '#9e3039'], [2, 1, 2]], hello: 'Laipni lūdzam' },
  'Estonia': { flag: ['h', ['#0072ce', '#000000', '#ffffff']], hello: 'Tere tulemast' },
  'Hungary': { flag: ['h', ['#ce2939', '#ffffff', '#477050']], hello: 'Üdvözöljük' },
  'Italy': { flag: ['v', ['#009246', '#ffffff', '#ce2b37']], hello: 'Benvenuti' },
  'Spain': { flag: ['h', ['#aa151b', '#f1bf00', '#aa151b'], [1, 2, 1]], hello: 'Bienvenidos' },
  'Portugal': { flag: ['portugal'], hello: 'Bem-vindos' },
  'Greece': { flag: ['greece'], hello: 'Kalós írthate' },
  'Turkey': { flag: ['turkey'], hello: 'Hoş geldiniz' },
  'Israel': { flag: ['israel'], hello: 'Bruchim haba\'im' },
  'Egypt': { flag: ['egypt'], hello: 'Ahlan wa sahlan' },
  'United Arab Emirates': { flag: ['uae'], hello: 'Ahlan wa sahlan' },
  'Qatar': { flag: ['qatar'], hello: 'Ahlan wa sahlan' },
  'Morocco': { flag: ['morocco'], hello: 'Marhaba' },
  'Ethiopia': { flag: ['ethiopia'], hello: 'Enkwan dehna metu' },
  'Kenya': { flag: ['kenya'], hello: 'Karibu' },
  'South Africa': { flag: ['southafrica'], hello: 'Welkom · Siyakwamukela' },
  'Nigeria': { flag: ['v', ['#008751', '#ffffff', '#008751']], hello: 'Kaabo' },
  'United States': { flag: ['us'], hello: 'Welcome' },
  'Canada': { flag: ['canada'], hello: 'Welcome · Bienvenue' },
  'Mexico': { flag: ['mexico'], hello: 'Bienvenidos' },
  'Colombia': { flag: ['h', ['#fcd116', '#003893', '#ce1126'], [2, 1, 1]], hello: 'Bienvenidos' },
  'Peru': { flag: ['v', ['#d91023', '#ffffff', '#d91023']], hello: 'Bienvenidos' },
  'Brazil': { flag: ['brazil'], hello: 'Bem-vindos' },
  'Argentina': { flag: ['argentina'], hello: 'Bienvenidos' },
  'Chile': { flag: ['chile'], hello: 'Bienvenidos' },
  'India': { flag: ['india'], hello: 'Swagat hai' },
  'Thailand': { flag: ['h', ['#a51931', '#f4f5f8', '#2d2a4a', '#f4f5f8', '#a51931'], [1, 1, 2, 1, 1]], hello: 'Sawasdee' },
  'Singapore': { flag: ['singapore'], hello: 'Selamat datang' },
  'Malaysia': { flag: ['malaysia'], hello: 'Selamat datang' },
  'Indonesia': { flag: ['h', ['#ce1126', '#ffffff']], hello: 'Selamat datang' },
  'China': { flag: ['china'], hello: 'Huānyíng' },
  'South Korea': { flag: ['korea'], hello: 'Hwanyeong-hamnida' },
  'Japan': { flag: ['japan'], hello: 'Yōkoso' },
  'Taiwan': { flag: ['taiwan'], hello: 'Huānyíng' },
  'Philippines': { flag: ['philippines'], hello: 'Mabuhay' },
  'Australia': { flag: ['australia'], hello: 'G\'day' },
  'New Zealand': { flag: ['newzealand'], hello: 'Haere mai' }
};
