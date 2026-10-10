'use strict';

// ============================================================
// World Aviation — a picture for every training course (COURSES):
// a mortarboard for Ground School, a cloud and the sun for Weather,
// a propeller, an ILS, a hazard diamond, a snowflake, a float plane…
// Line drawings in currentColor on a 24×24 grid, coloured by the CSS
// of whatever holds them (the course cards and the exam screens in
// ui/ui.js).
// ============================================================

const CourseIcons = {
  PATHS: {
    // General
    gen1: '<path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5v4.8c0 1.6 2.7 3.2 6 3.2s6-1.6 6-3.2v-4.8"/><path d="M21 10v6"/>',
    gen2: '<circle cx="8.5" cy="8" r="3.2"/><path d="M8.5 1.8v1.4M2.3 8h1.4M4.1 3.6l1 1M12.9 3.6l-1 1M4.1 12.4l1-1"/>' +
      '<path d="M8 20.5h9.5a3.8 3.8 0 0 0 .3-7.6 5.2 5.2 0 0 0-9.9 1.4A3.1 3.1 0 0 0 8 20.5z"/>',
    gen3: '<circle cx="12" cy="12" r="3"/><path d="M10.4 2.5h3.2l.5 2.7 2 .9 2.3-1.6 2.3 2.3-1.6 2.3.9 2 2.7.5v3.2l-2.7.5-.9 2 1.6 2.3-2.3 2.3-2.3-1.6-2 .9-.5 2.7h-3.2l-.5-2.7-2-.9-2.3 1.6-2.3-2.3 1.6-2.3-.9-2-2.7-.5v-3.2l2.7-.5.9-2-1.6-2.3 2.3-2.3 2.3 1.6 2-.9z"/>',
    gen4: '<circle cx="8" cy="7" r="2.8"/><circle cx="16" cy="7" r="2.8"/><path d="M2.5 20c0-3.4 2.4-6 5.5-6s5.5 2.6 5.5 6"/>' +
      '<path d="M16 21.2s-4-2.4-4-5.2a2 2 0 0 1 4-.6 2 2 0 0 1 4 .6c0 2.8-4 5.2-4 5.2z"/>',
    // Passenger
    pax1: '<path d="M12 2c.9 0 1.4 1.1 1.4 2.8v4.5l7.6 4.6v2.1l-7.6-2.3v4.1l2.5 1.9v1.6L12 20.4l-3.9.9v-1.6l2.5-1.9v-4.1L3 16v-2.1l7.6-4.6V4.8C10.6 3.1 11.1 2 12 2z"/>',
    paxtp: '<circle cx="12" cy="12" r="2"/><path d="M12 10c-1.4-3-1.4-6 0-8 1.4 2 1.4 5 0 8z"/>' +
      '<path d="M13.7 13c3.3.3 5.9 1.8 7 4-2.4.2-5-1-7-4z"/><path d="M10.3 13c-2 3-4.6 4.2-7 4 1.1-2.2 3.7-3.7 7-4z"/>',
    pax2: '<path d="M8.5 22 11 10h2l2.5 12"/><path d="M12 12.5v1.6M12 16.2v1.6M12 19.9V21"/>' +
      '<path d="M2.5 3.5 10 9M21.5 3.5 14 9" stroke-dasharray="2 2"/><path d="M12 2.5v3"/>',
    paxfbw: '<path d="M7 21.5h10M12 21.5v-3"/><path d="M8.5 18.5h7l-1-3.5h-5z"/><rect x="10" y="2.5" width="5" height="11" rx="2.5" transform="rotate(10 12.5 8)"/>' +
      '<path d="M4 6h2M4 9.5h2M18.5 4.5h2M18.5 8h2"/>',
    pax3: '<path d="M1.8 21 8.5 10.5l4 5.5 3-4.2 6.7 9.2z"/><path d="M6.6 13.5l1.9-1.2 1.5 1.6"/>' +
      '<path d="M13.6 7.6h6a2.6 2.6 0 0 0 0-5.2 3.4 3.4 0 0 0-6.2 1.3 2 2 0 0 0 .2 3.9z"/>',
    pax4: '<path d="M12 1.5c1.1 0 1.6 1.3 1.6 3.2V9l8.4 5v2.3l-8.4-2.6v4.4l2.8 2.1v1.7L12 21.1l-4.4.8v-1.7l2.8-2.1v-4.4L2 16.3V14l8.4-5V4.7c0-1.9.5-3.2 1.6-3.2z"/>' +
      '<path d="M6.3 13.4v2.2M17.7 13.4v2.2M8.6 12v2.2M15.4 12v2.2"/>',
    paxetops: '<path d="M2 17.5c1.7 0 1.7-1.4 3.3-1.4s1.7 1.4 3.4 1.4 1.6-1.4 3.3-1.4 1.6 1.4 3.3 1.4 1.7-1.4 3.4-1.4 1.6 1.4 3.3 1.4"/>' +
      '<path d="M2 21.5c1.7 0 1.7-1.4 3.3-1.4s1.7 1.4 3.4 1.4 1.6-1.4 3.3-1.4 1.6 1.4 3.3 1.4 1.7-1.4 3.4-1.4 1.6 1.4 3.3 1.4"/>' +
      '<path d="M3 12.5C5.5 6 15 3.8 20 7.5" stroke-dasharray="2 2.2"/><path d="M17 5.2l3.5 2.4-3.9 1.4"/>',
    // Cargo
    cargo1: '<path d="M12 1.8 22.2 12 12 22.2 1.8 12z"/><path d="M12 6.8c2 2.2 3.3 3.9 3.3 6a3.3 3.3 0 0 1-6.6 0c0-1.3.6-2.4 1.5-3.2.2 1.1.6 1.8 1.3 2.2.1-1.8-.1-3.3.5-5z"/>',
    cargo2: '<path d="M12 3v17.5M7.5 20.5h9M4.5 6.5h15M12 3l-1.5 3.5M12 3l1.5 3.5"/>' +
      '<path d="M4.5 6.5 1.8 13a2.7 2.7 0 0 0 5.4 0zM19.5 6.5 16.8 13a2.7 2.7 0 0 0 5.4 0z"/>',
    cargo3: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10"/>' +
      '<path d="M9.6 3.6 12 6l2.4-2.4M9.6 20.4 12 18l2.4 2.4M3.6 10.6 6.8 9.3l-.6-3.4M20.4 13.4l-3.2 1.3.6 3.4M3.6 13.4l3.2 1.3-.6 3.4M20.4 10.6l-3.2-1.3.6-3.4"/>',
    cargo4: '<rect x="2" y="12.5" width="9.5" height="8" rx="1"/><rect x="12.5" y="12.5" width="9.5" height="8" rx="1"/><rect x="7.2" y="3.5" width="9.5" height="8" rx="1"/>' +
      '<path d="M5 14.8v3.4M8.5 14.8v3.4M15.5 14.8v3.4M19 14.8v3.4M10.2 5.8v3.4M13.7 5.8v3.4"/>',
    cargo5: '<path d="M2.5 21.5h19M5 21.5V3h13.5M5 7.5 9.5 3M16.5 3v4"/>' +
      '<path d="M16.5 7a2 2 0 1 1-2 2"/><rect x="11.5" y="13.5" width="9" height="5.5" rx="1"/><path d="M14.5 11.2l-2 2.3M14.5 11.2l4 2.3"/>',
    // Bush & SAR
    bush1: '<path d="M18.5 2.5 22 8h-1.6l2 3.2h-7.8l2-3.2H15z"/><path d="M18.5 11.2v3"/>' +
      '<path d="M1.5 21h21M4 18.6h2.4M9 18.6h2.4M14 18.6h2.4"/><path d="M2 14.5l7-2.6 2.6-3.4h1.4l-1.1 2.7 3-1 1-1.3h1l-.9 2.4-12 4.2z"/>',
    bush2: '<path d="M7.5 14.5V4.2a2.2 2.2 0 1 1 4.4 0v10.3a4.2 4.2 0 1 1-4.4 0z"/><circle cx="9.7" cy="17.9" r="1.6"/><path d="M9.7 9v7.3"/>' +
      '<path d="M18.5 2.5v8M15 4.5l7 4M15 8.5l7-4"/>',
    bush3: '<path d="M9 2.5h6v6.5h6.5v6H15v6.5H9V15H2.5V9H9z"/>',
    bush4: '<path d="M2 21.5c1.7 0 1.7-1.3 3.3-1.3s1.7 1.3 3.4 1.3 1.6-1.3 3.3-1.3 1.6 1.3 3.3 1.3 1.7-1.3 3.4-1.3 1.6 1.3 3.3 1.3"/>' +
      '<path d="M4 17.5h13.5l1.5-1.5"/><path d="M7.5 17.5l1-3.5M14.5 17.5l-1-3.5"/><path d="M2.5 9.5h14l3.5-3.5h1.5l-.5 8H5z"/><path d="M8.5 9.5 10 5.5h4.5l-.5 4"/>'
  },
  // the branches' pictures, for the column headings (the client groups' own from UseIcons)
  BRANCH: {
    general: '<path d="M4 4.5h6.5A2.5 2.5 0 0 1 13 7v13a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6.5A2.5 2.5 0 0 0 11 7v13a2 2 0 0 1 2-2h7z"/>'
  },
  svg(id) {
    return '<svg class="courseSvg" viewBox="0 0 24 24" aria-hidden="true">' + (this.PATHS[id] || this.BRANCH[id] || '') + '</svg>';
  }
};
