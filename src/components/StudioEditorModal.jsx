import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Sliders, 
  Crop, 
  Smile, 
  Type, 
  Layers, 
  Undo2, 
  Redo2, 
  RotateCw, 
  FlipHorizontal, 
  Trash2, 
  Plus, 
  Download, 
  Save, 
  X, 
  Palette, 
  Check,
  Search,
  RotateCcw
} from 'lucide-react';
import { FILTERS, FILTER_CATEGORIES, getFilterById } from '../utils/filters.js';
import { PAPER_COLORS, PAPER_PATTERNS, BUILTIN_TEMPLATES, getTemplateById } from '../utils/templates.js';
import { STICKER_LIBRARY, STICKER_CATEGORIES } from '../utils/stickers.js';
import { renderPhotoStrip } from '../utils/canvasCompositor.js';
import { saveProject } from '../utils/storage.js';

export default function StudioEditorModal({
  isOpen,
  onClose,
  initialProject = null,
  photos = [],
  template: propTemplate,
  customTemplates = [],
  filterId: propFilterId = 'clean-original',
  paperColor: propPaperColor = '#ffffff',
  onOpenExport,
  onSaveToGallerySuccess,
}) {
  const canvasRef = useRef(null);

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState('filters');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  // Core Design State
  const [templateId, setTemplateId] = useState(propTemplate?.id || 'denim');
  const [paperColor, setPaperColor] = useState(propPaperColor || '#ffffff');
  const [paperPattern, setPaperPattern] = useState('none');
  const [filterId, setFilterId] = useState(propFilterId || 'clean-original');
  const [filterIntensity, setFilterIntensity] = useState(100);

  // Global & Per-Photo adjustments
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    tint: 0,
    grain: 0,
    vignette: 0,
    blur: 0,
  });

  // Photo slot transforms: { [slotIndex]: { panX, panY, zoom, rotate, mirror } }
  const [photoTransforms, setPhotoTransforms] = useState({});

  // Borders
  const [borders, setBorders] = useState({
    width: 0,
    color: '#ffffff',
    radius: 14,
  });

  // Stickers array: [{ id, type, x, y, size, rotation, opacity, zIndex }]
  const [stickers, setStickers] = useState([]);
  const [selectedStickerId, setSelectedStickerId] = useState(null);

  // Texts array: [{ id, text, x, y, fontSize, fontFamily, color, rotation, outlineColor, outlineWidth }]
  const [texts, setTexts] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);

  // Undo / Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isApplyingHistory = useRef(false);
  const snapshotDebounceTimer = useRef(null);

  // Notification state
  const [toastMessage, setToastMessage] = useState(null);

  // Hydrate state from initialProject or props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialProject) {
        if (initialProject.templateId) setTemplateId(initialProject.templateId);
        if (initialProject.paperColor) setPaperColor(initialProject.paperColor);
        if (initialProject.paperPattern) setPaperPattern(initialProject.paperPattern);
        if (initialProject.filterId) setFilterId(initialProject.filterId);
        if (initialProject.filterIntensity !== undefined) setFilterIntensity(initialProject.filterIntensity);
        if (initialProject.adjustments) setAdjustments(initialProject.adjustments);
        if (initialProject.photoTransforms) setPhotoTransforms(initialProject.photoTransforms);
        if (initialProject.borders) setBorders(initialProject.borders);
        if (initialProject.stickers) setStickers(initialProject.stickers);
        if (initialProject.texts) setTexts(initialProject.texts);
      } else {
        if (propTemplate?.id) setTemplateId(propTemplate.id);
        if (propFilterId) setFilterId(propFilterId);
        if (propPaperColor) setPaperColor(propPaperColor);
      }

      // Initialize clean history baseline
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [isOpen, initialProject, propTemplate, propFilterId, propPaperColor]);

  const currentTemplate = customTemplates.find(t => t.id === templateId) || 
    getTemplateById(templateId, customTemplates) || 
    BUILTIN_TEMPLATES[0];

  // Debounced snapshot taker to group continuous slider drags into 1 history step
  const pushStateSnapshot = useCallback((partialState = {}, immediate = false) => {
    if (isApplyingHistory.current) return;

    const recordSnapshot = () => {
      const snapshot = {
        templateId,
        paperColor,
        paperPattern,
        filterId,
        filterIntensity,
        adjustments: { ...adjustments },
        photoTransforms: { ...photoTransforms },
        borders: { ...borders },
        stickers: [...stickers],
        texts: [...texts],
        ...partialState,
      };

      setHistory(prev => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        return [...upToCurrent, snapshot].slice(-25);
      });
      setHistoryIndex(prev => prev + 1);
    };

    if (immediate) {
      if (snapshotDebounceTimer.current) clearTimeout(snapshotDebounceTimer.current);
      recordSnapshot();
    } else {
      if (snapshotDebounceTimer.current) clearTimeout(snapshotDebounceTimer.current);
      snapshotDebounceTimer.current = setTimeout(recordSnapshot, 350);
    }
  }, [templateId, paperColor, paperPattern, filterId, filterIntensity, adjustments, photoTransforms, borders, stickers, texts, historyIndex]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isApplyingHistory.current = true;
      const target = history[historyIndex - 1];
      setTemplateId(target.templateId);
      setPaperColor(target.paperColor);
      setPaperPattern(target.paperPattern);
      setFilterId(target.filterId);
      setFilterIntensity(target.filterIntensity);
      setAdjustments(target.adjustments);
      setPhotoTransforms(target.photoTransforms);
      setBorders(target.borders);
      setStickers(target.stickers);
      setTexts(target.texts);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => { isApplyingHistory.current = false; }, 50);
    }
  }, [history, historyIndex]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isApplyingHistory.current = true;
      const target = history[historyIndex + 1];
      setTemplateId(target.templateId);
      setPaperColor(target.paperColor);
      setPaperPattern(target.paperPattern);
      setFilterId(target.filterId);
      setFilterIntensity(target.filterIntensity);
      setAdjustments(target.adjustments);
      setPhotoTransforms(target.photoTransforms);
      setBorders(target.borders);
      setStickers(target.stickers);
      setTexts(target.texts);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => { isApplyingHistory.current = false; }, 50);
    }
  }, [history, historyIndex]);

  // Guard keyboard shortcuts: never trigger while user is typing in input or textarea
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target) {
        const tag = target.tagName ? target.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Re-render canvas whenever design state changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !currentTemplate) return;
    const token = { isCancelled: false };

    renderPhotoStrip({
      canvas: canvasRef.current,
      template: currentTemplate,
      photos,
      filterId,
      filterIntensity,
      adjustments,
      photoTransforms,
      paperColor,
      paperPattern,
      borders,
      stickers,
      texts,
      dateStamp: true,
      cancelToken: token,
    }).catch(err => {
      console.warn('Canvas render error in StudioEditorModal:', err);
    });

    return () => {
      token.isCancelled = true;
    };
  }, [isOpen, currentTemplate, photos, filterId, filterIntensity, adjustments, photoTransforms, paperColor, paperPattern, borders, stickers, texts]);

  if (!isOpen) return null;

  // Selected slot transform helper
  const curTransform = photoTransforms[selectedSlotIndex] || { panX: 0, panY: 0, zoom: 1.0, rotate: 0, mirror: false };

  const updateSelectedSlotTransform = (patch, immediate = false) => {
    const nextTransforms = {
      ...photoTransforms,
      [selectedSlotIndex]: {
        ...curTransform,
        ...patch,
      },
    };
    setPhotoTransforms(nextTransforms);
    pushStateSnapshot({ photoTransforms: nextTransforms }, immediate);
  };

  // Sticker helpers
  const handleAddSticker = (stickerType) => {
    const newSticker = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: stickerType,
      x: 0.5,
      y: 0.5,
      size: 130,
      rotation: 0,
      opacity: 1.0,
      zIndex: stickers.length + 1,
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setSelectedStickerId(newSticker.id);
    pushStateSnapshot({ stickers: nextStickers }, true);
  };

  const handleDeleteSticker = (id) => {
    const nextStickers = stickers.filter(s => s.id !== id);
    setStickers(nextStickers);
    if (selectedStickerId === id) setSelectedStickerId(null);
    pushStateSnapshot({ stickers: nextStickers }, true);
  };

  // Text helpers
  const handleAddText = () => {
    const newText = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: 'RETRO MOMENTS',
      x: 0.5,
      y: 0.92,
      fontSize: 28,
      fontFamily: 'Space Grotesk',
      fontWeight: '700',
      color: '#1e293b',
      rotation: 0,
      outlineColor: '',
      outlineWidth: 0,
    };
    const nextTexts = [...texts, newText];
    setTexts(nextTexts);
    setSelectedTextId(newText.id);
    pushStateSnapshot({ texts: nextTexts }, true);
  };

  const handleDeleteText = (id) => {
    const nextTexts = texts.filter(t => t.id !== id);
    setTexts(nextTexts);
    if (selectedTextId === id) setSelectedTextId(null);
    pushStateSnapshot({ texts: nextTexts }, true);
  };

  // Save to Gallery in IndexedDB
  const handleSaveProject = async () => {
    try {
      let thumbUrl = null;
      if (canvasRef.current) {
        thumbUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
      }
      await saveProject({
        title: `${currentTemplate.name} • ${new Date().toLocaleDateString()}`,
        thumbnailDataUrl: thumbUrl,
        photos,
        captureCount: photos.length || 4,
        templateId,
        paperColor,
        paperPattern,
        filterId,
        filterIntensity,
        adjustments,
        photoTransforms,
        borders,
        stickers,
        texts,
      });

      setToastMessage('Project saved to Local Gallery!');
      setTimeout(() => setToastMessage(null), 2500);
      if (onSaveToGallerySuccess) onSaveToGallerySuccess();
    } catch (err) {
      console.error('Failed to save project:', err);
      setToastMessage('Could not save to local storage.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Filter list by category & search query
  const filteredFilters = FILTERS.filter(f => {
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterSearch && !f.name.toLowerCase().includes(filterSearch.toLowerCase()) && !f.description.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-6xl h-[95vh] max-h-[880px] bg-studio-950 border border-studio-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* ============================================================ */}
        {/* TOP TOOLBAR */}
        {/* ============================================================ */}
        <header className="flex-shrink-0 h-14 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-studio-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>STUDIO DESIGN EDITOR</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {currentTemplate.name}
                </span>
              </h2>
            </div>
          </div>

          {/* Center: Undo / Redo Toolbar */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-white/10 transition-all"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-white/10 transition-all"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Save & Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-studio-800 hover:bg-studio-700 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Save Session</span>
            </button>

            <button
              onClick={() => {
                if (onOpenExport) {
                  onOpenExport({
                    template: currentTemplate,
                    paperColor,
                    paperPattern,
                    filterId,
                    filterIntensity,
                    adjustments,
                    photoTransforms,
                    borders,
                    stickers,
                    texts,
                  });
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Strip</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* WORKSPACE BODY */}
        {/* ============================================================ */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT ICON TAB NAVIGATION */}
          <nav className="w-full md:w-16 bg-studio-900 border-b md:border-b-0 md:border-r border-white/10 p-2 flex md:flex-col items-center justify-around md:justify-start gap-1 md:gap-3 flex-shrink-0 z-20 overflow-x-auto">
            {[
              { id: 'filters', label: '35 Filters', icon: Wand2, color: 'text-rose-400' },
              { id: 'adjustments', label: 'Tone', icon: Sliders, color: 'text-amber-400' },
              { id: 'position', label: 'Crop', icon: Crop, color: 'text-cyan-400' },
              { id: 'stickers', label: 'Deco', icon: Smile, color: 'text-yellow-400' },
              { id: 'text', label: 'Text', icon: Type, color: 'text-purple-400' },
              { id: 'borders', label: 'Paper', icon: Palette, color: 'text-pink-400' },
            ].map(tab => {
              const Icon = tab.icon;
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                    isSel
                      ? 'bg-rose-500/20 border border-rose-500/40 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSel ? tab.color : ''}`} />
                  <span className="text-[9px] font-bold mt-0.5">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* TOOL SETTINGS DRAWER */}
          <div className="w-full md:w-80 bg-studio-900/90 border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col overflow-y-auto flex-shrink-0">
            
            {/* TAB: 35 CURATED FILTERS */}
            {activeTab === 'filters' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">35 Curated Filters</h3>
                  <span className="text-[10px] text-slate-400">{filteredFilters.length} presets</span>
                </div>

                {/* Filter Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search filters..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full bg-studio-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Filter Category Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                      filterCategory === 'all' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All (35)
                  </button>
                  {FILTER_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                        filterCategory === cat.id ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Intensity slider */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>Filter Intensity</span>
                    <span className="font-mono text-rose-400">{filterIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filterIntensity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFilterIntensity(val);
                      pushStateSnapshot({ filterIntensity: val });
                    }}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredFilters.map(f => {
                    const isSel = f.id === filterId;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setFilterId(f.id);
                          pushStateSnapshot({ filterId: f.id }, true);
                        }}
                        title={f.description}
                        className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                          isSel
                            ? 'bg-rose-500/20 border-rose-400 text-white shadow-sm'
                            : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${f.previewGradient} flex-shrink-0 shadow-sm`} />
                        <span className="truncate">{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: TONE & COLOR ADJUSTMENTS */}
            {activeTab === 'adjustments' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tone & Color</h3>
                  <button
                    onClick={() => {
                      const resetAdj = { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, grain: 0, vignette: 0, blur: 0 };
                      setAdjustments(resetAdj);
                      pushStateSnapshot({ adjustments: resetAdj }, true);
                    }}
                    className="flex items-center gap-1 text-[10px] text-rose-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All</span>
                  </button>
                </div>

                {[
                  { key: 'exposure', label: 'Exposure', min: -50, max: 50 },
                  { key: 'brightness', label: 'Brightness', min: -50, max: 50 },
                  { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                  { key: 'saturation', label: 'Saturation', min: -50, max: 50 },
                  { key: 'temperature', label: 'Warmth / Temperature', min: -50, max: 50 },
                  { key: 'tint', label: 'Tint (Green / Magenta)', min: -50, max: 50 },
                  { key: 'grain', label: 'Film Grain Texture', min: 0, max: 100 },
                  { key: 'vignette', label: 'Vignette Falloff', min: 0, max: 100 },
                ].map(item => (
                  <div key={item.key} className="flex flex-col gap-1 p-2 rounded-xl bg-black/30 border border-white/5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                      <span>{item.label}</span>
                      <span className="font-mono text-rose-400">{adjustments[item.key] || 0}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      value={adjustments[item.key] || 0}
                      onChange={(e) => {
                        const nextAdj = { ...adjustments, [item.key]: Number(e.target.value) };
                        setAdjustments(nextAdj);
                        pushStateSnapshot({ adjustments: nextAdj });
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB: CROP & POSITION */}
            {activeTab === 'position' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Photo Positioning</h3>
                
                {/* Select slot */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-400">Select Shot to Reposition:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: photos.length || 4 }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlotIndex(idx)}
                        className={`py-1.5 rounded-xl font-bold text-xs border transition-all ${
                          selectedSlotIndex === idx
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-black/30 text-slate-300 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        Shot {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom control */}
                <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>Crop Zoom</span>
                    <span className="font-mono text-rose-400">{(curTransform.zoom || 1.0).toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={2.5}
                    step={0.05}
                    value={curTransform.zoom || 1.0}
                    onChange={(e) => updateSelectedSlotTransform({ zoom: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Pan X and Pan Y */}
                <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-300">Pan Horizontal / Vertical</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">X Offset</span>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={curTransform.panX || 0}
                        onChange={(e) => updateSelectedSlotTransform({ panX: Number(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Y Offset</span>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={curTransform.panY || 0}
                        onChange={(e) => updateSelectedSlotTransform({ panY: Number(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotate & Mirror Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => updateSelectedSlotTransform({ rotate: ((curTransform.rotate || 0) + 90) % 360 }, true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-black/40 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-accent-amber" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    onClick={() => updateSelectedSlotTransform({ mirror: !curTransform.mirror }, true)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      curTransform.mirror
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-black/40 hover:bg-white/10 text-slate-200 border-white/10'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5 text-accent-pink" />
                    <span>Flip Mirror</span>
                  </button>
                </div>

                <button
                  onClick={() => updateSelectedSlotTransform({ panX: 0, panY: 0, zoom: 1.0, rotate: 0, mirror: false }, true)}
                  className="mt-2 py-2 text-xs font-bold text-slate-400 hover:text-white border border-white/10 rounded-xl"
                >
                  Reset Slot {selectedSlotIndex + 1} Crop
                </button>
              </div>
            )}

            {/* TAB: STICKERS & DECO */}
            {activeTab === 'stickers' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Stickers & Deco</h3>
                  <span className="text-[10px] text-slate-400">{stickers.length} added</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {STICKER_LIBRARY.map(st => (
                    <button
                      key={st.id}
                      onClick={() => handleAddSticker(st.id)}
                      className="p-2.5 rounded-2xl bg-black/40 border border-white/5 hover:border-rose-400 hover:bg-white/5 flex flex-col items-center justify-center transition-all group"
                    >
                      <div
                        className="w-10 h-10 transition-transform group-hover:scale-110 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: st.svg }}
                      />
                      <span className="text-[9px] text-slate-400 mt-1 truncate max-w-full">{st.name}</span>
                    </button>
                  ))}
                </div>

                {selectedStickerId && (
                  <div className="mt-3 p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-300">Selected Sticker</span>
                      <button
                        onClick={() => handleDeleteSticker(selectedStickerId)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Scale Size</span>
                      <input
                        type="range"
                        min={60}
                        max={300}
                        value={stickers.find(s => s.id === selectedStickerId)?.size || 120}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, size: val } : s));
                        }}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Rotation</span>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={stickers.find(s => s.id === selectedStickerId)?.rotation || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, rotation: val } : s));
                        }}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: TEXT */}
            {activeTab === 'text' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Text Layers</h3>
                  <button
                    onClick={handleAddText}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Text</span>
                  </button>
                </div>

                {texts.map((txt) => (
                  <div key={txt.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={txt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTexts(prev => prev.map(t => t.id === txt.id ? { ...t, text: val } : t));
                        }}
                        className="bg-transparent text-xs text-white font-bold border-b border-white/20 pb-0.5 focus:outline-none focus:border-rose-500 flex-1 mr-2"
                      />
                      <button
                        onClick={() => handleDeleteText(txt.id)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Font</span>
                        <select
                          value={txt.fontFamily}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTexts(prev => prev.map(t => t.id === txt.id ? { ...t, fontFamily: val } : t));
                          }}
                          className="w-full bg-studio-950 text-slate-200 p-1 rounded border border-white/10"
                        >
                          <option value="Space Grotesk">Space Grotesk</option>
                          <option value="Plus Jakarta Sans">Jakarta Sans</option>
                          <option value="Courier New">Monospace</option>
                          <option value="Georgia">Editorial Serif</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Color</span>
                        <input
                          type="color"
                          value={txt.color || '#1e293b'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTexts(prev => prev.map(t => t.id === txt.id ? { ...t, color: val } : t));
                          }}
                          className="w-full h-7 bg-transparent rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: BORDERS & PAPER */}
            {activeTab === 'borders' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Paper & Styling</h3>

                {/* Paper Color */}
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Paper Base Color</span>
                  <div className="grid grid-cols-4 gap-2">
                    {PAPER_COLORS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPaperColor(p.color);
                          pushStateSnapshot({ paperColor: p.color }, true);
                        }}
                        className={`h-8 rounded-xl border flex items-center justify-center transition-all ${
                          paperColor === p.color
                            ? 'border-rose-500 scale-105 shadow-md'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      >
                        {paperColor === p.color && (
                          <Check className={`w-3.5 h-3.5 ${p.id === 'noir' ? 'text-white' : 'text-black'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Pattern */}
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Paper Texture</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAPER_PATTERNS.map(pat => (
                      <button
                        key={pat.id}
                        onClick={() => {
                          setPaperPattern(pat.id);
                          pushStateSnapshot({ paperPattern: pat.id }, true);
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-bold border transition-all ${
                          paperPattern === pat.id
                            ? 'bg-rose-500/20 border-rose-400 text-white'
                            : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {pat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Slot Borders */}
                <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-300">Photo Slot Border</span>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Border Width</span>
                      <span>{borders.width || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={borders.width || 0}
                      onChange={(e) => {
                        const nextBorders = { ...borders, width: Number(e.target.value) };
                        setBorders(nextBorders);
                        pushStateSnapshot({ borders: nextBorders });
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Corner Radius</span>
                      <span>{borders.radius || 14}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={borders.radius || 14}
                      onChange={(e) => {
                        const nextBorders = { ...borders, radius: Number(e.target.value) };
                        setBorders(nextBorders);
                        pushStateSnapshot({ borders: nextBorders });
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ============================================================ */}
          {/* CENTER: INTERACTIVE CANVAS STRIP PREVIEW */}
          {/* ============================================================ */}
          <div className="flex-1 bg-studio-950 p-4 flex items-center justify-center relative overflow-hidden">
            <div className="relative h-full aspect-[1/2.83] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/10">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
