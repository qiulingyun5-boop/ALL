
export interface CultivationLevel {
  name: string;
  minXp: number;
  maxXp: number;
  description: string;
  bg: string;
}

export const CULTIVATION_LEVELS: CultivationLevel[] = [
  ...Array.from({ length: 15 }, (_, i) => ({
    name: `炼气${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'][i]}层`,
    minXp: i * 300,
    maxXp: (i + 1) * 300 - 1,
    description: `炼气期第${i + 1}层：纳灵气筑根基，求得长生之始。`,
    bg: 'bg-[#27272a]'
  })),
  { name: '筑基期', minXp: 4500, maxXp: 15000, description: '天道、地道、凡道，筑基之始', bg: 'bg-[#1e3a8a]' },
  { name: '结丹期', minXp: 15001, maxXp: 45000, description: '假丹、结丹，金丹自生', bg: 'bg-[#b45309]' },
  { name: '元婴期', minXp: 45001, maxXp: 100000, description: '破丹成婴，瞬移之能', bg: 'bg-[#581c87]' },
  { name: '化神期', minXp: 100001, maxXp: 220000, description: '感悟意境，神识化形', bg: 'bg-[#7f1d1d]' },
  { name: '婴变期', minXp: 220001, maxXp: 400000, description: '舍弃元婴，融仙气入体', bg: 'bg-[#312e81]' },
  { name: '问鼎期', minXp: 400001, maxXp: 650000, description: '意境圆满，问鼎长生', bg: 'bg-[#064e3b]' },
  { name: '阴虚境', minXp: 650001, maxXp: 1000000, description: '第一步巅峰，半步踏天', bg: 'bg-[#881337]' },
  { name: '阳实境', minXp: 1000001, maxXp: 1500000, description: '窥涅之下，阳实最强', bg: 'bg-[#0f172a]' },
  { name: '窥涅境', minXp: 1500001, maxXp: Infinity, description: '步入第二步，看破虚幻', bg: 'bg-[#0ea5e9]' },
];

export function calculateXP(caloriesBurned: number, workoutVolume: number): number {
  // Balanced formula for XP: 1 calorie = 0.5 XP, 100kg volume = 1 XP
  return Math.round((caloriesBurned * 0.5) + (workoutVolume / 100));
}

export function getCurrentLevel(totalXp: number): { level: CultivationLevel; progress: number } {
  const level = CULTIVATION_LEVELS.find(l => totalXp >= l.minXp && totalXp <= l.maxXp) || CULTIVATION_LEVELS[CULTIVATION_LEVELS.length - 1];
  const range = level.maxXp - level.minXp;
  const progress = range === Infinity ? 100 : ((totalXp - level.minXp) / range) * 100;
  return { level, progress };
}
