
export interface Exercise {
  id: string;
  name: string;
  category: '胸部' | '背部' | '肩部' | '腿部' | '手臂' | '有氧' | '腹肌';
  targetMuscle?: string;
  description: string;
  caloriesPerMinute: number;
  image?: string;
  isTimeBased?: boolean;
}

export interface WorkoutLog {
  id: string;
  exerciseId: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number; // in minutes for time-based
  incline?: number;
  speed?: number;
  caloriesBurned: number;
  timestamp: number;
  status: 'planned' | 'completed';
}

export interface Meal {
  id: string;
  name: string;
  weight: number; // cooked weight in grams
  rawWeight?: number;
  cookingMethod?: string;
  isRaw?: boolean;
  hasOil?: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType?: '早餐' | '午餐' | '晚餐' | '加餐';
  timestamp: number;
}

export interface WeightRecord {
  id: string;
  weight: number;
  timestamp: number;
}

export interface ProgressPhoto {
  id: string;
  url: string;
  type: 'front' | 'side';
  timestamp: number;
}

export interface BodyStats {
  id: string;
  bodyFat?: number;
  analysis?: string;
  timestamp: number;
}

export interface DailyStats {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  waterIntake: number; // glasses
}

export interface UserSettings {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoal: number; // in Liters
}

export interface SupplementCheck {
  fishOil: boolean;
  vitamins: boolean;
  creatine: boolean;
}
