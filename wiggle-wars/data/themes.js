'use strict';

// Wiggle Wars — the looks of a map (themes) and the kinds of land (map kinds), as plain data.
// A theme gives the colours of the land, sky, backdrop and water, and its gravity and wind
// factors. Used by sim/mapgen.js, render/terrainview.js, render/backdrop.js and ui/setup.js.

const THEMES = {
  meadow: {
    name: 'Meadow', gravity: 1, wind: 1,
    top: '#5dbb3f', top2: '#3f9a2a', soil: ['#8a5a32', '#7a4d2a', '#99683c'], deep: '#5e3b1f', rim: '#3a2412',
    sky: ['#5aa9e6', '#a8d8f5', '#e4f4fb'], far: '#8fbfa4', near: '#6aa678', water: ['#2f7fc4', '#1c4f86'],
    deco: 'flowers', back: 'hills', cloud: 'rgba(255,255,255,0.85)', stone: '#9a8f86'
  },
  desert: {
    name: 'Desert', gravity: 1, wind: 1,
    top: '#f2cf7c', top2: '#e0b45c', soil: ['#d9894a', '#c9773c', '#e39a5a'], deep: '#9e5528', rim: '#5c2e12',
    sky: ['#f08a4b', '#f7c27a', '#fde7b8'], far: '#e9b37c', near: '#d99a62', water: ['#3b9db0', '#1f6676'],
    deco: 'cactus', back: 'dunes', cloud: 'rgba(255,240,220,0.7)', stone: '#b88b62'
  },
  snow: {
    name: 'Snow', gravity: 1, wind: 1,
    top: '#f4f8fb', top2: '#d6e4ee', soil: ['#7d8ea3', '#6f8096', '#8b9bb0'], deep: '#4e5d72', rim: '#2b3444',
    sky: ['#8fb4d8', '#c9ddee', '#eef5fa'], far: '#b7c9db', near: '#9fb3c8', water: ['#4b84b0', '#26506f'],
    deco: 'pines', back: 'mountains', cloud: 'rgba(255,255,255,0.9)', stone: '#8d99a8'
  },
  moon: {
    name: 'Moon', gravity: MOON_GRAVITY, wind: MOON_WIND,
    top: '#c9c9cf', top2: '#a9a9b2', soil: ['#8d8d96', '#7f7f88', '#9a9aa3'], deep: '#5d5d66', rim: '#2e2e35',
    sky: ['#05060d', '#0d1024', '#1b1f3a'], far: '#2a2d44', near: '#3a3d55', water: ['#3a4f8f', '#1d2a55'],
    deco: 'rocks', back: 'stars', cloud: null, stone: '#9a9aa3'
  }
};
const THEME_ORDER = ['meadow', 'desert', 'snow', 'moon'];

const MAP_KINDS = {
  hills: { name: 'Hills' },
  islands: { name: 'Islands' },
  cavern: { name: 'Cavern' },
  canyon: { name: 'Canyon' }
};
const MAP_ORDER = ['hills', 'islands', 'cavern', 'canyon'];
