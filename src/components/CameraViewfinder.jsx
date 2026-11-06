import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  RefreshCw, 
  Timer, 
  Grid3X3, 
  Sparkles, 
  AlertCircle,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { getFilterById } from '../utils/filters';

export default function CameraViewfinder({
  camera,
  activeFilterId,
  onStartBurst,
  photosCount = 0,
}) {
  const [showGrid, setShowGrid] = useState(true);
  const activeFilter = getFilterById(activeFilterId);

  // Directly bind stream to video element whenever stream updates
  useEffect(() => {
    try {
      const video = camera.videoRef.current;
      if (video && camera.stream) {
        if (video.srcObject !== camera.stream) {
          video.srcObject = camera.stream;
        }
        video.play().catch((err) => {
          console.debug('Autoplay initiated on stream update', err);
        });
      }
    } catch (err) {
      console.warn('Safe stream attach caught error:', err);
    }
  }, [camera.stream, camera.videoRef]);

  // Keyboard shortcut: Spacebar triggers capture
  useEffect(() => {
    const handleKeyDown = (e) => {
      try {
        if (e.code === 'Space' && !camera.isCapturingBurst && camera.hasPermission) {
          e.preventDefault();
          if (onStartBurst) onStartBurst();
        }
      } catch (err) {
        console.warn('Keyboard space trigger warning:', err);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera.isCapturingBurst, camera.hasPermission, onStartBurst]);

  // Optical Framing Transform:
  // Strictly matched to camera.lensZoomScale (1.38 on 1x mode, 1.0 on 0.5x mode)
  const getTransformStyle = useCallback(() => {
    try {
      const transforms = [];
      if (camera.isMirrored) {
        transforms.push('scaleX(-1)');
      }
      if (camera.lensZoomScale && camera.lensZoomScale > 1.0) {
        transforms.push(`scale(${camera.lensZoomScale})`);
      }
      return transforms.length > 0 ? transforms.join(' ') : 'none';
    } catch (e) {
      return 'none';
    }
  }, [camera.isMirrored, camera.lensZoomScale]);

  // Switch protocol to HTTPS
  const handleSwitchToHttps = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.href = `https://${window.location.hostname}:3000${window.location.pathname}`;
      }
    } catch (e) {}
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-black rounded-3xl overflow-hidden border border-studio-700/60 shadow-2xl select-none">
      
      {/* ============================================================ */}
      {/* TOP FLOATING CONTROLS BAR */}
      {/* ============================================================ */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1 bg-studio-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
          {/* Mirror Toggle */}
          <button
            onClick={() => {
              try { camera.toggleMirror(); } catch (e) {}
            }}
            title={camera.isMirrored ? 'Disable Mirror' : 'Enable Mirror'}
            className={`p-2 rounded-xl transition-all ${
              camera.isMirrored
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(prev => !prev)}
            title="Toggle Composition Grid"
            className={`p-2 rounded-xl transition-all ${
              showGrid
                ? 'bg-accent-purple/20 text-purple-300 border border-accent-purple/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Countdown Delay Switcher */}
          <button
            onClick={() => {
              try {
                camera.setCountdownDelay(prev => (prev === 3 ? 5 : 3));
              } catch (e) {}
            }}
            title="Change Countdown Delay (3s / 5s)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all"
          >
            <Timer className="w-3.5 h-3.5 text-accent-amber" />
            <span>{camera.countdownDelay}s</span>
          </button>
        </div>

        {/* Right Top: Camera Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-studio-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
          {camera.devices.length > 1 && (
            <select
              value={camera.selectedDeviceId}
              onChange={(e) => {
                try { camera.setSelectedDeviceId(e.target.value); } catch (err) {}
              }}
              className="bg-transparent text-xs text-slate-200 px-2 py-1.5 rounded-xl outline-none cursor-pointer max-w-[120px] truncate"
            >
              <option value="" className="bg-studio-900 text-slate-200">Default Cam</option>
              {camera.devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId} className="bg-studio-900 text-slate-200">
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              try { camera.toggleFacingMode(); } catch (e) {}
            }}
            title="Flip Front / Rear Camera"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:rotate-180 duration-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIDEO VIEWFINDER AREA */}
      {/* ============================================================ */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-studio-950">
        
        {/* Permission Denied or Loading State */}
        {!camera.hasPermission && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-studio-950/95 backdrop-blur-md">
            {camera.isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-300">Warming up studio lens...</p>
              </div>
            ) : camera.isHttpsNeeded ? (
              <div className="max-w-sm flex flex-col items-center gap-3 p-4 bg-studio-900/90 rounded-3xl border border-rose-500/30 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-slate-100">HTTPS Required on iPad / iPhone</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">
                  Safari and iPadOS security policies block camera access when opened over plain <code className="text-rose-400 bg-black/40 px-1 py-0.5 rounded">http://</code>.
                </p>
                <div className="text-left w-full text-[11px] text-slate-400 space-y-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <p>1. Tap the button below to switch to <strong className="text-emerald-400">https://</strong></p>
                  <p>2. Safari will show <em>"Connection Not Private"</em>.</p>
                  <p>3. Tap <strong>Show Details</strong> &rarr; <strong>visit this website</strong> to allow local network camera access.</p>
                </div>
                <button
                  onClick={handleSwitchToHttps}
                  className="w-full mt-1 px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open via Secure HTTPS</span>
                </button>
              </div>
            ) : (
              <div className="max-w-xs flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-100">Camera Access Needed</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {camera.permissionError || 'Please allow camera permissions in your browser to take photobooth pictures.'}
                </p>
                <button
                  onClick={() => {
                    try { camera.retryCamera(); } catch (e) {}
                  }}
                  className="mt-2 px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Video Element */}
        <video
          ref={camera.videoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={(e) => {
            try {
              e.target.play().catch(() => {});
            } catch (err) {}
          }}
          className="w-full h-full object-cover transition-transform duration-300 ease-out"
          style={{
            transform: getTransformStyle(),
            filter: activeFilter.cssFilter,
          }}
        />

        {/* Photobooth Rule of Thirds Composition Grid */}
        {showGrid && camera.hasPermission && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-30">
            <div className="border-r border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div />
          </div>
        )}

        {/* SCREEN FLASH EFFECT OVERLAY */}
        {camera.isFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-flash" />
        )}

        {/* INTERACTIVE COUNTDOWN DISPLAY */}
        {camera.countdown !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[2px] pointer-events-none">
            <div className="flex flex-col items-center animate-scale-in">
              <span className={`font-black tracking-tight drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)] ${
                typeof camera.countdown === 'number'
                  ? 'text-7xl md:text-9xl text-white font-mono'
                  : 'text-5xl md:text-7xl text-accent-pink font-display font-extrabold'
              }`}>
                {camera.countdown}
              </span>
              <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-accent-amber animate-spin" />
                <span>Shot {camera.burstProgress + 1} of 4</span>
              </div>
            </div>
          </div>
        )}

        {/* 0.5x vs 1x LENS TOGGLE PILL: Only shown if hardware ultra-wide / iPad exists! */}
        {camera.hasHardwareUltraWide && (
          <div className="absolute bottom-24 z-30 flex items-center justify-center pointer-events-auto">
            <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-full border border-white/15 shadow-xl">
              <button
                onClick={() => {
                  try { camera.setLensMode('0.5x'); } catch (e) {}
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  camera.lensMode === '0.5x'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                0.5x
              </button>
              <button
                onClick={() => {
                  try { camera.setLensMode('1x'); } catch (e) {}
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  camera.lensMode === '1x'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                1x
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* BOTTOM SHUTTER TRIGGER BAR */}
      {/* ============================================================ */}
      <div className="relative w-full z-30 pb-4 pt-2 px-6 flex items-center justify-between bg-gradient-to-t from-studio-950 via-studio-950/80 to-transparent">
        
        {/* Left: Active Shot Indicator */}
        <div className="w-20 flex flex-col items-start">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Captured</span>
          <div className="flex items-center gap-1 mt-1">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx < photosCount
                    ? 'bg-rose-500 scale-110 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Center: Tactile Shutter Trigger */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              try {
                if (onStartBurst) onStartBurst();
              } catch (err) {
                console.error('Shutter trigger error:', err);
              }
            }}
            disabled={camera.isCapturingBurst || !camera.hasPermission}
            title="Start 4-Photo Burst Sequence (or press Space)"
            className={`relative group flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 active:scale-95 ${
              camera.isCapturingBurst
                ? 'cursor-not-allowed opacity-80'
                : 'hover:scale-105 cursor-pointer shadow-[0_0_30px_rgba(244,63,94,0.35)]'
            }`}
          >
            {/* Outer Ring */}
            <div className={`absolute inset-0 rounded-full border-4 transition-colors ${
              camera.isCapturingBurst
                ? 'border-accent-amber animate-spin border-t-transparent'
                : 'border-white/90 group-hover:border-rose-400'
            }`} />

            {/* Inner Shutter Core */}
            <div className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center ${
              camera.isCapturingBurst
                ? 'bg-accent-amber rounded-2xl w-8 h-8'
                : 'bg-rose-500 group-hover:bg-rose-600'
            }`}>
              <Camera className={`w-6 h-6 text-white transition-opacity ${
                camera.isCapturingBurst ? 'opacity-0' : 'opacity-100'
              }`} />
            </div>
          </button>
          
          <span className="text-[10px] text-slate-400 mt-1.5 font-medium tracking-wide">
            {camera.isCapturingBurst ? `Burst ${camera.burstProgress + 1}/4` : 'TAP OR SPACE'}
          </span>
        </div>

        {/* Right: Active Filter Badge Indicator */}
        <div className="w-20 flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Filter</span>
          <span className="text-xs font-semibold text-rose-300 mt-0.5 truncate max-w-[80px]">
            {activeFilter.name}
          </span>
        </div>
      </div>

    </div>
  );
}
