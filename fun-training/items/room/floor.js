// Floors (0..800 × 340..500).
// Cheap to elite; each entry is the catalog item (ITEMS) and its drawing (ROOM_ART), added by addItems.

(() => {
  const { r1, dot, star, sparkle, flip, flame, mod, skirt } = ROOM_KIT;
  const base = c => `<rect x="0" y="340" width="800" height="160" fill="${c}"/>`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${rx} ${ry} 0 1 0 ${r1(2 * rx)} 0a${rx} ${ry} 0 1 0 ${r1(-2 * rx)} 0`;
  const leaf = (x, y, a, len, w) => {
    const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
    const mx = x + c * len / 2, my = y + s * len / 2, px = -s * w, py = c * w;
    return `M${r1(x)} ${r1(y)}Q${r1(mx + px)} ${r1(my + py)} ${r1(x + c * len)} ${r1(y + s * len)}Q${r1(mx - px)} ${r1(my - py)} ${r1(x)} ${r1(y)}Z`;
  };
  // Floor boards: rows of planks from y 352, joints staggered; returns the fill, alternate rows and lines.
  const planks = (fill, alt, line, rows = 4, nails) => {
    const rh = 148 / rows;
    let h = base(fill), j = '', n = '';
    for (let r = 0; r < rows; r++) {
      const y = r1(352 + r * rh);
      if (r % 2) h += `<rect x="0" y="${y}" width="800" height="${r1(rh)}" fill="${alt}"/>`;
      if (r) j += `M0 ${y}H800`;
      for (let x = 60 + (r * 170) % 260; x < 800; x += 260) {
        j += `M${x} ${y}v${r1(rh)}`;
        if (nails) n += dot(x - 7, y + 8, 2) + dot(x - 7, y + rh - 8, 2) + dot(x + 7, y + 8, 2) + dot(x + 7, y + rh - 8, 2);
      }
    }
    return h + `<path d="${j}" stroke="${line}" stroke-width="2.5"/>` + (n ? `<path d="${n}" fill="${nails}"/>` : '');
  };
  // Shine streaks of a polished floor.
  const shine = (op = 0.3) => `<path d="M70 490 L150 370 M100 494 L176 380 M560 490 L630 386 M586 494 L652 396" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="${op}"/>`;
  const pumpkins = list => {
    let b = '', r = '', st = '', f = '';
    for (const [x, y, s, face] of list) {
      b += ell(x, y, 16 * s, 12.5 * s);
      r += `M${x} ${r1(y - 12 * s)}Q${r1(x - 9 * s)} ${y} ${x} ${r1(y + 12 * s)}Q${r1(x + 9 * s)} ${y} ${x} ${r1(y - 12 * s)}`;
      st += `M${r1(x - 2 * s)} ${r1(y - 11 * s)}l${r1(1 * s)} ${r1(-7 * s)}h${r1(3.5 * s)}l${r1(-0.5 * s)} ${r1(7 * s)}z`;
      if (face) f += `M${r1(x - 9 * s)} ${r1(y - 1 * s)}l${r1(3 * s)} ${r1(-5 * s)}l${r1(3 * s)} ${r1(5 * s)}z` +
        `M${r1(x + 3 * s)} ${r1(y - 1 * s)}l${r1(3 * s)} ${r1(-5 * s)}l${r1(3 * s)} ${r1(5 * s)}z` +
        `M${r1(x - 9 * s)} ${r1(y + 3 * s)}Q${x} ${r1(y + 13 * s)} ${r1(x + 9 * s)} ${r1(y + 3 * s)}Q${x} ${r1(y + 7 * s)} ${r1(x - 9 * s)} ${r1(y + 3 * s)}z`;
    }
    return `<path d="${st}" fill="#5aa04a" ${ln(1.5)}/><path d="${b}" fill="#ff9a3c" ${ln(2)}/>` +
      `<path d="${r}" fill="none" stroke="#e0761f" stroke-width="2"/>` + (f ? `<path d="${f}" fill="${INK}"/>` : '');
  };
  // Low fog banks drifting across.
  const fog = (list, fill = '#fff', op = 0.35) => list.map(([x, y, w, d]) => `<g class="an-drift an-d${d}"><path d="M${x - w} ${y + 6}` +
    `Q${r1(x - w * 0.8)} ${y - 10} ${r1(x - w * 0.45)} ${y - 6}Q${r1(x - w * 0.2)} ${y - 20} ${r1(x + w * 0.15)} ${y - 9}Q${r1(x + w * 0.5)} ${y - 18} ${r1(x + w * 0.7)} ${y - 4}` +
    `Q${x + w} ${y - 4} ${x + w} ${y + 6}Z" fill="${fill}" opacity="${op}"/></g>`).join('');
  const starfish = (x, y, s, c) => `<path d="${star(x, y, 13 * s, 0.45)}" fill="${c}" ${ln(1.5)} stroke-linejoin="round"/>` +
    `<path d="${dot(x, y, 1.6 * s)}${dot(x, y - 6 * s, 1.2 * s)}${dot(x + 5 * s, y - 2 * s, 1.2 * s)}${dot(x - 5 * s, y - 2 * s, 1.2 * s)}" fill="#fff" opacity="0.8"/>`;
  const shell = (x, y, s, c) => `<path d="M${x - 10 * s} ${y}Q${x - 10 * s} ${y - 12 * s} ${x} ${y - 12 * s}Q${x + 10 * s} ${y - 12 * s} ${x + 10 * s} ${y}Z" fill="${c}" ${ln(1.5)}/>` +
    `<path d="M${x} ${y}V${y - 11 * s}M${x - 5 * s} ${y}L${x - 3 * s} ${y - 10 * s}M${x + 5 * s} ${y}L${x + 3 * s} ${y - 10 * s}" stroke="${INK}" stroke-width="1.2" opacity="0.5"/>`;

  addItems('floor', ROOM_ART, [
    { id: 'boards', name: 'Bare boards', price: 0,
      draw: () => {
        let h = '<rect x="0" y="340" width="800" height="160" fill="#b2946f"/>', joints = '', nails = '';
        for (let r = 0; r < 4; r++) {
          const y = 352 + r * 37;
          if (r % 2) h += `<rect x="0" y="${y}" width="800" height="37" fill="#a68866"/>`;
          for (let x = 60 + (r * 170) % 260; x < 800; x += 260) {
            joints += `M${x} ${y}v37`;
            nails += dot(x - 7, y + 8, 2) + dot(x - 7, y + 29, 2) + dot(x + 7, y + 8, 2) + dot(x + 7, y + 29, 2);
          }
        }
        h += '<path d="M40 372 Q120 366 200 374 M420 446 Q500 440 600 450 M660 410 Q700 406 760 412 M150 480 Q220 476 280 482" fill="none" stroke="#c9ad88" stroke-width="3" stroke-linecap="round"/>' +
          '<g fill="#8c6e4e"><ellipse cx="330" cy="408" rx="9" ry="5"/><ellipse cx="610" cy="372" rx="7" ry="4"/><ellipse cx="90" cy="446" rx="8" ry="4.5"/></g>' +
          '<g fill="#b2946f"><ellipse cx="330" cy="408" rx="4" ry="2"/><ellipse cx="90" cy="446" rx="3.5" ry="2"/></g>' +
          `<path d="M0 389H800M0 426H800M0 463H800${joints}" stroke="#6f563f" stroke-width="2.5"/><path d="${nails}" fill="#4f3f33"/>` +
          '<path d="M700 426 L760 426 L740 431 Z M230 463 L300 463 L270 467 Z" fill="#5b4532"/>';
        return h + skirt('#9a7b5a') + `<path d="M180 336 L186 344 L198 344 L204 336 Z M560 352 L566 346 L578 346 L582 352 Z" fill="#6f563f"/>`;
      },
    },
    // The same boards swept clean, with a little striped rag mat to stand on.
    { id: 'sweptfloor', name: 'Swept boards', price: 15,
      draw: () => {
        let mat = '';
        const mc = ['#d9534f', '#e8e0cf', '#5b86c4', '#e8e0cf'];
        for (let i = 0; i < 12; i++) mat += `<rect x="${336 + i * 11}" y="464" width="11" height="30" fill="${mc[i % 4]}"/>`;
        return planks('#b89a74', '#ad8f6c', '#735a42', 4, '#56463a') +
          '<path d="M40 372 Q120 366 200 374 M420 446 Q500 440 600 450 M660 410 Q700 406 760 412" fill="none" stroke="#ccb18c" stroke-width="3" stroke-linecap="round"/>' +
          mat + `<rect x="336" y="464" width="132" height="30" rx="3" fill="none" ${ln(2)}/>` +
          `<path d="M336 467h-6M336 473h-6M336 479h-6M336 485h-6M336 491h-6M468 467h6M468 473h6M468 479h6M468 485h6M468 491h6" ${ln(1.5)}/>` +
          skirt('#a3845f');
      },
    },
    // Boards painted a soft grey-blue, a bit worn where people walk.
    { id: 'paintedfloor', name: 'Painted boards', price: 30,
      draw: () => planks('#a9c3cf', '#9eb8c6', '#64818f', 4, '#7a95a3') +
        '<path d="M300 420 q20 -6 44 0 q-6 8 -44 0 Z M430 470 q24 -6 50 0 q-10 8 -50 0 Z M120 384 q16 -4 34 0 q-8 6 -34 0 Z M640 446 q18 -5 36 0 q-8 6 -36 0 Z" fill="#b8987a"/>' +
        skirt('#f3f1ea'),
    },
    // Linoleum with a printed diamond pattern; one corner curls up.
    { id: 'linofloor', name: 'Linoleum', price: 50,
      draw: () => {
        let dm = '', dt = '';
        for (let r = 0; r < 4; r++) for (let i = 0; i < 20; i++) {
          const x = i * 40 + 20, y = 370 + r * 37;
          dm += `M${x} ${y - 12}l12 12l-12 12l-12 -12z`;
          dt += dot(x - 20, y - 18, 2.2);
        }
        return base('#efdfb6') + `<path d="${dm}" fill="#e2cc93"/><path d="${dt}" fill="#c9ab68"/>` +
          '<path d="M0 426H800" stroke="#d4bd85" stroke-width="2"/>' +
          `<path d="M800 470 L770 500 L800 500 Z" fill="#8a6d52"/><path d="M800 470 Q776 474 770 500 Q790 486 800 470 Z" fill="#f6ebcd" ${ln(1.5)}/>` +
          skirt('#c9ab6f');
      },
    },
    // Swedish: wide light pine planks with knots and grain.
    { id: 'pinefloor', name: 'Pine planks', price: 80,
      draw: () => {
        let g = '', k = '';
        for (let i = 0; i < 12; i++) {
          const x = (i * 197 + 30) % 760, y = 362 + (i % 3) * 49 + (i * 7) % 20;
          g += `M${x} ${y}q40 -6 90 0t90 0`;
          if (i % 3 === 1) k += ell(x + 100, y + 8, 6, 3.5);
        }
        return planks('#efd39e', '#e8c88b', '#b98f55', 3) +
          `<path d="${g}" fill="none" stroke="#dcb678" stroke-width="2.5" stroke-linecap="round"/><path d="${k}" fill="#c99a5c" ${ln(1)}/>` +
          skirt('#f7f3ea');
      },
    },
    { id: 'parquet', name: 'Parquet', price: 100,
      draw: () => {
        let h = '<rect x="0" y="340" width="800" height="160" fill="#dca469"/>', alt = '', lines = '', grid = '';
        for (let r = 0; r < 4; r++) {
          const y = 352 + r * 37;
          grid += `M0 ${y}H800`;
          for (let i = 0; i < 20; i++) {
            const x = i * 40;
            if ((r + i) % 2) { alt += `M${x} ${y}h40v37h-40z`; lines += `M${x + 13} ${y}v37M${x + 27} ${y}v37`; }
            else lines += `M${x} ${y + 12}h40M${x} ${y + 25}h40`;
          }
        }
        for (let x = 40; x < 800; x += 40) grid += `M${x} 352V500`;
        return h + `<path d="${alt}" fill="#cd9156"/><path d="${lines}" stroke="#b57a45" stroke-width="1.5"/>` +
          `<path d="${grid}" stroke="#8f5a2e" stroke-width="2"/>` +
          '<path d="M70 490 L150 370 M100 494 L176 380 M540 490 L610 386 M566 494 L632 396" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.22"/>' +
          skirt('#f5e6cc');
      },
    },
    // Swedish: pine boards covered with long striped rag rugs (trasmattor), fringes at the ends.
    { id: 'ragrugfloor', name: 'Rag-rug floor', price: 120,
      draw: () => {
        const cols = ['#f4efe2', '#d9534f', '#f3c94e', '#6ab07a', '#2f5a9e'], bands = cols.map(() => '');
        let fr = '', speck = '', runs = '';
        for (const [y0, hh, sh, bc] of [[358, 62, 0, '#7fa7d9'], [430, 64, 2, '#e98f86']]) {
          runs += `<rect x="30" y="${y0}" width="740" height="${hh}" fill="${bc}"/>`;
          for (let x = 60 + sh * 20, i = 0; x < 750; x += 74 + (i * 17) % 30, i++) {
            const c = (i + sh) % 4 + 1;
            bands[0] += `M${x} ${y0}h5v${hh}h-5zM${x + 17} ${y0}h5v${hh}h-5z`;
            bands[c] += `M${x + 7} ${y0}h8v${hh}h-8z`;
          }
          for (let y = y0 + 4; y < y0 + hh; y += 7) fr += `M30 ${y}h-10M770 ${y}h10`;
          for (let i = 0; i < 40; i++) speck += `M${30 + (i * 97) % 740} ${y0 + 6 + (i * 23) % (hh - 12)}h5`;
        }
        return planks('#efd39e', '#e8c88b', '#b98f55', 3) +
          runs + bands.map((d, i) => `<path d="${d}" fill="${cols[i]}"/>`).join('') +
          `<path d="${speck}" stroke="#fff" stroke-width="2.5" opacity="0.45"/>` +
          `<path d="${fr}" stroke="#e8e0cf" stroke-width="2.5"/><path d="M30 358h740v62h-740zM30 430h740v64h-740z" fill="none" ${ln(2)}/>` +
          skirt('#f7f3ea');
      },
    },
    // A soft lilac carpet from wall to wall.
    { id: 'carpetfloor', name: 'Soft carpet', price: 150,
      draw: () => {
        let a = '', b = '';
        for (let i = 0; i < 90; i++) {
          const d = dot((i * 137 + 9) % 800, 356 + (i * 59) % 142, 1.8);
          if (i % 2) a += d; else b += d;
        }
        return base('#b9a5de') + '<rect x="0" y="352" width="800" height="12" fill="#a995d2"/>' +
          `<path d="${a}" fill="#a690d4"/><path d="${b}" fill="#cbbbea"/>` + skirt('#f4effb');
      },
    },
    { id: 'checker', name: 'Checkered tiles', price: 200,
      draw: () => {
        let t = '';
        for (let r = 0; r < 4; r++) for (let i = 0; i < 20; i++) if ((r + i) % 2) t += `M${i * 40} ${352 + r * 37}h40v37h-40z`;
        return '<rect x="0" y="340" width="800" height="160" fill="#fffaf2"/>' + `<path d="${t}" fill="#7cc8ec"/>` +
          '<path d="M60 492 L130 372 M90 494 L156 380 M600 492 L660 388" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.35"/>' +
          skirt('#4fa6d4');
      },
    },
    // Halloween: a pumpkin patch of dark soil with curly vines, smiling pumpkins and a little fog.
    { id: 'pumpkinfloor', name: 'Pumpkin patch', price: 300,
      draw: () => {
        let fur = '', vine = '', lv = '';
        for (let y = 366; y < 500; y += 26) fur += `M0 ${y}Q200 ${y - 6} 400 ${y}T800 ${y}`;
        for (let i = 0; i < 9; i++) {
          const x = i * 95 + 10, y = 380 + (i * 37) % 100;
          vine += `M${x} ${y}q20 -14 40 0t40 0`;
          lv += leaf(x + 20, y - 6, -120, 20, 7) + leaf(x + 62, y + 4, 40, 18, 6);
        }
        return base('#6e4b33') + `<path d="${fur}" fill="none" stroke="#5a3c28" stroke-width="4"/>` +
          `<path d="${vine}" fill="none" stroke="#3f8a3a" stroke-width="3"/><path d="${lv}" fill="#5aa04a" ${ln(1.2)}/>` +
          pumpkins([[60, 420, 1.6, 1], [150, 372, 0.9], [250, 474, 1.2], [320, 392, 1.2, 1], [480, 398, 1.1, 1], [640, 378, 0.9], [740, 432, 1.7, 1]]) +
          `<g class="an-wiggle">${pumpkins([[560, 470, 1.3, 1]])}</g>` +
          fog([[200, 446, 120, 1], [540, 424, 130, 3], [400, 494, 110, 2]], '#f3eeff', 0.5) + skirt('#4a3328');
      },
    },
    // Swedish: a Midsummer meadow of grass and flowers, a flower wreath lying in it.
    { id: 'grassfloor', name: 'Midsummer meadow', price: 400,
      draw: () => {
        let bl = '', fl = ['', '', '', ''], cen = '';
        for (let i = 0; i < 70; i++) {
          const x = (i * 113 + 7) % 800, y = 360 + (i * 47) % 138;
          bl += `M${x} ${y}l-3 -9M${x} ${y}l1 -11M${x} ${y}l5 -8`;
        }
        for (let i = 0; i < 44; i++) {
          const x = (i * 157 + 40) % 800, y = 364 + (i * 71) % 130, k = i % 4;
          if (k === 0) { fl[0] += dot(x - 4, y, 3.4) + dot(x + 4, y, 3.4) + dot(x, y - 4, 3.4) + dot(x, y + 4, 3.4); cen += dot(x, y, 2.4); }
          else fl[k] += dot(x, y, 3.6);
        }
        let wr = '';
        for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; wr += dot(400 + Math.cos(a) * 30, 484 + Math.sin(a) * 9, 4.2); }
        const tall = (x, c, d) => `<g class="an-sway an-d${d}"><path d="M${x} 372V352" stroke="#4f9a3e" stroke-width="2.5"/><path d="${dot(x, 350, 5)}" fill="${c}" ${ln(1.2)}/></g>`;
        return base('#8fd06a') + '<rect x="0" y="352" width="800" height="14" fill="#7fc25c"/>' +
          `<path d="${bl}" stroke="#6cb04c" stroke-width="2" stroke-linecap="round"/>` +
          fl.map((d, i) => `<path d="${d}" fill="${['#fff', '#ffe14d', '#6a9cff', '#ff8fb0'][i]}"/>`).join('') + `<path d="${cen}" fill="#ffd23f"/>` +
          `<ellipse cx="400" cy="484" rx="30" ry="9" fill="none" stroke="#4f9a3e" stroke-width="7"/>` +
          `<path d="${wr}" fill="#ff8fb0"/><path d="${dot(370, 484, 3)}${dot(430, 484, 3)}${dot(400, 475, 3)}${dot(400, 493, 3)}" fill="#fff"/>` +
          tall(250, '#fff', 1) + tall(290, '#6a9cff', 3) + tall(520, '#ffe14d', 2) + tall(560, '#fff', 4) + skirt('#6fb84f');
      },
    },
    // A sandy beach with shells, a starfish and a little crab walking about.
    { id: 'sandfloor', name: 'Sand beach', price: 500,
      draw: () => {
        let dt = '', rip = '';
        for (let i = 0; i < 80; i++) dt += dot((i * 137 + 5) % 800, 356 + (i * 53) % 142, 1.5);
        for (let i = 0; i < 8; i++) { const x = (i * 211 + 40) % 700, y = 372 + (i * 41) % 110; rip += `M${x} ${y}q30 -8 60 0t60 0`; }
        const crab = `<g class="an-drift"><path d="M538 470l-10 -8M542 474l-12 2M582 470l10 -8M578 474l12 2" ${ln(2)}/>` +
          `<path d="${ell(560, 474, 18, 11)}" fill="#ff6b4f" ${ln(2)}/><path d="${dot(532, 458, 6)}${dot(588, 458, 6)}" fill="#ff6b4f" ${ln(1.5)}/>` +
          `<path d="M554 464v-8M566 464v-8" ${ln(2)}/><path d="${dot(554, 455, 3)}${dot(566, 455, 3)}" fill="#fff" ${ln(1.2)}/>` +
          `<path d="${dot(554, 455, 1.3)}${dot(566, 455, 1.3)}" fill="${INK}"/><path d="M554 478q6 4 12 0" fill="none" ${ln(1.5)}/></g>`;
        return base('#f5dea6') + `<path d="${dt}" fill="#e3c483"/><path d="${rip}" fill="none" stroke="#e9cc8e" stroke-width="3" stroke-linecap="round"/>` +
          shell(340, 486, 1.1, '#ffd0e0') + shell(470, 384, 0.9, '#fff3d6') + shell(140, 470, 1, '#ffe0b8') + shell(690, 392, 1, '#ffd0e0') +
          starfish(430, 470, 1.1, '#ff9a5a') + starfish(250, 392, 0.8, '#ffc94d') + crab + skirt('#e9c98a');
      },
    },
    { id: 'marble', name: 'Marble', price: 600,
      draw: () => {
        let alt = '', grout = 'M0 426H800', inlay = '';
        for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) if ((r + i) % 2) alt += `M${i * 100} ${352 + r * 74}h100v74h-100z`;
        for (let x = 100; x < 800; x += 100) { grout += `M${x} 352V500`; inlay += `M${x} 418L${x + 8} 426L${x} 434L${x - 8} 426Z`; }
        return '<rect x="0" y="340" width="800" height="160" fill="#f7f2f6"/>' + `<path d="${alt}" fill="#ece2ee"/>` +
          '<path d="M10 370 Q40 380 60 400 T96 420 M130 440 Q170 450 180 480 M260 360 Q300 380 290 410 M420 450 Q460 460 490 496 ' +
          'M560 362 Q590 372 620 368 T680 400 M720 450 Q750 470 790 474 M330 470 Q360 476 380 494" fill="none" stroke="#cbbfd6" stroke-width="2.5"/>' +
          '<path d="M40 400 Q50 412 70 414 M600 380 Q620 392 640 388 M450 470 Q470 476 478 490" fill="none" stroke="#d9cfe2" stroke-width="1.5"/>' +
          `<path d="${grout}" stroke="#e2b23c" stroke-width="3"/><path d="${inlay}" fill="#ffcf3f" ${ln(1.5)}/>` +
          '<path d="M150 488 L210 366 M180 490 L236 376 M650 488 L700 384" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.6"/>' +
          skirt('#fffaf4', '#f0c44c');
      },
    },
    // Winter: an ice rink with skate swirls, snow heaped along the wall and twinkling frost.
    { id: 'icefloor', name: 'Snowy ice rink', price: 700,
      draw: () => {
        let snow = 'M-5 360';
        for (let x = -5; x < 800; x += 50) snow += `Q${x + 25} ${x % 100 ? 318 : 334} ${x + 50} 360`;
        let fl = '';
        for (let i = 0; i < 26; i++) fl += dot((i * 151 + 30) % 800, 380 + (i * 43) % 116, 1.8);
        return base('#cdeefb') + '<path d="M0 420 Q200 400 400 420 T800 420 M0 470 Q200 452 400 470 T800 470" stroke="#bce4f6" stroke-width="18" fill="none"/>' +
          '<path d="M120 400 Q220 370 320 410 Q420 450 300 470 Q200 488 260 440 M480 390 Q600 370 680 410 Q740 446 640 470 M520 486 Q600 456 700 480" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
          `<path d="${fl}" fill="#fff"/>` + shine(0.45) +
          skirt('#ffffff', '#cfe6f5') + `<path d="${snow}" fill="#fff" ${ln(2)}/>` +
          sparkle(200, 430, 7) + sparkle(560, 460, 7) + sparkle(380, 390, 6) + sparkle(720, 440, 6);
      },
    },
    // Halloween: dark purple flagstones, fallen leaves, flickering candles and creeping fog.
    { id: 'hauntedfloor', name: 'Spooky fog floor', price: 800,
      draw: () => {
        const sc = ['#5d4a7e', '#544373', '#665489'], stones = sc.map(() => '');
        for (let r = 0; r < 3; r++) {
          const y = 354 + r * 49;
          for (let x = (r % 2 ? -40 : 0), i = 0; x < 800; i++) {
            const w = 90 + ((r * 7 + i) * 37) % 50;
            stones[(r + i) % 3] += `M${x + 10} ${y}h${w - 12}a8 8 0 0 1 8 8v29a8 8 0 0 1 -8 8h${12 - w}a8 8 0 0 1 -8 -8v-29a8 8 0 0 1 8 -8z`;
            x += w + 4;
          }
        }
        let lv = ['', ''];
        for (let i = 0; i < 12; i++) lv[i % 2] += leaf((i * 131 + 20) % 800, 370 + (i * 53) % 120, (i * 67) % 360, 16, 6);
        const candle = x => `<rect x="${x - 6}" y="346" width="12" height="22" rx="2" fill="#f4eedc" ${ln(1.5)}/>` +
          `<circle cx="${x}" cy="338" r="13" fill="#ffd36b" opacity="0.3"/>` + flame(x, 347, 0.8);
        return base('#33264a') + stones.map((d, i) => `<path d="${d}" fill="${sc[i]}" ${ln(2)}/>`).join('') +
          `<path d="${lv[0]}" fill="#ff9a3c" ${ln(1)}/><path d="${lv[1]}" fill="#c96a2b" ${ln(1)}/>` +
          skirt('#2a1f3d', '#7a62a6') + candle(250) + candle(560) +
          fog([[150, 470, 140, 1], [460, 430, 150, 3], [700, 480, 120, 2], [320, 392, 110, 4]], '#e9e0ff', 0.4);
      },
    },
    // Underwater: a sea floor with swaying seaweed, coral, a clam blowing bubbles and shimmering light.
    { id: 'seafloor', name: 'Sea floor', price: 1000,
      draw: () => {
        let net = '';
        for (let i = 0; i < 14; i++) { const x = (i * 131 + 20) % 780, y = 368 + (i * 47) % 110; net += `M${x} ${y}q16 -10 32 0q-4 12 -20 14q-14 -2 -12 -14`; }
        const weed = (x, hh, d) => `<g class="an-sway an-d${d}"><path d="M${x} 500Q${x - 14} ${500 - hh / 2} ${x} ${500 - hh}Q${x + 12} ${500 - hh / 2} ${x + 8} 500Z" fill="#4fbf72" ${ln(1.5)}/></g>`;
        const bub = (x, y, d) => `<g class="an-rise an-d${d}"><path d="${dot(x, y, 4)}${dot(x + 6, y - 16, 3)}" fill="none" stroke="#fff" stroke-width="2"/></g>`;
        return base('#e8d8a4') + '<rect x="0" y="352" width="800" height="18" fill="#d8c890"/>' +
          `<g class="an-glow"><path d="${net}" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.5"/></g>` +
          weed(30, 120, 1) + weed(60, 80, 3) + weed(240, 70, 2) + weed(560, 90, 4) + weed(760, 130, 2) + weed(730, 80, 1) +
          `<path d="M120 470V420M120 440L100 418M120 432L140 410M680 480V430M680 450L664 428M680 444L698 424" stroke="#ff8fa8" stroke-width="9" stroke-linecap="round"/>` +
          starfish(450, 474, 1.1, '#ff7a5a') + shell(520, 404, 1, '#ffd0e0') + shell(190, 482, 1, '#fff3d6') +
          `<path d="M300 470Q300 446 330 446Q360 446 360 470Z" fill="#b28cff" ${ln(2)}/><circle cx="330" cy="466" r="7" fill="#fff" ${ln(1.5)}/>` +
          `<path d="M300 470Q330 484 360 470Z" fill="#9b74e6" ${ln(2)}/>` +
          bub(326, 440, 1) + bub(336, 430, 3) + bub(600, 470, 2) + skirt('#4aaedc');
      },
    },
    // Lava: dark rock plates over glowing lava, little bubbles popping in the cracks.
    { id: 'lavafloor', name: 'Lava floor', price: 1200,
      draw: () => {
        let rock = '', top = '';
        for (let r = 0; r < 3; r++) {
          const y = 356 + r * 48;
          for (let x = (r % 2 ? -50 : 4), i = 0; x < 800; i++) {
            const w = 96 + ((r * 5 + i) * 41) % 50, j = ((r + i) * 13) % 8 - 4;
            rock += `M${x + 12} ${y + j}L${x + w - 10} ${y}Q${x + w} ${y} ${x + w} ${y + 12}L${x + w - 4} ${y + 30}Q${x + w - 6} ${y + 40} ${x + w - 16} ${y + 40}` +
              `L${x + 10} ${y + 38 - j}Q${x} ${y + 38} ${x} ${y + 26}L${x + 2} ${y + 10}Q${x + 2} ${y + j} ${x + 12} ${y + j}Z`;
            top += `M${x + 14} ${y + 8}H${x + w - 20}`;
            x += w + 10;
          }
        }
        const bub = (x, y, d) => `<g class="an-rise an-d${d}"><path d="${dot(x, y, 4)}" fill="#ffd04a"/></g>`;
        return base('#e8551a') + '<g class="an-glow"><rect x="0" y="340" width="800" height="160" fill="#ffc23d"/></g>' +
          `<path d="${rock}" fill="#3d2c2e" ${ln(2)}/><path d="${top}" stroke="#5c4446" stroke-width="5" stroke-linecap="round"/>` +
          bub(110, 402, 1) + bub(330, 450, 2) + bub(560, 404, 3) + bub(700, 498, 4) + bub(470, 498, 1) +
          skirt('#2c2023', '#ff8a2a');
      },
    },
    // Shiny gold tiles with ruby inlays and twinkles.
    { id: 'goldfloor', name: 'Gold tiles', price: 1500,
      draw: () => {
        let alt = '', bev = '', grout = 'M0 426H800', inl = '';
        for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) {
          const x = i * 80, y = 352 + r * 74;
          if ((r + i) % 2) alt += `M${x} ${y}h80v74h-80z`;
          bev += `M${x + 6} ${y + 66}V${y + 6}H${x + 74}`;
        }
        for (let x = 80; x < 800; x += 80) { grout += `M${x} 352V500`; inl += `M${x} 418L${x + 7} 426L${x} 434L${x - 7} 426Z`; }
        let h = base('#f4c443') + `<path d="${alt}" fill="#e8ad2a"/><path d="${bev}" fill="none" stroke="#ffe68f" stroke-width="3"/>` +
          `<path d="${grout}" stroke="#b37a16" stroke-width="3"/><path d="${inl}" fill="#ff4f7b" ${ln(1.5)}/>` + shine(0.45);
        for (const [x, y] of [[200, 392], [460, 470], [620, 380], [340, 440], [740, 470]]) h += sparkle(x, y, 8);
        return h + skirt('#e6a823', '#ffe08a');
      },
    },
    // A floor of dark blue glass with stars twinkling inside.
    { id: 'starfloor', name: 'Starry glass floor', gems: 10,
      draw: () => {
        let edge = '', tiny = '', hi = '';
        for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) {
          const x = i * 100, y = 352 + r * 74;
          edge += `M${x + 4} ${y + 4}h92v66h-92z`;
          hi += `M${x + 10} ${y + 60}V${y + 10}H${x + 60}`;
        }
        for (let i = 0; i < 60; i++) tiny += dot((i * 137 + 11) % 800, 358 + (i * 61) % 138, 1.5);
        let h = base('#1d2552') + `<path d="${tiny}" fill="#c9d3ff"/><path d="${edge}" fill="none" stroke="#6f7fe0" stroke-width="3"/>` +
          `<path d="${hi}" fill="none" stroke="#a9b6ff" stroke-width="2" opacity="0.6"/>`;
        for (let i = 0; i < 14; i++) {
          const x = (i * 233 + 50) % 780 + 10, y = 366 + (i * 47) % 124;
          h += `<path class="an-twinkle an-d${i % 4 + 1}" d="${star(x, y, 7 + (i % 3) * 2)}" fill="#ffe27a"/>`;
        }
        return h + shine(0.18) + skirt('#2b3570', '#ffd36b');
      },
    },
    // Walking on clouds: soft puffs, some drifting, with golden twinkles.
    { id: 'cloudfloor', name: 'Cloud floor', gems: 20,
      draw: () => {
        const puff = (x, y, s) => dot(x, y, 22 * s) + dot(x + 26 * s, y - 10 * s, 26 * s) + dot(x + 54 * s, y, 22 * s) + `M${x} ${y + 14 * s}h${54 * s}v${-14 * s}h${-54 * s}z`;
        let back = '', front = '';
        for (let i = 0; i < 9; i++) back += puff(i * 96 - 20, 376 + (i % 2) * 10, 1);
        for (let i = 0; i < 8; i++) front += puff(i * 110 - 30 + (i % 2) * 20, 440 + (i % 3) * 18, 1.2);
        let h = base('#bfe2ff') + `<g class="an-drift"><path d="${back}" fill="#e8f4ff"/></g>` +
          `<path d="${front}" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="${front}" fill="#fff"/>` + `<path d="M0 500V480H800V500Z" fill="#fff"/>`;
        for (const [x, y] of [[150, 400], [330, 470], [520, 420], [690, 480], [420, 380], [60, 470]]) h += sparkle(x, y, 8);
        return h + skirt('#ffffff', '#ffd36b');
      },
    },
    // A dance floor of rainbow light tiles that blink on and off.
    { id: 'rainbowfloor', name: 'Rainbow light floor', gems: 30,
      draw: () => {
        const cols = ['#ff6b6b', '#ffa94d', '#ffe14d', '#7ed957', '#5fb7ff', '#b28cff'];
        const pale = cols.map(() => ''), lit = cols.map(() => cols.map(() => ''));
        for (let r = 0; r < 4; r++) for (let i = 0; i < 16; i++) {
          const c = (i + r) % 6, t = `M${i * 50 + 3} ${355 + r * 37}h44v31h-44z`;
          pale[c] += t;
          if ((i * 3 + r * 5) % 3 === 0) lit[c][(i + r * 2) % 4] += t;
        }
        let h = base('#fff') + pale.map((d, c) => `<path d="${d}" fill="${cols[c]}" opacity="0.45"/>`).join('');
        lit.forEach((g, c) => g.forEach((d, k) => { if (d) h += `<path class="an-blink an-d${k + 1}" d="${d}" fill="${cols[c]}"/>`; }));
        h += shine(0.35);
        for (const [x, y] of [[180, 400], [420, 470], [600, 380], [720, 460], [300, 372]]) h += sparkle(x, y, 8);
        return h + skirt('#fff', '#ffd36b');
      },
    },
  ]);
})();
