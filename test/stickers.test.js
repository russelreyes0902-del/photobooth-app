import test from 'node:test';
import assert from 'node:assert/strict';
import { STICKER_LIBRARY, STICKER_CATEGORIES, getStickerById } from '../src/utils/stickers.js';

test('STICKER_LIBRARY: contains diverse stickers with valid SVGs', () => {
  assert.ok(STICKER_CATEGORIES.length >= 4);
  assert.ok(STICKER_LIBRARY.length >= 10);

  for (const s of STICKER_LIBRARY) {
    assert.ok(s.id);
    assert.ok(s.name);
    assert.ok(s.category);
    assert.ok(s.svg.includes('<svg') && s.svg.includes('</svg>'), `Sticker ${s.id} must be valid SVG`);
  }
});

test('getStickerById: returns sticker or default', () => {
  const st = getStickerById('candy-heart');
  assert.equal(st.id, 'candy-heart');

  const fallback = getStickerById('invalid-id');
  assert.equal(fallback.id, STICKER_LIBRARY[0].id);
});
