// Flight Simulator: the game's texts in English, Russian and Swedish, and the language switcher
// (the flags on the start and game-over screens). Used by game.js through tr(key, params) and by
// index.html through data-i18n="key" (params from the element's data-* attributes); the switcher
// re-fills those elements and the game draws its canvas texts with tr() every frame.

const LANG = {
  en: {
    name: 'English',
    title: 'Aeropilot',
    score: 'Score:',
    destination: 'Destination airport:',
    altitude: 'Altitude',
    speed: 'Speed',
    intro1: 'First-person view from the pilot\'s cockpit. Controls: ← → — turn the plane, ↑ ↓ — climb or descend.',
    intro2: 'Hold Ctrl to fire from the crosshair at the center of the screen and pop the balloons — each one popped earns you points.',
    intro3: 'Fly to the highlighted airport (check the hint at the bottom), reduce altitude and line up with the runway — a successful landing also earns points. Don\'t crash into the ground short of the runway!',
    intro4: 'On phone and tablet: tilt the device left/right and forward/back instead of the arrow keys, tap the screen instead of Ctrl.',
    start: 'Start Flight',
    crash: 'Crash!',
    result: 'Your result: {n} points',
    again: 'Play Again',
    soundOn: '🔊 Sound: on',
    soundOff: '🔇 Sound: off',
    gaugeSpeed: 'SPEED',
    gaugeAttitude: 'ATTITUDE',
    gaugeAltitude: 'ALTITUDE',
    landed: 'Landed! +50',
    heading: 'Heading to target: {name}',
    compass: '{arrow}  {name}  ({m} m)  ·  altitude {alt}%',
    North: 'North', South: 'South', East: 'East', West: 'West', Central: 'Central'
  },
  ru: {
    name: 'Русский',
    title: 'Аэропилот',
    score: 'Очки:',
    destination: 'Аэропорт назначения:',
    altitude: 'Высота',
    speed: 'Скорость',
    intro1: 'Вид из кабины пилота. Управление: ← → — поворот, ↑ ↓ — набор высоты и снижение.',
    intro2: 'Держите Ctrl, чтобы стрелять по прицелу в центре экрана и сбивать воздушные шары — за каждый лопнувший шар дают очки.',
    intro3: 'Летите к подсвеченному аэропорту (смотрите подсказку внизу), снизьтесь и выровняйтесь по полосе — за удачную посадку тоже дают очки. Не врежьтесь в землю, не долетев до полосы!',
    intro4: 'На телефоне и планшете: наклоняйте устройство влево-вправо и вперёд-назад вместо стрелок, касайтесь экрана вместо Ctrl.',
    start: 'Начать полёт',
    crash: 'Авария!',
    result: 'Ваш результат: {n} очков',
    again: 'Играть снова',
    soundOn: '🔊 Звук: вкл',
    soundOff: '🔇 Звук: выкл',
    gaugeSpeed: 'СКОРОСТЬ',
    gaugeAttitude: 'АВИАГОРИЗОНТ',
    gaugeAltitude: 'ВЫСОТА',
    landed: 'Посадка! +50',
    heading: 'Курс на цель: {name}',
    compass: '{arrow}  {name}  ({m} м)  ·  высота {alt}%',
    North: 'Северный', South: 'Южный', East: 'Восточный', West: 'Западный', Central: 'Центральный'
  },
  sv: {
    name: 'Svenska',
    title: 'Aeropilot',
    score: 'Poäng:',
    destination: 'Destinationsflygplats:',
    altitude: 'Höjd',
    speed: 'Fart',
    intro1: 'Vy från pilotens cockpit. Styrning: ← → — sväng planet, ↑ ↓ — stig eller sjunk.',
    intro2: 'Håll in Ctrl för att skjuta från siktet mitt på skärmen och spräcka ballongerna — varje spräckt ballong ger poäng.',
    intro3: 'Flyg till den markerade flygplatsen (se tipset längst ner), sänk höjden och linjera upp med banan — en lyckad landning ger också poäng. Krascha inte i marken före banan!',
    intro4: 'På telefon och surfplatta: luta enheten åt vänster/höger och framåt/bakåt i stället för piltangenterna, tryck på skärmen i stället för Ctrl.',
    start: 'Starta flygningen',
    crash: 'Krasch!',
    result: 'Ditt resultat: {n} poäng',
    again: 'Spela igen',
    soundOn: '🔊 Ljud: på',
    soundOff: '🔇 Ljud: av',
    gaugeSpeed: 'FART',
    gaugeAttitude: 'HORISONT',
    gaugeAltitude: 'HÖJD',
    landed: 'Landat! +50',
    heading: 'Kurs mot målet: {name}',
    compass: '{arrow}  {name}  ({m} m)  ·  höjd {alt}%',
    North: 'Norra', South: 'Södra', East: 'Östra', West: 'Västra', Central: 'Centrala'
  }
};

// localStorage is shared with every app on gray0072.github.io, hence the prefix
const LANG_KEY = 'flightSimulator.lang';
const GALLERY_LANG_KEY = 'ivanGallery.lang';   // the gallery's choice, used until one is made here

let lang = 'en';

function tr(key, params) {
  let s = LANG[lang][key];
  if (s === undefined) s = LANG.en[key] !== undefined ? LANG.en[key] : key;
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}

const Lang = (() => {
  function stored(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  // the choice made here, else the gallery's, else the browser's language, else English
  function initial() {
    for (const s of [stored(LANG_KEY), stored(GALLERY_LANG_KEY)]) if (LANG[s]) return s;
    for (const l of navigator.languages || [navigator.language || '']) {
      const code = String(l).slice(0, 2).toLowerCase();
      if (LANG[code]) return code;
    }
    return 'en';
  }

  // fill every data-i18n element (params from its other data-* attributes) and the switcher
  function apply() {
    document.documentElement.lang = lang;
    document.title = tr('title');
    for (const el of document.querySelectorAll('[data-i18n]')) {
      const params = Object.assign({}, el.dataset);
      delete params.i18n;
      el.textContent = tr(el.dataset.i18n, params);
    }
    for (const b of document.querySelectorAll('.lang button')) b.setAttribute('aria-pressed', b.dataset.lang === lang);
  }

  function set(l) {
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* private mode: not remembered */ }
    apply();
  }

  function init() {
    lang = initial();
    for (const b of document.querySelectorAll('.lang button')) {
      b.title = LANG[b.dataset.lang].name;
      b.addEventListener('click', () => set(b.dataset.lang));
    }
    apply();
  }

  return { init, apply };
})();
