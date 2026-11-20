'use strict';

// Lift Logic — the buildings' silhouettes for the campaign map and the building screen: a small house, a
// school, a hotel, a hospital, a glass tower, a mall, the Eiffel Tower, the Empire State Building, the Burj
// Khalifa and the space elevator, drawn simply on a canvas. Used by ui/screens.js.

Art.silhouette = function (canvas, id, locked) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const b = BUILDING[id];
  const col = locked ? '#5d6b7a' : (b.trim || '#41607f');
  const wall = locked ? '#7c8a99' : (b.wall || '#dfe9f2');
  ctx.fillStyle = locked ? '#3b4756' : (b.sky || '#c6def2');
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = locked ? '#46525f' : '#7cb342';
  ctx.fillRect(0, h * 0.9, w, h * 0.1);
  const g = h * 0.9;
  const win = (x, y, ww, hh, cols, rows, c) => {
    ctx.fillStyle = c || (locked ? '#5d6b7a' : '#ffe9a8');
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) ctx.fillRect(x + (i + 0.25) * ww / cols, y + (j + 0.25) * hh / rows, ww / cols * 0.5, hh / rows * 0.45);
  };
  ctx.fillStyle = wall;
  switch (b.style) {
    case 'house':
      ctx.fillRect(w * 0.3, g - h * 0.5, w * 0.4, h * 0.5);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(w * 0.24, g - h * 0.5); ctx.lineTo(w * 0.5, g - h * 0.72); ctx.lineTo(w * 0.76, g - h * 0.5); ctx.fill();
      win(w * 0.3, g - h * 0.5, w * 0.4, h * 0.5, 2, 3);
      break;
    case 'school':
      ctx.fillRect(w * 0.15, g - h * 0.52, w * 0.7, h * 0.52);
      ctx.fillStyle = col; ctx.fillRect(w * 0.42, g - h * 0.64, w * 0.16, h * 0.12);
      win(w * 0.15, g - h * 0.52, w * 0.7, h * 0.52, 5, 4);
      break;
    case 'hotel':
      ctx.fillRect(w * 0.28, g - h * 0.72, w * 0.44, h * 0.72);
      ctx.fillStyle = col; ctx.fillRect(w * 0.26, g - h * 0.76, w * 0.48, h * 0.05);
      win(w * 0.28, g - h * 0.72, w * 0.44, h * 0.72, 3, 7);
      break;
    case 'hospital':
      ctx.fillRect(w * 0.2, g - h * 0.7, w * 0.6, h * 0.7);
      win(w * 0.2, g - h * 0.7, w * 0.6, h * 0.7, 4, 7);
      ctx.fillStyle = locked ? '#5d6b7a' : '#e53935'; ctx.fillRect(w * 0.47, g - h * 0.66, w * 0.06, h * 0.14); ctx.fillRect(w * 0.43, g - h * 0.61, w * 0.14, h * 0.05);
      break;
    case 'office':
      ctx.fillStyle = locked ? wall : '#9cc3e6'; ctx.fillRect(w * 0.33, g - h * 0.86, w * 0.34, h * 0.86);
      win(w * 0.33, g - h * 0.86, w * 0.34, h * 0.86, 3, 12, locked ? '#5d6b7a' : '#d7ecfb');
      break;
    case 'mall':
      ctx.fillRect(w * 0.1, g - h * 0.42, w * 0.8, h * 0.42);
      win(w * 0.1, g - h * 0.42, w * 0.8, h * 0.42, 6, 2);
      break;
    case 'tower':
      if (id === 'eiffel') {
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, w * 0.02);
        ctx.beginPath(); ctx.moveTo(w * 0.25, g); ctx.quadraticCurveTo(w * 0.45, g - h * 0.4, w * 0.49, g - h * 0.85); ctx.moveTo(w * 0.75, g); ctx.quadraticCurveTo(w * 0.55, g - h * 0.4, w * 0.51, g - h * 0.85); ctx.stroke();
        ctx.fillStyle = col; ctx.fillRect(w * 0.33, g - h * 0.28, w * 0.34, h * 0.03); ctx.fillRect(w * 0.41, g - h * 0.52, w * 0.18, h * 0.025);
      } else if (id === 'empire') {
        ctx.fillRect(w * 0.3, g - h * 0.45, w * 0.4, h * 0.45); ctx.fillRect(w * 0.37, g - h * 0.65, w * 0.26, h * 0.2); ctx.fillRect(w * 0.43, g - h * 0.78, w * 0.14, h * 0.13); ctx.fillRect(w * 0.49, g - h * 0.9, w * 0.02, h * 0.12);
      } else {
        ctx.beginPath(); ctx.moveTo(w * 0.36, g); ctx.lineTo(w * 0.47, g - h * 0.75); ctx.lineTo(w * 0.5, g - h * 0.95); ctx.lineTo(w * 0.53, g - h * 0.75); ctx.lineTo(w * 0.64, g); ctx.fill();
      }
      break;
    case 'space':
      ctx.strokeStyle = locked ? '#7c8a99' : '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.5, g); ctx.lineTo(w * 0.5, 0); ctx.stroke();
      ctx.fillStyle = locked ? '#7c8a99' : '#ffcc80'; ctx.fillRect(w * 0.44, h * 0.4, w * 0.12, h * 0.08);
      ctx.fillStyle = locked ? '#5d6b7a' : '#fff59d'; for (let k = 0; k < 9; k++) ctx.fillRect((k * 37) % w, (k * 53) % (h * 0.6), 2, 2);
      break;
  }
};

// the logo: a lift cabin whose doors are two puzzle blocks
Art.logo = function (canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const x = w * 0.22, y = h * 0.16, cw = w * 0.56, ch = h * 0.72;
  ctx.fillStyle = '#16212e'; roundRect(ctx, x + cw * 0.25, y - h * 0.12, cw * 0.5, h * 0.1, 4); ctx.fill();
  Art.triangle(ctx, x + cw * 0.38, y - h * 0.07, h * 0.03, true, '#7CFC9A');
  ctx.fillStyle = '#ffb547'; ctx.font = 'bold ' + Math.round(h * 0.07) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('3', x + cw * 0.58, y - h * 0.065);
  ctx.fillStyle = '#7d8fa3'; roundRect(ctx, x, y, cw, ch, 8); ctx.fill();
  const piece = (px, color, tabRight) => {
    ctx.fillStyle = color;
    const pw = cw * 0.42, py = y + ch * 0.06, ph = ch * 0.88;
    roundRect(ctx, px, py, pw, ph, 5); ctx.fill();
    ctx.beginPath(); ctx.arc(tabRight ? px + pw : px, py + ph * 0.45, pw * 0.16, 0, Math.PI * 2); ctx.fill();
  };
  piece(x + cw * 0.06, '#3d7be0', true);
  ctx.fillStyle = '#7d8fa3'; ctx.beginPath(); ctx.arc(x + cw * 0.52, y + ch * 0.06 + ch * 0.88 * 0.45, cw * 0.42 * 0.16, 0, Math.PI * 2); ctx.fill();
  piece(x + cw * 0.52, '#e0a800', false);
  ctx.fillStyle = '#3d7be0'; ctx.beginPath(); ctx.arc(x + cw * 0.48, y + ch * 0.06 + ch * 0.88 * 0.45, cw * 0.42 * 0.16, 0, Math.PI * 2); ctx.fill();
};
