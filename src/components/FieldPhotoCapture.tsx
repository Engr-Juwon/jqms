import React from 'react';
import { Camera } from 'lucide-react';

interface FieldPhotoCaptureProps {
  projectId?: string;
  recordId?: string;
  userId?: string;
  label?: string;
  disabled?: boolean;
  onCapture?: (file: File, metadata: any) => void;
}

export const FieldPhotoCapture: React.FC<FieldPhotoCaptureProps> = ({
  label = 'Field camera',
  disabled = false,
  onCapture,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const metadata = {
      timestamp: Date.now(),
      filename: file.name,
      size: file.size,
    };

    if (onCapture) {
      onCapture(file, metadata);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
        id="direct-field-photo-capture"
      />
      <label
        htmlFor="direct-field-photo-capture"
        className={`px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm'
        }`}
      >
        <Camera size={14} className="text-orange-500" />
        <span>{label}</span>
      </label>
    </div>
  );
};

export default FieldPhotoCapture;
