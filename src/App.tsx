import { useState, useEffect } from 'react';
import { Activity, Utensils, Dumbbell, Sparkles, Camera, Settings as SettingsIcon, Sword } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Workouts from './components/Workouts';
import Diet from './components/Diet';
import AICoach from './components/AICoach';
import Progress from './components/Progress';
import SplashScreen from './components/SplashScreen';
import AuthModal from './components/AuthModal';
import { getLocalDateString } from './lib/dateUtils';
import { 
  fetchUserSettings, 
  syncUserSettings, 
  fetchCollection, 
  saveItem, 
  deleteItem, 
  saveDailyStatus, 
  fetchDailyStatus,
  pushFullStateToCloud
} from './lib/db';
import { Meal, WorkoutLog, WeightRecord, Exercise, ProgressPhoto, BodyStats, UserSettings } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { calculateXP, getCurrentLevel, CULTIVATION_LEVELS } from './lib/cultivation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCultivationDetails, setShowCultivationDetails] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [meals, setMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem('meals');
    return saved ? JSON.parse(saved) : [];
  });
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem('workoutLogs');
    return saved ? JSON.parse(saved) : [];
  });
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>(() => {
    const saved = localStorage.getItem('weightRecords');
    return saved ? JSON.parse(saved) : [{ id: '1', weight: 75, timestamp: Date.now() }];
  });
  const [waterIntake, setWaterIntake] = useState(() => {
    const saved = localStorage.getItem('waterIntake');
    const lastUpdate = localStorage.getItem('lastWaterUpdate');
    const today = getLocalDateString();
    
    if (lastUpdate !== today) {
      return 0;
    }
    return saved ? parseFloat(saved) : 0;
  });
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>(() => {
    const saved = localStorage.getItem('progressPhotos');
    return saved ? JSON.parse(saved) : [];
  });
  const [bodyStats, setBodyStats] = useState<BodyStats[]>(() => {
    const saved = localStorage.getItem('bodyStats');
    return saved ? JSON.parse(saved) : [];
  });
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [supplements, setSupplements] = useState<{ [date: string]: { fishOil: boolean; vitamins: boolean; creatine: boolean } }>(() => {
    const saved = localStorage.getItem('supplements');
    return saved ? JSON.parse(saved) : {};
  });
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) return JSON.parse(saved);
    
    // Default macros: 150g protein, 250g carbs, 60g fat
    // (150 * 4) + (250 * 4) + (60 * 9) = 600 + 1000 + 540 = 2140
    return {
      calorieGoal: 2140,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 60,
      waterGoal: 2.5 // 2.5 Liters
    };
  });

  // Workout state
  const [plannedWorkouts, setPlannedWorkouts] = useState<{ 
    exercise: Exercise; 
    sets: { id: number; done: boolean; weight?: string; reps?: string; incline?: string; speed?: string }[] 
  }[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [restDuration, setRestDuration] = useState(60);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Cloud Sync Effect - Load from cloud on login
  useEffect(() => {
    if (!user) return;

    const syncFromCloud = async () => {
      try {
        console.log("正在同步云端数据...");
        
        const fetchData = async () => {
          const cloudSettings = await fetchUserSettings(user.uid).catch(e => { console.error("设置读取失败:", e); return null; });
          const cloudMeals = await fetchCollection<Meal>(user.uid, 'meals').catch(e => { console.error("药膳读取失败:", e); return []; });
          const cloudWorkouts = await fetchCollection<WorkoutLog>(user.uid, 'workouts').catch(e => { console.error("炼体读取失败:", e); return []; });
          const cloudWeights = await fetchCollection<WeightRecord>(user.uid, 'weights').catch(e => { console.error("体重读取失败:", e); return []; });
          const cloudStats = await fetchCollection<BodyStats>(user.uid, 'bodyStats').catch(e => { console.error("体态读取失败:", e); return []; });
          const cloudPhotos = await fetchCollection<ProgressPhoto>(user.uid, 'progressPhotos').catch(e => { console.error("相册读取失败:", e); return []; });
          const cloudWater = await fetchDailyStatus(user.uid, 'water').catch(e => { console.error("甘露读取失败:", e); return {}; });
          const cloudSupps = await fetchDailyStatus(user.uid, 'supplements').catch(e => { console.error("补剂读取失败:", e); return {}; });

          if (cloudSettings) setUserSettings(cloudSettings);
          if (cloudMeals.length > 0) setMeals(cloudMeals);
          if (cloudWorkouts.length > 0) setWorkoutLogs(cloudWorkouts);
          if (cloudWeights.length > 0) setWeightRecords(cloudWeights);
          if (cloudStats.length > 0) setBodyStats(cloudStats);
          if (cloudPhotos.length > 0) setProgressPhotos(cloudPhotos);
          
          const today = getLocalDateString();
          if (cloudWater[today]) {
            setWaterIntake(cloudWater[today].amount);
          }
          
          if (Object.keys(cloudSupps).length > 0) setSupplements(cloudSupps as any);

          // AUTO-MIGRATION LOGIC:
          // If cloud data is virtually empty but local data exists, push local to cloud.
          if (cloudMeals.length === 0 && meals.length > 0) {
            console.log("检测到本地存有修行数据且云端为空，正在自动渡劫（同步至云端）...");
            await pushFullStateToCloud(user.uid, {
              settings: userSettings,
              meals: meals,
              workouts: workoutLogs,
              weights: weightRecords,
              stats: bodyStats
            });
            console.log("本地数据已成功飞升云端。");
          }
        };

        await fetchData();
        console.log("云端数据同步完成。");
      } catch (err) {
        console.error("同步过程中发生未知错误:", err);
      }
    };

    syncFromCloud();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('meals', JSON.stringify(meals));
      localStorage.setItem('workoutLogs', JSON.stringify(workoutLogs));
      localStorage.setItem('weightRecords', JSON.stringify(weightRecords));
      localStorage.setItem('waterIntake', waterIntake.toString());
      localStorage.setItem('lastWaterUpdate', getLocalDateString());
      localStorage.setItem('progressPhotos', JSON.stringify(progressPhotos));
      localStorage.setItem('bodyStats', JSON.stringify(bodyStats));
      localStorage.setItem('userSettings', JSON.stringify(userSettings));
      localStorage.setItem('supplements', JSON.stringify(supplements));
      localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn("Storage quota exceeded! Older data might not be saved.");
      }
    }
  }, [meals, workoutLogs, weightRecords, waterIntake, progressPhotos, bodyStats, userSettings, supplements, chatMessages]);

  useEffect(() => {
    let interval: any;
    if (startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const addMeal = (meal: Omit<Meal, 'id' | 'timestamp'>) => {
    const newMeal = {
      ...meal,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setMeals([...meals, newMeal]);
    if (user) saveItem(user.uid, 'meals', newMeal);
  };

  const deleteMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
    if (user) deleteItem(user.uid, 'meals', id);
  };

  const addWorkoutLog = (log: Omit<WorkoutLog, 'id' | 'timestamp'>) => {
    const newLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setWorkoutLogs([...workoutLogs, newLog]);
    if (user) saveItem(user.uid, 'workouts', newLog);
  };

  const deleteWorkoutLog = (id: string) => {
    setWorkoutLogs(workoutLogs.filter(l => l.id !== id));
    if (user) deleteItem(user.uid, 'workouts', id);
  };

  const addWeight = (weight: number) => {
    const newRecord = {
      id: Math.random().toString(36).substr(2, 9),
      weight,
      timestamp: Date.now()
    };
    setWeightRecords([newRecord, ...weightRecords]);
    if (user) saveItem(user.uid, 'weights', newRecord);
  };

  const addProgressPhoto = (photo: Omit<ProgressPhoto, 'id' | 'timestamp'>) => {
    const newPhoto = {
      ...photo,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setProgressPhotos([...progressPhotos, newPhoto]);
    if (user) saveItem(user.uid, 'progressPhotos', newPhoto);
  };

  const deleteProgressPhoto = (id: string) => {
    setProgressPhotos(progressPhotos.filter(p => p.id !== id));
    if (user) deleteItem(user.uid, 'progressPhotos', id);
  };

  const latestWeight = weightRecords.length > 0 ? weightRecords[0].weight : 70;

  const addBodyStats = (stats: Omit<BodyStats, 'id' | 'timestamp'>) => {
    const newStats = {
      ...stats,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setBodyStats([newStats, ...bodyStats]);
    if (user) saveItem(user.uid, 'bodyStats', newStats);
  };

  const handleForceSync = async () => {
    if (!user) return;
    try {
      console.log("正在强制同步本地修行数据至云端...");
      await pushFullStateToCloud(user.uid, {
        settings: userSettings,
        meals: meals,
        workouts: workoutLogs,
        weights: weightRecords,
        stats: bodyStats
      });
      alert("同步成功！您的本地修行记录已成功飞升云端阵法。");
    } catch (err) {
      console.error("同步失败:", err);
      alert("同步失败，请检查神识连接（网络）。");
    }
  };

  const getDailyStats = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.getTime();
    
    const todayMeals = meals.filter(m => m.timestamp >= today);
    const todayLogs = workoutLogs.filter(l => l.timestamp >= today);

    return {
      date: getLocalDateString(),
      caloriesConsumed: todayMeals.reduce((acc, m) => acc + m.calories, 0),
      caloriesBurned: todayLogs.reduce((acc, l) => acc + l.caloriesBurned, 0),
      waterIntake
    };
  };

  const tabs = [
    { id: 'dashboard', label: '识海', icon: Activity },
    { id: 'workouts', label: '炼体', icon: Dumbbell },
    { id: 'diet', label: '药膳', icon: Utensils },
    { id: 'coach', label: '仙导', icon: Sparkles },
    { id: 'progress', label: '破境', icon: Camera },
  ];

  return (
    <>
      <AnimatePresence>
        {isSplashVisible && (
          <SplashScreen onFinish={() => setIsSplashVisible(false)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-zinc-50 pb-24 text-zinc-900 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#8C0000] p-2 rounded-xl shadow-lg shadow-red-900/10 border border-red-800/20">
              <Sword className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-zinc-900 italic font-serif">
              ALL <span className="text-[#D4AF37]">FIT</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[#D4AF37]/10 px-3 py-1.5 rounded-full border border-[#D4AF37]/30">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-serif">仙阶晋升中</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowAuthModal(true)}
              className="h-10 w-10 hover:bg-transparent p-0"
            >
              <Avatar className="h-full w-full border-2 border-[#D4AF37] shadow-lg ring-2 ring-[#D4AF37]/10 transition-transform hover:scale-110 cursor-pointer overflow-hidden p-0.5">
                {user?.photoURL ? (
                  <AvatarImage src={user.photoURL} />
                ) : (
                  <AvatarFallback className="bg-[#8C0000] text-white font-bold">{user?.displayName?.[0] || '修'}</AvatarFallback>
                )}
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 ${activeTab === 'coach' ? 'py-2 sm:py-8' : 'py-8'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                meals={meals} 
                workoutLogs={workoutLogs} 
                waterIntake={waterIntake}
                setWaterIntake={(val) => {
                  setWaterIntake(val);
                  if (user) saveDailyStatus(user.uid, 'water', getLocalDateString(), { amount: val });
                }}
                weightRecords={weightRecords}
                bodyStats={bodyStats}
                settings={userSettings}
                onUpdateSettings={(newSettings) => {
                  setUserSettings(newSettings);
                  if (user) syncUserSettings(user.uid, newSettings);
                }}
                supplements={supplements}
                onUpdateSupplements={(date, data) => {
                  setSupplements(prev => ({ ...prev, [date]: data }));
                  if (user) saveDailyStatus(user.uid, 'supplements', date, data);
                }}
                onAddWeight={addWeight}
                onDeleteMeal={deleteMeal}
                onDeleteLog={deleteWorkoutLog}
                onOpenCoach={() => setActiveTab('coach')}
                onOpenCultivation={() => setShowCultivationDetails(true)}
              />
            )}
            {activeTab === 'workouts' && (
              <Workouts 
                onAddLog={addWorkoutLog} 
                onDeleteLog={deleteWorkoutLog}
                logs={workoutLogs}
                weight={latestWeight}
                plannedWorkouts={plannedWorkouts}
                setPlannedWorkouts={setPlannedWorkouts}
                startTime={startTime}
                setStartTime={setStartTime}
                elapsedTime={elapsedTime}
                timeLeft={timeLeft}
                setTimeLeft={setTimeLeft}
                isTimerActive={isTimerActive}
                setIsTimerActive={setIsTimerActive}
                restDuration={restDuration}
                setRestDuration={setRestDuration}
              />
            )}
            {activeTab === 'diet' && (
              <Diet 
                onAddMeal={addMeal} 
                onDeleteMeal={deleteMeal}
                meals={meals} 
                settings={userSettings}
              />
            )}
            {activeTab === 'progress' && (
              <Progress 
                photos={progressPhotos}
                onAddPhoto={addProgressPhoto}
                onDeletePhoto={deleteProgressPhoto}
                bodyStats={bodyStats}
                onAddBodyStats={addBodyStats}
              />
            )}
            {activeTab === 'coach' && (
              <AICoach 
                meals={meals}
                logs={workoutLogs}
                messages={chatMessages}
                setMessages={setChatMessages}
                onBack={() => setActiveTab('dashboard')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Hidden when full screen overlay is active */}
      {!showCultivationDetails && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-zinc-200 p-2 rounded-[2.5rem] shadow-2xl z-50 w-[92vw] max-w-md ring-1 ring-black/5">
          <div className="flex items-center justify-between px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl transition-all duration-500 relative group ${
                  activeTab === tab.id 
                    ? 'text-[#D4AF37] scale-110' 
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-zinc-100 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]' : ''}`} />
                <span className={`text-[10px] font-bold tracking-widest ${activeTab === tab.id ? 'font-serif' : ''}`}>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Full Screen Cultivation Detail Overlay - Root Level to avoid z-index trapping */}
      <AnimatePresence>
        {showCultivationDetails && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden"
          >
            {/* Fixed Header */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-zinc-100 bg-white/80 backdrop-blur-xl z-20 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setShowCultivationDetails(false)} className="rounded-full h-10 w-10 text-zinc-400">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-black italic tracking-tighter text-zinc-900">境界演化 · 顺为凡 · 逆则仙</h2>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">天道酬勤 · 不负苦修</p>
              </div>
              <div className="w-10" />
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 pb-24 touch-pan-y">
              <div className="max-w-xl mx-auto space-y-3 sm:space-y-4 py-8">
                {(() => {
                  const totalXp = workoutLogs.reduce((acc, log) => {
                    const volume = (log.weight && log.reps) ? (log.weight * log.reps * log.sets) : 0;
                    return acc + calculateXP(log.caloriesBurned, volume);
                  }, 0);
                  const { level } = getCurrentLevel(totalXp);
                  
                  return CULTIVATION_LEVELS.map((c) => {
                    const isUnlocked = totalXp >= c.minXp;
                    const isCurrent = level.name === c.name;
                    return (
                      <div 
                        key={c.name} 
                        className={`p-5 rounded-[1.8rem] border transition-all duration-300 ${
                          isCurrent 
                            ? "bg-white border-[#FFB703] border-2 shadow-xl shadow-[#FFB703]/10" 
                            : isUnlocked 
                              ? "bg-zinc-50 border-zinc-200 opacity-90" 
                              : "bg-zinc-50/20 border-zinc-100 opacity-30 grayscale"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            {isCurrent && <div className="h-2 w-2 rounded-full bg-[#FFB703] animate-pulse" />}
                            <h4 className={`font-black tracking-tight ${
                              isCurrent ? "text-[#FFB703] text-lg" : "text-zinc-500 text-base"
                            }`}>
                              {c.name}
                            </h4>
                          </div>
                          {isUnlocked && !isCurrent && (
                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">已圆满</span>
                          )}
                          {!isUnlocked && (
                            <span className="text-[9px] font-mono text-zinc-400">需 {c.minXp} XP</span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed italic ${
                          isCurrent ? "text-zinc-600" : "text-zinc-400"
                        }`}>
                          {c.description}
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="shrink-0 p-4 sm:p-6 bg-white border-t border-zinc-100 pb-10 sm:pb-12 z-20">
              <Button onClick={() => setShowCultivationDetails(false)} className="w-full h-14 sm:h-16 rounded-[2rem] sm:rounded-3xl bg-[#FFB703] hover:bg-[#FFB703]/90 text-zinc-900 font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg shadow-[#FFB703]/20">
                <ChevronLeft className="h-5 w-5" />
                <span>归元 · 继续苦修</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onForceSync={handleForceSync}
      />
    </div>
    </>
  );
}
