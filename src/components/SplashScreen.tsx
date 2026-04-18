import { motion } from 'motion/react';
import { Sword } from 'lucide-react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 0.8 }}
      onAnimationComplete={onFinish}
      className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Zen Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8C0000]/10 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#D4AF37]/5 blur-[100px] rounded-full" />

      {/* Logo Section */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative mb-8"
      >
        <div className="bg-[#8C0000] p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(140,0,0,0.3)] border border-red-800/20 relative z-10">
          <Sword className="h-16 w-16 text-white" />
        </div>
        {/* Glow behind the icon */}
        <div className="absolute inset-0 bg-[#8C0000] blur-2xl opacity-40 rounded-full scale-150" />
      </motion.div>

      {/* Brand Name */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-6xl font-black tracking-tighter text-white italic font-serif flex items-center justify-center gap-2">
          ALL <span className="text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">FIT</span>
        </h1>
        <div className="h-px w-12 bg-[#D4AF37]/40 mx-auto my-6" />
        
        {/* Mantra */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-lg font-serif italic text-zinc-400 tracking-[0.4em] font-medium"
        >
          不是自律 · 纯属上瘾
        </motion.p>
      </motion.div>

      {/* Loading Bar */}
      <div className="absolute bottom-12 w-48 h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-[#8C0000] to-[#D4AF37]"
        />
      </div>
    </motion.div>
  );
}
