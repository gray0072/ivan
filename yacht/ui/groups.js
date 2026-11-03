'use strict';

// Yacht — the group editor: the group's name and its players in turn order (add, remove, move up or
// down). Refuses empty and equal names with a text next to the field. Used by game.js.

const GroupEditor = {
  groupId: null,
  draft: [],

  openNew() {
    this.groupId = null;
    this.draft = [{ name: '' }, { name: '' }];
    document.getElementById('editName').value = tr('Group {n}', { n: Groups.all().length + 1 });
    this.show();
  },

  openFor(group) {
    this.groupId = group.id;
    this.draft = group.players.map((p) => ({ id: p.id, name: p.name }));
    document.getElementById('editName').value = group.name;
    this.show();
  },

  show() {
    const existing = this.groupId ? Groups.get(this.groupId) : null;
    document.getElementById('editName').maxLength = GROUP_NAME_MAX;
    document.getElementById('editorTitle').textContent = tr(existing ? 'Edit group' : 'New group');
    document.getElementById('deleteGroupBtn').hidden = !existing;
    document.getElementById('editNote').hidden = !(existing && existing.current);
    document.getElementById('editError').textContent = '';
    this.render();
    Screens.open('editor');
    if (!isCoarsePointer) {
      const empty = document.querySelector('#editPlayers input:placeholder-shown');
      if (empty) empty.focus();
    }
  },

  // what is typed so far goes into the draft before the list is drawn again
  readInputs() {
    document.querySelectorAll('#editPlayers input').forEach((inp, i) => { this.draft[i].name = inp.value; });
  },

  render() {
    const n = this.draft.length;
    document.getElementById('editPlayers').innerHTML = this.draft.map((p, i) =>
      '<li class="editRow"><span class="seat">' + (i + 1) + '</span>' +
      '<input type="text" maxlength="' + NAME_MAX + '" value="' + esc(p.name) + '" placeholder="' + esc(tr('Player {n}', { n: i + 1 })) + '" aria-label="' + esc(tr('Player {n}', { n: i + 1 })) + '" autocomplete="off">' +
      '<button type="button" class="mini" data-move="-1" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' title="' + esc(tr('Move up')) + '" aria-label="' + esc(tr('Move up')) + '">▲</button>' +
      '<button type="button" class="mini" data-move="1" data-i="' + i + '"' + (i === n - 1 ? ' disabled' : '') + ' title="' + esc(tr('Move down')) + '" aria-label="' + esc(tr('Move down')) + '">▼</button>' +
      '<button type="button" class="mini" data-remove="' + i + '"' + (n <= MIN_PLAYERS ? ' disabled' : '') + ' title="' + esc(tr('Remove')) + '" aria-label="' + esc(tr('Remove')) + '">✕</button></li>').join('');
    const add = document.getElementById('addPlayerBtn');
    add.disabled = n >= MAX_PLAYERS;
    add.textContent = n >= MAX_PLAYERS ? tr('{n} players is the most', { n: MAX_PLAYERS }) : tr('+ Add a player');
  },

  add() {
    this.readInputs();
    if (this.draft.length >= MAX_PLAYERS) return;
    this.draft.push({ name: '' });
    this.render();
    const inputs = document.querySelectorAll('#editPlayers input');
    inputs[inputs.length - 1].focus();
  },

  clickList(e) {
    const mv = e.target.closest('button[data-move]');
    const rm = e.target.closest('button[data-remove]');
    if (!mv && !rm) return;
    this.readInputs();
    if (mv) {
      const i = +mv.dataset.i, j = i + +mv.dataset.move;
      if (j < 0 || j >= this.draft.length) return;
      [this.draft[i], this.draft[j]] = [this.draft[j], this.draft[i]];
    } else {
      if (this.draft.length <= MIN_PLAYERS) return;
      this.draft.splice(+rm.dataset.remove, 1);
    }
    this.render();
  },

  // returns the error text, or null when all is right
  validate(name, players) {
    if (!name) return tr('The group needs a name.');
    const seen = {};
    for (let i = 0; i < players.length; i++) {
      const low = players[i].name.toLowerCase();
      if (!low) return tr('Player {n} needs a name.', { n: i + 1 });
      if (seen[low]) return tr('Two players cannot both be called {name}.', { name: players[i].name });
      seen[low] = true;
    }
    return null;
  },

  // saves; returns true when the editor can close
  save() {
    this.readInputs();
    const name = document.getElementById('editName').value.trim();
    const players = this.draft.map((p) => ({ id: p.id, name: p.name.trim() }));
    const err = this.validate(name, players);
    document.getElementById('editError').textContent = err || '';
    if (err) return false;
    const ok = this.groupId && Groups.get(this.groupId) ? Groups.edit(this.groupId, name, players) : !!Groups.create(name, players);
    if (!ok) {
      document.getElementById('editError').textContent = tr('Could not save: the browser\'s storage is full or blocked.');
      return false;
    }
    return true;
  }
};
