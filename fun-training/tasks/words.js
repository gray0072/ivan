// Reading task data per language: the alphabet, letters that sound or look alike, everyday words a school kid knows,
// and short meaningful phrases of 2–3 words. Words are grouped by length when loaded; any word (also one of the
// phrases) may serve as a close wrong option for another.

const READ_DATA = {
  en: {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    // Letters that sound alike (B C D E G P T V Z all end in "ee") or look alike in lower case (b d p q).
    similar: ['BCDEGPTVZ', 'AHJK', 'FLMNSX', 'IY', 'QUW', 'OQ', 'BDPQ', 'MNW', 'IJL', 'UV'],
    words: `
      am an as at be by do go ha he hi if in is it ma me my no of oh on or ow ox so to up us we
      ace add age air all and ant any ape arm art ask axe bad bag bat bay bed bee bib big bin bit boo bow box boy bud
      bug bun bus cab can cap car cat cod coo cot cow cry cub cup cut dad day den did dig dip dog dot dry dug ear eat
      eel egg elf elk emu end eye fan far few fig fin fit fix fly fog fox fry fun fur gap gem get got gum gym had ham
      hat hay hen her him hip his hit hog hop hot how hug hum hut ice ink ivy jam jar jaw jet jog joy jug key kid kit
      lap leg let lid lip log lot low mad man map mat may men mix mom moo mop mow mud mug nap net new nod not now nut
      oak odd off oil old one out owl pad pal pan pat paw pay peg pen pet pie pig pin pod pop pot pug pup put ram ran
      rat ray red rib rod row rub rug run sad saw say sea she shy sip sit six sky soy spy sun tag tap tea ten the tie
      tin tip toe top toy try tub tug two van vet wag was wax way web wet who why wig win wow yak yam yes yet you yum
      zap zip zoo
      baby back bake ball band bark barn bath bead beak bean bear beef bell belt best bike bird bite blow blue boat
      bone book boot bowl bump bush buzz cake call calm camp card cart cave chef chip clap claw club coat coin cold
      comb cone cook cool corn crab crow cute dark deep deer desk dish dive doll door down draw drop drum duck dust
      edge face fall farm fast feed feet fern find fire fish five flag foam fold food foot fork four frog full game
      gift girl glow glue goal goat gold good grey grow hand hard hare harp have heel help here hide hill hive hold
      hole home hook hope horn hose hour joke jump kick king kiss kite kiwi knee lake lamb lamp lawn lazy leaf like
      lion look loud love mail make mask maze meat mice milk mint mole moon moss moth nail name neck nest nice nine
      nose oven page palm park pear peel pink play plum poem pole pond pony pool pull puma push quiz race rain rake
      rice ride ring road roar rock roll roof room root rope rose sail sand seal seed ship shoe shop silk sing skip
      slow snap snow soap sock sofa soft some song soup spin star stew stop swan swim tail take talk tall tape taxi
      team tent tidy tile tiny toad tofu tool town tray tree trip tuba tube tuna turn twig twin vase very vest wait
      wake walk wall wand warm wash wave wear wide wild wind wing wish wolf wool word work worm yard yarn yawn year
      yoga yolk zoom
      acorn actor alien angry ankle apple apron arrow badge bagel baker beach beard bench berry black block board
      brave bread brick broom brown brush buddy bunny cabin camel candy canoe chair chalk cheek chess chest chick
      chips clean climb clock cloud clown cocoa couch crane crawl crown curly daisy dance dizzy donut dream dress
      drink eagle early earth eight empty fairy feast fence field flame floor flute foggy forty fresh frost fruit
      funny ghost giant glass glove goose grape grass green happy heart hello hippo honey horse hotel house igloo
      jeans jelly juice juicy kayak koala laugh lemon light llama lucky lunch magic mango maple medal melon messy
      money moose mouse muddy music night noisy nurse ocean olive onion otter paint panda paper party peach pearl
      petal phone piano piece pizza plane plant plate prize puppy quack queen quick quiet quilt radio rainy right
      river robin robot ruler salad salty scarf seven shape shark sharp sheep shell shiny shirt silly skate skirt
      skunk sleep slide sloth smell smile snack snail snake snore snowy space spicy spoon sport squid stick stone
      stork storm story sugar sunny sweet swing table taste teddy teeth three thumb tiger tired toast tooth towel
      tower train truck tulip tummy uncle wagon watch water whale wheel white windy witch world yacht yummy zebra
      anchor animal artist autumn baking ballet bamboo banana basket beetle bottle branch breeze bridge bright bubble
      bucket burger butter button cactus camera candle carpet carrot castle cheese cherry circle clever cookie cousin
      cowboy crayon dancer dinner doctor donkey dragon eraser family farmer father finger flower forest fridge friend
      frozen garden guitar hammer helmet hockey hoodie hungry insect island jacket jungle kettle kitten ladder lesson
      little lizard magnet marble meadow mitten monkey mother muffin napkin noodle orange palace parade parrot peanut
      pebble pencil pepper pickle picnic pigeon pillow pirate planet pocket poodle potato pretty puddle purple puzzle
      rabbit ribbon riddle rocket sailor salmon sandal school secret seesaw shadow shower shrimp silver singer sister
      sleepy sneeze soccer spider splash sponge spring square sticky stripe summer sunset teacup teapot tennis thirty
      ticket tickle tiptoe toffee tomato tongue travel trophy tunnel turtle twelve twenty violin waffle wallet walnut
      walrus wiggle window winter wizard wooden yellow yogurt zipper
      acrobat avocado balloon bathtub bedroom bedtime beehive bicycle biscuit blanket blender blossom bowling brother
      buffalo cabbage camping captain cartoon chicken chimney coconut compass costume cracker cricket crystal cupcake
      cushion dancing dentist dessert diamond dolphin drawing drummer excited eyebrow feather firefly fishing freezer
      giraffe glasses glitter goggles gorilla grandma grandpa haircut hamster harvest hiccups holiday iceberg journey
      juggler jumping ketchup kingdom kitchen lantern laundry leopard lettuce library lobster lullaby mailbox meerkat
      mermaid monster morning oatmeal octopus ostrich outside pajamas pancake parents peacock pelican penguin perfect
      picture plumber popcorn postman present pretzel pudding pumpkin pyramid raccoon rainbow reading rooster sailing
      sausage scooter seaweed shampoo singing skating slipper snowman sparkle sparrow spinach sunrise sweater teacher
      thunder toaster tractor trumpet unicorn vanilla volcano weather weekend whistle
      airplane alphabet anteater aquarium armchair backpack backyard baseball bathroom birthday bluebird bookcase
      bracelet broccoli building calendar campfire carousel children chipmunk cinnamon climbing computer cookbook
      cucumber cupboard daffodil daughter dinosaur doghouse doorbell dumpling earmuffs earrings elephant envelope
      exercise explorer farmyard fishbowl flamingo football goldfish hedgehog homework hospital kangaroo keyboard
      kindness ladybird lemonade lollipop lunchbox magician meatball midnight mosquito mountain mushroom necklace
      notebook painting parakeet pinecone platypus playtime porridge postcard princess question raincoat raindrop
      reindeer sailboat sandwich scissors seahorse seashell shoelace shopping sidewalk sleeping sneakers snowball
      snowfall squirrel starfish sunlight sunshine surprise swimming swimsuit teaspoon thousand toboggan tomorrow
      tortoise treasure triangle tricycle trousers umbrella upstairs vacation wardrobe whiskers wildlife
      adventure afternoon alligator astronaut beanstalk beautiful blackbird blueberry bookshelf breakfast bubblegum
      bumblebee buttercup butterfly cardboard carpenter cartwheel chameleon chocolate classmate classroom cranberry
      crocodile delicious detective dragonfly fantastic fireplace fireworks fisherman flowerpot furniture gardening
      hairbrush hamburger handstand happiness harmonica honeycomb hopscotch horseshoe houseboat hurricane invention
      invisible jellybean jellyfish lifeguard lightning lunchtime microwave milkshake moonlight motorboat newspaper
      orchestra parachute pineapple porcupine raspberry rectangle saxophone scarecrow scientist snowboard snowflake
      snowstorm something spaceship spacesuit spaghetti spiderweb stopwatch storybook submarine sunflower sunscreen
      tangerine telephone telescope tracksuit treehouse vegetable wallpaper waterfall wonderful xylophone yesterday
      zookeeper
      basketball binoculars blackberry blackboard calculator cheesecake chessboard chopsticks dictionary dishwasher
      downstairs drumsticks everything flashlight footprints friendship goalkeeper gooseberry grapefruit greenhouse
      gymnastics headphones helicopter kingfisher lighthouse lumberjack microphone motorcycle nutcracker paintbrush
      peppermint photograph pillowcase playground rainforest rhinoceros sandcastle schoolyard skateboard skyscraper
      somersault spacecraft strawberry sunglasses tablecloth tablespoon tambourine television toothbrush toothpaste
      trampoline underwater volleyball watermelon waterslide wheelchair wonderland woodpecker wristwatch`,
    phrases: [
      'I am', 'my cat', 'my dog', 'big dog', 'red hat', 'hot sun', 'hot tea', 'big box', 'my mom', 'my dad',
      'go home', 'run fast', 'sit down', 'come here', 'jump high', 'look up', 'wake up', 'fly away', 'thank you',
      'see you', 'we play', 'dogs bark', 'birds sing', 'fish swim', 'cats sleep', 'frogs jump', 'blue sky',
      'good night', 'good morning', 'green frog', 'little bird', 'funny clown', 'sweet apple', 'cold water',
      'warm milk', 'white snow', 'open door', 'new friend', 'eat lunch', 'pink flower', 'fresh bread', 'red balloon',
      'shiny star', 'dark night', 'magic wand', 'read books', 'brush teeth', 'wash hands', 'play football',
      'yellow banana', 'brave pirate', 'tall giraffe', 'sleepy kitten', 'big elephant', 'happy birthday',
      'chocolate cake', 'strawberry jam', 'purple dinosaur', 'scary monster', 'hungry crocodile',
      'beautiful butterfly', 'noisy helicopter', 'fast motorcycle', 'sunny afternoon', 'juicy watermelon',
      'busy playground', 'friendly dolphin', 'tiny ladybird', 'hi mom', 'hug me', 'sit up', 'go out', 'get up',
      'my toy', 'red cap', 'hot pie', 'fun day', 'wet dog', 'an egg', 'say yes', 'hop on', 'my pen', 'the end',
      'eat cake', 'play ball', 'nice day', 'come back', 'fast car', 'slow down', 'turn left', 'pink pig', 'baby duck',
      'lazy cat', 'soft toy', 'good job', 'well done', 'sunny day', 'clean room', 'brave lion', 'green grass',
      'big smile', 'climb trees', 'fresh fruit', 'count sheep', 'shiny shoes', 'hello there', 'yellow duck',
      'orange juice', 'silver moon', 'purple grapes', 'little fish', 'cookie jar', 'summer rain', 'winter coat',
      'school bus', 'bedroom door', 'morning sun', 'chicken soup', 'kitchen table', 'funny cartoon', 'warm blanket',
      'birthday cake', 'swimming pool', 'dinosaur bones', 'elephant ears', 'mountain top', 'green cucumber',
      'chocolate milk', 'breakfast time', 'beautiful day', 'butterfly wings', 'pineapple juice', 'sunflower seeds',
      'hot chocolate', 'eat breakfast', 'strawberry milk', 'watermelon slice', 'basketball game', 'helicopter ride',
      'new sunglasses', 'eat watermelon', 'I see you', 'a big cat', 'the red bus', 'my dog ran', 'I love you',
      'go to bed', 'we go home', 'a red apple', 'my blue bike', 'it is cold', 'look at me', 'come with me',
      'read a book', 'the cat sleeps', 'the dog barks', 'birds can fly', 'fish can swim', 'cats like fish',
      'kids love candy', 'the moon shines', 'snow is white', 'open the door', 'a little bird', 'the green frog',
      'in the garden', 'on the table', 'under the bed', 'I like apples', 'it is raining', 'my best friend',
      'time for school', 'draw a picture', 'wash your hands', 'brush your teeth', 'we play football',
      'the tall giraffe', 'a yellow banana', 'a chocolate cake', 'monkeys eat bananas', 'elephants drink water',
      'a beautiful butterfly', 'the purple dinosaur', 'a noisy helicopter', 'strawberry ice cream',
      'a busy playground', 'the friendly dolphin', 'a sleepy hedgehog', 'my birthday party', 'a sunny afternoon',
      'a juicy watermelon', 'we like spaghetti', 'the crocodile swims', 'ride a skateboard', 'climb the mountain',
      'build a snowman', 'eat your breakfast', 'the kangaroo jumps', 'an orange pumpkin', 'a magic unicorn',
      'a big hug', 'I can run', 'I am six', 'we can hop', 'my red cup', 'the old owl', 'a hot day', 'a fox ran',
      'you and me', 'the pig ran', 'a new toy', 'dad got up', 'I like cake', 'we play tag', 'a long walk',
      'the bell rang', 'I can swim', 'time to eat', 'a cold day', 'I want milk', 'kick the ball', 'fly a kite',
      'ring the bell', 'feed the cat', 'a soft bed', 'the clock ticks', 'I love pizza', 'the horse runs',
      'a white cloud', 'draw a house', 'catch the ball', 'a funny joke', 'my lucky coin', 'the train stops',
      'a quiet mouse', 'the rabbit hops', 'a silver spoon', 'my school bag', 'open the window', 'the spider spins',
      'a pretty flower', 'a hungry bear', 'the dolphin jumps', 'my big brother', 'a yummy cupcake',
      'clean the kitchen', 'the teacher smiles', 'the penguin slides', 'a giant octopus', 'a happy penguin',
      'the elephant walks', 'a big umbrella', 'my new backpack', 'the squirrel climbs', 'find the treasure',
      'do your homework', 'a pink flamingo', 'a funny kangaroo', 'a wonderful day', 'the butterfly flies',
      'a tasty hamburger', 'a tiny snowflake', 'watch the fireworks', 'the astronaut waves', 'the helicopter lands',
      'my new toothbrush', 'a red motorcycle', 'wear your sunglasses', 'the woodpecker taps', 'a tall lighthouse',
      'a big strawberry',
    ],
  },

  sv: {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ',
    // Sound alike (be, ce, de, ge, pe, te, ve · eff, ell, emm, enn, ess, ärr · hå, kå, å) or look alike (b d p q).
    similar: ['BCDEGPTV', 'FLMNRS', 'HKÅO', 'UYÖ', 'AÅÄ', 'OÖ', 'EÄ', 'IJY', 'QK', 'BDPQ', 'MNW', 'IJL', 'UV', 'SXZ'],
    words: `
      av bi by du ek en fe ge ha in is ja ko le ni nu om på sy ur ut vi ål åt är
      apa arg arm ben bil blå bok bro båt bär dag dal dra far fat fem fin fot frö får get god grå gul gås haj hav hon
      hus hår här hög hök jag jul kam knä kul kyl lag lam lek lim lov låg lår lök löv mat mor mun mus mål mås nej ner
      nos nöt och orm ost pöl ris ros rot rum räv röd sax sex sju sjö sko snö sol son stå sur säl söt tak tam tio tom
      tre två tåg ugn upp ute val vit våt väg vän åka ägg älg öga öra
      anka axel bada baka barn berg bild blöt boll bord bred brev bror brun bröd busa buss dans dela duva dörr elev
      fika filt fiol fisk flod fyra glad golf golv gosa gran gris gräs grön gröt hall hals halv hand hatt hink hiss
      häst häxa höra höst inne jojo jord kaka kall katt keps kind klok kniv kock kopp kort korv kung köra lama leka
      leta lila ljus lugn låda lång läsa lätt läxa mage majs mask mjuk moln mugg myra måla måne natt nysa nyår näsa
      regn rita rosa rund saft saga sand sked skog skor smör sova spel stad sten stol stor sudd sval svan sylt såga
      sång säng tand tjej tjur tolv träd tupp tyst tält varg varm vila vind visa vägg väst växa åska åsna åtta ödla
      öken
      banan björk björn blixt blåsa bulle bygga byxor cykel cykla dansa dimma docka drake fiska frukt fråga fågel
      fånga först gissa glass godis groda gräva gunga gömma hagel hoppa huvud hänga jacka kalas kamel kanin kanot
      koala kotte krita kudde kusin kvast kväll kälke lampa lejon limma linne liten lukta lunch manet mjölk morot
      mossa musik mygga mössa nalle packa padda pappa pasta penna piano pirat pizza pojke polis prins pulka päron
      radio raket ringa robot räkna samla senap simma skata skatt skola skägg slott smart snäll soffa spade spöke
      stark stava stolt storm svamp svart tavla tiger titta tjock tjugo tokig tomat tomte troll träna tröja trött
      tugga tumme tårta täcke uggla vakna vante vifta villa vinka vänta zebra åttio äpple ärtor öppna
      ananas badkar badrum blomma blåbär blåsig borsta citron delfin dotter dricka ekorre finger fjäril fnissa fröken
      fyrtio gaffel gammal garage gardin gepard geting giraff gitarr glädje glömma hallon handla himmel hockey honung
      hummer hundra jullov kaktus kittla klippa klocka knacka kompis kramas kärlek leksak lingon lodjur läkare lärare
      matsal middag morgon mormor moster paddla planet plocka pussel saftig sexton sjunga skidor skriva slicka snurra
      socker solros sommar sovrum sticka strand stubbe stängd syster sömnig tennis trumma tulpan turkos vatten vinter
      vissla
      alfabet apelsin armbåge badanka badboll balkong ballong berätta blomkål choklad ekollon elefant fjorton frukost
      fräknar fönster halsduk hamster handduk isglass julmust kladdig klossar klättra kortlek krispig krusbär känguru
      körsbär lastbil leopard lycklig läsebok marsvin maskros monster overall paraply pingvin plommon popcorn potatis
      present prickig påsklov påskris riddare schampo simhall simning sjögräs skjorta skratta smörgås snickra snöboll
      solsken spindel springa stjärna strumpa stövlar tallrik telefon traktor trettio trevlig tärning törstig undulat
      yoghurt äventyr
      ambulans baddräkt brandbil brandman brevlåda broccoli dockvagn fiskespö flodhäst flygplan förskola glasögon
      glittrig gosedjur gympasal handboll hjortron igelkott ishockey julafton jättebra kastrull kattunge klänning
      krokodil lekplats lägenhet majstång mandarin mattebok pannkaka papegoja polisbil påskhare regnbåge ryggsäck
      sandlåda segelbåt skridsko snögubbe snöstorm snöängel spagetti tamburin tandkräm trädgård tvilling utforska
      ögonbryn
      astronaut bläckfisk drottning enhörning färgpenna hemlighet innebandy jordgubbe jättestor kälkbacke ljusstake
      makaroner mellanmål midsommar mjukglass nattlinne prinsessa promenera regnjacka skalbagge skolväska skridskor
      snöbollar snöflinga sockerbit sommarlov stekpanna suddgummi tomteluva trampolin trekantig trollstav välkommen
      brevbärare cykelhjälm dammsugare dinosaurie fiskpinnar födelsedag glasspinne grävmaskin hamburgare helikopter
      julstjärna kanelbulle köttbullar lingonsylt motorcykel noshörning nyckelpiga pepparkaka potatismos pulkabacke
      pytteliten regnkläder rutschkana sjöjungfru sjöstjärna sköldpadda soluppgång studsmatta såpbubblor tandborste
      termometer tunnelbana vardagsrum`,
    phrases: [
      'en bil', 'ett hus', 'en katt', 'min bok', 'min hund', 'stor hund', 'röd boll', 'gå hem', 'kom hit', 'sitt ner',
      'hoppa högt', 'ja tack', 'nej tack', 'hej då', 'god natt', 'god morgon', 'blå himmel', 'vit snö', 'stort hus',
      'rött äpple', 'ny cykel', 'min mamma', 'min pappa', 'vår skola', 'mitt rum', 'lila blommor', 'söt kanin',
      'liten fågel', 'grön groda', 'gul banan', 'varm choklad', 'kall mjölk', 'glad pojke', 'rolig clown',
      'modig pirat', 'lång giraff', 'trött kattunge', 'stor elefant', 'stark björn', 'snabb raket', 'röd ballong',
      'glada barn', 'tre bananer', 'fem äpplen', 'barnen leker', 'fåglar sjunger', 'fiskar simmar', 'hunden skäller',
      'katten sover', 'solen skiner', 'det regnar', 'vi dansar', 'rita bilder', 'borsta tänderna', 'tvätta händerna',
      'söta jordgubbar', 'fin regnbåge', 'liten nyckelpiga', 'farlig krokodil', 'snabb helikopter', 'god frukost',
      'varm pannkaka', 'god kanelbulle', 'fina glasögon', 'ny tandborste', 'kul lekplats', 'en ko', 'ett ägg',
      'en bok', 'min vän', 'god dag', 'gå ut', 'se upp', 'söt mus', 'min arm', 'fem får', 'tio kor', 'grå mus',
      'vit gås', 'god mat', 'kul lek', 'gå ner', 'god jul', 'stor båt', 'glad hund', 'min katt', 'fina skor',
      'kom hem', 'fyra ben', 'elva barn', 'tolv ägg', 'min tand', 'lång orm', 'rund boll', 'vita moln', 'sitt still',
      'grönt gräs', 'vit kanin', 'mjuk nalle', 'röda rosor', 'snäll hund', 'rolig lek', 'stora vågor', 'spela boll',
      'kasta boll', 'tjock katt', 'gammal båt', 'randig tiger', 'sömnig katt', 'morfar fiskar', 'plocka bär',
      'god middag', 'hjälpa mamma', 'ugglan sover', 'plocka blommor', 'lycklig hund', 'vit isbjörn', 'stäng fönstret',
      'kängurun hoppar', 'grön krokodil', 'färgglad fjäril', 'gul kyckling', 'lila enhörning', 'glad astronaut',
      'min skolväska', 'välkommen hem', 'gräshoppan hoppar', 'många köttbullar', 'snäll tandläkare', 'söt sköldpadda',
      'jag och du', 'en röd bil', 'jag ser dig', 'en ny bok', 'ett stort hus', 'vi går hem', 'jag älskar dig',
      'det är kallt', 'det regnar ute', 'det snöar ute', 'vi äter glass', 'musen äter ost', 'pappa kör bil',
      'mamma lagar mat', 'katten på taket', 'hunden äter ben', 'en liten fågel', 'solen skiner idag',
      'fisken simmar fort', 'barnen leker ute', 'jag läser boken', 'katten sover gott', 'grodan hoppar högt',
      'jag dricker mjölk', 'vi bakar kakor', 'ugglan flyger tyst', 'hästen springer fort', 'en söt kattunge',
      'en stor elefant', 'giraffen äter löv', 'apan äter banan', 'boken på bordet', 'bollen under sängen',
      'vi bygger snögubbe', 'en vacker regnbåge', 'en gul ballong', 'min bästa kompis', 'läs en saga', 'rita en bild',
      'titta på mig', 'kom till mig', 'vi cyklar hem', 'jag har glasögon', 'dags att sova', 'björnen älskar honung',
      'kaninen äter morötter', 'fåglarna sjunger vackert', 'krokodilen simmar långsamt', 'fjärilen på blomman',
      'en rolig födelsedag', 'pannkakor med sylt', 'barnen på lekplatsen', 'en röd nyckelpiga', 'en röd sjöstjärna',
      'en snabb helikopter', 'en stor dinosaurie', 'en röd ros', 'en blå båt', 'han är arg', 'en gul bil',
      'en fin dag', 'ta en bok', 'en röd orm', 'en gul sol', 'jag är sju', 'han åt mat', 'ett gult hus',
      'en stor fisk', 'en grå häst', 'en blå bil', 'ett rött tåg', 'vi går ut', 'en kall dag', 'jag vill bada',
      'hon är glad', 'vi åker buss', 'vi åker tåg', 'tack för maten', 'tre gula ankor', 'ett stort träd',
      'han sover gott', 'vi leker ute', 'jag läser högt', 'vi bakar bullar', 'en hemlig skatt', 'en blåsig dag',
      'en regnig dag', 'en vacker dag', 'vi åker skidor', 'vi bygger koja', 'mormor stickar vantar',
      'ett saftigt päron', 'jag är hungrig', 'jag är törstig', 'ett gammalt slott', 'en tom tallrik',
      'en ny klänning', 'en lång promenad', 'ett stort flygplan', 'en röd brandbil', 'vi har picknick',
      'jag har sommarlov', 'vi bygger sandslott', 'vi kastar snöbollar', 'en röd tomteluva', 'vi åker skridskor',
      'en god kladdkaka', 'en glad sjöjungfru', 'en varm kanelbulle', 'en blå motorcykel', 'ett högt vattenfall',
      'vi hoppar studsmatta', 'en grön dinosaurie', 'vi blåser såpbubblor',
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
      вы да до ёж ей за из им их мы на не но ну ой он от по то ты уж ум ус щи юг як
      бег бок бум бык ваш вяз газ где год гол дар два дед дом дуб душ дым его ель ёрш ещё жар жук зал зуб ива иду имя
      как кий кит ком кот куб лак лев лёд лес лещ лоб лом лук май мак мёд мел мех миг мир мой мох моя мяч нет нож нос
      они оно оса ось пар пёс пик пол пою пух раз рак рис рог рот ряд сад сок сом сон сто сук суп сын сыр сыч там три
      тут ухо фея ход хор чай час чиж что шаг шар шея шум шью щит это юла яма
      алый арфа бант баян блин брат ваза вата вода волк глаз гном гора град грач гриб губы гусь дать день дети джем
      дочь друг дыня дядя ёлка енот есть жаба жара жить зима зонт игра иней июль карп каша кекс кино клад клей клён
      ключ кожа коза конь кофе кран лань лапа лето лиса лист лифт лось лужа луна лыжи мало мама март матч мопс море
      морж мост муха мыло мышь мясо наши небо нога ноль нота ночь обед овца один окно орех осёл отец очки пазл папа
      парк паук пень пить поле пони пояс приз пруд пюре пять река репа роза роща рука руль рыба рысь сало сани слон
      снег сова соль стол стул тётя тигр торт туча удав ужин урок утка утро утюг ушко хлеб цирк часы чудо шарф шить
      шкаф шуба щека щука юбка язык яхта
      акула арбуз банан баран белка белый булка ведро весна ветер ветка вечер взять вилка вишня волна вьюга герой
      горка город горох гроза груша дверь диван дождь доска дятел живот жираф жучок зайка закат зебра карта каток
      кепка кефир класс клоун книга ковёр комар кофта кошка кубик кукла кухня лампа лимон лодка ложка майка малыш
      маска метла метро милый мишка мороз моряк мышка мячик найти новый носки океан олень омлет осень палец панда
      парта пенал песня песок петух пират пирог пицца плечо повар поезд полка птица пчела ранец робот ручей ручка
      рыбак рыбка рыжий салат санки сахар свеча семья серый синий слива слово сокол сорок сосна спать спорт среда
      старт стена сумка такси танец театр тихий трава труба туман туфли учить финиш фрукт хомяк цифра чайка чашка
      шапка шарик школа шляпа шорты штора щенок ягода
      август альбом ананас апрель артист бегать берёза варить ворота восемь гитара глобус голова голубь гулять дарить
      десять добрый доктор домино дракон думать жёлтый завтра звезда змейка играть искать кактус камень качели кислый
      клеить комета коньки корова король костюм краски кресло кролик курица куртка лежать лепить лесной ловить лопата
      лошадь малина машина медуза метель молния молоко облако огород огурец одеяло пальма первый персик пещера платье
      победа поляна радуга ракета рыцарь рюкзак сажать сапоги свитер сестра сказка смелый собака солнце старый стоять
      страус сугроб тёмный теннис тёплый тренер тюлень улитка утёнок ученик фонтан футбол хоккей хотеть цветок чайник
      чёрный четыре читать шуметь яблоко
      автобус бабочка бабушка барабан бегемот большой ботинки бросать быстрый варежки варенье великан верблюд весёлый
      вкусный воробей горячий девочка дедушка декабрь дельфин детский длинный дружный жужжать завтрак закрыть звонить
      зелёный зеркало золотой зоопарк инженер капитан капуста кенгуру команда комната конфета концерт кормить котёнок
      котлета кошечка красный кровать кукушка лимонад линейка лисичка любимый лягушка мальчик медведь мечтать морковь
      мультик муравей ножницы обедать октябрь парашют паровоз пароход пианино пингвин плавать планета подарок подруга
      подушка помидор пылесос пятница ракетка ребёнок рисунок розовый ромашка рубашка самовар самокат самолёт светлый
      сегодня сильный скрипка сладкий слушать сметана смешной собачка солёный соловей сосиска стадион строить сюрприз
      тарелка телефон тетрадь трактор трамвай тюльпан убирать учебник ученица учитель фонарик храбрый чемодан чемпион
      черника четверг шахматы шоколад ящерица
      аквапарк аквариум апельсин аэропорт балерина вертолёт виноград вишнёвый водитель волейбол волчонок гирлянда
      говорить готовить грузовик гусеница динозавр единорог каникулы карандаш картинка картошка карусель кастрюля
      квартира клубника козлёнок кораблик королева короткий красивый крокодил кузнечик кукуруза ласточка листопад
      макароны мандарин мармелад морковка мотоцикл обезьяна обнимать огромный осьминог отдыхать пельмени пирожное
      писатель площадка пожарный помогать праздник продавец пуговица пушистый расчёска рисовать родители самосвал
      светофор сентябрь скакалка скамейка смеяться снеговик снегопад снежинка солнышко стрекоза тигрёнок тридцать
      утренник фокусник фотограф художник цветочек цыплёнок черепаха чудесный школьник школьный
      будильник бульдозер бутерброд велосипед ветеринар воздушный волшебник волшебный девяносто дирижабль жеребёнок
      звёздочка земляника картофель кинотеатр компьютер кондуктор космонавт кроссовки крошечный маленький медвежата
      микроскоп мороженое насекомое огородник одуванчик отличница паровозик песочница пирамидка пластилин подсолнух
      поросёнок почтальон пробовать пятнистый раскраска рисование светлячок серпантин сестрёнка сказочник смородина
      солнечный спортсмен строитель танцевать телевизор фломастер футболист черепашка шахматист шоколадка
      автомобиль аттракцион барабанщик библиотека волшебница волшебство двенадцать деревянный золотистый квадратный
      клубничный комбинезон кукарекать кукурузный математика медвежонок мультфильм муравейник подоконник прадедушка
      семнадцать скворечник сковородка снегурочка счастливый троллейбус фиолетовый фотография шоколадный экскаватор`,
    phrases: [
      'мой кот', 'наш дом', 'мой дом', 'наш кот', 'мой мяч', 'наш сад', 'кот ест', 'мы тут', 'мой папа', 'моя мама',
      'мой друг', 'мы дома', 'ёж спит', 'кот спит', 'мама спит', 'иди домой', 'белый снег', 'синее небо',
      'тёплое море', 'вкусный торт', 'зелёная трава', 'рыжая лиса', 'серый волк', 'сладкий мёд', 'горячий чай',
      'холодная вода', 'добрый день', 'доброе утро', 'спокойной ночи', 'птицы поют', 'собака лает', 'дети играют',
      'папа читает', 'сестра рисует', 'брат бегает', 'новая книга', 'моя школа', 'первый класс', 'летний день',
      'зимний лес', 'жёлтый банан', 'спелая груша', 'весёлый клоун', 'большой слон', 'красный мяч', 'маленькая мышка',
      'пушистый котёнок', 'день рождения', 'шоколадный торт', 'воздушный шарик', 'весёлый праздник',
      'зелёный крокодил', 'большой самолёт', 'быстрый вертолёт', 'яркая радуга', 'добрый волшебник', 'смелый пират',
      'красивая бабочка', 'сладкая клубника', 'огромный динозавр', 'детская площадка', 'вкусное мороженое',
      'летит самолёт', 'новый велосипед', 'мой дед', 'наш пёс', 'мой сок', 'наш зал', 'где ты', 'это ёж', 'мой брат',
      'моя тётя', 'наши дети', 'мама шьёт', 'папа поёт', 'папа дома', 'лиса спит', 'идёт снег', 'серый ёж',
      'новый дом', 'умный пёс', 'белая коза', 'новая кукла', 'шесть утят', 'дождь идёт', 'ветер дует', 'синий океан',
      'весна пришла', 'зелёный огурец', 'тёплое одеяло', 'старый дедушка', 'розовый фламинго', 'хитрая лиса',
      'смелый пожарный', 'сладкий арбуз', 'круглый мячик', 'первый снег', 'громкий барабан', 'быстрая река',
      'красивое платье', 'школьный звонок', 'любимая игрушка', 'золотая рыбка', 'новогодняя ёлка', 'полосатый тигр',
      'морская звезда', 'солнечный день', 'интересная книга', 'оранжевый апельсин', 'коричневый медведь',
      'стеклянный стакан', 'двенадцать месяцев', 'шоколадная конфета', 'девочка рисует', 'вкусный обед',
      'пчела летит', 'щенок играет', 'рыбы плавают', 'я и ты', 'кот и пёс', 'мы и вы', 'сок и чай', 'дом и сад',
      'кот и ёж', 'я ем сыр', 'я ем суп', 'я пью сок', 'он и она', 'ты мой друг', 'мы в лесу', 'дом у моря',
      'кот спит дома', 'мы пьём чай', 'кошка на дереве', 'мы идём домой', 'кот ловит мышь', 'птица на ветке',
      'мяч под столом', 'книга на полке', 'рыба в реке', 'дети в школе', 'я люблю маму', 'лиса в лесу', 'ёж в траве',
      'на столе чай', 'у меня кот', 'лодка на реке', 'самолёт в небе', 'звёзды на небе', 'на улице дождь',
      'идёт белый снег', 'я рисую домик', 'я читаю сказку', 'мы играем вместе', 'папа читает книгу',
      'солнце светит ярко', 'зайка ест морковку', 'медведь любит мёд', 'белка грызёт орехи', 'собака грызёт кость',
      'мама печёт пирог', 'дедушка ловит рыбу', 'бабушка вяжет носки', 'на ёлке игрушки', 'с днём рождения',
      'рыбки в аквариуме', 'бабочка на цветке', 'котёнок пьёт молоко', 'крокодил в реке', 'дельфин в море',
      'жираф ест листья', 'обезьяна ест банан', 'черепаха ползёт медленно', 'лягушка прыгает высоко',
      'вертолёт летит высоко', 'мы строим снеговика', 'дети на площадке', 'большой красный мяч',
      'вкусный шоколадный торт', 'динозавры жили давно', 'клубника очень сладкая', 'мы с ним', 'я и он', 'ёж и уж',
      'жук и оса', 'сом и рак', 'чай и мёд', 'сыр и рис', 'юла и мяч', 'дед и я', 'он ест мёд', 'кот ест сыр',
      'вот мой дом', 'где мой мяч', 'это наш дом', 'мой пёс ест', 'мама и папа', 'мама и я', 'лиса и волк',
      'гусь и утка', 'гном и фея', 'лето и зима', 'день и ночь', 'кит в море', 'волк в лесу', 'кот на окне',
      'мяч на полу', 'дед пьёт чай', 'папа ест кашу', 'мне семь лет', 'мы пьём сок', 'книга и ручка', 'рыбка в пруду',
      'мама варит суп', 'я люблю лето', 'кот видит мышь', 'папа чинит кран', 'сова в дупле', 'мой новый друг',
      'мама читает сказку', 'папа моет машину', 'едем на море', 'идём в школу', 'утки в пруду', 'я рисую радугу',
      'бабушка печёт блины', 'играем в мяч', 'папа строит дом', 'брат пьёт молоко', 'кошка ловит рыбку',
      'слон пьёт воду', 'зайчик ест капусту', 'белка на ветке', 'поезд едет быстро', 'корабль в море',
      'на ветке птица', 'в саду яблоки', 'у кота котята', 'у мамы торт', 'жираф очень высокий', 'мишка любит малину',
      'идём в цирк', 'я люблю рисовать', 'катаемся с горки', 'мы пускаем кораблики', 'папа включает телевизор',
      'я надеваю ботинки', 'ракета в небе', 'кузнечик в траве', 'мы смотрим мультфильм', 'кот мурлычет тихо',
      'у меня велосипед', 'мама гладит кошку', 'бабушка вяжет шарф',
    ],
  },
};
