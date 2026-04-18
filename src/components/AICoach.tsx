
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Sparkles, User, ChevronRight } from 'lucide-react';
import { getHealthAdvice } from '../lib/gemini';
import { Meal, WorkoutLog } from '../types';
import { motion } from 'motion/react';

interface AICoachProps {
  meals: Meal[];
  logs: WorkoutLog[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AICoach({ meals, logs, messages, setMessages, onBack }: AICoachProps & { 
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onBack?: () => void 
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting if history is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: '仙友请了！我是你的 AI 健身指导。我可以根据你的炼体与膳食记录提供建议。今日修行可有困惑？' }]);
    }
  }, [messages.length, setMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Construct context for Gemini
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const today = now.getTime();
      const todayMeals = meals.filter(m => m.timestamp >= today);
      const todayLogs = logs.filter(l => l.timestamp >= today);

      const context = `
        用户今日数据：
        - 摄入热量: ${todayMeals.reduce((acc, m) => acc + m.calories, 0)} kcal
        - 消耗热量: ${todayLogs.reduce((acc, l) => acc + l.caloriesBurned, 0)} kcal
        - 饮食详情: ${todayMeals.map(m => m.name).join(', ')}
        - 运动详情: ${todayLogs.length} 次运动
        
        用户问题: ${userMessage}
      `;

      const advice = await getHealthAdvice(context);
      setMessages(prev => [...prev, { role: 'assistant', content: advice }]);
    } catch (error) {
      console.error("Coach Error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "抱歉，我的灵力出现了波动，请稍后再试或检查网络状态。原因：" + errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-zinc-100 shadow-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-[78vh] sm:h-[700px] max-h-[85vh] ring-1 ring-black/5">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50 p-4 sm:p-7 shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-10 w-10 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
              <ChevronRight className="h-6 w-6 rotate-180" />
            </Button>
          )}
          <div className="bg-[#D4AF37]/10 p-2.5 rounded-2xl shadow-sm border border-[#D4AF37]/20">
            <Sparkles className="h-7 w-7 text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl sm:text-2xl font-serif italic tracking-widest text-zinc-900">仙门传功大师</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs text-zinc-400 font-serif lowercase tracking-widest">基于实时仙力流转，指点功法与药膳</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col min-h-0 bg-white relative">
        <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-5 pointer-events-none" />
        {/* Scrollable Content - Native scroll for better reliability */}
        <div className="flex-1 px-4 py-6 sm:p-8 overflow-y-auto min-h-0 overscroll-contain touch-pan-y custom-scrollbar">
          <div className="space-y-6 sm:space-y-8 pb-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 border-2 shadow-sm shrink-0 ${msg.role === 'assistant' ? 'border-[#D4AF37]/30 ring-2 ring-[#D4AF37]/10' : 'border-[#8C0000]/30 ring-2 ring-[#8C0000]/10'}`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=master&backgroundColor=ffffff`} />
                      <AvatarFallback className="bg-zinc-100 text-[#D4AF37]">大师</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarFallback className="bg-zinc-100 text-[#8C0000]"><User className="h-5 w-5 sm:h-6 sm:w-6" /></AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className={`max-w-[85%] p-4 sm:p-5 rounded-[1.8rem] sm:rounded-[2.2rem] text-[14px] sm:text-[15px] leading-relaxed shadow-sm border ${
                  msg.role === 'assistant' 
                    ? 'bg-zinc-50 text-zinc-600 border-zinc-100 rounded-tl-none font-serif tracking-wide' 
                    : 'bg-[#8C0000] text-white border-none rounded-tr-none font-bold italic shadow-md'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse border-2 border-[#D4AF37]/20">
                  <AvatarFallback className="bg-zinc-50 text-[#D4AF37]">冥想</AvatarFallback>
                </Avatar>
                <div className="bg-zinc-50 p-4 sm:p-5 rounded-[1.8rem] rounded-tl-none border border-zinc-100 shadow-sm">
                  <div className="flex gap-1.5 px-2">
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            {messages.length === 1 && !input && (
              <div className="flex flex-wrap gap-2.5 mt-6 px-2">
                {['今日膳食调理如何？', '推荐一卷炼体功法', '如何精进气力？'].map((q) => (
                  <Button 
                    key={q} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full text-[11px] font-serif italic border-zinc-200 bg-white text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all active:scale-95 px-5 h-9 shadow-sm"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}
            <div ref={scrollRef} className="h-4 w-full" />
          </div>
        </div>

        <div className="p-7 border-t border-zinc-100 bg-zinc-50/50 backdrop-blur-md">
          <div className="flex gap-3 bg-white border border-zinc-200 p-2 rounded-[1.8rem] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 transition-all group shadow-inner">
            <input
              type="text"
              placeholder="请大师指点迷津... (输入修行困惑)"
              className="flex-1 bg-transparent border-none focus:ring-0 px-5 py-3 text-sm text-zinc-900 placeholder:text-zinc-300 font-serif italic"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              className="rounded-2xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white shadow-md transition-all active:scale-90 h-12 w-12"
              onClick={handleSend}
              disabled={isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
