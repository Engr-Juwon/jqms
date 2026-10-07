import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  Circle,
  Square,
  Type,
  RotateCcw,
  Save,
  Check,
} from 'lucide-react';

interface PhotoMarkupModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveAnnotatedImage: (annotatedDataUrl: string) => void;
}

type ToolMode = 'ARROW' | 'CIRCLE' | 'RECT' | 'TEXT' | 'FREEHAND';

export const PhotoMarkupModal: React.FC<PhotoMarkupModalProps> = ({
  imageUrl,
  isOpen,
  onClose,
  onSaveAnnotatedImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolMode>('ARROW');
  const [color, setColor] = useState('#ef4444'); // Red standard
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('DEFECT');
  const [history, setHistory] = useState<ImageData[]>([]);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fit aspect ratio within max 800x600
      const maxW = 760;
      const maxH = 500;
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.floor(w * ratio);
      h = Math.floor(h * ratio);

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, w, h);
      setHistory([ctx.getImageData(0, 0, w, h)]);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHist = [...history];
    newHist.pop(); // remove current
    const prevState = newHist[newHist.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHist);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setStartPos(coords);
    setIsDrawing(true);

    if (tool === 'TEXT') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(textInput, coords.x, coords.y);
      ctx.fillText(textInput, coords.x, coords.y);
      saveHistoryState();
      setIsDrawing(false);
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 16;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawingMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'TEXT') return;
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Restore last clean state for live preview
    ctx.putImageData(history[history.length - 1], 0, 0);

    const currentPos = getCanvasCoords(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'ARROW') {
      drawArrow(ctx, startPos.x, startPos.y, currentPos.x, currentPos.y);
    } else if (tool === 'CIRCLE') {
      const radiusX = Math.abs(currentPos.x - startPos.x) / 2;
      const radiusY = Math.abs(currentPos.y - startPos.y) / 2;
      const centerX = Math.min(startPos.x, currentPos.x) + radiusX;
      const centerY = Math.min(startPos.y, currentPos.y) + radiusY;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'RECT') {
      const w = currentPos.x - startPos.x;
      const h = currentPos.y - startPos.y;
      ctx.beginPath();
      ctx.strokeRect(startPos.x, startPos.y, w, h);
    }
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistoryState();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSaveAnnotatedImage(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <Square className="w-5 h-5" />
            </span>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Circle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Photo Markup & Defect Sketch</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Annotate defect locations with arrows, callouts, and boxes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-sm">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setTool('ARROW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tool === 'ARROW' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>Arrow</span>
            </button>
            <button
              onClick={() => setTool('CIRCLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tool === 'CIRCLE' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span>Circle</span>
            </button>
            <button
              onClick={() => setTool('RECT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tool === 'RECT' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Square className="w-4 h-4" />
              <span>Box</span>
            </button>
            <button
              onClick={() => setTool('TEXT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tool === 'TEXT' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text Callout</span>
            </button>
          </div>

          {/* Text Input if Text tool */}
          {tool === 'TEXT' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Note:</span>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                placeholder="Click photo to place..."
              />
            </div>
          )}

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            {['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === c ? 'border-brand-500 scale-110 shadow-lg' : 'border-slate-300 dark:border-transparent opacity-80'
                }`}
              />
            ))}
          </div>

          {/* Undo Action */}
          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={drawingMove}
            onMouseUp={endDraw}
            className="rounded-xl shadow-2xl border border-slate-300 dark:border-slate-800 cursor-crosshair max-w-full block"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save & Attach Markup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
