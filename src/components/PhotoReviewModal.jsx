import React, { useState, useRef } from 'react';
import { 
  RotateCcw, 
  Upload, 
  Trash2, 
  Check, 
  ArrowRight, 
  Camera, 
  Sparkles, 
  ArrowLeftRight,
  ArrowUp,
  ArrowDown,
  X,
  Info,
  ZoomIn,
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
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const dragSourceRef = useRef(null);

  if (!isOpen) return null;

  const filledCount = photos.filter(Boolean).length;
  const hasEmptySlots = filledCount < captureCount;

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

      // Create image to get actual dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        if (onReplaceShot) {
          onReplaceShot(slotIndex, {
            id: `photo_upload_${Date.now()}`,
            slotIndex,
            dataUrl: objectUrl,
            blob: file,
            width: img.naturalWidth || img.width || 1280,
            height: img.naturalHeight || img.height || 960,
            mimeType: file.type || 'image/jpeg',
            captureMethod: 'file-upload',
            timestamp: Date.now(),
          });
        }
      };
      img.onerror = () => {
        // Fallback: use FileReader for data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && onReplaceShot) {
            onReplaceShot(slotIndex, {
              id: `photo_upload_${Date.now()}`,
              slotIndex,
              dataUrl: event.target.result,
              width: 1280,
              height: 960,
              captureMethod: 'file-upload',
              timestamp: Date.now(),
            });
          }
        };
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    } catch (err) {
      console.warn('Photo file replace error:', err);
    }
  };

  // Drag & drop reorder handlers
  const handleDragStart = (idx) => {
    dragSourceRef.current = idx;
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverSlot(idx);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    setDragOverSlot(null);
    const sourceIdx = dragSourceRef.current;
    if (sourceIdx !== null && sourceIdx !== targetIdx && onSwapShots) {
      onSwapShots(sourceIdx, targetIdx);
    }
    dragSourceRef.current = null;
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
              <p className="text-xs text-slate-400">
                {filledCount}/{captureCount} photos captured
                {hasEmptySlots && (
                  <span className="ml-1.5 text-amber-400 font-semibold">
                    — {captureCount - filledCount} empty slot{captureCount - filledCount > 1 ? 's' : ''}
                  </span>
                )}
              </p>
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
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {activePhoto?.dataUrl ? (
              <>
                <img
                  src={activePhoto.dataUrl}
                  alt={`Shot ${selectedSlot + 1}`}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                />
                {/* Photo metadata badge */}
                {activePhoto.width && activePhoto.height && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-slate-300 font-mono">
                    <ZoomIn className="w-3 h-3 text-accent-cyan" />
                    <span>{activePhoto.width}×{activePhoto.height}</span>
                    {activePhoto.captureMethod && (
                      <>
                        <span className="text-white/20">|</span>
                        <span className="text-emerald-400">{activePhoto.captureMethod}</span>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Camera className="w-12 h-12" />
                <p className="text-sm font-semibold">Slot {selectedSlot + 1} is empty</p>
                <p className="text-xs text-slate-600 max-w-xs text-center">
                  Retake using the camera or upload a file to fill this slot.
                </p>
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
                All Photos ({filledCount} / {captureCount})
              </span>

              {/* Empty slot warning */}
              {hasEmptySlots && (
                <div className="mb-2.5 flex items-start gap-1.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-300">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    {captureCount - filledCount} slot{captureCount - filledCount > 1 ? 's are' : ' is'} empty. 
                    Tap an empty slot to retake or upload a photo.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
                {Array.from({ length: captureCount }).map((_, idx) => {
                  const photo = photos[idx];
                  const isSelected = selectedSlot === idx;
                  const isDragOver = dragOverSlot === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSlot(idx)}
                      draggable={!!photo}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`relative flex items-center gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                        isDragOver
                          ? 'border-accent-cyan bg-accent-cyan/10 shadow-md scale-[1.02]'
                          : isSelected
                            ? 'border-rose-500 bg-rose-500/10 shadow-md'
                            : photo
                              ? 'border-white/5 bg-studio-950/60 hover:bg-studio-800'
                              : 'border-dashed border-white/15 bg-studio-950/30 hover:bg-studio-800/50'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 relative border border-white/10">
                        {photo?.dataUrl ? (
                          <img src={photo.dataUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-slate-600" />
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
                        <span className={`text-[10px] block ${
                          photo ? 'text-emerald-400' : 'text-amber-400 font-semibold'
                        }`}>
                          {photo ? '✓ Captured' : '◯ Empty — Retake'}
                        </span>
                      </div>

                      {/* Move Up/Down buttons */}
                      <div className="flex flex-col gap-0.5">
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSwapShots) onSwapShots(idx, idx - 1);
                            }}
                            title="Move up"
                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                        )}
                        {idx < captureCount - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSwapShots) onSwapShots(idx, idx + 1);
                            }}
                            title="Move down"
                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        )}
                      </div>
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
