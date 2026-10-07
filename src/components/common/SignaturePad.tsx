import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onSave: (signatureDataUrl: string) => void;
  initialValue?: string;
  readOnly?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  onSave,
  initialValue,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      if (!canvas || !canvas.parentElement) return;
      const parentWidth = canvas.parentElement.clientWidth || 320;
      if (canvas.width !== parentWidth) {
        // Save current drawing if exists
        const tempUrl = canvas.toDataURL('image/png');
        canvas.width = parentWidth;
        canvas.height = 120;
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (initialValue) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = initialValue;
        } else if (hasSignature && tempUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = tempUrl;
        }
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => {
      window.removeEventListener('resize', setupCanvas);
    };
  }, [initialValue, hasSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSave('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        {!readOnly && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full block touch-none ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
        />
        {!hasSignature && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-500 text-xs italic">
            Draw digital signature here
          </div>
        )}
      </div>
    </div>
  );
};
