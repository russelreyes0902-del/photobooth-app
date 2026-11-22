import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import CameraViewfinder from './components/CameraViewfinder';
import TemplateSelector from './components/TemplateSelector';
import FilterControls from './components/FilterControls';
import PhotoStripCanvas from './components/PhotoStripCanvas';
import PhotoReviewModal from './components/PhotoReviewModal';
import StudioEditorModal from './components/StudioEditorModal';
import ExportModal from './components/ExportModal';
import LocalGalleryModal from './components/LocalGalleryModal';
import PrintStudioModal from './components/PrintStudioModal';
import { BUILTIN_TEMPLATES, getTemplateById } from './utils/templates';
import { getFilterById } from './utils/filters';
import { getAllCustomTemplates } from './utils/storage';
import { 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  X, 
  FolderOpen, 
  SlidersHorizontal, 
  Printer 
} from 'lucide-react';

export default function App() {
  const camera = useCamera();

  // Selected template & styling
  const [selectedTemplateId, setSelectedTemplateId] = useState('denim');
  const [paperColor, setPaperColor] = useState('#ffffff');
  const [paperPattern, setPaperPattern] = useState('none');
  const [activeFilterId, setActiveFilterId] = useState('normal');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [customTemplates, setCustomTemplates] = useState([]);

  // Captured photos & Live Recorded Session Video
  const [photos, setPhotos] = useState([]);
  const [sessionVideo, setSessionVideo] = useState(null);

  // Design adjustments & layers
  const [adjustments, setAdjustments] = useState({});
  const [photoTransforms, setPhotoTransforms] = useState({});
  const [borders, setBorders] = useState({ width: 0, color: '#ffffff', radius: 14 });
  const [stickers, setStickers] = useState([]);
  const [texts, setTexts] = useState([]);

  // Active Modals
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printCanvasTarget, setPrintCanvasTarget] = useState(null);
  const [mobileDrawer, setMobileDrawer] = useState(null); // 'templates' | 'strip' | null

  // Load custom templates from IndexedDB on initial mount
  useEffect(() => {
    const loadSavedTemplates = async () => {
      try {
        const saved = await getAllCustomTemplates();
        if (Array.isArray(saved) && saved.length > 0) {
          setCustomTemplates(saved);
        }
      } catch (e) {
        console.warn('Failed to load saved custom templates:', e);
      }
    };
    loadSavedTemplates();
  }, []);

  // Active template object with fallback
  const activeTemplate = customTemplates.find(t => t.id === selectedTemplateId) || 
    getTemplateById(selectedTemplateId, customTemplates) || 
    BUILTIN_TEMPLATES[0];

  // Auto-sync captureCount when template changes if template defines slotCount
  useEffect(() => {
    if (activeTemplate?.slotCount && activeTemplate.slotCount !== camera.captureCount) {
      camera.setCaptureCount(activeTemplate.slotCount);
    }
  }, [activeTemplate?.slotCount, camera.captureCount]);

  // Handle individual burst photo captured safely
  const handlePhotoCaptured = useCallback((photoFrame, shotIndex) => {
    try {
      if (!photoFrame) return;
      setPhotos(prev => {
        const next = [...prev];
        next[shotIndex] = photoFrame;
        return next;
      });
    } catch (err) {
      console.warn('handlePhotoCaptured error:', err);
    }
  }, []);

  // Handle complete burst finished
  const handleBurstComplete = useCallback((capturedPhotos, recordedVideo) => {
    try {
      if (Array.isArray(capturedPhotos) && capturedPhotos.length > 0) {
        setPhotos(capturedPhotos);
        if (recordedVideo) {
          setSessionVideo(recordedVideo);
        }
        // Open dedicated review & retake modal
        setTimeout(() => {
          setIsReviewOpen(true);
        }, 500);
      }
    } catch (err) {
      console.warn('handleBurstComplete error:', err);
    }
  }, []);

  // Trigger burst capture
  const handleStartBurst = useCallback(() => {
    try {
      setPhotos([]);
      setSessionVideo(null);
      const activeFilterObj = getFilterById(activeFilterId);
      camera.startBurstCapture(
        handlePhotoCaptured, 
        handleBurstComplete, 
        activeFilterObj, 
        camera.captureCount || activeTemplate?.slotCount || 4
      );
    } catch (err) {
      console.error('handleStartBurst error:', err);
    }
  }, [camera, handlePhotoCaptured, handleBurstComplete, activeFilterId, activeTemplate?.slotCount]);

  // Handle manual single shot capture
  const handleManualCapture = useCallback(() => {
    try {
      const nextIndex = photos.length < camera.captureCount ? photos.length : 0;
      const frame = camera.grabFrame(nextIndex);
      if (frame) {
        setPhotos(prev => {
          const next = [...prev];
          next[nextIndex] = frame;
          if (next.filter(Boolean).length >= camera.captureCount) {
            setTimeout(() => setIsReviewOpen(true), 500);
          }
          return next;
        });
      }
    } catch (e) {
      console.warn('Manual capture error:', e);
    }
  }, [camera, photos.length]);

  // Individual Shot Retake
  const handleRetakeShot = useCallback(async (slotIndex) => {
    try {
      const photo = await camera.retakeSingleShot(slotIndex);
      if (photo) {
        setPhotos(prev => {
          const next = [...prev];
          next[slotIndex] = photo;
          return next;
        });
      }
    } catch (e) {
      console.warn('Retake shot error:', e);
    }
  }, [camera]);

  // Individual Shot Replace
  const handleReplaceShot = useCallback((slotIndex, newPhoto) => {
    setPhotos(prev => {
      const next = [...prev];
      next[slotIndex] = newPhoto;
      return next;
    });
  }, []);

  // Individual Shot Delete
  const handleDeleteShot = useCallback((slotIndex) => {
    setPhotos(prev => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  // Swap / Reorder Shots
  const handleSwapShots = useCallback((idxA, idxB) => {
    setPhotos(prev => {
      const next = [...prev];
      const temp = next[idxA];
      next[idxA] = next[idxB];
      next[idxB] = temp;
      return next;
    });
  }, []);

  // Reset photos safely
  const handleResetPhotos = useCallback(() => {
    try {
      setPhotos([]);
      setSessionVideo(null);
    } catch (err) {
      console.warn('handleResetPhotos error:', err);
    }
  }, []);

  // Load project from Local Gallery to re-edit
  const handleLoadProject = useCallback((project) => {
    try {
      if (!project) return;
      if (project.photos) setPhotos(project.photos);
      if (project.templateId) setSelectedTemplateId(project.templateId);
      if (project.paperColor) setPaperColor(project.paperColor);
      if (project.paperPattern) setPaperPattern(project.paperPattern);
      if (project.filterId) setActiveFilterId(project.filterId);
      if (project.filterIntensity !== undefined) setFilterIntensity(project.filterIntensity);
      if (project.adjustments) setAdjustments(project.adjustments);
      if (project.photoTransforms) setPhotoTransforms(project.photoTransforms);
      if (project.borders) setBorders(project.borders);
      if (project.stickers) setStickers(project.stickers);
      if (project.texts) setTexts(project.texts);
      setIsEditorOpen(true);
    } catch (e) {
      console.warn('handleLoadProject error:', e);
    }
  }, []);

  // Open Print Studio
  const handleOpenPrintStudio = useCallback((canvas) => {
    if (canvas) {
      setPrintCanvasTarget(canvas);
      setIsPrintOpen(true);
    }
  }, []);

  return (
    <div className="relative w-screen h-[100dvh] max-h-[100dvh] flex flex-col bg-studio-950 text-slate-100 overflow-hidden font-sans">
      
      {/* ============================================================ */}
      {/* TOP COMPACT APP HEADER */}
      {/* ============================================================ */}
      <header className="w-full h-12 flex-shrink-0 px-4 flex items-center justify-between border-b border-white/5 bg-studio-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight font-display flex items-center gap-1.5">
              <span>RETROBOOTH</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {activeTemplate?.slotCount ? `${activeTemplate.slotCount}-CUT` : 'STUDIO'}
              </span>
            </h1>
          </div>
        </div>

        {/* Current Theme / Frame pill */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Current Theme:</span>
          <span className="text-xs font-semibold text-rose-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
            {activeTemplate?.name}
          </span>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Gallery Button */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            title="Local Gallery & Saved Sessions"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition-all active:scale-95"
          >
            <FolderOpen className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="hidden sm:inline">Gallery</span>
          </button>

          {/* Edit Strip Button */}
          {photos.length > 0 && (
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-studio-800 hover:bg-studio-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-accent-amber" />
              <span>Editor</span>
            </button>
          )}

          {/* Export Strip Button */}
          {photos.length > 0 && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity active:scale-95"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN VIEWPORT CONTAINER */}
      {/* ============================================================ */}
      <main className="flex-1 w-full min-h-0 overflow-hidden">
        
        {/* Unified Responsive Container */}
        <div className="flex flex-col md:grid md:grid-cols-12 h-full gap-2.5 md:gap-3.5 p-2 md:p-3.5 min-h-0">
          
          {/* LEFT / HERO COLUMN: Viewfinder & Filter Bar */}
          <div className="flex-1 md:col-span-7 lg:col-span-8 h-full flex flex-col gap-2 md:gap-3 min-h-0">
            {/* Viewfinder takes full available height */}
            <div className="flex-1 min-h-0">
              <CameraViewfinder
                camera={camera}
                activeFilterId={activeFilterId}
                onStartBurst={handleStartBurst}
                onManualCapture={handleManualCapture}
                photosCount={photos.filter(Boolean).length}
              />
            </div>

            {/* Filter controls row */}
            <div className="flex-shrink-0">
              <FilterControls
                activeFilterId={activeFilterId}
                onSelectFilter={setActiveFilterId}
              />
            </div>

            {/* Mobile-Only Bottom Navigation Dock */}
            <div className="flex-shrink-0 grid grid-cols-3 gap-2 pb-0.5 md:hidden">
              <button
                onClick={() => setMobileDrawer('templates')}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-2xl bg-studio-900 border border-studio-700/80 text-xs font-bold text-slate-200 active:bg-studio-800"
              >
                <Layers className="w-3.5 h-3.5 text-accent-pink" />
                <span>Frames</span>
              </button>

              <button
                onClick={() => setMobileDrawer('strip')}
                className="relative flex items-center justify-center gap-1.5 py-2 px-2 rounded-2xl bg-studio-900 border border-studio-700/80 text-xs font-bold text-slate-200 active:bg-studio-800"
              >
                <ImageIcon className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Strip</span>
                {photos.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-mono">
                    {photos.filter(Boolean).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-2xl bg-studio-900 border border-studio-700/80 text-xs font-bold text-slate-200 active:bg-studio-800"
              >
                <FolderOpen className="w-3.5 h-3.5 text-accent-amber" />
                <span>Gallery</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN (Desktop / iPad): Template Selection & Live Strip Preview */}
          <div className="hidden md:flex md:col-span-5 lg:col-span-4 h-full flex-col gap-3 min-h-0">
            {/* Templates Selector */}
            <div className="flex-shrink-0">
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={setSelectedTemplateId}
                selectedPaperColor={paperColor}
                onSelectPaperColor={setPaperColor}
                customTemplates={customTemplates}
                onAddCustomTemplate={(t) => setCustomTemplates(prev => [t, ...prev])}
                onDeleteCustomTemplate={(id) => setCustomTemplates(prev => prev.filter(t => t.id !== id))}
              />
            </div>

            {/* Live Strip Preview Canvas */}
            <div className="flex-1 min-h-0">
              <PhotoStripCanvas
                template={activeTemplate}
                photos={photos}
                filterId={activeFilterId}
                filterIntensity={filterIntensity}
                adjustments={adjustments}
                photoTransforms={photoTransforms}
                paperColor={paperColor}
                paperPattern={paperPattern}
                borders={borders}
                stickers={stickers}
                texts={texts}
                onResetPhotos={handleResetPhotos}
                onOpenEditor={() => setIsEditorOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            </div>
          </div>

        </div>

      </main>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM SHEET / DRAWER */}
      {/* ============================================================ */}
      {mobileDrawer && (
        <div className="fixed inset-0 z-40 md:hidden flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="flex-1" onClick={() => setMobileDrawer(null)} />

          <div className="w-full max-h-[82dvh] bg-studio-900 border-t border-studio-700 rounded-t-3xl p-4 flex flex-col gap-3 shadow-2xl animate-slide-up overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-sm font-bold text-white capitalize">
                {mobileDrawer === 'templates' ? 'Choose Photobooth Frame' : 'Live Strip Preview'}
              </span>
              <button
                onClick={() => setMobileDrawer(null)}
                className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mobileDrawer === 'templates' ? (
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={(id) => {
                  setSelectedTemplateId(id);
                  setMobileDrawer(null);
                }}
                selectedPaperColor={paperColor}
                onSelectPaperColor={setPaperColor}
                customTemplates={customTemplates}
                onAddCustomTemplate={(t) => setCustomTemplates(prev => [t, ...prev])}
                onDeleteCustomTemplate={(id) => setCustomTemplates(prev => prev.filter(t => t.id !== id))}
              />
            ) : (
              <div className="h-[60vh]">
                <PhotoStripCanvas
                  template={activeTemplate}
                  photos={photos}
                  filterId={activeFilterId}
                  filterIntensity={filterIntensity}
                  adjustments={adjustments}
                  photoTransforms={photoTransforms}
                  paperColor={paperColor}
                  paperPattern={paperPattern}
                  borders={borders}
                  stickers={stickers}
                  texts={texts}
                  onResetPhotos={handleResetPhotos}
                  onOpenEditor={() => {
                    setMobileDrawer(null);
                    setIsEditorOpen(true);
                  }}
                  onOpenExport={() => {
                    setMobileDrawer(null);
                    setIsExportOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* 1. Photo Review & Retake Modal */}
      <PhotoReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        photos={photos}
        captureCount={camera.captureCount || activeTemplate?.slotCount || 4}
        onRetakeShot={handleRetakeShot}
        onReplaceShot={handleReplaceShot}
        onDeleteShot={handleDeleteShot}
        onSwapShots={handleSwapShots}
        onContinueToEditor={() => {
          setIsReviewOpen(false);
          setIsEditorOpen(true);
        }}
      />

      {/* 2. Studio Design Editor Modal */}
      <StudioEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        photos={photos}
        template={activeTemplate}
        customTemplates={customTemplates}
        filterId={activeFilterId}
        paperColor={paperColor}
        onOpenExport={(designConfig) => {
          if (designConfig) {
            setSelectedTemplateId(designConfig.template.id);
            setPaperColor(designConfig.paperColor);
            setPaperPattern(designConfig.paperPattern);
            setActiveFilterId(designConfig.filterId);
            setFilterIntensity(designConfig.filterIntensity);
            setAdjustments(designConfig.adjustments);
            setPhotoTransforms(designConfig.photoTransforms);
            setBorders(designConfig.borders);
            setStickers(designConfig.stickers);
            setTexts(designConfig.texts);
          }
          setIsEditorOpen(false);
          setIsExportOpen(true);
        }}
        onSaveToGallerySuccess={() => {}}
      />

      {/* 3. Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        template={activeTemplate}
        photos={photos}
        sessionVideo={sessionVideo}
        filterId={activeFilterId}
        filterIntensity={filterIntensity}
        adjustments={adjustments}
        photoTransforms={photoTransforms}
        paperColor={paperColor}
        paperPattern={paperPattern}
        borders={borders}
        stickers={stickers}
        texts={texts}
        onUpdateFilter={setActiveFilterId}
        onOpenPrintStudio={handleOpenPrintStudio}
      />

      {/* 4. Local Gallery Modal */}
      <LocalGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoadProject={handleLoadProject}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 5. Print Studio Modal */}
      <PrintStudioModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        stripCanvas={printCanvasTarget}
      />

    </div>
  );
}
