import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectCapabilities, getOptimalVideoMimeType } from '../src/utils/capabilities.js';

describe('Browser Capability Detection', () => {
  it('detects runtime environment safely without throwing in headless/node context', () => {
    const caps = detectCapabilities();
    assert.ok(typeof caps === 'object');
    assert.ok('isSecure' in caps);
    assert.ok('hasMediaDevices' in caps);
    assert.ok('hasImageCapture' in caps);
    assert.ok('hasMediaRecorder' in caps);
    assert.ok('hasCanvasCaptureStream' in caps);
    assert.ok('hasCreateImageBitmap' in caps);
    assert.ok('hasWebShare' in caps);
    assert.ok('hasIndexedDB' in caps);
    assert.ok('canEncodeWebP' in caps);
  });

  it('provides safe fallback video MIME type configuration', () => {
    const mime = getOptimalVideoMimeType();
    assert.ok(mime);
    assert.ok('ext' in mime);
    assert.ok('isMp4' in mime);
    assert.ok(['mp4', 'webm'].includes(mime.ext));
  });
});
