'use strict';

// City Builder — the map on the canvas: the isometric camera (pan, zoom, screen ↔ tile), the ground
// (grass, sand, water, roads, bridges, the flood), the buildings, trees and vehicles sorted front to
// back, and on top the fires, smoke, planes, icons and the ghost of what is being placed. Buildings
// and trees are drawn once into cached images (render/sprites.js) per look and zoom step.
// Used by game.js (draw every frame, the camera) and ui/toolbar.js (the tool icons).

const Renderer = (() => {
  const cv = document.getElementById('game');
  const c = cv.getContext('2d', { alpha: false });
  let W = 0, H = 0, dpr = 1;
  const cam = { x: 0, y: MAP_SIZE * TILE_HH, zoom: ZOOM_START };
  const cache = new Map();

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = canvasScale(W, H);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
  }

  // ---------- the camera ----------
  function toWorld(sx, sy) { return [(sx - W / 2) / cam.zoom + cam.x, (sy - H / 2) / cam.zoom + cam.y]; }
  function toScreen(X, Y) { return [(X - cam.x) * cam.zoom + W / 2, (Y - cam.y) * cam.zoom + H / 2]; }
  // the map point (u, v in tiles, fractional) under a screen point
  function screenToMap(sx, sy) {
    const [X, Y] = toWorld(sx, sy);
    return { u: (X / TILE_HW + Y / TILE_HH) / 2, v: (Y / TILE_HH - X / TILE_HW) / 2 };
  }
  function tileAt(sx, sy) {
    const m = screenToMap(sx, sy);
    const x = Math.floor(m.u), y = Math.floor(m.v);
    return inMap(x, y) ? { x, y } : null;
  }
  function clampCam() {
    cam.x = clamp(cam.x, -MAP_SIZE * TILE_HW, MAP_SIZE * TILE_HW);
    cam.y = clamp(cam.y, 0, MAP_SIZE * TILE_HH * 2);
  }
  function panBy(dx, dy) { cam.x -= dx / cam.zoom; cam.y -= dy / cam.zoom; clampCam(); }
  function zoomAt(f, sx, sy) {
    const [X, Y] = toWorld(sx, sy);
    cam.zoom = clamp(cam.zoom * f, ZOOM_MIN, ZOOM_MAX);
    cam.x = X - (sx - W / 2) / cam.zoom;
    cam.y = Y - (sy - H / 2) / cam.zoom;
    clampCam();
  }
  function centerOn(u, v, zoom) {
    [cam.x, cam.y] = P(u, v);
    if (zoom) cam.zoom = zoom;
    clampCam();
  }

  // ---------- the image cache ----------
  // one image per look and zoom step (2^(1/4) apart), so a sprite stays sharp at every zoom
  function sprite(key, w, h, height, draw) {
    const s = Math.pow(2, Math.round(Math.log2(cam.zoom * dpr) * 4) / 4);
    const full = key + '@' + s;
    let e = cache.get(full);
    if (!e) {
      if (cache.size > 700) cache.clear();
      const pad = 6;
      const ox = h * TILE_HW + pad, oy = height + pad;
      const pw = (w + h) * TILE_HW + pad * 2, ph = (w + h) * TILE_HH + height + pad * 2;
      const img = document.createElement('canvas');
      img.width = Math.ceil(pw * s);
      img.height = Math.ceil(ph * s);
      const g = img.getContext('2d');
      g.setTransform(s, 0, 0, s, ox * s, oy * s);
      draw(g);
      e = { img, ox, oy, s };
      cache.set(full, e);
    }
    return e;
  }
  function drawSprite(e, u, v, alpha) {
    const [x, y] = P(u, v);
    if (alpha !== undefined) c.globalAlpha = alpha;
    c.drawImage(e.img, x - e.ox, y - e.oy, e.img.width / e.s, e.img.height / e.s);
    if (alpha !== undefined) c.globalAlpha = 1;
  }
  function buildingSprite(type, level, variant, ruin) {
    const d = BUILDINGS[type];
    const look = ruin ? 'ruins' : type;
    const n = SPRITE_VARIANTS[look] || 1;
    const lv = look === 'house' ? level : 0;
    return sprite(look + ':' + lv + ':' + (variant % n) + ':' + d.w + 'x' + d.h, d.w, d.h, spriteHeight(look, lv),
      (g) => drawBuildingSprite(g, look, lv, variant % n, d.w, d.h));
  }

  // ---------- the ground ----------
  const GRASS = ['#86bf4f', '#82ba4b', '#8ac454'];
  const FOREST_FLOOR = '#6fa53f';
  const SAND = '#dccb92';
  const WATER = ['#3d8fd4', '#3a8ad0'];
  const ROAD = '#62666b';
  const BRIDGE = '#8a7560';

  function diamond(path, x, y, z = 0) {
    const a = P(x, y, z), b = P(x + 1, y, z), d = P(x + 1, y + 1, z), e = P(x, y + 1, z);
    path.moveTo(a[0], a[1]); path.lineTo(b[0], b[1]); path.lineTo(d[0], d[1]); path.lineTo(e[0], e[1]); path.closePath();
  }
  function fillTiles(tiles, fill) {
    if (!tiles.length) return;
    const p = new Path2D();
    for (const [x, y] of tiles) diamond(p, x, y);
    c.fillStyle = fill;
    c.fill(p);
  }

  // the tile range that can show on the screen (with room below for tall buildings)
  function visibleRange() {
    const pts = [screenToMap(0, 0), screenToMap(W, 0), screenToMap(0, H), screenToMap(W, H)];
    const us = pts.map((p) => p.u), vs = pts.map((p) => p.v);
    return {
      x0: clamp(Math.floor(Math.min(...us)) - 1, 0, MAP_SIZE - 1), x1: clamp(Math.ceil(Math.max(...us)) + 6, 0, MAP_SIZE - 1),
      y0: clamp(Math.floor(Math.min(...vs)) - 1, 0, MAP_SIZE - 1), y1: clamp(Math.ceil(Math.max(...vs)) + 6, 0, MAP_SIZE - 1)
    };
  }
  function onScreen(x, y, margin) {
    const [X, Y] = P(x + 0.5, y + 0.5);
    const [sx, sy] = toScreen(X, Y);
    const m = margin * cam.zoom;
    return sx > -m && sx < W + m && sy > -m && sy < H + m * 3;
  }

  function drawBoard() {
    const N = MAP_SIZE, d = 18;
    poly(c, [P(0, N), P(N, N), P(N, N, -d), P(0, N, -d)], '#7a5c3e');
    poly(c, [P(N, 0), P(N, N), P(N, N, -d), P(N, 0, -d)], '#5e4630');
    // the highway coming in from beyond the map
    const hy = city.highwayY;
    for (let k = 1; k <= 5; k++) {
      c.globalAlpha = 1 - k / 6;
      const p = new Path2D(); diamond(p, -k, hy - 1); diamond(p, -k, hy + 1);
      c.fillStyle = GRASS[0]; c.fill(p);
      const r = new Path2D(); diamond(r, -k, hy);
      c.fillStyle = ROAD; c.fill(r);
    }
    c.globalAlpha = 1;
  }

  function drawGround(R, view) {
    const groups = new Map();
    const add = (fill, x, y, z) => { let p = groups.get(fill); if (!p) groups.set(fill, p = new Path2D()); diamond(p, x, y, z); };
    const waves = new Path2D(), marks = new Path2D(), rails = new Path2D();
    const t = run.time;
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
      if (!onScreen(x, y, 60)) continue;
      const i = idx(x, y), ter = city.terrain[i];
      const h = hash2(x, y);
      if (ter === T_WATER) {
        add(WATER[h < 0.5 ? 0 : 1], x, y);
        if (h < 0.3) {
          const o = Math.sin(t * 1.5 + h * 40) * 0.12;
          const a = P(x + 0.25 + o, y + 0.45), b = P(x + 0.6 + o, y + 0.45);
          waves.moveTo(a[0], a[1]); waves.lineTo(b[0], b[1]);
        }
        if (city.road[i]) {
          add(BRIDGE, x, y, 3);
          for (const [dx, dy] of DIRS) if (!isRoad(x + dx, y + dy) && !(dx === 0 && dy === 0)) {
            // a rail along the deck's open sides
            const e = dx === 1 ? [[x + 1, y], [x + 1, y + 1]] : dx === -1 ? [[x, y], [x, y + 1]] : dy === 1 ? [[x, y + 1], [x + 1, y + 1]] : [[x, y], [x + 1, y]];
            const a = P(e[0][0], e[0][1], 6), b = P(e[1][0], e[1][1], 6);
            rails.moveTo(a[0], a[1]); rails.lineTo(b[0], b[1]);
          }
        }
      } else if (city.road[i]) {
        add(ROAD, x, y);
      } else if (ter === T_FOREST) {
        add(FOREST_FLOOR, x, y);
      } else if (!run.occ[i] && nextToWater(x, y)) {
        add(SAND, x, y);
      } else {
        add(GRASS[Math.floor(h * 3)], x, y);
      }
      if (city.road[i]) {
        const z = ter === T_WATER ? 3 : 0;
        const [cx, cy] = P(x + 0.5, y + 0.5, z);
        for (const [dx, dy] of DIRS) if (isRoad(x + dx, y + dy) || (isHighway(x, y) && x === 0 && dx === -1)) {
          const [ex, ey] = P(x + 0.5 + dx * 0.5, y + 0.5 + dy * 0.5, z);
          marks.moveTo(cx, cy); marks.lineTo(ex, ey);
        }
      }
    }
    for (const [fill, p] of groups) { c.fillStyle = fill; c.fill(p); }
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.2; c.stroke(waves);
    c.strokeStyle = '#d7ccc8'; c.lineWidth = 1.5; c.stroke(rails);
    c.setLineDash([3, 4]);
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1; c.stroke(marks);
    c.setLineDash([]);

    // the flood over the open ground (over the buildings' lots it is drawn with each building)
    const f = city.flood;
    if (f) {
      const p = new Path2D();
      for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) if (!run.occ[idx(x, y)] && isFlooded(x, y)) diamond(p, x, y, 1);
      c.fillStyle = 'rgba(70,140,205,0.82)';
      c.fill(p);
    }

    // a light grid while a tool is in hand
    if (view.tool) {
      const g = new Path2D();
      for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) if (onScreen(x, y, 40)) diamond(g, x, y);
      c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 1 / cam.zoom; c.stroke(g);
    }
  }

  // tiles within the reach of an effect (a park's, a fire station's…), tinted while placing or selected
  function drawReach(type, x, y) {
    const d = BUILDINGS[type];
    const r = d.cover || (d.effect && d.effect.radius);
    if (!r) return;
    const good = d.cover || d.effect.happy > 0;
    const tiles = [];
    for (let ty = Math.max(0, Math.floor(y - r)); ty <= Math.min(MAP_SIZE - 1, y + d.h + r); ty++)
      for (let tx = Math.max(0, Math.floor(x - r)); tx <= Math.min(MAP_SIZE - 1, x + d.w + r); tx++)
        if (distToRect(tx + 0.5, ty + 0.5, x, y, d.w, d.h) <= r) tiles.push([tx, ty]);
    fillTiles(tiles, good ? 'rgba(255,255,255,0.18)' : 'rgba(255,90,60,0.2)');
  }

  function outline(x, y, w, h, color, width) {
    c.beginPath();
    c.moveTo(...P(x, y)); c.lineTo(...P(x + w, y)); c.lineTo(...P(x + w, y + h)); c.lineTo(...P(x, y + h)); c.closePath();
    c.strokeStyle = color; c.lineWidth = width / cam.zoom; c.stroke();
  }

  // ---------- the objects, front to back ----------
  // a is behind b when it lies wholly on the far side of b along u or along v
  function behind(a, b) { return a.u1 <= b.u0 + 1e-6 || a.v1 <= b.v0 + 1e-6; }
  function order(a, b) {
    const ab = behind(a, b), ba = behind(b, a);
    if (ab && !ba) return -1;
    if (ba && !ab) return 1;
    return a.s - b.s;
  }
  function obj(list, u0, v0, u1, v1, draw) { list.push({ u0, v0, u1, v1, s: u0 + u1 + v0 + v1, draw }); }

  function flames(cx, cy, z, size) {
    const t = run.time;
    const [x, y] = P(cx, cy, z);
    c.fillStyle = 'rgba(255,140,0,0.25)';
    c.beginPath(); c.ellipse(x, y + z * 0.5, 26 * size, 13 * size, 0, 0, Math.PI * 2); c.fill();
    for (let k = 0; k < 5; k++) {
      const dx = (k - 2) * 7 * size, fl = Math.sin(t * 13 + k * 2.1) * 0.5 + 0.5;
      const hgt = (18 + fl * 12 + (k % 2) * 6) * size;
      for (const [col, sc] of [['#ff6d00', 1], ['#ffd600', 0.55]]) {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(x + dx - 6 * size * sc, y);
        c.quadraticCurveTo(x + dx - 4 * size * sc, y - hgt * 0.6 * sc, x + dx + Math.sin(t * 7 + k) * 3, y - hgt * sc);
        c.quadraticCurveTo(x + dx + 4 * size * sc, y - hgt * 0.6 * sc, x + dx + 6 * size * sc, y);
        c.closePath(); c.fill();
      }
    }
  }

  function drawBuilding(b) {
    const d = def(b);
    drawSprite(buildingSprite(b.type, b.level, b.variant, b.ruin), b.x, b.y);
    let wet = false;
    if (city.flood) for (let y = b.y; y < b.y + d.h && !wet; y++) for (let x = b.x; x < b.x + d.w && !wet; x++) wet = isFlooded(x, y);
    if (wet) {
      const p = new Path2D();
      for (let y = b.y; y < b.y + d.h; y++) for (let x = b.x; x < b.x + d.w; x++) if (isFlooded(x, y)) diamond(p, x, y, 3);
      c.fillStyle = 'rgba(70,140,205,0.6)'; c.fill(p);
    }
    if (b.damaged && !b.fire) {
      c.fillStyle = 'rgba(40,30,20,0.35)';
      const [x, y] = P(b.x + d.w / 2, b.y + d.h / 2, spriteHeight(b.type, b.level) * 0.35);
      c.beginPath(); c.ellipse(x, y, 10 * d.w, 7 * d.w, 0, 0, Math.PI * 2); c.fill();
    }
    if (b.fire) flames(b.x + d.w / 2, b.y + d.h / 2, spriteHeight(b.type, b.level) * 0.55, Math.min(1.6, 0.7 + d.w * 0.3));
  }

  function drawObjects(R) {
    const list = [];
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
      const i = idx(x, y);
      if (city.terrain[i] !== T_FOREST || run.occ[i] || city.road[i] || !onScreen(x, y, 80)) continue;
      const variant = Math.floor(hash2(x, y, 7) * 8);
      obj(list, x, y, x + 1, y + 1, () => drawSprite(sprite('forest:' + variant, 1, 1, SPRITE_HEIGHT.forest, (g) => drawForest(g, variant)), x, y));
    }
    for (const b of city.buildings) {
      const d = def(b);
      if (b.x + d.w < R.x0 || b.x > R.x1 || b.y + d.h < R.y0 || b.y > R.y1) continue;
      obj(list, b.x, b.y, b.x + d.w, b.y + d.h, () => drawBuilding(b));
    }
    for (const car of run.cars) {
      const p = vehiclePos(car.from, car.to, car.t, 0.14);
      obj(list, p.u - 0.15, p.v - 0.15, p.u + 0.15, p.v + 0.15, () => drawCar(c, p.u, p.v, p.dx, p.dy, car.color));
    }
    for (const tr of run.trucks) {
      const i = Math.min(Math.floor(tr.pos), tr.path.length - 1), j = Math.min(i + 1, tr.path.length - 1);
      const p = vehiclePos(tr.path[i], tr.path[j], tr.pos - i, 0.14);
      if (i === j) { const q = vehiclePos(tr.path[Math.max(0, i - 1)], tr.path[i], 1, 0.14); p.dx = q.dx; p.dy = q.dy; }
      obj(list, p.u - 0.2, p.v - 0.2, p.u + 0.2, p.v + 0.2, () => {
        drawTruck(c, p.u, p.v, p.dx, p.dy, run.time);
        if (tr.state === 'work') spray(p, tr.target);
      });
    }
    list.sort(order);
    for (const o of list) o.draw();
  }

  function spray(p, b) {
    const d = def(b);
    const [x0, y0] = P(p.u, p.v, 12);
    const [x1, y1] = P(b.x + d.w / 2, b.y + d.h / 2, spriteHeight(b.type, b.level) * 0.6);
    c.strokeStyle = 'rgba(160,220,255,0.85)'; c.lineWidth = 2;
    c.setLineDash([3, 3]); c.lineDashOffset = -run.time * 40;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 30, x1, y1); c.stroke();
    c.setLineDash([]);
  }

  // ---------- on top: smoke, planes, icons ----------
  function puff(u, v, z, r, alpha, color) {
    const [x, y] = P(u, v, z);
    c.fillStyle = color.replace('A', alpha.toFixed(3));
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  function drawSky(R) {
    const t = run.time;
    for (const b of city.buildings) {
      const d = def(b);
      if (b.x + d.w < R.x0 - 2 || b.x > R.x1 || b.y + d.h < R.y0 - 2 || b.y > R.y1) continue;
      if (b.type === 'factory' && isWorking(b)) {
        for (let k = 0; k < 6; k++) {
          const ph = (t * 0.3 + k / 6 + b.id * 0.13) % 1;
          puff(b.x + 1.75 + ph * 0.9, b.y + 0.5 - ph * 0.5, 74 + ph * 50, 4 + ph * 11, 0.4 * (1 - ph), 'rgba(200,200,200,A)');
        }
      }
      if (b.fire) {
        const z = spriteHeight(b.type, b.level) * 0.6 + 20;
        for (let k = 0; k < 7; k++) {
          const ph = (t * 0.45 + k / 7) % 1;
          puff(b.x + d.w / 2 + ph * 1.2, b.y + d.h / 2 - ph * 0.6, z + ph * 70, 6 + ph * 16, 0.55 * (1 - ph), 'rgba(60,55,50,A)');
        }
      }
      if (b.type === 'airport' && isWorking(b)) {
        const ph = (t + b.id * 3.7) % PLANE_EVERY;
        if (ph < 12) {
          const roll = ph < 5 ? 5.2 * Math.pow(ph / 5, 2) : 5.2 + (ph - 5) * 2.1;
          const z = ph < 5 ? 0 : (ph - 5) * 16;
          c.globalAlpha = clamp((12 - ph) / 2, 0, 1);
          drawPlane(c, b.x + 3.15, b.y + 7.2 - roll, z, 0, -1, 1.1, '#ffffff');
          c.globalAlpha = 1;
        }
      }
    }
  }

  function icon(u, v, z, text, ring) {
    const [x, y] = P(u, v, z);
    const s = clamp(16 / cam.zoom, 10, 40);
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.beginPath(); c.arc(x, y, s * 0.75, 0, Math.PI * 2); c.fill();
    if (ring) { c.strokeStyle = ring; c.lineWidth = s * 0.14; c.stroke(); }
    c.font = Math.round(s) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#000';
    c.fillText(text, x, y + s * 0.05);
  }
  function drawIcons(R, view) {
    for (const b of city.buildings) {
      const d = def(b);
      if (b.x + d.w < R.x0 || b.x > R.x1 || b.y + d.h < R.y0 || b.y > R.y1) continue;
      const z = spriteHeight(b.ruin ? 'ruins' : b.type, b.level) + 14;
      const u = b.x + d.w / 2, v = b.y + d.h / 2;
      if (b.ruin || b.type === 'embankment' || b.fire) continue;
      if (!b.connected && b.type !== 'park') icon(u, v, z, '🚧', '#e53935');
      else if (b.damaged) icon(u, v, z, '🔧', '#fb8c00');
      else if (view.overlay && b.type === 'house') {
        const h = b.happy;
        icon(u, v, z, h >= 70 ? '😀' : h >= 50 ? '🙂' : h >= 30 ? '😐' : '☹️', h >= 70 ? '#43a047' : h >= 50 ? '#9ccc65' : h >= 30 ? '#fdd835' : '#e53935');
      }
    }
  }

  // ---------- a frame ----------
  // view: { tool, hover {x,y}, ghost {type, x, y, ok}, line {tool, tiles, steps}, selected, overlay }
  function draw(view) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#2b3f4f';
    c.fillRect(0, 0, cv.width, cv.height);
    if (!city) return;
    const k = dpr * cam.zoom;
    c.setTransform(k, 0, 0, k, (W / 2 - cam.x * cam.zoom) * dpr, (H / 2 - cam.y * cam.zoom) * dpr);
    const R = visibleRange();
    drawBoard();
    drawGround(R, view);

    if (view.selected) {
      drawReach(view.selected.type, view.selected.x, view.selected.y);
      const d = def(view.selected);
      outline(view.selected.x, view.selected.y, d.w, d.h, '#ffeb3b', 2.5);
    }
    if (view.ghost) {
      const d = BUILDINGS[view.ghost.type];
      drawReach(view.ghost.type, view.ghost.x, view.ghost.y);
      const tiles = [];
      for (let y = view.ghost.y; y < view.ghost.y + d.h; y++) for (let x = view.ghost.x; x < view.ghost.x + d.w; x++) tiles.push([x, y]);
      fillTiles(tiles, view.ghost.ok ? 'rgba(80,220,100,0.45)' : 'rgba(240,70,60,0.5)');
    }
    if (view.line) {
      const okSet = new Set(view.line.steps.map((s) => s.x + ',' + s.y));
      fillTiles(view.line.tiles.filter(([x, y]) => okSet.has(x + ',' + y)), view.line.tool === 'bulldoze' ? 'rgba(255,120,60,0.55)' : 'rgba(80,220,100,0.5)');
      fillTiles(view.line.tiles.filter(([x, y]) => !okSet.has(x + ',' + y)), 'rgba(0,0,0,0.15)');
    }
    if (view.hover && !view.ghost && !view.line) outline(view.hover.x, view.hover.y, 1, 1, view.tool === 'bulldoze' ? '#ff7043' : 'rgba(255,255,255,0.8)', 1.5);

    drawObjects(R);
    drawSky(R);
    drawIcons(R, view);
    if (view.ghost) {
      const g = view.ghost;
      drawSprite(buildingSprite(g.type, 1, 0, false), g.x, g.y, g.ok ? 0.75 : 0.45);
    }
  }

  // ---------- the toolbar's pictures ----------
  function toolIcon(tool, size) {
    const img = document.createElement('canvas');
    const r = Math.min(window.devicePixelRatio || 1, 3);
    img.width = img.height = Math.round(size * r);
    const g = img.getContext('2d');
    if (tool === 'bulldoze') {
      g.font = Math.round(size * 0.72 * r) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('🚜', img.width / 2, img.height * 0.55);
      return img;
    }
    let w = 1, h = 1, height = 14;
    if (tool !== 'road') { const d = BUILDINGS[tool]; w = d.w; h = d.h; height = spriteHeight(tool, tool === 'house' ? 2 : 0); }
    const bw = (w + h) * TILE_HW, bh = (w + h) * TILE_HH + height;
    const s = img.width * 0.92 / Math.max(bw, bh);
    g.setTransform(s, 0, 0, s, (img.width - bw * s) / 2 + h * TILE_HW * s, (img.height - bh * s) / 2 + height * s);
    if (tool === 'road') {
      const p = new Path2D(); diamond(p, 0, 0);
      g.fillStyle = ROAD; g.fill(p);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([4, 4]);
      g.beginPath(); g.moveTo(...P(0, 0.5)); g.lineTo(...P(1, 0.5)); g.stroke();
    } else {
      drawBuildingSprite(g, tool, tool === 'house' ? 2 : 0, 0, w, h);
    }
    return img;
  }

  window.addEventListener('resize', resize);
  resize();
  // the screen point of a map point (for the price tip next to a ghost)
  function mapToScreen(u, v, z = 0) { const [X, Y] = P(u, v, z); return toScreen(X, Y); }

  return { cam, resize, draw, tileAt, screenToMap, mapToScreen, panBy, zoomAt, centerOn, toolIcon, get width() { return W; }, get height() { return H; } };
})();
