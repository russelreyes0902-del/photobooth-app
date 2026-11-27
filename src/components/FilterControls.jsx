import React, { useState, useRef, useEffect } from 'react';
import { FILTERS, FILTER_CATEGORIES } from '../utils/filters';
import { Wand2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FilterControls({
  activeFilterId,
  onSelectFilter,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const filteredList = FILTERS.filter(f => {
    if (activeCategory === 'all') return true;
    return f.category === activeCategory;
  });

  // Detect scroll overflow for arrow indicators
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
  }, [activeCategory, filteredList.length]);

  const scrollBy = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 200, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  // Scroll active filter into view when category changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(checkScroll, 300);
  }, [activeCategory]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-studio-900/90 backdrop-blur-md rounded-3xl border border-studio-700/60 shadow-xl select-none">
      {/* Header Row: Title + Category Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Wand2 className="w-3.5 h-3.5 text-accent-purple" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Filters
          </span>
          <span className="text-[10px] font-mono text-slate-500 ml-0.5">
            ({filteredList.length})
          </span>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1 text-[10px] overflow-x-auto scrollbar-none flex-shrink min-w-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeCategory === 'all'
                ? 'bg-rose-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({FILTERS.length})
          </button>
          {FILTER_CATEGORIES.map(cat => {
            const count = FILTERS.filter(f => f.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.shortName || cat.name.split(' ')[0]}
                <span className="ml-0.5 text-[9px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips Row with Scroll Arrows */}
      <div className="relative">
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-studio-900 to-transparent"
          >
            <ChevronLeft className="w-4 h-4 text-white/80" />
          </button>
        )}

        {/* Scrollable filter chips */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-1"
        >
          {filteredList.map((f) => {
            const isSelected = f.id === activeFilterId;
            return (
              <button
                key={f.id}
                data-active={isSelected ? 'true' : undefined}
                onClick={() => onSelectFilter(f.id)}
                title={f.description}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${
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

        {/* Right scroll arrow */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-studio-900 to-transparent"
          >
            <ChevronRight className="w-4 h-4 text-white/80" />
          </button>
        )}
      </div>
    </div>
  );
}
