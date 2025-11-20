
import { Task, TaskCategory, Reward, AvatarItem } from './types';

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

// --- Avatar Items ---

export const AVATAR_ITEMS: AvatarItem[] = [
    // Heads
    { id: 'h_crown_gold', type: 'head', name: '黄金皇冠', cost: 150, icon: '👑', color: '#FFD700' },
    { id: 'h_cap_blue', type: 'head', name: '蓝色棒球帽', cost: 50, icon: '🧢', color: '#3B82F6' },
    { id: 'h_ears_bunny', type: 'head', name: '兔耳朵', cost: 80, icon: '🐰', color: '#F472B6' },
    { id: 'h_flower', type: 'head', name: '小红花', cost: 30, icon: '🌺', color: '#EF4444' },
    { id: 'h_wizard', type: 'head', name: '魔法帽', cost: 120, icon: '🧙', color: '#8B5CF6' },

    // Bodies (Shirts/Dresses)
    { id: 'b_shirt_red', type: 'body', name: '红色T恤', cost: 0, icon: '👕', color: '#EF4444' }, // Default
    { id: 'b_dress_pink', type: 'body', name: '粉色裙子', cost: 60, icon: '👗', color: '#F472B6' },
    { id: 'b_suit_super', type: 'body', name: '超人服', cost: 200, icon: '🦸', color: '#3B82F6' },
    { id: 'b_shirt_green', type: 'body', name: '绿色卫衣', cost: 40, icon: '👚', color: '#10B981' },
    { id: 'b_robe_wizard', type: 'body', name: '魔法长袍', cost: 150, icon: '👘', color: '#6D28D9' },

    // Back (Wings)
    { id: 'bk_wings_angel', type: 'back', name: '天使翅膀', cost: 300, icon: '👼', color: '#FFFFFF' },
    { id: 'bk_cape_red', type: 'back', name: '红色披风', cost: 100, icon: '🧣', color: '#EF4444' },
    { id: 'bk_wings_dragon', type: 'back', name: '龙翅膀', cost: 250, icon: '🦖', color: '#10B981' },
    { id: 'bk_backpack', type: 'back', name: '小书包', cost: 60, icon: '🎒', color: '#F59E0B' },

    // Hands
    { id: 'hd_wand_star', type: 'hand', name: '星星魔杖', cost: 180, icon: '🪄', color: '#FCD34D' },
    { id: 'hd_sword', type: 'hand', name: '勇者之剑', cost: 150, icon: '🗡️', color: '#9CA3AF' },
    { id: 'hd_balloon', type: 'hand', name: '气球', cost: 40, icon: '🎈', color: '#EF4444' },
    { id: 'hd_bear', type: 'hand', name: '小熊', cost: 90, icon: '🧸', color: '#D97706' },

    // Faces (Glasses etc)
    { id: 'f_glasses', type: 'face', name: '酷酷墨镜', cost: 70, icon: '🕶️', color: '#1F2937' },
    { id: 'f_mask', type: 'face', name: '神秘面具', cost: 80, icon: '🎭', color: '#4B5563' },
];
