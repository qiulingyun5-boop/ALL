import { useState, useRef, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Camera, Trash2, Sparkles, Calendar, Info, Plus, History as HistoryIcon } from 'lucide-react';
import { ProgressPhoto, BodyStats } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeProgressPhotos } from '../lib/gemini';

interface ProgressProps {
  photos: ProgressPhoto[];
  onAddPhoto: (photo: Omit<ProgressPhoto, 'id' | 'timestamp'>) => void;
  onDeletePhoto: (id: string) => void;
  bodyStats: BodyStats[];
  onAddBodyStats: (stats: Omit<BodyStats, 'id' | 'timestamp'>) => void;
}

export default function Progress({ photos, onAddPhoto, onDeletePhoto, bodyStats, onAddBodyStats }: ProgressProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedType, setSelectedType] = useState<'front' | 'side'>('front');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("请选取有效的影像法相（图片文件）");
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      alert("识海显影读取失败，请检查文件是否损坏。");
    };

    reader.onloadend = () => {
      try {
        const img = new Image();
        img.onerror = () => {
          alert("法相解析失败，请尝试在光线充足处重新铭刻。");
        };
        img.onload = () => {
          try {
            // Compress image using canvas
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              alert("太虚转换阵地未就绪（Canvas context failure）");
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            // Quality 0.7 is a good balance
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            onAddPhoto({
              url: compressedDataUrl,
              type: selectedType
            });
          } catch (internalErr) {
            console.error("Internal image processing error:", internalErr);
            alert("识海扩容失败: " + (internalErr instanceof Error ? internalErr.message : String(internalErr)));
          }
        };
        img.src = reader.result as string;
      } catch (err) {
        console.error("FileReader result processing error:", err);
        alert("识海传音中断: " + (err instanceof Error ? err.message : String(err)));
      }
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (readErr) {
      alert("读取道印失败: " + (readErr instanceof Error ? readErr.message : String(readErr)));
    }
  };

  const handleAIAnalysis = async () => {
    if (photos.length < 2) return;
    setIsAnalyzing(true);
    
    // Take the latest front and side photos
    const latestFront = [...photos].reverse().find(p => p.type === 'front');
    const latestSide = [...photos].reverse().find(p => p.type === 'side');
    
    const photosToAnalyze = [];
    if (latestFront) photosToAnalyze.push({ url: latestFront.url, type: 'front' });
    if (latestSide) photosToAnalyze.push({ url: latestSide.url, type: 'side' });

    const result = await analyzeProgressPhotos(photosToAnalyze);
    try {
      const parsed = JSON.parse(result);
      onAddBodyStats({
        bodyFat: parsed.bodyFat,
        analysis: parsed.analysis
      });
    } catch (e) {
      console.error("Failed to parse AI result", e);
    }
    setIsAnalyzing(false);
  };

  const latestStats = bodyStats[0];

  return (
    <div className="grid gap-6 lg:grid-cols-3 text-zinc-900">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border border-zinc-100 shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-black/5">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3 font-serif italic tracking-widest text-[#D4AF37]">
                  <Camera className="h-6 w-6 text-zinc-400" />
                  肉身进阶影集
                </CardTitle>
                <CardDescription className="text-zinc-400 font-serif italic">凡躯向仙体之蜕变 · 唯你可见</CardDescription>
              </div>
              <div className="flex gap-2 bg-zinc-50 border border-zinc-100 p-1.5 rounded-2xl">
                <Button 
                  size="sm" 
                  variant={selectedType === 'front' ? 'default' : 'ghost'}
                  onClick={() => setSelectedType('front')}
                  className={`rounded-xl text-[10px] font-black h-9 px-4 transition-all ${selectedType === 'front' ? 'bg-[#8C0000] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  正面
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedType === 'side' ? 'default' : 'ghost'}
                  onClick={() => setSelectedType('side')}
                  className={`rounded-xl text-[10px] font-black h-9 px-4 transition-all ${selectedType === 'side' ? 'bg-[#8C0000] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  侧立
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-[2rem] border-2 border-dashed border-zinc-100 bg-zinc-50 flex flex-col items-center justify-center gap-3 hover:bg-zinc-100 hover:border-[#D4AF37]/30 transition-all group relative overflow-hidden active:scale-95 shadow-sm"
              >
                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="bg-[#D4AF37]/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Plus className="h-7 w-7 text-[#D4AF37]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-600">铭刻{selectedType === 'front' ? '正面' : '侧立'}像</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              
              <AnimatePresence>
                {photos.filter(p => p.type === selectedType).reverse().map((photo) => (
                  <motion.div 
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-xl border border-zinc-100 ring-1 ring-black/5"
                  >
                    <img src={photo.url} alt="Progress" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <Button size="icon" variant="destructive" className="rounded-full h-12 w-12 bg-[#8C0000] hover:bg-red-700 shadow-lg border-none" onClick={() => onDeletePhoto(photo.id)}>
                        <Trash2 className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge className="bg-white/90 backdrop-blur-md text-zinc-500 border border-zinc-100 text-[9px] font-black w-full justify-center rounded-xl py-1 shadow-sm">
                        <Calendar className="h-3 w-3 mr-1.5" />
                        {new Date(photo.timestamp).toLocaleDateString()}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-100 shadow-xl rounded-[2.5rem] bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] text-zinc-900 overflow-hidden ring-1 ring-black/5">
          <CardHeader className="p-7">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-3 font-serif italic tracking-widest text-[#6366f1]">
                  <Sparkles className="h-6 w-6 text-[#6366f1] animate-pulse" />
                  太虚法眼 · 真元洞察
                </CardTitle>
                <CardDescription className="text-zinc-500 font-serif italic">借位面之力分析法相，洞悉肉身奥秘</CardDescription>
              </div>
              <Button 
                onClick={handleAIAnalysis} 
                disabled={isAnalyzing || photos.length < 1}
                className="h-14 px-8 bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:opacity-90 text-white font-black rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.2)] transition-all active:scale-95 disabled:grayscale border-none"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 italic">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    正法在即...
                  </div>
                ) : '法眼正开'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-7 pt-0 space-y-7">
            {latestStats ? (
              <div className="space-y-7">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-7 rounded-[2.5rem] border border-blue-100 ring-1 ring-black/5 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#6366f1]/5 blur-3xl" />
                    <p className="text-[10px] text-[#6366f1] uppercase font-black tracking-[0.3em] mb-2">估计脂密度</p>
                    <p className="text-5xl font-black text-[#6366f1] font-serif tracking-tighter drop-shadow-sm italic">
                      {latestStats.bodyFat}<span className="text-sm ml-1 opacity-40">%</span>
                    </p>
                  </div>
                  <div className="bg-white p-7 rounded-[2.5rem] border border-indigo-100 ring-1 ring-black/5 flex items-center gap-4 shadow-sm">
                    <div className="bg-[#6366f1]/10 p-3 rounded-2xl">
                      <Calendar className="h-6 w-6 text-[#6366f1]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">铭刻周期</p>
                      <p className="text-sm font-black text-zinc-600">{new Date(latestStats.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 ring-1 ring-black/5 space-y-5 relative shadow-md">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6366f1]/20 to-transparent" />
                  <h4 className="font-serif italic text-xl tracking-widest flex items-center gap-3 text-zinc-900">
                    <Sparkles className="h-5 w-5 text-[#a855f7]" />
                    法眼报告 · 识海传音
                  </h4>
                  <div className="text-sm text-zinc-600 leading-relaxed italic whitespace-pre-wrap font-serif tracking-wider">
                    {latestStats.analysis}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-6">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto ring-1 ring-black/5 shadow-sm">
                  <Camera className="h-9 w-9 text-zinc-200" />
                </div>
                <div className="max-w-xs mx-auto">
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] italic leading-loose">
                    上传正面显影与侧立显影后<br />
                    法眼将为您洞悉肉身平衡、<br />
                    姿态偏颇及真元蕴含量。
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border border-zinc-100 shadow-xl rounded-[2.5rem] bg-white ring-1 ring-black/5 overflow-hidden">
          <CardHeader className="p-7">
            <CardTitle className="text-xl flex items-center gap-3 font-serif italic tracking-widest text-[#D4AF37]">
              <HistoryIcon className="h-5 w-5 text-zinc-300" />
              玄门进阶史
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] px-2">
              <div className="space-y-2 pb-4">
                {bodyStats.length === 0 ? (
                  <div className="py-32 text-center text-zinc-900">
                    <Info className="h-10 w-10 mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-300">暂无法眼纪录</p>
                  </div>
                ) : (
                  [...bodyStats].map((stat, idx) => (
                    <div key={stat.id} className={`p-5 space-y-3 mx-2 rounded-[1.5rem] border transition-all hover:opacity-90 cursor-pointer group active:scale-95 shadow-sm ring-1 ring-black/5 ${idx % 2 === 0 ? 'bg-zinc-50 border-zinc-100' : 'bg-indigo-50/30 border-indigo-100'}`}>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{new Date(stat.timestamp).toLocaleDateString()}</p>
                        <Badge className="bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 font-black text-[9px] px-2">
                          脂密 {stat.bodyFat}%
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 font-serif italic line-clamp-2 leading-relaxed tracking-wide group-hover:text-zinc-600">
                        {stat.analysis}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
