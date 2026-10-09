'use strict';

// ============================================================
// World Aviation — the small pictures of the client groups
// (FACTIONS): a passenger, a crate, a fir tree for Bush & SAR.
// Line drawings in currentColor on a 16×16 grid, coloured by the
// CSS of whatever holds them. Used by the hangar's badges and
// purpose filter, the board's filter and the contracts' tags
// (ui/ui.js, ui/filters.js).
// ============================================================

const UseIcons = {
  PATHS: {
    pax: '<circle cx="8" cy="4.6" r="2.6"/><path d="M2.8 14.5c0-3.2 2.3-5.2 5.2-5.2s5.2 2 5.2 5.2z"/>',
    cargo: '<path d="M2.5 5.2 8 2.6l5.5 2.6v5.9L8 13.7l-5.5-2.6z"/><path d="M2.5 5.2 8 7.8l5.5-2.6M8 7.8v5.9"/>',
    bush: '<path d="M8 1.6 12.2 7.4h-2l3.2 4.4H2.6l3.2-4.4h-2z"/><path d="M8 11.8v2.8"/>'
  },
  svg(k) {
    return '<svg class="useSvg" viewBox="0 0 16 16" aria-hidden="true">' + (this.PATHS[k] || '') + '</svg>';
  }
};
