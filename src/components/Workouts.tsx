import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Search, Timer, CheckCircle2, Circle, Plus, Minus, Trash2, Dumbbell, Clock, History, ChevronRight, Calendar, Sparkles, Flame, TrendingUp, Target, Sword } from 'lucide-react';
import { EXERCISES } from '../constants';
import { Exercise, WorkoutLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import WorkoutCalendar from './WorkoutCalendar';
import { calculateXP } from '../lib/cultivation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface WorkoutsProps {
  onAddLog: (log: Omit<WorkoutLog, 'id' | 'timestamp'>) => void;
  onDeleteLog: (id: string) => void;
  logs: WorkoutLog[];
  weight: number;
  plannedWorkouts: { 
    exercise: Exercise; 
    sets: { id: number; done: boolean; weight?: string; reps?: string; incline?: string; speed?: string }[] 
  }[];
  setPlannedWorkouts: React.Dispatch<React.SetStateAction<{ 
    exercise: Exercise; 
    sets: { id: number; done: boolean; weight?: string; reps?: string; incline?: string; speed?: string }[] 
  }[]>>;
  startTime: number | null;
  setStartTime: (time: number | null) => void;
  elapsedTime: number;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  isTimerActive: boolean;
  setIsTimerActive: (active: boolean) => void;
  restDuration: number;
  setRestDuration: (duration: number) => void;
}

export default function Workouts({ 
  onAddLog, 
  onDeleteLog,
  logs,
  weight,
  plannedWorkouts,
  setPlannedWorkouts,
  startTime,
  setStartTime,
  elapsedTime,
  timeLeft,
  setTimeLeft,
  isTimerActive,
  setIsTimerActive,
  restDuration,
  setRestDuration
}: WorkoutsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [cardioDurations, setCardioDurations] = useState<Record<string, string>>({});
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState({ calories: 0, xp: 0 });

  // Screen Wake Lock API to prevent sleep during workout
  React.useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isTrainingMode) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    if (isTrainingMode) {
      requestWakeLock();
    } else {
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, [isTrainingMode]);

  const getLastLog = (exerciseId: string) => {
    return [...logs].sort((a, b) => b.timestamp - a.timestamp).find(l => l.exerciseId === exerciseId);
  };

  const startRest = () => {
    setTimeLeft(restDuration);
    setIsTimerActive(true);
  };

  const toggleExerciseSelection = (exercise: Exercise) => {
    const existing = plannedWorkouts.find(p => p.exercise.id === exercise.id);
    if (existing) {
      setPlannedWorkouts(plannedWorkouts.filter(p => p.exercise.id !== exercise.id));
    } else {
      const lastSession = logs.filter(l => l.exerciseId === exercise.id).sort((a, b) => b.timestamp - a.timestamp);
      // We want to group the last session's sets if possible, but logs are stored individually.
      // Let's just find the last N sets from the most recent day.
      const lastDate = lastSession[0] ? new Date(lastSession[0].timestamp).toDateString() : null;
      const lastSets = lastSession.filter(l => new Date(l.timestamp).toDateString() === lastDate);

      const defaultSets = exercise.isTimeBased ? [
        { id: 1, done: false, incline: lastSets[0]?.incline?.toString() || '0', speed: lastSets[0]?.speed?.toString() || '0' }
      ] : (lastSets.length > 0 ? lastSets.map((l, i) => ({
        id: i + 1,
        done: false,
        weight: l.weight?.toString() || '0',
        reps: l.reps?.toString() || '12'
      })) : [
        { id: 1, done: false, weight: '0', reps: '12' },
        { id: 2, done: false, weight: '0', reps: '12' },
        { id: 3, done: false, weight: '0', reps: '12' },
        { id: 4, done: false, weight: '0', reps: '12' },
      ]);

      setPlannedWorkouts([...plannedWorkouts, {
        exercise,
        sets: defaultSets
      }]);
    }
  };

  const adjustSets = (exerciseId: string, delta: number) => {
    setPlannedWorkouts(prev => prev.map(p => {
      if (p.exercise.id === exerciseId) {
        const newCount = Math.max(1, p.sets.length + delta);
        const newSets = Array.from({ length: newCount }, (_, i) => ({
          id: i + 1,
          done: p.sets[i]?.done || false,
          weight: p.sets[i]?.weight || '0',
          reps: p.sets[i]?.reps || '12',
          incline: p.sets[i]?.incline || '0',
          speed: p.sets[i]?.speed || '0'
        }));
        return { ...p, sets: newSets };
      }
      return p;
    }));
  };

  const updateSetData = (exerciseId: string, setId: number, field: string, value: string) => {
    setPlannedWorkouts(prev => prev.map(p => {
      if (p.exercise.id === exerciseId) {
        const newSets = p.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);
        return { ...p, sets: newSets };
      }
      return p;
    }));
  };

  const toggleSet = (exerciseId: string, setId: number) => {
    if (!startTime) {
      setStartTime(Date.now());
    }

    setPlannedWorkouts(prev => prev.map(p => {
      if (p.exercise.id === exerciseId) {
        const newSets = p.sets.map(s => {
          if (s.id === setId) {
            const newState = !s.done;
            if (newState) startRest();
            return { ...s, done: newState };
          }
          return s;
        });
        return { ...p, sets: newSets };
      }
      return p;
    }));
  };

  const handleFinishAll = () => {
    let totalCalories = 0;
    let totalXp = 0;

    plannedWorkouts.forEach(p => {
      if (p.exercise.isTimeBased) {
        const duration = parseInt(cardioDurations[p.exercise.id] || '0');
        if (duration > 0) {
          const set = p.sets[0];
          const speedKph = Number(set.speed) || 0;
          const inclinePct = Number(set.incline) || 0;
          
          // ACSM Formula for Treadmill: VO2 = 3.5 + 0.1 * speed(m/min) + 1.8 * speed(m/min) * incline(fraction)
          const speedMmin = speedKph * 16.666;
          const vo2 = 3.5 + (0.1 * speedMmin) + (1.8 * speedMmin * (inclinePct / 100));
          
          // 1 MET = 3.5 ml/kg/min
          const mets = vo2 / 3.5;
          
          // Calories = METs * weight(kg) * time(hours)
          const calories = mets * (Number(weight) || 70) * (duration / 60);
          
          const xp = calculateXP(calories, 0);

          totalCalories += calories;
          totalXp += xp;

          onAddLog({
            exerciseId: p.exercise.id,
            sets: 1,
            duration,
            incline: inclinePct,
            speed: speedKph,
            caloriesBurned: calories,
            status: 'completed'
          });
        }
      } else {
        const completedSets = p.sets.filter(s => s.done);
        if (completedSets.length > 0) {
          completedSets.forEach(s => {
            const calories = p.exercise.caloriesPerMinute * 1.5;
            const reps = Number(s.reps) || 0;
            const weightVal = Number(s.weight) || 0;
            const volume = weightVal * reps; // for 1 set
            const xp = calculateXP(calories, volume);

            totalCalories += calories;
            totalXp += xp;

            onAddLog({
              exerciseId: p.exercise.id,
              sets: 1,
              reps,
              weight,
              caloriesBurned: calories,
              status: 'completed'
            });
          });
        }
      }
    });

    setSessionSummary({ calories: Math.round(totalCalories), xp: Math.round(totalXp) });
    setShowSummary(true);
    
    setPlannedWorkouts([]);
    setStartTime(null);
    setIsTimerActive(false);
    setCardioDurations({});
    setIsTrainingMode(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const categories = ['全部', '胸部', '背部', '肩部', '腿部', '手臂', '有氧', '腹肌'];

  const categoryStyles: Record<string, string> = {
    '胸部': 'bg-red-50/80 text-red-700 border-red-200 shadow-red-100/20',
    '背部': 'bg-blue-50/80 text-blue-700 border-blue-200 shadow-blue-100/20',
    '肩部': 'bg-purple-50/80 text-purple-700 border-purple-200 shadow-purple-100/20',
    '腿部': 'bg-emerald-50/80 text-emerald-700 border-emerald-200 shadow-emerald-100/20',
    '手臂': 'bg-orange-50/80 text-orange-700 border-orange-200 shadow-orange-100/20',
    '有氧': 'bg-sky-50/80 text-sky-700 border-sky-200 shadow-sky-100/20',
    '腹肌': 'bg-amber-50/80 text-amber-700 border-amber-200 shadow-amber-100/20',
    '全部': 'bg-zinc-100 text-zinc-500 border-zinc-200 shadow-zinc-100/20'
  };

  const filteredExercises = EXERCISES.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === '全部' || e.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-xl mx-auto space-y-6 text-zinc-900">
      <AnimatePresence mode="wait">
        {!isTrainingMode ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900 font-serif">
                  {view === 'list' ? '选取今日炼体法门' : '历练心经 · 往昔'}
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full bg-zinc-100 border border-zinc-200 text-[#D4AF37] hover:bg-zinc-200"
                  onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
                >
                  {view === 'list' ? (
                    <><Calendar className="h-4 w-4 mr-2" /> 往昔历练</>
                  ) : (
                    <><Dumbbell className="h-4 w-4 mr-2" /> 开启炼体</>
                  )}
                </Button>
              </div>

              {view === 'list' ? (
                <>
                  <div className="relative px-2">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                      placeholder="搜罗炼体之法..." 
                      className="pl-12 rounded-2xl bg-white border border-zinc-200 shadow-sm h-14 text-zinc-900 placeholder:text-zinc-400 focus:ring-[#D4AF37]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2.5 overflow-x-auto pb-2 no-scrollbar px-2">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={activeCategory === cat ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(cat)}
                        className={`rounded-2xl px-6 py-5 border transition-all duration-300 ${
                          activeCategory === cat 
                            ? 'bg-[#8C0000] text-white shadow-[0_4px_15px_rgba(140,0,0,0.1)] border-transparent' 
                            : 'bg-white text-zinc-400 hover:text-zinc-600 border-zinc-200 shadow-sm'
                        }`}
                      >
                        <span className="font-serif font-bold tracking-widest">{cat}</span>
                      </Button>
                    ))}
                  </div>

                  <ScrollArea className="h-[55vh] px-2">
                    <div className="grid gap-3 pr-2">
                      {filteredExercises.map((exercise) => {
                        const isSelected = plannedWorkouts.some(p => p.exercise.id === exercise.id);
                        const estimatedXp = exercise.isTimeBased 
                          ? Math.round(exercise.caloriesPerMinute * 5)
                          : Math.round(exercise.caloriesPerMinute * 1.5 * 5 + (40 * 12 / 20));

                        const style = categoryStyles[exercise.category] || categoryStyles['全部'];

                        return (
                          <Card 
                            key={exercise.id}
                            className={`border transition-all duration-500 rounded-[2rem] cursor-pointer relative overflow-hidden group shadow-sm ${
                              isSelected 
                                ? 'bg-zinc-50 border-[#D4AF37]/40 ring-2 ring-[#D4AF37]/10 shadow-lg' 
                                : 'bg-white border-zinc-100 hover:border-zinc-200'
                            }`}
                            onClick={() => toggleExerciseSelection(exercise)}
                          >
                            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -z-10 ${style.split(' ')[0]}`} />
                            <CardContent className="p-5 flex items-center justify-between relative z-10">
                              <div className="flex-1 space-y-1.5">
                                <h3 className={`font-black tracking-tight text-lg font-serif ${isSelected ? 'text-[#D4AF37]' : 'text-zinc-900'}`}>
                                  {exercise.name}
                                </h3>
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full border ${style}`}>
                                      {exercise.category}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                      <Target className="h-3 w-3" />
                                      {exercise.targetMuscle || '全身核心'}
                                    </span>
                                    <Badge variant="outline" className={`text-[9px] h-5 font-black border-none px-2 rounded-lg tracking-widest ${
                                      isSelected ? 'bg-[#D4AF37] text-white' : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                                    }`}>
                                      +{estimatedXp} XP / {exercise.isTimeBased ? '周期' : '周天'}
                                    </Badge>
                                  </div>
                                  {getLastLog(exercise.id) && (
                                    <div className="flex items-center gap-2">
                                      <p className={`text-[10px] font-black italic tracking-widest ${isSelected ? 'text-zinc-500' : 'text-[#8C0000]'}`}>
                                        <History className="h-3 w-3 inline mr-1" />
                                        残章: {getLastLog(exercise.id)?.weight || 0}kG x {getLastLog(exercise.id)?.reps || 0}次
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`p-3 rounded-2xl transition-all duration-500 ${
                                isSelected ? 'bg-[#D4AF37] text-white rotate-12 shadow-[0_4px_15px_rgba(212,175,55,0.2)]' : 'bg-zinc-50 text-zinc-200'
                              }`}>
                                {isSelected ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <WorkoutCalendar logs={logs} />
              )}
            </div>

            <Dialog open={showSummary} onOpenChange={setShowSummary}>
              <DialogContent className="rounded-[3rem] border border-zinc-100 bg-white text-zinc-900 max-w-[95vw] sm:max-w-md overflow-hidden p-0 shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#8C0000]/10 to-transparent -z-10" />
                <div className="flex flex-col items-center gap-6 py-10 px-6">
                  <div className="h-24 w-24 rounded-full bg-white border-2 border-[#D4AF37] flex items-center justify-center relative shadow-xl glow-gold">
                    <Sparkles className="h-12 w-12 text-[#D4AF37] animate-pulse" />
                    <div className="absolute -bottom-2 -right-2 bg-[#8C0000] p-2 rounded-lg border border-red-800/20 shadow-lg">
                      <Sword className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <DialogTitle className="text-4xl font-black italic tracking-tighter text-zinc-900 font-serif">炼体小成 · 境！</DialogTitle>
                    <DialogDescription className="text-zinc-400 font-medium italic tracking-widest text-sm">
                      洗髓伐毛，历练达成，仙道根基稳固如山。
                    </DialogDescription>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 px-6 pb-8">
                  <div className="bg-zinc-50 p-6 rounded-[2.5rem] text-center border border-zinc-100 ring-1 ring-black/5 shadow-sm">
                    <Flame className="h-6 w-6 text-[#8C0000] mx-auto mb-2 opacity-80" />
                    <p className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em] mb-2">炼精化气</p>
                    <p className="text-4xl font-black italic tracking-tighter text-zinc-900 font-serif">
                      {sessionSummary.calories}
                      <span className="text-xs ml-1 text-[#8C0000] font-sans">气</span>
                    </p>
                  </div>
                  <div className="bg-zinc-50 p-6 rounded-[2.5rem] text-center border border-zinc-100 ring-1 ring-black/5 shadow-sm">
                    <TrendingUp className="h-6 w-6 text-[#D4AF37] mx-auto mb-2 opacity-80" />
                    <p className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em] mb-2">修为增益</p>
                    <p className="text-4xl font-black italic tracking-tighter text-[#D4AF37] font-serif">
                      +{sessionSummary.xp}
                      <span className="text-xs ml-1 text-zinc-400 font-sans">XP</span>
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-10">
                  <Button 
                    className="w-full h-16 rounded-[2rem] bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white font-black text-xl transition-all shadow-[0_4px_20px_rgba(212,175,55,0.2)] font-serif"
                    onClick={() => setShowSummary(false)}
                  >
                    纳气归元 · 收工
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {plannedWorkouts.length > 0 && (
              <div className="fixed bottom-28 left-4 right-4 max-w-xl mx-auto z-40">
                <Button 
                  className="w-full h-16 rounded-[2.5rem] bg-white border border-[#D4AF37]/30 text-zinc-800 font-black text-lg shadow-2xl flex items-center justify-between px-8 ring-1 ring-[#D4AF37]/10"
                  onClick={() => setIsTrainingMode(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-[#8C0000] p-1.5 rounded-lg shadow-md">
                      <Sword className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-serif italic tracking-widest text-[#D4AF37]">开启今日大练兵</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-zinc-400">登载 {plannedWorkouts.length} 门功法</span>
                    <ChevronRight className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-[78vh] sm:h-[800px] max-h-[85vh] space-y-4 px-1"
          >
            <div className="flex items-center justify-between shrink-0 px-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsTrainingMode(false)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-600 h-8 px-2"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                <span className="font-serif text-sm">重整旗鼓</span>
              </Button>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] border-zinc-200 text-zinc-400 font-mono bg-white px-1.5 py-0">
                  {formatTime(elapsedTime)}
                </Badge>
                <Badge className="bg-[#8C0000] text-white border-none font-serif tracking-widest px-2 py-0.5 shadow-sm text-[10px]">
                  炼体中...
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 pr-2 overflow-y-auto min-h-0">
              <div className="space-y-4 pb-32">
                {/* Global Timer Card */}
                <Card className={`border shadow-xl rounded-[2rem] transition-all duration-700 bg-white relative overflow-hidden shrink-0 ${isTimerActive ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/10' : 'border-zinc-100'}`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-3xl -z-10" />
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase font-black text-zinc-400 tracking-[0.2em] mb-1">歇息计时</p>
                      <div className={`text-5xl sm:text-7xl font-black font-mono tracking-tighter transition-colors ${isTimerActive ? 'text-[#D4AF37]' : 'text-zinc-900'}`}>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end max-w-[140px]">
                      {[30, 45, 60, 90].map(t => (
                        <button 
                          key={t}
                          onClick={() => { setRestDuration(t); setTimeLeft(t); setIsTimerActive(false); }}
                          className={`text-[9px] px-3 py-1.5 rounded-xl font-black transition-all border ${
                            restDuration === t 
                              ? 'bg-[#D4AF37] text-white border-none shadow-md' 
                              : 'border-zinc-100 text-zinc-400 hover:border-zinc-300 bg-zinc-50'
                          }`}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* All Planned Exercises */}
                <div className="space-y-4">
                  {plannedWorkouts.map((plan) => (
                    <Card key={plan.exercise.id} className="border border-zinc-100 shadow-md rounded-[2rem] bg-white overflow-hidden ring-1 ring-black/5">
                      <CardHeader className="p-4 bg-zinc-50 flex flex-row items-center justify-between space-y-0 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-8 bg-[#8C0000] rounded-full shadow-sm" />
                          <div>
                            <CardTitle className="text-lg font-black tracking-tight font-serif italic text-zinc-900">{plan.exercise.name}</CardTitle>
                            <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">{plan.exercise.category} · {plan.exercise.targetMuscle || '全身核心'}</p>
                          </div>
                        </div>
                        {!plan.exercise.isTimeBased && (
                          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-zinc-600" onClick={() => adjustSets(plan.exercise.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-[9px] font-black text-[#D4AF37] w-8 text-center font-serif">{plan.sets.length}周</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-zinc-600" onClick={() => adjustSets(plan.exercise.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5">
                        {plan.exercise.isTimeBased ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">岁时 (分)</Label>
                              <Input 
                                type="number" 
                                step="0.5"
                                value={cardioDurations[plan.exercise.id] || ''}
                                onChange={(e) => {
                                  if (!startTime) setStartTime(Date.now());
                                  setCardioDurations({...cardioDurations, [plan.exercise.id]: e.target.value});
                                }}
                                className="h-11 rounded-xl bg-zinc-50 border border-zinc-100 font-black text-lg text-center text-[#D4AF37] focus:ring-[#D4AF37]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">步频 (kM/h)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                value={plan.sets[0]?.speed || '0'}
                                onChange={(e) => updateSetData(plan.exercise.id, plan.sets[0].id, 'speed', e.target.value)}
                                className="h-11 rounded-xl bg-zinc-50 border border-zinc-100 font-black text-lg text-center text-zinc-900 focus:ring-[#D4AF37]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">地势 (%)</Label>
                              <Input 
                                type="number" 
                                step="0.5"
                                value={plan.sets[0]?.incline || '0'}
                                onChange={(e) => updateSetData(plan.exercise.id, plan.sets[0].id, 'incline', e.target.value)}
                                className="h-11 rounded-xl bg-zinc-50 border border-zinc-100 font-black text-lg text-center text-zinc-900 focus:ring-[#D4AF37]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {plan.sets.map((set) => (
                              <div key={set.id} className="flex items-center gap-3">
                                <button 
                                  onClick={() => toggleSet(plan.exercise.id, set.id)}
                                  className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                                    set.done 
                                      ? 'bg-[#8C0000] text-white shadow-red-900/10 border-none' 
                                      : 'bg-zinc-50 text-zinc-300 border border-zinc-100 hover:border-zinc-200'
                                  }`}
                                >
                                  {set.done ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-[13px] font-black font-serif">{set.id}</span>}
                                </button>
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <div className="relative">
                                    <Input 
                                      type="number" 
                                      value={set.weight}
                                      onChange={(e) => updateSetData(plan.exercise.id, set.id, 'weight', e.target.value)}
                                      className="h-10 rounded-xl bg-zinc-50 border border-zinc-100 pl-3 pr-8 text-base font-black text-zinc-900 focus:ring-[#D4AF37]"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 font-serif uppercase tracking-widest">kG</span>
                                  </div>
                                  <div className="relative">
                                    <Input 
                                      type="number" 
                                      value={set.reps}
                                      onChange={(e) => updateSetData(plan.exercise.id, set.id, 'reps', e.target.value)}
                                      className="h-10 rounded-xl bg-zinc-50 border border-zinc-100 pl-3 pr-8 text-base font-black text-zinc-900 focus:ring-[#D4AF37]"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 font-serif uppercase tracking-widest">次</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="fixed bottom-28 left-4 right-4 max-w-xl mx-auto z-40 bg-gradient-to-t from-white via-white/80 to-transparent pt-4 pb-2">
              <Button 
                className="w-full h-16 rounded-[2rem] crimson-gradient hover:opacity-90 text-white font-black text-xl shadow-xl transition-all active:scale-95 font-serif italic tracking-[0.2em]"
                onClick={handleFinishAll}
              >
                炼体圆满 · 归宗！
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


