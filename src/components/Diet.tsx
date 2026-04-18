import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Utensils, Plus, History, Scale, Trash2, Flame, Droplets, Scan, Camera, Box } from 'lucide-react';
import { Meal, UserSettings } from '../types';
import { FOOD_DATABASE, FoodItem, COOKING_METHODS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BarcodeScanner from './BarcodeScanner';
import { analyzeNutritionLabel } from '../lib/gemini';
import { useRef } from 'react';

interface DietProps {
  onAddMeal: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  onDeleteMeal: (id: string) => void;
  meals: Meal[];
  settings: UserSettings;
}

export default function Diet({ onAddMeal, onDeleteMeal, meals, settings }: DietProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [weight, setWeight] = useState('100');
  const [isRaw, setIsRaw] = useState(true);
  const [cookingMethod, setCookingMethod] = useState(COOKING_METHODS[0].name);
  const [hasOil, setHasOil] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [mealType, setMealType] = useState<'早餐' | '午餐' | '晚餐' | '加餐'>('午餐');
  const [manualData, setManualData] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate calories based on P/C/F
  React.useEffect(() => {
    if (isManual) {
      const p = parseFloat(manualData.protein) || 0;
      const c = parseFloat(manualData.carbs) || 0;
      const f = parseFloat(manualData.fat) || 0;
      const cal = (p * 4) + (c * 4) + (f * 9);
      if (cal > 0) {
        setManualData(prev => ({ ...prev, calories: Math.round(cal).toString() }));
      }
    }
  }, [manualData.protein, manualData.carbs, manualData.fat, isManual]);

  const resetManual = () => setManualData({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  // Deduplicate meals for "Food Library"
  const foodLibrary = Array.from(new Set(meals.map(m => m.name))).map(name => {
    return meals.find(m => m.name === name)!;
  });

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
        reader.readAsDataURL(file);
      });

      const result = await analyzeNutritionLabel(base64);
      const newFood: FoodItem = {
        name: result.name,
        caloriesPer100g: result.caloriesPer100g,
        proteinPer100g: result.proteinPer100g,
        carbsPer100g: result.carbsPer100g,
        fatPer100g: result.fatPer100g
      };
      
      setSelectedFood(newFood);
      setWeight('100');
      setIsRaw(false);
      setIsManual(false);
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('AI图文识别失败。原因可能是：图片不够清晰、未包含清晰的营养成分表、或者网络连接超时。请尝试近距离拍摄营养标签。');
    } finally {
      setIsAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsScanning(false);
    setIsLoading(true);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1) {
        const product = data.product;
        const nutriments = product.nutriments;
        
        const scannedFood: FoodItem = {
          name: product.product_name || product.generic_name || '未知食品',
          caloriesPer100g: nutriments['energy-kcal_100g'] || (nutriments['energy_100g'] ? Math.round(nutriments['energy_100g'] / 4.184) : 0),
          proteinPer100g: nutriments.proteins_100g || 0,
          carbsPer100g: nutriments.carbohydrates_100g || 0,
          fatPer100g: nutriments.fat_100g || 0
        };
        
        setSelectedFood(scannedFood);
        setWeight('100');
        setIsRaw(false); // Scanned items are usually processed/cooked
      } else {
        alert('未找到该条形码对应的食品信息');
      }
    } catch (error) {
      console.error('Error fetching barcode data:', error);
      alert('获取食品信息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFoods = FOOD_DATABASE.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMacros = (food: FoodItem, w: number, oil: boolean) => {
    const ratio = w / 100;
    let calories = food.caloriesPer100g * ratio;
    if (oil) calories += 90; // Approx 10g oil = 90kcal

    return {
      calories: Math.round(calories),
      protein: parseFloat((food.proteinPer100g * ratio).toFixed(1)),
      carbs: parseFloat((food.carbsPer100g * ratio).toFixed(1)),
      fat: parseFloat(((food.fatPer100g * ratio) + (oil ? 10 : 0)).toFixed(1)),
      weight: Math.round(w)
    };
  };

  const handleAddMeal = () => {
    if (selectedFood) {
      const w = parseFloat(weight) || 0;
      const macros = calculateMacros(selectedFood, w, hasOil);
      onAddMeal({
        name: selectedFood.name,
        mealType,
        weight: macros.weight,
        cookingMethod,
        isRaw: false, // Conversion disabled
        hasOil,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat
      });
      setSelectedFood(null);
      setSearchTerm('');
      setHasOil(false);
    }
  };

  const handleManualAdd = () => {
    if (manualData.name && manualData.calories) {
      onAddMeal({
        name: manualData.name,
        mealType,
        weight: 100,
        rawWeight: 100,
        cookingMethod: '手动记录',
        isRaw: false,
        hasOil: false,
        calories: parseFloat(manualData.calories) || 0,
        protein: parseFloat(manualData.protein) || 0,
        carbs: parseFloat(manualData.carbs) || 0,
        fat: parseFloat(manualData.fat) || 0
      });
      resetManual();
      setIsManual(false);
    }
  };

  const currentMacros = selectedFood ? calculateMacros(selectedFood, parseFloat(weight) || 0, hasOil) : null;

  const mealTypeStyles: Record<string, string> = {
    '早餐': 'bg-amber-50/50 border-amber-100 text-amber-900',
    '午餐': 'bg-orange-50/50 border-orange-100 text-orange-900',
    '晚餐': 'bg-indigo-50/50 border-indigo-100 text-indigo-900',
    '加餐': 'bg-rose-50/50 border-rose-100 text-rose-900'
  };

  const mealTypeBadges: Record<string, string> = {
    '早餐': 'bg-amber-100 text-amber-700 border-amber-200',
    '午餐': 'bg-orange-100 text-orange-700 border-orange-200',
    '晚餐': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    '加餐': 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3 text-zinc-900">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border border-zinc-100 shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-black/5">
          <div className="flex border-b border-zinc-100 bg-zinc-50/80">
            <button 
              onClick={() => setIsManual(false)}
              className={`flex-1 py-5 text-sm font-black transition-all duration-500 font-serif tracking-widest ${!isManual ? 'text-[#D4AF37] bg-white shadow-[inset_0_-2px_0_#D4AF37]' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              太虚识物 / 灵鉴
            </button>
            <button 
              onClick={() => setIsManual(true)}
              className={`flex-1 py-5 text-sm font-black transition-all duration-500 font-serif tracking-widest ${isManual ? 'text-[#8C0000] bg-white shadow-[inset_0_-2px_0_#8C0000]' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              手书笔录 (精/气/神)
            </button>
          </div>

          {!isManual ? (
            <div className="p-7 space-y-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input 
                    placeholder="搜寻灵材 (如：妖兽肉、灵米)..." 
                    className="pl-12 rounded-[1.5rem] bg-zinc-50 border border-zinc-100 h-14 text-zinc-900 placeholder:text-zinc-400 focus:ring-[#D4AF37] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleImageCapture}
                />
                <Button 
                  variant="outline" 
                  className="h-14 w-14 rounded-[1.5rem] border-zinc-100 bg-zinc-50 text-[#D4AF37] hover:bg-zinc-100 hover:text-zinc-900 p-0 transition-all active:scale-95 shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzingImage}
                >
                  {isAnalyzingImage ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#D4AF37] border-t-transparent" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 w-14 rounded-[1.5rem] border-zinc-100 bg-zinc-50 text-[#8C0000] hover:bg-zinc-100 hover:text-zinc-900 p-0 transition-all active:scale-95 shadow-sm"
                  onClick={() => setIsScanning(true)}
                >
                  <Scan className="h-6 w-6" />
                </Button>
              </div>

              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {searchTerm && filteredFoods.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => {
                      setSelectedFood(food);
                      setIsManual(false);
                    }}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      selectedFood?.name === food.name 
                        ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.2)]' 
                        : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <span className="font-serif font-black tracking-widest">{food.name}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedFood?.name === food.name ? 'text-white' : 'text-zinc-400'}`}>
                      每100g: {food.caloriesPer100g} 气
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-7 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-zinc-400 font-serif font-black tracking-widest ml-1">名讳 · 食物</Label>
                  <Input 
                    placeholder="例如：万载重楼汤" 
                    className="rounded-2xl bg-zinc-50 border border-zinc-100 h-14 text-zinc-900 font-serif tracking-widest focus:ring-[#8C0000]"
                    value={manualData.name}
                    onChange={(e) => setManualData({...manualData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-zinc-400 font-serif font-black tracking-widest ml-1">周天时辰 · 餐次</Label>
                    <div className="flex gap-2">
                      {['早餐', '午餐', '晚餐', '加餐'].map((t) => (
                        <Button
                          key={t}
                          variant="outline"
                          size="sm"
                          onClick={() => setMealType(t as any)}
                          className={`flex-1 rounded-xl h-12 font-serif italic transition-all ${
                            mealType === t 
                              ? 'bg-[#8C0000] text-white border-transparent shadow-lg' 
                              : 'bg-white border-zinc-100 text-zinc-400'
                          }`}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 font-serif font-black tracking-widest ml-1">气力 (kcal)</Label>
                    <Input 
                      type="number"
                      placeholder="总气力" 
                      className="rounded-2xl bg-zinc-50 border border-zinc-100 h-14 text-center font-black text-lg text-zinc-900"
                      value={manualData.calories}
                      onChange={(e) => setManualData({...manualData, calories: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 font-serif font-black tracking-widest ml-1">精气 / 蛋白 (g)</Label>
                    <Input 
                      type="number"
                      placeholder="克" 
                      className="rounded-2xl bg-zinc-50 border border-zinc-100 h-14 text-center font-black text-lg text-[#8C0000]"
                      value={manualData.protein}
                      onChange={(e) => setManualData({...manualData, protein: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 font-serif font-black tracking-widest ml-1">灵机 / 碳水 (g)</Label>
                    <Input 
                      type="number"
                      placeholder="克" 
                      className="rounded-2xl bg-zinc-50 border border-zinc-100 h-14 text-center font-black text-lg text-[#457B9D]"
                      value={manualData.carbs}
                      onChange={(e) => setManualData({...manualData, carbs: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 font-serif font-black tracking-widest ml-1">本源 / 脂肪 (g)</Label>
                    <Input 
                      type="number"
                      placeholder="克" 
                      className="rounded-2xl bg-zinc-50 border border-zinc-100 h-14 text-center font-black text-lg text-[#D4AF37]"
                      value={manualData.fat}
                      onChange={(e) => setManualData({...manualData, fat: e.target.value})}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full h-16 rounded-[2rem] crimson-gradient hover:opacity-90 text-white font-black text-xl mt-2 transition-all shadow-[0_4px_20px_rgba(140,0,0,0.2)] font-serif italic tracking-widest"
                  onClick={handleManualAdd}
                  disabled={!manualData.name || !manualData.calories}
                >
                  铭刻此餐 · 存档
                </Button>
              </div>
            </div>
          )}
        </Card>

        <AnimatePresence>
          {selectedFood && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <Card className="border border-zinc-100 shadow-2xl rounded-[3rem] bg-white backdrop-blur-xl text-zinc-900 overflow-hidden ring-1 ring-black/5">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-serif italic tracking-widest text-[#D4AF37]">{selectedFood.name}</CardTitle>
                      <CardDescription className="text-zinc-400 font-serif italic">灵材入库 · 药膳调理</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-7">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-zinc-400 font-black tracking-widest uppercase text-[10px] ml-1">周天时辰 · 餐次</Label>
                      <div className="flex gap-2">
                        {['早餐', '午餐', '晚餐', '加餐'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setMealType(t as any)}
                            className={`flex-1 rounded-xl h-12 font-serif italic text-xs transition-all border ${
                              mealType === t 
                                ? 'bg-[#D4AF37] text-white border-transparent shadow-md' 
                                : 'bg-white border-zinc-100 text-zinc-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-zinc-400 font-black tracking-widest uppercase text-[10px] ml-1">斤两 (g)</Label>
                      <Input 
                        type="number" 
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="bg-zinc-50 border border-zinc-100 text-zinc-900 h-14 rounded-2xl text-center text-xl font-black focus:ring-[#D4AF37]"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-zinc-400 font-black tracking-widest uppercase text-[10px] ml-1">炼制方式 / 烹饪</Label>
                      <Select value={cookingMethod} onValueChange={setCookingMethod}>
                        <SelectTrigger className="bg-zinc-50 border border-zinc-100 text-zinc-900 h-14 rounded-2xl font-serif italic tracking-widest focus:ring-[#D4AF37]">
                          <SelectValue placeholder="选择炼制方式" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-zinc-200 bg-white text-zinc-900 shadow-2xl">
                          {COOKING_METHODS.map(m => (
                            <SelectItem key={m.name} value={m.name} className="font-serif italic text-lg py-3">{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition-all ${hasOil ? 'bg-[#D4AF37]/10 rotate-12' : 'bg-transparent'}`}>
                        <Droplets className={`h-6 w-6 ${hasOil ? 'text-[#D4AF37]' : 'text-zinc-200'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-black font-serif tracking-widest">添加药用灵脂</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">+10g 油 (约90 气)</p>
                      </div>
                    </div>
                    <Switch checked={hasOil} onCheckedChange={setHasOil} className="data-[state=checked]:bg-[#D4AF37]" />
                  </div>

                  {currentMacros && (
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: '总气力', val: currentMacros.calories, unit: '', color: 'text-zinc-900' },
                        { label: '精气', val: `${currentMacros.protein}g`, unit: '', color: 'text-[#8C0000]' },
                        { label: '灵机', val: `${currentMacros.carbs}g`, unit: '', color: 'text-[#457B9D]' },
                        { label: '本源', val: `${currentMacros.fat}g`, unit: '', color: 'text-[#D4AF37]' }
                      ].map((macro) => (
                        <div key={macro.label} className="bg-zinc-50 p-4 rounded-3xl text-center border border-zinc-100 ring-1 ring-black/5 shadow-sm">
                          <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest mb-1">{macro.label}</p>
                          <p className={`text-xl font-black tracking-tighter ${macro.color}`}>{macro.val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pb-2">
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 font-serif" onClick={() => setSelectedFood(null)}>
                      重计
                    </Button>
                    <Button className="flex-1 h-14 rounded-2xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white font-black text-lg transition-all shadow-[0_4px_20px_rgba(212,175,55,0.2)] font-serif" onClick={handleAddMeal}>
                      纳入识海 · 确认
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <Card className="border border-zinc-100 shadow-xl rounded-[2.5rem] bg-white backdrop-blur-xl ring-1 ring-black/5">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2 font-black uppercase tracking-[0.3em] text-zinc-400">
              <Box className="h-4 w-4 text-[#D4AF37]" />
              常用丹药库
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[220px]">
              <div className="p-5 flex flex-wrap gap-2">
                {foodLibrary.length === 0 ? (
                  <div className="p-8 text-center w-full">
                    <p className="text-[10px] text-zinc-400 italic tracking-[0.2em] leading-relaxed">
                      初次纳气后<br />灵材将自动录入此处
                    </p>
                  </div>
                ) : (
                  foodLibrary.map((item) => (
                    <Button 
                      key={item.id} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedFood({
                          name: item.name,
                          caloriesPer100g: Math.round(item.calories / (item.weight / 100)),
                          proteinPer100g: Math.round(item.protein / (item.weight / 100)),
                          carbsPer100g: Math.round(item.carbs / (item.weight / 100)),
                          fatPer100g: Math.round(item.fat / (item.weight / 100))
                        });
                        setWeight(item.weight.toString());
                        setIsRaw(false);
                        setIsManual(false);
                      }}
                      className="rounded-full bg-zinc-50 border-zinc-100 text-zinc-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 text-xs font-serif italic py-1 h-8 transition-all shadow-sm"
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      {item.name}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border border-zinc-100 shadow-xl rounded-[2.5rem] bg-white ring-1 ring-black/5">
          <CardHeader className="p-6">
            <CardTitle className="text-xl flex items-center gap-3 font-serif italic tracking-widest text-[#D4AF37]">
              <History className="h-5 w-5 text-zinc-400" />
              今日膳食录
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-2">
            <ScrollArea className="h-[480px]">
              <div className="space-y-3 px-2">
                {meals.length === 0 ? (
                  <div className="py-24 text-center">
                    <Utensils className="h-10 w-10 text-zinc-100 mx-auto mb-4" />
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em]">鼎炉未启，暂无记录</p>
                  </div>
                ) : (
                  [...meals].reverse().map((meal) => {
                    const style = mealTypeStyles[meal.mealType || '午餐'];
                    const badgeStyle = mealTypeBadges[meal.mealType || '午餐'];
                    return (
                      <div key={meal.id} className={`p-5 space-y-3 group relative rounded-3xl border transition-all ring-1 ring-black/5 shadow-sm ${style}`}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <Badge variant="outline" className={`text-[8px] h-4 font-black border-none px-1.5 rounded-md tracking-[0.1em] ${badgeStyle}`}>
                                {meal.mealType || '午餐'}
                              </Badge>
                              <p className="font-serif italic text-lg text-zinc-900 font-bold">{meal.name}</p>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5 pl-0.5">
                              <span className="bg-white/50 px-2 py-0.5 rounded text-zinc-500 border border-zinc-200/50">
                                {meal.weight}g
                              </span>
                              <span>•</span>
                              <span className="italic">{meal.cookingMethod}</span>
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-xl font-black italic tracking-tighter text-[#D4AF37] font-serif">
                              {meal.calories} <span className="text-[10px] font-sans opacity-40">气</span>
                            </p>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-300 hover:text-[#8C0000] hover:bg-red-50 transition-all rounded-full"
                              onClick={() => onDeleteMeal(meal.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[9px] font-black border-[#8C0000]/20 bg-white/60 text-[#8C0000] px-2 py-0.5">精 {meal.protein}g</Badge>
                          <Badge variant="outline" className="text-[9px] font-black border-[#457B9D]/20 bg-white/60 text-[#457B9D] px-2 py-0.5">灵 {meal.carbs}g</Badge>
                          <Badge variant="outline" className="text-[9px] font-black border-[#D4AF37]/20 bg-white/60 text-[#D4AF37] px-2 py-0.5">本 {meal.fat}g</Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {isScanning && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      {isLoading && (
        <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent" />
            <p className="font-medium">正在获取食品信息...</p>
          </div>
        </div>
      )}
    </div>
  );
}
