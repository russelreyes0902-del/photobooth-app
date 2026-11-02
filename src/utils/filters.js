export const FILTERS = [
  {
    id: 'normal',
    name: 'Normal',
    label: 'Natural',
    cssFilter: 'none',
    tintColor: null,
    description: 'Clean, unaltered true-to-life tones',
    previewGradient: 'from-slate-400 to-slate-200',
  },
  {
    id: 'soft-pink',
    name: 'Soft Pink',
    label: 'Rosy Pink',
    cssFilter: 'brightness(1.06) contrast(1.02) saturate(1.15) hue-rotate(-10deg) sepia(0.15)',
    tintColor: 'rgba(255, 182, 193, 0.12)',
    description: 'Soft romantic rosy pastel tint & lifted highlights',
    previewGradient: 'from-pink-400 to-rose-300',
  },
  {
    id: 'vintage-sepia',
    name: 'Vintage Sepia',
    label: '1970s Sepia',
    cssFilter: 'sepia(0.65) contrast(1.12) brightness(0.94) saturate(1.18)',
    tintColor: 'rgba(210, 160, 90, 0.15)',
    description: 'Warm analog nostalgia with rich golden shadows',
    previewGradient: 'from-amber-600 to-yellow-300',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    label: 'Neon Violet',
    cssFilter: 'contrast(1.22) brightness(1.05) saturate(1.35) hue-rotate(265deg)',
    tintColor: 'rgba(168, 85, 247, 0.14)',
    description: 'Electrifying Y2K cyber neon with magenta shadows',
    previewGradient: 'from-purple-600 to-fuchsia-400',
  },
  {
    id: 'dreamy-warmth',
    name: 'Dreamy Warmth',
    label: 'Golden Hour',
    cssFilter: 'brightness(1.07) contrast(1.02) saturate(1.24) sepia(0.22) hue-rotate(8deg)',
    tintColor: 'rgba(255, 200, 100, 0.14)',
    description: 'Sunset golden-hour glow with creamy highlights',
    previewGradient: 'from-orange-400 to-amber-200',
  },
  {
    id: 'bw',
    name: 'B&W',
    label: 'Classic Noir',
    cssFilter: 'grayscale(1) contrast(1.28) brightness(1.02)',
    tintColor: null,
    description: 'Crisp, timeless high-contrast photobooth monochrome',
    previewGradient: 'from-neutral-900 to-neutral-200',
  },
];

export function getFilterById(id) {
  return FILTERS.find(f => f.id === id) || FILTERS[0];
}

/**
 * Apply the selected filter when drawing an image to an HTML5 canvas context.
 */
export function applyFilterToContext(ctx, filterId) {
  const filter = getFilterById(filterId);
  if (filter && filter.cssFilter && filter.cssFilter !== 'none') {
    ctx.filter = filter.cssFilter;
  } else {
    ctx.filter = 'none';
  }
}

export function resetFilterContext(ctx) {
  ctx.filter = 'none';
}
