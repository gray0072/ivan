'use strict';

// Lift Logic — each building's floors, drawn from a few shapes: the house's flats, the school's classrooms,
// the hotel's corridor with numbered doors, the hospital's wards, the office's desks, the mall's shops and its
// car park with parked cars, the Eiffel Tower's iron lattice, brasserie, viewing deck and summit, the Empire
// State Building's art deco offices and observatories, the lobby on the ground floor and the ballroom, gym,
// canteen, food court or cinema where a building has one. Used by render/building.js.

Art.interior = function (ctx, b, label, top, x, y, w, h) {
  const style = b.style;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  // wall and floor line
  ctx.fillStyle = label % 2 ? b.wall : shade(b.wall, -0.04);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = shade(b.trim, 0.25);
  ctx.fillRect(x, y + h - 4, w, 4);
  const room = (b.rooms || {})[label];
  const u = h / 44;
  if (b.id === 'eiffel') Art.eiffelFloor(ctx, label, room, x, y, w, h, u);
  else if (b.id === 'empire' && label !== 1) Art.empireFloor(ctx, label, room, x, y, w, h, u, b);
  else if (label === 1 || room === 'Lobby' || room === 'Hall' || room === 'Entrance') Art.lobby(ctx, style, x, y, w, h, u, b);
  else if (style === 'house') {
    for (let k = 0; k < Math.floor(w / (70 * u)); k++) {
      const wx = x + 14 * u + k * 70 * u;
      ctx.fillStyle = '#bfe3f5'; ctx.fillRect(wx, y + 9 * u, 22 * u, 18 * u);
      ctx.fillStyle = '#e57373'; ctx.fillRect(wx - 3 * u, y + 7 * u, 8 * u, 22 * u); ctx.fillRect(wx + 17 * u, y + 7 * u, 8 * u, 22 * u);
      ctx.fillStyle = '#8d6e63'; ctx.fillRect(wx + 36 * u, y + 24 * u, 22 * u, 14 * u);
      ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.arc(wx + 47 * u, y + 20 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style === 'school') {
    if (room === 'Gym') { ctx.strokeStyle = '#e57373'; ctx.lineWidth = 2; ctx.strokeRect(x + 12 * u, y + 8 * u, w - 24 * u, h - 14 * u); ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.55, 6 * u, 0, Math.PI * 2); ctx.fill(); }
    else {
      ctx.fillStyle = '#2e5d3a'; ctx.fillRect(x + 12 * u, y + 7 * u, 46 * u, 20 * u);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 18 * u, y + 15 * u); ctx.lineTo(x + 38 * u, y + 15 * u); ctx.stroke();
      for (let k = 0; k < Math.floor((w - 70 * u) / (34 * u)); k++) { ctx.fillStyle = '#b08850'; ctx.fillRect(x + 70 * u + k * 34 * u, y + 28 * u, 24 * u, 6 * u); ctx.fillRect(x + 72 * u + k * 34 * u, y + 34 * u, 3 * u, 6 * u); }
    }
  } else if (style === 'hotel') {
    ctx.fillStyle = '#a33a3a'; ctx.fillRect(x, y + h - 9 * u, w, 5 * u);
    if (room === 'Ballroom') {
      for (let k = 0; k < 4; k++) { ctx.fillStyle = '#ffe082'; ctx.beginPath(); ctx.arc(x + (k + 0.6) * w / 4, y + 8 * u, 4 * u, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 20 * u, y + 26 * u, w - 40 * u, 4 * u);
    } else {
      for (let k = 0; k < Math.floor(w / (56 * u)); k++) {
        const dx = x + 16 * u + k * 56 * u;
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(dx, y + 8 * u, 20 * u, 30 * u);
        ctx.fillStyle = '#ffd54f'; ctx.font = Math.round(7 * u) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label + '0' + (k + 1), dx + 10 * u, y + 14 * u);
      }
    }
  } else if (style === 'hospital') {
    for (let k = 0; k < Math.floor(w / (64 * u)); k++) {
      const bx = x + 14 * u + k * 64 * u;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, y + 26 * u, 40 * u, 8 * u);
      ctx.fillStyle = '#90caf9'; ctx.fillRect(bx + 22 * u, y + 22 * u, 16 * u, 6 * u);
      ctx.fillStyle = '#9e9e9e'; ctx.fillRect(bx, y + 34 * u, 3 * u, 6 * u); ctx.fillRect(bx + 37 * u, y + 34 * u, 3 * u, 6 * u);
    }
    ctx.fillStyle = '#e53935'; ctx.fillRect(x + w - 22 * u, y + 8 * u, 4 * u, 12 * u); ctx.fillRect(x + w - 26 * u, y + 12 * u, 12 * u, 4 * u);
  } else if (style === 'office') {
    if (room === 'Canteen') { for (let k = 0; k < Math.floor(w / (46 * u)); k++) { ctx.fillStyle = '#ffb74d'; ctx.beginPath(); ctx.arc(x + 24 * u + k * 46 * u, y + 30 * u, 8 * u, 0, Math.PI * 2); ctx.fill(); } }
    else for (let k = 0; k < Math.floor(w / (48 * u)); k++) {
      const dx = x + 12 * u + k * 48 * u;
      ctx.fillStyle = '#cfd8dc'; ctx.fillRect(dx, y + 28 * u, 34 * u, 5 * u);
      ctx.fillStyle = '#263238'; ctx.fillRect(dx + 8 * u, y + 16 * u, 16 * u, 11 * u);
      ctx.fillStyle = '#4fc3f7'; ctx.fillRect(dx + 10 * u, y + 18 * u, 12 * u, 7 * u);
    }
    ctx.fillStyle = 'rgba(160,200,235,0.35)'; ctx.fillRect(x, y, w, 5 * u);
  } else if (style === 'mall') {
    if (room === 'Car park') {
      // concrete, pillars and parked cars
      ctx.fillStyle = '#8d9499'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#6f777c'; ctx.fillRect(x, y + h - 6 * u, w, 6 * u);
      const cars = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#f5f5f5', '#8e24aa'];
      for (let k = 0; k < Math.floor(w / (58 * u)); k++) {
        const cx = x + 10 * u + k * 58 * u;
        ctx.fillStyle = '#b0b7bc'; ctx.fillRect(cx + 46 * u, y + 4 * u, 6 * u, h - 10 * u);
        ctx.fillStyle = cars[(k + Math.abs(label) * 2) % cars.length];
        roundRect(ctx, cx, y + 22 * u, 38 * u, 11 * u, 3 * u); ctx.fill();
        roundRect(ctx, cx + 8 * u, y + 15 * u, 20 * u, 9 * u, 3 * u); ctx.fill();
        ctx.fillStyle = '#cfe8f7'; ctx.fillRect(cx + 11 * u, y + 17 * u, 14 * u, 5 * u);
        ctx.fillStyle = '#212121';
        ctx.beginPath(); ctx.arc(cx + 9 * u, y + 34 * u, 4 * u, 0, Math.PI * 2); ctx.arc(cx + 29 * u, y + 34 * u, 4 * u, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffd23f'; ctx.font = 'bold ' + Math.round(14 * u) + 'px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('P ' + String(label).replace('-', '−'), x + w - 8, y + 4);
    } else if (room === 'Food court') {
      for (let k = 0; k < Math.floor(w / (50 * u)); k++) {
        const tx = x + 25 * u + k * 50 * u;
        ctx.fillStyle = k % 2 ? '#ff7043' : '#26a69a';
        ctx.beginPath(); ctx.moveTo(tx - 16 * u, y + 16 * u); ctx.lineTo(tx, y + 7 * u); ctx.lineTo(tx + 16 * u, y + 16 * u); ctx.fill();
        ctx.fillStyle = '#795548'; ctx.fillRect(tx - 1 * u, y + 16 * u, 2 * u, 14 * u);
        ctx.fillStyle = '#fafafa'; ctx.fillRect(tx - 12 * u, y + 29 * u, 24 * u, 4 * u);
      }
    } else if (room === 'Cinema') {
      ctx.fillStyle = '#311b92'; ctx.fillRect(x, y, w, h - 4 * u);
      ctx.fillStyle = '#e3f2fd'; ctx.fillRect(x + 76 * u, y + 7 * u, Math.max(0, Math.min(w - 96 * u, 160 * u)), 18 * u);
      ctx.fillStyle = '#b71c1c';
      for (let k = 0; k < Math.floor(w / (16 * u)); k++) ctx.fillRect(x + 8 * u + k * 16 * u, y + 30 * u, 11 * u, 7 * u);
    } else {
      // shop windows with awnings
      const awn = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa'];
      for (let k = 0; k < Math.floor(w / (62 * u)); k++) {
        const sx = x + 10 * u + k * 62 * u;
        ctx.fillStyle = '#d7ecfb'; ctx.fillRect(sx, y + 14 * u, 48 * u, 24 * u);
        ctx.fillStyle = awn[(k + label) % awn.length];
        for (let j = 0; j < 6; j++) { ctx.globalAlpha = j % 2 ? 0.75 : 1; ctx.fillRect(sx + j * 8 * u, y + 6 * u, 8 * u, 8 * u); }
        ctx.globalAlpha = 1;
        ctx.fillStyle = shade(awn[(k + label) % awn.length], -0.2);
        ctx.fillRect(sx + 6 * u, y + 26 * u, 10 * u, 12 * u); ctx.fillRect(sx + 26 * u, y + 30 * u, 14 * u, 8 * u);
      }
    }
  }
  if (room && (label !== 1 || b.id === 'eiffel')) {
    ctx.fillStyle = room === 'Car park' || room === 'Cinema' || room === 'Observatory' || room === 'Top deck' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.45)';
    ctx.font = 'bold ' + Math.round(clamp(9 * u, 9, 13)) + 'px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(tr(room), x + 6, y + 4);
  }
  ctx.restore();
};

// the Eiffel Tower: sky seen through the brown iron lattice; the ground with the ticket booth, the brasserie's
// tables, the viewing deck's telescopes, the summit's flag
Art.eiffelFloor = function (ctx, label, room, x, y, w, h, u) {
  ctx.fillStyle = label === 1 ? '#a5d6a7' : '#b9def5';
  ctx.fillRect(x, y, w, h - 4 * u);
  // the lattice: crossed iron beams
  ctx.strokeStyle = 'rgba(122,78,40,0.55)'; ctx.lineWidth = Math.max(1, 1.6 * u);
  const step = 26 * u;
  ctx.beginPath();
  for (let k = -1; k * step < w + step; k++) {
    const bx = x + k * step;
    ctx.moveTo(bx, y); ctx.lineTo(bx + step, y + h - 4 * u);
    ctx.moveTo(bx + step, y); ctx.lineTo(bx, y + h - 4 * u);
  }
  ctx.stroke();
  ctx.fillStyle = '#7a4e28'; ctx.fillRect(x, y + h - 6 * u, w, 4 * u);
  if (label === 1) {
    // the ticket booth and a tree
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x + w - 46 * u, y + 14 * u, 30 * u, 24 * u);
    ctx.fillStyle = '#ffe082'; ctx.fillRect(x + w - 42 * u, y + 18 * u, 22 * u, 9 * u);
    ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.arc(x + w - 80 * u, y + 20 * u, 10 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(x + w - 82 * u, y + 28 * u, 4 * u, 10 * u);
  } else if (room === 'Brasserie') {
    for (let k = 0; k < Math.floor(w / (54 * u)); k++) {
      const tx = x + 30 * u + k * 54 * u;
      ctx.fillStyle = k % 2 ? '#c62828' : '#f5f5f5';
      ctx.beginPath(); ctx.moveTo(tx - 14 * u, y + 18 * u); ctx.lineTo(tx, y + 9 * u); ctx.lineTo(tx + 14 * u, y + 18 * u); ctx.fill();
      ctx.fillStyle = '#4e342e'; ctx.fillRect(tx - 1 * u, y + 18 * u, 2 * u, 14 * u); ctx.fillRect(tx - 10 * u, y + 30 * u, 20 * u, 3 * u);
    }
  } else if (room === 'Viewing deck') {
    for (let k = 0; k < Math.floor(w / (70 * u)); k++) {
      const tx = x + 34 * u + k * 70 * u;
      ctx.fillStyle = '#455a64'; ctx.fillRect(tx - 2 * u, y + 22 * u, 4 * u, 14 * u);
      ctx.save(); ctx.translate(tx, y + 20 * u); ctx.rotate(-0.3); ctx.fillRect(-8 * u, -3 * u, 16 * u, 6 * u); ctx.restore();
    }
  } else if (room === 'Summit') {
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x + 40 * u, y + 6 * u, 2 * u, 30 * u);
    ctx.fillStyle = '#1e40a0'; ctx.fillRect(x + 42 * u, y + 6 * u, 6 * u, 10 * u);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 48 * u, y + 6 * u, 6 * u, 10 * u);
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(x + 54 * u, y + 6 * u, 6 * u, 10 * u);
  }
};

// the Empire State Building: art deco offices with golden trim, the observatories on 86 and 102 with telescopes
Art.empireFloor = function (ctx, label, room, x, y, w, h, u, b) {
  if (room === 'Observatory' || room === 'Top deck') {
    ctx.fillStyle = '#4a6fa5'; ctx.fillRect(x, y, w, h - 4 * u);
    ctx.fillStyle = '#9fb8d9';
    for (let k = 0; k < Math.floor(w / (18 * u)); k++) ctx.fillRect(x + k * 18 * u, y + 26 * u - ((k * 7) % 5) * 3 * u, 12 * u, 14 * u + ((k * 7) % 5) * 3 * u);
    for (let k = 0; k < Math.floor(w / (80 * u)); k++) {
      const tx = x + 40 * u + k * 80 * u;
      ctx.fillStyle = '#263238'; ctx.fillRect(tx - 2 * u, y + 22 * u, 4 * u, 16 * u);
      ctx.save(); ctx.translate(tx, y + 20 * u); ctx.rotate(-0.25); ctx.fillRect(-9 * u, -3 * u, 18 * u, 6 * u); ctx.restore();
    }
    return;
  }
  // windows with a golden frame, a desk now and then
  for (let k = 0; k < Math.floor(w / (34 * u)); k++) {
    const wx = x + 10 * u + k * 34 * u;
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(wx - 1.5 * u, y + 7 * u, 21 * u, 23 * u);
    ctx.fillStyle = (label + k) % 5 === 0 ? '#ffe9a8' : '#cfe3f3'; ctx.fillRect(wx, y + 8.5 * u, 18 * u, 20 * u);
    if ((label * 3 + k) % 4 === 0) { ctx.fillStyle = '#5d4037'; ctx.fillRect(wx - 2 * u, y + 32 * u, 22 * u, 4 * u); }
  }
  ctx.fillStyle = shade(b.trim, 0.1); ctx.fillRect(x, y, w, 2 * u);
};

Art.lobby = function (ctx, style, x, y, w, h, u, b) {
  // the street door and a desk or a plant
  ctx.fillStyle = '#90a4ae'; ctx.fillRect(x + w - 34 * u, y + 8 * u, 26 * u, h - 12 * u);
  ctx.fillStyle = '#cfe8f7'; ctx.fillRect(x + w - 31 * u, y + 11 * u, 20 * u, h - 18 * u);
  if (style === 'hotel' || style === 'office' || style === 'hospital') {
    ctx.fillStyle = shade(b.trim, 0.1); ctx.fillRect(x + w - 90 * u, y + 24 * u, 40 * u, 16 * u);
  } else {
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(x + w - 70 * u, y + 28 * u, 10 * u, 12 * u);
    ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(x + w - 65 * u, y + 22 * u, 9 * u, 0, Math.PI * 2); ctx.fill();
  }
  const room = (b.rooms || {})[1];
  if (room) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = 'bold ' + Math.round(clamp(9 * u, 9, 13)) + 'px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(tr(room), x + 6, y + 4);
  }
};
