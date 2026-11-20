'use strict';

// Lift Logic — each building's floors, drawn from a few shapes: the house's flats, the school's classrooms,
// the hotel's corridor with numbered doors, the hospital's wards, the office's desks, the lobby on the
// ground floor and the ballroom, gym or canteen where a building has one. Used by render/building.js.

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
  if (label === 1 || room === 'Lobby' || room === 'Hall' || room === 'Entrance') Art.lobby(ctx, style, x, y, w, h, u, b);
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
  }
  if (room && label !== 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = 'bold ' + Math.round(clamp(9 * u, 9, 13)) + 'px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(tr(room), x + 6, y + 4);
  }
  ctx.restore();
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
