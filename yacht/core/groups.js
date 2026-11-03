'use strict';

// Yacht — the saved groups of players and the remembered settings, in localStorage under the yacht.
// prefix (the origin is shared with every other app). Every write re-reads the rest first and
// changes only its own group, so a group another tab changed is not overwritten. A failed write
// (storage full or blocked) returns false; the screens say so. Used by game.js and the screens.

const Groups = (() => {
  const KEY = 'yacht.groups.v1';

  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      if (data && Array.isArray(data.groups)) return data;
    } catch (e) { /* no storage, or not our JSON: counts as empty */ }
    return { activeId: null, groups: [] };
  }
  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }
  const newId = (prefix) => prefix + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);

  function update(id, change) {
    const data = read();
    const group = data.groups.find((g) => g.id === id);
    if (!group) return false;
    change(group);
    return write(data);
  }

  return {
    KEY,
    all() { return read().groups; },
    get(id) { return read().groups.find((g) => g.id === id) || null; },
    active() {
      const data = read();
      return data.groups.find((g) => g.id === data.activeId) || data.groups[0] || null;
    },
    setActive(id) {
      const data = read();
      data.activeId = id;
      return write(data);
    },
    // players: [{ id?, name }], those without an id are new
    create(name, players) {
      const data = read();
      const group = {
        id: newId('g'),
        name,
        players: players.map((p) => ({ id: p.id || newId('p'), name: p.name })),
        nextFirst: 0,
        current: null,
        games: []
      };
      data.groups.push(group);
      data.activeId = group.id;
      return write(data) ? group : null;
    },
    edit(id, name, players) {
      return update(id, (g) => {
        g.name = name;
        g.players = players.map((p) => ({ id: p.id || newId('p'), name: p.name }));
        g.nextFirst = g.nextFirst % g.players.length;
      });
    },
    remove(id) {
      const data = read();
      data.groups = data.groups.filter((g) => g.id !== id);
      if (data.activeId === id) data.activeId = data.groups.length ? data.groups[0].id : null;
      return write(data);
    },
    saveCurrent(id, run) { return update(id, (g) => { g.current = run; }); },
    // a new game takes the next seat as the first one
    takeFirst(id) {
      const group = this.get(id);
      if (!group) return 0;
      const first = group.nextFirst % group.players.length;
      update(id, (g) => { g.nextFirst = (first + 1) % g.players.length; });
      return first;
    },
    addGame(id, game) {
      return update(id, (g) => {
        g.current = null;
        g.games.push(game);
        if (g.games.length > GAMES_MAX) g.games.splice(0, g.games.length - GAMES_MAX);
      });
    },
    clearGames(id) { return update(id, (g) => { g.games = []; }); },

    // a small remembered setting
    getSetting(name, fallback) {
      try { const v = localStorage.getItem('yacht.' + name); return v === null ? fallback : v; } catch (e) { return fallback; }
    },
    setSetting(name, value) {
      try { localStorage.setItem('yacht.' + name, value); } catch (e) { /* storage blocked: it just is not remembered */ }
    }
  };
})();
