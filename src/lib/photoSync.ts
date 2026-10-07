import { SitePhoto, PhotoCategory } from "@/types";
import { dbService } from "@/lib/db";
import { rtdb } from "@/firebase";
import { ref, set } from "firebase/database";
import { getThumbnail } from "@/lib/cloudinary";

export interface SyncPhotoParams {
  projectId: string;
  companyId: string;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  building?: string;
  floor?: string;
  floorLevel?: string;
  levelId?: string;
  levelName?: string;
  location?: string;
  elementId?: string;
  elementName?: string;
  category?: PhotoCategory;
  tradeId?: string;
  tradeName?: string;
  subtradeId?: string;
  subtradeName?: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploaderRole?: string;
  sourceModule: SitePhoto["sourceModule"];
  sourceId: string;
  markupData?: string;
}

/**
 * Universal photo sync function that registers any photo uploaded across any module
 * directly into the project's central Photo Gallery database & local cache.
 */
export async function syncPhotoToSiteGallery(
  params: SyncPhotoParams,
): Promise<SitePhoto> {
  const photoId = `PHOTO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const category: PhotoCategory = params.category || 'PROGRESS';
  const thumb = params.thumbnailUrl || getThumbnail(params.url, 200) || params.url;


  const cleanPhoto = {
    id: photoId,
    projectId: params.projectId,
    companyId: params.companyId,
    url: params.url,
    thumbnailUrl: thumb,
    caption: params.caption || 'Site photographic record',
    building: params.building || null,
    floor: params.floor || null,
    floorLevel: params.floorLevel || params.floor || params.levelName || null,
    levelId: params.levelId || null,
    levelName: params.levelName || params.floorLevel || params.floor || null,
    location: params.location || null,
    elementId: params.elementId || null,
    elementName: params.elementName || params.building || null,
    category,
    tradeId: params.tradeId || null,
    tradeName: params.tradeName || null,
    subtradeId: params.subtradeId || null,
    subtradeName: params.subtradeName || null,
    takenAt: Date.now(),
    uploadedBy: params.uploadedBy,
    uploadedByName: params.uploadedByName || params.uploadedBy,
    uploaderRole: params.uploaderRole || null,
    uploadedAt: nowIso,
    sourceModule: params.sourceModule,
    sourceId: params.sourceId,
    markupData: params.markupData || null,
    createdAt: Date.now(),
  } as SitePhoto;

  // 1. Save to primary database service (Firestore + Cache)
  try {
    await dbService.savePhoto(cleanPhoto);
  } catch (error) {
    console.warn('dbService.savePhoto warning:', error);
  }

  // 2. Realtime Database mirror
  try {
    const photoRef = ref(rtdb, `sitePhotos/${params.projectId}/${photoId}`);
    await set(photoRef, cleanPhoto);
  } catch (error) {
    // RTDB fallback silently tolerated
  }

  // 3. Local storage backup for offline resilience
  try {
    const key = `jqms_photos_${params.projectId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    // Prevent duplicate URLs in local storage
    const filtered = existing.filter((p: SitePhoto) => p.url !== cleanPhoto.url);
    filtered.unshift(cleanPhoto);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Local photo gallery backup notice:', e);
  }

  return cleanPhoto;
}

/**
 * Batch syncs multiple photos to the central gallery repository
 */
export async function syncMultiplePhotosToSiteGallery(
  photos: SyncPhotoParams[],
): Promise<SitePhoto[]> {
  return Promise.all(photos.map((p) => syncPhotoToSiteGallery(p)));
}
