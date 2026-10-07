import imageCompression from 'browser-image-compression';

/**
 * Cloudinary configuration for JQMS enterprise
 * Default unsigned upload preset and cloud name
 */
export const CLOUD_NAME = 'dpcnanmjl';
export const UPLOAD_PRESET = 'ml_default';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  originalFilename?: string;
  resourceType?: string;
}

/**
 * Compresses an image file client-side before Cloudinary upload
 */
export async function compressFile(file: File): Promise<File> {
  // Only attempt compression on image files
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // If SVG or GIF, don't compress
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const options = {
    maxSizeMB: 1,           // Max size targeted under 1MB
    maxWidthOrHeight: 1920, // Downscale high-res site photos (max 1080p/2K)
    useWebWorker: true,     // Prevents UI thread lag during compression
    fileType: 'image/jpeg', // Standardize format for high compression ratio
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn('Image compression failed, proceeding with original file:', error);
    return file; // Fallback to original
  }
}

/**
 * Uploads an image to Cloudinary with automatic client-side compression
 */
export async function uploadImage(
  file: File,
  folder = 'jqms/photos'
): Promise<UploadResult> {
  // 1. Compress file client-side
  const compressedFile = await compressFile(file);

  // 2. Prepare FormData payload
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  // 3. Upload to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Image upload failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
    originalFilename: data.original_filename || file.name,
    resourceType: data.resource_type || 'image',
  };
}

/**
 * Uploads a document (PDF, Excel, CAD, Image, etc.) to Cloudinary (resource_type: auto)
 */
export async function uploadDocument(
  file: File,
  folder = 'jqms/documents'
): Promise<UploadResult> {
  let fileToUpload = file;
  const isImage = file.type && file.type.startsWith('image/');

  if (isImage) {
    fileToUpload = await compressFile(file);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const endpoint = isImage
    ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Document upload failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
    originalFilename: data.original_filename || file.name,
    resourceType: data.resource_type || (isImage ? 'image' : 'raw'),
  };
}

/**
 * Upload multiple files to Cloudinary concurrently
 */
export async function uploadMultiple(
  files: File[],
  folder = 'jqms/photos'
): Promise<UploadResult[]> {
  return Promise.all(files.map((f) => uploadImage(f, folder)));
}

/**
 * Upload multiple documents to Cloudinary concurrently
 */
export async function uploadMultipleDocuments(
  files: File[],
  folder = 'jqms/documents'
): Promise<UploadResult[]> {
  return Promise.all(files.map((f) => uploadDocument(f, folder)));
}

/**
 * Returns a high-performance resized thumbnail URL from Cloudinary
 */
export function getThumbnail(url: any, size = 200): string {
  if (!url) return '';
  const actualUrl = typeof url === 'string' ? url : url?.url || url?.thumbnailUrl || url?.secure_url || '';
  if (!actualUrl || typeof actualUrl !== 'string') return '';
  if (!actualUrl.includes('cloudinary.com')) return actualUrl;
  return actualUrl.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}

/**
 * Returns an optimized width URL from Cloudinary with auto format and compression
 */
export function getOptimized(url: any, width = 800): string {
  if (!url) return '';
  const actualUrl = typeof url === 'string' ? url : url?.url || url?.optimizedUrl || url?.secure_url || '';
  if (!actualUrl || typeof actualUrl !== 'string') return '';
  if (!actualUrl.includes('cloudinary.com')) return actualUrl;
  return actualUrl.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}
