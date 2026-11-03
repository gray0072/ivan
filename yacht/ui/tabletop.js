'use strict';

// Yacht — the table top: the colour and the texture the player picked, remembered as yacht.table.
// The colour is a CSS variable on the body, the texture a body[data-tex] rule in styles.css. Fills
// every .tablePick in the page (the start screen, the pause dialog).

const Tabletop = {
  current: { color: TABLE_DEFAULT.color, texture: TABLE_DEFAULT.texture },

  load() {
    try {
      const saved = JSON.parse(Groups.getSetting('table', 'null'));
      if (saved && TABLE_COLORS.some((c) => c.id === saved.color)) this.current.color = saved.color;
      if (saved && TABLE_TEXTURES.some((t) => t.id === saved.texture)) this.current.texture = saved.texture;
    } catch (e) { /* not our JSON: the default stays */ }
    this.apply();
  },

  apply() {
    const color = TABLE_COLORS.find((c) => c.id === this.current.color);
    document.body.style.setProperty('--table', color.hex);
    document.body.dataset.tex = this.current.texture;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color.hex);
    this.render();
  },

  set(part, id) {
    this.current[part] = id;
    Groups.setSetting('table', JSON.stringify(this.current));
    this.apply();
  },

  render() {
    document.querySelectorAll('.tablePick').forEach((box) => {
      box.innerHTML =
        '<div class="swatches">' + TABLE_COLORS.map((c) =>
          '<button type="button" class="swatch swatch-' + c.id + '" data-color="' + c.id + '" aria-pressed="' + (c.id === this.current.color) +
          '" title="' + esc(tr(c.name)) + '" aria-label="' + esc(tr(c.name)) + '"></button>').join('') + '</div>' +
        '<div class="btnRow small">' + TABLE_TEXTURES.map((t) =>
          '<button type="button" class="btn toggle" data-texture="' + t.id + '" aria-pressed="' + (t.id === this.current.texture) + '">' + esc(tr(t.name)) + '</button>').join('') + '</div>';
    });
  },

  bind() {
    document.addEventListener('click', (e) => {
      const c = e.target.closest('button[data-color]');
      if (c) this.set('color', c.dataset.color);
      const t = e.target.closest('button[data-texture]');
      if (t) this.set('texture', t.dataset.texture);
    });
  }
};
