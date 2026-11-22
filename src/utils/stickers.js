/**
 * Original Sticker Library for RetroBooth Studio.
 * Scalable SVG stickers that render cleanly both in DOM and on HTML5 Canvas.
 */

export const STICKER_CATEGORIES = [
  { id: 'all', name: 'All Stickers' },
  { id: 'sparkles', name: 'Sparkles & Stars' },
  { id: 'cute', name: 'Cute & Hearts' },
  { id: 'retro', name: 'Retro & Stamps' },
  { id: 'doodles', name: 'Doodles & Ribbons' },
];

export const STICKER_LIBRARY = [
  // --- SPARKLES & STARS ---
  {
    id: 'sparkle-star-4',
    name: 'Glitter Sparkle',
    category: 'sparkles',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 0 C50 30 70 50 100 50 C70 50 50 70 50 100 C50 70 30 50 0 50 C30 50 50 30 50 0 Z" fill="#ffd166"/>
      <circle cx="50" cy="50" r="10" fill="#ffffff"/>
    </svg>`,
    color: '#ffd166',
  },
  {
    id: 'chubby-star',
    name: 'Cute Star',
    category: 'sparkles',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L63 35 L95 38 L71 60 L78 92 L50 75 L22 92 L29 60 L5 38 L37 35 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="40" cy="48" rx="4" ry="6" fill="#1e293b"/>
      <ellipse cx="60" cy="48" rx="4" ry="6" fill="#1e293b"/>
      <path d="M44 62 Q50 68 56 62" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`,
    color: '#facc15',
  },
  {
    id: 'twinkle-sparkle',
    name: 'Twin Sparkles',
    category: 'sparkles',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 10 C40 28 52 40 70 40 C52 40 40 52 40 70 C40 52 28 40 10 40 C28 40 40 28 40 10 Z" fill="#38bdf8"/>
      <path d="M75 55 C75 66 82 75 95 75 C82 75 75 84 75 95 C75 84 66 75 55 75 C66 75 75 66 75 55 Z" fill="#ec4899"/>
    </svg>`,
    color: '#38bdf8',
  },

  // --- CUTE & HEARTS ---
  {
    id: 'candy-heart',
    name: 'Candy Heart',
    category: 'cute',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 88 C20 65 5 45 5 28 C5 12 18 5 32 5 C42 5 48 12 50 16 C52 12 58 5 68 5 C82 5 95 12 95 28 C95 45 80 65 50 88 Z" fill="#fb7185" stroke="#f43f5e" stroke-width="4"/>
      <ellipse cx="32" cy="24" rx="8" ry="4" transform="rotate(-30 32 24)" fill="rgba(255,255,255,0.6)"/>
    </svg>`,
    color: '#fb7185',
  },
  {
    id: 'ribbon-bow',
    name: 'Pastel Bow',
    category: 'cute',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 48 C35 30 10 32 12 52 C14 68 35 60 50 54 Z" fill="#f472b6" stroke="#db2777" stroke-width="3"/>
      <path d="M50 48 C65 30 90 32 88 52 C86 68 65 60 50 54 Z" fill="#f472b6" stroke="#db2777" stroke-width="3"/>
      <circle cx="50" cy="52" r="8" fill="#fbcfe8" stroke="#db2777" stroke-width="3"/>
      <path d="M46 58 C42 75 35 88 28 92" stroke="#db2777" stroke-width="4" stroke-linecap="round"/>
      <path d="M54 58 C58 75 65 88 72 92" stroke="#db2777" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    color: '#f472b6',
  },
  {
    id: 'cherry-blossom',
    name: 'Sakura Flower',
    category: 'cute',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="28" r="16" fill="#fbcfe8"/>
      <circle cx="71" cy="43" r="16" fill="#fbcfe8"/>
      <circle cx="63" cy="68" r="16" fill="#fbcfe8"/>
      <circle cx="37" cy="68" r="16" fill="#fbcfe8"/>
      <circle cx="29" cy="43" r="16" fill="#fbcfe8"/>
      <circle cx="50" cy="50" r="12" fill="#f43f5e"/>
      <circle cx="50" cy="50" r="6" fill="#fef08a"/>
    </svg>`,
    color: '#fbcfe8',
  },
  {
    id: 'cute-cloud',
    name: 'Dreamy Cloud',
    category: 'cute',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 65 C15 65 10 55 16 45 C15 35 25 28 35 30 C42 20 60 20 68 30 C78 28 88 36 85 46 C92 54 88 65 78 65 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="3"/>
      <ellipse cx="40" cy="48" rx="3" ry="4" fill="#0369a1"/>
      <ellipse cx="60" cy="48" rx="3" ry="4" fill="#0369a1"/>
      <ellipse cx="32" cy="54" rx="4" ry="2" fill="#f472b6"/>
      <ellipse cx="68" cy="54" rx="4" ry="2" fill="#f472b6"/>
      <path d="M46 54 Q50 58 54 54" stroke="#0369a1" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`,
    color: '#e0f2fe',
  },

  // --- RETRO & STAMPS ---
  {
    id: 'film-stamp',
    name: '35mm Film Roll',
    category: 'retro',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="20" width="70" height="60" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="3"/>
      <rect x="25" y="26" width="10" height="10" rx="2" fill="#f8fafc"/>
      <rect x="45" y="26" width="10" height="10" rx="2" fill="#f8fafc"/>
      <rect x="65" y="26" width="10" height="10" rx="2" fill="#f8fafc"/>
      <rect x="25" y="64" width="10" height="10" rx="2" fill="#f8fafc"/>
      <rect x="45" y="64" width="10" height="10" rx="2" fill="#f8fafc"/>
      <rect x="65" y="64" width="10" height="10" rx="2" fill="#f8fafc"/>
      <text x="50" y="52" fill="#f59e0b" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">35MM</text>
    </svg>`,
    color: '#f59e0b',
  },
  {
    id: 'retro-smiley',
    name: 'Retro Smiley',
    category: 'retro',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="42" fill="#fde047" stroke="#1e293b" stroke-width="4"/>
      <ellipse cx="36" cy="42" rx="5" ry="8" fill="#1e293b"/>
      <ellipse cx="64" cy="42" rx="5" ry="8" fill="#1e293b"/>
      <path d="M30 60 Q50 82 70 60" stroke="#1e293b" stroke-width="5" stroke-linecap="round" fill="none"/>
    </svg>`,
    color: '#fde047',
  },
  {
    id: 'cool-planet',
    name: 'Saturn Ring',
    category: 'retro',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="28" fill="#c084fc"/>
      <ellipse cx="50" cy="50" rx="46" ry="12" transform="rotate(-20 50 50)" stroke="#f472b6" stroke-width="5" fill="none"/>
    </svg>`,
    color: '#c084fc',
  },

  // --- DOODLES & RIBBONS ---
  {
    id: 'sparkle-doodle',
    name: 'Hand Doodle',
    category: 'doodles',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 85 Q30 20 85 15 M40 40 L55 25 M30 65 L45 50 M60 30 L75 15" stroke="#ec4899" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    color: '#ec4899',
  },
  {
    id: 'angel-wings',
    name: 'Angel Wing',
    category: 'doodles',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 C30 20 60 15 85 20 C75 35 60 45 45 48 C65 52 75 65 70 80 C55 75 40 65 30 60 C25 65 20 70 15 75 C18 65 18 58 20 50 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="3" stroke-linejoin="round"/>
    </svg>`,
    color: '#ffffff',
  },
  {
    id: 'washi-tape',
    name: 'Washi Tape',
    category: 'doodles',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 38 L90 28 L86 65 L6 75 Z" fill="rgba(254, 205, 211, 0.75)" stroke="#fda4af" stroke-width="2"/>
      <path d="M20 37 L18 73 M40 34 L38 71 M60 32 L58 68 M80 29 L78 66" stroke="rgba(244,63,94,0.4)" stroke-width="2" stroke-dasharray="3 3"/>
    </svg>`,
    color: '#fda4af',
  },
];

export function getStickerById(id) {
  return STICKER_LIBRARY.find(s => s.id === id) || STICKER_LIBRARY[0];
}

// In-memory cache for rendered sticker images on canvas
const stickerImgCache = new Map();

export async function loadStickerImage(stickerDef) {
  if (!stickerDef || !stickerDef.svg) return null;
  const key = stickerDef.id || stickerDef.svg;
  if (stickerImgCache.has(key)) {
    return stickerImgCache.get(key);
  }

  return new Promise((resolve) => {
    try {
      const blob = new Blob([stickerDef.svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        stickerImgCache.set(key, img);
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch (e) {
      resolve(null);
    }
  });
}
