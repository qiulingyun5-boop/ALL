import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Cloud, Shield, RefreshCw, User, Mail, ChevronRight, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, logout, auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("神识连接失败 (Login Error):\n" + (err.message || "未知错误") + "\n\n请检查 Vercel 域名是否在 Firebase 的 Authorized Domains 列表中。");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[201] overflow-hidden border border-zinc-100"
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter text-zinc-900 font-serif">
                    {user ? "神识归位" : "神识开启"}
                  </h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                    {user ? "云端阵法已激活" : "同步修行记录至太虚"}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-zinc-400" />
                </button>
              </div>

              {user ? (
                <div className="space-y-6">
                  {/* User Profile */}
                  <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-100 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full border-2 border-[#D4AF37] p-0.5 overflow-hidden">
                      <img src={user.photoURL || ''} alt="" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-zinc-900 truncate">{user.displayName || '修行者'}</p>
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats/Cloud Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl">
                      <div className="bg-emerald-500/10 p-2 w-fit rounded-xl mb-3">
                        <RefreshCw className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-widest">同步状态</p>
                      <p className="text-sm font-black text-emerald-900">阵法稳定</p>
                    </div>
                    <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-4 rounded-3xl">
                      <div className="bg-[#D4AF37]/10 p-2 w-fit rounded-xl mb-3">
                        <Shield className="h-4 w-4 text-[#D4AF37]" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest">识海保护</p>
                      <p className="text-sm font-black text-[#8C0000]">高级防护</p>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="w-full h-14 rounded-2xl text-zinc-400 hover:text-red-600 hover:bg-red-50 font-bold transition-all"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    断开神识连接
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-3xl bg-zinc-50 border border-zinc-100">
                      <div className="bg-white p-2.5 rounded-2xl shadow-sm">
                        <Cloud className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900">云端备份</p>
                        <p className="text-xs text-zinc-500 leading-relaxed">更换设备随时召回修行记录，数据永不遗失。</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-3xl bg-zinc-50 border border-zinc-100">
                      <div className="bg-white p-2.5 rounded-2xl shadow-sm">
                        <Sparkles className="h-5 w-5 text-[#8C0000]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900">多端同步</p>
                        <p className="text-xs text-zinc-500 leading-relaxed">实时通过神识感知您的每一次药膳与炼体。</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSignIn}
                    disabled={loading}
                    className="w-full h-16 rounded-[2rem] bg-[#8C0000] hover:bg-[#8C0000]/90 text-white font-black text-lg shadow-xl shadow-red-900/20 group transition-all"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                        开启 Google 神识同步
                      </>
                    )}
                  </Button>
                  
                  <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                    顺为凡 · 逆则仙 · 唯有坚持不懈
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
