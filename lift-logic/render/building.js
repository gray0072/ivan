'use strict';

// Lift Logic — draws the building of the run as a cut-away doll's house: the floors with their interiors and
// numbers, each landing's call buttons and its queue (moods and, small, where each person is going), the
// shafts with the cabins, their displays and say bubbles, the plan as numbered flags next to the shaft, the
// people walking away, the floating words, the variables shown with `show variable`, and the Lift's eyes
// (what the lift can't sense goes grey). Reads `run`, never changes it. Used by game.js every frame.

const BuildingView = (() => {
  const { ctx, st } = View;
  const FONT = '"Segoe UI", Arial, sans-serif';

  // what the view shows when nothing runs yet: the mission's building, empty
  function draw(dt) {
    if (!run) return;
    const g = View.layout();
    const s = st.scale;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const b = run.building;
    // sky and ground
    const sky = ctx.createLinearGradient(0, 0, 0, st.h);
    sky.addColorStop(0, b.sky || '#cfe6f5');
    sky.addColorStop(1, shade(b.sky || '#cfe6f5', 0.4));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, st.w, st.h);
    ctx.fillStyle = '#7cb342';
    ctx.fillRect(0, g.baseY, st.w, st.h - g.baseY + 2);
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(0, g.baseY + 4, st.w, Math.max(4, g.ground * 0.35));

    // the floors
    for (let i = 0; i < g.n; i++) {
      const y = g.floorY(i);
      if (y > st.h || y + g.fh < 0) continue;
      const label = run.floors[i];
      Art.interior(ctx, b, label, run.floors[g.n - 1], g.roomsX, y, st.w - g.roomsX, g.fh);
      ctx.fillStyle = i % 2 ? shade(b.wall, -0.06) : shade(b.wall, -0.1);
      ctx.fillRect(g.numW, y, g.landW, g.fh);
      ctx.fillStyle = shade(b.trim, 0.2);
      ctx.fillRect(g.numW, y + g.fh - 3, g.landW, 3);
      // the number
      ctx.fillStyle = shade(b.trim, -0.3);
      ctx.fillRect(0, y, g.numW, g.fh);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.round(clamp(g.fh * 0.36, 11, 18)) + 'px ' + FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(label), g.numW / 2, y + g.fh / 2);
      // the call buttons, by the first shaft
      const h = run.hall[i];
      Art.callButtons(ctx, g.shaftX - 9, y + g.fh * 0.45, clamp(g.fh * 0.09, 3, 6), h.up, h.down, i < g.n - 1, i > 0, h.emergency);
    }
    // the roof
    const roofY = g.floorY(g.n - 1);
    ctx.fillStyle = shade(b.trim, -0.15);
    ctx.fillRect(0, roofY - 6, st.w, 6);

    // the shafts
    for (const L of run.lifts) {
      const x = g.shaftLeft(L.n - 1);
      ctx.fillStyle = '#2c3440';
      ctx.fillRect(x, roofY, g.sw, g.baseY - roofY);
      ctx.fillStyle = '#3a4452';
      ctx.fillRect(x + g.sw / 2 - 1, roofY, 2, g.baseY - roofY);
    }

    drawQueues(g, dt);

    // the cabins
    for (const L of run.lifts) {
      const x = g.shaftLeft(L.n - 1), y = g.baseY - (L.pos + 1) * g.fh;
      ctx.strokeStyle = '#7d8a99'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + g.sw / 2, roofY); ctx.lineTo(x + g.sw / 2, y + 2); ctx.stroke();
      Art.cabin(ctx, x + 3, y + 4, g.sw - 6, g.fh - 6, L, { grey: st.eyes });
      if (run.lifts.length > 1 && st.follow === L.n) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 2, g.sw - 2, g.fh - 2); }
      Art.display(ctx, x + g.sw / 2, y + 3, Lift.floor(L), L.moving ? Lift.direction(L) : arrowShown(L), clamp(g.fh * 0.22, 8, 13), run.lifts.length > 1 ? L.letter : '');
      drawPlan(g, L, x);
      if (L.say) bubble(x + g.sw / 2, y - clamp(g.fh * 0.3, 12, 20), L.say.text);
    }

    drawLeaving(g, dt);
    drawWords(g, dt);
    drawMonitors();
    if (st.eyes) {
      ctx.fillStyle = 'rgba(10,20,35,0.78)';
      roundRect(ctx, 8, 8, 196, 24, 12); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(tr('Lift\'s eyes: buttons only'), 18, 20);
    }
  }

  function arrowShown(L) { return L.doorPhase !== 'closed' ? Lift.arrow(L) : (L.plan.length ? Lift.arrow(L) : 'none'); }

  // the waiting people, each eased toward its place in the queue
  function drawQueues(g, dt) {
    const seen = {};
    for (let i = 0; i < g.n; i++) {
      const q = run.queues[i];
      const y = g.floorY(i) + g.fh - 3;
      const gap = Math.min(g.fh * 0.34, (g.landW - 30) / Math.max(1, q.length));
      q.forEach((p, k) => {
        const tx = g.shaftX - 24 - k * gap;
        const pos = st.pos[p.id] || (st.pos[p.id] = { x: g.numW + 6, y, person: p });
        pos.x += (tx - pos.x) * Math.min(1, dt * 8);
        pos.y = y;
        pos.person = p;
        seen[p.id] = true;
        if (y < -g.fh || y > st.h + g.fh) return;
        Art.person(ctx, pos.x, y, g.fh * 0.78, p, { grey: st.eyes, mood: p.mood, walk: Math.abs(tx - pos.x) > 1 ? run.t * 12 : 0 });
        if (!st.eyes) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          const fs = Math.round(clamp(g.fh * 0.2, 8, 11));
          ctx.font = 'bold ' + fs + 'px ' + FONT;
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          const tag = String(p.to);
          roundRect(ctx, pos.x - fs * 0.8, y - g.fh * 0.86 - fs, fs * 1.6, fs + 2, 3); ctx.fill();
          ctx.fillStyle = p.dir === 'up' ? '#2e7d32' : '#c62828';
          ctx.fillText(tag, pos.x, y - g.fh * 0.86 + 1);
        }
      });
    }
    for (const id of Object.keys(st.pos)) if (!seen[id]) delete st.pos[id];
  }

  function drawPlan(g, L, x) {
    if (run.mission.chapter < 3) return;
    const right = x + g.sw + 2;
    L.plan.forEach((f, k) => {
      const i = floorIndex(f);
      if (i < 0) return;
      const y = g.floorY(i) + g.fh * 0.22;
      const fx = right;
      ctx.fillStyle = '#5d4037'; ctx.fillRect(fx, y, 2, g.fh * 0.5);
      ctx.fillStyle = k === 0 ? '#ff7043' : '#ffb74d';
      ctx.beginPath(); ctx.moveTo(fx + 2, y); ctx.lineTo(fx + 20, y + 5); ctx.lineTo(fx + 2, y + 11); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(k + 1), fx + 9, y + 5.5);
    });
  }

  function bubble(x, y, text) {
    text = String(text).slice(0, 40);
    ctx.font = 'bold 13px ' + FONT;
    const w = Math.max(30, ctx.measureText(text).width + 16), h = 24;
    const bx = clamp(x - w / 2, 4, st.w - w - 4);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx, y - h, w, h, 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 5, y - 1); ctx.lineTo(x + 5, y - 1); ctx.lineTo(x, y + 7); ctx.fill();
    ctx.strokeStyle = '#3d7be0'; ctx.lineWidth = 1.5; roundRect(ctx, bx, y - h, w, h, 10); ctx.stroke();
    ctx.fillStyle = '#1b2733'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    Icons.drawText(ctx, text, bx + 8, y - h / 2 + 1, '#1b2733', (part, px) => ctx.fillText(part, px, y - h / 2 + 1));
  }

  // people who got off walk into the rooms; people who gave up walk to the stairs
  function drawLeaving(g, dt) {
    st.leaving = st.leaving.filter((l) => (l.t += dt) < 1.6);
    for (const l of st.leaving) {
      const i = floorIndex(l.floor);
      const y = g.floorY(i) + g.fh - 3;
      const x0 = l.toStairs ? g.shaftX - 24 : g.shaftLeft(l.lift - 1) + g.sw / 2;
      const x = x0 + l.dir * l.t * g.fh * 1.6;
      Art.person(ctx, x, y, g.fh * 0.78, l.person, { grey: st.eyes, mood: l.toStairs ? 3 : 0, alpha: clamp(1.6 - l.t, 0, 1), walk: l.t * 14 });
    }
  }

  function drawWords(g, dt) {
    st.words = st.words.filter((w) => (w.t += dt) < 1.8);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const w of st.words) {
      const i = floorIndex(w.floor);
      const y = (w.floor !== undefined ? g.floorY(i) + g.fh * 0.3 : w.y) - w.t * 24;
      const x = w.lift ? g.shaftLeft(w.lift - 1) + g.sw / 2 : w.x;
      ctx.globalAlpha = clamp(1.8 - w.t, 0, 1);
      ctx.font = 'bold 14px ' + FONT;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(w.text, x, y);
      ctx.fillStyle = w.color || '#ffffff';
      ctx.fillText(w.text, x, y);
      ctx.globalAlpha = 1;
    }
  }

  function drawMonitors() {
    const names = Object.keys(run.monitors || {});
    if (!names.length) return;
    const L = run.lifts[st.follow - 1] || run.lifts[0];
    let y = st.h - 34;
    ctx.font = 'bold 12px ' + FONT;
    for (const n of names) {
      const v = VM.toStr(VM.peek(n, L));
      const text = n + ': ' + v;
      const w = ctx.measureText(text).width + 18;
      ctx.fillStyle = '#e8573a'; roundRect(ctx, 36, y, w, 22, 11); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 45, y + 11);
      y -= 26;
    }
  }

  // floating words and walking people from the run's events
  GameEvents.on('delivered', (e) => {
    st.leaving.push({ person: e.person, floor: e.person.to, lift: e.lift.n, dir: 1, t: 0 });
    View.word('+1', 0, 0, '#7CFC9A');
    st.words[st.words.length - 1].floor = e.person.to;
    st.words[st.words.length - 1].lift = e.lift.n;
  });
  GameEvents.on('gaveUp', (e) => {
    st.leaving.push({ person: e.person, floor: e.person.from, dir: -1, toStairs: true, t: 0 });
    View.word(tr('I\'ll take the stairs!'), 0, 0, '#ff8a80');
    const w = st.words[st.words.length - 1];
    w.floor = e.person.from;
    w.x = View.layout().numW + View.layout().landW * 0.5;
  });
  GameEvents.on('tooHeavy', (e) => {
    View.word(tr('Too heavy!'), 0, 0, '#ffcc80');
    const w = st.words[st.words.length - 1];
    w.floor = e.person.from; w.lift = e.lift.n;
  });
  GameEvents.on('furious', (e) => {
    View.word(tr('Grr!'), 0, 0, '#ff5252');
    const w = st.words[st.words.length - 1];
    w.floor = e.person.from;
    w.x = View.layout().shaftX - 30;
  });

  return { draw };
})();
