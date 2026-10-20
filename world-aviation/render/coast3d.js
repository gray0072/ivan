'use strict';

// ============================================================
// World Aviation — the coast drawn per pixel: where the land
// meets the water, the beaches and the shallows.
//
// The terrain's meshes are far too coarse to draw the shore (the
// far mesh's cells are 4-8 km, the near mesh's 110-420 m and laid
// out anew as the aeroplane flies), so the line is not where they
// cross the water: the coast's distance field (Terrain.coast, built
// with the flight's world in sim/terrain.js) goes to the GPU as a
// texture, with the same tile of noise, and every pixel of the
// water and of the land reads it (coastAt, the same sums as
// Terrain.coastAt) — the shore is a sharp line at any height, the
// same on both meshes, and stays where it is as they are rebuilt:
//   - the water (Scene3D's sea plane) is left out over the land,
//     its edge soft by a pixel, lighter over the shallows, with a
//     line of surf along the shore;
//   - the land is sand along the shore where the coast has a beach,
//     wet at the water's edge; where a mesh stands above the water
//     off the shore it is painted as the water, and its sea bed
//     under the water is left out (not shaded for nothing under the
//     opaque sea), read where the eye's ray meets the water, so the
//     two agree on every pixel.
// Used by render/landcover.js (the terrain's material) and Scene3D
// (the water, the textures with each new world).
// ============================================================

// the height of the water plane (Scene3D.buildWater)
const COAST_WATER_Y = WORLD.SEA_LEVEL - 0.5;

const Coast3D = {
  uniforms: {
    uCoastSdf: { value: null }, uCoastNoise: { value: null },
    uCoastBox: { value: new THREE.Vector4() },        // texel 0's corner, 1 / the field's size
    uCoastOn: { value: 0 }, uCoastBand: { value: 6000 },
    uWaterCol: { value: new THREE.Color(0x2c4f66) },   // the water's colour (the sea plane's own)
    uCoastEye: { value: new THREE.Vector3() }          // the camera drawing (trackEye)
  },
  built: null, version: -1, half: false,

  // the terrain's shader needs the eye (three.js gives a Lambert material no cameraPosition): set
  // as each of its meshes is drawn, by whichever camera draws it (the view, the picture in picture)
  trackEye(mesh) {
    mesh.onBeforeRender = (r, s, cam) => { this.uniforms.uCoastEye.value.setFromMatrixPosition(cam.matrixWorld); };
  },

  // with the renderer, before any material is compiled (Scene3D.init); webgl2: the field in
  // half floats (RG16F, filtered on every WebGL 2), else in bytes over ±band; the noise's tile
  init(webgl2) {
    this.half = !!webgl2;
    const t = new THREE.DataTexture(COAST_NOISE, COAST_NOISE_N, COAST_NOISE_N, webgl2 ? THREE.RedFormat : THREE.LuminanceFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.unpackAlignment = 1;
    t.needsUpdate = true;
    this.uniforms.uCoastNoise.value = t;
  },

  // the field of the flight's coast, when it is new (Scene3D.buildFarTerrain)
  update() {
    const c = Terrain.coast, u = this.uniforms;
    if (!c) { u.uCoastOn.value = 0; return; }
    if (c === this.built && c.version === this.version) return;
    this.built = c; this.version = c.version;
    if (u.uCoastSdf.value) u.uCoastSdf.value.dispose();
    const n = c.w * c.h;
    let t;
    if (this.half) {
      const d = new Uint16Array(n * 2), half = THREE.DataUtils.toHalfFloat;
      for (let i = 0; i < n; i++) { d[i * 2] = half(c.sdf[i]); d[i * 2 + 1] = half(c.k[i]); }
      t = new THREE.DataTexture(d, c.w, c.h, THREE.RGFormat, THREE.HalfFloatType);
    } else {
      const d = new Uint8Array(n * 2);
      for (let i = 0; i < n; i++) {
        d[i * 2] = Math.round(clamp(0.5 + c.sdf[i] / (2 * c.band), 0, 1) * 255);
        d[i * 2 + 1] = Math.round(clamp(c.k[i], 0, 1) * 255);
      }
      t = new THREE.DataTexture(d, c.w, c.h, THREE.LuminanceAlphaFormat);
    }
    t.magFilter = t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.unpackAlignment = 1;
    t.needsUpdate = true;
    u.uCoastSdf.value = t;
    u.uCoastBox.value.set(c.x0 - c.texel / 2, c.z0 - c.texel / 2, 1 / (c.texel * c.w), 1 / (c.texel * c.h));
    u.uCoastBand.value = c.band;
    u.uCoastOn.value = 1;
  },

  // the shader's #defines for this renderer's field
  defines() { return this.half ? '' : '#define COAST_BYTES\n'; },

  // the sea plane's material: lit as before, cut to the coast
  waterMaterial() {
    const m = new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x9fc8de, transparent: true, opacity: 1 });
    m.color = this.uniforms.uWaterCol.value;
    m.extensions = { derivatives: true };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', 'varying vec2 vCoastW;\n#include <common>')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoastW = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', 'varying vec2 vCoastW;\n' + this.defines() + COAST_PARS + '#include <common>')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' +
          '  vec2 coastN;\n' +
          '  float coastC = coastAt(vCoastW, coastN, -1e4);\n' +
          '  float coastAA = max(fwidth(coastC), 0.5);\n' +
          '  if (coastC >= 0.0) discard;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' +
          '  diffuseColor.rgb = coastWater(diffuseColor.rgb, coastC, coastAA, coastN);\n' +
          '  diffuseColor.a *= smoothstep(0.0, coastAA, -coastC);');
    };
    m.customProgramCacheKey = () => 'coastWater1' + this.half;
    return m;
  }
};

// The shader's side: the same sums as Terrain.coastAt and coastNoise (sim/terrain.js).
// coastAt(w, n, off): metres from the shore at w (world x, z), + on land; n the noise's two
// reads (−0.5..0.5, the coarse one and the fine one); off what it is with no coast built
const COAST_PARS = `
uniform sampler2D uCoastSdf, uCoastNoise;
uniform vec4 uCoastBox;
uniform float uCoastOn, uCoastBand;
uniform vec3 uWaterCol, uCoastEye;
float coastAt(vec2 w, out vec2 n, float off) {
  vec2 uv = (w - uCoastBox.xy) * uCoastBox.zw;
  vec4 s = texture2D(uCoastSdf, uv);
${TERRAIN.coastNoise.map(([S, , q], i) => {
    const c = (Math.cos(q) / S).toExponential(8), sn = (Math.sin(q) / S).toExponential(8);
    return `  float n${i} = texture2D(uCoastNoise, vec2(${c} * w.x + ${sn} * w.y, ${(-Math.sin(q) / S).toExponential(8)} * w.x + ${c} * w.y)).r - 0.5;`;
  }).join('\n')}
  n = vec2(n0, n1);
  if (uCoastOn < 0.5) return off;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -1e4;   // past the field: the open sea
#ifdef COAST_BYTES
  vec2 f = vec2((s.r - 0.5) * 2.0 * uCoastBand, s.a);
#else
  vec2 f = s.rg;
#endif
  return f.x + f.y * (${TERRAIN.coastNoise.map(([, A], i) => `${A.toFixed(1)} * n${i}`).join(' + ')});
}
// the water by the shore (c metres from it, aa the pixel's size in metres): lighter over the
// shallows, and a line of surf along the shore, gone where it would be under a pixel
vec3 coastWater(vec3 col, float c, float aa, vec2 n) {
  float sh = 1.0 - smoothstep(0.0, 380.0, -c);
  col = mix(col, col * vec3(1.25, 1.5, 1.32), sh * sh * 0.85 * (1.0 - smoothstep(0.45, 0.6, col.b)));
  float foam = (1.0 - smoothstep(1.5, 9.0 + 16.0 * (n.y + 0.5), -c)) * (1.0 - smoothstep(5.0, 25.0, aa));
  return mix(col, vec3(0.84, 0.88, 0.9), foam * 0.7);
}
// the land by the shore: a beach of sand where the coarse noise has one (none on about half
// the coasts but a strand a few metres wide), snowed over in the winter, wet at the edge
vec3 coastLand(vec3 col, float c, float aa, vec2 n) {
  float snow = smoothstep(0.5, 0.68, col.b);
  float bw = 80.0 * smoothstep(-0.08, 0.12, n.x) * (0.6 + 0.8 * (n.y + 0.5));
  float sand = 1.0 - smoothstep(bw, bw + 6.0 + aa, c);
  vec3 sandC = vec3(0.66, 0.61, 0.49) * (0.86 + 0.5 * (n.y + 0.5) * 0.5);
  col = mix(col, mix(sandC, col, snow * 0.85), sand);
  return col * (1.0 - 0.3 * (1.0 - smoothstep(0.0, 4.0 + aa, c)));
}
`;

// The terrain's side (render/landcover.js puts these in its material). vLandW is the world
// position. FRAG_PRE (where the hole is cut): the coast for this pixel — read where the eye's
// ray meets the water when the ground is under it, as the water's own pixel reads it — and the
// sea bed under the opaque water left out. FRAG (after the land cover): the shore's colours.
const COAST_TERRAIN_PRE = `
  bool coastUnder = vLandW.y < ${COAST_WATER_Y.toFixed(2)};
  vec2 coastQ = vLandW.xz;
  if (coastUnder && uCoastEye.y > ${COAST_WATER_Y.toFixed(2)})
    coastQ = mix(uCoastEye.xz, vLandW.xz, (uCoastEye.y - ${COAST_WATER_Y.toFixed(2)}) / (uCoastEye.y - vLandW.y));
  vec2 coastN;
  float coastC = coastAt(coastQ, coastN, 1e4);
  float coastAA = max(fwidth(coastC), 0.5);
  if (coastUnder && coastC < -2.0 * coastAA && uCoastEye.y > ${COAST_WATER_Y.toFixed(2)}) discard;
`;
const COAST_TERRAIN_FRAG = `
  if (coastC < 0.0) {
    // off the shore: under the water the wet sand of its soft edge (or the sea bed seen from
    // under the water), above it the water itself
    if (coastUnder) diffuseColor.rgb = mix(vec3(0.42, 0.39, 0.31), vec3(0.17, 0.21, 0.23), smoothstep(0.0, 60.0, -coastC));
    else diffuseColor.rgb = coastWater(uWaterCol, coastC, coastAA, coastN);
    totalEmissiveRadiance = vec3(0.0);
  } else {
    diffuseColor.rgb = coastLand(diffuseColor.rgb, coastC, coastAA, coastN);
  }
`;
