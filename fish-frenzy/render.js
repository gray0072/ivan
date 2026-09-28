'use strict';

// All drawing of the game world onto the main canvas. game.js owns the state and hands it over every frame
// as a `view` (entity arrays, the camera helpers and the screen size); the scenery layers live in scenery.js.

// Graphics presets: Low renders fewer pixels and skips the purely decorative full-screen layers
const GRAPHICS = {
  high: { label: 'High', maxPixels: 2560 * 1440, sunRays: true, vignette: true, foodGlow: true },
  low: { label: 'Low', maxPixels: 1600 * 900, sunRays: false, vignette: false, foodGlow: false }
};

function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let gfx = GRAPHICS.high;

  // Render at the device's pixel density (capped for performance, see canvasScale); all drawing stays in CSS pixels
  function resize(w, h) {
    W = w;
    H = h;
    const dpr = canvasScale(W, H, gfx.maxPixels);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setGraphics(key) {
    gfx = GRAPHICS[key] || GRAPHICS.high;
    if (W) resize(W, H);
  }

  // Soft red blob for the danger radar, pre-rendered once and stretched along the screen edge
  const RADAR_SPRITE = 128;
  const radarGlow = document.createElement('canvas');
  radarGlow.width = radarGlow.height = RADAR_SPRITE;
  {
    const c = radarGlow.getContext('2d');
    const g = c.createRadialGradient(RADAR_SPRITE / 2, RADAR_SPRITE / 2, 0, RADAR_SPRITE / 2, RADAR_SPRITE / 2, RADAR_SPRITE / 2);
    g.addColorStop(0, 'rgba(255,70,50,1)');
    g.addColorStop(0.3, 'rgba(255,40,30,0.6)');
    g.addColorStop(0.65, 'rgba(220,20,40,0.2)');
    g.addColorStop(1, 'rgba(200,0,40,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, RADAR_SPRITE, RADAR_SPRITE);
  }
  const radarBeat = new WeakMap();  // npc -> heartbeat phase (integrated, so a changing rate never jumps)
  let radarT = 0;

  // The current frame's state, unpacked so the drawing code below can use it by name
  let player, foods, npcs, jellies, birds, feathers, drops, foams, particles, bubbles, playing, radar;
  let worldToScreen, currentZoom, depthFrac, stageIndexForR, chompOpen;
  function bindView(v) {
    ({ player, foods, npcs, jellies, birds, feathers, drops, foams, particles, bubbles, playing, radar,
      worldToScreen, currentZoom, depthFrac, stageIndexForR, chompOpen } = v);
  }

  // Body and tail as one closed outline; the tail tips swing around the tail joint by `wag` radians, and tailK
  // flattens the tail fin (seen edge-on when the fish shows its back)
  function fishBodyPath(r, wag, tailK = 1) {
    const jx = -0.85 * r;
    const cw = Math.cos(wag), sw = Math.sin(wag);
    const tp = (x, y) => { const dx = x - jx; y *= tailK; return [jx + dx * cw - y * sw, dx * sw + y * cw]; };
    let a, b;
    ctx.beginPath();
    ctx.moveTo(jx, -0.16 * r);
    // back, rounded snout, belly
    ctx.bezierCurveTo(-0.4 * r, -0.68 * r, 0.45 * r, -0.72 * r, 0.82 * r, -0.32 * r);
    ctx.bezierCurveTo(1.04 * r, -0.12 * r, 1.04 * r, 0.16 * r, 0.82 * r, 0.34 * r);
    ctx.bezierCurveTo(0.45 * r, 0.72 * r, -0.4 * r, 0.68 * r, jx, 0.16 * r);
    // tail: lower lobe, notch, upper lobe
    a = tp(-1.2 * r, 0.28 * r); b = tp(-1.78 * r, 0.72 * r);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.58 * r, 0.22 * r); b = tp(-1.46 * r, 0);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.58 * r, -0.22 * r); b = tp(-1.78 * r, -0.72 * r);
    ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]);
    a = tp(-1.2 * r, -0.28 * r);
    ctx.quadraticCurveTo(a[0], a[1], jx, -0.16 * r);
    ctx.closePath();
  }

  function drawFish(sx, sy, r, heading, color, z, outline, wagPhase, chomp = 0) {
    const wag = Math.sin(wagPhase) * 0.22;
    // Near vertical the fish rolls about its long axis, turning its back to the viewer (the same whether it turns
    // over the top or the bottom), and comes out mirrored so the belly stays down. rc/rs = cos/sin of the roll angle:
    // a point at height y (back < 0) and lateral offset w (near flank > 0) shows up at y * rc + w * rs
    const roll = clamp(Math.cos(heading) * 2.5, -1, 1);
    const rc = Math.abs(roll), rs = Math.sqrt(1 - rc * rc);
    const bodyK = Math.sqrt(rc * rc + 0.25 * rs * rs);  // apparent body height: full side view .. half (from above)
    const farFront = clamp((0.4 - rc) / 0.3, 0, 1);     // far-flank eye/fin come out from behind the body
    const finColor = shade(color, -0.3);
    // big fish (sharks, whales) hold their pectoral fins out like steady wings instead of rowing: 0.35 rad for a fry … ~0.14 at the max size
    const pectoralSwing = 0.35 * Math.pow(Math.max(r, BASE_R) / BASE_R, -0.26);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(heading);
    ctx.scale(z, roll < 0 ? -z : z);

    // dorsal fin: flat, in the fish's midplane; the fins ripple with the swim stroke, lagging a little behind the tail
    const dorsal = Math.sin(wagPhase - 0.8);
    const ventral = Math.sin(wagPhase - 1.6);
    const dorsalPath = () => {
      ctx.beginPath();
      ctx.moveTo(0.3 * r, -0.5 * r * rc);
      ctx.quadraticCurveTo((-0.05 + dorsal * 0.06) * r, (-1.05 - dorsal * 0.05) * r * rc, (-0.6 + dorsal * 0.1) * r, (-0.9 + Math.abs(dorsal) * 0.06) * r * rc);
      ctx.quadraticCurveTo(-0.5 * r, -0.65 * r * rc, -0.5 * r, -0.4 * r * rc);
      ctx.closePath();
    };
    // pectoral fin on the near (sgn = 1) or far (-1) flank: flaps around its base, rowing slightly out of phase with the tail
    const pectoral = (sgn, alpha) => {
      ctx.save();
      // seen from the back the flank is ~0.29r out here, so the root sits a little inside it, with no gap
      ctx.translate(0.22 * r, (0.14 * rc + sgn * 0.24 * rs) * r);
      ctx.scale(1, sgn);
      ctx.rotate(Math.sin(wagPhase * 0.9 + 1.2) * pectoralSwing);
      ctx.fillStyle = shade(color, 0.25);
      ctx.globalAlpha = 0.85 * alpha;
      ctx.beginPath();
      ctx.moveTo(0.06 * r, 0);
      ctx.quadraticCurveTo(-0.2 * r, 0.46 * r, -0.47 * r, 0.32 * r);
      ctx.quadraticCurveTo(-0.24 * r, 0.16 * r, -0.12 * r, -0.04 * r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    const eyeR = Math.max(1.2, r * 0.15);
    const eye = (sgn, alpha) => {
      // seen from the back the head is ~0.25r wide each way here: the eye sits sunk in, a third of it sticking out
      const ex = 0.56 * r, ey = (-0.16 * rc + sgn * 0.2 * rs) * r;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10202b';
      ctx.beginPath();
      ctx.arc(ex + eyeR * 0.25, ey, eyeR * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(ex + eyeR * 0.05, ey - eyeR * 0.3, eyeR * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    // behind the body: dorsal and ventral fins, the far pectoral fin and eye
    ctx.fillStyle = finColor;
    dorsalPath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.05 * r, 0.52 * r * rc);
    ctx.quadraticCurveTo((-0.3 + ventral * 0.06) * r, (0.9 + ventral * 0.05) * r * rc, (-0.55 + ventral * 0.1) * r, (0.78 - Math.abs(ventral) * 0.06) * r * rc);
    ctx.quadraticCurveTo(-0.5 * r, 0.6 * r * rc, -0.48 * r, 0.42 * r * rc);
    ctx.closePath();
    ctx.fill();
    if (rs > 0.2) {
      pectoral(-1, 1);
      eye(-1, 1);
    }

    // body + tail: dark back, light belly; as it rolls, the back (darkest along the ridge) takes over
    ctx.save();
    ctx.scale(1, bodyK);
    fishBodyPath(r, wag, Math.max(rc, 0.1) / bodyK);
    const g = ctx.createLinearGradient(0, -0.7 * r, 0, 0.7 * r);
    g.addColorStop(0, shade(color, -0.35));
    g.addColorStop(0.45, color);
    g.addColorStop(1, shade(color, 0.55));
    ctx.fillStyle = g;
    ctx.fill();
    if (rc < 0.99) {
      const bg = ctx.createLinearGradient(0, -0.7 * r, 0, 0.7 * r);
      bg.addColorStop(0, color);
      bg.addColorStop(clamp(0.5 - 0.43 * rc / bodyK, 0, 1), shade(color, -0.45));
      bg.addColorStop(1, color);
      ctx.fillStyle = bg;
      ctx.globalAlpha = 1 - rc;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = clamp(2.5 / z, 1, 6) / 1.5;
      ctx.stroke();
    }

    // side-only details, fading out as the fish rolls: gill line and mouth
    ctx.lineCap = 'round';
    ctx.globalAlpha = rc;
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.beginPath();
    ctx.arc(0.18 * r, 0, 0.42 * r, -0.85, 0.85);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(0.7, r * 0.04);
    ctx.beginPath();
    ctx.arc(0.8 * r, 0.1 * r, 0.12 * r, 0.3, 1.5);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';

    // while biting, a dark wedge opens into the snout (clipped to the body outline)
    if (chomp > 0.02) {
      ctx.save();
      fishBodyPath(r, wag);
      ctx.clip();
      ctx.fillStyle = '#3b1219';
      ctx.beginPath();
      ctx.moveTo(0.6 * r, 0.1 * r);
      ctx.lineTo(1.15 * r, (0.1 - 0.34 * chomp) * r);
      ctx.lineTo(1.15 * r, (0.1 + 0.28 * chomp) * r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // soft gloss along the back
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.ellipse(0.05 * r, -0.36 * r * rc, 0.5 * r, 0.12 * r * bodyK, -0.08 * rc, 0, Math.PI * 2);
    ctx.fill();

    // rolled toward the viewer, the dorsal fin runs along the back, over the body
    const dorsalFront = clamp((0.7 - rc) / 0.4, 0, 1);
    if (dorsalFront > 0) {
      ctx.globalAlpha = dorsalFront;
      ctx.fillStyle = ctx.strokeStyle = finColor;
      ctx.lineWidth = r * 0.07;
      ctx.lineJoin = 'round';
      dorsalPath();
      ctx.fill();
      ctx.stroke();
      ctx.lineJoin = 'miter';
      ctx.globalAlpha = 1;
    }

    // over the body: near pectoral fin and eye; near vertical the far ones come into view on the other flank
    if (farFront > 0) {
      pectoral(-1, farFront);
      eye(-1, farFront);
    }
    pectoral(1, 1);
    eye(1, 1);

    ctx.restore();
  }

  function drawTouchControls() {
    if (!isCoarsePointer || !playing) return;

    // Zone hint while the spawn grace is active
    if (player.invulnTimer > 0) {
      const a = clamp(player.invulnTimer / SPAWN_GRACE, 0, 1);
      const splitX = W * STEER_ZONE_FRAC;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 18px Segoe UI, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag to steer', splitX / 2, H - 40);
      ctx.fillText('Hold to dash', splitX + (W - splitX) / 2, H - 40);
      ctx.restore();
    }

    if (joystick.id !== null) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joystick.baseX, joystick.baseY, JOY_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(joystick.baseX + joystick.dx, joystick.baseY + joystick.dy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function render(view) {
    bindView(view);
    const z = currentZoom();
    const stage = STAGES[stageIndexForR(player.r)];
    const df = depthFrac(player.y);

    const cam = { x: player.x, y: player.y, z, floorY: FLOOR_Y, surfaceY: SURFACE_Y, df, t: performance.now() / 1000, W, H, gfx };
    drawSky(ctx, cam);
    drawWater(ctx, cam);
    drawHills(ctx, cam);
    drawSeabed(ctx, cam);

    // food, with a soft glow that shows up in darker water
    for (const f of foods) {
      const p = worldToScreen(f.x, f.y);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const r = f.r * z * (1 + Math.sin(f.bob) * 0.15);
      ctx.fillStyle = f.color;
      if (gfx.foodGlow) {
        ctx.globalAlpha = 0.12 + 0.2 * df;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * FOOD_AURA, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const j of jellies) drawJelly(j, z, df);
    for (const b of birds) drawBird(b, z);

    // npc fish, with danger/prey outline for readability
    for (const n of npcs) {
      const p = worldToScreen(n.x, n.y);
      const rr = n.r * z * 2;
      if (p.x < -rr || p.x > W + rr || p.y < -rr || p.y > H + rr) continue;
      const color = STAGES[stageIndexForR(n.r)].color;
      let outline = 'rgba(255,255,255,0.35)';
      if (player.r > n.r * EAT_MARGIN) outline = '#69f0ae';
      else if (n.r > player.r * EAT_MARGIN) outline = '#ff5252';
      drawFish(p.x, p.y, n.r, n.heading, color, z, outline, n.wagPhase, chompOpen(n));
    }

    // player
    const pp = worldToScreen(player.x, player.y);
    if (player.invulnTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 120) * 0.2;
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, (player.r + 8) * z, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // a player snatched by a gull is drawn in its beak instead
    if (!player.caught) drawFish(pp.x, pp.y, player.r, player.heading, stage.color, z, player.stunTimer > 0 ? '#f06292' : 'rgba(255,255,255,0.6)', player.wagPhase, chompOpen(player));

    // the surface film goes over the fish, so anything half out of the water reads as crossing it
    drawSurface(ctx, cam, foams);
    drawFeathers(z);

    // splash droplets: short streaks along their motion
    ctx.lineCap = 'round';
    for (const d of drops) {
      const p = worldToScreen(d.x, d.y);
      if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) continue;
      const R = Math.max(0.8, d.r * z);
      const tx = p.x - d.vx * 0.018 * z, ty = p.y - d.vy * 0.018 * z;
      // a thin blue rim keeps the drops readable against the pale sky
      ctx.strokeStyle = 'rgba(70,150,200,0.45)';
      ctx.lineWidth = R * 2 + 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(225,246,255,0.95)';
      ctx.lineWidth = R * 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(p.x - R * 0.3, p.y - R * 0.3, R * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'butt';

    // particles
    for (const pt of particles) {
      const p = worldToScreen(pt.x, pt.y);
      ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pt.r * z, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // bubbles
    ctx.lineWidth = 1;
    for (const b of bubbles) {
      const p = worldToScreen(b.x, b.y);
      const a = clamp(b.life / b.maxLife, 0, 1);
      const R = b.r * z;
      ctx.strokeStyle = `rgba(220,245,255,${0.7 * a})`;
      ctx.fillStyle = `rgba(220,245,255,${0.12 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`;
      ctx.beginPath();
      ctx.arc(p.x - R * 0.35, p.y - R * 0.35, R * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player.stunTimer > 0) {
      ctx.fillStyle = `rgba(240,98,146,${clamp(player.stunTimer / 1.2, 0, 1) * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (gfx.vignette) drawVignette(ctx, cam);
    if (playing && radar && !player.caught) drawDangerRadar(z);
    drawTouchControls();
  }

  // Danger radar: every off-screen fish that could eat the player glows red at the screen edge in its direction,
  // with a chevron pointing at it. Bigger and closer = larger, brighter and faster-beating; it fades out as the
  // fish swims into view, where its red outline takes over.
  function drawDangerRadar(z) {
    const now = performance.now() / 1000;
    const dt = clamp(now - radarT, 0, 0.1);
    radarT = now;
    const cx = W / 2, cy = H / 2;
    const range = Math.hypot(W, H) / 2 * RADAR_RANGE;
    const inset = 30 + Math.min(W, H) * 0.02;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const n of npcs) {
      if (n.r <= player.r * EAT_MARGIN) continue;
      const p = worldToScreen(n.x, n.y);
      // how far the fish's body is outside the screen, in pixels
      const out = Math.max(-p.x, p.x - W, -p.y, p.y - H) - n.r * z;
      if (out <= 0 || out >= range) { radarBeat.delete(n); continue; }

      const near = 1 - out / range;
      const size = clamp((n.r / player.r - EAT_MARGIN) / (RADAR_FULL_RATIO - EAT_MARGIN), 0, 1);
      const toPlayer = Math.atan2(player.y - n.y, player.x - n.x);
      const hunting = n.mode === 'chase' && Math.cos(n.heading - toPlayer) > RADAR_HUNT_COS;
      const fadeIn = clamp(out / 40, 0, 1);
      const strength = fadeIn * Math.pow(near, 1.4) * (0.45 + 0.55 * size) * (hunting ? 1 : 0.75);
      if (strength < 0.02) continue;

      // heartbeat: a quick double-thump shape, faster when closer and when hunting
      const rate = lerp(RADAR_BEAT_MIN, RADAR_BEAT_MAX, near) * (hunting ? 1.3 : 1);
      const phase = ((radarBeat.get(n) ?? Math.random()) + dt * rate) % 1;
      radarBeat.set(n, phase);
      const beat = Math.max(Math.exp(-Math.pow((phase - 0.1) / 0.06, 2)), 0.6 * Math.exp(-Math.pow((phase - 0.32) / 0.06, 2)));

      // where the line from the screen center to the fish crosses the screen border
      const dx = p.x - cx, dy = p.y - cy;
      const sx = Math.abs(dx) > 1e-6 ? (W / 2) / Math.abs(dx) : Infinity;
      const sy = Math.abs(dy) > 1e-6 ? (H / 2) / Math.abs(dy) : Infinity;
      const s = Math.min(sx, sy);
      const ex = cx + dx * s, ey = cy + dy * s;
      const onSide = sx < sy;  // left/right edge (else top/bottom)

      // glow hugging the edge, stretched along it
      const R = (70 + 150 * size) * (0.55 + 0.45 * near) * (1 + 0.12 * beat);
      const along = R * 1.7, across = R;
      // added as light, so it reads as a warm alarm glow on the blue water instead of a muddy stain
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, strength * (0.75 + 0.35 * beat));
      if (onSide) ctx.drawImage(radarGlow, ex - across, ey - along, across * 2, along * 2);
      else ctx.drawImage(radarGlow, ex - along, ey - across, along * 2, across * 2);

      // chevron just inside the edge, nudged toward the threat on each beat
      const si = Math.min(sx === Infinity ? Infinity : (W / 2 - inset) / Math.abs(dx), sy === Infinity ? Infinity : (H / 2 - inset) / Math.abs(dy));
      const a = Math.atan2(dy, dx);
      ctx.globalCompositeOperation = 'source-over';
      const cs = 9 + 9 * size;
      ctx.save();
      ctx.translate(cx + dx * si + Math.cos(a) * beat * 5, cy + dy * si + Math.sin(a) * beat * 5);
      ctx.rotate(a);
      const alpha = Math.min(1, 0.45 + strength * 1.4) * (0.8 + 0.2 * beat);
      const chevrons = hunting ? [0, -cs * 0.8] : [0];
      for (const [w, style] of [[cs * 0.3 + 4, `rgba(80,0,10,${alpha * 0.45})`], [cs * 0.3, `rgba(255,85,65,${alpha})`]]) {
        ctx.lineWidth = w;
        ctx.strokeStyle = style;
        ctx.beginPath();
        for (const off of chevrons) {
          ctx.moveTo(off - cs * 0.6, -cs);
          ctx.lineTo(off + cs * 0.4, 0);
          ctx.lineTo(off - cs * 0.6, cs);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Side-view seagull: white body and head, grey wings with black tips, yellow beak
  function drawBird(b, z) {
    const p = worldToScreen(b.x, b.y);
    const R = b.r * z * BIRD_DRAW_SCALE;
    if (p.x < -R * 4 || p.x > W + R * 4 || p.y < -R * 4 || p.y > H + R * 4) return;
    const u = b.glide > 0 ? 0.15 : Math.sin(b.flap);  // wing up (+1) .. down (-1)
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(b.vx < 0 ? -R : R, R);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.2 / R;
    ctx.strokeStyle = 'rgba(40,52,64,0.55)';

    const wing = (lift, color) => {
      const ex = -0.3, ey = -0.2 - 1.3 * lift;
      const tx = -1.3, ty = -0.4 - 2.3 * lift;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0.45, -0.25);
      ctx.quadraticCurveTo(0.1, ey - 0.15, ex, ey);
      ctx.lineTo(tx, ty);
      ctx.quadraticCurveTo(-0.6, ey + 0.35, -0.45, -0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // black wingtip
      ctx.fillStyle = '#26303a';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(lerp(ex, tx, 0.6), lerp(ey, ty, 0.6) - 0.12);
      ctx.lineTo(lerp(ex, tx, 0.62), lerp(ey, ty, 0.62) + 0.18);
      ctx.closePath();
      ctx.fill();
    };
    wing(u * 0.85, '#8e9aa6');  // far wing, behind the body

    // tail
    ctx.fillStyle = '#e8edf1';
    ctx.beginPath();
    ctx.moveTo(-0.9, -0.15);
    ctx.lineTo(-1.8, -0.3);
    ctx.lineTo(-1.75, 0.12);
    ctx.lineTo(-0.9, 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // body and head
    const g = ctx.createLinearGradient(0, -0.5, 0, 0.45);
    g.addColorStop(0, '#dfe5ea');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.1, 0.45, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(1.0, -0.38, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // beak with the gull's red spot, and the eye
    ctx.fillStyle = '#f6c343';
    ctx.beginPath();
    ctx.moveTo(1.3, -0.46);
    ctx.lineTo(1.85, -0.34);
    ctx.lineTo(1.3, -0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0453a';
    ctx.beginPath();
    ctx.arc(1.62, -0.31, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b232b';
    ctx.beginPath();
    ctx.arc(1.1, -0.47, 0.07, 0, Math.PI * 2);
    ctx.fill();

    wing(u, '#b7c2cc');  // near wing, over the body
    ctx.restore();
    // a caught fish dangles from the beak, head up, tail wriggling
    if (b.carry) {
      const dir = b.vx < 0 ? -1 : 1;
      const fz = b.carry.r * z;
      drawFish(p.x + dir * 1.6 * R, p.y - 0.3 * R + 0.72 * fz, b.carry.r, -Math.PI / 2 + dir * 0.25, b.carry.color, z,
        'rgba(255,255,255,0.6)', b.carry.wagPhase);
    }
  }

  function drawFeathers(z) {
    for (const f of feathers) {
      const p = worldToScreen(f.x, f.y);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const L = f.len * z;
      ctx.save();
      ctx.globalAlpha = clamp(f.life, 0, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(f.rot);
      ctx.fillStyle = f.grey ? '#aab4be' : '#f7f9fb';
      ctx.strokeStyle = 'rgba(60,70,80,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, L, L * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-L * 1.2, 0);
      ctx.lineTo(L, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Drawn from the same cached geometry that circleHitsJelly() tests against
  function drawJelly(j, z, df) {
    const p = worldToScreen(j.x, j.baseY);
    const R = j.bellR * z;
    if (p.x < -R * 3 || p.x > W + R * 3 || p.y < -R * 3 || p.y > H + R * 3) return;
    const h = j.hue;

    // glow, stronger in dark water
    const halo = ctx.createRadialGradient(p.x, p.y - R * 0.3, R * 0.2, p.x, p.y - R * 0.3, R * 2.2);
    halo.addColorStop(0, `hsla(${h},90%,70%,${0.1 + 0.25 * df})`);
    halo.addColorStop(1, `hsla(${h},90%,70%,0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(p.x - R * 2.2, p.y - R * 2.5, R * 4.4, R * 4.4);

    // tentacles, behind the bell
    ctx.strokeStyle = `hsla(${h},85%,78%,0.75)`;
    ctx.lineWidth = JELLY_TENTACLE_HALF_W * 2 * z;
    ctx.lineCap = 'round';
    for (const t of j.tent) {
      const a = worldToScreen(t.x0, t.y0), c = worldToScreen(t.cx, t.cy), b = worldToScreen(t.x2, t.y2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // bell with a scalloped rim
    const g = ctx.createRadialGradient(p.x - R * 0.25, p.y - R * 0.7, R * 0.1, p.x, p.y - R * 0.3, R * 1.1);
    g.addColorStop(0, `hsla(${h},100%,93%,0.92)`);
    g.addColorStop(0.5, `hsla(${h},85%,72%,0.62)`);
    g.addColorStop(1, `hsla(${h},80%,55%,0.45)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, Math.PI, 0);
    const sc = 5;
    for (let k = 0; k < sc; k++) {
      const x1 = p.x + R - (k * 2 * R) / sc, x2 = p.x + R - ((k + 1) * 2 * R) / sc;
      ctx.quadraticCurveTo((x1 + x2) / 2, p.y + R * 0.14, x2, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `hsla(${h},95%,88%,0.8)`;
    ctx.lineWidth = Math.max(1, 1.3 * z);
    ctx.stroke();

    // inner glow and a highlight
    ctx.fillStyle = `hsla(${h},100%,90%,0.45)`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - R * 0.36, R * 0.38, R * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, 1.6 * z);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * 0.74, Math.PI * 1.15, Math.PI * 1.42);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  return { resize, render, setGraphics };
}
