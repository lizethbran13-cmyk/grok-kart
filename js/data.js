// Grok Kart Party - content: characters, kart parts, items, tracks, cups (all original).
export const CHARS = [
  { id: 'grok', n: 'Grok', d: 'The speedy arcade robot', w: 'medium', col: '#3ff0ff', col2: '#1c2a44', price: 0, kind: 'robot', stat: { spd: 3, acc: 3, han: 3, wt: 3 } },
  { id: 'martina', n: 'Martina', d: 'Turtle with a turbo shell', w: 'heavy', col: '#4ade80', col2: '#a16207', price: 0, kind: 'turtle', stat: { spd: 4, acc: 2, han: 2, wt: 4 } },
  { id: 'chinchino', n: 'Chinchino', d: 'Fluffiest racer around', w: 'light', col: '#d6d3d1', col2: '#f9a8d4', price: 0, kind: 'chinchilla', stat: { spd: 2, acc: 4, han: 4, wt: 1 } },
  { id: 'blaze', n: 'Blaze', d: 'Tiny dragon, big attitude', w: 'medium', col: '#ef4444', col2: '#fbbf24', price: 0, kind: 'dragon', stat: { spd: 3, acc: 3, han: 3, wt: 3 } },
  { id: 'pip', n: 'Pip', d: 'Penguin who loves ice tracks', w: 'light', col: '#1e293b', col2: '#fb923c', price: 60, kind: 'penguin', stat: { spd: 2, acc: 4, han: 4, wt: 2 } },
  { id: 'dina', n: 'Dina', d: 'Dino with a heavy foot', w: 'heavy', col: '#a3e635', col2: '#fde047', price: 80, kind: 'dino', stat: { spd: 4, acc: 2, han: 2, wt: 5 } },
  { id: 'nova', n: 'Nova', d: 'Space cadet in a bubble helmet', w: 'medium', col: '#f8fafc', col2: '#8b5cf6', price: 100, kind: 'astro', stat: { spd: 3, acc: 3, han: 4, wt: 2 } },
  { id: 'boo', n: 'Boolin', d: 'A giggly little ghost', w: 'light', col: '#e0e7ff', col2: '#818cf8', price: 120, kind: 'ghost', stat: { spd: 3, acc: 4, han: 3, wt: 1 } },
  { id: 'cocoa', n: 'Cocoa', d: 'Bunny with lightning hops', w: 'light', col: '#a16207', col2: '#fda4af', price: 90, kind: 'bunny', stat: { spd: 2, acc: 5, han: 3, wt: 2 } },
  { id: 'bolt', n: 'Captain Bolt', d: 'Retired stunt racer', w: 'heavy', col: '#2563eb', col2: '#facc15', price: 150, kind: 'captain', stat: { spd: 5, acc: 2, han: 2, wt: 4 } },
  // Super Kart Expansion (DLC): the Ratita crew + Candy
  { id: 'luna', n: 'Luna', d: 'Ratita Industries star scientist', w: 'light', col: '#a9afbd', col2: '#7d8394', price: 0, dlc: 1, kind: 'rat', rat: 'luna', stat: { spd: 3, acc: 4, han: 4, wt: 1 } },
  { id: 'pirat', n: 'Pi-rat', d: 'Captain of the high-speed seas', w: 'medium', col: '#c99a6b', col2: '#9c7148', price: 0, dlc: 1, kind: 'rat', rat: 'pirat', stat: { spd: 4, acc: 3, han: 3, wt: 3 } },
  { id: 'snowie', n: 'Snowie', d: 'Snow-white rat, ice-cold drifts', w: 'light', col: '#fbfbff', col2: '#e3e1ee', price: 0, dlc: 1, kind: 'rat', rat: 'snowie', stat: { spd: 2, acc: 5, han: 4, wt: 1 } },
  { id: 'candy', n: 'Candy', d: 'Schnauzer with zoomies', w: 'heavy', col: '#8a8d96', col2: '#e8e8ec', price: 0, dlc: 1, kind: 'schnauzer', stat: { spd: 5, acc: 2, han: 3, wt: 4 } },
];
export const BODIES = [
  { id: 'classic', n: 'Classic', price: 0, stat: { spd: 0, acc: 0, han: 0, wt: 0 } },
  { id: 'bubble', n: 'Bubble Buggy', price: 0, stat: { spd: -1, acc: 1, han: 1, wt: -1 } },
  { id: 'rocket', n: 'Rocket Racer', price: 50, stat: { spd: 1, acc: -1, han: 0, wt: 0 } },
  { id: 'monster', n: 'Mud Monster', price: 70, stat: { spd: 0, acc: 0, han: -1, wt: 2 } },
  { id: 'wedge', n: 'Neon Wedge', price: 90, stat: { spd: 1, acc: 0, han: 1, wt: -1 } },
  { id: 'tub', n: 'Bathtub Blaster', price: 120, stat: { spd: -1, acc: 2, han: 0, wt: 1 } },
];
export const WHEELS = [
  { id: 'std', n: 'Standard', price: 0, stat: { spd: 0, acc: 0, han: 0, wt: 0 } },
  { id: 'slick', n: 'Slicks', price: 0, stat: { spd: 1, acc: 0, han: -1, wt: 0 } },
  { id: 'big', n: 'Chunky', price: 40, stat: { spd: 0, acc: -1, han: 0, wt: 1 } },
  { id: 'star', n: 'Star Rims', price: 60, stat: { spd: 0, acc: 1, han: 1, wt: -1 } },
  { id: 'neon', n: 'Neon Glow', price: 80, stat: { spd: 1, acc: 1, han: 0, wt: -1 } },
];
export const GLIDERS = [
  { id: 'chute', n: 'Party Chute', price: 0 },
  { id: 'wing', n: 'Jet Wing', price: 30 },
  { id: 'kite', n: 'Kite', price: 40 },
  { id: 'umbrella', n: 'Brolly', price: 50 },
  { id: 'leaf', n: 'Big Leaf', price: 60 },
];
export const PAINTS = ['#ff3b5c', '#ff8a1f', '#ffd60a', '#2ee86d', '#19c3ff', '#5b6cff', '#b04dff', '#ff4fd8', '#f5f5f5', '#222831', '#00d1b2', '#c9a227'];

export const ITEMS = {
  turbo: { n: 'Turbo Pop', ic: '🚀', d: 'Instant speed boost' },
  turbo3: { n: 'Triple Turbo', ic: '🚀', d: 'Three boosts in a row' },
  slime: { n: 'Slime Blob', ic: '🟢', d: 'Drop behind you, karts spin out' },
  puck: { n: 'Bounce Puck', ic: '💿', d: 'Fires straight and bounces off walls' },
  seeker: { n: 'Seeker Puck', ic: '🎯', d: 'Hunts the racer in front of you' },
  boom: { n: 'Boom Box', ic: '📻', d: 'Throw it ahead, it explodes' },
  shield: { n: 'Bubble Shield', ic: '🫧', d: 'Blocks one hit' },
  zap: { n: 'Shrink Zap', ic: '⚡', d: 'Shrinks every racer ahead of you' },
  splat: { n: 'Splat Cloud', ic: '🦑', d: 'Paint-splats racers ahead' },
  nova: { n: 'Super Nova', ic: '🌟', d: 'Unstoppable + faster for 7s' },
  magnet: { n: 'Coin Magnet', ic: '🧲', d: 'Pulls in coins and +3 coins' },
};
export const ITEM_IDS = Object.keys(ITEMS);
// odds by rank bucket (0 = leading ... 3 = far back)
export const ITEM_ODDS = [
  { slime: 30, puck: 26, boom: 10, magnet: 18, shield: 10, turbo: 6 },
  { slime: 14, puck: 18, seeker: 14, turbo: 18, boom: 10, shield: 10, magnet: 8, splat: 8 },
  { turbo: 20, turbo3: 16, seeker: 18, splat: 10, shield: 8, puck: 8, zap: 6, nova: 8, boom: 6 },
  { turbo3: 28, nova: 22, zap: 14, seeker: 16, turbo: 12, splat: 8 },
];
export const BATTLE_ODDS = { puck: 26, seeker: 14, slime: 16, boom: 14, shield: 10, turbo: 10, nova: 5, magnet: 5 };

export const DIFF = {
  easy: { n: 'Easy', spd: 0.86, skill: 0.55, items: 0.5, rubber: 0.06 },
  normal: { n: 'Normal', spd: 0.94, skill: 0.8, items: 0.8, rubber: 0.09 },
  hard: { n: 'Hard', spd: 1.0, skill: 1.0, items: 1.0, rubber: 0.1 },
};

/* Tracks. pts = closed loop control points [x, z, y]. Features are placed by u = fraction of lap. */
export const TRACKS = [
  { id: 'city', n: 'Grok City Circuit', cup: 0, theme: 'city', width: 17, laps: 3, scale: 1.25,
    pts: [[0,0,0],[90,0,0],[160,-6,0],[205,20,0],[215,70,0],[190,110,0],[150,118,0],[118,100,0],[90,108,0],[78,140,2],[60,180,6],[20,200,6],[-50,200,4],[-110,185,0],[-150,150,0],[-160,95,0],[-140,45,0],[-80,10,0]],
    boosts: [{ u: 0.06, off: -0.4 }, { u: 0.06, off: 0.4 }, { u: 0.36, off: 0 }, { u: 0.71, off: -0.3 }],
    ramps: [{ u: 0.52, off: 0, w: 0.5 }], items: [0.13, 0.42, 0.66, 0.89], coins: [{ u: 0.2, off: 0.5, n: 6 }, { u: 0.58, off: -0.5, n: 6 }, { u: 0.8, off: 0, n: 5 }],
    hazards: [{ type: 'car', u: 0.27 }, { type: 'car', u: 0.76 }, { type: 'cones', u: 0.47 }],
    shortcuts: [{ u0: 0.79, u1: 0.87, bulge: 0, boost: true }] },
  { id: 'canyon', n: 'Canyon Rush', cup: 0, theme: 'desert', width: 16, laps: 3, scale: 1.3,
    pts: [[0,0,0],[80,-10,4],[150,-40,10],[200,-20,14],[220,30,14],[200,80,10],[150,95,6],[110,130,3],[120,180,3],[90,220,8],[30,230,14],[-30,210,14],[-60,170,8],[-50,120,4],[-90,90,2],[-130,60,2],[-120,20,0],[-60,5,0]],
    boosts: [{ u: 0.15, off: 0 }, { u: 0.61, off: -0.3 }], glide: [{ u: 0.33 }], gaps: [[0.345, 0.405]],
    ramps: [{ u: 0.77, off: 0.3, w: 0.4 }], items: [0.08, 0.28, 0.5, 0.72, 0.9], coins: [{ u: 0.2, off: -0.5, n: 6 }, { u: 0.55, off: 0.3, n: 6 }],
    hazards: [{ type: 'boulder', u: 0.47 }, { type: 'boulder', u: 0.84 }, { type: 'cactus', u: 0.12, off: 0.55 }, { type: 'cactus', u: 0.65, off: -0.55 }],
    shortcuts: [{ u0: 0.86, u1: 0.95, bulge: -8, boost: true }] },
  { id: 'candy', n: 'Candy Coaster', cup: 0, theme: 'candy', width: 16, laps: 3, scale: 1.2,
    pts: [[0,0,0],[70,-5,8],[130,10,22],[170,50,26],[170,100,18],[130,130,8],[80,120,4],[40,140,12],[30,190,22],[-20,215,26],[-80,200,18],[-120,160,8],[-125,110,4],[-90,80,10],[-110,40,6],[-70,10,2]],
    boosts: [{ u: 0.05, off: 0 }, { u: 0.3, off: 0.4 }, { u: 0.3, off: -0.4 }, { u: 0.56, off: 0 }, { u: 0.82, off: 0.3 }],
    ramps: [{ u: 0.44, off: 0, w: 0.6 }, { u: 0.92, off: -0.3, w: 0.45 }], items: [0.12, 0.36, 0.6, 0.86], coins: [{ u: 0.18, off: 0, n: 7 }, { u: 0.66, off: 0.4, n: 6 }],
    hazards: [{ type: 'gumdrop', u: 0.22, off: -0.3 }, { type: 'gumdrop', u: 0.24, off: 0.35 }, { type: 'sweeper', u: 0.72 }, { type: 'gumdrop', u: 0.5, off: 0.2 }],
    shortcuts: [{ u0: 0.68, u1: 0.75, bulge: 6, boost: true }] },
  { id: 'beach', n: 'Breezy Beach', cup: 0, theme: 'beach', width: 17, laps: 3, scale: 1.25,
    pts: [[0,0,0],[100,0,0],[170,20,0],[200,70,1],[180,120,2],[120,140,2],[60,120,0],[10,140,0],[-20,190,3],[-80,200,4],[-130,170,2],[-150,120,0],[-160,60,0],[-120,15,0],[-60,0,0]],
    boosts: [{ u: 0.08, off: 0 }, { u: 0.5, off: 0.35 }], glide: [], ramps: [{ u: 0.28, off: 0, w: 0.55 }, { u: 0.63, off: 0.25, w: 0.4 }],
    items: [0.15, 0.38, 0.58, 0.82], coins: [{ u: 0.22, off: 0.4, n: 6 }, { u: 0.7, off: -0.4, n: 7 }],
    hazards: [{ type: 'crab', u: 0.18 }, { type: 'crab', u: 0.45 }, { type: 'crab', u: 0.78 }, { type: 'ball', u: 0.9 }],
    shortcuts: [{ u0: 0.38, u1: 0.47, bulge: 6, boost: true }] },
  { id: 'castle', n: 'Spooky Castle', cup: 1, theme: 'haunted', width: 15, laps: 3, scale: 1.2,
    pts: [[0,0,0],[80,0,0],[130,20,0],[140,70,4],[110,100,8],[60,95,8],[30,120,8],[40,170,12],[90,190,12],[110,230,8],[60,260,4],[-10,250,2],[-60,210,2],[-80,150,0],[-120,110,0],[-110,50,0],[-60,15,0]],
    boosts: [{ u: 0.04, off: 0 }, { u: 0.46, off: 0 }, { u: 0.74, off: 0.35 }], ramps: [{ u: 0.6, off: 0, w: 0.5 }],
    items: [0.1, 0.32, 0.55, 0.8], coins: [{ u: 0.16, off: 0, n: 6 }, { u: 0.68, off: -0.4, n: 6 }],
    hazards: [{ type: 'ghost', u: 0.22 }, { type: 'ghost', u: 0.39 }, { type: 'ghost', u: 0.86 }, { type: 'sweeper', u: 0.5 }],
    shortcuts: [{ u0: 0.88, u1: 0.96, bulge: -4, boost: true }] },
  { id: 'frost', n: 'Frosty Peaks', cup: 1, theme: 'snow', width: 16, laps: 3, scale: 1.3,
    pts: [[0,0,0],[80,-10,6],[150,0,14],[195,40,20],[200,95,24],[160,130,24],[110,120,18],[70,150,12],[60,200,8],[0,225,4],[-60,205,2],[-90,160,2],[-140,130,6],[-160,80,8],[-130,30,4],[-70,5,1]],
    boosts: [{ u: 0.1, off: 0.3 }, { u: 0.55, off: 0 }, { u: 0.86, off: -0.3 }], glide: [{ u: 0.4 }], gaps: [[0.415, 0.465]],
    ramps: [{ u: 0.66, off: 0, w: 0.55 }], items: [0.07, 0.27, 0.52, 0.74, 0.93], coins: [{ u: 0.18, off: -0.3, n: 6 }, { u: 0.6, off: 0.4, n: 6 }],
    hazards: [{ type: 'snowball', u: 0.22 }, { type: 'snowball', u: 0.79 }, { type: 'snowman', u: 0.32, off: 0.5 }, { type: 'snowman', u: 0.7, off: -0.5 }],
    shortcuts: [{ u0: 0.62, u1: 0.7, bulge: 5, boost: true }] },
  { id: 'lava', n: 'Lava Loop', cup: 1, theme: 'volcano', width: 16, laps: 3, scale: 1.25,
    pts: [[0,0,4],[80,-15,8],[150,-5,12],[190,40,14],[180,95,12],[140,115,10],[100,95,8],[60,110,8],[50,160,12],[80,205,16],[40,240,18],[-30,235,14],[-80,195,10],[-100,140,8],[-140,100,6],[-130,40,4],[-70,8,3]],
    boosts: [{ u: 0.06, off: 0 }, { u: 0.44, off: -0.3 }, { u: 0.8, off: 0.3 }], glide: [{ u: 0.58 }], voids: [[0.24, 0.31]], gaps: [[0.595, 0.655]],
    ramps: [{ u: 0.16, off: 0.25, w: 0.45 }], items: [0.11, 0.35, 0.5, 0.72, 0.9], coins: [{ u: 0.2, off: 0, n: 6 }, { u: 0.76, off: -0.4, n: 6 }],
    hazards: [{ type: 'geyser', u: 0.38, off: -0.35 }, { type: 'geyser', u: 0.41, off: 0.35 }, { type: 'geyser', u: 0.86, off: 0 }, { type: 'boulder', u: 0.95 }],
    shortcuts: [] },
  { id: 'space', n: 'Cosmic Highway', cup: 1, theme: 'space', width: 15, laps: 3, scale: 1.3,
    pts: [[0,0,10],[80,0,14],[140,25,22],[160,80,28],[130,125,30],[80,120,24],[50,145,18],[60,195,22],[20,235,30],[-40,230,34],[-90,195,30],[-100,140,22],[-140,110,16],[-150,60,14],[-110,15,12],[-50,0,10]],
    boosts: [{ u: 0.05, off: 0 }, { u: 0.22, off: 0.4 }, { u: 0.22, off: -0.4 }, { u: 0.5, off: 0 }, { u: 0.77, off: 0 }], glide: [{ u: 0.34 }], voids: [[0, 1]], gaps: [[0.355, 0.405]],
    ramps: [{ u: 0.62, off: 0, w: 0.5 }], items: [0.1, 0.3, 0.46, 0.68, 0.88], coins: [{ u: 0.15, off: 0, n: 7 }, { u: 0.55, off: 0.3, n: 6 }],
    hazards: [{ type: 'ufo', u: 0.27 }, { type: 'ufo', u: 0.72 }, { type: 'sweeper', u: 0.92 }],
    shortcuts: [] },
  // ---- Super Kart Expansion (DLC) ----
  { id: 'ratlab', n: 'Ratita Labs Raceway', cup: 2, dlc: 1, theme: 'lab', width: 16, laps: 3, scale: 1.25,
    pts: [[0,0,2],[70,0,2],[130,-15,4],[175,-50,8],[230,-45,12],[255,0,14],[240,50,14],[200,70,12],[170,110,10],[200,150,10],[190,195,12],[140,215,14],[90,190,12],[60,145,8],[20,165,6],[-20,205,8],[-75,205,10],[-110,165,8],[-100,115,6],[-140,80,4],[-150,35,4],[-100,5,2]],
    boosts: [{ u: 0.05, off: 0 }, { u: 0.24, off: 0.35 }, { u: 0.24, off: -0.35 }, { u: 0.5, off: 0 }, { u: 0.79, off: -0.3 }], glide: [{ u: 0.6 }], gaps: [[0.615, 0.665]],
    ramps: [{ u: 0.36, off: 0, w: 0.55 }, { u: 0.9, off: 0.3, w: 0.4 }], items: [0.1, 0.3, 0.46, 0.7, 0.88], coins: [{ u: 0.16, off: 0, n: 7 }, { u: 0.55, off: -0.4, n: 6 }, { u: 0.74, off: 0.35, n: 6 }],
    hazards: [{ type: 'robot', u: 0.2 }, { type: 'sweeper', u: 0.42 }, { type: 'robot', u: 0.72 }, { type: 'cheese', u: 0.84, off: -0.45 }, { type: 'cheese', u: 0.85, off: 0.45 }],
    shortcuts: [{ u0: 0.4, u1: 0.48, bulge: 0, boost: true }] },
  { id: 'garden', n: "Torty's Garden Grand Prix", cup: 2, dlc: 1, theme: 'garden', width: 17, laps: 3, scale: 1.25,
    pts: [[0,0,0],[80,0,0],[150,10,2],[200,45,4],[205,95,6],[165,125,4],[120,110,2],[85,130,2],[90,175,4],[130,195,6],[140,240,8],[95,270,8],[30,260,6],[-20,230,4],[-30,180,2],[-80,160,2],[-130,180,4],[-175,150,4],[-180,90,2],[-140,40,0],[-75,10,0]],
    boosts: [{ u: 0.07, off: 0 }, { u: 0.33, off: -0.35 }, { u: 0.56, off: 0.35 }, { u: 0.86, off: 0 }], glide: [],
    ramps: [{ u: 0.18, off: 0, w: 0.55 }, { u: 0.47, off: -0.25, w: 0.45 }, { u: 0.72, off: 0.25, w: 0.45 }], items: [0.12, 0.36, 0.6, 0.83], coins: [{ u: 0.22, off: 0.4, n: 7 }, { u: 0.5, off: 0, n: 6 }, { u: 0.78, off: -0.4, n: 6 }],
    hazards: [{ type: 'snail', u: 0.26 }, { type: 'tomato', u: 0.42 }, { type: 'snail', u: 0.64 }, { type: 'tomato', u: 0.92 }, { type: 'pot', u: 0.55, off: 0.5 }, { type: 'pot', u: 0.15, off: -0.5 }],
    shortcuts: [{ u0: 0.77, u1: 0.85, bulge: 0, boost: true }] },
];
export const CUPS = [
  { id: 'sunny', n: 'Sunny Cup', ic: '🌞', tracks: ['city', 'canyon', 'candy', 'beach'] },
  { id: 'star', n: 'Star Cup', ic: '⭐', tracks: ['castle', 'frost', 'lava', 'space'] },
  { id: 'ratita', n: 'Ratita Cup', ic: '🐀', dlc: 1, tracks: ['ratlab', 'city', 'garden', 'space'] },
];
export const ARENAS = [
  { id: 'plaza', n: 'Block Party Plaza', theme: 'city', size: 70, shape: 'square', obstacles: [[0, 0, 9], [-35, -35, 5], [35, -35, 5], [-35, 35, 5], [35, 35, 5]], ramps: [[0, -24, 0], [0, 24, Math.PI]] },
  { id: 'crater', n: 'Moon Crater', theme: 'space', size: 66, shape: 'round', obstacles: [[0, 0, 7], [-30, 10, 4], [28, -14, 4], [6, 34, 4]], ramps: [[-22, -22, 0.8], [22, 22, 3.9]] },
];
export const GP_POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
export const RACERS = 8;
export const trackById = (id) => TRACKS.find((t) => t.id === id);
export const charById = (id) => CHARS.find((c) => c.id === id) || CHARS[0];

// ---- DLC gate: Super Kart Expansion (bought in the Grok Arcade DLC Shop). Online guests borrow the host's copy.
export const DLC_KEY = 'grokDLC.kart.super_kart_expansion';
export const DLC = { hostShare: false, owned() { try { if (localStorage.getItem(DLC_KEY)) return true; const l = JSON.parse(localStorage.getItem('grokDLC.owned') || '[]'); if (Array.isArray(l) && l.includes(DLC_KEY)) return true; } catch (e) {} return false; },
  ok() { return DLC.owned() || DLC.hostShare; } };
export const isDlc = (x) => !!(x && x.dlc);
