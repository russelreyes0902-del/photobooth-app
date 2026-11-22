import test from 'node:test';
import assert from 'node:assert/strict';
import { FILTERS, FILTER_CATEGORIES, getFilterById, buildComposedFilterString, getInterpolatedTintColor } from '../src/utils/filters.js';

test('FILTERS: all 35 filters exist, valid parameters and categories', () => {
  assert.equal(FILTERS.length, 35, 'Exactly 35 curated filters must exist');
  assert.equal(FILTER_CATEGORIES.length, 5, 'Exactly 5 categories must exist');

  const categories = new Set(FILTER_CATEGORIES.map(c => c.id));
  for (const f of FILTERS) {
    assert.ok(f.id, 'Filter must have an id');
    assert.ok(f.name, 'Filter must have a name');
    assert.ok(categories.has(f.category), `Filter ${f.id} has invalid category ${f.category}`);
    assert.ok(f.params, `Filter ${f.id} must define normalized params`);
    assert.ok(f.cssFilter, `Filter ${f.id} must define precomputed cssFilter`);
  }
});

test('getFilterById: returns correct filter and handles legacy aliases', () => {
  const clean = getFilterById('clean-original');
  assert.equal(clean.id, 'clean-original');

  // Legacy alias 'normal'
  const normal = getFilterById('normal');
  assert.equal(normal.id, 'clean-original');

  const vintage = getFilterById('warm-35mm');
  assert.equal(vintage.id, 'warm-35mm');

  // Fallback on missing id
  const fallback = getFilterById('non-existent-filter-id');
  assert.equal(fallback.id, 'clean-original');
});

test('buildComposedFilterString: 0% intensity produces neutral none string', () => {
  const result = buildComposedFilterString('warm-35mm', 0, {});
  assert.equal(result, 'none');
});

test('buildComposedFilterString: 100% intensity applies filter parameters', () => {
  const result = buildComposedFilterString('warm-35mm', 100, {});
  assert.notEqual(result, 'none');
  assert.ok(result.includes('brightness') || result.includes('contrast') || result.includes('saturate'));
});

test('buildComposedFilterString: includes user manual adjustments', () => {
  const result = buildComposedFilterString('clean-original', 100, {
    brightness: 20,
    contrast: 15,
  });
  assert.ok(result.includes('brightness'));
  assert.ok(result.includes('contrast'));
});

test('getInterpolatedTintColor: scales alpha with intensity', () => {
  const full = getInterpolatedTintColor('warm-35mm', 100);
  assert.ok(full);

  const zero = getInterpolatedTintColor('warm-35mm', 0);
  assert.equal(zero, null);
});
