import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Activity, Flame, Droplets, Scale, TrendingUp, ChevronRight, ChevronLeft, Dumbbell, Target, Sparkles, Info, Settings as SettingsIcon, Save, Sword } from 'lucide-react';
import { Meal, WorkoutLog, WeightRecord, BodyStats, UserSettings, SupplementCheck } from '../types';
import { getLocalDateString } from '../lib/dateUtils';
import { EXERCISES } from '../constants';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Pill } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { calculateXP, getCurrentLevel, CULTIVATION_LEVELS } from '../lib/cultivation';
import { getDailyPoetry } from '../constants/poetry';
import { History } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface DashboardProps {
  meals: Meal[];
  workoutLogs: WorkoutLog[];
  waterIntake: number;
  setWaterIntake: (val: number) => void;
  weightRecords: WeightRecord[];
  bodyStats: BodyStats[];
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  supplements: { [date: string]: SupplementCheck };
  onUpdateSupplements: (date: string, data: SupplementCheck) => void;
  onAddWeight: (weight: number) => void;
  onDeleteMeal: (id: string) => void;
  onDeleteLog: (id: string) => void;
  onOpenCoach: () => void;
  onOpenCultivation: () => void;
}

export default function Dashboard({ 
  meals, 
  workoutLogs, 
  waterIntake, 
  setWaterIntake, 
  weightRecords, 
  bodyStats,
  settings,
  onUpdateSettings,
  supplements,
  onUpdateSupplements,
  onAddWeight,
  onDeleteMeal,
  onDeleteLog,
  onOpenCoach,
  onOpenCultivation
}: DashboardProps) {
  const [newWeight, setNewWeight] = useState('');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  const calculatedCalories = localSettings.proteinGoal * 4 + localSettings.carbsGoal * 4 + localSettings.fatGoal * 9;

  const handleSaveGoals = () => {
    onUpdateSettings({
      ...localSettings,
      calorieGoal: calculatedCalories
    });
    setIsEditingGoals(false);
  };

  const todayStr = getLocalDateString();
  const todaySupps = supplements[todayStr] || { fishOil: false, vitamins: false, creatine: false };

  const toggleSupp = (key: keyof SupplementCheck) => {
    onUpdateSupplements(todayStr, {
      ...todaySupps,
      [key]: !todaySupps[key]
    });
  };

  const calculateTotalVolume = (logs: WorkoutLog[]) => {
    return logs.reduce((acc, log) => {
      if (log.weight && log.reps) {
        return acc + (log.weight * log.reps * log.sets);
      }
      return acc;
    }, 0);
  };

  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return getLocalDateString(d);
    });

    return last7Days.map(date => {
      const dayWeight = weightRecords.find(w => getLocalDateString(w.timestamp) === date)?.weight;
      const dayBodyFat = bodyStats.find(s => getLocalDateString(s.timestamp) === date)?.bodyFat;
      const dayLogs = workoutLogs.filter(l => getLocalDateString(l.timestamp) === date);
      const dayVolume = calculateTotalVolume(dayLogs);

      return {
        date: date.split('-').slice(1).join('/'),
        weight: dayWeight || null,
        bodyFat: dayBodyFat || null,
        volume: dayVolume || 0
      };
    });
  };

  const chartData = getChartData();
  const weeklyVolume = calculateTotalVolume(workoutLogs.filter(l => l.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000));
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = now.getTime();
  const todayMeals = meals.filter(m => m.timestamp >= today);
  const todayLogs = workoutLogs.filter(l => l.timestamp >= today);
  const caloriesConsumed = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const caloriesBurned = todayLogs.reduce((acc, l) => acc + l.caloriesBurned, 0);

  const waterPercentage = Math.min(100, (waterIntake / settings.waterGoal) * 100);

  const totalXp = workoutLogs.reduce((acc, log) => {
    const volume = (log.weight && log.reps) ? (log.weight * log.reps * log.sets) : 0;
    return acc + calculateXP(log.caloriesBurned, volume);
  }, 0);
  const { level, progress } = getCurrentLevel(totalXp);
  const poetry = getDailyPoetry();

  return (
    <div className="space-y-6 pb-20">
      {/* 0. Daily Poetry - Inspirational and compact */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className="bg-[#f5f5f0] px-6 py-3 rounded-2xl flex flex-col items-center gap-1 border border-[#D4AF37]/20 ring-1 ring-[#D4AF37]/5 shadow-sm">
          <p className="text-sm font-serif font-medium text-zinc-600 italic tracking-widest text-center leading-relaxed">
            "{poetry.content}"
          </p>
          <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.2em] mt-1">
            —— {poetry.author} · {poetry.source}
          </p>
        </div>
      </motion.div>

      {/* 1. Macro Progress - THE MOST IMPORTANT AT THE TOP */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="grid gap-3"
      >
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-[#fdfbf7] to-[#f5f5f0] text-zinc-950 overflow-hidden ring-1 ring-[#D4AF37]/10">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C0000]/5 blur-[80px] -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 blur-[80px] -z-10" />
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-[#8C0000] p-2.5 rounded-xl shadow-[0_4px_15px_rgba(140,0,0,0.1)] border border-red-800/10">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter font-serif text-zinc-900">五谷气血精元</h3>
                  <p className="text-[10px] text-zinc-400 uppercase font-black tracking-[0.3em]">Nourishment Overview</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onOpenCoach}
                  className="rounded-full bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white border border-[#D4AF37]/20 text-[10px] font-black h-9 px-5 transition-all glow-gold shadow-sm"
                >
                  <Sparkles className="h-3 w-3 mr-2" />
                  仙导指点
                </Button>
                <div className="flex items-center gap-4 ml-2">
                  <div className="text-right">
                    <p className="text-3xl font-black tracking-tighter text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                      {caloriesConsumed} <span className="text-xs uppercase opacity-40 font-serif">气</span>
                    </p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">目标: {settings.calorieGoal}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                    onClick={() => setIsEditingGoals(!isEditingGoals)}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isEditingGoals ? (
                <motion.div 
                  key="view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { label: '肉身精气', key: 'protein', goal: settings.proteinGoal, color: 'bg-[#8C0000]', tint: 'bg-[#8C0000]/5', border: 'border-[#8C0000]/10' },
                    { label: '灵机气力', key: 'carbs', goal: settings.carbsGoal, color: 'bg-[#457B9D]', tint: 'bg-[#457B9D]/5', border: 'border-[#457B9D]/10' },
                    { label: '温养本源', key: 'fat', goal: settings.fatGoal, color: 'bg-[#D4AF37]', tint: 'bg-[#D4AF37]/5', border: 'border-[#D4AF37]/10' }
                  ].map((macro) => {
                    const value = todayMeals.reduce((acc, m) => acc + (m[macro.key as keyof Meal] as number), 0);
                    const perc = Math.min(100, (value / macro.goal) * 100);
                    return (
                      <div key={macro.key} className={`${macro.tint} p-4 rounded-[2rem] border ${macro.border} shadow-sm transition-transform hover:scale-[1.02]`}>
                        <p className="text-[10px] font-black text-zinc-500 mb-1 uppercase tracking-widest">{macro.label}</p>
                        <p className="text-xl font-black tracking-tighter flex items-baseline gap-0.5 font-serif text-zinc-900 italic">
                          {Math.round(value)}
                          <span className="text-sm opacity-30 mx-0.5">/</span>
                          <span className="text-sm opacity-50">{macro.goal}</span>
                        </p>
                        <div className="h-1 bg-white rounded-full mt-3 overflow-hidden shadow-inner border border-black/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${perc}%` }}
                            className={`h-full ${macro.color} shadow-[0_2px_5px_rgba(0,0,0,0.1)]`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="edit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '精气(g)', key: 'proteinGoal', color: 'text-[#8C0000]' },
                      { label: '气力(g)', key: 'carbsGoal', color: 'text-[#457B9D]' },
                      { label: '本源(g)', key: 'fatGoal', color: 'text-[#D4AF37]' }
                    ].map((macro) => (
                      <div key={macro.key} className="space-y-2">
                        <Label className={`text-[10px] font-black ${macro.color} uppercase tracking-[0.2em]`}>{macro.label}</Label>
                        <Input 
                          type="number" 
                          value={localSettings[macro.key as keyof UserSettings]}
                          onChange={(e) => setLocalSettings({ ...localSettings, [macro.key]: parseInt(e.target.value) || 0 })}
                          className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl text-center font-black text-lg focus:ring-[#D4AF37] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] font-black text-[#457B9D] uppercase tracking-[0.2em]">甘露温润 (L)</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={localSettings.waterGoal}
                        onChange={(e) => setLocalSettings({ ...localSettings, waterGoal: parseFloat(e.target.value) || 0 })}
                        className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl font-black text-lg text-center"
                      />
                    </div>
                    <div className="flex-1 pt-6 flex gap-2">
                      <Button 
                        onClick={handleSaveGoals}
                        className="flex-1 h-12 crimson-gradient hover:opacity-90 rounded-2xl font-black text-sm shadow-[0_4px_20px_rgba(140,0,0,0.4)]"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        铭刻目标
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('确定要清除所有修行记录吗？此操作不可逆，将恢复出厂设置。')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 flex items-center justify-center p-0"
                        title="出厂设置 / 清空数据"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-600 font-bold italic text-right tracking-widest">
                    注：太虚热量将校准为 {calculatedCalories} 气
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Primary & Secondary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Cultivation Status */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full"
        >
          <Card className={`border-none shadow-xl rounded-3xl ${level.bg.startsWith('bg-') ? level.bg : `bg-gradient-to-br ${level.bg}`} text-white p-4 h-full flex flex-col relative overflow-hidden transition-all duration-700`}>
            <div className="absolute top-[-20%] right-[-10%] opacity-5 rotate-12">
              <Sword className="h-20 w-20" />
            </div>
            
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="bg-[#FFB703] p-1.5 rounded-lg shadow-lg cursor-pointer" onClick={onOpenCultivation}>
                <Sparkles className="h-4 w-4 text-zinc-900" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-baseline gap-1 relative z-10">
                <p className="text-[10px] font-bold opacity-60">当前境界</p>
                <div className="h-1 w-1 rounded-full bg-[#FFB703] animate-pulse" />
              </div>
              <h3 className="text-xl font-black tracking-tighter truncate relative z-10 drop-shadow-md">{level.name}</h3>
              
              <div className="mt-4 space-y-1 relative z-10">
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest">
                  <span className="text-[#FFB703]">修为值</span>
                  <span>{Math.round(totalXp)} XP</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#FFB703] rounded-full shadow-[0_0_10px_rgba(255,183,3,0.6)]"
                  />
                </div>
                <p className="text-[8px] text-right font-medium opacity-60 italic">
                  距离下一阶还需 {level.maxXp !== Infinity ? Math.max(0, level.maxXp - Math.round(totalXp)) : 0} XP
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* AI Body Fat */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="h-full"
        >
          <Card className="border-none shadow-xl rounded-3xl bg-gradient-to-br from-[#fdfbf7] to-[#fafafa] border border-zinc-100 p-4 h-full flex flex-col relative group overflow-hidden ring-1 ring-black/5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/5 blur-2xl -z-10" />
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="bg-[#D4AF37]/10 p-1.5 rounded-lg border border-[#D4AF37]/20">
                <Activity className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <Badge variant="outline" className="h-5 text-[7px] font-black border-[#D4AF37]/20 text-[#D4AF37] tracking-[0.2em] bg-[#D4AF37]/5">太虚视界</Badge>
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-0.5">肉身脂比</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter font-serif">{bodyStats[0]?.bodyFat || '--'} <span className="text-[10px] text-[#D4AF37] font-serif">%</span></h3>
            </div>
            <p className="text-[7px] text-zinc-400 font-bold mt-auto truncate italic tracking-widest">上次: {bodyStats[0] ? new Date(bodyStats[0].timestamp).toLocaleDateString() : '尚未开光'}</p>
          </Card>
        </motion.div>

        {/* Training Burned */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-xl rounded-3xl bg-gradient-to-br from-[#fef2f2] to-[#fff1f2] border border-red-100 text-zinc-900 p-4 h-full relative overflow-hidden group ring-1 ring-red-800/5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#8C0000]/5 blur-2xl -z-10" />
            <div className="flex justify-between items-start mb-2">
              <div className="bg-[#8C0000]/10 p-1.5 rounded-lg border border-red-200">
                <Flame className="h-4 w-4 text-[#E63946]" />
              </div>
            </div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-0.5">历练消耗</p>
            <h3 className="text-2xl font-black tracking-tighter text-zinc-900 font-serif">{Math.round(caloriesBurned)} <span className="text-[10px] text-[#8C0000] font-serif">气</span></h3>
          </Card>
        </motion.div>

        {/* Water Intake */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.25 }}
        >
          <Card className="border-none shadow-xl rounded-3xl bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] border border-blue-100 text-zinc-900 p-4 h-full relative overflow-hidden ring-1 ring-[#457B9D]/5">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="bg-[#457B9D]/10 p-1.5 rounded-lg border border-blue-200">
                <Droplets className="h-4 w-4 text-[#457B9D]" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setWaterIntake(Math.max(0, waterIntake - 0.25))} className="h-6 w-6 bg-white hover:bg-zinc-100 rounded-full text-xs flex items-center justify-center border border-blue-200 shadow-sm transition-colors text-[#457B9D]">-</button>
                <button onClick={() => setWaterIntake(waterIntake + 0.25)} className="h-6 w-6 bg-white hover:bg-zinc-100 rounded-full text-xs flex items-center justify-center border border-blue-200 shadow-sm transition-colors text-[#457B9D]">+</button>
              </div>
            </div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5 relative z-10">甘露进度</p>
            <h3 className="text-2xl font-black tracking-tighter font-serif relative z-10 text-zinc-900">{waterIntake.toFixed(2)} <span className="text-[10px] text-[#457B9D] font-serif">L</span></h3>
            <div className="absolute inset-x-0 bottom-0 bg-[#457B9D]/20 transition-all duration-1000" style={{ height: `${waterPercentage}%` }} />
          </Card>
        </motion.div>
      </div>


      {/* 3. Supplements Check-in */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-sm rounded-3xl bg-white p-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Pill className="h-4 w-4 text-[#E63946]" />
            <h3 className="font-bold text-sm">补剂打卡</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'fishOil', label: '鱼油' },
              { id: 'vitamins', label: '维生素' },
              { id: 'creatine', label: '肌酸' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSupp(s.id as keyof SupplementCheck)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  todaySupps[s.id as keyof SupplementCheck] 
                    ? 'bg-green-50 text-green-600 border-green-100 ring-1 ring-green-100' 
                    : 'bg-zinc-50 text-zinc-400'
                }`}
              >
                {todaySupps[s.id as keyof SupplementCheck] ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 opacity-20" />}
                <span className="text-[10px] font-bold">{s.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* 4. Large Charts & Records */}
      <div className="grid gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-white backdrop-blur-xl border border-zinc-100 overflow-hidden ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black font-serif text-zinc-900 italic">肉身进阶全景</CardTitle>
              <CardDescription className="text-zinc-400">权重、脂比与历练容量之推演</CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">肉身权重</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8C0000]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">历练容量</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8C0000" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8C0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    borderRadius: '24px', 
                    border: '1px solid rgba(0,0,0,0.05)', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    color: '#000'
                  }} 
                  itemStyle={{ color: '#000' }}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#8C0000" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#D4AF37', strokeWidth: 2, stroke: '#18181b' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white backdrop-blur-xl border border-zinc-100 text-zinc-900 overflow-hidden ring-1 ring-black/5">
            <CardHeader>
              <CardTitle className="text-xl font-black font-serif italic text-zinc-900">定鼎肉身权重</CardTitle>
              <CardDescription className="text-zinc-400">每一分感知，皆是进阶之基</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#D4AF37]" />
                <Input 
                  type="number" 
                  placeholder="0.0" 
                  className="pl-12 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl text-2xl font-black text-zinc-900 placeholder:text-zinc-200 transition-all focus:ring-1 focus:ring-[#D4AF37]"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-300 font-serif">kG</span>
              </div>
              <Button 
                className="w-full h-16 crimson-gradient hover:opacity-90 text-white rounded-2xl font-black text-xl transition-all active:scale-95 shadow-[0_10px_30px_rgba(140,0,0,0.4)]"
                onClick={() => {
                  if (newWeight) {
                    onAddWeight(parseFloat(newWeight));
                    setNewWeight('');
                  }
                }}
              >
                铭刻权重
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. PWA Install Tip - Help user "install" the app */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <Card className="border-none shadow-sm rounded-[2rem] bg-zinc-900 text-white p-6 overflow-hidden relative ring-1 ring-[#D4AF37]/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="bg-[#D4AF37] p-2.5 rounded-xl shadow-lg">
              <Sword className="h-5 w-5 text-zinc-900" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-serif italic font-black text-lg text-[#D4AF37] tracking-widest">将“ALL FIT”收为法宝</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                点击浏览器菜单中的<span className="text-white font-bold mx-1">“添加到主屏幕”</span>，即可将此页化为桌面图标。无需繁琐查找，一触即入太虚，随时开启今日修行。
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
