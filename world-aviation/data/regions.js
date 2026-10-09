'use strict';

// ============================================================
// World Aviation — the regions round the Russian and Swedish
// airports and what is advertised there
// AIRPORT_REGIONS  id: [the region's flag — a Russian region's flag,
//                  the banner of a Swedish province's arms, the Sámi
//                  flag at Kiruna (art/regions.js) —, the region's own
//                  products, the one in letters on the office roof]
// NATIONAL_BRANDS  the country's products, seen at all its airports
// BRANDS           how each one is painted on its boards (art/brands.js):
//                  the name, a small line under it, the board's colour,
//                  the letters' colour, a mark (BRAND_MARKS) and its colour
// The flag flies on the terminal's roof beside the national and the
// city ones (render/airport3d.js); the boards are on the terminal's
// apron front, beside the access road and on the office roof
// (render/adverts3d.js). The names are scenery: never translated.
// ============================================================

const AIRPORT_REGIONS = {
  // ---- Russia
  SVO: ['moscow', ['alenka', 'krasnyOktyabr'], 'sber'],
  LED: ['spb', ['sever', 'petmol'], 'sber'],
  KGD: ['kaliningrad', ['amber', 'avtotor'], 'sber'],
  MMK: ['murmansk', ['norebo', 'atomflot'], 'sber'],
  ARH: ['arkhangelsk', ['kozuli'], 'sber'],
  KZN: ['tatarstan', ['chakchak', 'kamaz', 'tatneft'], 'sber'],
  AER: ['krasnodar', ['krasnodarTea', 'matsesta'], 'sber'],
  SVX: ['sverdlovsk', ['uralmash', 'irbit'], 'sber'],
  OVB: ['novosibirsk', ['kirieshki'], 'sber'],
  KJA: ['krasnoyarsk', ['rusal'], 'sber'],
  NSK: ['krasnoyarsk', ['nornickel'], 'nornickel'],
  HTG: ['krasnoyarsk', ['nornickel'], 'sber'],
  IKT: ['irkutsk', ['baikal', 'irkut'], 'sber'],
  YKS: ['sakha', ['alrosa'], 'alrosa'],
  VVO: ['primorye', ['primKonditer', 'dalmore'], 'sber'],
  PKC: ['kamchatka', ['okeanryb'], 'sber'],
  DYR: ['chukotka', [], 'sber'],
  IJK: ['udmurtia', ['izhmoloko', 'izh'], 'sber'],
  // ---- Sweden
  ARN: ['uppland', ['ericsson', 'spotify'], 'ericsson'],
  BMA: ['uppland', ['hm', 'spotify'], 'hm'],
  GOT: ['vastergotland', ['volvo', 'goteborgsKex', 'skf'], 'volvo'],
  MMX: ['skane', ['skanemejerier', 'pagen', 'tetrapak'], 'tetrapak'],
  VBY: ['gotland', ['gotlandsbolaget'], 'ica'],
  VXO: ['smaland', ['ikea', 'kostaBoda'], 'ikea'],
  KLR: ['smaland', ['orrefors', 'guldfageln'], 'ica'],
  RNB: ['blekinge', ['ronnebyBrunn'], 'ica'],
  OSD: ['jamtland', ['oviksost', 'jamtkraft'], 'jamtkraft'],
  SDL: ['medelpad', ['sca'], 'sca'],
  UME: ['vasterbotten', ['norrmejerier', 'vasterbottensost'], 'norrmejerier'],
  LLA: ['norrbotten', ['polarbrod', 'ssab'], 'ssab'],
  KRN: ['sapmi', ['lkab', 'icehotel'], 'lkab']
};

const NATIONAL_BRANDS = {
  Russia: ['sber', 'prostokvashino', 'pochta', 'pyaterochka', 'rzd'],
  Sweden: ['arla', 'marabou', 'ica', 'kalles', 'postnord', 'sj']
};

const BRANDS = {
  // ---- Russia, all over
  sber: { name: 'СБЕР', tag: 'СберБанк', bg: '#21a038', fg: '#ffffff', mark: 'tick' },
  prostokvashino: { name: 'Простоквашино', tag: 'молоко и кефир', bg: '#ffffff', fg: '#1d4f9c', mark: 'house', mc: '#e2231a' },
  pochta: { name: 'ПОЧТА РОССИИ', tag: 'письма и посылки', bg: '#0055a6', fg: '#ffffff', mark: 'post' },
  pyaterochka: { name: 'Пятёрочка', tag: 'магазины у дома', bg: '#e31e24', fg: '#ffffff', mark: 'leaf', mc: '#7ed957' },
  rzd: { name: 'РЖД', tag: 'Российские железные дороги', bg: '#e21a1a', fg: '#ffffff', mark: 'rail' },
  // ---- Russia, the regions
  alenka: { name: 'Алёнка', tag: 'шоколад · Москва', bg: '#c8102e', fg: '#ffffff', mark: 'heart', mc: '#f6c700', font: 'serif' },
  krasnyOktyabr: { name: 'Красный Октябрь', tag: 'кондитерская фабрика', bg: '#7a1a1a', fg: '#f2d48a', mark: 'star', font: 'serif' },
  sever: { name: 'Север', tag: 'торты · Санкт-Петербург', bg: '#1d3f78', fg: '#ffffff', mark: 'snow' },
  petmol: { name: 'Петмол', tag: 'молоко Петербурга', bg: '#ffffff', fg: '#0a5aa8', mark: 'drop' },
  amber: { name: 'Янтарь', tag: 'янтарный комбинат', bg: '#2a1a0a', fg: '#f2a91a', mark: 'diamond' },
  avtotor: { name: 'АВТОТОР', tag: 'автомобили · Калининград', bg: '#ffffff', fg: '#1b3d7a', mark: 'gear' },
  norebo: { name: 'НОРЕБО', tag: 'рыба Баренцева моря', bg: '#0b3f73', fg: '#ffffff', mark: 'fish' },
  atomflot: { name: 'АТОМФЛОТ', tag: 'ледоколы · Мурманск', bg: '#ffffff', fg: '#1b4f9c', mark: 'snow', mc: '#d0302b' },
  kozuli: { name: 'Козули', tag: 'архангельские пряники', bg: '#f6efe0', fg: '#8a3a1a', mark: 'star', mc: '#c0392b', font: 'serif' },
  chakchak: { name: 'Чак-чак', tag: 'сладость Татарстана', bg: '#127a4c', fg: '#ffffff', mark: 'sun', mc: '#f2c400' },
  kamaz: { name: 'КАМАЗ', tag: 'Набережные Челны', bg: '#1b3f8a', fg: '#ffffff', mark: 'gear', mc: '#ff4a3d' },
  tatneft: { name: 'ТАТНЕФТЬ', tag: 'Альметьевск', bg: '#ffffff', fg: '#0d7a3e', mark: 'drop' },
  krasnodarTea: { name: 'Краснодарский чай', tag: 'самый северный чай', bg: '#1f6a2a', fg: '#ffffff', mark: 'leaf', mc: '#a6d96a' },
  matsesta: { name: 'Мацеста', tag: 'курорт Сочи', bg: '#0a84a8', fg: '#ffffff', mark: 'wave' },
  uralmash: { name: 'УРАЛМАШ', tag: 'Екатеринбург', bg: '#2a2f36', fg: '#f2c400', mark: 'gear' },
  irbit: { name: 'Ирбитский', tag: 'молочный завод', bg: '#ffffff', fg: '#1d5aa8', mark: 'drop' },
  kirieshki: { name: 'Кириешки', tag: 'сухарики · Новосибирск', bg: '#f2c400', fg: '#c8102e', mark: 'wheat' },
  rusal: { name: 'РУСАЛ', tag: 'алюминий · Красноярск', bg: '#ffffff', fg: '#1a4f8a', mark: 'ring' },
  nornickel: { name: 'НОРНИКЕЛЬ', tag: 'Норильск', bg: '#004f9f', fg: '#ffffff', mark: 'snow' },
  baikal: { name: 'Байкальская', tag: 'глубинная вода', bg: '#e8f4fa', fg: '#0b5ea8', mark: 'wave' },
  irkut: { name: 'ИРКУТ', tag: 'самолёты · Иркутск', bg: '#1d4e89', fg: '#ffffff', mark: 'plane' },
  alrosa: { name: 'АЛРОСА', tag: 'алмазы Якутии', bg: '#0d2a4a', fg: '#ffffff', mark: 'diamond', mc: '#9fd3f0' },
  primKonditer: { name: 'Приморский кондитер', tag: 'Владивосток', bg: '#5a2a1a', fg: '#f6d79a', mark: 'heart', font: 'serif' },
  dalmore: { name: 'Дальморепродукт', tag: 'дары моря', bg: '#0b4f8a', fg: '#ffffff', mark: 'fish' },
  okeanryb: { name: 'Океанрыбфлот', tag: 'Камчатка', bg: '#0a3a5a', fg: '#ffffff', mark: 'fish', mc: '#e8743b' },
  izhmoloko: { name: 'Ижмолоко', tag: 'молоко Удмуртии', bg: '#ffffff', fg: '#1b5fae', mark: 'drop' },
  izh: { name: 'ИЖ', tag: 'Ижевский мотозавод', bg: '#c8102e', fg: '#ffffff', mark: 'gear' },
  // ---- Sweden, all over
  arla: { name: 'Arla', tag: 'Från svenska gårdar', bg: '#ffffff', fg: '#00843d', mark: 'sun', mc: '#00843d' },
  marabou: { name: 'Marabou', tag: 'mjölkchoklad', bg: '#8c1c2b', fg: '#ffffff', mark: 'heart', font: 'script' },
  ica: { name: 'ICA', tag: 'Matbutiken', bg: '#e3000b', fg: '#ffffff', mark: 'none' },
  kalles: { name: 'Kalles', tag: 'Kaviar', bg: '#0058a3', fg: '#ffd200', mark: 'fish' },
  postnord: { name: 'PostNord', tag: 'brev och paket', bg: '#00a0d6', fg: '#ffffff', mark: 'post' },
  sj: { name: 'SJ', tag: 'Tåg i hela Sverige', bg: '#1b1b1b', fg: '#ffffff', mark: 'rail' },
  // ---- Sweden, the regions
  ericsson: { name: 'ERICSSON', tag: 'Stockholm', bg: '#ffffff', fg: '#0a2b56', mark: 'bars' },
  spotify: { name: 'Spotify', tag: 'Stockholm', bg: '#191414', fg: '#1db954', mark: 'sound' },
  hm: { name: 'H&M', tag: 'Stockholm', bg: '#ffffff', fg: '#e50010', mark: 'none' },
  volvo: { name: 'VOLVO', tag: 'Göteborg', bg: '#1f3b6e', fg: '#ffffff', mark: 'ring', mc: '#c9ced6' },
  goteborgsKex: { name: 'Göteborgs Kex', tag: 'sedan 1888', bg: '#c8102e', fg: '#ffffff', mark: 'wheat', font: 'serif' },
  skf: { name: 'SKF', tag: 'Göteborg', bg: '#0f58d6', fg: '#ffffff', mark: 'ring' },
  skanemejerier: { name: 'Skånemejerier', tag: 'Mjölk från Skåne', bg: '#ffffff', fg: '#0a5aa8', mark: 'drop', mc: '#e2231a' },
  pagen: { name: 'Pågen', tag: 'Bröd från Malmö', bg: '#ffd23f', fg: '#c8102e', mark: 'wheat' },
  tetrapak: { name: 'Tetra Pak', tag: 'Lund', bg: '#ffffff', fg: '#023f88', mark: 'diamond' },
  gotlandsbolaget: { name: 'Gotlandsbolaget', tag: 'Färjan till Gotland', bg: '#003a70', fg: '#ffffff', mark: 'wave' },
  ikea: { name: 'IKEA', tag: 'Älmhult, Småland', bg: '#0058a3', fg: '#ffda1a', mark: 'none' },
  kostaBoda: { name: 'Kosta Boda', tag: 'Glasriket', bg: '#ffffff', fg: '#1a1a1a', mark: 'cup', mc: '#1f7c8c', font: 'serif' },
  orrefors: { name: 'Orrefors', tag: 'Glasriket sedan 1898', bg: '#1a1a1a', fg: '#ffffff', mark: 'diamond', font: 'serif' },
  guldfageln: { name: 'Guldfågeln', tag: 'Kyckling från Öland', bg: '#f2c400', fg: '#7a2a10', mark: 'sun' },
  ronnebyBrunn: { name: 'Ronneby Brunn', tag: 'Hotell & Spa', bg: '#b8336a', fg: '#ffffff', mark: 'drop', font: 'serif' },
  oviksost: { name: 'Oviksost', tag: 'från Jämtland', bg: '#f6d65a', fg: '#1b4f2c', mark: 'sun' },
  jamtkraft: { name: 'Jämtkraft', tag: 'Östersund', bg: '#ffffff', fg: '#e8590c', mark: 'bolt' },
  sca: { name: 'SCA', tag: 'Skog · Sundsvall', bg: '#ffffff', fg: '#00704a', mark: 'leaf' },
  norrmejerier: { name: 'Norrmejerier', tag: 'Mjölk från Norrland', bg: '#ffffff', fg: '#0050a0', mark: 'drop' },
  vasterbottensost: { name: 'Västerbottensost', tag: 'från Burträsk', bg: '#c8102e', fg: '#ffffff', mark: 'star', mc: '#f6c700' },
  polarbrod: { name: 'Polarbröd', tag: 'Älvsbyn', bg: '#2a6db0', fg: '#ffffff', mark: 'snow' },
  ssab: { name: 'SSAB', tag: 'Stål från Luleå', bg: '#ffffff', fg: '#0b3b75', mark: 'bars' },
  lkab: { name: 'LKAB', tag: 'Järnmalm från Kiruna', bg: '#00285a', fg: '#ffffff', mark: 'mountain' },
  icehotel: { name: 'ICEHOTEL', tag: 'Jukkasjärvi', bg: '#dff1fb', fg: '#14506b', mark: 'snow' }
};

// the products advertised at an airport: the region's first, then the country's (none abroad)
function airportBrands(a) {
  const r = AIRPORT_REGIONS[a.id];
  const own = r ? r[1] : [], nat = NATIONAL_BRANDS[a.country] || [];
  return own.concat(nat.filter((b) => own.indexOf(b) < 0)).filter((b) => BRANDS[b]);
}
