export interface Poetry {
  content: string;
  author: string;
  source: string;
}

export const DAILY_POETRY: Poetry[] = [
  { content: "长风破浪会有时，直挂云帆济沧海。", author: "李白", source: "行路难" },
  { content: "天行健，君子以自强不息。", author: "孔子 (编)", source: "周易" },
  { content: "博观而约取，厚积而薄发。", author: "苏轼", source: "稼说送张忞" },
  { content: "少壮不努力，老大徒伤悲。", author: "佚名", source: "乐府诗集·长歌行" },
  { content: "千磨万击还坚劲，任尔东西南北风。", author: "郑燮", source: "竹石" },
  { content: "穷且益坚，不坠青云之志。", author: "王勃", source: "滕王阁序" },
  { content: "不鸣则已，一鸣惊人；不飞则已，一飞冲天。", author: "司马迁", source: "史记" },
  { content: "路漫漫其修远兮，吾将上下而求索。", author: "屈原", source: "离骚" },
  { content: "锲而舍之，朽木不折；锲而不舍，金石可镂。", author: "荀子", source: "劝学" },
  { content: "欲穷千里目，更上一层楼。", author: "王之涣", source: "登鹳雀楼" },
];

export function getDailyPoetry(): Poetry {
  const day = new Date().getDate();
  return DAILY_POETRY[day % DAILY_POETRY.length];
}
