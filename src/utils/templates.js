import { generateCutoutSlots } from './geometry.js';

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Frames' },
  { id: 'korean', name: 'Korean Life4Cuts' },
  { id: 'retro', name: 'Retro & 35mm' },
  { id: 'y2k', name: 'Y2K & Cyber' },
  { id: 'pastel', name: 'Pastel & Cute' },
  { id: 'minimalist', name: 'Minimalist' },
];

export const PAPER_COLORS = [
  { id: 'white', name: 'Studio White', color: '#ffffff' },
  { id: 'cream', name: 'Vintage Cream', color: '#fbf8ef' },
  { id: 'pink', name: 'Pastel Rosé', color: '#ffe4e6' },
  { id: 'blue', name: 'Powder Blue', color: '#e0f2fe' },
  { id: 'lavender', name: 'Lilac Mist', color: '#f3e8ff' },
  { id: 'sage', name: 'Soft Sage', color: '#ecfdf5' },
  { id: 'noir', name: 'Matte Noir', color: '#101216' },
];

export const PAPER_PATTERNS = [
  { id: 'none', name: 'Solid Color' },
  { id: 'dots', name: 'Polka Dots' },
  { id: 'grid', name: 'Pastel Grid' },
  { id: 'grain', name: 'Film Grain' },
  { id: 'stripes', name: 'Mini Stripes' },
];

export const BUILTIN_TEMPLATES = [
  // --- 4-CUT CLASSIC STRIPS (The original user templates preserved!) ---
  {
    id: 'denim',
    name: 'Denim Club Y2K',
    subtitle: 'Golden stitch & blue jeans',
    category: 'y2k',
    slotCount: 4,
    layout: 'strip',
    src: '/templates/denim-frame.png',
    fallbackSrc: '/templates/1.png',
    baseWidth: 707,
    baseHeight: 2000,
    exportWidth: 1200,
    exportHeight: 3395,
    tag: 'Popular',
    accentColor: '#3b82f6',
    defaultPaper: '#ffffff',
    cutouts: [
      { index: 0, x: 43, y: 71, width: 621, height: 373, radius: 10 },
      { index: 1, x: 43, y: 469, width: 621, height: 373, radius: 10 },
      { index: 2, x: 43, y: 866, width: 621, height: 374, radius: 10 },
      { index: 3, x: 43, y: 1264, width: 621, height: 374, radius: 10 },
    ],
  },
  {
    id: 'purple',
    name: 'Dreamy Violet',
    subtitle: 'Pastel ribbons & stars',
    category: 'pastel',
    slotCount: 4,
    layout: 'strip',
    src: '/templates/purple-frame.png',
    fallbackSrc: '/templates/2.png',
    baseWidth: 707,
    baseHeight: 2000,
    exportWidth: 1200,
    exportHeight: 3395,
    tag: 'Trendy',
    accentColor: '#a855f7',
    defaultPaper: '#ffffff',
    cutouts: [
      { index: 0, x: 43, y: 71, width: 621, height: 373, radius: 10 },
      { index: 1, x: 43, y: 469, width: 621, height: 373, radius: 10 },
      { index: 2, x: 43, y: 866, width: 621, height: 374, radius: 10 },
      { index: 3, x: 43, y: 1264, width: 621, height: 374, radius: 10 },
    ],
  },
  {
    id: 'cottagecore',
    name: 'Cottagecore Flora',
    subtitle: 'Pressed flowers & tape',
    category: 'pastel',
    slotCount: 4,
    layout: 'strip',
    src: '/templates/cottagecore-frame.png',
    fallbackSrc: '/templates/3.png',
    baseWidth: 707,
    baseHeight: 2000,
    exportWidth: 1200,
    exportHeight: 3395,
    tag: 'Aesthetic',
    accentColor: '#10b981',
    defaultPaper: '#fbf8ef',
    cutouts: [
      { index: 0, x: 43, y: 71, width: 621, height: 373, radius: 10 },
      { index: 1, x: 43, y: 469, width: 621, height: 373, radius: 10 },
      { index: 2, x: 43, y: 866, width: 621, height: 374, radius: 10 },
      { index: 3, x: 43, y: 1264, width: 621, height: 374, radius: 10 },
    ],
  },
  {
    id: 'classic-film',
    name: '35mm Noir Life4Cuts',
    subtitle: 'Classic Korean film strip',
    category: 'retro',
    slotCount: 4,
    layout: 'strip',
    src: '/templates/classic-film.png',
    baseWidth: 1200,
    baseHeight: 3600,
    exportWidth: 1200,
    exportHeight: 3600,
    tag: 'Classic',
    accentColor: '#f59e0b',
    defaultPaper: '#0f1115',
    cutouts: [
      { index: 0, x: 120, y: 200, width: 960, height: 680, radius: 16 },
      { index: 1, x: 120, y: 950, width: 960, height: 680, radius: 16 },
      { index: 2, x: 120, y: 1700, width: 960, height: 680, radius: 16 },
      { index: 3, x: 120, y: 2450, width: 960, height: 680, radius: 16 },
    ],
  },

  // --- KOREAN LIFE4CUTS MINIMALIST 4-CUT ---
  {
    id: 'korean-minimal',
    name: 'Seoul Studio Minimal',
    subtitle: 'Clean white border & sleek spacing',
    category: 'korean',
    slotCount: 4,
    layout: 'strip',
    baseWidth: 1200,
    baseHeight: 3600,
    exportWidth: 1200,
    exportHeight: 3600,
    tag: 'Minimal',
    accentColor: '#ec4899',
    defaultPaper: '#ffffff',
    cutouts: generateCutoutSlots({ count: 4, baseWidth: 1200, baseHeight: 3600, paddingX: 90, paddingY: 140, footerHeight: 260, gap: 50, radius: 14 }),
  },

  // --- 2x2 SQUARE GRID COLLAGE (4 Photos) ---
  {
    id: 'square-grid-4',
    name: 'Instagram 2x2 Grid',
    subtitle: 'Balanced square photobooth block',
    category: 'korean',
    slotCount: 4,
    layout: 'grid',
    baseWidth: 2000,
    baseHeight: 2200,
    exportWidth: 2000,
    exportHeight: 2200,
    tag: 'Square',
    accentColor: '#6366f1',
    defaultPaper: '#ffffff',
    cutouts: generateCutoutSlots({ count: 4, baseWidth: 2000, baseHeight: 2200, layout: 'grid', paddingX: 100, paddingY: 120, footerHeight: 180, gap: 50, radius: 18 }),
  },

  // --- 1-CUT POLAROID CARD ---
  {
    id: 'polaroid-1',
    name: 'Classic 1-Cut Polaroid',
    subtitle: 'Iconic instant film card with wide chin',
    category: 'retro',
    slotCount: 1,
    layout: 'postcard',
    baseWidth: 1200,
    baseHeight: 1500,
    exportWidth: 1200,
    exportHeight: 1500,
    tag: '1-Cut',
    accentColor: '#f97316',
    defaultPaper: '#ffffff',
    cutouts: [
      { index: 0, x: 100, y: 100, width: 1000, height: 1000, radius: 12 },
    ],
  },

  // --- 2-CUT DUO STRIP ---
  {
    id: 'duo-strip-2',
    name: 'Twin Moment 2-Cut',
    subtitle: 'Double portrait strip',
    category: 'minimalist',
    slotCount: 2,
    layout: 'strip',
    baseWidth: 1200,
    baseHeight: 2400,
    exportWidth: 1200,
    exportHeight: 2400,
    tag: '2-Cut',
    accentColor: '#06b6d4',
    defaultPaper: '#ffffff',
    cutouts: generateCutoutSlots({ count: 2, baseWidth: 1200, baseHeight: 2400, paddingX: 100, paddingY: 140, footerHeight: 220, gap: 80, radius: 16 }),
  },

  // --- 3-CUT TRIPLE STRIP ---
  {
    id: 'triple-strip-3',
    name: 'Story Trio 3-Cut',
    subtitle: 'Three-scene cinematic progression',
    category: 'korean',
    slotCount: 3,
    layout: 'strip',
    baseWidth: 1200,
    baseHeight: 3000,
    exportWidth: 1200,
    exportHeight: 3000,
    tag: '3-Cut',
    accentColor: '#8b5cf6',
    defaultPaper: '#ffffff',
    cutouts: generateCutoutSlots({ count: 3, baseWidth: 1200, baseHeight: 3000, paddingX: 90, paddingY: 130, footerHeight: 240, gap: 60, radius: 16 }),
  },

  // --- 6-CUT EDITORIAL GRID (2x3 Grid) ---
  {
    id: 'editorial-6',
    name: 'Editorial 6-Cut Sheet',
    subtitle: 'Full 2x3 contact sheet postcard',
    category: 'korean',
    slotCount: 6,
    layout: 'grid',
    baseWidth: 1800,
    baseHeight: 2400,
    exportWidth: 1800,
    exportHeight: 2400,
    tag: '6-Cut',
    accentColor: '#14b8a6',
    defaultPaper: '#fbf8ef',
    cutouts: generateCutoutSlots({ count: 6, baseWidth: 1800, baseHeight: 2400, layout: 'grid', paddingX: 80, paddingY: 100, footerHeight: 180, gap: 40, radius: 14 }),
  },
];

export function getTemplateById(id, customTemplates = []) {
  if (customTemplates && Array.isArray(customTemplates)) {
    const custom = customTemplates.find(t => t.id === id);
    if (custom) return custom;
  }
  return BUILTIN_TEMPLATES.find(t => t.id === id) || BUILTIN_TEMPLATES[0];
}

export function getTemplatesForSlotCount(count, customTemplates = []) {
  const all = [...(customTemplates || []), ...BUILTIN_TEMPLATES];
  return all.filter(t => t.slotCount === count);
}
