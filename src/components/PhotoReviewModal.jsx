import React, { useState } from 'react';
import { 
  RotateCcw, 
  Upload, 
  Trash2, 
  Check, 
  ArrowRight, 
  Camera, 
  Sparkles, 
  ArrowLeftRight,
  X
} from 'lucide-react';

export default function PhotoReviewModal({
  isOpen,
  onClose,
  photos = [],
  captureCount = 4,
  onRetakeShot,
  onReplaceShot,
  onDeleteShot,
  onSwapShots,
  onContinueToEditor,
}) {
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isRetaking, setIsRetaking] = useState(false);

  if (!isOpen) return null;

  const handleRetake = async (slotIndex) => {
    try {
      setIsRetaking(true);
      if (onRetakeShot) {
        await onRetakeShot(slotIndex);
      }
    } finally {
      setIsRetaking(false);
    }
  };

  const handleFileUpload = (slotIndex, e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && onReplaceShot) {
          onReplaceShot(slotIndex, {
            id: `photo_upload_${Date.now()}`,
            slotIndex,
            dataUrl: event.target.result,
            width: 1280,
            height: 960,
            timestamp: Date.now(),
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Photo file replace error:', err);
    }
  };

  const activePhoto = photos[selectedSlot];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[760px] bg-studio-950 border border-studio-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-studio-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Review & Retake Photos</h2>
              <p className="text-xs text-slate-400">Review your shots before designing the final strip</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onContinueToEditor}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              <span>Continue to Editor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Large Preview + Thumbnails */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Large View of Selected Slot */}
          <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {activePhoto?.dataUrl ? (
              <img
                src={activePhoto.dataUrl}
                alt={`Shot ${selectedSlot + 1}`}
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Camera className="w-12 h-12" />
                <p className="text-sm font-semibold">Slot {selectedSlot + 1} is empty</p>
              </div>
            )}

            {/* Quick Actions overlay on large preview */}
            <div className="absolute bottom-6 inset-x-6 flex items-center justify-center gap-3 pointer-events-auto">
              <button
                onClick={() => handleRetake(selectedSlot)}
                disabled={isRetaking}
                className="flex items-center gap-1.5 px-4 py-2 bg-studio-900/90 hover:bg-studio-800 text-white border border-white/15 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md transition-all active:scale-95"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-accent-amber ${isRetaking ? 'animate-spin' : ''}`} />
                <span>{isRetaking ? 'Retaking...' : `Retake Shot ${selectedSlot + 1}`}</span>
              </button>

              <label className="flex items-center gap-1.5 px-4 py-2 bg-studio-900/90 hover:bg-studio-800 text-white border border-white/15 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95">
                <Upload className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Replace File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(selectedSlot, e)}
                  className="hidden"
                />
              </label>

              {activePhoto && (
                <button
                  onClick={() => onDeleteShot && onDeleteShot(selectedSlot)}
                  className="p-2 bg-studio-900/90 hover:bg-rose-500/20 text-rose-400 border border-white/15 rounded-xl shadow-xl backdrop-blur-md transition-all active:scale-95"
                  title="Clear photo in this slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Side Thumbnails List for all shots */}
          <div className="w-full md:w-72 bg-studio-900/90 border-t md:border-t-0 md:border-l border-white/10 p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                All Photos ({photos.filter(Boolean).length} / {captureCount})
              </span>

              <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
                {Array.from({ length: captureCount }).map((_, idx) => {
                  const photo = photos[idx];
                  const isSelected = selectedSlot === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSlot(idx)}
                      className={`relative flex items-center gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 shadow-md'
                          : 'border-white/5 bg-studio-950/60 hover:bg-studio-800'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 relative border border-white/10">
                        {photo?.dataUrl ? (
                          <img src={photo.dataUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] font-mono text-slate-500">
                            Empty
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] font-mono text-white">
                          0{idx + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          Shot 0{idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {photo ? 'Captured' : 'Pending'}
                        </span>
                      </div>

                      {/* Move Up/Down button */}
                      {idx > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSwapShots) onSwapShots(idx, idx - 1);
                          }}
                          title="Swap with previous"
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={onContinueToEditor}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Looks Good, Open Editor</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
