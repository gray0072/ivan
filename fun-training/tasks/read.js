// Reading task type: a voice says a letter, a word or a short phrase; the answer is picked among four written
// options close to it — letters that sound or look alike, words a letter or two apart, a misspelling, the words
// of a phrase in another order. Always picked, never typed. Needs the device's speech synthesis (speech.js).

const ReadTasks = (() => {
  const { pick, shuffle } = Tasks;
  const langs = {}; // language id -> its READ_DATA prepared: words by length, phrases by word count, swap pairs

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
    const swaps = {};
    for (const pair of d.swaps.split(' ')) {
      const [a, b] = [...pair];
      (swaps[a] = swaps[a] || []).push(b);
      (swaps[b] = swaps[b] || []).push(a);
    }
    langs[id] = { letters: [...d.letters], names: d.names || {}, similar: d.similar, byLen, phrases, swaps };
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

  // Close spellings of a word as [value, weight, kind]: real words a letter or two apart, then misspellings —
  // a letter changed to one a reader mixes it up with (b / d, ш / щ, å / a), two inner letters swapped, one left out.
  function closeWords(w, d) {
    const out = [];
    const max = w.length <= 3 ? 1 : w.length <= 6 ? 2 : 3;
    for (let n = w.length - 1; n <= w.length + 1; n++) {
      for (const x of d.byLen[n] || []) {
        const dist = x === w ? 0 : distance(w, x, max);
        if (dist && dist <= max) out.push([x, dist === 1 ? 4 : dist === 2 ? 2.5 : 1.5, 'word']);
      }
    }
    const ch = [...w];
    ch.forEach((c, i) => (d.swaps[c] || []).forEach(s => out.push([w.slice(0, i) + s + w.slice(i + 1), 3, 'letter'])));
    for (let i = 1; i < ch.length - 2; i++) {
      if (ch[i] !== ch[i + 1]) out.push([w.slice(0, i) + ch[i + 1] + ch[i] + w.slice(i + 2), 2, 'order']);
    }
    if (ch.length >= 4) for (let i = 1; i < ch.length - 1; i++) out.push([w.slice(0, i) + w.slice(i + 1), 1.5, 'drop']);
    return out.filter(([v]) => v !== w);
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
      const near = (d.byLen[t.answer.length] || []).map(x => [x, 1, 'any']);
      if (wrong.length < need) wrong = wrong.concat(weighted(near, need - wrong.length, t.answer).filter(x => !wrong.includes(x)));
    } else {
      // One word changed to a close one (longer words more often), or the first and last words swapped.
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
