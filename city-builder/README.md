<div align="center">

<img src="icon.svg" alt="" width="96" height="96">

# City Builder

[![Play online](https://img.shields.io/badge/▶_Play_online-gray0072.github.io%2Fivan%2Fcity--builder-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/city-builder/)

*[Читать на русском](README_RU.md)* · *[Läs på svenska](README_SV.md)*

<a href="https://gray0072.github.io/ivan/city-builder/"><img src="screenshot.png" alt="City Builder screenshot" width="800"></a>

</div>

A small city-building game in the browser, in the spirit of SimCity but much simpler. Lay roads, build houses, shops and factories on a map with a river, a lake and forests. Residents move in, go to work and pay taxes. When they are happy, their cottages grow into houses and then into apartment blocks, and your hamlet becomes a Village, a Town, a City and finally a Metropolis. Watch out for fires and spring floods!

Playable in English, Russian or Swedish: pick the language at the top of the start screen.

## How to run

Open [index.html](index.html) in a browser. There is no build step and no server is needed.

## How to play

- Every building needs a **road** that leads to the **highway** on the left edge of the map. A building without one shows a 🚧 sign. Over water a road becomes a bridge.
- **Houses** fill up with residents. About a third of them work in **shops**, **factories** and the city's services. Too few jobs make everyone unhappy.
- **Happiness:** parks, shops, schools, a stadium and a fire station nearby make a house happier. Factory smoke, airport noise, unemployment and high taxes make it sadder. Tap a house to see what its happiness is made of, or press 😊 to see a face over every house.
- A full house that has been happy for three months grows: cottage → house → apartment block. An apartment block also needs a school nearby.
- **Money:** every month residents and businesses pay taxes and you pay upkeep for roads, parks and services. Tap the money to open the budget and move the tax slider. Higher taxes bring more money but make people less happy.
- **Debt:** you can drop below $0, but after a few months in debt the city goes bankrupt and the game is over.
- **Titles:** at 50 residents your city becomes a Village (unlocks the Fire Station and the Embankment), at 250 a Town (School), at 1 000 a City (Stadium) and at 3 000 a Metropolis (Airport, and fireworks!). The fastest time to each title is a record.
- **Fires:** a building can catch fire, factories most often, and the fire may jump to its neighbours. A fire station's truck drives along the roads and puts out fires in its area. Without one, the building burns down to ruins.
- **Floods:** in spring the river may flood the shore. An **embankment** on the shore stops the water. Flooded buildings are damaged.
- **Damaged** buildings don't work until you repair them, either from the building's card or with *Repair all*.
- The city saves itself, so you can come back later and press **Continue**.

## Controls

**Mouse and keyboard:**

- Pick a tool in the toolbar at the bottom, then **click** the map to build. A ghost shows where the building will stand (green if it fits, red if not) and how much it costs.
- **Drag** with the Road, Embankment or Bulldozer tool to draw a whole line.
- With no tool, **click** a building to see its card. **Drag** the map to move it.
- **Right drag** or the **arrow keys** move the map; the **mouse wheel** zooms.
- Keys: **R** road, **H** house, **S** shop, **F** factory, **P** park, **E** fire station, **K** embankment, **C** school, **M** stadium, **A** airport, **B** bulldozer.
- **Space** stops and restarts time; **+** / **−** change the speed (⏸ ▶ ▶▶ ▶▶▶). You can build while time is stopped.
- **Esc** drops the tool or closes a card; with nothing open it pauses the game.

**Phone and tablet:** the game goes fullscreen when you start. **Tap** to build or to open a building's card. **Drag with one finger** to move the map, or to draw a line with the Road, Embankment or Bulldozer tool. **Pinch with two fingers** to zoom (two fingers always move the map). Buildings bigger than one tile show a ghost first, and you build them with the **✔** button.

## Difficulty

Pick a difficulty on the start screen and on the bankruptcy screen. It is remembered, and a saved city keeps its own.

- **Easy**: $20 000 to start, taxes bring 20 % more, upkeep costs 20 % less, a fire about every two years and a flood about every four. You have six months to get out of debt.
- **Medium**: $12 000 to start, a fire about every year and a flood about every two years. You have four months to get out of debt.
- **Hard**: $8 000 to start, taxes bring 15 % less, upkeep costs 20 % more, a fire about every six months and a flood almost every spring. You have only three months to get out of debt.

Fires and floods start only once the city is a Village.

## Sound

All sounds are made by the game itself: building, roads, the bulldozer, coins every month, the fire alarm, the flood, a fanfare for every new title and the city's hum, which grows with the population. Switch them off with **Sound: Off** on the start screen or in the pause menu. The choice is remembered.

## Records

The start screen keeps, for each difficulty, the fastest time (in game years and months) to each title and the biggest population.
