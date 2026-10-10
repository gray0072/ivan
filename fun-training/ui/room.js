// The character's room screen: the room with the character (one SVG) and the shop panel — food, clothes and room
// items. Picking an item tries it on (or shows it in the room); the action button buys, wears / places, takes off
// or feeds. Food flies to the mouth, gets munched in a few bites, then the character reacts to its taste.

const Room = (() => {
  const $ = id => document.getElementById(id);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Purely visual layout in room coordinates (viewBox 0 0 800 500).
  const CHAR_X = 310, CHAR_Y = 236, CHAR_S = 0.9;    // where the character stands (its own coordinates scaled)
  const MOUTH = [400, 344];                          // the mouth, where food goes
  const HEAD_TOP = 196;                              // popups appear above this
  const FOOD_FROM = [740, 250];                      // food flies in from here
  const FOOD_SCALE = 0.55;
  const JUMP_TIME = 0.55, JUMP_HEIGHT = 34;

  // Reactions: popup text, sound, hearts / sparkles, a jump. The face is Look.FACES[kind] when it has one.
  const REACT = {
    love: { text: 'My favorite!', sfx: 'squeak', hearts: 8, jump: true },
    yum: { text: 'Yum!', sfx: 'yum', hearts: 2 },
    bleh: { text: 'Bleh!', sfx: 'bleh' },
    sour: { text: 'Sooo sour!', sfx: 'sour' },
    spicy: { text: 'Hot hot hot!', sfx: 'sizzle' },
    fire: { text: 'ROAR!', sfx: 'burner', hearts: 4, jump: true },
    cold: { text: 'Brrr!', sfx: 'brr' },
    sparkle: { text: 'Wow!', sfx: 'gems', hearts: 5, sparkles: 14, jump: true },
    full: { text: "I'm full!", sfx: 'squeak' },
    giggle: { text: 'Hee hee!', sfx: 'giggle', jump: true },
    proud: { text: 'Looking good!', sparkles: 10, jump: true },
    tryon: { face: 'proud' },
    hungry: { text: "I'm hungry…", sfx: 'rumble', face: 'none' },
  };
  const TASTE_NOTE = {
    love: n => `❤ ${n}'s favorite!`,
    fire: n => `❤ ${n}'s favorite — watch the fire!`,
    sparkle: () => '✨ Magic! Fills the tummy completely',
    sour: () => '🍋 Very sour!',
    spicy: () => '🌶 Very hot!',
    cold: n => `🥶 ${n} doesn't like cold food`,
    bleh: n => `😖 ${n} doesn't like it`,
  };

  let p = null, onExit = null;
  let tab = 'food';
  const slotOf = { wear: 'head', room: 'wall' };
  let sel = null;          // selected food / item id
  let preview = null;      // { slot: item id } being tried on
  let face = null, faceT = 0;
  let jumpT = 0;
  let meal = null;         // { f, reaction, phase: 'fly' | 'eat', t, bites }
  let fx = [];             // { kind: 'text' | 'heart' | 'spark' | 'crumb', x, y, vx, vy, t, life, text, c }
  let fxShown = false;
  let rumbleT = 0;
  let shownFace = '';

  const kindOfTab = () => (tab === 'food' ? 'food' : 'item');
  const entry = id => (id ? (tab === 'food' ? Shop.food(id) : Shop.item(id)) : null);
  const equipNow = () => (preview ? Object.assign({}, p.equip, preview) : p.equip);
  const charName = () => Shop.charOf(p).name;

  // ---------- scene ----------

  function renderScene() {
    const eq = equipNow();
    const c = { character: p.character, equip: eq };
    const layer = slotId => {
      const a = eq[slotId] && ROOM_ART[eq[slotId]];
      if (!a) return '';
      const [x, y] = ROOM_AT[slotId] || [0, 0];
      return `<g transform="translate(${x} ${y})">${a.draw(c)}</g>`;
    };
    $('roomScene').innerHTML = ROOM_ORDER.map(layer).join('') +
      '<g id="charPos" class="charTap"><g id="charBody"></g></g>' + ['toy', 'pet'].map(layer).join('') + '<g id="roomFx"></g>';
    shownFace = '';
    drawChar();
    placeChar();
  }

  function currentFace() {
    if (face) return face;
    if (meal && meal.phase === 'eat') return 'chew';
    return Look.moodOf(Shop.fullness(p));
  }

  function drawChar() {
    const f = currentFace();
    if (f === shownFace) return;
    shownFace = f;
    const g = $('charBody');
    g.innerHTML = Look.inner(p.character, equipNow(), f);
    g.setAttribute('class', 'lk' + (Look.FACES[f].shiver ? ' lk-shiver' : ''));
  }

  function placeChar() {
    const k = jumpT > 0 ? Math.sin(Math.PI * (1 - jumpT / JUMP_TIME)) : 0;
    $('charPos').setAttribute('transform', `translate(${CHAR_X} ${CHAR_Y - k * JUMP_HEIGHT}) scale(${CHAR_S})`);
  }

  function popup(text, x = 400, y = HEAD_TOP) {
    fx = fx.filter(e => e.kind !== 'text');
    fx.push({ kind: 'text', text, x, y, vx: 0, vy: -26, t: 0, life: 1.6 });
  }

  function burst(kind, n, x, y, spread) {
    for (let i = 0; i < n; i++) {
      fx.push({ kind, x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread * 0.5,
        vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 50, t: -i * 0.06, life: 1.3,
        c: ['#ffd23f', '#fff', '#7ad7ff', '#ff8fc7'][i % 4] });
    }
  }

  // Start a reaction: its face for REACT_TIME, popup, sound, hearts / sparkles, a jump.
  function react(kind) {
    const r = REACT[kind];
    const fc = r.face === 'none' ? null : r.face || kind;
    face = fc && Look.FACES[fc] ? fc : null;
    faceT = kind === 'tryon' ? 1.2 : REACT_TIME;
    if (r.text) popup(r.text);
    if (r.sfx && Sfx[r.sfx]) Sfx[r.sfx]();
    if (r.hearts) burst('heart', r.hearts, 400, 300, 160);
    if (r.sparkles) burst('spark', r.sparkles, 400, 330, 220);
    if (r.jump) jumpT = JUMP_TIME;
    drawChar();
    renderHud();
  }

  function heartPath(x, y, s) {
    return `M${x.toFixed(1)} ${(y + s * 0.9).toFixed(1)} c${-s * 1.6} ${-s * 1.1} ${-s * 0.6} ${-s * 2.2} 0 ${-s * 1.3} ` +
      `c${s * 0.6} ${-s * 0.9} ${s * 1.6} ${s * 0.2} 0 ${s * 1.3}Z`;
  }

  function drawFx() {
    if (!meal && !fx.length) {
      if (fxShown) { $('roomFx').innerHTML = ''; fxShown = false; }
      return;
    }
    let h = '';
    if (meal) {
      let x, y, s = FOOD_SCALE;
      if (meal.phase === 'fly') {
        const k = clamp(meal.t / FOOD_FLY_TIME, 0, 1);
        x = lerp(FOOD_FROM[0], MOUTH[0] + 6, k);
        y = lerp(FOOD_FROM[1], MOUTH[1] + 14, k) - Math.sin(Math.PI * k) * 90;
      } else {
        x = MOUTH[0] + 6;
        y = MOUTH[1] + 14;
        s *= 1 - meal.bites / (FOOD_BITES + 1);
      }
      h += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})">${FOOD_ART[meal.f.id]()}</g>`;
    }
    for (const e of fx) {
      if (e.t < 0) continue;
      const a = clamp(1.4 - e.t / e.life * 1.4, 0, 1).toFixed(2);
      if (e.kind === 'text') {
        h += `<text class="roomPop" x="${e.x}" y="${e.y.toFixed(1)}" opacity="${a}">${esc(e.text)}</text>`;
      } else if (e.kind === 'heart') {
        h += `<path d="${heartPath(e.x, e.y, 9)}" fill="#ff4f7b" stroke="${INK}" stroke-width="2" opacity="${a}"/>`;
      } else if (e.kind === 'spark') {
        const r = 9 * (1 - e.t / e.life) + 3;
        h += `<path d="M${e.x} ${e.y - r} L${e.x + r * 0.3} ${e.y - r * 0.3} L${e.x + r} ${e.y} L${e.x + r * 0.3} ${e.y + r * 0.3} ` +
          `L${e.x} ${e.y + r} L${e.x - r * 0.3} ${e.y + r * 0.3} L${e.x - r} ${e.y} L${e.x - r * 0.3} ${e.y - r * 0.3}Z" fill="${e.c}" opacity="${a}"/>`;
      } else {
        h += `<circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="3.5" fill="${e.c}" opacity="${a}"/>`;
      }
    }
    $('roomFx').innerHTML = h;
    fxShown = true;
  }

  function crumbs() {
    for (let i = 0; i < 5; i++) {
      fx.push({ kind: 'crumb', x: MOUTH[0] + (Math.random() - 0.5) * 30, y: MOUTH[1] + 10, vx: (Math.random() - 0.5) * 140,
        vy: -30 - Math.random() * 70, t: 0, life: 0.7, c: ['#ffe6a8', '#c98b4a', '#fff'][i % 3] });
    }
  }

  function update(dt) {
    if (!p) return;
    if (meal) {
      meal.t += dt;
      if (meal.phase === 'fly' && meal.t >= FOOD_FLY_TIME) { meal.phase = 'eat'; meal.t = 0; meal.bites = 0; }
      if (meal.phase === 'eat') {
        while (meal.bites < FOOD_BITES && meal.t >= meal.bites * BITE_TIME) { meal.bites++; Sfx.munch(); crumbs(); }
        if (meal.t >= FOOD_BITES * BITE_TIME + 0.15) {
          const r = meal.reaction;
          meal = null;
          react(r);
          renderPanel(true);
        }
      }
    }
    if (faceT > 0) { faceT -= dt; if (faceT <= 0) face = null; }
    if (jumpT > 0) { jumpT = Math.max(0, jumpT - dt); placeChar(); }
    // A hungry character's tummy rumbles now and then.
    if (!meal && !face && Shop.fullness(p) < FULL_HUNGRY) {
      rumbleT -= dt;
      if (rumbleT <= 0) { rumbleT = HUNGRY_RUMBLE; react('hungry'); }
    }
    for (const e of fx) {
      e.t += dt;
      if (e.t < 0) continue;
      if (e.kind === 'crumb') e.vy += 420 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
    fx = fx.filter(e => e.t < e.life);
    drawChar();
    drawFx();
  }

  // ---------- panel ----------

  function renderHud() {
    const full = Shop.fullness(p);
    const c = Shop.charOf(p);
    $('roomWho').innerHTML = `<b>${esc(p.name)}</b> · ${c.name} <span class="loves">❤ ${c.loves.map(id => Shop.food(id).name).join(', ')}</span>`;
    const fill = $('tummyFill');
    fill.style.width = Math.round(full / FULL_MAX * 100) + '%';
    fill.className = full >= FULL_HAPPY ? 'good' : full >= FULL_HUNGRY ? 'mid' : 'low';
    $('tummyText').textContent = full >= FULL_REFUSE ? 'Full' : full >= FULL_HAPPY ? 'Happy' : full >= FULL_HUNGRY ? 'Peckish'
      : full >= FULL_STARVING ? 'Hungry' : 'Very hungry!';
  }

  // keepFocus: re-focus the card or button that had the focus after the re-render.
  function renderPanel(keepFocus) {
    const focusId = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.id : null;
    const focusAct = document.activeElement === $('infoAct');
    $('roomCoins').textContent = p.coins;
    $('roomGems').textContent = p.gems;
    document.querySelectorAll('#shopTabs .shopTab').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === tab);
      b.classList.toggle('default', b.dataset.tab === tab); // focused when the screen opens
    });
    const chips = $('slotTabs');
    chips.innerHTML = '';
    chips.hidden = tab === 'food';
    if (tab !== 'food') {
      for (const s of ITEM_SLOTS.filter(x => x.kind === tab)) {
        const b = el('button', 'slotTab' + (s.id === slotOf[tab] ? ' on' : ''), `<span class="sIcon">${s.icon}</span><span class="sName">${s.name}</span>`);
        b.title = s.name;
        b.dataset.slot = s.id;
        if (ITEMS.some(it => it.slot === s.id && !Shop.owns(p, it) && Shop.canPay(p, it))) b.insertAdjacentHTML('beforeend', '<i class="dot"></i>');
        b.addEventListener('click', () => {
          slotOf[tab] = s.id;
          select(null);
          renderPanel();
          const nb = chips.querySelector(`[data-slot="${s.id}"]`);
          if (nb) nb.focus();
        });
        chips.append(b);
      }
    }
    const grid = $('itemGrid');
    grid.innerHTML = '';
    const list = tab === 'food' ? FOODS : ITEMS.filter(it => it.slot === slotOf[tab]);
    const c = Shop.charOf(p);
    for (const x of list) {
      const isFood = tab === 'food';
      const owned = !isFood && Shop.owns(p, x);
      const on = !isFood && p.equip[x.slot] === x.id;
      const cls = ['itemCard'];
      if (on) cls.push('on');
      else if (owned) cls.push('owned');
      else if (!Shop.canPay(p, x)) cls.push('cant');
      if (x.gems) cls.push('gem');
      if (sel === x.id) cls.push('sel');
      const tag = on ? '✓' : owned ? (Shop.free(x) ? 'Free' : 'Owned') : Shop.costText(x);
      const fav = isFood && (c.loves.includes(x.id) ? '<i class="fav">❤</i>' : '');
      const b = el('button', cls.join(' '), Shop.thumb(p, x, kindOfTab()) + `<span class="itemTag">${tag}</span>` + (fav || ''));
      b.dataset.id = x.id;
      b.title = x.name;
      b.addEventListener('click', () => { select(sel === x.id && !isFood ? null : x.id); markSel(); });
      grid.append(b);
    }
    renderInfo();
    renderHud();
    if (keepFocus) {
      const t = focusAct ? $('infoAct') : focusId && grid.querySelector(`[data-id="${focusId}"]`);
      if (t) t.focus();
    }
  }

  function markSel() {
    $('itemGrid').querySelectorAll('.itemCard').forEach(b => b.classList.toggle('sel', b.dataset.id === sel));
    renderInfo();
  }

  // Select a food / item; trying on shows a wear / room item that isn't in use.
  function select(id) {
    const had = !!preview;
    sel = id;
    preview = null;
    const x = entry(id);
    if (x && tab !== 'food' && p.equip[x.slot] !== x.id) preview = { [x.slot]: x.id };
    if (preview || had) renderScene();
    if (preview && tab === 'wear') react('tryon');
  }

  function needText(x) {
    if (x.gems) return `Need 💎 ${Shop.missing(p, x)} more — beat bosses (🐲 up to 3, 👑 up to 6)`;
    const n = Shop.missing(p, x), l = Shop.lessonsFor(p, n);
    return `Need 🪙 ${n} more — about ${l} ${l === 1 ? 'lesson' : 'lessons'}`;
  }

  function renderInfo() {
    const x = entry(sel);
    const act = $('infoAct');
    act.classList.remove('off');
    if (!x) {
      $('infoName').textContent = tab === 'food' ? `Feed ${charName()}!` : tab === 'wear' ? 'Clothes' : 'Your room';
      $('infoNote').textContent = tab === 'food' ? `❤ = ${charName()}'s favorite food. A full tummy lasts about ${HUNGER_HOURS / 24} days.`
        : tab === 'wear' ? 'Pick something to try it on.' : 'Pick something to see it in your room.';
      act.hidden = true;
      return;
    }
    act.hidden = false;
    $('infoName').textContent = x.name;
    if (tab === 'food') {
      const t = Shop.taste(p, x);
      const fill = Math.round(x.fill * (Shop.charOf(p).loves.includes(x.id) ? FOOD_LOVE_FILL : 1));
      const notes = [`+${fill} 🍽`];
      if (TASTE_NOTE[t]) notes.push(TASTE_NOTE[t](charName()));
      if (Shop.isFull(p)) notes.push(`${charName()} is full — come back later`);
      else if (!Shop.canPay(p, x)) notes.push(needText(x));
      $('infoNote').textContent = notes.join(' · ');
      act.textContent = `Feed ${Shop.costText(x)}`;
      act.classList.toggle('off', Shop.isFull(p) || !Shop.canPay(p, x) || !!meal);
      return;
    }
    const s = Shop.slot(x.slot);
    const wear = s.kind === 'wear';
    const on = p.equip[x.slot] === x.id;
    if (on && x.id === s.def) {
      $('infoNote').textContent = 'In your room — it was here from the start';
      act.hidden = true;
    } else if (on) {
      $('infoNote').textContent = wear ? `${charName()} is wearing it` : 'In your room';
      const def = s.def && Shop.item(s.def);
      act.textContent = wear ? 'Take off' : def ? `Put back: ${def.name}` : 'Take away';
    } else if (Shop.owns(p, x)) {
      $('infoNote').textContent = wear ? 'Yours · trying it on' : 'Yours · see how it looks';
      act.textContent = wear ? 'Wear it' : 'Put it in the room';
    } else {
      $('infoNote').textContent = (wear ? 'Trying it on · ' : 'Showing it in your room · ') + (Shop.canPay(p, x) ? 'You can buy it!' : needText(x));
      act.textContent = `Buy ${Shop.costText(x)}`;
      act.classList.toggle('off', !Shop.canPay(p, x));
    }
  }

  function shake(b) {
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
  }

  function action() {
    const x = entry(sel);
    const act = $('infoAct');
    if (!x) return;
    if (tab === 'food') {
      if (meal) return;
      if (Shop.isFull(p)) { react('full'); shake(act); return; }
      const r = Shop.feed(p, x);
      if (!r) { shake(act); return; }
      Sfx.spend();
      face = null;
      meal = { f: x, reaction: r, phase: 'fly', t: 0, bites: 0 };
      Sfx.whoosh();
      renderPanel(true);
      return;
    }
    const s = Shop.slot(x.slot);
    let proud = true;
    if (p.equip[x.slot] === x.id) {
      if (x.id === s.def) return;
      Shop.takeOff(p, x.slot);
      Sfx.whoosh();
      proud = false;
    } else if (Shop.owns(p, x)) {
      Shop.use(p, x);
      Sfx.whoosh();
    } else {
      if (!Shop.buy(p, x)) { shake(act); return; }
      Sfx.buy();
    }
    preview = null;
    renderScene();
    if (proud) react('proud');
    renderPanel(true);
  }

  function setTab(t) {
    tab = t;
    select(null);
    renderPanel();
    const b = document.querySelector(`#shopTabs [data-tab="${t}"]`);
    if (b) b.focus();
  }

  // ---------- open / close ----------

  function open(player) {
    p = player;
    sel = null;
    preview = null;
    meal = null;
    face = null;
    faceT = 0;
    jumpT = 0;
    fx = [];
    rumbleT = 0.9;
    if (Shop.fullness(p) < FULL_HUNGRY) tab = 'food';
    renderScene();
    renderPanel();
  }

  function close() {
    if (meal) { meal = null; }
    preview = null;
    p = null;
  }

  // Tapping the character: a giggle (or "I'm hungry…").
  function tap() {
    if (!p || meal) return;
    react(Shop.fullness(p) < FULL_HUNGRY ? 'hungry' : 'giggle');
  }

  // Debug cheat: `[` makes the character hungrier (to test the moods and reactions).
  function key(e) {
    if (e.key === '[') {
      Shop.setFullness(p, Shop.fullness(p) - 25);
      Store.save();
      shownFace = '';
      drawChar();
      renderPanel(true);
      showBanner(`Cheat: fullness ${Math.round(Shop.fullness(p))}`);
      return true;
    }
    return false;
  }

  document.querySelectorAll('#shopTabs .shopTab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('infoAct').addEventListener('click', action);
  $('roomScene').addEventListener('click', e => { if (e.target.closest && e.target.closest('#charPos')) tap(); });

  return { open, close, update, key };
})();
