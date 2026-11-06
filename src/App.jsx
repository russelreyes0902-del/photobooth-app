import React, { useState, useCallback } from 'react';
import { useCamera } from './hooks/useCamera';
import CameraViewfinder from './components/CameraViewfinder';
import TemplateSelector from './components/TemplateSelector';
import FilterControls from './components/FilterControls';
import PhotoStripCanvas from './components/PhotoStripCanvas';
import ExportModal from './components/ExportModal';
import { BUILTIN_TEMPLATES, getTemplateById } from './utils/templates';
import { getFilterById } from './utils/filters';
import { 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  X
} from 'lucide-react';

export default function App() {
  const camera = useCamera();

  // Selected template & styling
  const [selectedTemplateId, setSelectedTemplateId] = useState('denim');
  const [paperColor, setPaperColor] = useState('#ffffff');
  const [activeFilterId, setActiveFilterId] = useState('normal');
  const [customTemplates, setCustomTemplates] = useState([]);

  // Captured photos (up to 4) & Live Recorded Session Video
  const [photos, setPhotos] = useState([]);
  const [sessionVideo, setSessionVideo] = useState(null);

  // Modals & Mobile Drawers
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(null); // 'templates' | 'strip' | null

  // Active template object with fallback
  const activeTemplate = customTemplates.find(t => t.id === selectedTemplateId) || getTemplateById(selectedTemplateId) || BUILTIN_TEMPLATES[0];

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

  // Handle complete burst finished (with captured photos + live recorded video)
  const handleBurstComplete = useCallback((capturedPhotos, recordedVideo) => {
    try {
      if (Array.isArray(capturedPhotos) && capturedPhotos.length > 0) {
        setPhotos(capturedPhotos);
        if (recordedVideo) {
          setSessionVideo(recordedVideo);
        }
        // Automatically open export modal after burst completes
        setTimeout(() => {
          setIsExportOpen(true);
        }, 600);
      }
    } catch (err) {
      console.warn('handleBurstComplete error:', err);
    }
  }, []);

  // Trigger burst capture with live session video recording
  const handleStartBurst = useCallback(() => {
    try {
      setPhotos([]);
      setSessionVideo(null);
      const activeFilterObj = getFilterById(activeFilterId);
      camera.startBurstCapture(handlePhotoCaptured, handleBurstComplete, activeFilterObj);
    } catch (err) {
      console.error('handleStartBurst error:', err);
    }
  }, [camera, handlePhotoCaptured, handleBurstComplete, activeFilterId]);

  // Reset photos safely
  const handleResetPhotos = useCallback(() => {
    try {
      setPhotos([]);
      setSessionVideo(null);
    } catch (err) {
      console.warn('handleResetPhotos error:', err);
    }
  }, []);

  // Add custom template from user file upload safely
  const handleAddCustomTemplate = useCallback((newTemplate) => {
    try {
      if (!newTemplate || !newTemplate.id) return;
      setCustomTemplates(prev => [newTemplate, ...prev]);
    } catch (err) {
      console.warn('handleAddCustomTemplate error:', err);
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
                4-CUT
              </span>
            </h1>
          </div>
        </div>

        {/* Template Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Current Theme:</span>
          <span className="text-xs font-semibold text-rose-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
            {activeTemplate?.name}
          </span>
        </div>

        {/* Top Right Quick Action */}
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity active:scale-95"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Export Strip</span>
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
          
          {/* LEFT / HERO COLUMN: Viewfinder & Filter Bar (Single instance!) */}
          <div className="flex-1 md:col-span-7 lg:col-span-8 h-full flex flex-col gap-2 md:gap-3 min-h-0">
            {/* Viewfinder takes full available height */}
            <div className="flex-1 min-h-0">
              <CameraViewfinder
                camera={camera}
                activeFilterId={activeFilterId}
                onStartBurst={handleStartBurst}
                photosCount={photos.length}
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
            <div className="flex-shrink-0 grid grid-cols-2 gap-2 pb-0.5 md:hidden">
              <button
                onClick={() => setMobileDrawer('templates')}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-studio-900 border border-studio-700/80 text-xs font-bold text-slate-200 active:bg-studio-800"
              >
                <Layers className="w-4 h-4 text-accent-pink" />
                <span>Frames ({activeTemplate?.name?.split(' ')[0] || 'Frame'})</span>
              </button>

              <button
                onClick={() => setMobileDrawer('strip')}
                className="relative flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-studio-900 border border-studio-700/80 text-xs font-bold text-slate-200 active:bg-studio-800"
              >
                <ImageIcon className="w-4 h-4 text-accent-cyan" />
                <span>Strip Preview</span>
                {photos.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                    {photos.length}
                  </span>
                )}
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
                onAddCustomTemplate={handleAddCustomTemplate}
              />
            </div>

            {/* Live Strip Preview Canvas */}
            <div className="flex-1 min-h-0">
              <PhotoStripCanvas
                template={activeTemplate}
                photos={photos}
                filterId={activeFilterId}
                paperColor={paperColor}
                onResetPhotos={handleResetPhotos}
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
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setMobileDrawer(null)} />

          {/* Drawer Content */}
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
                onAddCustomTemplate={handleAddCustomTemplate}
              />
            ) : (
              <div className="h-[60dvh]">
                <PhotoStripCanvas
                  template={activeTemplate}
                  photos={photos}
                  filterId={activeFilterId}
                  paperColor={paperColor}
                  onResetPhotos={handleResetPhotos}
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
      {/* EXPORT & SHARE MODAL */}
      {/* ============================================================ */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        template={activeTemplate}
        photos={photos}
        sessionVideo={sessionVideo}
        filterId={activeFilterId}
        paperColor={paperColor}
        onUpdateFilter={setActiveFilterId}
      />

    </div>
  );
}
