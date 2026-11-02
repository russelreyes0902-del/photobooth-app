import React from 'react';
import { FILTERS } from '../utils/filters';
import { Sliders, Wand2 } from 'lucide-react';

export default function FilterControls({
  activeFilterId,
  onSelectFilter,
}) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-studio-900/90 backdrop-blur-md rounded-3xl border border-studio-700/60 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-accent-purple" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Aesthetic Filters
          </span>
        </div>
        <span className="text-[10px] text-slate-400">Live & Post-Capture</span>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {FILTERS.map((f) => {
          const isSelected = f.id === activeFilterId;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFilter(f.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                isSelected
                  ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] scale-[1.02]'
                  : 'bg-studio-950/70 text-slate-300 border-studio-700/60 hover:border-slate-500 hover:text-white hover:bg-studio-800'
              }`}
            >
              {/* Visual Color Swatch */}
              <div
                className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${f.previewGradient} border border-white/20 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}
              />
              <span>{f.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
