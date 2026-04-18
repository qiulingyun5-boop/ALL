import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-white/5 rounded-[3rem] w-full max-w-md overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-6 top-6 z-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-serif italic tracking-widest text-[#D4AF37]">太虚搜识</h3>
            <p className="text-[10px] text-zinc-500 font-serif uppercase tracking-[0.3em]">将凡间条码置于道印之内</p>
          </div>
          
          <div id="reader" className="overflow-hidden rounded-[2rem] border-2 border-dashed border-white/5 bg-zinc-900/50 relative">
            <div className="absolute inset-0 pointer-events-none border-2 border-[#D4AF37]/20 rounded-[2rem] animate-pulse" />
          </div>
          
          <div className="bg-[#D4AF37]/5 p-5 rounded-3xl border border-[#D4AF37]/10 flex items-start gap-4">
            <div className="bg-[#D4AF37]/20 p-2 rounded-xl mt-0.5">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-serif italic">
              此道法可识得大部分预包装膳食之灵气。数据由万界粮仓 (Open Food Facts) 显影提供。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
