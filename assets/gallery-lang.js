// The root gallery's texts in English, Russian and Swedish, keyed by the data-i18n names in
// index.html (data-i18n-alt / data-i18n-aria for the alt and aria-label attributes). Plain data,
// read by assets/gallery.js. English matches the text written in index.html.

const GALLERY_LANG = {
  en: {
    name: 'English',
    title: 'Browser Games Gallery',
    description: 'Tiny self-contained browser games in vanilla JavaScript. No install — just open and play.',
    tagline: 'Small self-contained browser games and experiments. No install — just open and play.',
    langSwitch: 'Language',
    github: 'GitHub repository',
    source: 'Source on GitHub',
    fsName: 'Flight Simulator',
    fsAlt: 'Flight simulator screenshot',
    fsDesc: 'First-person arcade flight game: steer with the arrow keys, fire a twin-gun with Ctrl to pop balloons for points, and land on the highlighted airport\'s runway.',
    ffAlt: 'Fish frenzy screenshot',
    ffDesc: 'Eat-and-grow arcade game: steer a fish with the arrow keys or a touch joystick, eat plankton and smaller fish, avoid bigger ones and jellyfish, and climb the food chain to the Sea King. Three difficulty levels and best-time records.',
    ftAlt: 'Fun Training screenshot',
    ftDesc: 'A training game for school kids: water a flower, stop zombies, lay rails for a train, keep a balloon in the air, a campfire burning or a panda fed and happy by answering tasks in time. Math, reading-scale and listen-and-read tasks (Swedish, English, Russian), players, progress tracks with stars and bosses, coins and diamonds to spend on your own character — food, clothes and a room to furnish — and settings for operations, limits and speed.',
    waAlt: 'World Aviation screenshot',
    waDesc: 'A cockpit-view flight simulator and airline career: start with Swedish domestic flights out of Arlanda, win Scandinavia, then buy the traffic rights to the rest of the world, region by region. Push back, taxi, take off, work the emergency checklists, fly the ILS and land — from Visby to New York and Tokyo. Eighteen aircraft from a 19-seat turboprop to the ATR 72, the Embraer E2, the A220, the 737, the A320neo, the 787, the A350, the 777, the An-124, the 747-8F and the double-deck A380, 132 real airports, a training tree and Swedish kronor.'
  },
  ru: {
    name: 'Русский',
    title: 'Галерея браузерных игр',
    description: 'Маленькие самостоятельные браузерные игры на чистом JavaScript. Ничего не нужно устанавливать — просто откройте и играйте.',
    tagline: 'Маленькие самостоятельные браузерные игры и эксперименты. Ничего не нужно устанавливать — просто откройте и играйте.',
    langSwitch: 'Язык',
    github: 'Репозиторий на GitHub',
    source: 'Исходный код на GitHub',
    fsName: 'Авиасимулятор',
    fsAlt: 'Скриншот авиасимулятора',
    fsDesc: 'Аркадный авиасимулятор от первого лица: управляйте стрелками, стреляйте из спаренного пулемёта клавишей Ctrl по воздушным шарам ради очков и садитесь на полосу подсвеченного аэропорта.',
    ffAlt: 'Скриншот Fish Frenzy',
    ffDesc: 'Аркада «ешь и расти»: управляйте рыбкой стрелками или сенсорным джойстиком, ешьте планктон и рыб поменьше, избегайте крупных и медуз и поднимайтесь по пищевой цепочке до Морского короля. Три уровня сложности и рекорды лучшего времени.',
    ftAlt: 'Скриншот Fun Training',
    ftDesc: 'Обучающая игра для школьников: поливайте цветок, останавливайте зомби, прокладывайте рельсы для поезда, держите в воздухе воздушный шар, поддерживайте костёр или кормите панду, вовремя решая задания. Математика, задания на шкале чтения и «послушай и прочитай» (шведский, английский, русский), игроки, дорожки прогресса со звёздами и боссами, монеты и алмазы для своего персонажа — еда, одежда и комната, которую можно обставить, — и настройки действий, пределов и скорости.',
    waAlt: 'Скриншот World Aviation',
    waDesc: 'Авиасимулятор с видом из кабины и карьера пилота авиакомпании: начните с внутренних рейсов по Швеции из Арланды, покорите Скандинавию, а затем покупайте права на полёты в остальной мир, регион за регионом. Буксировка, руление, взлёт, аварийные чек-листы, заход по ILS и посадка — от Висбю до Нью-Йорка и Токио. Восемнадцать самолётов от 19-местного турбовинтового до ATR 72, Embraer E2, A220, 737, A320neo, 787, A350, 777, Ан-124, 747-8F и двухпалубного A380, 132 настоящих аэропорта, дерево обучения и шведские кроны.'
  },
  sv: {
    name: 'Svenska',
    title: 'Galleri med webbläsarspel',
    description: 'Små fristående webbläsarspel i ren JavaScript. Ingen installation — öppna bara och spela.',
    tagline: 'Små fristående webbläsarspel och experiment. Ingen installation — öppna bara och spela.',
    langSwitch: 'Språk',
    github: 'Repot på GitHub',
    source: 'Källkoden på GitHub',
    fsName: 'Flygsimulator',
    fsAlt: 'Skärmbild från flygsimulatorn',
    fsDesc: 'Ett arkadflygspel i förstapersonsvy: styr med piltangenterna, skjut med dubbelkanonen (Ctrl) mot ballonger för poäng och landa på banan vid den markerade flygplatsen.',
    ffAlt: 'Skärmbild från Fish Frenzy',
    ffDesc: 'Ett ät-och-väx-arkadspel: styr en fisk med piltangenterna eller en joystick på skärmen, ät plankton och mindre fiskar, undvik större fiskar och maneter och klättra uppför näringskedjan till Havskungen. Tre svårighetsgrader och rekord för bästa tid.',
    ftAlt: 'Skärmbild från Fun Training',
    ftDesc: 'Ett övningsspel för skolbarn: vattna en blomma, stoppa zombier, lägg räls åt ett tåg, håll en ballong i luften, en lägereld brinnande eller en panda mätt och glad genom att lösa uppgifter i tid. Matte, läsuppgifter på en skala och lyssna-och-läs (svenska, engelska, ryska), spelare, framstegsbanor med stjärnor och bossar, mynt och diamanter att lägga på din egen figur — mat, kläder och ett rum att möblera — och inställningar för räknesätt, gränser och tempo.',
    waAlt: 'Skärmbild från World Aviation',
    waDesc: 'En flygsimulator med vy från cockpit och en karriär som trafikpilot: börja med inrikesflyg i Sverige från Arlanda, vinn Skandinavien och köp sedan trafikrättigheterna till resten av världen, region för region. Pushback, taxning, start, nödchecklistor, ILS-inflygning och landning — från Visby till New York och Tokyo. Arton flygplan från en turboprop med 19 platser till ATR 72, Embraer E2, A220, 737, A320neo, 787, A350, 777, An-124, 747-8F och den dubbeldäckade A380, 132 riktiga flygplatser, ett utbildningsträd och svenska kronor.'
  }
};
