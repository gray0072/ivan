'use strict';

// Wiggle Wars — the versus setup: the two teams (name, colour, Human / CPU), a row of toggles per
// match setting, a preview of the map with "New map", and a toggle per weapon. Every change is
// remembered (core/storage.js). game.js shows it, and Start reads Setup.settings.

const SETUP_ROWS = [
  { key: 'worms', label: 'Worms per team', values: [1, 2, 3, 4, 5, 6] },
  { key: 'hp', label: 'Health', values: HEALTH_OPTIONS },
  { key: 'turnTime', label: 'Turn time', values: TURN_OPTIONS, text: (v) => tr('{n} s', { n: v }) },
  { key: 'map', label: 'Map', values: MAP_ORDER.concat('random'), text: (v) => (v === 'random' ? tr('Random') : tr(MAP_KINDS[v].name)) },
  { key: 'theme', label: 'Theme', values: THEME_ORDER.concat('random'), text: (v) => (v === 'random' ? tr('Random') : tr(THEMES[v].name)) },
  { key: 'wind', label: 'Wind', values: ['off', 'normal', 'strong'], text: (v) => tr({ off: 'Off', normal: 'Normal', strong: 'Strong' }[v]) },
  { key: 'crates', label: 'Crates', values: ['off', 'some', 'many'], text: (v) => tr({ off: 'Off', some: 'Some', many: 'Many' }[v]) },
  { key: 'mines', label: 'Mines', values: MINE_COUNT },
  { key: 'barrels', label: 'Oil barrels', values: BARREL_COUNT },
  { key: 'sd', label: 'Sudden death', values: SD_OPTIONS, text: (v) => (v ? tr('after {n}', { n: v }) : tr('Off')) }
];

const Setup = (() => {
  const $ = (id) => document.getElementById(id);
  let s = null;
  let previewBits = null, previewTimer = 0;

  function save() { Storage.saveSettings(s); }

  function renderTeams() {
    const box = $('setupTeams');
    box.innerHTML = '';
    s.teams.forEach((t, i) => {
      const other = s.teams[1 - i];
      const card = document.createElement('div');
      card.className = 'teamCard';
      card.style.borderColor = teamColor(t.color).main;
      const input = document.createElement('input');
      input.type = 'text'; input.maxLength = 16; input.className = 'teamName';
      input.value = t.name === DEFAULT_TEAMS[i].name ? tr(t.name) : t.name;
      input.setAttribute('aria-label', tr('Team name'));
      input.addEventListener('input', () => { t.name = input.value; save(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); e.stopPropagation(); });
      const sw = document.createElement('div');
      sw.className = 'swatches';
      for (const c of TEAM_COLORS) {
        const b = document.createElement('button');
        b.className = 'swatch' + (c.id === t.color ? ' on' : '');
        b.style.background = c.main;
        b.disabled = c.id === other.color;
        b.title = c.id;
        b.addEventListener('click', () => { t.color = c.id; save(); renderTeams(); });
        sw.appendChild(b);
      }
      const who = document.createElement('div');
      who.className = 'btnRow small';
      for (const cpu of [false, true]) {
        const b = document.createElement('button');
        b.className = 'btn toggle' + (t.cpu === cpu ? ' on' : '');
        b.textContent = cpu ? '🤖 ' + tr('CPU') : tr('Human');
        b.addEventListener('click', () => { t.cpu = cpu; save(); renderTeams(); });
        who.appendChild(b);
      }
      card.append(input, sw, who);
      box.appendChild(card);
    });
  }

  function renderRows() {
    const box = $('setupRows');
    box.innerHTML = '';
    for (const row of SETUP_ROWS) {
      const line = document.createElement('div');
      line.className = 'setRow';
      const label = document.createElement('span');
      label.className = 'setLabel';
      label.textContent = tr(row.label);
      const opts = document.createElement('div');
      opts.className = 'setOpts';
      for (const v of row.values) {
        const b = document.createElement('button');
        b.className = 'btn toggle' + (s[row.key] === v ? ' on' : '');
        b.textContent = row.text ? row.text(v) : String(v);
        b.addEventListener('click', () => {
          s[row.key] = v;
          if (row.key === 'map') s.seed = null;
          save(); renderRows();
          if (row.key === 'map' || row.key === 'theme') preview();
        });
        opts.appendChild(b);
      }
      line.append(label, opts);
      box.appendChild(line);
    }
  }

  function renderWeapons() {
    const box = $('setupWeapons');
    box.innerHTML = '';
    for (const id of SETUP_WEAPONS) {
      const b = document.createElement('button');
      b.className = 'wToggle' + (s.weapons[id] !== false ? ' on' : '');
      b.title = tr(WEAPONS[id].desc);
      b.appendChild(WeaponArt.icon(id, 28));
      const n = document.createElement('span');
      n.textContent = tr(WEAPONS[id].name);
      b.appendChild(n);
      b.addEventListener('click', () => { s.weapons[id] = s.weapons[id] === false; save(); renderWeapons(); });
      box.appendChild(b);
    }
  }
  function setAll(on) { for (const id of SETUP_WEAPONS) s.weapons[id] = on; save(); renderWeapons(); }

  // the map's picture: a concrete kind is shown with the seed Start will use
  function preview() {
    clearTimeout(previewTimer);
    const cv = $('mapPreview'), c = cv.getContext('2d');
    $('newMapBtn').hidden = s.map === 'random';
    if (s.map === 'random') {
      const th = THEMES[s.theme] || THEMES.meadow;
      c.fillStyle = th.sky[1]; c.fillRect(0, 0, cv.width, cv.height);
      c.fillStyle = th.top; c.font = 'bold 54px "Segoe UI", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('?', cv.width / 2, cv.height / 2);
      return;
    }
    if (!s.seed) s.seed = randomSeed();
    previewTimer = setTimeout(() => {
      previewBits = previewBits || new Uint8Array(WORLD_W * WORLD_H);
      MapGen.generate(s.map, s.seed, previewBits);
      TerrainView.preview(cv, s.theme === 'random' ? 'meadow' : s.theme, previewBits);
    }, 30);
  }

  function open() {
    s = Storage.settings();
    renderTeams(); renderRows(); renderWeapons(); preview();
  }
  function refresh() { if (s) { renderTeams(); renderRows(); renderWeapons(); preview(); } }

  $('newMapBtn').addEventListener('click', () => { s.seed = randomSeed(); preview(); });
  $('allWeapons').addEventListener('click', () => setAll(true));
  $('noWeapons').addEventListener('click', () => setAll(false));

  return {
    open, refresh,
    // the settings to start with: names filled in, the previewed seed kept
    get settings() {
      const out = JSON.parse(JSON.stringify(s));
      out.seed = s.map === 'random' ? null : s.seed;
      out.teams.forEach((t, i) => {
        t.name = (t.name || '').trim();
        if (!t.name || t.name === DEFAULT_TEAMS[i].name) t.name = tr(DEFAULT_TEAMS[i].name);
      });
      return out;
    }
  };
})();
