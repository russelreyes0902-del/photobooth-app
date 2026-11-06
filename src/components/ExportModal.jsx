import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { renderPhotoStrip } from '../utils/canvasCompositor';
import { createAnimatedGif } from '../utils/gifGenerator';
import { createExportVideo } from '../utils/videoGenerator';
import { FILTERS } from '../utils/filters';
import { playCelebrationSound } from '../utils/audio';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Sparkles, 
  Film, 
  Video,
  Image as ImageIcon,
  Wand2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function ExportModal({
  isOpen,
  onClose,
  template,
  photos = [],
  sessionVideo = null,
  filterId: initialFilterId,
  paperColor,
  onUpdateFilter,
}) {
  const [activeTab, setActiveTab] = useState('strip'); // 'strip' | 'video' | 'gif'
  const [filterId, setFilterId] = useState(initialFilterId);
  const [customText, setCustomText] = useState('');
  
  // GIF state
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [gifUrl, setGifUrl] = useState(null);

  // Video state (defaults to live session video if recorded)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoExt, setVideoExt] = useState('mp4');

  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const canvasRef = useRef(null);
  const videoElemRef = useRef(null);

  // Sync filterId with prop
  useEffect(() => {
    setFilterId(initialFilterId);
  }, [initialFilterId]);

  // Sync live session video if provided by camera
  useEffect(() => {
    if (sessionVideo && sessionVideo.url) {
      setVideoUrl(sessionVideo.url);
      setVideoBlob(sessionVideo.blob);
      setVideoExt(sessionVideo.ext || 'mp4');
    }
  }, [sessionVideo]);

  // Confetti celebration when modal opens
  useEffect(() => {
    if (isOpen && photos.length >= 4) {
      try {
        playCelebrationSound();
      } catch (e) {}
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6b95', '#b36bff', '#38d9a9', '#fcc419', '#ffffff'],
        });
      } catch (err) {
        console.debug('Confetti error', err);
      }
    }
  }, [isOpen, photos.length]);

  // Re-render strip when filter, text, or template changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !template) return;
    try {
      renderPhotoStrip({
        canvas: canvasRef.current,
        template,
        photos,
        filterId,
        paperColor,
        dateStamp: true,
        customFooterText: customText,
      }).catch(err => {
        console.warn('renderPhotoStrip caught warning in modal:', err);
      });
    } catch (err) {
      console.error('Modal render error:', err);
    }
  }, [isOpen, template, photos, filterId, paperColor, customText]);

  // Generate GIF when GIF tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'gif' && !gifUrl && photos.length > 0) {
      let isCancelled = false;
      const generate = async () => {
        setIsGeneratingGif(true);
        setGifProgress(10);
        setErrorMessage(null);
        try {
          const res = await createAnimatedGif({
            photos,
            filterId,
            width: 540,
            height: 405,
            frameDelayMs: 500,
            onProgress: (p) => {
              if (!isCancelled) setGifProgress(p);
            },
          });
          if (!isCancelled && res) {
            setGifUrl(res.url);
          }
        } catch (err) {
          console.error('Failed to create GIF safely:', err);
          if (!isCancelled) {
            setErrorMessage('Unable to encode animated GIF. Please try again.');
          }
        } finally {
          if (!isCancelled) setIsGeneratingGif(false);
        }
      };
      generate();
      return () => {
        isCancelled = true;
      };
    }
  }, [isOpen, activeTab, gifUrl, photos, filterId]);

  // Generate Video if not recorded during session
  useEffect(() => {
    if (isOpen && activeTab === 'video' && !videoUrl && photos.length > 0) {
      let isCancelled = false;
      const generateVideo = async () => {
        setIsGeneratingVideo(true);
        setVideoProgress(5);
        setErrorMessage(null);
        try {
          const res = await createExportVideo({
            photos,
            filterId,
            width: 720,
            height: 960,
            durationSec: 4,
            onProgress: (p) => {
              if (!isCancelled) setVideoProgress(p);
            },
          });
          if (!isCancelled && res) {
            setVideoUrl(res.url);
            setVideoBlob(res.blob);
            setVideoExt(res.ext || 'mp4');
          }
        } catch (err) {
          console.error('Failed to create video safely:', err);
          if (!isCancelled) {
            setErrorMessage('Unable to encode video.');
          }
        } finally {
          if (!isCancelled) setIsGeneratingVideo(false);
        }
      };
      generateVideo();
      return () => {
        isCancelled = true;
      };
    }
  }, [isOpen, activeTab, videoUrl, photos, filterId]);

  // When filter changes, invalidate cached gif
  const handleFilterChange = (fId) => {
    try {
      setFilterId(fId);
      if (onUpdateFilter) onUpdateFilter(fId);
      if (gifUrl) {
        URL.revokeObjectURL(gifUrl);
        setGifUrl(null);
      }
    } catch (err) {
      console.warn('Filter change error:', err);
    }
  };

  // Download High-Res PNG
  const handleDownloadPng = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setErrorMessage('Canvas is not ready for download.');
        return;
      }
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `retrobooth-strip-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setStatusMessage('PNG downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('Download PNG caught error:', err);
      setErrorMessage('Could not export PNG. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Download JPG
  const handleDownloadJpg = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setErrorMessage('Canvas is not ready for download.');
        return;
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `retrobooth-strip-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      setStatusMessage('JPG downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('Download JPG caught error:', err);
      setErrorMessage('Could not export JPG. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Download Video
  const handleDownloadVideo = () => {
    try {
      if (!videoUrl) {
        setErrorMessage('Video is still processing, please wait a moment.');
        return;
      }
      const link = document.createElement('a');
      link.download = `retrobooth-live-video-${Date.now()}.${videoExt}`;
      link.href = videoUrl;
      link.click();
      setStatusMessage(`Live Video (${videoExt.toUpperCase()}) downloaded successfully!`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('Download Video caught error:', err);
      setErrorMessage('Could not download video.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Download GIF
  const handleDownloadGif = () => {
    try {
      if (!gifUrl) {
        setErrorMessage('GIF is still generating, please wait a moment.');
        return;
      }
      const link = document.createElement('a');
      link.download = `retrobooth-animation-${Date.now()}.gif`;
      link.href = gifUrl;
      link.click();
      setStatusMessage('GIF downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('Download GIF caught error:', err);
      setErrorMessage('Could not download GIF.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Native Web Share API (supports sharing images or live videos to iPhone/iPad camera roll!)
  const handleShare = async () => {
    try {
      if (!navigator.share) {
        setStatusMessage('Web Share is not supported in this browser.');
        setTimeout(() => setStatusMessage(null), 2500);
        return;
      }

      if (activeTab === 'video' && videoBlob) {
        // Share live video file directly to camera roll / Instagram
        const file = new File([videoBlob], `retrobooth-video-${Date.now()}.${videoExt}`, {
          type: videoBlob.type || 'video/mp4',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My 4-Cut Photobooth Live Video',
            text: 'Live photobooth countdown & photo session! 🎬✨',
            files: [file],
          });
          return;
        }
      }

      // Default share photo strip
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        try {
          if (!blob) return;
          const file = new File([blob], `retrobooth-${Date.now()}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My 4-Cut Photobooth Strip',
              text: 'Taken at RetroBooth Studio! 📸✨',
              files: [file],
            });
          } else {
            await navigator.share({
              title: 'My 4-Cut Photobooth Strip',
              text: 'Taken at RetroBooth Studio! 📸✨',
            });
          }
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Web Share dialog dismissed or errored:', shareErr);
          }
        }
      });
    } catch (err) {
      console.warn('Web Share error:', err);
    }
  };

  // Copy Image to Clipboard
  const handleCopy = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        setStatusMessage('Direct clipboard copy is not supported in this browser.');
        setTimeout(() => setStatusMessage(null), 2500);
        return;
      }

      canvas.toBlob(async (blob) => {
        try {
          if (!blob) return;
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setStatusMessage('Copied to Clipboard!');
          setTimeout(() => setStatusMessage(null), 2500);
        } catch (blobCopyErr) {
          console.warn('Clipboard write warning:', blobCopyErr);
          setStatusMessage('Copy blocked by browser permissions.');
          setTimeout(() => setStatusMessage(null), 2500);
        }
      });
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      setStatusMessage('Copy not supported on this browser');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl select-none animate-fade-in">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl h-full max-h-[92dvh] flex flex-col md:flex-row bg-studio-900 border border-studio-700/80 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={() => {
            try { onClose(); } catch (e) {}
          }}
          className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ============================================================ */}
        {/* LEFT / CENTER: VISUAL PREVIEW AREA */}
        {/* ============================================================ */}
        <div className="relative flex-1 flex flex-col items-center justify-center p-4 bg-studio-950/70 border-b md:border-b-0 md:border-r border-white/5 min-h-0 overflow-hidden">
          
          {/* Format Toggle Tabs: Strip vs Live Video vs GIF */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 mb-3 z-10">
            <button
              onClick={() => setActiveTab('strip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'strip'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Strip (PNG/JPG)</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Live Video (MP4)</span>
            </button>
            <button
              onClick={() => setActiveTab('gif')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gif'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-accent-amber" />
              <span>GIF Loop</span>
            </button>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="relative flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden">
            {activeTab === 'strip' ? (
              <div className="relative h-full aspect-[1/2.83] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : activeTab === 'video' ? (
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black flex items-center justify-center">
                {isGeneratingVideo ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-300">
                      Processing Live Video... {videoProgress}%
                    </p>
                  </div>
                ) : videoUrl ? (
                  <video
                    ref={videoElemRef}
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-slate-400">Ready to play video</p>
                )}
              </div>
            ) : (
              <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black flex items-center justify-center">
                {isGeneratingGif ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-300">
                      Encoding Looping GIF... {gifProgress}%
                    </p>
                  </div>
                ) : gifUrl ? (
                  <img
                    src={gifUrl}
                    alt="Animated Photobooth Sequence"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-slate-400">Ready to encode GIF</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT: CUSTOMIZATION & DOWNLOAD ACTIONS */}
        {/* ============================================================ */}
        <div className="w-full md:w-80 flex flex-col justify-between p-5 bg-studio-900 overflow-y-auto">
          
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Strip Complete!</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Save & Download</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'video'
                  ? 'Real live video recording from countdown to photos taken!'
                  : 'Export in full resolution image or looping animated GIF.'}
              </p>
            </div>

            {/* Custom Text / Event Tag Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Custom Footer Text / Tag</span>
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. EMILY & ALEX • NYC 2026"
                className="w-full px-3 py-2 bg-studio-950 border border-studio-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                maxLength={40}
              />
            </div>

            {/* Post-Capture Filter Switcher */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-accent-purple" />
                  <span>Post-Capture Filter</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {FILTERS.map((f) => {
                  const isSel = f.id === filterId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFilterChange(f.id)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold truncate transition-all border ${
                        isSel
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                          : 'bg-studio-950 text-slate-300 border-studio-700/60 hover:bg-studio-800'
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DOWNLOAD ACTION BUTTONS */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5">
            {statusMessage && (
              <div className="text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-1.5 rounded-xl border border-emerald-500/20">
                {statusMessage}
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {activeTab === 'strip' ? (
              <>
                <button
                  onClick={handleDownloadPng}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download High-Res PNG (1200x3600)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadJpg}
                    className="py-2.5 px-3 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5 text-accent-amber" />
                    <span>Download JPG</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="py-2.5 px-3 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all active:scale-[0.98]"
                  >
                    <Copy className="w-3.5 h-3.5 text-accent-cyan" />
                    <span>Copy Image</span>
                  </button>
                </div>
              </>
            ) : activeTab === 'video' ? (
              <button
                onClick={handleDownloadVideo}
                disabled={!videoUrl || isGeneratingVideo}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  videoUrl && !isGeneratingVideo
                    ? 'bg-gradient-to-r from-accent-cyan to-blue-500 hover:opacity-95 text-white shadow-cyan-500/25 active:scale-[0.98]'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download Live Video ({videoExt.toUpperCase()})</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadGif}
                disabled={!gifUrl || isGeneratingGif}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  gifUrl && !isGeneratingGif
                    ? 'bg-gradient-to-r from-accent-purple to-pink-500 hover:opacity-95 text-white shadow-purple-500/25 active:scale-[0.98]'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download Animated Looping GIF</span>
              </button>
            )}

            {/* Native Mobile Share Button (Saves Video / Strip to Camera Roll on iOS/iPadOS) */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleShare}
                className="w-full py-2.5 px-4 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-[0.98]"
              >
                <Share2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Save to Camera Roll / Share</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
