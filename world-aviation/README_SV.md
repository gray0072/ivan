# <img src="icon.svg" alt="" width="48" height="48" align="center"> World Aviation

*[Read in English](README.md)* · *[Читать на русском](README_RU.md)*

En flygsimulator med vy från cockpit och en pilotkarriär i webbläsaren. Du är en svensk trafikpilot med EASA ATPL och ett litet flygbolag med bas på **Stockholm Arlanda**. Du börjar med inrikesflyg i Sverige — Göteborg, Malmö, Visby, Kiruna norr om polcirkeln — vinner sedan Skandinavien och Nordatlanten och, region för region, hela världen: London och Paris, Dubai och Johannesburg, New York och Mexico City, Tokyo och Sydney. Varje flygning går från gate till gate: pushback, motorstart, taxning, start, väder och fel, landning och parkering vid gaten.

![Skärmbild](screenshot.png)

**▶ Spela: [gray0072.github.io/ivan/world-aviation/](https://gray0072.github.io/ivan/world-aviation/)**

## Så kör du

Öppna [index.html](index.html) i en webbläsare — inget byggsteg, ingen server behövs. 3D-vyn kräver WebGL (three.js ligger i projektmappen).

## En flygning

1. **Vid gaten** trycker du **Enter** — bogserbilen trycker ut dig på plattan. Starta motorerna (**Enter**) och se N1 och EGT stiga.
2. **Taxning**: **Enter** släpper parkeringsbromsen; lite gas (**1**–**3**), styr med **← →**, bromsa med **B** och följ den gula pilen till väntepunkten.
3. Vid **väntepunkten** fäller du startklaffar (**F**) och begär startklarering (**Enter**). Linjera upp, full gas (**9**), dra (**↓**) vid Vr, landställ upp (**G**).
4. **Autopiloten** (**Y**): i NAV-läge flyger den rutten, ansluter till slutlig inflygning och följer ILS-glidbanan ner till 200 fot (60 m). **T** snabbar upp tiden under resan (×2 … ×8, upp till ×64 under marschen) — bara med autopiloten på.
5. **Inflygning**: klaffar och landställ ute, landa för hand från 200 fot (60 m) i Vref, bromsa och sakta ner under 35 knop (65 km/h).
6. **Taxa in** efter pilen, stanna i parkeringsrutan vid din gate och dra åt parkeringsbromsen (**Mellanslag**). Motorerna stängs av och genomgången visar betyget och fakturan.

Du kan också börja ett uppdrag **efter pushback** — bogserbilen har redan tagit dig till väntepunkten och kunden betalar en bonus för markhanteringen.

## Kontroller

- **↑ ↓** eller **W S** — tippning (↓ lyfter nosen) · **← →** eller **A D** — roll, och styrning på marken · **Q E** — sidroder
- **Z X** eller **− +** — gas · **1**…**9** — 10 %…90 % · **0** — tomgång
- **Enter** — nästa steg på marken: pushback, start, taxning, startklarering
- **G** landställ · **F / V** klaffar ut / in · **B** bromsar (håll) · **Mellanslag** parkeringsbroms · **R** spoiler · **K** avisning
- **Y** autopilot · **N** tillbaka till programmet (NAV längs rutten och planerad höjd — efter att du ändrat kurs eller höjd) · **, .** vald höjd · **; '** vald kurs (HDG-läge)
- **T** tidsacceleration · **C / Shift+C** nästa / föregående vy: cockpit, bakifrån, framifrån bakåt, vinge, fena, landställ, ovanifrån, torn / förbiflygning · **M** karta · **I** instrumentbelysning · **H** kontrollkort · **Esc** paus

**På mobil eller surfplatta** går spelet till helskärm när du startar (där webbläsaren tillåter det). **Vänstra halvan** av skärmen är en flytande joystick — den dyker upp där tummen landar: dra nedåt för att lyfta nosen, åt sidorna för att rolla och för att styra på marken. **Reglaget vid högra kanten** är gasen. Knapparna uppe till höger är **Go** (pushback, start, taxning, klarering), landställ, klaffar, bromsar, parkeringsbroms, autopilot, tidsacceleration, vy, karta, spoiler, NAV (tillbaka till programmet), avisning (Ice) och menyn. Båda tummarna fungerar samtidigt, så du kan flyga och arbeta en checklista på en gång.

Kontrollerna fungerar med alla tangentbordslayouter (tangenterna läses efter sin plats, inte efter bokstaven).

**Ljud**: jetmotorerna tjuter och dånar med gasen, propellrarna dunkar, hjulen dunsar över plattfogarna, bromsarna väser, landställ och klaffar surrar och låser med en duns, däcken tjuter vid sättningen — och en röst ropar "V one", "rotate" och höjderna ner till "ten" vid landningen.

## Nödsituationer

Varje flygning drar sina problem: motorbrand eller motorbortfall, bränsleläcka, isbildning, vindskjuvning, fågelkollision, tryckfall i kabinen, ett landställ som inte går ut, hydraul- eller navigationsfel, en sjuk passagerare, en last som har förskjutits… Då stannar tidsaccelerationen, varningen ljuder och en **QRH-checklista** öppnas: klicka stegen i rätt ordning innan tiden tar slut, annars förvärras felet — skador, förlorade motorer, förlorat bränsle, lägre betalning.

## Svårighetsgrad

Väljs på startskärmen och i paus- och genomgångsdialogerna, och sparas mellan besöken:

- **Easy** — halva vinden och lätt turbulens, ett problem åt gången, checklistans steg i ordning med nästa steg markerat och 50 % mer tid, generös landningsbedömning, inga deadlines och en taxihjälp som håller dig på linjen.
- **Medium** — riktig vind och turbulens, ibland två problem under en flygning, checklistans steg blandade (du måste kunna ordningen), vanliga deadlines och bedömning.
- **Hard** — stark vind och kraftig turbulens, två problem varje flygning, 25 % mindre tid på checklistorna, korta deadlines, sträng bedömning och mer skador.

## Karriär

Pengarna är svenska kronor. Varje uppdrag betalar för sträckan och lasten, plus bonusar för landningsbetyget, punktlighet och hanterade nödsituationer, minus leasingen av planet (per flygtimme), det förbrukade bränslet, reparationer och avdrag.

- **Nätverk** — världen öppnas en region i taget: **Sverige** (där du börjar), **Skandinavien och Nordatlanten** (Norges fjordar, Finland, Danmark, Island, Grönland, Svalbard), **Europa**, **Mellanöstern och Afrika**, **Amerika** och **Asien och Stilla havet** — 114 riktiga flygplatser. Trafikrättigheterna till varje region kräver anseende och flygningar och kostar pengar. Från Arlanda visar tavlan de öppna regionerna; borta visar den flygningen hem och vidare sträckor, så att andra sidan jorden nås i etapper på upp till 4 500 nm (8 300 km).
- **Långdistans** — på långa sträckor går tidsaccelerationen upp till ×64 under marschflygningen; Stockholm–New York tar ungefär tio minuter i verklig tid.
- **Hangar** — tio flygplan, från 19-sitsiga turbopropen Vikna 19 och bushplanet Frostwing till **Boeing 737-800**, **Airbus A320neo**, **Airbus A350-900** och den fyrmotoriga fraktaren **Boeing 747-8F**, alla med egen vikt, egna farter, egen räckvidd, egna krav på banan och egen 3D-modell.
- **Utbildning** — 16 kurser i fyra grenar (Allmänt, Passagerare, Frakt, Bush & SAR). Varje kurs slutar med ett kort prov (3 av 4 rätt) och låser upp flygplan, uppdragstyper eller verkliga fördelar: tips i checklistorna, mer tid vid nödsituationer, långsammare isbildning.
- **Karriär** — anseende hos tre kundgrupper, certifikat, rekord och loggboken. Under −50 000 kr dras drifttillståndet in och karriären är slut.

## Flygbolag och flygplatser

Kunderna är riktiga flygbolag: SAS, Norwegian, Finnair och Widerøe hemma, sedan Lufthansa, British Airways, KLM, Emirates, Qatar Airways, Delta, Qantas och ett 75-tal till — passagerarbolag, fraktbolag (DHL, FedEx, UPS, Cargolux, West Atlantic) och bushflyg och ambulansflyg. Varje bolag har sin logga på uppdragstavlan, och ditt flygplan flyger i färgerna hos bolaget som hyrt det, med namnet på flygkroppen och emblemet på fenan. Hemmabolagen står vid gaterna och har sina loggor på hangarerna.

Varje flygplats känns igen från cockpit: namnet med stora bokstäver på terminaltaket, en "Welcome"-banderoll med stadens symbol (Tre kronor i Stockholm, Big Ben, Eiffeltornet, Burj Khalifa, operahuset i Sydney…), landets flagga och stadens flagga på taket och över tornet — de vajar i vinden, liksom vindstruten. Banorna har betongändar med fogar, däckmärken, vägrenar och blast pads, kant- och centrumljus, inflygningsljus med löpande blixtljus och en fungerande PAPI (två vita, två röda: på glidbanan); taxibanorna har vägrenar och kantlinjer, plattan har betongplattor och uppställningsmarkeringar, och runt fältet finns väg, parkering och ringväg.

## Prov

Varje kurs slutar med ett kort prov: fyra frågor, tre rätt för godkänt. De är skrivna med enkla ord — en skolelev kan klura ut dem — med en knapp för **Ledtråd** och en förklaring efter varje svar, och de kan göras på **engelska, ryska eller svenska** (välj på provskärmen; valet sparas).

## Enheter och kartan

**Units** på startskärmen (och i pausen): flygets enheter — fot, knop, nautiska mil, fot per minut — eller **metriska**: meter, km/h, kilometer, m/s, avrundade till rimliga tal. Uppmaningar, meddelanden, skärmar och instrument följer inställningen.

**Kartan** (**M**) ritar spåret du faktiskt har flugit — gult på marken, grönt i luften — ovanpå den planerade rutten.

## Grafik

**Auto** (standard) väljer Medium på mobiler och High i övrigt och sänker nivån om bildfrekvensen faller; **Low**, **Medium** och **High** styr terrängens detaljer, siktavståndet, molnen och träden.

## Teknik

Ren HTML + CSS + vanilla JavaScript uppdelad efter ansvar (`flight.js`, `systems.js`, `world.js`, `geodata.js`, `terrain.js`, `models.js`, `airport3d.js`, `scene3d.js`, `instruments.js`, `game.js`, …; flygplatser, länder och flygbolag i `data/`, flaggor, stadssymboler och emblem ritas av `art/`), inget byggsteg. 3D-världen använder three.js (medföljer som `three.min.js`), cockpit och instrument är Canvas 2D och ljudet syntetiseras med Web Audio API.
