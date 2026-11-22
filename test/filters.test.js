import test from 'node:test';
import assert from 'node:assert/strict';
import { FILTERS, FILTER_CATEGORIES, getFilterById, buildComposedFilterString, getInterpolatedTintColor } from '../src/utils/filters.js';

test('FILTERS: all filter categories exist and filters are categorized', () => {
  assert.ok(FILTER_CATEGORIES.length >= 4);
  assert.ok(FILTERS.length >= 10);

  for (const f of FILTERS) {
    assert.ok(f.id, 'Filter must have an id');
    assert.ok(f.name, 'Filter must have a name');
    assert.ok(f.category, `Filter ${f.id} must have a category`);
  }
});

test('getFilterById: returns correct filter and falls back safely', () => {
  const normal = getFilterById('normal');
  assert.equal(normal.id, 'normal');

  const vintage = getFilterById('warm-analog');
  assert.equal(vintage.id, 'warm-analog');

  const fallback = getFilterById('non-existent-filter-id');
  assert.equal(fallback.id, 'normal');
});

test('buildComposedFilterString: 0% intensity produces neutral none string', () => {
  const result = buildComposedFilterString('warm-analog', 0, {});
  assert.equal(result, 'none');
});

test('buildComposedFilterString: 100% intensity applies filter parameters', () => {
  const result = buildComposedFilterString('warm-analog', 100, {});
  assert.notEqual(result, 'none');
  assert.ok(result.includes('brightness') || result.includes('contrast') || result.includes('saturate'));
});

test('buildComposedFilterString: includes user manual adjustments', () => {
  const result = buildComposedFilterString('normal', 100, {
    brightness: 20,
    contrast: 15,
  });
  assert.ok(result.includes('brightness'));
  assert.ok(result.includes('contrast'));
});

test('getInterpolatedTintColor: scales alpha with intensity', () => {
  const full = getInterpolatedTintColor('warm-analog', 100);
  assert.ok(full);

  const zero = getInterpolatedTintColor('warm-analog', 0);
  assert.equal(zero, null);
});
