'use strict';

// The two milestones of a run, each with its own time record per difficulty (see sim/records.js),
// and the texts of the dialog shown on reaching it (ui/dialogs.js).
const MILESTONES = {
  king: {
    storage: 'fishFrenzy.bestKingTime.',
    icon: '👑',
    title: 'You are the Sea King!',
    sub: 'You climbed all the way to the top of the food chain. Now keep growing to the maximum size!',
    epic: false
  },
  max: {
    storage: 'fishFrenzy.bestMaxTime.',
    icon: '🐋',
    title: 'Maximum size reached!',
    sub: 'You are the biggest fish in the sea — this is as big as anyone can get. From here on, eating won\'t make you any bigger.',
    epic: true
  }
};
