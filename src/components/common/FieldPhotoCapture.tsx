import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, X, Check, MapPin, Clock } from 'lucide-react';
import { uploadImage, getThumbnail } from '@/lib/cloudinary';

export interface FieldPhotoMetadata {
  timestamp?: number;
  dateString?: string;
  gps?: { lat: number; lng: number };
  heading?: number;
  elementTag?: string;
  floorLevel?: string;
  tradeName?: string;
}

interface FieldPhotoCaptureProps {
  onCapture: (file: File, metadata: FieldPhotoMetadata) => void | Promise<void>;
  disabled?: boolean;
  folder?: string;
  label?: string;
  buttonClassName?: string;
}

export const FieldPhotoCapture: React.FC<FieldPhotoCaptureProps> = ({
  onCapture,
  disabled = false,
  folder = 'jqms/field-capture',
  label = 'Capture Camera',
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputFallbackRef = useRef<HTMLInputElement | null>(null);

  // Fetch GPS coordinates
  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation warning:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const startCamera = async () => {
    setErrorMsg(null);
    fetchLocation();
    try {
      // Try to acquire environmental (back-facing) camera first
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setIsOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Direct camera stream failed, falling back to native file capture:', err);
      // Fallback directly to native camera file input
      if (fileInputFallbackRef.current) {
        fileInputFallbackRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedPreview(null);
    setCapturedBlob(null);
    setIsOpen(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add optional QA/QC site watermark at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    const stampText = `JQMS QA/QC • ${new Date().toLocaleString()}${
      gps ? ` • GPS: ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : ''
    }`;
    ctx.fillText(stampText, 16, canvas.height - 15);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedPreview(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleConfirm = async () => {
    if (!capturedBlob) return;
    setProcessing(true);
    try {
      const now = Date.now();
      const fileName = `site_capture_${now}.jpg`;
      const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });
      const meta: FieldPhotoMetadata = {
        timestamp: now,
        dateString: new Date(now).toISOString(),
        gps: gps || undefined,
      };

      await onCapture(file, meta);
      stopCamera();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to process capture');
    } finally {
      setProcessing(false);
    }
  };

  const handleNativeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fetchLocation();
    setProcessing(true);
    try {
      const meta: FieldPhotoMetadata = {
        timestamp: Date.now(),
        dateString: new Date().toISOString(),
        gps: gps || undefined,
      };
      await onCapture(file, meta);
    } catch (err: any) {
      console.error('Field capture failed:', err);
    } finally {
      setProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <>
      {/* Hidden native camera capture input as fallback */}
      <input
        ref={fileInputFallbackRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeFileChange}
      />

      <button
        type="button"
        disabled={disabled || processing}
        onClick={startCamera}
        className={
          buttonClassName ||
          'px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50'
        }
        title="Open device camera"
      >
        <Camera className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
        <span>{processing ? 'Processing...' : label}</span>
      </button>

      {/* Live Camera View Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-400" />
                <span className="font-bold text-sm text-white">Live Site Photo Capture</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video / Snapshot Viewport */}
            <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
              {capturedPreview ? (
                <img
                  src={capturedPreview}
                  alt="Captured snapshot"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => videoRef.current?.play()}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Watermark Preview Overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/80 bg-black/60 backdrop-blur px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                {gps && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Error notice */}
            {errorMsg && (
              <div className="px-4 py-2 bg-red-950/80 border-t border-red-800 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Bottom Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
              {capturedPreview ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPreview(null);
                      setCapturedBlob(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleConfirm}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{processing ? 'Saving...' : 'Confirm & Attach'}</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={captureFrame}
                    className="w-16 h-16 rounded-full border-4 border-brand-500 bg-white/20 hover:bg-white/40 active:scale-95 transition flex items-center justify-center"
                    title="Take Snapshot"
                  >
                    <div className="w-11 h-11 rounded-full bg-brand-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
