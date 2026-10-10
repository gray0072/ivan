// Players, their settings and progress in localStorage.

const Store = (() => {
  let data = { players: [], lastPlayerId: null };

  const oneOf = (v, list, def) => (list.includes(v) ? v : def);

  function cleanSettings(s) {
    s = s && typeof s === 'object' ? s : {};
    const m = s.math && typeof s.math === 'object' ? s.math : {};
    const d = DEFAULT_SETTINGS;
    const opIds = OPERATIONS.map(o => o.id);
    let ops = Array.isArray(m.ops) ? m.ops.filter(o => opIds.includes(o)) : [];
    if (!ops.length) ops = d.math.ops.slice();
    const limits = {};
    for (const id of opIds) {
      const v = m.limits && m.limits[id];
      limits[id] = oneOf(v, LIMITS, d.math.limits[id]);
    }
    const typeIds = TASK_TYPES.map(t => t.id);
    let types = Array.isArray(s.types) ? typeIds.filter(id => s.types.includes(id)) : [];
    if (!types.length) types = d.types.slice();
    const sc = s.scale && typeof s.scale === 'object' ? s.scale : {};
    let parts = Array.isArray(sc.parts) ? SCALE_PARTS.filter(n => sc.parts.includes(n)) : [];
    if (!parts.length) parts = d.scale.parts.slice();
    const rd = s.read && typeof s.read === 'object' ? s.read : {};
    const langIds = READ_LANGS.map(l => l.id);
    let navLang = '';
    try { navLang = String(navigator.language || '').slice(0, 2).toLowerCase(); } catch (e) { /* ignore */ }
    return {
      answerMode: oneOf(s.answerMode, ANSWER_MODES.map(a => a.id), d.answerMode),
      lessonLength: oneOf(s.lessonLength, LESSON_LENGTHS, d.lessonLength),
      types,
      scale: {
        parts,
        limit: oneOf(sc.limit, SCALE_LIMITS, d.scale.limit),
        labels: oneOf(sc.labels, SCALE_LABELS.map(x => x.id), d.scale.labels),
        speed: oneOf(sc.speed, SPEEDS.map(x => x.id), d.scale.speed),
      },
      read: {
        lang: oneOf(rd.lang, langIds, langIds.includes(navLang) ? navLang : d.read.lang), // new: the browser's language
        size: oneOf(rd.size, READ_SIZES, d.read.size),
        words: oneOf(rd.words, READ_WORD_COUNTS, d.read.words),
        speed: oneOf(rd.speed, SPEEDS.map(x => x.id), d.read.speed),
      },
      math: {
        ops: opIds.filter(id => ops.includes(id)),
        operands: oneOf(m.operands, OPERAND_COUNTS, d.math.operands),
        mix: !!m.mix,
        limits,
        speed: oneOf(m.speed, SPEEDS.map(x => x.id), d.math.speed),
      },
    };
  }

  function cleanPlayer(p) {
    const progress = {};
    const src = p.progress && typeof p.progress === 'object' ? p.progress : {};
    // rates[proc][i] = best rate (0–3, by mistakes) of step i + 1 (older saves: every step counts as perfect);
    // best[proc][i] = most coins earned on it, a replay pays only what it beats (older saves: rate × lesson length);
    // bestGems[proc][i] = most diamonds earned on it (boss steps; older saves: none yet, a replay can earn them).
    const rates = {}, best = {}, bestGems = {};
    const gsrc = p.bestGems && typeof p.bestGems === 'object' ? p.bestGems : {};
    const rsrc = p.rates && typeof p.rates === 'object' ? p.rates : {};
    const bsrc = p.best && typeof p.best === 'object' ? p.best : {};
    const settings = cleanSettings(p.settings);
    for (const proc of PROCESSES) {
      const n = Math.max(0, Math.floor(Number(src[proc.id]) || 0));
      progress[proc.id] = n;
      const r = Array.isArray(rsrc[proc.id]) ? rsrc[proc.id] : [];
      rates[proc.id] = Array.from({ length: n }, (_, i) => (r[i] >= 0 && r[i] <= MAX_RATE ? Math.floor(r[i]) : MAX_RATE));
      const b = Array.isArray(bsrc[proc.id]) ? bsrc[proc.id] : [];
      best[proc.id] = Array.from({ length: n }, (_, i) => (b[i] >= 0 ? Math.floor(b[i]) : rates[proc.id][i] * settings.lessonLength));
      const g = Array.isArray(gsrc[proc.id]) ? gsrc[proc.id] : [];
      bestGems[proc.id] = Array.from({ length: n }, (_, i) => (g[i] >= 0 ? Math.floor(g[i]) : 0));
    }
    // The character (older saves: the one nearest to their emoji avatar), what's bought and worn / placed.
    const charIds = CHARACTERS.map(c => c.id);
    const character = charIds.includes(p.character) ? p.character : OLD_AVATARS[p.avatar] || charIds[0];
    const itemIds = ITEMS.map(it => it.id);
    const owned = Array.isArray(p.owned) ? itemIds.filter(id => p.owned.includes(id)) : [];
    const equip = {};
    const esrc = p.equip && typeof p.equip === 'object' ? p.equip : {};
    for (const slot of ITEM_SLOTS) {
      const it = ITEMS.find(x => x.id === esrc[slot.id] && x.slot === slot.id);
      if (it && (owned.includes(it.id) || !it.price && !it.gems)) equip[slot.id] = it.id;
      else if (slot.def) equip[slot.id] = slot.def;
    }
    const now = Date.now();
    const fedAt = Number(p.fedAt) > 0 && Number(p.fedAt) <= now ? Number(p.fedAt) : now;
    return {
      id: String(p.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      name: String(p.name || 'Player').slice(0, NAME_MAX),
      character,
      fullness: p.fullness >= 0 ? Math.min(FULL_MAX, Number(p.fullness)) : FULL_START, // at fedAt; drops HUNGER_HOURS from full to empty
      fedAt,
      owned,
      equip,
      coins: Math.max(0, Math.floor(Number(p.coins) || 0)),
      gems: Math.max(0, Math.floor(Number(p.gems) || 0)), // diamonds 💎 from bosses
      progress,
      rates,
      best,
      bestGems,
      settings,
    };
  }

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (d && Array.isArray(d.players)) {
        data.players = d.players.filter(p => p && typeof p === 'object').map(cleanPlayer);
        data.lastPlayerId = d.lastPlayerId || null;
      }
    } catch (e) { /* no storage — start empty */ }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function create(name, character) {
    const p = cleanPlayer({ name, character });
    data.players.push(p);
    data.lastPlayerId = p.id;
    save();
    return p;
  }

  function remove(id) {
    data.players = data.players.filter(p => p.id !== id);
    if (data.lastPlayerId === id) data.lastPlayerId = null;
    save();
  }

  function setLast(id) { data.lastPlayerId = id; save(); }

  return {
    load, save, create, remove, setLast,
    players: () => data.players,
    get: id => data.players.find(p => p.id === id) || null,
    lastId: () => data.lastPlayerId,
  };
})();
