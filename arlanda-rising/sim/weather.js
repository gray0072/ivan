'use strict';

// Arlanda Rising — the weather of an ops stage: temperature, wind, snowfall and fog as a timeline made at the
// stage's start from the mission's script, scaled by the difficulty (milder on Easy, harsher on Hard), with
// random snow showers when the mission allows them. Kept in S.ops.weather, so a resumed stage has the
// same weather. Used by the runways (snow, fog, wind direction) and the screens (the forecast).

const Weather = {
  // the stage's weather from its script: { temp, wind: [from °, kt], snow: [[from, to, mm/h]], fog: [[from, to, m]],
  // showers: chance of random snow showers (0..1) }
  make(spec, from, to) {
    spec = spec || {};
    const k = diff().weather;
    const w = {
      temp: spec.temp !== undefined ? spec.temp : 5,
      windDir: (spec.wind || [200, 8])[0], wind: Math.round((spec.wind || [200, 8])[1] * (0.8 + 0.2 * k)),
      snow: (spec.snow || []).map((p) => [clockMin(p[0]), clockMin(p[1]), p[2] * k]),
      fog: (spec.fog || []).map((p) => [clockMin(p[0]), clockMin(p[1]), Math.round(p[2] / k)])
    };
    if (spec.showers && w.temp <= 1) {
      const n = Math.round(rand() * 2 * k * spec.showers);
      for (let i = 0; i < n; i++) {
        const t0 = randRange(from, to - 60);
        w.snow.push([t0, t0 + randRange(30, 60), randRange(1, 3) * k]);
      }
    }
    return w;
  },
  // the weather now: { temp, wind, windDir, snow (mm/h), vis (m), dark }
  now() {
    const w = S.ops.weather, t = S.clock;
    let snow = 0, vis = 10000;
    for (const p of w.snow) if (t >= p[0] && t < p[1]) snow += p[2];
    for (const p of w.fog) if (t >= p[0] && t < p[1]) vis = Math.min(vis, p[2]);
    // falling snow hides the runway too: under FOG_VIS_MIN from about 9 mm an hour
    if (snow > 0) vis = Math.min(vis, Math.round(4000 / (1 + snow)));
    return { temp: w.temp, wind: w.wind, windDir: w.windDir, snow, vis, dark: Calendar.dark(S.day, t) };
  }
};
