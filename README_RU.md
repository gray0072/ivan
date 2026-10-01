<div align="center">

<img src="assets/icon.svg" alt="Иконка галереи браузерных игр" width="120" height="120">

# Галерея браузерных игр

**Маленькие самостоятельные браузерные игры на чистом JavaScript. Ничего не нужно устанавливать — просто открой и играй.**

[![Играть онлайн](https://img.shields.io/badge/▶_Играть_онлайн-gray0072.github.io%2Fivan-1b4f8a?style=for-the-badge)](https://gray0072.github.io/ivan/)

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=000&style=flat-square)
![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-E34F26?logo=html5&logoColor=fff&style=flat-square)
![Web Audio](https://img.shields.io/badge/Web_Audio-3fa9f5?style=flat-square)
![No build step](https://img.shields.io/badge/build-none-3ddc97?style=flat-square)
![Mobile friendly](https://img.shields.io/badge/mobile-friendly-ffb627?style=flat-square)
[![License: MIT](https://img.shields.io/badge/license-MIT-9fb0c3?style=flat-square)](LICENSE)

*[Read in English](README.md)*

</div>

---

## 🎮 Игры

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/flight-simulator/"><img src="flight-simulator/screenshot.png" alt="Скриншот симулятора самолёта"></a>
      <h3><img src="flight-simulator/icon.svg" alt="" width="28" height="28" align="center"> Flight Simulator</h3>
      <p>Аркадный симулятор самолёта от первого лица: управление стрелками, спаренная стрельба на Ctrl по воздушным шарикам, посадка на полосу отмеченного аэропорта.</p>
      <p><a href="https://gray0072.github.io/ivan/flight-simulator/"><b>▶ Играть</b></a> · <a href="flight-simulator/">Исходники</a></p>
    </td>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fish-frenzy/"><img src="fish-frenzy/screenshot.png" alt="Скриншот игры про рыб"></a>
      <h3><img src="fish-frenzy/icon.svg" alt="" width="28" height="28" align="center"> Fish Frenzy</h3>
      <p>Аркада «съешь и расти»: управляй рыбкой стрелками или сенсорным джойстиком, ешь ртом планктон и рыб мельче себя, избегай крупных рыб и медуз и поднимайся по пищевой цепи до Морского Царя и максимального размера. Три уровня сложности и рекорды времени.</p>
      <p><a href="https://gray0072.github.io/ivan/fish-frenzy/"><b>▶ Играть</b></a> · <a href="fish-frenzy/">Исходники</a></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://gray0072.github.io/ivan/fun-training/"><img src="fun-training/screenshot.png" alt="Скриншот Fun Training"></a>
      <h3><img src="fun-training/icon.svg" alt="" width="28" height="28" align="center"> Fun Training</h3>
      <p>Игра-тренажёр для школьников: поливай цветок, останавливай зомби, укладывай рельсы перед поездом, держи в воздухе воздушный шар, поддерживай костёр или корми панду, чтобы она не грустила, — успевая отвечать на задания. На монеты корми, одевай своего персонажа и обставляй его комнату.</p>
      <p><a href="https://gray0072.github.io/ivan/fun-training/"><b>▶ Играть</b></a> · <a href="fun-training/">Исходники</a></p>
    </td>
    <td width="50%" valign="top"></td>
  </tr>
</table>

## ✨ Особенности

- **Без установки** — каждая игра запускается прямо в браузере, на компьютере и на телефоне.
- **Сенсорное управление** — экранные джойстики, касание с удержанием и наклон устройства на телефонах и планшетах.
- **Только веб-платформа** — Canvas 2D для графики, Web Audio для синтезированного звука. Без фреймворков и сборки ассетов.
- **Самостоятельные проекты** — каждая игра живёт в своей папке и работает, даже если скопировать её из репозитория.

## 🚀 Запуск локально

```bash
git clone https://github.com/gray0072/ivan.git
cd ivan
npx serve .        # или просто открой любой index.html в браузере
```

## 🌐 Деплой

Сборки нет. GitHub Pages отдаёт файлы прямо из корня ветки `main`
(**Settings → Pages → Deploy from a branch → `main` / `(root)`**), так что пуш в `main` — это и есть весь деплой.

## 📁 Структура проекта

```
/
├── index.html                  # корневая страница-галерея
├── assets/                     # иконка репозитория и картинка для соцсетей
├── README.md / README_RU.md
├── SPEC.md                     # техническая спецификация
├── AGENTS.md                   # инструкции для AI-агентов
├── CLAUDE.md                   # -> ссылается на AGENTS.md
├── flight-simulator/
│   ├── SPEC.md                 # спецификация этой игры
│   ├── index.html              # сама игра
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
├── fish-frenzy/
│   ├── SPEC.md                 # спецификация этой игры
│   ├── index.html              # разметка
│   ├── styles.css, *.js        # стили и код игры, разбитый по файлам
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
├── fun-training/
│   ├── SPEC.md                 # спецификация этой игры
│   ├── index.html, styles.css, *.js
│   ├── README.md / README_RU.md
│   ├── icon.svg
│   └── screenshot.png
└── ...                         # со временем — новые игры, та же структура
```

## 🗺️ Планы

- [ ] Больше мини-игр и экспериментов
- [ ] Поиск/фильтр на странице галереи
- [ ] Переключатель светлой/тёмной темы на странице галереи

## 📄 Лицензия

[MIT](LICENSE)
