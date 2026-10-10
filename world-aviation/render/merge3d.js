'use strict';

// ============================================================
// World Aviation — baking static meshes together (three.js)
//
// A phone draws a few hundred separate meshes a frame comfortably,
// not well over a thousand: an airport's buildings and the parked
// aeroplanes at its stands were most of its draw calls (a parked
// aeroplane alone is 60-80 meshes). What never moves is baked here
// into one mesh per material, in the parent's own axes:
//   - materials that look the same (the same kind, colours, texture,
//     sides, blending...) count as one, since most parts are built
//     each with a material of their own;
//   - a material that is lit at night (in rec.night) stays apart from
//     the others, and goes with the ones lit in the same colour;
//   - what is hidden, and what was asked to be kept (a flag in the
//     wind), is left as it is; instanced meshes and points too.
// Used by Airport3D.build (airport3d.js) for the buildings, the
// landside and the boards, and for each parked aeroplane.
// ============================================================

const Merge3D = {
  // Bake the meshes under roots (objects in parent, by default all its children) into parent.
  // opts.keep: a Set of objects to leave alone (with all under them); opts.night: rec.night
  // ({ mat, color, k }) for the materials that light up after dark; opts.dropHidden: drop what
  // is hidden or fully transparent instead of keeping it (a parked aeroplane's lights, its
  // stopped propeller's disc). The baked meshes are tagged userData.baked = opts.tag.
  bake(parent, roots, opts) {
    opts = opts || {};
    roots = roots || parent.children.slice();
    const keep = opts.keep || new Set();
    const night = new Map();
    for (const n of opts.night || []) night.set(n.mat, n.color.getHexString() + '/' + n.k);
    parent.updateMatrixWorld(true);
    const toParent = new THREE.Matrix4().copy(parent.matrixWorld).invert();
    const bins = new Map(), baked = [], drop = [];
    const visit = (o) => {
      if (keep.has(o)) return;
      if (!o.visible) { if (opts.dropHidden) drop.push(o); return; }
      if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.geometry && o.geometry.attributes.position) {
        if (this.add(bins, o, toParent, night, opts.dropHidden)) baked.push(o);
      }
      for (const c of o.children.slice()) visit(c);
    };
    for (const r of roots) visit(r);
    // what was under a baked mesh and is not baked itself moves to the parent, where it was
    // (while the baked one is still in place, so its transform is known)
    const gone = new Set(baked);
    for (const o of baked) for (const c of o.children.slice()) if (!gone.has(c)) parent.attach(c);
    for (const o of baked) { if (o.parent) o.parent.remove(o); o.geometry.dispose(); }
    for (const o of drop) if (o.parent) o.parent.remove(o);
    this.prune(parent, keep);
    const out = [];
    for (const b of bins.values()) {
      const mesh = new THREE.Mesh(this.geometry(b), b.mat);
      mesh.renderOrder = b.order;
      mesh.userData.baked = opts.tag || true;
      parent.add(mesh);
      out.push(mesh);
    }
    return out;
  },

  // file a mesh's triangles under their materials; false if it cannot be baked (left as it is)
  add(bins, mesh, toParent, night, dropHidden) {
    const geo = mesh.geometry, mats = [].concat(mesh.material);
    if (mats.some((m) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || m.morphTargets)) return false;
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const m4 = new THREE.Matrix4().multiplyMatrices(toParent, mesh.matrixWorld);
    const flip = m4.determinant() < 0;
    const count = geo.index ? geo.index.count : geo.attributes.position.count;
    const ranges = Array.isArray(mesh.material) && geo.groups.length
      ? geo.groups.map((g) => ({ start: g.start, end: Math.min(count, g.start + g.count), mat: mats[g.materialIndex] }))
      : [{ start: 0, end: count, mat: mats[0] }];
    for (const r of ranges) {
      if (!r.mat || r.end <= r.start) continue;
      if (dropHidden && r.mat.transparent && r.mat.opacity === 0) continue;
      const uv = !!geo.attributes.uv, col = geo.attributes.color ? geo.attributes.color.itemSize : 0;
      const key = this.matKey(r.mat, night) + '|' + uv + col + '|' + mesh.renderOrder;
      let b = bins.get(key);
      if (!b) { b = { mat: r.mat, order: mesh.renderOrder, uv, col, parts: [] }; bins.set(key, b); }
      b.parts.push({ geo, m4, flip, start: r.start, end: r.end });
    }
    return true;
  },

  // what makes two materials draw the same
  matKey(m, night) {
    if (night.has(m)) return 'night:' + night.get(m) + ':' + this.props(m);
    return this.props(m);
  },
  props(m) {
    const c = (x) => (x ? x.getHexString() : '-');
    const t = (x) => (x ? x.uuid : '-');
    return [m.type, c(m.color), c(m.emissive), c(m.specular), m.shininess, t(m.map), t(m.emissiveMap), t(m.alphaMap),
      m.side, m.transparent, m.opacity, m.alphaTest, m.depthWrite, m.depthTest, m.blending, m.vertexColors, m.fog,
      m.polygonOffset, m.polygonOffsetFactor, m.polygonOffsetUnits, m.flatShading, m.wireframe, m.toneMapped].join(',');
  },

  // one geometry of all the parts of a bin, in the parent's axes
  geometry(b) {
    let nv = 0, ni = 0;
    for (const p of b.parts) {
      const n = p.end - p.start;
      ni += n;
      nv += p.geo.index ? p.geo.attributes.position.count : n;
    }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3);
    const uv = b.uv ? new Float32Array(nv * 2) : null, col = b.col ? new Float32Array(nv * b.col) : null;
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    let vo = 0, io = 0;
    for (const p of b.parts) {
      const A = p.geo.attributes, P = A.position, N = A.normal, U = A.uv, C = A.color;
      nm.getNormalMatrix(p.m4);
      // an indexed part brings all its vertices (its triangles pick from them); a plain one
      // only those of its range
      const v0 = p.geo.index ? 0 : p.start, v1 = p.geo.index ? P.count : p.end;
      for (let i = v0; i < v1; i++) {
        const o = vo + i - v0;
        v.fromBufferAttribute(P, i).applyMatrix4(p.m4); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
        v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z;
        if (uv) { uv[o * 2] = U.getX(i); uv[o * 2 + 1] = U.getY(i); }
        if (col) for (let k = 0; k < b.col; k++) col[o * b.col + k] = C.array[i * C.itemSize + k];
      }
      const I = p.geo.index;
      for (let i = p.start; i < p.end; i += 3) {
        const a = (I ? I.getX(i) : i) - v0, b1 = (I ? I.getX(i + 1) : i + 1) - v0, c = (I ? I.getX(i + 2) : i + 2) - v0;
        // a mirrored part turns its triangles the other way round, so they still face outwards
        idx[io++] = vo + a;
        idx[io++] = vo + (p.flip ? c : b1);
        idx[io++] = vo + (p.flip ? b1 : c);
      }
      vo += v1 - v0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (col) g.setAttribute('color', new THREE.BufferAttribute(col, b.col));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    return g;
  },

  // the groups left empty
  prune(o, keep) {
    for (const c of o.children.slice()) {
      if (keep.has(c)) continue;
      this.prune(c, keep);
      if (c.type === 'Group' && !c.children.length) o.remove(c);
    }
  }
};
