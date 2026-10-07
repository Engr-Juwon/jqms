import React, { useState } from 'react';
import { uploadMultiple, getThumbnail, getOptimized } from '@/lib/cloudinary';
import { syncMultiplePhotosToSiteGallery, syncPhotoToSiteGallery } from '@/lib/photoSync';
import { FieldPhotoCapture, FieldPhotoMetadata } from '@/components/common/FieldPhotoCapture';
import { GalleryPickerModal, GallerySelectedPhoto } from '@/components/common/GalleryPickerModal';
import { SitePhoto, PhotoCategory } from '@/types';
import {
  Upload,
  Camera,
  Images,
  Trash2,
  Maximize2,
  X,
  Plus,
  Sparkles,
  CheckCircle2,
  FileImage,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface PhotoItem {
  url: string;
  caption?: string;
}

interface UniversalPhotoUploaderProps {
  photos: PhotoItem[] | string[];
  onChange: (photos: PhotoItem[]) => void;
  projectId: string;
  companyId: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploaderRole?: string;
  sourceModule: SitePhoto['sourceModule'];
  sourceId: string;
  floorLevel?: string;
  elementName?: string;
  tradeName?: string;
  category?: PhotoCategory;
  folder?: string;
  title?: string;
  description?: string;
  maxPhotos?: number;
  disabled?: boolean;
  theme?: 'dark' | 'light';
  allowGalleryPicker?: boolean;
  allowCameraCapture?: boolean;
  allowFileUpload?: boolean;
}

export const UniversalPhotoUploader: React.FC<UniversalPhotoUploaderProps> = ({
  photos = [],
  onChange,
  projectId,
  companyId,
  uploadedBy = 'QA/QC Engineer',
  uploadedByName,
  uploaderRole,
  sourceModule,
  sourceId,
  floorLevel,
  elementName,
  tradeName,
  category = 'PROGRESS',
  folder = 'jqms/evidence',
  title = 'Photographic Evidence & Verification Records',
  description = 'Upload new photos, capture directly with device camera, or attach from the universal project gallery.',
  maxPhotos = 30,
  disabled = false,
  theme = 'dark',
  allowGalleryPicker = true,
  allowCameraCapture = true,
  allowFileUpload = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);

  // Normalize input into standard PhotoItem[]
  const normalizedPhotos: PhotoItem[] = (photos || []).map((p) => {
    if (typeof p === 'string') return { url: p, caption: '' };
    return { url: p.url || '', caption: p.caption || '' };
  });

  const selectedUrls = normalizedPhotos.map((p) => p.url).filter(Boolean);

  // 1. Handle Direct File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || disabled) return;

    if (normalizedPhotos.length + files.length > maxPhotos) {
      toast.error(`Maximum of ${maxPhotos} photos allowed.`);
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Compressing & uploading photos to Cloudinary...');

    try {
      const fileList = Array.from(files);
      const results = await uploadMultiple(fileList, folder);

      const newPhotoItems: PhotoItem[] = results.map((res) => ({
        url: res.url,
        caption: `${sourceModule || 'Site'} Record - ${elementName || floorLevel || 'General'} (${new Date().toLocaleDateString()})`,
      }));

      const updated = [...normalizedPhotos, ...newPhotoItems];
      onChange(updated);

      // Auto-sync to Central Site Gallery
      await syncMultiplePhotosToSiteGallery(
        newPhotoItems.map((item) => ({
          projectId,
          companyId,
          url: item.url,
          thumbnailUrl: getThumbnail(item.url, 200),
          caption: item.caption || 'Site photographic record',
          floorLevel,
          elementName,
          category,
          tradeName,
          uploadedBy,
          uploadedByName: uploadedByName || uploadedBy,
          uploaderRole,
          sourceModule,
          sourceId,
        }))
      );

      toast.success(`${newPhotoItems.length} photo(s) uploaded and indexed in gallery!`, {
        id: toastId,
      });
    } catch (error: any) {
      console.error('Cloudinary multi-upload failed:', error);
      toast.error(`Upload error: ${error?.message || 'Failed to upload photo'}`, {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // 2. Handle Field Camera Capture
  const handleFieldCameraCapture = async (file: File, meta: FieldPhotoMetadata) => {
    if (disabled) return;
    setIsUploading(true);
    const toastId = toast.loading('Uploading camera snapshot to Cloudinary...');

    try {
      const results = await uploadMultiple([file], folder);
      const res = results[0];

      const captionText = `${sourceModule || 'Site'} Snapshot - ${elementName || floorLevel || 'Field'} (${new Date().toLocaleDateString()})`;
      const newItem: PhotoItem = {
        url: res.url,
        caption: captionText,
      };

      const updated = [...normalizedPhotos, newItem];
      onChange(updated);

      // Auto-sync to Central Site Gallery
      await syncPhotoToSiteGallery({
        projectId,
        companyId,
        url: res.url,
        thumbnailUrl: getThumbnail(res.url, 200),
        caption: captionText,
        floorLevel,
        elementName,
        category,
        tradeName,
        uploadedBy,
        uploadedByName: uploadedByName || uploadedBy,
        uploaderRole,
        sourceModule,
        sourceId,
      });

      toast.success('Live camera photo captured and attached!', { id: toastId });
    } catch (error: any) {
      console.error('Field capture upload failed:', error);
      toast.error(`Capture failed: ${error?.message || 'Could not upload snapshot'}`, {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Handle Project Gallery Selection
  const handleGallerySelected = async (selectedList: GallerySelectedPhoto[]) => {
    const existingUrlSet = new Set(normalizedPhotos.map((p) => p.url));
    const newlyAddedItems: PhotoItem[] = [];

    selectedList.forEach((sel) => {
      if (!existingUrlSet.has(sel.url)) {
        newlyAddedItems.push({
          url: sel.url,
          caption: sel.caption || `${sourceModule} attached record`,
        });
      }
    });

    if (newlyAddedItems.length === 0) return;

    const updated = [...normalizedPhotos, ...newlyAddedItems];
    onChange(updated);

    toast.success(`${newlyAddedItems.length} photo(s) attached from project gallery!`);
  };

  // 4. Update Caption for a photo
  const handleCaptionChange = (index: number, newCaption: string) => {
    const updated = [...normalizedPhotos];
    updated[index] = { ...updated[index], caption: newCaption };
    onChange(updated);
  };

  // 5. Remove a photo
  const handleRemovePhoto = (index: number) => {
    const updated = normalizedPhotos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 transition space-y-5 bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm"
    >
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3
              className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-slate-100"
            >
              <FileImage className="w-4 h-4 text-brand-500" />
              <span>{title}</span>
            </h3>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-800 dark:text-brand-300"
            >
              {normalizedPhotos.length} photo{normalizedPhotos.length !== 1 ? 's' : ''}
            </span>
          </div>
          {description && (
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        {!disabled && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Direct Upload */}
            {allowFileUpload && (
              <label
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition shadow-sm bg-brand-600 hover:bg-brand-500 text-white ${
                  isUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload Media'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}

            {/* Field Camera Capture */}
            {allowCameraCapture && (
              <FieldPhotoCapture
                onCapture={handleFieldCameraCapture}
                disabled={isUploading}
                folder={folder}
                label="Camera Snap"
                buttonClassName="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              />
            )}

            {/* Pick from Project Gallery */}
            {allowGalleryPicker && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsGalleryOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                <Images className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Choose from Gallery</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Photo Cards Grid */}
      {normalizedPhotos.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-500">
          <Images className="w-8 h-8 opacity-40" />
          <p className="text-xs font-medium">No photo evidence attached yet.</p>
          <p className="text-[11px] opacity-70">
            Click above to upload from device, take a live site snap, or attach existing images from the gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {normalizedPhotos.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden border transition flex flex-col justify-between shadow-sm hover:shadow-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={getThumbnail(item.url, 400)}
                  alt={item.caption || `Evidence photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />

                {/* Quick overlay controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(item)}
                    className="p-2 rounded-xl bg-black/70 hover:bg-black text-white transition shadow"
                    title="View Full Size"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition shadow"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption Input */}
              <div className="p-3 space-y-1">
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={(e) => handleCaptionChange(idx, e.target.value)}
                  placeholder="Enter photo caption / notes..."
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none transition bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:border-brand-500 placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gallery Picker Modal */}
      {isGalleryOpen && (
        <GalleryPickerModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelectPhotos={handleGallerySelected}
          projectId={projectId}
          companyId={companyId}
          selectedUrls={selectedUrls}
          allowMultiple={true}
          title={`Attach Photos to ${sourceModule}`}
        />
      )}

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-black flex items-center justify-center p-4">
              <img
                src={getOptimized(previewPhoto.url, 1600)}
                alt="Full size view"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>

            {previewPhoto.caption && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                {previewPhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
