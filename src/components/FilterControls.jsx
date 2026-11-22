import React, { useState } from 'react';
import { FILTERS, FILTER_CATEGORIES } from '../utils/filters';
import { Wand2 } from 'lucide-react';

export default function FilterControls({
  activeFilterId,
  onSelectFilter,
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredList = FILTERS.filter(f => {
    if (activeCategory === 'all') return true;
    return f.category === activeCategory || (activeCategory === 'film' && f.id === 'normal');
  });

  return (
    <div className="flex flex-col gap-2 p-3 bg-studio-900/90 backdrop-blur-md rounded-3xl border border-studio-700/60 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-accent-purple" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Aesthetic Filters
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-rose-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredList.map((f) => {
          const isSelected = f.id === activeFilterId;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFilter(f.id)}
              title={f.description}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                isSelected
                  ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] scale-[1.02]'
                  : 'bg-studio-950/70 text-slate-300 border-studio-700/60 hover:border-slate-500 hover:text-white hover:bg-studio-800'
              }`}
            >
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
