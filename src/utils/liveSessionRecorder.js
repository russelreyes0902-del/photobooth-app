import { getOptimalVideoMimeType } from './capabilities.js';
import { calculateTargetBitrate, verifyVideoBlob } from './videoGenerator.js';
import { calculateViewfinderCrop } from './geometry.js';

export class LiveSessionRecorder {
  constructor({ videoEl, isMirrored = true, lensZoomScale = 1.0, activeFilter = null, width, height }) {
    this.videoEl = videoEl;
    this.isMirrored = isMirrored;
    this.lensZoomScale = lensZoomScale || 1.0;
    this.activeFilter = activeFilter;

    // Match exact camera photo resolution
    const camW = videoEl?.videoWidth || 1920;
    const camH = videoEl?.videoHeight || 1080;
    this.width = width || camW;
    this.height = height || camH;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: true });

    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.animId = null;
    this.startTime = 0;

    // Live overlay state
    this.currentShot = 1;
    this.countdown = null;
    this.isFlashing = false;
    this.mimeInfo = getOptimalVideoMimeType();
  }

  updateState({ shot, countdown, isFlashing, lensZoomScale, isMirrored, activeFilter }) {
    if (shot !== undefined) this.currentShot = shot;
    if (countdown !== undefined) this.countdown = countdown;
    if (isFlashing !== undefined) this.isFlashing = isFlashing;
    if (lensZoomScale !== undefined) this.lensZoomScale = lensZoomScale;
    if (isMirrored !== undefined) this.isMirrored = isMirrored;
    if (activeFilter !== undefined) this.activeFilter = activeFilter;
  }

  start() {
    try {
      if (!this.canvas || typeof this.canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
        console.warn('Canvas captureStream or MediaRecorder not available for live recording');
        return false;
      }

      this.stream = this.canvas.captureStream(30); // 30 FPS stream
      const bitrate = calculateTargetBitrate(this.width, this.height, 30);

      const options = {
        videoBitsPerSecond: bitrate,
      };
      if (this.mimeInfo?.mime) {
        options.mimeType = this.mimeInfo.mime;
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.startTime = performance.now();

      // Begin drawing loop
      const render = () => {
        if (!this.isRecording) return;
        this.drawFrame();
        this.animId = requestAnimationFrame(render);
      };

      this.animId = requestAnimationFrame(render);
      return true;
    } catch (err) {
      console.warn('Failed to start LiveSessionRecorder:', err);
      this.isRecording = false;
      return false;
    }
  }

  drawFrame() {
    try {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // Dark background
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, w, h);

      // Draw camera video feed matching exact camera photo framing
      if (this.videoEl && this.videoEl.videoWidth > 0 && this.videoEl.videoHeight > 0) {
        ctx.save();
        if (this.isMirrored) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }

        if (this.activeFilter && this.activeFilter.cssFilter && this.activeFilter.cssFilter !== 'none') {
          ctx.filter = this.activeFilter.cssFilter;
        }

        const crop = calculateViewfinderCrop(this.videoEl.videoWidth, this.videoEl.videoHeight, this.lensZoomScale);
        ctx.drawImage(this.videoEl, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
        ctx.restore();

        // Optional filter tint
        if (this.activeFilter && this.activeFilter.tintColor) {
          ctx.fillStyle = this.activeFilter.tintColor;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Flash effect
      if (this.isFlashing) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, 0, w, h);
      }

      // Overlays
      const scaleFactor = Math.max(0.6, Math.min(2.0, w / 1080));
      const elapsedSec = ((performance.now() - this.startTime) / 1000).toFixed(1);

      // Blinking REC badge
      const isBlink = Math.floor(Date.now() / 500) % 2 === 0;
      const recDotX = 36 * scaleFactor;
      const recDotY = 38 * scaleFactor;

      if (isBlink) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(recDotX, recDotY, 7 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(14 * scaleFactor)}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`REC ${elapsedSec}s`, recDotX + 16 * scaleFactor, recDotY);

      // Shot counter badge
      const badgeW = 120 * scaleFactor;
      const badgeH = 34 * scaleFactor;
      const badgeX = w - badgeW - 24 * scaleFactor;
      const badgeY = 22 * scaleFactor;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8 * scaleFactor);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(13 * scaleFactor)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`SHOT 0${this.currentShot}`, badgeX + badgeW / 2, badgeY + badgeH / 2);

      // Countdown Number or "Smile!"
      if (this.countdown !== null && !this.isFlashing) {
        ctx.save();
        const text = String(this.countdown);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const isNum = typeof this.countdown === 'number';
        const pillW = (isNum ? 140 : 260) * scaleFactor;
        const pillH = (isNum ? 140 : 80) * scaleFactor;
        const fontSz = (isNum ? 84 : 44) * scaleFactor;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect((w - pillW) / 2, (h - pillH) / 2, pillW, pillH, 20 * scaleFactor);
        } else {
          ctx.rect((w - pillW) / 2, (h - pillH) / 2, pillW, pillH);
        }
        ctx.fill();

        if (isNum) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${Math.round(fontSz)}px monospace, system-ui`;
          ctx.fillText(text, w / 2, h / 2);
        } else {
          ctx.fillStyle = '#ff6b95';
          ctx.font = `800 ${Math.round(fontSz)}px system-ui, sans-serif`;
          ctx.fillText(text, w / 2, h / 2);
        }
        ctx.restore();
      }
    } catch (e) {
      console.warn('drawFrame caught warning:', e);
    }
  }

  stop() {
    return new Promise((resolve) => {
      try {
        if (!this.isRecording || !this.mediaRecorder) {
          this.cleanupTracks();
          resolve(null);
          return;
        }

        this.isRecording = false;
        if (this.animId) {
          cancelAnimationFrame(this.animId);
          this.animId = null;
        }

        this.mediaRecorder.onstop = async () => {
          try {
            const mime = this.mediaRecorder?.mimeType || this.mimeInfo?.mime || 'video/mp4';
            const blob = new Blob(this.chunks, { type: mime });
            this.cleanupTracks();

            // Post-recording verification
            const meta = await verifyVideoBlob(blob).catch(() => ({
              width: this.width,
              height: this.height,
              duration: (performance.now() - this.startTime) / 1000,
            }));

            const url = URL.createObjectURL(blob);
            const ext = this.mimeInfo?.ext || 'mp4';

            resolve({
              blob,
              url,
              ext,
              mimeType: mime,
              width: meta.width || this.width,
              height: meta.height || this.height,
              durationSec: meta.duration,
              sizeBytes: blob.size,
              captureType: 'live-recording',
            });
          } catch (stopErr) {
            console.error('Error finalising live video recording:', stopErr);
            this.cleanupTracks();
            resolve(null);
          }
        };

        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        } else {
          this.cleanupTracks();
          resolve(null);
        }
      } catch (err) {
        console.error('LiveSessionRecorder stop error:', err);
        this.cleanupTracks();
        resolve(null);
      }
    });
  }

  cleanupTracks() {
    if (this.stream) {
      try {
        this.stream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      } catch (e) {}
      this.stream = null;
    }
  }
}
