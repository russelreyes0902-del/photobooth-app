import React, { useEffect, useRef, useState } from 'react';
import { renderPhotoStrip } from '../utils/canvasCompositor';
import { RotateCcw, Sparkles, Eye } from 'lucide-react';

export default function PhotoStripCanvas({
  template,
  photos = [],
  filterId = 'normal',
  paperColor = '#ffffff',
  onResetPhotos,
  onOpenExport,
}) {
  const canvasRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current || !template) return;
      setIsRendering(true);
      try {
        await renderPhotoStrip({
          canvas: canvasRef.current,
          template,
          photos,
          filterId,
          paperColor,
          dateStamp: true,
        });
      } catch (err) {
        console.warn('PhotoStripCanvas render safe caught error:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [template, photos, filterId, paperColor]);

  const hasPhotos = Array.isArray(photos) && photos.length > 0;
  const isComplete = Array.isArray(photos) && photos.length >= 4;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3 bg-studio-900/90 backdrop-blur-md rounded-3xl border border-studio-700/60 shadow-xl overflow-hidden">
      
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Strip Preview
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
            {photos.length}/4
          </span>
        </div>

        {hasPhotos && (
          <button
            onClick={() => {
              try { if (onResetPhotos) onResetPhotos(); } catch (e) {}
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Main Canvas Display Area */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 min-h-0 overflow-hidden">
        {/* Strip container with photobooth drop shadow */}
        <div className="relative h-full max-h-full aspect-[1/2.83] rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.7)] border border-white/15 bg-studio-950 transition-all duration-300">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />

          {isRendering && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
          )}

          {!hasPhotos && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 mb-2">
                <Sparkles className="w-5 h-5 text-accent-pink animate-pulse" />
              </div>
              <p className="text-xs font-bold text-white/90">Your 4-Cut Strip</p>
              <p className="text-[10px] text-white/50 mt-1">Photos will appear here live as you capture them!</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="w-full pt-2 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            try { if (onOpenExport) onOpenExport(); } catch (e) {}
          }}
          disabled={!hasPhotos}
          className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
            hasPhotos
              ? isComplete
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/25 animate-pulse-subtle'
                : 'bg-studio-700 hover:bg-studio-600 text-white'
              : 'bg-white/5 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isComplete ? (
            <>
              <Sparkles className="w-4 h-4 text-accent-amber animate-spin" />
              <span>Finish & Export Strip (1200x3600)</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>{hasPhotos ? `View Progress (${photos.length}/4)` : 'Take 4 Photos'}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
