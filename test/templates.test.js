import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_TEMPLATES, getTemplateById, getTemplatesForSlotCount, PAPER_COLORS, PAPER_PATTERNS } from '../src/utils/templates.js';

test('BUILTIN_TEMPLATES: contains original templates (denim, purple, cottagecore, classic-film)', () => {
  const ids = BUILTIN_TEMPLATES.map(t => t.id);
  assert.ok(ids.includes('denim'), 'Must preserve denim frame');
  assert.ok(ids.includes('purple'), 'Must preserve purple frame');
  assert.ok(ids.includes('cottagecore'), 'Must preserve cottagecore frame');
  assert.ok(ids.includes('classic-film'), 'Must preserve classic-film frame');
});

test('BUILTIN_TEMPLATES: includes 1-cut, 2-cut, 3-cut, 4-cut, 6-cut templates', () => {
  const cuts = new Set(BUILTIN_TEMPLATES.map(t => t.slotCount));
  assert.ok(cuts.has(1), 'Must support 1-cut');
  assert.ok(cuts.has(2), 'Must support 2-cut');
  assert.ok(cuts.has(3), 'Must support 3-cut');
  assert.ok(cuts.has(4), 'Must support 4-cut');
  assert.ok(cuts.has(6), 'Must support 6-cut');
});

test('getTemplateById: falls back to first template when not found', () => {
  const found = getTemplateById('denim');
  assert.equal(found.id, 'denim');

  const fallback = getTemplateById('non-existent');
  assert.equal(fallback.id, BUILTIN_TEMPLATES[0].id);
});

test('getTemplatesForSlotCount: filters templates accurately', () => {
  const tpls4 = getTemplatesForSlotCount(4);
  assert.ok(tpls4.length >= 4);
  for (const t of tpls4) {
    assert.equal(t.slotCount, 4);
  }

  const tpls1 = getTemplatesForSlotCount(1);
  assert.ok(tpls1.length >= 1);
  assert.equal(tpls1[0].slotCount, 1);
});

test('PAPER_COLORS and PAPER_PATTERNS: valid options available', () => {
  assert.ok(PAPER_COLORS.length >= 6);
  assert.ok(PAPER_PATTERNS.length >= 4);
});
