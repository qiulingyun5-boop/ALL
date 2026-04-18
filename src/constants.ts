
import { Exercise } from './types';

export const EXERCISES: Exercise[] = [
  // 胸部
  { id: 'c1', name: '平板卧推', category: '胸部', targetMuscle: '胸大肌、三角肌前束', description: '锻炼胸大肌整体厚度的黄金动作。', caloriesPerMinute: 8, image: '/benchpress_pig.jpg' },
  { id: 'c2', name: '双杠臂屈伸', category: '胸部', targetMuscle: '胸肌下沿、肱三头肌', description: '侧重胸部下沿及三头肌。', caloriesPerMinute: 9, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-doing-tricep-dips-on-gym-bars-pixar-style-high-detail?width=400&height=300&nologo=true' },
  { id: 'c3', name: '器械上斜卧推', category: '胸部', targetMuscle: '胸肌上部', description: '针对胸肌上部，打造饱满上胸。', caloriesPerMinute: 7, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-using-chest-press-machine-incline-gym-high-quality-render?width=400&height=300&nologo=true' },
  { id: 'c4', name: '哑铃平板卧推', category: '胸部', targetMuscle: '胸大肌', description: '比杠铃卧推更大的拉伸感和自由度。', caloriesPerMinute: 8, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-training-with-dumbbells-bench-press-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'c5', name: '哑铃器械上斜卧推', category: '胸部', targetMuscle: '上胸', description: '上斜角度锻炼上胸，哑铃提供更好挤压感。', caloriesPerMinute: 7, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-incline-dumbbell-press-exercise-high-quality-3d-art?width=400&height=300&nologo=true' },
  { id: 'c6', name: '器械推胸', category: '胸部', targetMuscle: '胸大肌整体', description: '固定轨迹，适合力竭训练。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-sitting-chest-press-machine-gym-equipment-3d-render?width=400&height=300&nologo=true' },
  { id: 'c7', name: '绳索夹下胸', category: '胸部', targetMuscle: '胸肌下部轮廓', description: '雕刻胸肌下部轮廓。', caloriesPerMinute: 5, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-cable-cross-over-chest-fly-gym-3d-render?width=400&height=300&nologo=true' },

  // 背部
  { id: 'b1', name: '游艇划船', category: '背部', targetMuscle: '背阔肌、斜方肌', description: '锻炼背部厚度和中背部。', caloriesPerMinute: 8, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-seated-cable-row-gym-back-workout-high-quality-render?width=400&height=300&nologo=true' },
  { id: 'b2', name: 'T杠划船', category: '背部', targetMuscle: '中背部、大圆肌', description: '大重量背部厚度训练。', caloriesPerMinute: 9, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-doing-T-bar-row-exercise-gym-equipment-3d-render?width=400&height=300&nologo=true' },
  { id: 'b3', name: '高位下拉', category: '背部', targetMuscle: '背阔肌', description: '增加背部宽度的必备动作。', caloriesPerMinute: 7, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-lat-pulldown-gym-equipment-back-workout-3d-render?width=400&height=300&nologo=true' },
  { id: 'b4', name: 'V把划船', category: '背部', targetMuscle: '背部中下部', description: '针对背部中下部。', caloriesPerMinute: 7, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-V-bar-seated-row-exercise-gym-3d-art?width=400&height=300&nologo=true' },
  { id: 'b5', name: '对握下拉', category: '背部', targetMuscle: '下背阔肌', description: '中立握法，减少手腕压力，专注背部。', caloriesPerMinute: 7, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-neutral-grip-lat-pulldown-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'b6', name: '反手高位下拉', category: '背部', targetMuscle: '背阔肌下部、肱二头肌', description: '更多二头肌参与，增加背部下沿拉伸。', caloriesPerMinute: 7, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-reverse-grip-lat-pulldown-workout-3d-render?width=400&height=300&nologo=true' },
  { id: 'b7', name: '单臂绳索下拉', category: '背部', targetMuscle: '孤立背阔肌', description: '孤立训练背阔肌，改善左右不平衡。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-single-arm-lat-pulldown-gym-equipment-3d-render?width=400&height=300&nologo=true' },

  // 肩部
  { id: 's1', name: '哑铃推肩', category: '肩部', targetMuscle: '三角肌前束', description: '锻炼三角肌前束和中束。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-doing-overhead-dumbbell-shoulder-press-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 's2', name: '实力推', category: '肩部', targetMuscle: '三角肌、核心', description: '站姿杠铃推举，全身力量的体现。', caloriesPerMinute: 9, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-standing-barbell-overhead-press-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 's3', name: '器械推肩', category: '肩部', targetMuscle: '三角肌中束', description: '安全稳定的肩部力量训练。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-using-shoulder-press-machine-gym-equipment-3d-render?width=400&height=300&nologo=true' },
  { id: 's4', name: '蝴蝶机反向飞鸟', category: '肩部', targetMuscle: '三角肌后束', description: '孤立训练三角肌后束。', caloriesPerMinute: 5, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-reverse-fly-machine-rear-delt-workout-3d-render?width=400&height=300&nologo=true' },
  { id: 's5', name: '曲杠提拉', category: '肩部', targetMuscle: '侧三角肌、斜方肌', description: '针对三角肌中束和斜方肌。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-upright-row-with-EZ-bar-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 's6', name: '哑铃飞鸟', category: '肩部', targetMuscle: '三角肌中束', description: '侧平举，打造球形肩膀。', caloriesPerMinute: 5, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-dumbbell-lateral-raises-shoulder-workout-3d-render?width=400&height=300&nologo=true' },
  { id: 's7', name: '绳索飞鸟', category: '肩部', targetMuscle: '三角肌中束(极点张力)', description: '持续张力下的肩部侧平举。', caloriesPerMinute: 5, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-cable-lateral-raises-shoulder-workout-gym-3d-render?width=400&height=300&nologo=true' },

  // 腿部
  { id: 'l1', name: '杠铃深蹲', category: '腿部', targetMuscle: '股四头肌、臀大肌', description: '力量之王，锻炼全身尤其是下肢。', caloriesPerMinute: 12, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-heavy-barbell-back-squat-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'l2', name: '哈克深蹲', category: '腿部', targetMuscle: '股四头肌', description: '固定轨迹，专注股四头肌。', caloriesPerMinute: 10, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-using-hack-squat-machine-gym-equipment-3d-render?width=400&height=300&nologo=true' },
  { id: 'l3', name: '器械倒蹲', category: '腿部', targetMuscle: '股四头肌、臀大肌', description: '针对臀部和股四头肌的强力器械。', caloriesPerMinute: 10, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-using-leg-press-machine-workout-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'l4', name: '腿屈伸', category: '腿部', targetMuscle: '股四头肌(孤立)', description: '孤立训练股四头肌，刻画线条。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-leg-extension-machine-exercise-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'l5', name: '臀推', category: '腿部', targetMuscle: '臀大肌', description: '锻炼臀大肌的最佳动作。', caloriesPerMinute: 8, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-weighted-hip-thrust-exercise-3d-render?width=400&height=300&nologo=true' },

  // 手臂
  { id: 'a1', name: '杠铃弯举', category: '手臂', targetMuscle: '肱二头肌', description: '增加二头肌围度的基础动作。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-standing-barbell-bicep-curls-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'a2', name: '哑铃弯举', category: '手臂', targetMuscle: '肱二头肌', description: '灵活多变的二头肌训练。', caloriesPerMinute: 5, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-alternate-dumbbell-bicep-curls-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'a3', name: '绳索臂屈伸', category: '手臂', targetMuscle: '肱三头肌', description: '针对三头肌长头，刻画马蹄形。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-tricep-pushdown-cable-machine-3d-render?width=400&height=300&nologo=true' },

  // 有氧
  { id: 'o1', name: '爬坡', category: '有氧', targetMuscle: '心肺、腿部耐力', description: '高坡度行走，高效燃脂且不伤膝盖。', caloriesPerMinute: 10, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-running-on-a-treadmill-incline-gym-high-quality-3d-render?width=400&height=300&nologo=true', isTimeBased: true },
  { id: 'o2', name: '跑步', category: '有氧', targetMuscle: '心肺', description: '经典有氧运动，提升心肺功能。', caloriesPerMinute: 12, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-jogging-outside-city-skyscrapers-background-3d-render?width=400&height=300&nologo=true', isTimeBased: true },
  { id: 'o3', name: '间歇跑', category: '有氧', targetMuscle: '心肺、爆发力', description: 'HIIT高强度间歇训练，极速燃脂。', caloriesPerMinute: 15, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-running-fast-motion-blur-3d-animated-style-render?width=400&height=300&nologo=true', isTimeBased: true },

  // 腹肌
  { id: 'ab1', name: '龙门架磕头', category: '腹肌', targetMuscle: '腹直肌', description: '绳索卷腹，增加腹肌厚度。', caloriesPerMinute: 6, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-cable-crunches-kneeing-position-gym-3d-render?width=400&height=300&nologo=true' },
  { id: 'ab2', name: '反向山羊', category: '腹肌', targetMuscle: '竖脊肌、核心', description: '锻炼下背部及核心后侧。', caloriesPerMinute: 5, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-performing-back-extensions-hyperextension-bench-3d-render?width=400&height=300&nologo=true' },
  { id: 'ab3', name: '悬垂举腿', category: '腹肌', targetMuscle: '下腹部', description: '针对下腹部的强力动作。', caloriesPerMinute: 7, image: 'https://image.pollinations.ai/prompt/3D-animated-pig-superhero-GG-Bond-hanging-leg-raises-pull-up-bar-gym-3d-render?width=400&height=300&nologo=true' },
];

export interface FoodItem {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export const COOKING_METHODS = [
  { name: '生食/水煮', ratio: 1.0, description: '重量基本不变' },
  { name: '中式炒菜', ratio: 0.85, description: '水分流失约15%' },
  { name: '煎炸/烘烤', ratio: 0.7, description: '水分流失约30%' },
];

export const FOOD_DATABASE: FoodItem[] = [
  { name: '鸡胸肉', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { name: '鸡蛋', caloriesPer100g: 143, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 10 },
  { name: '糙米', caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9 },
  { name: '白米饭', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { name: '西兰花', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { name: '牛肉 (瘦)', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
  { name: '三文鱼', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { name: '香蕉', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { name: '燕麦', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
  { name: '红薯', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { name: '全麦面包', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4 },
  { name: '希腊酸奶', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: '牛油果', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15 },
  { name: '杏仁', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { name: '牛奶', caloriesPer100g: 42, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 1 },
];
