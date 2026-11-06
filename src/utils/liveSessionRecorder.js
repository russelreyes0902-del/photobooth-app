import { getSupportedVideoMimeType } from './videoGenerator';

export class LiveSessionRecorder {
  constructor({ videoEl, isMirrored = true, lensZoomScale = 1.0, activeFilter = null, width = 720, height = 960 }) {
    this.videoEl = videoEl;
    this.isMirrored = isMirrored;
    this.lensZoomScale = lensZoomScale || 1.0;
    this.activeFilter = activeFilter;
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: true });

    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.animId = null;
    this.startTime = 0;

    // Live overlay state
    this.currentShot = 1;
    this.countdown = null;
    this.isFlashing = false;
    this.mimeInfo = getSupportedVideoMimeType();
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
      const options = this.mimeInfo?.mime ? { mimeType: this.mimeInfo.mime } : undefined;
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.startTime = Date.now();

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

      // Draw camera video feed
      if (this.videoEl && this.videoEl.videoWidth > 0 && this.videoEl.videoHeight > 0) {
        ctx.save();
        if (this.isMirrored) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }

        if (this.activeFilter && this.activeFilter.cssFilter && this.activeFilter.cssFilter !== 'none') {
          ctx.filter = this.activeFilter.cssFilter;
        }

        const vw = this.videoEl.videoWidth;
        const vh = this.videoEl.videoHeight;
        const scale = this.lensZoomScale || 1.0;

        // Source crop rectangle based on lens zoom scale (e.g. 1.38x on 1x mode)
        const sw = vw / scale;
        const sh = vh / scale;
        const sx = (vw - sw) / 2;
        const sy = (vh - sh) / 2;

        ctx.drawImage(this.videoEl, sx, sy, sw, sh, 0, 0, w, h);
        ctx.restore();

        // Optional filter color tint
        if (this.activeFilter && this.activeFilter.tintColor) {
          ctx.fillStyle = this.activeFilter.tintColor;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Flash effect frame
      if (this.isFlashing) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, 0, w, h);
      }

      // -------------------------------------------------------------
      // PHOTOBOOTH HUD OVERLAYS
      // -------------------------------------------------------------
      const elapsedSec = ((Date.now() - this.startTime) / 1000).toFixed(1);

      // Top Left: Blinking Red REC Badge
      const isBlink = Math.floor(Date.now() / 500) % 2 === 0;
      if (isBlink) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(36, 42, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`REC ${elapsedSec}s`, 52, 42);

      // Top Right: Shot counter badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(w - 130, 26, 105, 32, 8);
      } else {
        ctx.rect(w - 130, 26, 105, 32);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SHOT 0${this.currentShot} / 04`, w - 77, 42);

      // Center: Countdown Number or "Smile!"
      if (this.countdown !== null && !this.isFlashing) {
        const text = String(this.countdown);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dark glowing backing pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        const pillW = typeof this.countdown === 'number' ? 140 : 220;
        const pillH = typeof this.countdown === 'number' ? 140 : 70;
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect((w - pillW) / 2, (h - pillH) / 2, pillW, pillH, 24);
        } else {
          ctx.rect((w - pillW) / 2, (h - pillH) / 2, pillW, pillH);
        }
        ctx.fill();

        if (typeof this.countdown === 'number') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 80px monospace, system-ui';
          ctx.fillText(text, w / 2, h / 2);
        } else {
          ctx.fillStyle = '#ff6b95';
          ctx.font = '800 42px system-ui, sans-serif';
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
          resolve(null);
          return;
        }

        this.isRecording = false;
        if (this.animId) {
          cancelAnimationFrame(this.animId);
          this.animId = null;
        }

        this.mediaRecorder.onstop = () => {
          try {
            const mime = this.mediaRecorder.mimeType || this.mimeInfo?.mime || 'video/mp4';
            const blob = new Blob(this.chunks, { type: mime });
            const url = URL.createObjectURL(blob);
            const ext = this.mimeInfo?.ext || 'mp4';
            resolve({ blob, url, ext, mimeType: mime });
          } catch (stopErr) {
            console.error('Error finalising live video recording:', stopErr);
            resolve(null);
          }
        };

        this.mediaRecorder.stop();
      } catch (err) {
        console.error('LiveSessionRecorder stop error:', err);
        resolve(null);
      }
    });
  }
}
