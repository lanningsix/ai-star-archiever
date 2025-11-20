
import { Task, TaskCategory, Reward } from './types';

// [CLOUDFLARE CONFIG]
// Cloudflare Worker 后端地址
export const CLOUD_API_URL = 'https://dundun.uno'; 

export const INITIAL_TASKS: Task[] = [
  // Life Habits
  { id: 't1', category: TaskCategory.LIFE, title: '按时起床', stars: 2 },
  { id: 't2', category: TaskCategory.LIFE, title: '自己穿衣服、叠被子', stars: 2 },
  { id: 't3', category: TaskCategory.LIFE, title: '按时上床睡觉', stars: 2 },
  { id: 't4', category: TaskCategory.LIFE, title: '每天上幼儿园不缺勤', stars: 2 },
  { id: 't5', category: TaskCategory.LIFE, title: '不挑食、不剩饭', stars: 2 },
  { id: 't6', category: TaskCategory.LIFE, title: '不用提醒自己喝水', stars: 2 },
  { id: 't7', category: TaskCategory.LIFE, title: '玩具玩完自己收拾', stars: 2 },
  { id: 't8', category: TaskCategory.LIFE, title: '爱护玩具、书本', stars: 2 },

  // Behavioral Habits
  { id: 't9', category: TaskCategory.BEHAVIOR, title: '每天坚持运动30分钟', stars: 2 },
  { id: 't10', category: TaskCategory.BEHAVIOR, title: '每天阅读至少30分钟', stars: 2 },
  { id: 't11', category: TaskCategory.BEHAVIOR, title: '学会1首新的古诗/儿歌', stars: 2 },
  { id: 't12', category: TaskCategory.BEHAVIOR, title: '能用数学方法解决问题', stars: 2 },
  { id: 't13', category: TaskCategory.BEHAVIOR, title: '遇到问题好好说话', stars: 2 },
  { id: 't14', category: TaskCategory.BEHAVIOR, title: '遇到困难不退缩', stars: 2 },

  // Bonus
  { id: 't15', category: TaskCategory.BONUS, title: '主动做家务', stars: 5 },
  { id: 't16', category: TaskCategory.BONUS, title: '得到老师/小朋友表扬', stars: 5 },
  { id: 't17', category: TaskCategory.BONUS, title: '讲一个很长的故事', stars: 5 },
  { id: 't18', category: TaskCategory.BONUS, title: '犯错了主动承认改正', stars: 5 },

  // Penalty
  { id: 't19', category: TaskCategory.PENALTY, title: '上学迟到', stars: -5 },
  { id: 't20', category: TaskCategory.PENALTY, title: '不听老师的话', stars: -5 },
  { id: 't21', category: TaskCategory.PENALTY, title: '说谎、打人、咬人', stars: -5 },
  { id: 't22', category: TaskCategory.PENALTY, title: '长时间玩手机/看电视', stars: -5 },
];

export const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: '看动画片 20分钟', cost: 30, icon: '📺' },
  { id: 'r2', title: '吃一个冰淇淋', cost: 50, icon: '🍦' },
  { id: 'r3', title: '去公园玩', cost: 80, icon: '🎡' },
  { id: 'r4', title: '买一个小玩具', cost: 200, icon: '🧸' },
  { id: 'r5', title: '免做家务一次', cost: 40, icon: '🧹' },
];

export const COMMON_EMOJIS = [
  '📺', '🎮', '🍦', '🍬', '🍟', '🍟', 
  '🎡', '🪁', '🧸', '⚽', '🛹', '🎨',
  '📚', '🧩', '🎸', '🚲', '🏊', '🎁',
  '🧹', '🛏️', '🛁', '🦷', '🎒', '⏰',
  '🦄', '🦕', '🚀', '👑', '🌈', '🍩'
];

export const CATEGORY_STYLES = {
    [TaskCategory.LIFE]: { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700', iconBg: 'bg-lime-400', accent: 'text-lime-500' },
    [TaskCategory.BEHAVIOR]: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', iconBg: 'bg-sky-400', accent: 'text-sky-500' },
    [TaskCategory.BONUS]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-400', accent: 'text-amber-500' },
    [TaskCategory.PENALTY]: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconBg: 'bg-rose-400', accent: 'text-rose-500' },
};
