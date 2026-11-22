/**
 * Expanded & Categorized Photobooth Aesthetic Filters for RetroBooth Studio.
 * Supports intensity blending (0% to 100%) and photo image adjustments.
 */

export const FILTER_CATEGORIES = [
  { id: 'film', name: 'Film & Analog' },
  { id: 'aesthetic', name: 'Aesthetic & Pastel' },
  { id: 'classic', name: 'Classic Monochrome' },
  { id: 'creative', name: 'Creative & Y2K' },
];

export const FILTERS = [
  // --- DEFAULT ---
  {
    id: 'normal',
    name: 'Normal',
    label: 'Natural',
    category: 'film',
    cssFilter: 'none',
    tintColor: null,
    baseParams: { brightness: 1.0, contrast: 1.0, saturate: 1.0, sepia: 0, hueRotate: 0, grayscale: 0 },
    description: 'Clean, unaltered true-to-life tones',
    previewGradient: 'from-slate-400 to-slate-200',
  },

  // --- FILM & ANALOG ---
  {
    id: 'warm-analog',
    name: 'Warm Analog',
    label: 'Kodak 35mm',
    category: 'film',
    baseParams: { brightness: 1.04, contrast: 1.08, saturate: 1.18, sepia: 0.18, hueRotate: -4, grayscale: 0 },
    tintColor: 'rgba(255, 210, 160, 0.12)',
    description: 'Warm analog film with rich golden undertones',
    previewGradient: 'from-amber-500 to-orange-300',
  },
  {
    id: 'natural-film',
    name: 'Natural Film',
    label: 'Fuji 400H',
    category: 'film',
    baseParams: { brightness: 1.03, contrast: 1.04, saturate: 1.1, sepia: 0.08, hueRotate: 6, grayscale: 0 },
    tintColor: 'rgba(200, 240, 230, 0.08)',
    description: 'Crisp, natural daylight tones with subtle green cast',
    previewGradient: 'from-emerald-400 to-teal-200',
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    label: '1970s Film',
    category: 'film',
    baseParams: { brightness: 0.96, contrast: 1.12, saturate: 1.15, sepia: 0.35, hueRotate: -8, grayscale: 0 },
    tintColor: 'rgba(220, 160, 90, 0.14)',
    description: 'Classic 70s look with lifted blacks and warm glow',
    previewGradient: 'from-yellow-600 to-amber-300',
  },
  {
    id: 'faded-film',
    name: 'Faded Film',
    label: 'Faded Cine',
    category: 'film',
    baseParams: { brightness: 1.08, contrast: 0.92, saturate: 0.88, sepia: 0.12, hueRotate: 0, grayscale: 0 },
    tintColor: 'rgba(240, 230, 220, 0.12)',
    description: 'Muted, dreamy cinematic fade with soft contrast',
    previewGradient: 'from-stone-400 to-stone-200',
  },
  {
    id: 'disposable-camera',
    name: 'Disposable 90s',
    label: 'QuickSnap',
    category: 'film',
    baseParams: { brightness: 1.1, contrast: 1.2, saturate: 1.25, sepia: 0.1, hueRotate: -12, grayscale: 0 },
    tintColor: 'rgba(255, 190, 120, 0.15)',
    description: 'High flash pop and saturated 90s disposable look',
    previewGradient: 'from-rose-500 to-amber-300',
  },
  {
    id: 'instant-camera',
    name: 'Instant Polaroid',
    label: 'SX-70',
    category: 'film',
    baseParams: { brightness: 1.05, contrast: 1.05, saturate: 1.08, sepia: 0.22, hueRotate: 4, grayscale: 0 },
    tintColor: 'rgba(245, 235, 200, 0.16)',
    description: 'Nostalgic instant print with warm cream shadows',
    previewGradient: 'from-orange-300 to-rose-200',
  },

  // --- AESTHETIC & PASTEL ---
  {
    id: 'soft-pink',
    name: 'Soft Pink',
    label: 'Rosy Pink',
    category: 'aesthetic',
    baseParams: { brightness: 1.06, contrast: 1.02, saturate: 1.15, sepia: 0.14, hueRotate: -10, grayscale: 0 },
    tintColor: 'rgba(255, 182, 193, 0.14)',
    description: 'Soft romantic rosy pastel tint & lifted highlights',
    previewGradient: 'from-pink-400 to-rose-300',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    label: 'Lilac Dream',
    category: 'aesthetic',
    baseParams: { brightness: 1.05, contrast: 1.04, saturate: 1.12, sepia: 0.08, hueRotate: -25, grayscale: 0 },
    tintColor: 'rgba(230, 200, 255, 0.15)',
    description: 'Ethereal lavender hues and gentle violet highlights',
    previewGradient: 'from-purple-400 to-indigo-200',
  },
  {
    id: 'dreamy-warmth',
    name: 'Dreamy Warmth',
    label: 'Golden Hour',
    category: 'aesthetic',
    baseParams: { brightness: 1.07, contrast: 1.02, saturate: 1.22, sepia: 0.22, hueRotate: 8, grayscale: 0 },
    tintColor: 'rgba(255, 200, 100, 0.14)',
    description: 'Sunset golden-hour glow with creamy highlights',
    previewGradient: 'from-orange-400 to-amber-200',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    label: 'Soft Pastel',
    category: 'aesthetic',
    baseParams: { brightness: 1.08, contrast: 0.95, saturate: 1.15, sepia: 0.05, hueRotate: 5, grayscale: 0 },
    tintColor: 'rgba(255, 240, 230, 0.12)',
    description: 'High-key, low-contrast sweet pastel tones',
    previewGradient: 'from-pink-300 to-sky-200',
  },
  {
    id: 'creamy',
    name: 'Creamy',
    label: 'Buttercream',
    category: 'aesthetic',
    baseParams: { brightness: 1.06, contrast: 0.98, saturate: 1.05, sepia: 0.2, hueRotate: 12, grayscale: 0 },
    tintColor: 'rgba(255, 250, 220, 0.16)',
    description: 'Warm buttercream highlights with soft beige shadows',
    previewGradient: 'from-amber-200 to-yellow-100',
  },
  {
    id: 'muted-tones',
    name: 'Muted Tones',
    label: 'Moody Muted',
    category: 'aesthetic',
    baseParams: { brightness: 0.98, contrast: 1.06, saturate: 0.78, sepia: 0.12, hueRotate: -5, grayscale: 0 },
    tintColor: 'rgba(180, 185, 190, 0.1)',
    description: 'Sophisticated de-saturated tones with clean shadows',
    previewGradient: 'from-slate-500 to-zinc-400',
  },

  // --- CLASSIC MONOCHROME ---
  {
    id: 'bw',
    name: 'Black & White',
    label: 'Classic Noir',
    category: 'classic',
    baseParams: { brightness: 1.02, contrast: 1.25, saturate: 0, sepia: 0, hueRotate: 0, grayscale: 1 },
    tintColor: null,
    description: 'Crisp, timeless high-contrast photobooth monochrome',
    previewGradient: 'from-neutral-900 to-neutral-200',
  },
  {
    id: 'high-contrast-bw',
    name: 'Silver Contrast',
    label: 'Silver Gelatin',
    category: 'classic',
    baseParams: { brightness: 1.05, contrast: 1.45, saturate: 0, sepia: 0, hueRotate: 0, grayscale: 1 },
    tintColor: null,
    description: 'Deep inky blacks and brilliant silver highlights',
    previewGradient: 'from-black to-white',
  },
  {
    id: 'sepia',
    name: 'Vintage Sepia',
    label: '1920s Sepia',
    category: 'classic',
    baseParams: { brightness: 0.96, contrast: 1.15, saturate: 1.18, sepia: 0.75, hueRotate: 0, grayscale: 0 },
    tintColor: 'rgba(210, 160, 90, 0.16)',
    description: 'Warm antique monochrome with amber tinting',
    previewGradient: 'from-amber-800 to-yellow-600',
  },
  {
    id: 'cool-monochrome',
    name: 'Cool Slate',
    label: 'Cyanotype',
    category: 'classic',
    baseParams: { brightness: 1.02, contrast: 1.18, saturate: 0.25, sepia: 0.1, hueRotate: 180, grayscale: 0.8 },
    tintColor: 'rgba(180, 210, 240, 0.15)',
    description: 'Chilly slate blue monochrome with modern edge',
    previewGradient: 'from-slate-800 to-sky-300',
  },

  // --- CREATIVE & Y2K ---
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    label: 'Neon Violet',
    category: 'creative',
    baseParams: { brightness: 1.05, contrast: 1.22, saturate: 1.35, sepia: 0, hueRotate: 265, grayscale: 0 },
    tintColor: 'rgba(168, 85, 247, 0.15)',
    description: 'Electrifying Y2K cyber neon with magenta shadows',
    previewGradient: 'from-purple-600 to-fuchsia-400',
  },
  {
    id: 'neon-pop',
    name: 'Neon Pop',
    label: 'Vivid Cyber',
    category: 'creative',
    baseParams: { brightness: 1.1, contrast: 1.3, saturate: 1.5, sepia: 0, hueRotate: 45, grayscale: 0 },
    tintColor: 'rgba(244, 63, 94, 0.15)',
    description: 'Super-saturated candy colors and bold punchy contrast',
    previewGradient: 'from-pink-500 to-yellow-400',
  },
  {
    id: 'retro-y2k',
    name: 'Retro Y2K',
    label: 'Year 2000',
    category: 'creative',
    baseParams: { brightness: 1.08, contrast: 1.18, saturate: 1.28, sepia: 0.1, hueRotate: 190, grayscale: 0 },
    tintColor: 'rgba(56, 189, 248, 0.16)',
    description: 'Cyan highlights and Millennium pop culture aesthetic',
    previewGradient: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'dreamy-glow',
    name: 'Dreamy Glow',
    label: 'Glow Bloom',
    category: 'creative',
    baseParams: { brightness: 1.12, contrast: 0.95, saturate: 1.2, sepia: 0.15, hueRotate: -15, grayscale: 0 },
    tintColor: 'rgba(255, 220, 240, 0.18)',
    description: 'Soft diffusion bloom and glowing pastel aura',
    previewGradient: 'from-pink-300 to-purple-300',
  },
];

export function getFilterById(id) {
  return FILTERS.find(f => f.id === id) || FILTERS[0];
}

/**
 * Builds CSS filter string combining preset filter (scaled by intensity)
 * with user manual image adjustments.
 *
 * @param {string} filterId
 * @param {number} intensity - 0 to 100 (default 100)
 * @param {object} adjustments - manual sliders:
 *   brightness (-100 to 100, 0 is default)
 *   contrast (-100 to 100, 0 is default)
 *   saturation (-100 to 100, 0 is default)
 *   exposure (-100 to 100, 0 is default)
 *   temperature (-100 to 100, warm vs cool)
 *   tint (-100 to 100, magenta vs green)
 *   blur (0 to 10px, 0 is default)
 */
export function buildComposedFilterString(filterId = 'normal', intensity = 100, adjustments = {}) {
  const filter = getFilterById(filterId);
  const factor = Math.max(0, Math.min(100, intensity ?? 100)) / 100;

  // Base preset parameters interpolated with neutral (1.0 / 0)
  const bp = filter.baseParams || { brightness: 1, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0, grayscale: 0 };
  const filterBrightness = 1 + (bp.brightness - 1) * factor;
  const filterContrast = 1 + (bp.contrast - 1) * factor;
  const filterSaturate = 1 + (bp.saturate - 1) * factor;
  const filterSepia = bp.sepia * factor;
  const filterHueRotate = bp.hueRotate * factor;
  const filterGrayscale = bp.grayscale * factor;

  // User manual adjustments
  const adjBrightness = 1 + (adjustments.brightness || 0) / 100 + (adjustments.exposure || 0) / 100;
  const adjContrast = 1 + (adjustments.contrast || 0) / 100;
  const adjSaturate = 1 + (adjustments.saturation || 0) / 100;
  const adjHue = ((adjustments.temperature || 0) * 0.2) + ((adjustments.tint || 0) * 0.3);
  const adjBlur = Math.max(0, adjustments.blur || 0);

  // Final multiplied values
  const finalBrightness = Math.max(0.1, filterBrightness * adjBrightness);
  const finalContrast = Math.max(0.1, filterContrast * adjContrast);
  const finalSaturate = Math.max(0, filterSaturate * adjSaturate);
  const finalHue = filterHueRotate + adjHue;
  const finalSepia = Math.min(1, filterSepia + ((adjustments.temperature || 0) > 0 ? (adjustments.temperature / 300) : 0));

  const parts = [];
  if (Math.abs(finalBrightness - 1) > 0.01) parts.push(`brightness(${finalBrightness.toFixed(2)})`);
  if (Math.abs(finalContrast - 1) > 0.01) parts.push(`contrast(${finalContrast.toFixed(2)})`);
  if (Math.abs(finalSaturate - 1) > 0.01) parts.push(`saturate(${finalSaturate.toFixed(2)})`);
  if (finalSepia > 0.01) parts.push(`sepia(${finalSepia.toFixed(2)})`);
  if (filterGrayscale > 0.01) parts.push(`grayscale(${filterGrayscale.toFixed(2)})`);
  if (Math.abs(finalHue) > 0.5) parts.push(`hue-rotate(${Math.round(finalHue)}deg)`);
  if (adjBlur > 0.1) parts.push(`blur(${adjBlur.toFixed(1)}px)`);

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Returns tint color for the filter scaled by intensity.
 */
export function getInterpolatedTintColor(filterId, intensity = 100) {
  const filter = getFilterById(filterId);
  if (!filter || !filter.tintColor) return null;
  const factor = Math.max(0, Math.min(100, intensity ?? 100)) / 100;
  if (factor <= 0.05) return null;

  // Extract rgba
  const m = filter.tintColor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/);
  if (m) {
    const r = m[1], g = m[2], b = m[3], a = parseFloat(m[4]) * factor;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return filter.tintColor;
}
