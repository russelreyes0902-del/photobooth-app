import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FolderOpen, 
  Star, 
  Trash2, 
  Copy, 
  Edit3, 
  ArrowRight, 
  HardDrive, 
  X, 
  Search,
  Download
} from 'lucide-react';
import { 
  getAllProjects, 
  deleteProject, 
  toggleFavoriteProject, 
  renameProject, 
  duplicateProject, 
  getStorageEstimate 
} from '../utils/storage';

export default function LocalGalleryModal({
  isOpen,
  onClose,
  onLoadProject,
  onOpenExport,
}) {
  const [projects, setProjects] = useState([]);
  const [filterFavOnly, setFilterFavOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageInfo, setStorageInfo] = useState({ usageMb: '0', quotaMb: '0' });
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const loadData = async () => {
    try {
      const all = await getAllProjects();
      setProjects(all);
      const est = await getStorageEstimate();
      setStorageInfo(est);
    } catch (e) {
      console.warn('Gallery load error:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleFav = async (id, e) => {
    e.stopPropagation();
    await toggleFavoriteProject(id);
    await loadData();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved session?')) {
      await deleteProject(id);
      await loadData();
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    await duplicateProject(id);
    await loadData();
  };

  const handleStartRename = (project, e) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingTitle(project.title);
  };

  const handleSaveRename = async (id) => {
    if (editingTitle.trim()) {
      await renameProject(id, editingTitle.trim());
      setEditingId(null);
      await loadData();
    }
  };

  const filteredProjects = projects.filter(p => {
    if (filterFavOnly && !p.isFavorite) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[780px] bg-studio-950 border border-studio-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-studio-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Local Photo Gallery & Projects</h2>
              <p className="text-xs text-slate-400">Stored safely on your device in IndexedDB</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-white/10 rounded-xl text-[11px] text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-accent-cyan" />
              <span>{storageInfo.usageMb} MB Used</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-white/5 bg-studio-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-studio-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterFavOnly(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterFavOnly
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Favorites Only</span>
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Sparkles className="w-12 h-12 mb-3 text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">No Saved Projects Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Completed photobooth strips saved in the Studio Editor will appear here for easy re-editing and exports.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    if (onLoadProject) onLoadProject(p);
                    onClose();
                  }}
                  className="group relative bg-studio-900 border border-white/10 rounded-2xl overflow-hidden hover:border-rose-500/60 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[1/2] w-full bg-black flex items-center justify-center overflow-hidden">
                    {p.thumbnailDataUrl ? (
                      <img
                        src={p.thumbnailDataUrl}
                        alt={p.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-[11px] font-mono text-slate-500">No Preview</div>
                    )}

                    {/* Star Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFav(p.id, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                        p.isFavorite
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-black/50 text-white/70 hover:text-white'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  {/* Title & Metadata */}
                  <div className="p-3 flex flex-col justify-between flex-1 gap-2 bg-studio-900/90">
                    <div>
                      {editingId === p.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(p.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(p.id); }}
                          autoFocus
                          className="bg-black text-xs font-bold text-white border border-rose-500 rounded px-1.5 py-0.5 w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h4 className="text-xs font-bold text-white truncate" title={p.title}>
                          {p.title}
                        </h4>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString()} • {p.photos?.length || 4} shots
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-slate-400">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleStartRename(p, e)}
                          title="Rename"
                          className="p-1 hover:text-white hover:bg-white/10 rounded"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(p.id, e)}
                          title="Duplicate"
                          className="p-1 hover:text-white hover:bg-white/10 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(p.id, e)}
                          title="Delete"
                          className="p-1 hover:text-rose-400 hover:bg-white/10 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Edit</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
