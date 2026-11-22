import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Scissors, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  FileText 
} from 'lucide-react';

export default function PrintStudioModal({
  isOpen,
  onClose,
  stripCanvas,
}) {
  const [paperFormat, setPaperFormat] = useState('4x6-duo'); // '4x6-duo' | '2x6-single' | 'a4-multi'
  const [includeCutMarks, setIncludeCutMarks] = useState(true);
  const printCanvasRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);

  // 300 DPI dimensions
  const DIMENSIONS = {
    '4x6-duo': { name: '4" × 6" Postcard (Two 2×6" Strips)', width: 1800, height: 1200, orientation: 'landscape', strips: 2 },
    '2x6-single': { name: '2" × 6" Single Photo Strip', width: 600, height: 1800, orientation: 'portrait', strips: 1 },
    'a4-multi': { name: 'A4 Multi-Sheet (4 Strips on Page)', width: 2480, height: 3508, orientation: 'portrait', strips: 4 },
  };

  const currentDim = DIMENSIONS[paperFormat];

  // Render print sheet canvas whenever strip or layout format changes
  useEffect(() => {
    if (!isOpen || !stripCanvas) return;

    const renderSheet = () => {
      try {
        setIsRendering(true);
        const canvas = printCanvasRef.current;
        if (!canvas) return;

        const { width, height, strips } = currentDim;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // White paper background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        if (paperFormat === '4x6-duo') {
          // Two 2x6 strips placed side by side on 4x6" landscape paper (1800 x 1200 px)
          // Each strip is rotated or placed vertically:
          // Wait: 4x6 is 1200 x 1800 in portrait, or 1800 x 1200 in landscape.
          // In portrait (1200 x 1800): Left strip (width 600, height 1800), Right strip (width 600, height 1800)!
          canvas.width = 1200;
          canvas.height = 1800;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 1200, 1800);

          const stripW = 570;
          const stripH = 1740;
          const marginY = 30;

          // Left Strip
          ctx.drawImage(stripCanvas, 20, marginY, stripW, stripH);

          // Right Strip
          ctx.drawImage(stripCanvas, 610, marginY, stripW, stripH);

          // Center Cut Marks
          if (includeCutMarks) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 12]);
            ctx.beginPath();
            ctx.moveTo(600, 10);
            ctx.lineTo(600, 1790);
            ctx.stroke();

            // Small scissors icon or marker
            ctx.fillStyle = '#64748b';
            ctx.font = '700 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('✂ CUT HERE', 600, 900);
            ctx.restore();
          }
        } else if (paperFormat === '2x6-single') {
          // Single 2x6 strip (600 x 1800 px)
          canvas.width = 600;
          canvas.height = 1800;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 600, 1800);

          const margin = 15;
          ctx.drawImage(stripCanvas, margin, margin, 600 - margin * 2, 1800 - margin * 2);
        } else if (paperFormat === 'a4-multi') {
          // A4 portrait (2480 x 3508 px) with 4 strips
          canvas.width = 2480;
          canvas.height = 3508;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 2480, 3508);

          const marginX = 80;
          const marginY = 100;
          const gapX = 40;
          const stripW = (2480 - marginX * 2 - gapX * 3) / 4;
          const stripH = 3508 - marginY * 2;

          for (let i = 0; i < 4; i++) {
            const posX = marginX + i * (stripW + gapX);
            ctx.drawImage(stripCanvas, posX, marginY, stripW, stripH);

            if (includeCutMarks && i < 3) {
              ctx.save();
              ctx.strokeStyle = '#cbd5e1';
              ctx.lineWidth = 2;
              ctx.setLineDash([16, 16]);
              ctx.beginPath();
              const cutX = posX + stripW + gapX / 2;
              ctx.moveTo(cutX, 40);
              ctx.lineTo(cutX, 3468);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      } catch (err) {
        console.warn('Print render error:', err);
      } finally {
        setIsRendering(false);
      }
    };

    renderSheet();
  }, [isOpen, stripCanvas, paperFormat, includeCutMarks]);

  if (!isOpen) return null;

  const handlePrint = () => {
    try {
      const canvas = printCanvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Photobooth Strips - RetroBooth Studio</title>
            <style>
              @page { size: auto; margin: 0mm; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: white; }
              img { width: 100%; height: auto; max-height: 100vh; object-contain: fit; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.warn('Print window error:', err);
    }
  };

  const handleDownloadPrintFile = () => {
    try {
      const canvas = printCanvasRef.current;
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retrobooth-print-300dpi-${paperFormat}-${Date.now()}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, 'image/png', 1.0);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[760px] bg-studio-950 border border-studio-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-studio-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Print Studio & Photolab Sheet</h2>
              <p className="text-xs text-slate-400">DPI-aware physical layouts (300 DPI high resolution)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Canvas Print Preview */}
          <div className="flex-1 bg-black/60 p-4 flex items-center justify-center relative overflow-hidden">
            <div className="relative max-h-full max-w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-white">
              <canvas
                ref={printCanvasRef}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right Layout & Action Panel */}
          <div className="w-full md:w-80 bg-studio-900/90 border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-2">
                  Paper Layout Format
                </span>

                <div className="flex flex-col gap-2">
                  {[
                    { id: '4x6-duo', name: '4" × 6" Postcard (Two 2×6" Strips)', desc: 'Standard photobooth dual print for you & friend' },
                    { id: '2x6-single', name: '2" × 6" Single Strip', desc: 'Single pocket photo strip print' },
                    { id: 'a4-multi', name: 'A4 Sheet (4 Strips on Page)', desc: 'Fit 4 strips on standard home A4 paper' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setPaperFormat(f.id)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        paperFormat === f.id
                          ? 'bg-rose-500/20 border-rose-400 text-white shadow-sm'
                          : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xs font-bold block">{f.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cut marks toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-accent-amber" />
                  <span className="text-xs font-bold text-slate-200">Dotted Cut Lines</span>
                </div>
                <input
                  type="checkbox"
                  checked={includeCutMarks}
                  onChange={(e) => setIncludeCutMarks(e.target.checked)}
                  className="accent-rose-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Resolution badge */}
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-300 block mb-1">Photolab Print Ready</span>
                Physical dimensions calibrated at 300 DPI for sharp prints on any home inkjet or commercial photo kiosk.
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-white/10">
              <button
                onClick={handlePrint}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>

              <button
                onClick={handleDownloadPrintFile}
                className="w-full py-2.5 bg-studio-800 hover:bg-studio-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Download Print PNG (300 DPI)</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
