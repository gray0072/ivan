// Reading task type: a voice says a letter, a word or a short phrase; the answer is picked among four written
// options close to it — letters that sound or look alike, other real words spelled alike, the words of a phrase in
// another order. Only real words: it's reading, not a spelling test. Always picked, never typed.
// Needs the device's speech synthesis (speech.js).

const ReadTasks = (() => {
  const { pick, shuffle } = Tasks;
  const langs = {}; // language id -> its READ_DATA prepared: words by length, phrases by word count, option words

  function data(id) {
    if (langs[id]) return langs[id];
    const d = READ_DATA[id];
    const words = [...new Set(d.words.trim().split(/\s+/))];
    const byLen = {};
    for (const w of words) (byLen[w.length] = byLen[w.length] || []).push(w);
    const phrases = {};
    for (const text of d.phrases) {
      const ws = text.split(' ');
      (phrases[ws.length] = phrases[ws.length] || []).push({ text, words: ws, max: Math.max(...ws.map(w => w.length)) });
    }
    // Real words for wrong options, by length: the word list and every word of the phrases (with their
    // inflected forms — дереве, tänderna), so a phrase's word can be swapped for a real one that looks alike.
    const pool = {};
    for (const w of new Set(words.concat(d.phrases.join(' ').split(' ')))) {
      if (w.length >= 2) (pool[w.length] = pool[w.length] || []).push(w);
    }
    langs[id] = { letters: [...d.letters], names: d.names || {}, similar: d.similar, byLen, phrases, pool, near: new Map() };
    return langs[id];
  }

  // Answers of the last reading tasks, not repeated while there are others to pick (at most half the pool).
  const recent = [];
  function fresh(list, keyOf = x => x) {
    const last = recent.slice(-Math.min(READ_RECENT, Math.floor(list.length / 2)));
    const f = list.filter(x => !last.includes(keyOf(x)));
    return f.length ? f : list;
  }

  const letterLabel = c => c + ' ' + c.toLowerCase();

  function make(rd) {
    const d = data(rd.lang);
    let t;
    if (!rd.size) {
      const c = pick(fresh(d.letters));
      t = { kind: 'letter', letter: c, answer: letterLabel(c), say: d.names[c] || c, words: [c] };
      recent.push(c);
    } else if (rd.words === 1) {
      const lens = [];
      for (let n = Math.max(2, rd.size - READ_SPAN); n <= rd.size; n++) if (d.byLen[n]) lens.push(n);
      const w = pick(fresh(d.byLen[pick(lens)]));
      t = { kind: 'word', answer: w, say: w, words: [w] };
      recent.push(w);
    } else {
      // Phrases whose longest word fits the size, longest words near it first; the shortest ones if none fit.
      const all = d.phrases[rd.words];
      let list = all.filter(p => p.max <= rd.size && p.max >= rd.size - READ_SPAN);
      if (list.length < READ_MIN_PICK) list = all.filter(p => p.max <= rd.size);
      if (!list.length) {
        const m = Math.min(...all.map(p => p.max));
        list = all.filter(p => p.max === m);
      }
      const p = pick(fresh(list, x => x.text));
      t = { kind: 'phrase', answer: p.text, say: p.text, words: p.words };
      recent.push(p.text);
    }
    if (recent.length > READ_RECENT) recent.shift();
    t.type = 'read';
    t.lang = rd.lang;
    t.solution = '🔊 It said: ' + t.answer;
    return t;
  }

  function expectedTime(t) {
    if (t.kind === 'letter') return READ_LISTEN_TIME + READ_LETTER_TIME;
    const chars = t.words.reduce((s, w) => s + w.length, 0);
    return READ_LISTEN_TIME + READ_CHAR_TIME * chars + READ_WORD_TIME * (t.words.length - 1);
  }

  // Edit distance (letters inserted, removed or changed), counting no further than max + 1.
  function distance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      let low = i;
      for (let j = 1; j <= b.length; j++) {
        row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        low = Math.min(low, row[j]);
      }
      if (low > max) return max + 1;
      prev = row;
    }
    return prev[b.length];
  }

  // The READ_NEAR_WORDS real words spelled most like w, as [value, weight, kind]: fewest letters apart, then the same
  // first letter and a close length; the nearest weigh most. Never a made-up word.
  function closeWords(w, d) {
    if (d.near.has(w)) return d.near.get(w); // words come back often; the search is the slow part
    const scored = [];
    const cap = Math.max(2, Math.ceil(w.length * 0.6)); // farther words all count as cap + 1
    for (let n = w.length - 2; n <= w.length + 2; n++) {
      for (const x of d.pool[n] || []) {
        if (x !== w) scored.push([x, distance(w, x, cap) + (x[0] === w[0] ? 0 : 0.5) + 0.3 * Math.abs(x.length - w.length)]);
      }
    }
    scored.sort((a, b) => a[1] - b[1]);
    const out = scored.slice(0, READ_NEAR_WORDS).map(([x, s]) => [x, 1 / (s * s), x]);
    d.near.set(w, out);
    return out;
  }

  // n different values picked by weight; after each pick the others of its kind weigh less, so the options vary.
  function weighted(cands, n, answer) {
    const pool = new Map();
    for (const [v, w, kind] of cands) {
      if (v === answer) continue;
      const had = pool.get(v);
      if (!had || had.w < w) pool.set(v, { w, kind });
    }
    const out = [];
    while (out.length < n && pool.size) {
      let total = 0;
      pool.forEach(c => { total += c.w; });
      let r = Math.random() * total;
      for (const [v, c] of pool) {
        r -= c.w;
        if (r <= 0) {
          out.push(v);
          pool.delete(v);
          pool.forEach(o => { if (o.kind === c.kind) o.w *= 0.35; });
          break;
        }
      }
    }
    return out;
  }

  // The four options (the answer among them), shuffled.
  function choices(t) {
    const d = data(t.lang);
    const need = CHOICE_COUNT - 1;
    let wrong;
    if (t.kind === 'letter') {
      const cands = [];
      d.similar.forEach((g, i) => { if (g.includes(t.letter)) for (const c of g) cands.push([c, 4, 'like' + i]); });
      for (const c of d.letters) cands.push([c, 0.4, 'any']);
      wrong = weighted(cands, need, t.letter).map(letterLabel);
    } else if (t.kind === 'word') {
      wrong = weighted(closeWords(t.answer, d), need, t.answer);
    } else {
      // One word changed to another real word spelled alike (longer words more often), or the first and last swapped.
      const cands = [];
      t.words.forEach((w, i) => {
        if (w.length < 2) return;
        for (const [v, wt] of closeWords(w, d)) {
          const ws = t.words.slice();
          ws[i] = v;
          cands.push([ws.join(' '), wt * Math.sqrt(w.length), 'w' + i]);
        }
      });
      const last = t.words.length - 1;
      if (t.words[0] !== t.words[last]) {
        const ws = t.words.slice();
        [ws[0], ws[last]] = [ws[last], ws[0]];
        cands.push([ws.join(' '), 4, 'swap']);
      }
      wrong = weighted(cands, need, t.answer);
      if (wrong.length < need) {
        const other = d.phrases[t.words.length].map(p => [p.text, 1, 'any']).filter(([v]) => !wrong.includes(v));
        wrong = wrong.concat(weighted(other, need - wrong.length, t.answer));
      }
    }
    return shuffle([t.answer].concat(wrong));
  }

  function price(rd) {
    const steps = [{ label: rd.size ? `Words up to ${rd.size} letters` : 'Letters', add: READ_SIZE_PRICE[rd.size] }];
    if (rd.size && rd.words > 1) steps.push({ label: `${rd.words} words`, mul: READ_WORDS_PRICE[rd.words] });
    return steps;
  }

  // Why Reading can't run on this device with these settings, or null. hard: no speech at all (a TV browser).
  function blocked(rd) {
    if (!Speech.supported || !Speech.anyVoice()) {
      return { hard: true, text: 'This device can’t speak (its browser has no speech synthesis voices), so Reading is off here. It works on a computer or a phone.' };
    }
    if (!Speech.hasVoice(rd.lang)) {
      const name = READ_LANGS.find(l => l.id === rd.lang).name;
      return { hard: false, text: `This device has no ${name} voice, so Reading is off. Pick another language, or add a ${name} voice in the system’s speech settings.` };
    }
    return null;
  }

  const say = t => Speech.say(t.say, t.lang);

  return { make, expectedTime, choices, price, blocked, say, choiceOnly: true };
})();
