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
    return {
      answerMode: oneOf(s.answerMode, ANSWER_MODES.map(a => a.id), d.answerMode),
      lessonLength: oneOf(s.lessonLength, LESSON_LENGTHS, d.lessonLength),
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
    // rates[proc][i] = best coins per task earned on step i + 1 (older saves: every step counts as perfect).
    const rates = {};
    const rsrc = p.rates && typeof p.rates === 'object' ? p.rates : {};
    for (const proc of PROCESSES) {
      const n = Math.max(0, Math.floor(Number(src[proc.id]) || 0));
      progress[proc.id] = n;
      const r = Array.isArray(rsrc[proc.id]) ? rsrc[proc.id] : [];
      rates[proc.id] = Array.from({ length: n }, (_, i) => (r[i] >= 0 && r[i] <= MAX_RATE ? Math.floor(r[i]) : MAX_RATE));
    }
    return {
      id: String(p.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      name: String(p.name || 'Player').slice(0, NAME_MAX),
      avatar: AVATARS.includes(p.avatar) ? p.avatar : AVATARS[0],
      coins: Math.max(0, Math.floor(Number(p.coins) || 0)),
      progress,
      rates,
      settings: cleanSettings(p.settings),
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

  function create(name, avatar) {
    const p = cleanPlayer({ name, avatar });
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
