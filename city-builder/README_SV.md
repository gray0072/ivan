<div align="center">

<img src="icon.svg" alt="" width="96" height="96">

# City Builder

[![Spela online](https://img.shields.io/badge/▶_Spela_online-gray0072.github.io%2Fivan%2Fcity--builder-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/city-builder/)

*[Read in English](README.md)* · *[Читать на русском](README_RU.md)*

<a href="https://gray0072.github.io/ivan/city-builder/"><img src="screenshot.png" alt="Skärmbild från City Builder" width="800"></a>

</div>

Ett litet stadsbyggarspel i webbläsaren, som SimCity fast mycket enklare. Bygg vägar, hus, affärer och fabriker på en karta med en flod, en sjö och skogar. Invånarna flyttar in, går till jobbet och betalar skatt. När de är glada växer stugorna till hus och sedan till höghus, och ditt torp blir en By, en Småstad, en Stad och till slut en Metropol. Se upp för bränder och vårflod!

Spelet finns på engelska, ryska och svenska: välj språk högst upp på startskärmen.

## Så startar du

Öppna [index.html](index.html) i en webbläsare. Inget behöver byggas och ingen server behövs.

## Så spelar du

- Varje byggnad behöver en **väg** som leder till **motorvägen** vid kartans vänstra kant. En byggnad utan väg visar en 🚧-skylt. Över vatten blir vägen en bro.
- **Hus** fylls med invånare. Ungefär en tredjedel av dem jobbar i **affärer**, **fabriker** och stadens tjänster. För få jobb gör alla ledsna.
- **Glädje:** parker, affärer, skolor, en arena och en brandstation i närheten gör ett hus gladare. Fabriksrök, flygbuller, arbetslöshet och höga skatter gör det ledsnare. Tryck på ett hus för att se vad glädjen består av, eller tryck på 😊 för att se ett ansikte över varje hus.
- Ett fullt hus som har varit glatt i tre månader växer: stuga → hus → höghus. Ett höghus behöver också en skola i närheten.
- **Pengar:** varje månad betalar invånare och företag skatt, och du betalar underhåll för vägar, parker och tjänster. Tryck på pengarna för att öppna budgeten och flytta skattereglaget. Högre skatt ger mer pengar men gör invånarna mindre glada.
- **Skulder:** pengarna får gå under $0, men efter några månader med skulder går staden i konkurs och spelet är slut.
- **Titlar:** vid 50 invånare blir staden en By (Brandstation och Vall blir tillgängliga), vid 250 en Småstad (Skola), vid 1 000 en Stad (Arena) och vid 3 000 en Metropol (Flygplats, och fyrverkerier!). Den snabbaste tiden till varje titel blir ett rekord.
- **Bränder:** en byggnad kan börja brinna, oftast en fabrik, och elden kan sprida sig till grannarna. Brandbilen från en brandstation kör längs vägarna och släcker bränder i sitt område. Utan brandstation brinner byggnaden ner till ruiner.
- **Översvämningar:** på våren kan floden svämma över stranden. En **vall** på stranden stoppar vattnet. Översvämmade byggnader skadas.
- **Skadade** byggnader fungerar inte förrän du lagar dem, på byggnadens kort eller med *Laga allt*.
- Staden sparas av sig själv, så du kan komma tillbaka senare och trycka på **Fortsätt**.

## Kontroller

**Mus och tangentbord:**

- Välj ett verktyg i fältet längst ner och **klicka** på kartan för att bygga. En skuggbild visar var byggnaden hamnar (grön om den får plats, röd om inte) och vad den kostar.
- **Dra** med verktyget Väg, Vall eller Bulldozer för att rita en hel linje.
- Utan verktyg öppnar ett **klick** på en byggnad dess kort, och att **dra** flyttar kartan.
- **Högerdrag** eller **piltangenterna** flyttar kartan, **mushjulet** zoomar.
- Tangenter: **R** väg, **H** hus, **S** affär, **F** fabrik, **P** park, **E** brandstation, **K** vall, **C** skola, **M** arena, **A** flygplats, **B** bulldozer.
- **Mellanslag** stoppar och startar tiden, **+** / **−** ändrar farten (⏸ ▶ ▶▶ ▶▶▶). Du kan bygga medan tiden står still.
- **Esc** släpper verktyget eller stänger ett kort; om inget är öppet pausar det spelet.

**Mobil och surfplatta:** spelet går över till helskärm när du startar. **Tryck** för att bygga eller öppna en byggnads kort. **Dra med ett finger** för att flytta kartan, eller för att rita en linje med Väg, Vall eller Bulldozer. **Nyp med två fingrar** för att zooma (med två fingrar flyttas kartan alltid). Byggnader som är större än en ruta visas först som en skuggbild och byggs med knappen **✔**.

## Svårighetsgrad

Välj svårighetsgrad på startskärmen och på konkursskärmen. Valet sparas, och en sparad stad behåller sin egen.

- **Lätt**: $20 000 från början, skatterna ger 20 % mer, underhållet kostar 20 % mindre, en brand ungefär vartannat år och en översvämning ungefär vart fjärde. Du har sex månader på dig att ta dig ur skulderna.
- **Medel**: $12 000 från början, en brand ungefär varje år och en översvämning ungefär vartannat år. Du har fyra månader på dig att ta dig ur skulderna.
- **Svår**: $8 000 från början, skatterna ger 15 % mindre, underhållet kostar 20 % mer, en brand ungefär varje halvår och en översvämning nästan varje vår. Du har bara tre månader på dig att ta dig ur skulderna.

Bränder och översvämningar börjar först när staden har blivit en By.

## Ljud

Spelet skapar alla ljud själv: bygge, vägar, bulldozern, mynt varje månad, brandlarmet, översvämningen, en fanfar för varje ny titel och stadens sorl, som växer med befolkningen. Stäng av dem med **Ljud: Av** på startskärmen eller i pausmenyn. Valet sparas.

## Rekord

Startskärmen sparar för varje svårighetsgrad den snabbaste tiden (i spelets år och månader) till varje titel och den största befolkningen.
