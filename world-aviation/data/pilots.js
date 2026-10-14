'use strict';

// ============================================================
// World Aviation — the names a new career offers for its pilot,
// in the game's language: funny men's names with a surname made
// of the sky and the trade. English ones (Rex Runway, Al Titude),
// Russian ones (закрылок = flap, штурвал = yoke, глиссада = glide
// slope, вираж = banked turn) and Swedish ones (flygare = flyer,
// moln = cloud, vinge = wing, stiga = climb, klaff = flap,
// anflygning = approach). One is picked at random for the
// new-career dialog (and its dice) by Career.randomPilotName in
// career.js; a language without a list takes the English one.
// ============================================================

const PILOT_NAMES = {
  en: [
    'Rex Runway', 'Skip Tailwind', 'Al Titude', 'Lance Landingham', 'Chuck Throttle',
    'Gil Glideslope', 'Rudy Rudder', 'Hank Hangar', 'Wally Windsock', 'Dusty Crosswind',
    'Ace Aileron', 'Max Thrust', 'Phil Errup', 'Ray Dar', 'Bart Bumpley',
    'Monty Mach', 'Percy Propwash', 'Toby Takeoff', 'Neville Nosewheel', 'Clive Cumulus',
    'Archie Approach', 'Duke Downwind', 'Woody Wingtip', 'Fletcher Flaps', 'Cyril Cirrus',
    'Hector Headwind', 'Rocky Rollout', 'Ned Nimbus', 'Wilbur Wheels', 'Sonny Skies'
  ],
  ru: [
    'Пётр Пропеллеров', 'Вася Штопоров', 'Гена Турбинкин', 'Федя Облачкин', 'Семён Закрылкин',
    'Толик Тангажов', 'Кеша Крылышкин', 'Стёпа Рулёжкин', 'Жора Глиссадов', 'Миша Посадкин',
    'Коля Керосинов', 'Витя Взлётов', 'Гоша Высоткин', 'Лёва Ветерков', 'Саня Шассин',
    'Петя Пилотажкин', 'Дима Дюралев', 'Вова Винтокрылов', 'Шурик Штурвалов', 'Яша Ястребов',
    'Тимоша Тучкин', 'Филя Фюзеляжкин', 'Эдик Элеронов', 'Рома Радаров', 'Костя Курсов',
    'Гриша Грозовой', 'Паша Парашютов', 'Егор Форсажев', 'Валера Виражов', 'Сева Самолётов'
  ],
  sv: [
    'Sven Flygare', 'Bosse Blixt', 'Lasse Landström', 'Kjell Molnberg', 'Sixten Vingqvist',
    'Gösta Himmelstrand', 'Ture Stormberg', 'Olle Åskström', 'Pelle Propellén', 'Stig Stigberg',
    'Rune Rullgren', 'Holger Höjdqvist', 'Åke Åkerlund', 'Janne Jetström', 'Leif Lufthammar',
    'Ingvar Vindelöv', 'Gunnar Glidén', 'Nisse Nordvind', 'Hasse Hangarsson', 'Kalle Kurs',
    'Ulf Uppvind', 'Rolf Rodergren', 'Sune Sjöflygare', 'Torsten Turbulén', 'Bengt Bromsberg',
    'Göran Gyllenvinge', 'Arne Anflygsson', 'Valdemar Vingström', 'Birger Bagagesson', 'Folke Klaffström'
  ]
};
