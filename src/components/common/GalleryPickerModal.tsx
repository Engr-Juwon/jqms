import React, { useEffect, useState } from 'react';
import { dbService, sortByNewestFirst } from '@/lib/db';
import { SitePhoto, PhotoCategory } from '@/types';
import {
  Images,
  Search,
  X,
  Check,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Filter,
} from 'lucide-react';
import { getThumbnail } from '@/lib/cloudinary';

export interface GallerySelectedPhoto {
  url: string;
  caption: string;
  floorLevel?: string;
  tradeName?: string;
  elementName?: string;
  category?: PhotoCategory;
}

interface GalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhotos: (photos: GallerySelectedPhoto[]) => void;
  projectId: string;
  companyId: string;
  allowMultiple?: boolean;
  selectedUrls?: string[];
  title?: string;
}

export const GalleryPickerModal: React.FC<GalleryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectPhotos,
  projectId,
  companyId,
  allowMultiple = true,
  selectedUrls = [],
  title = 'Select Photo(s) from Project Gallery',
}) => {
  const [allPhotos, setAllPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedMap, setSelectedMap] = useState<Map<string, SitePhoto>>(new Map());

  // Load photos across explicit registry and linked modules
  useEffect(() => {
    if (!isOpen || !projectId) return;

    async function fetchGallery() {
      setLoading(true);
      try {
        const explicitPhotos = await dbService.getSitePhotos(projectId, companyId);
        const [comments, ncrs, inspections] = await Promise.all([
          dbService.getSiteComments(projectId, companyId).catch(() => []),
          dbService.getNCRs(projectId, companyId).catch(() => []),
          dbService.getInspections(projectId, companyId).catch(() => []),
        ]);

        const gathered: SitePhoto[] = [];

        // Comments photos
        comments.forEach((c) => {
          c.observations?.forEach((obs, obsIdx) => {
            obs.photos?.forEach((p: any, i: number) => {
              const url = typeof p === 'string' ? p : p?.url || '';
              if (!url) return;
              gathered.push({
                id: `comm-${c.id}-${obsIdx}-${i}`,
                projectId,
                companyId,
                url,
                thumbnailUrl: getThumbnail(url, 200),
                caption: typeof p === 'object' && p?.caption ? p.caption : `${c.reportNumber || 'Observation'}: ${obs.observationText || 'Site note'}`,
                sourceModule: 'SiteComments',
                sourceId: c.id,
                category: 'QUALITY_DEFECT',
                floorLevel: obs.levelName || c.locationDescription,
                tradeName: obs.tradeName,
                uploadedBy: c.raisedByName || 'Site Engineer',
                uploadedAt: c.createdAt || new Date().toISOString(),
              });
            });
          });
        });

        // NCR photos
        ncrs.forEach((n) => {
          const ncrPhotos = Array.isArray(n.photos) ? n.photos : [];
          ncrPhotos.forEach((url: string, i: number) => {
            if (!url) return;
            gathered.push({
              id: `ncr-${n.id}-${i}`,
              projectId,
              companyId,
              url,
              thumbnailUrl: getThumbnail(url, 200),
              caption: `NCR ${n.ncrNumber || ''}: ${n.title || 'Defect Evidence'}`,
              sourceModule: 'NCR',
              sourceId: n.id,
              category: 'QUALITY_DEFECT',
              floorLevel: n.levelName,
              tradeName: n.tradeName,
              uploadedBy: n.raisedByName || 'QA/QC Engineer',
              uploadedAt: n.createdAt || new Date().toISOString(),
            });
          });
        });

        // Inspection photos
        inspections.forEach((ins) => {
          ins.items?.forEach((item, itemIdx) => {
            item.photos?.forEach((url: string, i: number) => {
              if (!url) return;
              gathered.push({
                id: `insp-${ins.id}-${itemIdx}-${i}`,
                projectId,
                companyId,
                url,
                thumbnailUrl: getThumbnail(url, 200),
                caption: `Inspection ${ins.inspectionNumber || ''}: ${item.label}`,
                sourceModule: 'Inspections',
                sourceId: ins.id,
                category: 'PROGRESS',
                floorLevel: ins.levelName,
                uploadedBy: ins.inspector?.name || 'QA/QC Inspector',
                uploadedAt: ins.createdAt || new Date().toISOString(),
              });
            });
          });
        });

        // Deduplicate by URL
        const map = new Map<string, SitePhoto>();
        [...explicitPhotos, ...gathered].forEach((p) => {
          if (p.url && !map.has(p.url)) map.set(p.url, p);
        });

        const list = sortByNewestFirst(Array.from(map.values()));
        setAllPhotos(list);

        // Pre-select already chosen URLs
        const initialSelected = new Map<string, SitePhoto>();
        list.forEach((p) => {
          if (selectedUrls.includes(p.url)) {
            initialSelected.set(p.url, p);
          }
        });
        setSelectedMap(initialSelected);
      } catch (err) {
        console.error('Failed to load gallery photos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGallery();
  }, [isOpen, projectId, companyId]);

  if (!isOpen) return null;

  const toggleSelect = (photo: SitePhoto) => {
    if (!allowMultiple) {
      const singleMap = new Map<string, SitePhoto>();
      singleMap.set(photo.url, photo);
      setSelectedMap(singleMap);
      return;
    }

    const next = new Map(selectedMap);
    if (next.has(photo.url)) {
      next.delete(photo.url);
    } else {
      next.set(photo.url, photo);
    }
    setSelectedMap(next);
  };

  const handleConfirm = () => {
    const selectedList: GallerySelectedPhoto[] = Array.from(selectedMap.values()).map((p) => ({
      url: p.url,
      caption: p.caption,
      floorLevel: p.floorLevel,
      tradeName: p.tradeName,
      elementName: p.elementName,
      category: p.category,
    }));
    onSelectPhotos(selectedList);
    onClose();
  };

  const filtered = sortByNewestFirst(allPhotos.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchSearch =
      (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.floorLevel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tradeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sourceModule || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Images className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pick from existing site photos and defect records across all modules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search caption, floor level, trade, or module..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {['ALL', 'QUALITY_DEFECT', 'PROGRESS', 'POUR', 'MATERIAL', 'SAFETY'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                  categoryFilter === cat
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2" />
              Loading project media repository...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              <Images className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-700 dark:text-slate-300 font-bold">No matching site photos found</p>
              <p className="text-slate-500 text-[11px] mt-1">
                Upload new photos to synchronize them automatically with the gallery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filtered.map((photo) => {
                const isSelected = selectedMap.has(photo.url);
                return (
                  <div
                    key={photo.id || photo.url}
                    onClick={() => toggleSelect(photo)}
                    className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition select-none flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500/50 bg-brand-50 dark:bg-brand-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950/80'
                    }`}
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                      <img
                        src={getThumbnail(photo.url, 250)}
                        alt={photo.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />

                      {/* Top status & module badges */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] font-mono font-bold text-white">
                        {photo.sourceModule || 'Photo'}
                      </div>

                      {/* Selection Checkmark Button */}
                      <div className="absolute top-2 right-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-black/60 border border-white/40 group-hover:border-white text-transparent flex items-center justify-center transition">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Info Snippet */}
                    <div className="p-2.5 space-y-1 text-[11px]">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">
                        {photo.caption || 'Site Photo'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{photo.floorLevel || 'Site'}</span>
                        <span>{photo.tradeName || ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">{selectedMap.size}</span> photo(s) selected
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedMap.size === 0}
              onClick={handleConfirm}
              className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Attach Selected ({selectedMap.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
