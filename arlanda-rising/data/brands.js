'use strict';

// Arlanda Rising — the real shops, cafés, restaurants and services the player puts into the terminals' units (session 4),
// as plain data. Each brand is shown respectfully as a simplified sign made for the game (art/brands.js), never a copied
// logo, and only from the year it existed in Sweden. Each one has:
//   name     its exact spelling
//   kind     cafe, food, kiosk, shop, kids, service, car (car rental), taxi — two of one kind in a terminal share the
//            passengers (BRAND_SAME_KIND)
//   size     the smallest unit it fits: kiosk, unit, big (data/terminals.js), or desk (the kerb's desks)
//   from     the first year it can open: the year it existed in Sweden (founded, or its first Swedish outlet)
//   rent     SEK a month it pays the airport
//   spend    the airport's share of what a departing passenger spends there, × SHOP_SPEND, at full free time airside
//   fit      who spends more there: 'all', 'business' (scheduled flights), 'leisure' (charter and low-cost), 'family'
//            (in FAMILY_MONTHS), 'intl' (international passengers only)
//   pax      Passengers points it gives (kids' favourites count double in FAMILY_MONTHS; BRAND_PAX_MAX in all)
//   sign     [background, text] colours of the game's sign; glyph: one or two letters drawn on it
//   src      the source of the year; arlanda: what is known of it at Arlanda; check: what is still to be checked
// The years come from a check of the companies' and Wikipedia's pages (2026); the colours are the game's simplified
// reading of each sign, to be checked before a closer drawing.

const BRANDS = {
  // ---------- cafés ----------
  pressbyran: { name: 'Pressbyrån', kind: 'kiosk', size: 'kiosk', from: 1899, rent: 45000, spend: 0.45, fit: 'all', pax: 1,
    sign: ['#d71920', '#ffffff'], glyph: 'P', src: 'en.wikipedia Pressbyrån: selling papers at railway stations from 1899', arlanda: 'yes (five new stores in 2023; the first year there unknown)' },
  seven11: { name: '7-Eleven', kind: 'kiosk', size: 'kiosk', from: 1984, rent: 50000, spend: 0.5, fit: 'all', pax: 1,
    sign: ['#ffffff', '#008163'], glyph: '7', src: '7-Eleven / Reitan: the first Swedish store 1980 or 1984 (the sources differ; the later year is used)', arlanda: 'yes (2023)' },
  waynes: { name: 'Waynes Coffee', kind: 'cafe', size: 'unit', from: 1995, rent: 90000, spend: 0.75, fit: 'business', pax: 1.5,
    sign: ['#1d1d1b', '#ffffff'], glyph: 'W', src: 'waynescoffee.com: the first café on 17 December 1994, Kungsgatan, Stockholm (opens here from 1995)', arlanda: 'not found', check: 'today called Waynes' },
  espresso: { name: 'Espresso House', kind: 'cafe', size: 'unit', from: 1996, rent: 100000, spend: 0.8, fit: 'all', pax: 1.5,
    sign: ['#8e1b2a', '#ffffff'], glyph: 'E', src: 'en.wikipedia Espresso House: founded 1996 in Lund', arlanda: 'yes (SkyCity 2018, Terminal 5 2025)' },
  starbucks: { name: 'Starbucks', kind: 'cafe', size: 'unit', from: 2010, rent: 110000, spend: 0.85, fit: 'all', pax: 1.5,
    sign: ['#00704a', '#ffffff'], glyph: 'S', src: 'Moodie Davitt, The Local (2009): Sweden\'s first Starbucks opened at Arlanda Terminal 5 in 2010', arlanda: 'yes, the first in Sweden (2010)' },
  gateau: { name: 'Gateau', kind: 'cafe', size: 'kiosk', from: 1937, rent: 60000, spend: 0.55, fit: 'all', pax: 1,
    sign: ['#1d1d1b', '#f1e6d2'], glyph: 'G', src: 'Fazer: founded in Stockholm in 1937', arlanda: 'yes (2023)', check: 'the founding year' },
  joe: { name: 'Joe & The Juice', kind: 'cafe', size: 'kiosk', from: 2012, rent: 80000, spend: 0.6, fit: 'business', pax: 1,
    sign: ['#111111', '#f2a7c3'], glyph: 'J', src: 'en.wikipedia: founded in Copenhagen in 2002', arlanda: 'yes (Terminal 5 Marketplace, 2023–25)', check: 'its first Swedish bar (not found: 2012 is the game\'s guess)' },
  // ---------- food ----------
  max: { name: 'Max', kind: 'food', size: 'unit', from: 1968, rent: 110000, spend: 0.8, fit: 'family', pax: 2,
    sign: ['#e30613', '#ffffff'], glyph: 'M', src: 'Max Hamburgare: founded 1968 in Gällivare', arlanda: 'yes (Terminal 4, November 2007)' },
  mcdonalds: { name: 'McDonald\'s', kind: 'food', size: 'unit', from: 1973, rent: 120000, spend: 0.8, fit: 'family', pax: 2,
    sign: ['#da291c', '#ffc72c'], glyph: 'M', src: 'mcdonalds.com/se: the first Swedish restaurant on 27 October 1973, Kungsgatan, Stockholm', arlanda: 'a SkyCity listing (the year unknown)' },
  burgerking: { name: 'Burger King', kind: 'food', size: 'unit', from: 1976, rent: 110000, spend: 0.75, fit: 'family', pax: 1.5,
    sign: ['#f5ebdc', '#d62300'], glyph: 'B', src: 'Burger King Sweden: the first restaurant in 1976, Malmö', arlanda: 'not found' },
  sibylla: { name: 'Sibylla', kind: 'food', size: 'kiosk', from: 1932, rent: 55000, spend: 0.5, fit: 'all', pax: 1,
    sign: ['#d7141a', '#ffd200'], glyph: 'S', src: 'en.wikipedia Sibylla: the brand from 1932', arlanda: 'yes (Terminal 5 Marketplace, 2026)' },
  olearys: { name: 'O\'Learys', kind: 'food', size: 'big', from: 1988, rent: 220000, spend: 1.2, fit: 'business', pax: 2,
    sign: ['#0b5a35', '#ffffff'], glyph: 'O', src: 'en.wikipedia O\'Learys: the first one on 16 November 1988, Gothenburg', arlanda: 'yes (Terminals 2, 4 and 5, SkyCity; the year unknown)' },
  pizzahut: { name: 'Pizza Hut', kind: 'food', size: 'unit', from: 1987, rent: 100000, spend: 0.7, fit: 'family', pax: 1.5,
    sign: ['#c8102e', '#ffffff'], glyph: 'P', src: 'Pizza Hut Sweden: the first restaurant in 1987', arlanda: 'not found' },
  vapiano: { name: 'Vapiano', kind: 'food', size: 'big', from: 2007, rent: 200000, spend: 1.1, fit: 'all', pax: 2,
    sign: ['#ffffff', '#c8102e'], glyph: 'V', src: 'Realtid: the first Swedish restaurant in October 2007, Stockholm', arlanda: 'not found' },
  sushiyama: { name: 'Sushi Yama', kind: 'food', size: 'kiosk', from: 2008, rent: 70000, spend: 0.6, fit: 'business', pax: 1,
    sign: ['#1d1d1b', '#e30613'], glyph: 'Y', src: 'founded 2008 in Stockholm', arlanda: 'yes (SkyCity)', check: 'the founding year' },
  bastard: { name: 'Bastard Burgers', kind: 'food', size: 'unit', from: 2016, rent: 110000, spend: 0.8, fit: 'all', pax: 1.5,
    sign: ['#111111', '#ffffff'], glyph: 'B', src: 'bastardburgers.com: September 2016, Luleå', arlanda: 'yes (Terminal 4, 2019)' },
  poke: { name: 'Hawaii Poké', kind: 'food', size: 'kiosk', from: 2016, rent: 70000, spend: 0.6, fit: 'business', pax: 1,
    sign: ['#f6c343', '#1d3b4a'], glyph: 'H', src: 'Cision (2021): founded 2016 in Stockholm', arlanda: 'yes (Terminal 5 Marketplace)', check: 'the founding year (2015 or 2016)' },
  // ---------- shops ----------
  clas: { name: 'Clas Ohlson', kind: 'shop', size: 'unit', from: 1918, rent: 120000, spend: 0.55, fit: 'all', pax: 1,
    sign: ['#005aa3', '#ffffff'], glyph: 'C', src: 'Clas Ohlson: founded 1918 in Insjön', arlanda: 'not found' },
  lindex: { name: 'Lindex', kind: 'shop', size: 'unit', from: 1954, rent: 110000, spend: 0.5, fit: 'leisure', pax: 0.5,
    sign: ['#111111', '#ffffff'], glyph: 'L', src: 'sv.wikipedia Lindex: 1954, Alingsås', arlanda: 'not found' },
  akademi: { name: 'Akademibokhandeln', kind: 'shop', size: 'unit', from: 1975, rent: 90000, spend: 0.5, fit: 'business', pax: 1,
    sign: ['#7a1e2c', '#ffffff'], glyph: 'A', src: 'sv.wikipedia Akademibokhandeln: 1971, its first public store 1975', arlanda: 'not found' },
  kicks: { name: 'KICKS', kind: 'shop', size: 'unit', from: 1991, rent: 110000, spend: 0.6, fit: 'leisure', pax: 0.5,
    sign: ['#111111', '#f19cbb'], glyph: 'K', src: 'Realtid: founded 1991', arlanda: 'not found' },
  designhouse: { name: 'Design House Stockholm', kind: 'shop', size: 'kiosk', from: 1992, rent: 60000, spend: 0.45, fit: 'intl', pax: 0.5,
    sign: ['#ffffff', '#111111'], glyph: 'D', src: 'en.wikipedia: founded on 29 January 1992', arlanda: 'not found' },
  svensktenn: { name: 'Svenskt Tenn', kind: 'shop', size: 'unit', from: 1924, rent: 90000, spend: 0.5, fit: 'intl', pax: 0.5,
    sign: ['#efe4cf', '#5a3d2b'], glyph: 'S', src: 'svenskttenn.com: October 1924, Stockholm', arlanda: 'not found' },
  dalahast: { name: 'Nils Olsson Dalahästar', kind: 'shop', size: 'kiosk', from: 1928, rent: 40000, spend: 0.4, fit: 'intl', pax: 1,
    sign: ['#c8102e', '#ffffff'], glyph: 'N', src: 'Visit Dalarna: the brothers Nils and Jannes Olsson, Nusnäs, 1928', arlanda: 'no shop of its own found' },
  gina: { name: 'Gina Tricot', kind: 'shop', size: 'unit', from: 1997, rent: 110000, spend: 0.5, fit: 'leisure', pax: 0.5,
    sign: ['#111111', '#ffffff'], glyph: 'G', src: 'sv.wikipedia Gina Tricot: 1997', arlanda: 'not found' },
  // ---------- for children ----------
  brio: { name: 'BRIO', kind: 'kids', size: 'kiosk', from: 1908, rent: 60000, spend: 0.45, fit: 'family', pax: 2,
    sign: ['#d7141a', '#ffffff'], glyph: 'B', src: 'en.wikipedia BRIO: from 1884; the name from 1908', arlanda: 'no' },
  polarn: { name: 'Polarn O. Pyret', kind: 'kids', size: 'unit', from: 1976, rent: 90000, spend: 0.5, fit: 'family', pax: 2,
    sign: ['#ffffff', '#e2001a'], glyph: 'PO', src: 'sv.wikipedia: roots in 1909, the brand from the 1970s', arlanda: 'not found', check: 'the year 1976' },
  lego: { name: 'LEGO Store', kind: 'kids', size: 'unit', from: 2015, rent: 130000, spend: 0.6, fit: 'family', pax: 2.5,
    sign: ['#e3000b', '#ffd500'], glyph: 'L', src: 'Nordic Property News: the first Swedish LEGO Store, November 2015, Mall of Scandinavia', arlanda: 'no' },
  // ---------- services ----------
  forex: { name: 'FOREX', kind: 'service', size: 'kiosk', from: 1965, rent: 70000, spend: 0.3, fit: 'intl', pax: 1,
    sign: ['#ffd100', '#111111'], glyph: 'FX', src: 'sv.wikipedia Forex Bank: from 1965 (en.wikipedia says 1927)', arlanda: 'yes (SkyCity, Terminals 2 and 5)' },
  apoteket: { name: 'Apoteket', kind: 'service', size: 'kiosk', from: 1971, rent: 60000, spend: 0.25, fit: 'all', pax: 1,
    sign: ['#00843d', '#ffffff'], glyph: 'A', src: 'Apoteket: the state pharmacy company from 1971', arlanda: 'not found (Kronans Apotek has the pharmacies today)' },
  // ---------- at the kerb ----------
  hertz: { name: 'Hertz', kind: 'car', size: 'desk', from: 1960, rent: 70000, spend: 0.1, fit: 'business', pax: 0.5,
    sign: ['#ffd100', '#111111'], glyph: 'H', src: 'Hertz Sweden: 1960', arlanda: 'unknown', check: 'the year' },
  avis: { name: 'Avis', kind: 'car', size: 'desk', from: 1966, rent: 65000, spend: 0.1, fit: 'business', pax: 0.5,
    sign: ['#d4002a', '#ffffff'], glyph: 'A', src: 'one listing: 1966', arlanda: 'unknown', check: 'the year' },
  taxisthlm: { name: 'Taxi Stockholm', kind: 'taxi', size: 'desk', from: 1899, rent: 40000, spend: 0.1, fit: 'all', pax: 1,
    sign: ['#111111', '#ffd100'], glyph: 'T', src: 'Taxi Stockholm: 1899, as Stockholms Droskägareförening', arlanda: 'yes, as a taxi brand' },
  flygbussarna: { name: 'Flygbussarna', kind: 'taxi', size: 'desk', from: 1989, rent: 30000, spend: 0.05, fit: 'all', pax: 1,
    sign: ['#00704a', '#ffffff'], glyph: 'F', src: 'en.wikipedia Flygbussarna: started by SL in 1989', arlanda: 'yes' }
};

// the brands that may open in a year, of a size that fits a unit (desk units take only desk brands)
function brandsFor(year, size) {
  return Object.keys(BRANDS).filter((id) => {
    const b = BRANDS[id];
    if (b.from > year) return false;
    if (size === 'desk' || b.size === 'desk') return size === b.size;
    return UNIT_SIZES.indexOf(b.size) <= UNIT_SIZES.indexOf(size);
  });
}
