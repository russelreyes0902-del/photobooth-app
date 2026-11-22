/**
 * Unified Filter Engine for RetroBooth Studio.
 * Standardizes normalized photographic filter parameters across:
 * - Viewfinder Live Preview
 * - Captured Photographs
 * - Photo Review Screen
 * - Studio Editor
 * - Photo Strip Canvas
 * - PNG / JPG / WebP Export
 * - Animated GIF Loop
 * - Live Session Video & Slideshow Video
 * - Print Studio
 */

export const FILTER_CATEGORIES = [
  { id: 'natural', name: 'Natural & Portrait' },
  { id: 'korean', name: 'Korean & Soft' },
  { id: 'film', name: 'Analog & Film' },
  { id: 'classic', name: 'Classic Monochrome' },
  { id: 'creative', name: 'Creative & Cinematic' },
];

/**
 * 35 Curated Photographic Filters
 * Each filter defines normalized parameters with baseline neutral = 0 (or 1.0 multiplier).
 */
export const FILTERS = [
  // =========================================================================
  // CATEGORY A — NATURAL & PORTRAIT
  // =========================================================================
  {
    id: 'clean-original',
    name: 'Clean Original',
    category: 'natural',
    description: 'Clean, unaltered true-to-life tones with zero tint',
    previewGradient: 'from-slate-400 to-slate-200',
    params: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, sepia: 0, grayscale: 0, hueRotate: 0, vignette: 0, grain: 0 },
    tintColor: null,
  },
  {
    id: 'soft-portrait',
    name: 'Soft Portrait',
    category: 'natural',
    description: 'Gentle flattering highlight softening with natural skin tones',
    previewGradient: 'from-rose-200 to-amber-100',
    params: { brightness: 5, contrast: -4, saturation: 6, exposure: 3, temperature: 4, tint: -2, sepia: 3, grayscale: 0, hueRotate: 0, vignette: 10, grain: 0 },
    tintColor: 'rgba(255, 235, 225, 0.08)',
  },
  {
    id: 'warm-portrait',
    name: 'Warm Portrait',
    category: 'natural',
    description: 'Healthy warm skin radiance and golden ambient illumination',
    previewGradient: 'from-amber-400 to-orange-200',
    params: { brightness: 4, contrast: 3, saturation: 12, exposure: 2, temperature: 16, tint: -4, sepia: 8, grayscale: 0, hueRotate: 2, vignette: 12, grain: 0 },
    tintColor: 'rgba(255, 215, 175, 0.10)',
  },
  {
    id: 'cool-daylight',
    name: 'Cool Daylight',
    category: 'natural',
    description: 'Crisp 5600K overcast daylight look with clean neutral whites',
    previewGradient: 'from-sky-300 to-slate-200',
    params: { brightness: 3, contrast: 4, saturation: -2, exposure: 2, temperature: -14, tint: 4, sepia: 0, grayscale: 0, hueRotate: -4, vignette: 8, grain: 0 },
    tintColor: 'rgba(215, 235, 255, 0.08)',
  },
  {
    id: 'golden-glow',
    name: 'Golden Glow',
    category: 'natural',
    description: 'Luminous late-afternoon golden hour halo on highlights',
    previewGradient: 'from-amber-500 to-yellow-200',
    params: { brightness: 6, contrast: 2, saturation: 18, exposure: 4, temperature: 24, tint: -6, sepia: 12, grayscale: 0, hueRotate: 4, vignette: 15, grain: 0 },
    tintColor: 'rgba(255, 210, 130, 0.12)',
  },

  // =========================================================================
  // CATEGORY B — KOREAN & SOFT AESTHETIC
  // =========================================================================
  {
    id: 'milk-beige',
    name: 'Milk Beige',
    category: 'korean',
    description: 'Popular Hongdae studio milky warmth with creamy shadows',
    previewGradient: 'from-amber-200 to-stone-200',
    params: { brightness: 8, contrast: -6, saturation: 4, exposure: 5, temperature: 10, tint: -2, sepia: 14, grayscale: 0, hueRotate: 2, vignette: 10, grain: 0 },
    tintColor: 'rgba(255, 245, 230, 0.14)',
  },
  {
    id: 'peach-cream',
    name: 'Peach Cream',
    category: 'korean',
    description: 'Soft peachy undertones and lifted airy midtones',
    previewGradient: 'from-orange-300 to-pink-200',
    params: { brightness: 7, contrast: -3, saturation: 14, exposure: 4, temperature: 12, tint: -8, sepia: 10, grayscale: 0, hueRotate: -3, vignette: 12, grain: 0 },
    tintColor: 'rgba(255, 205, 185, 0.12)',
  },
  {
    id: 'rosy-pink',
    name: 'Rosy Pink',
    category: 'korean',
    description: 'Romantic pastel rose tint with gentle highlight bloom',
    previewGradient: 'from-pink-400 to-rose-200',
    params: { brightness: 6, contrast: 2, saturation: 15, exposure: 3, temperature: -6, tint: 14, sepia: 10, grayscale: 0, hueRotate: -10, vignette: 10, grain: 0 },
    tintColor: 'rgba(255, 185, 205, 0.14)',
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    category: 'korean',
    description: 'Dreamy Korean idol photocard lilac atmosphere',
    previewGradient: 'from-purple-300 to-pink-200',
    params: { brightness: 6, contrast: 2, saturation: 12, exposure: 3, temperature: -18, tint: 18, sepia: 6, grayscale: 0, hueRotate: -20, vignette: 10, grain: 0 },
    tintColor: 'rgba(230, 200, 255, 0.14)',
  },
  {
    id: 'baby-blue',
    name: 'Baby Blue',
    category: 'korean',
    description: 'Sweet pastel powder blue shadows and airy porcelain skin',
    previewGradient: 'from-sky-300 to-cyan-100',
    params: { brightness: 7, contrast: -2, saturation: 6, exposure: 4, temperature: -20, tint: -2, sepia: 2, grayscale: 0, hueRotate: -8, vignette: 8, grain: 0 },
    tintColor: 'rgba(200, 235, 255, 0.12)',
  },
  {
    id: 'mint-haze',
    name: 'Mint Haze',
    category: 'korean',
    description: 'Fresh minty pastel green highlights with clean lifted tones',
    previewGradient: 'from-emerald-300 to-teal-100',
    params: { brightness: 5, contrast: 0, saturation: 8, exposure: 3, temperature: -8, tint: -14, sepia: 4, grayscale: 0, hueRotate: 15, vignette: 10, grain: 0 },
    tintColor: 'rgba(200, 245, 230, 0.12)',
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    category: 'korean',
    description: 'High-key, low-contrast photobooth strip aesthetic',
    previewGradient: 'from-pink-200 to-sky-100',
    params: { brightness: 9, contrast: -8, saturation: 12, exposure: 6, temperature: 6, tint: 0, sepia: 6, grayscale: 0, hueRotate: 0, vignette: 6, grain: 0 },
    tintColor: 'rgba(255, 240, 240, 0.12)',
  },
  {
    id: 'mocha-cream',
    name: 'Mocha Cream',
    category: 'korean',
    description: 'Cozy coffee latte tone with rich chocolate undertones',
    previewGradient: 'from-amber-700 to-amber-200',
    params: { brightness: 2, contrast: 6, saturation: 8, exposure: 0, temperature: 18, tint: 4, sepia: 22, grayscale: 0, hueRotate: 0, vignette: 18, grain: 0 },
    tintColor: 'rgba(235, 210, 180, 0.15)',
  },

  // =========================================================================
  // CATEGORY C — ANALOG & FILM
  // =========================================================================
  {
    id: 'warm-35mm',
    name: 'Warm 35mm',
    category: 'film',
    description: 'Classic 35mm color negative with amber grain and golden highlights',
    previewGradient: 'from-amber-600 to-orange-300',
    params: { brightness: 4, contrast: 10, saturation: 18, exposure: 2, temperature: 20, tint: -4, sepia: 20, grayscale: 0, hueRotate: -4, vignette: 16, grain: 20 },
    tintColor: 'rgba(255, 210, 150, 0.12)',
  },
  {
    id: 'soft-color-negative',
    name: 'Soft Color Negative',
    category: 'film',
    description: 'Pastel Fuji daylight film with subtle emerald shadows',
    previewGradient: 'from-teal-400 to-emerald-200',
    params: { brightness: 5, contrast: 4, saturation: 10, exposure: 3, temperature: -8, tint: -8, sepia: 8, grayscale: 0, hueRotate: 8, vignette: 12, grain: 15 },
    tintColor: 'rgba(200, 240, 220, 0.10)',
  },
  {
    id: 'faded-print',
    name: 'Faded Print',
    category: 'film',
    description: 'Nostalgic lifted blacks and muted retro paper tone',
    previewGradient: 'from-stone-500 to-amber-200',
    params: { brightness: 8, contrast: -10, saturation: -12, exposure: 4, temperature: 12, tint: 2, sepia: 15, grayscale: 0, hueRotate: 0, vignette: 14, grain: 18 },
    tintColor: 'rgba(240, 230, 215, 0.14)',
  },
  {
    id: 'matte-film',
    name: 'Matte Film',
    category: 'film',
    description: 'Modern editorial matte curve with subdued saturation',
    previewGradient: 'from-zinc-600 to-stone-400',
    params: { brightness: 2, contrast: -4, saturation: -18, exposure: 1, temperature: 4, tint: -2, sepia: 8, grayscale: 0, hueRotate: -2, vignette: 16, grain: 22 },
    tintColor: 'rgba(220, 215, 210, 0.10)',
  },
  {
    id: 'amber-flash',
    name: 'Amber Flash',
    category: 'film',
    description: 'Warm direct photobooth tungsten flash pop with deep shadows',
    previewGradient: 'from-amber-500 to-rose-300',
    params: { brightness: 7, contrast: 16, saturation: 22, exposure: 5, temperature: 22, tint: -6, sepia: 15, grayscale: 0, hueRotate: -6, vignette: 20, grain: 15 },
    tintColor: 'rgba(255, 195, 120, 0.15)',
  },
  {
    id: 'disposable-flash',
    name: 'Disposable Flash',
    category: 'film',
    description: 'Authentic 90s disposable camera direct xenon burst',
    previewGradient: 'from-rose-500 to-amber-300',
    params: { brightness: 10, contrast: 20, saturation: 25, exposure: 7, temperature: 8, tint: 6, sepia: 10, grayscale: 0, hueRotate: -12, vignette: 22, grain: 25 },
    tintColor: 'rgba(255, 180, 110, 0.16)',
  },
  {
    id: 'muted-green',
    name: 'Muted Green',
    category: 'film',
    description: 'Cinematic indie film color grading with sage green midtones',
    previewGradient: 'from-emerald-600 to-stone-400',
    params: { brightness: 2, contrast: 8, saturation: -8, exposure: 1, temperature: -10, tint: -16, sepia: 12, grayscale: 0, hueRotate: 18, vignette: 18, grain: 18 },
    tintColor: 'rgba(195, 225, 205, 0.12)',
  },
  {
    id: 'cool-negative',
    name: 'Cool Negative',
    category: 'film',
    description: 'Tungsten-balanced night film stock with blue-teal ambiance',
    previewGradient: 'from-blue-600 to-cyan-300',
    params: { brightness: 3, contrast: 12, saturation: 8, exposure: 2, temperature: -24, tint: 4, sepia: 4, grayscale: 0, hueRotate: -15, vignette: 16, grain: 20 },
    tintColor: 'rgba(180, 215, 255, 0.14)',
  },
  {
    id: 'instant-cream',
    name: 'Instant Cream',
    category: 'film',
    description: 'Iconic instant camera print with creamy white frames',
    previewGradient: 'from-orange-300 to-amber-100',
    params: { brightness: 6, contrast: 6, saturation: 8, exposure: 3, temperature: 16, tint: -2, sepia: 22, grayscale: 0, hueRotate: 4, vignette: 18, grain: 15 },
    tintColor: 'rgba(250, 240, 210, 0.16)',
  },

  // =========================================================================
  // CATEGORY D — CLASSIC MONOCHROME
  // =========================================================================
  {
    id: 'classic-bw',
    name: 'Classic B&W',
    category: 'classic',
    description: 'Balanced photobooth black & white with smooth midtones',
    previewGradient: 'from-neutral-800 to-neutral-300',
    params: { brightness: 2, contrast: 18, saturation: -100, exposure: 1, temperature: 0, tint: 0, sepia: 0, grayscale: 100, hueRotate: 0, vignette: 12, grain: 12 },
    tintColor: null,
  },
  {
    id: 'soft-silver',
    name: 'Soft Silver',
    category: 'classic',
    description: 'Luminous silver tones with gentle contrast and fine grain',
    previewGradient: 'from-slate-600 to-slate-200',
    params: { brightness: 6, contrast: 8, saturation: -100, exposure: 4, temperature: 0, tint: 0, sepia: 0, grayscale: 100, hueRotate: 0, vignette: 8, grain: 8 },
    tintColor: null,
  },
  {
    id: 'noir-contrast',
    name: 'Noir Contrast',
    category: 'classic',
    description: 'Dramatic inky blacks and striking crisp highlights',
    previewGradient: 'from-black to-neutral-200',
    params: { brightness: 4, contrast: 42, saturation: -100, exposure: 2, temperature: 0, tint: 0, sepia: 0, grayscale: 100, hueRotate: 0, vignette: 22, grain: 18 },
    tintColor: null,
  },
  {
    id: 'vintage-sepia',
    name: 'Vintage Sepia',
    category: 'classic',
    description: '1920s antique darkroom print with rich amber patina',
    previewGradient: 'from-amber-800 to-yellow-600',
    params: { brightness: -2, contrast: 14, saturation: 18, exposure: -1, temperature: 30, tint: 0, sepia: 75, grayscale: 20, hueRotate: 0, vignette: 22, grain: 20 },
    tintColor: 'rgba(210, 160, 90, 0.16)',
  },
  {
    id: 'cyanotype',
    name: 'Cyanotype',
    category: 'classic',
    description: 'Historic Prussian blue monochrome sun print',
    previewGradient: 'from-blue-900 to-cyan-400',
    params: { brightness: 2, contrast: 18, saturation: 25, exposure: 1, temperature: -40, tint: 8, sepia: 10, grayscale: 70, hueRotate: 185, vignette: 18, grain: 15 },
    tintColor: 'rgba(170, 210, 255, 0.18)',
  },
  {
    id: 'silver-print',
    name: 'Silver Print',
    category: 'classic',
    description: 'Museum-grade gelatin silver emulsion with velvet blacks',
    previewGradient: 'from-zinc-900 to-zinc-400',
    params: { brightness: 3, contrast: 28, saturation: -100, exposure: 2, temperature: -4, tint: 0, sepia: 2, grayscale: 100, hueRotate: 0, vignette: 15, grain: 15 },
    tintColor: null,
  },

  // =========================================================================
  // CATEGORY E — CREATIVE & CINEMATIC
  // =========================================================================
  {
    id: 'teal-gold',
    name: 'Teal & Gold',
    category: 'creative',
    description: 'Hollywood blockbuster dual split: teal shadows & golden skin',
    previewGradient: 'from-teal-500 to-amber-400',
    params: { brightness: 3, contrast: 16, saturation: 24, exposure: 2, temperature: 14, tint: -8, sepia: 10, grayscale: 0, hueRotate: 15, vignette: 18, grain: 10 },
    tintColor: 'rgba(56, 189, 248, 0.12)',
  },
  {
    id: 'sunset-bloom',
    name: 'Sunset Bloom',
    category: 'creative',
    description: 'Vibrant sunset orange glow with flushed warm tones',
    previewGradient: 'from-rose-500 to-amber-400',
    params: { brightness: 6, contrast: 8, saturation: 28, exposure: 4, temperature: 28, tint: 10, sepia: 15, grayscale: 0, hueRotate: 6, vignette: 16, grain: 0 },
    tintColor: 'rgba(255, 140, 100, 0.15)',
  },
  {
    id: 'cool-night',
    name: 'Cool Night',
    category: 'creative',
    description: 'Moody neon city midnight atmosphere with deep sapphire depth',
    previewGradient: 'from-indigo-900 to-blue-400',
    params: { brightness: -4, contrast: 18, saturation: 14, exposure: -2, temperature: -30, tint: 12, sepia: 0, grayscale: 0, hueRotate: -25, vignette: 24, grain: 12 },
    tintColor: 'rgba(120, 150, 255, 0.16)',
  },
  {
    id: 'neon-magenta',
    name: 'Neon Magenta',
    category: 'creative',
    description: 'Punchy Tokyo arcade cyberpunk glow with electric magenta shadows',
    previewGradient: 'from-fuchsia-600 to-pink-400',
    params: { brightness: 4, contrast: 22, saturation: 35, exposure: 3, temperature: -12, tint: 32, sepia: 0, hueRotate: 290, vignette: 18, grain: 8 },
    tintColor: 'rgba(244, 63, 94, 0.16)',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    category: 'creative',
    description: 'Electrifying Y2K violet sheen with high-voltage neon pop',
    previewGradient: 'from-purple-600 to-violet-400',
    params: { brightness: 5, contrast: 24, saturation: 35, exposure: 3, temperature: -18, tint: 25, sepia: 0, hueRotate: 265, vignette: 18, grain: 8 },
    tintColor: 'rgba(168, 85, 247, 0.16)',
  },
  {
    id: 'dream-glow',
    name: 'Dream Glow',
    category: 'creative',
    description: 'Ethereal diffusion halo on highlights with soft candy pastels',
    previewGradient: 'from-pink-300 to-yellow-200',
    params: { brightness: 10, contrast: -6, saturation: 18, exposure: 6, temperature: 8, tint: 4, sepia: 12, grayscale: 0, hueRotate: -8, vignette: 12, grain: 0 },
    tintColor: 'rgba(255, 220, 240, 0.16)',
  },
  {
    id: 'cross-process',
    name: 'Cross Process',
    category: 'creative',
    description: 'Experimental darkroom chemical swap: saturated lime & violet split',
    previewGradient: 'from-lime-400 to-purple-600',
    params: { brightness: 5, contrast: 28, saturation: 32, exposure: 3, temperature: 16, tint: -18, sepia: 10, grayscale: 0, hueRotate: 40, vignette: 22, grain: 20 },
    tintColor: 'rgba(200, 255, 100, 0.12)',
  },
];

/**
 * Returns filter object by ID, with robust fallback to 'clean-original'
 */
export function getFilterById(id) {
  if (!id) return FILTERS[0];
  // Backwards compatibility mappings for older IDs
  if (id === 'normal') return FILTERS[0];
  if (id === 'soft-pink') return getFilterById('rosy-pink');
  if (id === 'dreamy-warmth') return getFilterById('golden-glow');
  if (id === 'bw') return getFilterById('classic-bw');
  if (id === 'high-contrast-bw') return getFilterById('noir-contrast');
  if (id === 'sepia') return getFilterById('vintage-sepia');
  if (id === 'warm-analog') return getFilterById('warm-35mm');

  return FILTERS.find(f => f.id === id) || FILTERS[0];
}

/**
 * Interpolates filter parameters with intensity (0% to 100%)
 * and combines with user manual adjustments.
 */
export function interpolateFilterParams(filterId = 'clean-original', intensity = 100, adjustments = {}) {
  const filter = getFilterById(filterId);
  const factor = Math.max(0, Math.min(100, intensity ?? 100)) / 100;
  const p = filter.params || {};

  return {
    brightness: (p.brightness || 0) * factor + (adjustments.brightness || 0),
    contrast: (p.contrast || 0) * factor + (adjustments.contrast || 0),
    saturation: (p.saturation || 0) * factor + (adjustments.saturation || 0),
    exposure: (p.exposure || 0) * factor + (adjustments.exposure || 0),
    temperature: (p.temperature || 0) * factor + (adjustments.temperature || 0),
    tint: (p.tint || 0) * factor + (adjustments.tint || 0),
    sepia: (p.sepia || 0) * factor,
    grayscale: (p.grayscale || 0) * factor,
    hueRotate: (p.hueRotate || 0) * factor,
    vignette: Math.max(0, (p.vignette || 0) * factor + (adjustments.vignette || 0)),
    grain: Math.max(0, (p.grain || 0) * factor + (adjustments.grain || 0)),
    blur: Math.max(0, adjustments.blur || 0),
  };
}

/**
 * Generates unified CSS filter string from normalized parameters.
 * Guarantees visually identical output in:
 * - Viewfinder video element
 * - Canvas 2D ctx.filter
 * - Export rendering
 */
export function buildComposedFilterString(filterId = 'clean-original', intensity = 100, adjustments = {}) {
  const p = interpolateFilterParams(filterId, intensity, adjustments);

  // Multipliers
  const multBrightness = Math.max(0.1, 1 + (p.brightness / 100) + (p.exposure / 100));
  const multContrast = Math.max(0.1, 1 + (p.contrast / 100));
  const multSaturation = Math.max(0, 1 + (p.saturation / 100));
  const valSepia = Math.max(0, Math.min(1, p.sepia / 100));
  const valGrayscale = Math.max(0, Math.min(1, p.grayscale / 100));
  const valHue = p.hueRotate + (p.temperature * 0.25) + (p.tint * 0.35);
  const valBlur = Math.max(0, p.blur || 0);

  const parts = [];
  if (Math.abs(multBrightness - 1.0) > 0.01) parts.push(`brightness(${multBrightness.toFixed(2)})`);
  if (Math.abs(multContrast - 1.0) > 0.01) parts.push(`contrast(${multContrast.toFixed(2)})`);
  if (Math.abs(multSaturation - 1.0) > 0.01) parts.push(`saturate(${multSaturation.toFixed(2)})`);
  if (valSepia > 0.01) parts.push(`sepia(${valSepia.toFixed(2)})`);
  if (valGrayscale > 0.01) parts.push(`grayscale(${valGrayscale.toFixed(2)})`);
  if (Math.abs(valHue) > 0.5) parts.push(`hue-rotate(${Math.round(valHue)}deg)`);
  if (valBlur > 0.1) parts.push(`blur(${valBlur.toFixed(1)}px)`);

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

  const m = filter.tintColor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/);
  if (m) {
    const r = m[1], g = m[2], b = m[3], a = parseFloat(m[4]) * factor;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return filter.tintColor;
}

// Attach calculated cssFilter property to each filter for direct binding
for (const f of FILTERS) {
  f.cssFilter = buildComposedFilterString(f.id, 100, {});
}
