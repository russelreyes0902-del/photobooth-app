import React, { useRef, useState } from 'react';
import { BUILTIN_TEMPLATES, PAPER_COLORS } from '../utils/templates';
import { Sparkles, Upload, Check, AlertCircle } from 'lucide-react';

export default function TemplateSelector({
  selectedTemplateId,
  onSelectTemplate,
  selectedPaperColor,
  onSelectPaperColor,
  customTemplates = [],
  onAddCustomTemplate,
}) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);

  const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];

  const handleCustomUpload = (e) => {
    setUploadError(null);
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (PNG, WEBP, JPG).');
        setTimeout(() => setUploadError(null), 3000);
        return;
      }

      // Validate file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        setUploadError('Image size exceeds 25MB limit.');
        setTimeout(() => setUploadError(null), 3000);
        return;
      }

      const url = URL.createObjectURL(file);
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 16),
        subtitle: 'Custom User Frame',
        src: url,
        baseWidth: 707,
        baseHeight: 2000,
        exportWidth: 1200,
        exportHeight: 3395,
        tag: 'Custom',
        accentColor: '#ec4899',
        defaultPaper: '#ffffff',
        cutouts: [
          { x: 43, y: 71, width: 621, height: 373, radius: 10 },
          { x: 43, y: 469, width: 621, height: 373, radius: 10 },
          { x: 43, y: 866, width: 621, height: 374, radius: 10 },
          { x: 43, y: 1264, width: 621, height: 374, radius: 10 },
        ],
      };

      if (onAddCustomTemplate) {
        onAddCustomTemplate(newTemplate);
      }
      if (onSelectTemplate) {
        onSelectTemplate(newTemplate.id);
      }
    } catch (err) {
      console.error('Safe handleCustomUpload error:', err);
      setUploadError('Failed to load image template.');
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-studio-900/90 backdrop-blur-md rounded-3xl border border-studio-700/60 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-pink" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Select Frame Template
          </h3>
        </div>
        <button
          onClick={() => {
            try { fileInputRef.current?.click(); } catch (e) {}
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Add Custom</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          className="hidden"
          onChange={handleCustomUpload}
        />
      </div>

      {uploadError && (
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Horizontal Scroll of Templates */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {allTemplates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              onClick={() => {
                try { if (onSelectTemplate) onSelectTemplate(template.id); } catch (e) {}
              }}
              className={`group relative flex-shrink-0 w-28 p-2 rounded-2xl text-left transition-all duration-200 border ${
                isSelected
                  ? 'bg-studio-800 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-[1.02]'
                  : 'bg-studio-950/60 border-studio-700/60 hover:border-slate-500 hover:bg-studio-800/60'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {template.tag || 'Frame'}
                </span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Template Thumbnail Representation */}
              <div className="relative w-full h-20 rounded-lg overflow-hidden bg-studio-900 border border-white/10 flex items-center justify-center">
                <img
                  src={template.src}
                  alt={template.name}
                  className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    try {
                      if (template.fallbackSrc && e.target.src !== template.fallbackSrc) {
                        e.target.src = template.fallbackSrc;
                      }
                    } catch (err) {}
                  }}
                />
              </div>

              {/* Label */}
              <div className="mt-2">
                <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {template.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {template.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Background Paper Layer Picker */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">Paper Base:</span>
        <div className="flex items-center gap-1.5">
          {PAPER_COLORS.map((p) => {
            const isChosen = (p.color || '').toLowerCase() === (selectedPaperColor || '').toLowerCase();
            return (
              <button
                key={p.id}
                onClick={() => {
                  try { if (onSelectPaperColor) onSelectPaperColor(p.color); } catch (e) {}
                }}
                title={p.name}
                className={`relative w-6 h-6 rounded-full border transition-all ${
                  isChosen
                    ? 'scale-110 border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-white/20 hover:scale-105'
                }`}
                style={{ backgroundColor: p.color }}
              >
                {isChosen && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      p.color === '#101216' ? 'bg-white' : 'bg-black'
                    }`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
