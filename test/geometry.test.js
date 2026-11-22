import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCoverCrop, calculateViewfinderCrop, generateCutoutSlots } from '../src/utils/geometry.js';

test('calculateCoverCrop: source wider than target crops horizontally', () => {
  // Source 1920x1080 (16:9 = 1.777), Target 600x600 (1:1 = 1.0)
  const result = calculateCoverCrop({
    sourceWidth: 1920,
    sourceHeight: 1080,
    targetWidth: 600,
    targetHeight: 600,
    zoom: 1.0,
  });

  assert.equal(result.sh, 1080);
  assert.equal(result.sw, 1080);
  assert.equal(result.sy, 0);
  assert.equal(result.sx, (1920 - 1080) / 2); // 420
});

test('calculateCoverCrop: source taller than target crops vertically', () => {
  // Source 1080x1920 (9:16 = 0.5625), Target 600x600 (1:1 = 1.0)
  const result = calculateCoverCrop({
    sourceWidth: 1080,
    sourceHeight: 1920,
    targetWidth: 600,
    targetHeight: 600,
    zoom: 1.0,
  });

  assert.equal(result.sw, 1080);
  assert.equal(result.sh, 1080);
  assert.equal(result.sx, 0);
  assert.equal(result.sy, (1920 - 1080) / 2); // 420
});

test('calculateCoverCrop: handles zoom and pan bounds', () => {
  const result = calculateCoverCrop({
    sourceWidth: 1000,
    sourceHeight: 1000,
    targetWidth: 500,
    targetHeight: 500,
    zoom: 2.0,
    panX: 0.5,
    panY: -0.5,
  });

  assert.equal(result.sw, 500); // 1000 / 2
  assert.equal(result.sh, 500);
  assert.ok(result.sx >= 0 && result.sx <= 500);
  assert.ok(result.sy >= 0 && result.sy <= 500);
});

test('calculateCoverCrop: handles 90 degree rotation inversion', () => {
  const result = calculateCoverCrop({
    sourceWidth: 1920,
    sourceHeight: 1080,
    targetWidth: 600,
    targetHeight: 600,
    rotate: 90,
  });

  assert.equal(result.effectiveSW, 1080);
  assert.equal(result.effectiveSH, 1920);
  assert.equal(result.rotate, 90);
});

test('calculateViewfinderCrop: 1.0x scale leaves dimensions uncropped', () => {
  const crop = calculateViewfinderCrop(1280, 720, 1.0);
  assert.equal(crop.sx, 0);
  assert.equal(crop.sy, 0);
  assert.equal(crop.sw, 1280);
  assert.equal(crop.sh, 720);
});

test('calculateViewfinderCrop: 1.38x scale centers optical crop', () => {
  const crop = calculateViewfinderCrop(1280, 720, 1.38);
  assert.ok(crop.sx > 0);
  assert.ok(crop.sy > 0);
  assert.ok(crop.sw < 1280);
  assert.ok(crop.sh < 720);
  assert.equal(Math.round(crop.sx * 2 + crop.sw), 1280);
  assert.equal(Math.round(crop.sy * 2 + crop.sh), 720);
});

test('generateCutoutSlots: generates requested slot counts and valid geometries', () => {
  // Test 1-cut
  const slots1 = generateCutoutSlots({ count: 1, baseWidth: 1200, baseHeight: 1800 });
  assert.equal(slots1.length, 1);
  assert.ok(slots1[0].width > 0 && slots1[0].height > 0);

  // Test 4-cut strip
  const slots4 = generateCutoutSlots({ count: 4, baseWidth: 1200, baseHeight: 3600, layout: 'strip' });
  assert.equal(slots4.length, 4);
  assert.equal(slots4[0].x, slots4[1].x); // aligned vertically
  assert.ok(slots4[1].y > slots4[0].y);

  // Test 4-cut grid (2x2)
  const slotsGrid = generateCutoutSlots({ count: 4, baseWidth: 2000, baseHeight: 2200, layout: 'grid' });
  assert.equal(slotsGrid.length, 4);
  assert.equal(slotsGrid[0].y, slotsGrid[1].y); // row 1
  assert.equal(slotsGrid[2].y, slotsGrid[3].y); // row 2

  // Test 6-cut grid (2x3)
  const slots6 = generateCutoutSlots({ count: 6, baseWidth: 1800, baseHeight: 2400, layout: 'grid' });
  assert.equal(slots6.length, 6);
});
