import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTargetBitrate, VIDEO_RESOLUTIONS } from '../src/utils/videoGenerator.js';
import { getOptimalVideoMimeType } from '../src/utils/capabilities.js';

describe('Video Encoding & Bitrate Engine', () => {
  it('correctly calculates target bitrates based on resolution tiers', () => {
    // 4K (3840x2160) -> 40 Mbps
    assert.equal(calculateTargetBitrate(3840, 2160), 40_000_000);

    // QHD 1440p (2560x1440) -> 20 Mbps
    assert.equal(calculateTargetBitrate(2560, 1440), 20_000_000);

    // Full HD 1080p (1920x1080) -> 10 Mbps
    assert.equal(calculateTargetBitrate(1920, 1080), 10_000_000);

    // Portrait Full HD (1080x1920) -> 10 Mbps
    assert.equal(calculateTargetBitrate(1080, 1920), 10_000_000);

    // HD 720p (1280x720) -> 5 Mbps
    assert.equal(calculateTargetBitrate(1280, 720), 5_000_000);

    // Standard / Low-res (640x480) -> 3 Mbps
    assert.equal(calculateTargetBitrate(640, 480), 3_000_000);
  });

  it('defines valid video resolution presets with match-source as primary', () => {
    assert.ok(Array.isArray(VIDEO_RESOLUTIONS));
    assert.ok(VIDEO_RESOLUTIONS.length >= 5);

    const matchSource = VIDEO_RESOLUTIONS.find(r => r.id === 'match-source');
    assert.ok(matchSource, 'match-source preset must exist');
    assert.equal(matchSource.name, 'Match Photos');

    const fhdPortrait = VIDEO_RESOLUTIONS.find(r => r.id === 'fhd-portrait');
    assert.ok(fhdPortrait);
    assert.equal(fhdPortrait.width, 1080);
    assert.equal(fhdPortrait.height, 1920);

    const square = VIDEO_RESOLUTIONS.find(r => r.id === 'square');
    assert.ok(square);
    assert.equal(square.width, 1080);
    assert.equal(square.height, 1080);
  });

  it('returns appropriate mime info structure from getOptimalVideoMimeType', () => {
    const mimeInfo = getOptimalVideoMimeType();
    assert.ok(typeof mimeInfo === 'object');
    assert.ok(mimeInfo.ext === 'mp4' || mimeInfo.ext === 'webm');
    assert.ok(typeof mimeInfo.isMp4 === 'boolean');
  });
});
