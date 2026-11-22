import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { renderPhotoStrip } from '../utils/canvasCompositor.js';
import { createAnimatedGif } from '../utils/gifGenerator.js';
import { createExportVideo, VIDEO_RESOLUTIONS, verifyVideoBlob } from '../utils/videoGenerator.js';
import { FILTERS } from '../utils/filters.js';
import { playCelebrationSound } from '../utils/audio.js';
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
  AlertCircle,
  Printer,
  Smartphone,
  Eye,
  RotateCw,
} from 'lucide-react';

/**
 * Helper to determine if running on iOS or iPadOS (including iPad Pro desktop UA)
 */
const isIOSDevice = () => {
  return (
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  );
};

/**
 * Synchronously converts a base64 Data URL to a native File object.
 * Critical for iPad Safari so navigator.share is invoked synchronously within user gesture!
 */
function dataUrlToFile(dataUrl, filename) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(parts[1]);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new File([buffer], filename, { type: mime });
}

export default function ExportModal({
  isOpen,
  onClose,
  template,
  photos = [],
  sessionVideo = null,
  filterId: initialFilterId = 'normal',
  filterIntensity: initialFilterIntensity = 100,
  adjustments: initialAdjustments = {},
  photoTransforms: initialPhotoTransforms = {},
  paperColor = '#ffffff',
  paperPattern = 'none',
  borders = { width: 0, color: '#ffffff', radius: 14 },
  stickers = [],
  texts = [],
  onUpdateFilter,
  onOpenPrintStudio,
}) {
  const [activeTab, setActiveTab] = useState('strip'); // 'strip' | 'video' | 'gif'
  const [filterId, setFilterId] = useState(initialFilterId);
  const [filterIntensity, setFilterIntensity] = useState(initialFilterIntensity);
  const [customText, setCustomText] = useState('');
  
  // GIF state
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [gifUrl, setGifUrl] = useState(null);

  // Video state & configuration
  const [videoSourceMode, setVideoSourceMode] = useState(sessionVideo ? 'live' : 'slideshow'); // 'live' | 'slideshow'
  const [videoResolution, setVideoResolution] = useState('match-source');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoExt, setVideoExt] = useState('mp4');
  const [videoMetadata, setVideoMetadata] = useState(null);

  // iOS / iPad dedicated save sheet modal
  const [showIosSaveModal, setShowIosSaveModal] = useState(false);
  const [iosImageDataUrl, setIosImageDataUrl] = useState(null);

  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const canvasRef = useRef(null);
  const videoElemRef = useRef(null);
  const activeGifUrlRef = useRef(null);
  const activeVideoUrlRef = useRef(null);

  // Sync initial filterId
  useEffect(() => {
    setFilterId(initialFilterId);
    setFilterIntensity(initialFilterIntensity);
  }, [initialFilterId, initialFilterIntensity]);

  // Sync live session video if provided by camera
  useEffect(() => {
    if (sessionVideo && sessionVideo.url) {
      if (videoSourceMode === 'live') {
        setVideoUrl(sessionVideo.url);
        setVideoBlob(sessionVideo.blob);
        setVideoExt(sessionVideo.ext || 'mp4');
        activeVideoUrlRef.current = sessionVideo.url;

        if (sessionVideo.blob) {
          verifyVideoBlob(sessionVideo.blob)
            .then((meta) => {
              setVideoMetadata({
                width: meta.width || sessionVideo.width || 1920,
                height: meta.height || sessionVideo.height || 1080,
                duration: meta.duration || 0,
                sizeBytes: sessionVideo.blob.size,
                mimeType: sessionVideo.blob.type,
                type: 'Live Camera Recording (Countdown & Photos)',
              });
            })
            .catch(() => {});
        }
      }
    }
  }, [sessionVideo, videoSourceMode]);

  // Invalidate generated media when source photos or filter changes
  useEffect(() => {
    if (gifUrl) {
      try { URL.revokeObjectURL(gifUrl); } catch (e) {}
      setGifUrl(null);
      activeGifUrlRef.current = null;
    }
  }, [photos, filterId, filterIntensity]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (activeGifUrlRef.current) {
        try { URL.revokeObjectURL(activeGifUrlRef.current); } catch (e) {}
      }
    };
  }, []);

  // Confetti celebration when modal opens
  useEffect(() => {
    if (isOpen && photos.length >= 1) {
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
      } catch (err) {}
    }
  }, [isOpen, photos.length]);

  // Re-render strip when filter, text, or template changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !template) return;
    const cancelToken = { isCancelled: false };

    renderPhotoStrip({
      canvas: canvasRef.current,
      template,
      photos,
      filterId,
      filterIntensity,
      adjustments: initialAdjustments,
      photoTransforms: initialPhotoTransforms,
      paperColor,
      paperPattern,
      borders,
      stickers,
      texts,
      dateStamp: true,
      customFooterText: customText,
      cancelToken,
    }).catch(err => {
      console.warn('renderPhotoStrip caught warning in modal:', err);
    });

    return () => {
      cancelToken.isCancelled = true;
    };
  }, [isOpen, template, photos, filterId, filterIntensity, initialAdjustments, initialPhotoTransforms, paperColor, paperPattern, borders, stickers, texts, customText]);

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
            filterIntensity,
            adjustments: initialAdjustments,
            width: 540,
            height: 405,
            frameDelayMs: 500,
            onProgress: (p) => {
              if (!isCancelled) setGifProgress(p);
            },
          });
          if (!isCancelled && res) {
            setGifUrl(res.url);
            activeGifUrlRef.current = res.url;
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
  }, [isOpen, activeTab, gifUrl, photos, filterId, filterIntensity, initialAdjustments]);

  // Generate Slideshow Video with user-selected resolution
  const handleGenerateSlideshowVideo = async (targetPreset = videoResolution) => {
    if (!photos || photos.length === 0) return;
    setIsGeneratingVideo(true);
    setVideoProgress(5);
    setErrorMessage(null);
    try {
      const res = await createExportVideo({
        photos,
        filterId,
        filterIntensity,
        adjustments: initialAdjustments,
        resolutionPreset: targetPreset,
        durationSec: 4,
        onProgress: (p) => setVideoProgress(p),
      });

      if (res) {
        setVideoUrl(res.url);
        setVideoBlob(res.blob);
        setVideoExt(res.ext || 'mp4');
        activeVideoUrlRef.current = res.url;
        setVideoMetadata({
          width: res.width,
          height: res.height,
          duration: res.durationSec,
          sizeBytes: res.sizeBytes,
          mimeType: res.mimeType,
          type: 'Photo Slideshow Video',
        });
      }
    } catch (err) {
      console.error('Failed to create slideshow video safely:', err);
      setErrorMessage('Unable to encode video.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Generate video when video tab is opened and no video is loaded
  useEffect(() => {
    if (isOpen && activeTab === 'video') {
      if (videoSourceMode === 'live' && sessionVideo?.url) {
        setVideoUrl(sessionVideo.url);
        setVideoBlob(sessionVideo.blob);
        setVideoExt(sessionVideo.ext || 'mp4');
      } else if (!videoUrl && photos.length > 0) {
        handleGenerateSlideshowVideo(videoResolution);
      }
    }
  }, [isOpen, activeTab, videoSourceMode, sessionVideo]);

  // Switch between Live Recording & Slideshow Video
  const handleSelectVideoMode = (mode) => {
    setVideoSourceMode(mode);
    if (mode === 'live' && sessionVideo) {
      setVideoUrl(sessionVideo.url);
      setVideoBlob(sessionVideo.blob);
      setVideoExt(sessionVideo.ext || 'mp4');
      if (sessionVideo.blob) {
        verifyVideoBlob(sessionVideo.blob)
          .then((meta) => {
            setVideoMetadata({
              width: meta.width || sessionVideo.width || 1920,
              height: meta.height || sessionVideo.height || 1080,
              duration: meta.duration || 0,
              sizeBytes: sessionVideo.blob.size,
              mimeType: sessionVideo.blob.type,
              type: 'Live Camera Recording (Countdown & Photos)',
            });
          })
          .catch(() => {});
      }
    } else if (mode === 'slideshow') {
      handleGenerateSlideshowVideo(videoResolution);
    }
  };

  // Safe file downloader for desktop and fallback
  const downloadBlobOrShare = async (blob, filename, mimeType, successMsg) => {
    try {
      if (!blob) throw new Error('No data blob available to download');

      const isIOS = isIOSDevice();

      // On iOS Safari, Web Share API with File object
      if (isIOS && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: mimeType });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'RetroBooth Strip',
            });
            setStatusMessage('Saved / Shared successfully!');
            setTimeout(() => setStatusMessage(null), 2500);
            return;
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return;
        }
      }

      // Standard desktop fallback via object URL
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up after 60 seconds (never premature revoke on iOS)
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch (cleanErr) {}
      }, 60000);

      setStatusMessage(successMsg || 'Downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('downloadBlobOrShare error:', err);
      setErrorMessage('Could not export file.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // ============================================================
  // HIGH-RES PNG DOWNLOAD (WITH IPAD / SAFARI BULLETPROOF FIX)
  // ============================================================
  const handleDownloadPng = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setErrorMessage('Canvas is not ready for download.');
        return;
      }

      // Synchronously generate high-resolution PNG data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const filename = `retrobooth-strip-${Date.now()}.png`;

      // Synchronously create native File object
      const file = dataUrlToFile(dataUrl, filename);

      if (isIOSDevice()) {
        // In iOS Safari, invoke native Share Sheet synchronously:
        // This opens the native iOS Share Sheet immediately allowing 1-tap "Save Image" straight into Photos!
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'RetroBooth Photostrip',
            });
            setStatusMessage('Saved to Photos / Shared successfully!');
            setTimeout(() => setStatusMessage(null), 3000);
            return;
          } catch (shareErr) {
            if (shareErr.name === 'AbortError') return; // User closed sheet
            console.warn('Native share sheet error, showing iPad save dialog:', shareErr);
          }
        }

        // If Web Share is cancelled, not allowed, or on iPadOS fallback:
        // Display dedicated iPad Save Sheet with direct image so user can long-press "Save to Photos"!
        setIosImageDataUrl(dataUrl);
        setShowIosSaveModal(true);
        return;
      }

      // Desktop / Android: Seamless direct download
      const blob = new Blob([file], { type: 'image/png' });
      await downloadBlobOrShare(blob, filename, 'image/png', 'PNG downloaded successfully!');
    } catch (err) {
      console.error('Download PNG caught error:', err);
      setErrorMessage('Could not export PNG. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Download JPG
  const handleDownloadJpg = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
      const filename = `retrobooth-strip-${Date.now()}.jpg`;
      const file = dataUrlToFile(dataUrl, filename);

      if (isIOSDevice()) {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'RetroBooth Strip' });
            setStatusMessage('Saved to Photos / Shared successfully!');
            setTimeout(() => setStatusMessage(null), 3000);
            return;
          } catch (e) {
            if (e.name === 'AbortError') return;
          }
        }
        setIosImageDataUrl(dataUrl);
        setShowIosSaveModal(true);
        return;
      }

      const blob = new Blob([file], { type: 'image/jpeg' });
      await downloadBlobOrShare(blob, filename, 'image/jpeg', 'JPG downloaded successfully!');
    } catch (err) {
      console.error('Download JPG caught error:', err);
      setErrorMessage('Could not export JPG.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Download WebP
  const handleDownloadWebp = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/webp', 0.92);
      if (!dataUrl.startsWith('data:image/webp')) {
        return handleDownloadJpg();
      }
      const filename = `retrobooth-strip-${Date.now()}.webp`;
      const file = dataUrlToFile(dataUrl, filename);

      if (isIOSDevice()) {
        setIosImageDataUrl(dataUrl);
        setShowIosSaveModal(true);
        return;
      }

      const blob = new Blob([file], { type: 'image/webp' });
      await downloadBlobOrShare(blob, filename, 'image/webp', 'WebP downloaded successfully!');
    } catch (e) {
      handleDownloadJpg();
    }
  };

  // Download Video
  const handleDownloadVideo = async () => {
    try {
      if (!videoBlob && !videoUrl) {
        setErrorMessage('Video is still processing, please wait a moment.');
        return;
      }
      const filename = `retrobooth-${videoSourceMode === 'live' ? 'live-video' : 'slideshow'}-${Date.now()}.${videoExt}`;
      const mimeType = videoBlob?.type || (videoExt === 'mp4' ? 'video/mp4' : 'video/webm');

      if (videoBlob) {
        await downloadBlobOrShare(
          videoBlob,
          filename,
          mimeType,
          `Video (${videoExt.toUpperCase()}) downloaded successfully!`
        );
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = videoUrl;
        link.click();
        setStatusMessage(`Video (${videoExt.toUpperCase()}) downloaded successfully!`);
        setTimeout(() => setStatusMessage(null), 2500);
      }
    } catch (err) {
      console.error('Download Video caught error:', err);
      setErrorMessage('Could not download video.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Download GIF
  const handleDownloadGif = async () => {
    try {
      if (!gifUrl) {
        setErrorMessage('GIF is still generating, please wait a moment.');
        return;
      }
      const response = await fetch(gifUrl);
      const blob = await response.blob();
      await downloadBlobOrShare(
        blob,
        `retrobooth-animation-${Date.now()}.gif`,
        'image/gif',
        'GIF downloaded successfully!'
      );
    } catch (err) {
      console.error('Download GIF caught error:', err);
      setErrorMessage('Could not download GIF.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Native Web Share API
  const handleShare = async () => {
    try {
      if (!navigator.share) {
        setStatusMessage('Web Share is not supported in this browser.');
        setTimeout(() => setStatusMessage(null), 2500);
        return;
      }

      if (activeTab === 'video' && videoBlob) {
        const file = new File([videoBlob], `retrobooth-video-${Date.now()}.${videoExt}`, {
          type: videoBlob.type || 'video/mp4',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My RetroBooth Video',
            text: 'Live photobooth recording! 🎬✨',
            files: [file],
          });
          return;
        }
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const file = dataUrlToFile(dataUrl, `retrobooth-${Date.now()}.png`);

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
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share error:', err);
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl h-[95vh] max-h-[820px] bg-studio-900 border border-studio-700 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
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
          
          {/* Format Toggle Tabs: Strip vs Video vs GIF */}
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
              <span>Video ({videoExt.toUpperCase()})</span>
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
          <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-0 overflow-hidden">
            {activeTab === 'strip' ? (
              <div className="relative h-full aspect-[1/2.83] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : activeTab === 'video' ? (
              <div className="relative flex-1 w-full max-w-sm flex flex-col items-center justify-center min-h-0">
                <div className="relative w-full aspect-[3/4] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black flex items-center justify-center">
                  {isGeneratingVideo ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                      <p className="text-xs font-semibold text-slate-300">
                        Encoding Video... {videoProgress}%
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

                {/* Video Metadata Verification Card */}
                {videoMetadata && (
                  <div className="mt-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-[10px] text-slate-300">
                    <span className="font-mono text-emerald-400 font-bold">{videoMetadata.width}×{videoMetadata.height}</span>
                    <span>•</span>
                    <span>{videoMetadata.duration ? `${videoMetadata.duration.toFixed(1)}s` : '4.0s'}</span>
                    <span>•</span>
                    <span>{(videoMetadata.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    <span>•</span>
                    <span className="uppercase text-accent-cyan font-bold">{videoExt}</span>
                  </div>
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
                  ? 'Real camera recording & resolution-matched video export.'
                  : 'Export in full resolution image, video, or looping GIF.'}
              </p>
            </div>

            {/* If on Video Tab: Video Configuration Controls */}
            {activeTab === 'video' && (
              <div className="flex flex-col gap-3 p-3 bg-studio-950/80 rounded-2xl border border-white/10">
                {/* Source Selection: Live Session vs Slideshow */}
                {sessionVideo && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1.5">
                      Video Source
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleSelectVideoMode('live')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                          videoSourceMode === 'live'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        Live Recording
                      </button>
                      <button
                        onClick={() => handleSelectVideoMode('slideshow')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                          videoSourceMode === 'slideshow'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        Photo Slideshow
                      </button>
                    </div>
                  </div>
                )}

                {/* Resolution Selector for Slideshow Video */}
                {videoSourceMode === 'slideshow' && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan block mb-1.5">
                      Video Resolution
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={videoResolution}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVideoResolution(val);
                          handleGenerateSlideshowVideo(val);
                        }}
                        className="w-full bg-studio-900 border border-white/15 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl outline-none"
                      >
                        <option value="match-source">Match Photos (Camera Resolution)</option>
                        <option value="fhd-portrait">Portrait FHD (1080×1920) 9:16</option>
                        <option value="fhd-landscape">Full HD (1920×1080) 16:9</option>
                        <option value="square">Square (1080×1080) 1:1</option>
                        <option value="hd-landscape">HD (1280×720) 16:9</option>
                      </select>
                      <button
                        onClick={() => handleGenerateSlideshowVideo(videoResolution)}
                        disabled={isGeneratingVideo}
                        className="w-full py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <RotateCw className={`w-3 h-3 text-accent-amber ${isGeneratingVideo ? 'animate-spin' : ''}`} />
                        <span>Regenerate Slideshow</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                {FILTERS.slice(0, 6).map((f) => {
                  const isSel = f.id === filterId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFilterId(f.id);
                        if (onUpdateFilter) onUpdateFilter(f.id);
                      }}
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
          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
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
                  <span>Download High-Res PNG</span>
                </button>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={handleDownloadJpg}
                    className="py-2 px-2 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-white/10 active:scale-[0.98]"
                  >
                    <span>JPG</span>
                  </button>

                  <button
                    onClick={handleDownloadWebp}
                    className="py-2 px-2 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-white/10 active:scale-[0.98]"
                  >
                    <span>WebP</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="py-2 px-2 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-white/10 active:scale-[0.98]"
                  >
                    <Copy className="w-3.5 h-3.5 text-accent-cyan" />
                    <span>Copy</span>
                  </button>
                </div>

                {/* Print Studio Button */}
                <button
                  onClick={() => {
                    if (onOpenPrintStudio && canvasRef.current) {
                      onOpenPrintStudio(canvasRef.current);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4 text-accent-amber" />
                  <span>Print Studio (4×6" / A4 / 300 DPI)</span>
                </button>
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
                <span>Download Video ({videoExt.toUpperCase()})</span>
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

            {/* Native Mobile Share Button */}
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

      {/* ============================================================ */}
      {/* IPAD / IOS BULLETPROOF SAVE SHEET MODAL */}
      {/* ============================================================ */}
      {showIosSaveModal && iosImageDataUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-studio-900 border border-studio-700 rounded-3xl p-5 flex flex-col items-center gap-4 shadow-2xl">
            <button
              onClick={() => setShowIosSaveModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-rose-400">
              <Smartphone className="w-5 h-5" />
              <h3 className="text-sm font-extrabold text-white">Save Photo Strip to iPad / iPhone</h3>
            </div>

            <div className="p-2 bg-studio-950 rounded-2xl border border-white/10 max-h-[50vh] flex items-center justify-center overflow-hidden">
              <img
                src={iosImageDataUrl}
                alt="Rendered Photo Strip"
                className="max-h-[46vh] object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="w-full bg-studio-800/80 p-3 rounded-2xl border border-white/10 text-center">
              <p className="text-xs font-bold text-white mb-1">
                📸 Tap & Hold the Strip Above
              </p>
              <p className="text-[11px] text-slate-300">
                Press and hold the image, then select <strong className="text-emerald-400">"Save to Photos"</strong>.
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={async () => {
                    try {
                      const file = dataUrlToFile(iosImageDataUrl, `retrobooth-${Date.now()}.png`);
                      await navigator.share({
                        files: [file],
                        title: 'RetroBooth Strip',
                      });
                    } catch (e) {}
                  }}
                  className="py-2.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Sheet</span>
                </button>
              )}
              <a
                href={iosImageDataUrl}
                download={`retrobooth-strip-${Date.now()}.png`}
                className="py-2.5 px-3 bg-studio-800 hover:bg-studio-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
              >
                <Download className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Direct Save</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
