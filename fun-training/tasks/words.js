// Reading task data per language: the alphabet, letters that sound or look alike, everyday words a school kid knows,
// and short meaningful phrases of 2–3 words. Words are grouped by length when loaded; any word (also one of the
// phrases) may serve as a close wrong option for another.

const READ_DATA = {
  en: {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    // Letters that sound alike (B C D E G P T V Z all end in "ee") or look alike in lower case (b d p q).
    similar: ['BCDEGPTVZ', 'AHJK', 'FLMNSX', 'IY', 'QUW', 'OQ', 'BDPQ', 'MNW', 'IJL', 'UV'],
    words: `
      am an as at be by do go he hi if in is it me my no of oh on or ox so to up us we
      ant ape arm bag bat bed bee big bow box boy bun bus cap car cat cot cow cry cub cup cut dad day dig dog dot
      ear eat egg elf eye fan fin fix fly fog fox fun fur gum hat hen hit hop hot hug hum hut ice ink jam jar jet
      jog joy key kid kit leg lip log man map mat mix mom mop mud mug nap net new nut old owl pan pen pet pig pin
      pop pot ram rat red row rug run sad saw sea sip sit six sky sun tap ten tie toe top toy tub two van web wet
      wig win yak yes zoo
      bake ball band bark barn bath bead bean bear bell belt bike bird blue boat bone book boot bowl bush cake card
      cart cave coat coin cold comb cone cook corn cute deer desk dish doll door down duck dust face farm fast fish
      five flag fold four frog game gift girl goat gold good hand hare help hill hold hole home hook horn jump kick
      king kite lake lamp leaf lion look love make mice milk mole moon nest nice nine nose park pear pink play pole
      pond pool race rain rice ring road rock roof rope rose sail sand seal ship shoe shop sing snow sock song soup
      star swim tail take talk tall tent tile tree wake wall warm wind wing wolf word yard
      apple beach berry black block bread brick broom brown bunny candy chair chick clock cloud clown crown dance
      dream dress drink eight fairy field fruit funny ghost glass grape grass green happy heart honey horse house
      juice koala laugh lemon light lucky lunch mango melon money mouse music night ocean paint party pizza plant
      plate puppy queen quiet rainy river robot salad scarf seven sheep shell shirt skate sleep smile snail snake
      snowy spoon sport storm sugar sunny sweet table teeth three tiger toast tooth train truck uncle water whale
      wheel white windy witch zebra
      animal banana basket bottle bridge bubble bucket butter button camera candle carrot castle cheese cherry
      circle cookie cowboy dinner doctor dragon family father finger flower forest friend garden guitar hammer
      hungry island jacket jungle kettle kitten ladder little lizard monkey mother orange parrot pencil pepper
      pillow pirate planet pocket potato purple puzzle rabbit rocket school shadow silver sister sleepy spider
      spring summer tomato tunnel turtle violin window winter wizard yellow
      balloon bedroom blanket brother cabbage captain cartoon chicken compass cupcake dancing diamond dolphin
      drawing giraffe gorilla hamster holiday jumping kitchen lantern library lobster mermaid monster morning
      octopus pajamas pancake parents peacock penguin picture popcorn present pumpkin pyramid rainbow reading
      sausage singing snowman sparrow sweater teacher thunder tractor unicorn volcano weather whistle
      airplane backpack backyard bathroom birthday bluebird broccoli building calendar campfire children cucumber
      cupboard daughter dinosaur elephant envelope flamingo football goldfish hedgehog homework hospital kangaroo
      keyboard ladybird magician mountain mushroom notebook painting princess raindrop sailboat sandwich scissors
      seahorse sneakers snowball squirrel starfish sunshine swimming tomorrow treasure triangle umbrella vacation
      adventure afternoon alligator astronaut beautiful blueberry bookshelf breakfast butterfly cardboard
      chameleon chocolate classroom crocodile detective dragonfly fireworks furniture hamburger happiness
      honeycomb hurricane invisible jellyfish lightning newspaper pineapple porcupine raspberry rectangle
      scarecrow snowflake something spaghetti submarine sunflower tangerine telephone vegetable waterfall
      wonderful yesterday
      basketball blackboard cheesecake dishwasher everything footprints friendship headphones helicopter
      lighthouse motorcycle paintbrush playground rainforest skateboard strawberry sunglasses tablespoon
      toothbrush toothpaste volleyball watermelon wheelchair woodpecker`,
    phrases: [
      'I am', 'my cat', 'my dog', 'big dog', 'red hat', 'hot sun', 'hot tea', 'big box', 'my mom', 'my dad',
      'go home', 'run fast', 'sit down', 'come here', 'jump high', 'look up', 'wake up', 'fly away', 'thank you',
      'see you', 'we play', 'dogs bark', 'birds sing', 'fish swim', 'cats sleep', 'frogs jump', 'blue sky',
      'good night', 'good morning', 'green frog', 'little bird', 'funny clown', 'sweet apple', 'cold water',
      'warm milk', 'white snow', 'open door', 'new friend', 'eat lunch', 'pink flower', 'fresh bread',
      'red balloon', 'shiny star', 'dark night', 'magic wand', 'read books', 'brush teeth', 'wash hands',
      'play football', 'yellow banana', 'brave pirate', 'tall giraffe', 'sleepy kitten', 'big elephant',
      'happy birthday', 'chocolate cake', 'strawberry jam', 'purple dinosaur', 'scary monster', 'hungry crocodile',
      'beautiful butterfly', 'noisy helicopter', 'fast motorcycle', 'sunny afternoon', 'juicy watermelon',
      'busy playground', 'friendly dolphin', 'tiny ladybird',
      'I see you', 'a big cat', 'the red bus', 'my dog ran', 'I love you', 'go to bed', 'we go home', 'a red apple',
      'my blue bike', 'it is cold', 'look at me', 'come with me', 'read a book', 'the cat sleeps', 'the dog barks',
      'birds can fly', 'fish can swim', 'cats like fish', 'kids love candy', 'the moon shines', 'snow is white',
      'open the door', 'a little bird', 'the green frog', 'in the garden', 'on the table', 'under the bed',
      'I like apples', 'it is raining', 'my best friend', 'time for school', 'draw a picture', 'wash your hands',
      'brush your teeth', 'we play football', 'the tall giraffe', 'a yellow banana', 'a chocolate cake',
      'monkeys eat bananas', 'elephants drink water', 'a beautiful butterfly', 'the purple dinosaur',
      'a noisy helicopter', 'strawberry ice cream', 'a busy playground', 'the friendly dolphin',
      'a sleepy hedgehog', 'my birthday party', 'a sunny afternoon', 'a juicy watermelon', 'we like spaghetti',
      'the crocodile swims', 'ride a skateboard', 'climb the mountain', 'build a snowman', 'eat your breakfast',
      'the kangaroo jumps', 'an orange pumpkin', 'a magic unicorn',
    ],
  },

  sv: {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ',
    // Sound alike (be, ce, de, ge, pe, te, ve · eff, ell, emm, enn, ess, ärr · hå, kå, å) or look alike (b d p q).
    similar: ['BCDEGPTV', 'FLMNRS', 'HKÅO', 'UYÖ', 'AÅÄ', 'OÖ', 'EÄ', 'IJY', 'QK', 'BDPQ', 'MNW', 'IJL', 'UV', 'SXZ'],
    words: `
      av du en ja ko bi is ni nu om på ur vi är åt
      apa arm arg ben bil blå bok bro båt dag fem fot får gul gås hav hon hus hår jag kam kul lam lek lim lök löv
      mat mor mun mus nos och orm ost röd ros rum sax sex sju sko snö sol sjö tak tio tre två tåg ugn val väg vän
      vit ägg älg öga öra
      anka bada barn berg bild boll bord brev bror brun bröd buss dans dörr fiol filt fisk flod glad golv gran
      gris grå grön gräs hand hatt höst häst häxa kaka kall katt kort korv kopp kung leka lila lång läsa mage mjuk
      moln måla måne natt näsa regn rita rosa rund saft sand sked skog skor smör sova spel stad sten stol stor
      säng sång tand tjej träd varg varm vind vägg åska
      banan björk björn blixt byxor cykel dansa docka drake fågel glass godis groda gunga hoppa jacka kalas kanin
      kamel kotte krita kusin kudde kväll lampa lejon liten lunch mjölk morot mössa musik nalle penna piano pirat
      pizza pojke prins pulka päron raket robot räkna simma skatt skola slott spöke storm svamp svart tavla tiger
      tomat tomte troll trött tröja täcke tårta vante zebra äpple
      badkar badrum blomma blåbär citron delfin dricka ekorre fjäril gitarr giraff glädje hallon himmel honung
      kaktus kompis kärlek leksak lingon middag morgon planet pussel sjunga skidor skriva solros sommar sovrum
      strand syster trumma tulpan vatten vinter
      ambulans apelsin ballong choklad ekollon elefant fönster frukost handduk halsduk hamster klättra körsbär
      maskros marsvin monster paraply pingvin plommon potatis present riddare simhall skratta smörgås solsken
      spindel springa stjärna stövlar strumpa telefon traktor tärning äventyr
      brandbil flygplan glasögon handboll igelkott julafton klänning krokodil lekplats mandarin pannkaka papegoja
      polisbil regnbåge ryggsäck sandlåda segelbåt snögubbe tandkräm trädgård
      astronaut drottning hemlighet jordgubbe midsommar prinsessa regnjacka skridskor snöflinga
      cykelhjälm dinosaurie födelsedag helikopter kanelbulle köttbullar nyckelpiga rutschkana sjöstjärna
      sköldpadda tandborste tunnelbana vardagsrum`,
    phrases: [
      'en bil', 'ett hus', 'en katt', 'min bok', 'min hund', 'stor hund', 'röd boll', 'gå hem', 'kom hit',
      'sitt ner', 'hoppa högt', 'jag och du', 'ja tack', 'nej tack', 'hej då', 'god natt', 'god morgon',
      'blå himmel', 'vit snö', 'stort hus', 'rött äpple', 'ny cykel', 'min mamma', 'min pappa', 'vår skola',
      'mitt rum', 'lila blommor', 'söt kanin', 'liten fågel', 'grön groda', 'gul banan', 'varm choklad',
      'kall mjölk', 'glad pojke', 'rolig clown', 'modig pirat', 'lång giraff', 'trött kattunge', 'stor elefant',
      'stark björn', 'snabb raket', 'röd ballong', 'glada barn', 'tre bananer', 'fem äpplen', 'barnen leker',
      'fåglar sjunger', 'fiskar simmar', 'hunden skäller', 'katten sover', 'solen skiner', 'det regnar',
      'vi dansar', 'rita bilder', 'borsta tänderna', 'tvätta händerna', 'söta jordgubbar', 'fin regnbåge',
      'liten nyckelpiga', 'farlig krokodil', 'snabb helikopter', 'god frukost', 'varm pannkaka',
      'god kanelbulle', 'fina glasögon', 'ny tandborste', 'kul lekplats',
      'en röd bil', 'jag ser dig', 'en ny bok', 'ett stort hus', 'vi går hem', 'jag älskar dig', 'det är kallt',
      'det regnar ute', 'det snöar ute', 'vi äter glass', 'musen äter ost', 'pappa kör bil', 'mamma lagar mat',
      'katten på taket', 'hunden äter ben', 'en liten fågel', 'solen skiner idag', 'fisken simmar fort',
      'barnen leker ute', 'jag läser boken', 'katten sover gott', 'grodan hoppar högt', 'jag dricker mjölk',
      'vi bakar kakor', 'ugglan flyger tyst', 'hästen springer fort', 'en söt kattunge', 'en stor elefant',
      'giraffen äter löv', 'apan äter banan', 'boken på bordet', 'bollen under sängen', 'vi bygger snögubbe',
      'en vacker regnbåge', 'en gul ballong', 'min bästa kompis', 'läs en saga', 'rita en bild', 'titta på mig',
      'kom till mig', 'vi cyklar hem', 'jag har glasögon', 'dags att sova', 'björnen älskar honung',
      'kaninen äter morötter', 'fåglarna sjunger vackert', 'krokodilen simmar långsamt', 'fjärilen på blomman',
      'en rolig födelsedag', 'pannkakor med sylt', 'barnen på lekplatsen', 'en röd nyckelpiga',
      'en röd sjöstjärna', 'en snabb helikopter', 'en stor dinosaurie',
    ],
  },

  ru: {
    letters: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    // A lone consonant is read as a preposition (в, к, с) or not at all, so the voice says the letters' names.
    names: {
      Б: 'бэ', В: 'вэ', Г: 'гэ', Д: 'дэ', Ж: 'жэ', З: 'зэ', Й: 'и краткое', К: 'ка', Л: 'эль', М: 'эм', Н: 'эн',
      П: 'пэ', Р: 'эр', С: 'эс', Т: 'тэ', Ф: 'эф', Х: 'ха', Ц: 'цэ', Ч: 'чэ', Ш: 'ша', Щ: 'ща',
      Ъ: 'твёрдый знак', Ь: 'мягкий знак',
    },
    // Sound alike (paired voiced / voiceless, hissing ones, close vowels) or look alike (И Н П, З Э, Ш Щ).
    similar: ['БП', 'ВФ', 'ГКХ', 'ДТ', 'ЖШЩ', 'ЗСЦ', 'ЕЁЭ', 'ИЙЫ', 'ОА', 'УЮ', 'ЯА', 'ЛМН', 'ЧЦЩ', 'ЬЪ', 'ИНП', 'ЗЭ', 'ВБ', 'РЬ'],
    words: `
      ёж уж ус ум юг ты он мы вы да на за по до от из но ну
      бег бок бык год гол два дар дом дуб дым ель жар жук зуб ива кит ком кот куб лак лев лес лёд лом лук мак мел
      мёд мех мир мох мяч нож нос оса пар пёс пол пух рак рис рог рот сад сок сом сон суп сук сын сыр три ухо чай
      час шар щит
      брат ваза вата вода волк глаз гном гора гриб гусь дети день друг дыня дядя ёлка жаба зима игра каша кекс
      кино ключ коза конь лапа лето лиса лист лось лужа луна лыжи мама мост муха мыло мышь мясо небо нога ночь
      нота обед окно папа парк паук поле пони река роза рука рыба рысь сани слон снег сова стол стул сумка тигр
      торт туча утка ужин урок цирк часы шарф шкаф шуба щека юбка
      акула арбуз банан белка булка вилка вишня ветер ведро герой горка гроза груша дождь дверь диван жираф зайка
      зебра змейка книга клоун комар кепка кофта кошка кукла лампа лодка ложка майка мишка мороз мышка мячик
      носки осень парта пенал песок петух пирог пират повар поезд птица пчела ранец рыбка ручка санки свеча
      синий слива сосна сумка пенал трава ягода чашка шапка шарик школа щенок белый рыжий
      альбом берёза гитара добрый доктор дракон жёлтый капуста качели коньки корова краски кролик курица лопата
      малина медуза метель молния молоко облако огурец одеяло радуга ракета рыцарь сказка солнце сестра собака
      сугроб тёплый улитка фонтан футбол хоккей цветок чёрный яблоко звезда машина
      автобус бабочка бабушка барабан бегемот большой варежки варенье весёлый верблюд вкусный девочка дедушка
      дельфин завтрак зеркало зелёный зоопарк капуста кастрюля котёнок красный кровать лисичка лягушка мальчик
      медведь морковь муравей мультик пароход парашют пианино пингвин планета подарок подушка помидор ромашка
      рисунок самовар самокат самолёт сладкий скрипка смешной сметана тарелка телефон тетрадь трактор трамвай
      учитель фонарик шоколад ящерица лимонад
      аквариум апельсин балерина виноград вертолёт грузовик динозавр единорог карандаш каникулы карусель картинка
      картошка клубника королева крокодил кузнечик кукуруза листопад макароны мандарин мармелад мотоцикл
      обезьяна осьминог пельмени пирожное площадка праздник пушистый светофор скакалка скамейка снеговик
      снежинка снегопад солнышко стрекоза художник черепаха черника фотограф
      бутерброд велосипед волшебник воздушный дирижабль звёздочка земляника компьютер космонавт маленький
      мороженое мультфильм одуванчик пластилин подсолнух поросёнок почтальон раскраска спортсмен строитель
      телевизор фломастер футболист черепашка шоколадка
      автомобиль аттракцион библиотека волшебница математика медвежонок муравейник скворечник снегурочка
      сковородка счастливый фотография шоколадный экскаватор`,
    phrases: [
      'мой кот', 'наш дом', 'мой дом', 'наш кот', 'мой мяч', 'наш сад', 'кот ест', 'мы тут', 'мой папа', 'моя мама', 'мой друг', 'мы дома', 'ёж спит', 'кот спит', 'мама спит',
      'иди домой', 'белый снег', 'синее небо', 'тёплое море', 'вкусный торт', 'зелёная трава', 'рыжая лиса',
      'серый волк', 'сладкий мёд', 'горячий чай', 'холодная вода', 'добрый день', 'доброе утро',
      'спокойной ночи', 'птицы поют', 'собака лает', 'дети играют', 'папа читает', 'сестра рисует',
      'брат бегает', 'новая книга', 'моя школа', 'первый класс', 'летний день', 'зимний лес', 'жёлтый банан',
      'спелая груша', 'весёлый клоун', 'большой слон', 'красный мяч', 'маленькая мышка', 'пушистый котёнок',
      'день рождения', 'шоколадный торт', 'воздушный шарик', 'весёлый праздник', 'зелёный крокодил',
      'большой самолёт', 'быстрый вертолёт', 'яркая радуга', 'добрый волшебник', 'смелый пират',
      'красивая бабочка', 'сладкая клубника', 'огромный динозавр', 'детская площадка', 'вкусное мороженое',
      'летит самолёт', 'новый велосипед',
      'я и ты', 'кот и пёс', 'мы и вы', 'сок и чай', 'дом и сад', 'кот и ёж', 'я ем сыр', 'я ем суп', 'я пью сок', 'он и она', 'ты мой друг', 'мы в лесу', 'дом у моря',
      'кот спит дома', 'мы пьём чай', 'кошка на дереве', 'мы идём домой', 'кот ловит мышь', 'птица на ветке',
      'мяч под столом', 'книга на полке', 'рыба в реке', 'дети в школе', 'я люблю маму', 'лиса в лесу',
      'ёж в траве', 'на столе чай', 'у меня кот', 'лодка на реке', 'самолёт в небе', 'звёзды на небе',
      'на улице дождь', 'идёт белый снег', 'я рисую домик', 'я читаю сказку', 'мы играем вместе',
      'папа читает книгу', 'солнце светит ярко', 'зайка ест морковку', 'медведь любит мёд', 'белка грызёт орехи',
      'собака грызёт кость', 'мама печёт пирог', 'дедушка ловит рыбу', 'бабушка вяжет носки', 'на ёлке игрушки',
      'с днём рождения', 'рыбки в аквариуме', 'бабочка на цветке', 'котёнок пьёт молоко', 'крокодил в реке',
      'дельфин в море', 'жираф ест листья', 'обезьяна ест банан', 'черепаха ползёт медленно',
      'лягушка прыгает высоко', 'вертолёт летит высоко', 'мы строим снеговика', 'дети на площадке',
      'большой красный мяч', 'вкусный шоколадный торт', 'динозавры жили давно', 'клубника очень сладкая',
    ],
  },
};
