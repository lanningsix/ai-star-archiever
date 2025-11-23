
import { Task, TaskCategory, Reward, AvatarItem, Achievement } from './types'

// [CLOUDFLARE CONFIG]
// Cloudflare Worker 后端地址
export const CLOUD_API_URL = 'https://star-server.dundun.uno'

// --- AUDIO RESOURCES ---
export const AUDIO_RESOURCES = {
  SUCCESS: [
    'https://static-file.dundun.uno/audio/unbelievable.mp3', // Unbelievable
  ],
  PENALTY: [
    'https://static-file.dundun.uno/audio/fail.mp3', // 失败音效
  ],
  UNLOCK: [
    'https://static-file.dundun.uno/audio/up.mp3', // 升级音效
  ],
}

export const INITIAL_TASKS: Task[] = [
  // Life Habits
  { id: 't1', category: TaskCategory.LIFE, title: '按时起床', stars: 2, icon: '⏰' },
  {
    id: 't2',
    category: TaskCategory.LIFE,
    title: '自己穿衣服、叠被子',
    stars: 2,
    icon: '🛏️'
  },
  { id: 't3', category: TaskCategory.LIFE, title: '按时上床睡觉', stars: 2, icon: '🌙' },
  {
    id: 't4',
    category: TaskCategory.LIFE,
    title: '每天上幼儿园不缺勤',
    stars: 2,
    icon: '🏫'
  },
  { id: 't5', category: TaskCategory.LIFE, title: '不挑食、不剩饭', stars: 2, icon: '🍚' },
  {
    id: 't6',
    category: TaskCategory.LIFE,
    title: '不用提醒自己喝水',
    stars: 2,
    icon: '💧'
  },
  {
    id: 't7',
    category: TaskCategory.LIFE,
    title: '玩具玩完自己收拾',
    stars: 2,
    icon: '🧸'
  },
  { id: 't8', category: TaskCategory.LIFE, title: '爱护玩具、书本', stars: 2, icon: '📚' },

  // Behavioral Habits
  {
    id: 't9',
    category: TaskCategory.BEHAVIOR,
    title: '每天坚持运动30分钟',
    stars: 2,
    icon: '🏃'
  },
  {
    id: 't10',
    category: TaskCategory.BEHAVIOR,
    title: '每天阅读至少30分钟',
    stars: 2,
    icon: '📖'
  },
  {
    id: 't11',
    category: TaskCategory.BEHAVIOR,
    title: '学会1首新的古诗/儿歌',
    stars: 2,
    icon: '🎵'
  },
  {
    id: 't12',
    category: TaskCategory.BEHAVIOR,
    title: '能用数学方法解决问题',
    stars: 2,
    icon: '🔢'
  },
  {
    id: 't13',
    category: TaskCategory.BEHAVIOR,
    title: '遇到问题好好说话',
    stars: 2,
    icon: '🗣️'
  },
  {
    id: 't14',
    category: TaskCategory.BEHAVIOR,
    title: '遇到困难不退缩',
    stars: 2,
    icon: '💪'
  },

  // Bonus
  { id: 't15', category: TaskCategory.BONUS, title: '主动做家务', stars: 5, icon: '🧹' },
  {
    id: 't16',
    category: TaskCategory.BONUS,
    title: '得到老师/小朋友表扬',
    stars: 5,
    icon: '👏'
  },
  {
    id: 't17',
    category: TaskCategory.BONUS,
    title: '讲一个很长的故事',
    stars: 5,
    icon: '🐉'
  },
  {
    id: 't18',
    category: TaskCategory.BONUS,
    title: '犯错了主动承认改正',
    stars: 5,
    icon: '🙇'
  },

  // Penalty
  { id: 't19', category: TaskCategory.PENALTY, title: '上学迟到', stars: -5, icon: '😫' },
  {
    id: 't20',
    category: TaskCategory.PENALTY,
    title: '不听老师的话',
    stars: -5,
    icon: '🙉'
  },
  {
    id: 't21',
    category: TaskCategory.PENALTY,
    title: '说谎、打人、咬人',
    stars: -5,
    icon: '🤥'
  },
  {
    id: 't22',
    category: TaskCategory.PENALTY,
    title: '长时间玩手机/看电视',
    stars: -5,
    icon: '📺'
  },
]

export const TASK_ICONS = [
  '⏰', '🛏️', '🌙', '🏫', '🍚', '💧', '🧸', '📚', '🏃', '📖', 
  '🎵', '🔢', '🗣️', '💪', '🧹', '👏', '🐉', '🙇', '😫', '🙉', 
  '🤥', '📺', '🦷', '🚿', '👗', '🎒', '✏️', '🎨', '🎹', '⚽', 
  '🏊', '🗑️', '🤝', '🤐', '👂', '😊', '😢', '😠', '💤', '📱', 
  '🎮', '🍬', '👊', '🌞', '🌛', '🍽️', '🚽', '🛁'
]

export const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: '看动画片 20分钟', cost: 30, icon: '📺' },
  { id: 'r2', title: '吃一个冰淇淋', cost: 50, icon: '🍦' },
  { id: 'r3', title: '去公园玩', cost: 80, icon: '🎡' },
  { id: 'r4', title: '买一个小玩具', cost: 200, icon: '🧸' },
  { id: 'r5', title: '免做家务一次', cost: 40, icon: '🧹' },
]

export const MYSTERY_BOX_COST = 50
export const MYSTERY_BOX_REWARDS: {
  title: string
  icon: string
  weight: number
  bonusStars?: number
}[] = [
  { title: '免做家务券', icon: '🎟️', weight: 10 },
  { title: '决定今天晚餐吃什么', icon: '🍔', weight: 15 },
  { title: '爸爸学小狗叫', icon: '🐶', weight: 10 },
  { title: '再讲一个故事', icon: '📖', weight: 20 },
  { title: '举高高一次', icon: '🚀', weight: 20 },
  { title: '什么都没有...', icon: '💨', weight: 5 },
  { title: '幸运大奖：100星星', icon: '💎', weight: 5, bonusStars: 100 },
  { title: '看一场电影', icon: '🎬', weight: 5 },
  { title: '全家一起玩游戏', icon: '🎮', weight: 10 },
]

export const COMMON_EMOJIS = [
  // Toys & Fun
  '📺',
  '🎮',
  '🧸',
  '🧩',
  '🎨',
  '🪁',
  '🛹',
  '🚲',
  '🎁',
  '🎈',
  '🏰',
  '🎡',
  '🎠',
  '🎪',
  '🎟️',
  // Food & Drink
  '🍦',
  '🍬',
  '🍫',
  '🍪',
  '🍩',
  '🍰',
  '🍟',
  '🍔',
  '🍕',
  '🌭',
  '🍿',
  '🥤',
  '🍉',
  '🍓',
  '🍒',
  '🍎',
  // Activities & Tools
  '📚',
  '📖',
  '✏️',
  '🖌️',
  '⚽',
  '🏀',
  '🏊',
  '🏃',
  '🧹',
  '🛏️',
  '🛁',
  '🦷',
  '🎒',
  '⏰',
  '🔭',
  '🔬',
  // Animals
  '🐶',
  '🐱',
  '🐰',
  '🐼',
  '🐨',
  '🦁',
  '🐯',
  '🦄',
  '🦕',
  '🦖',
  '🐢',
  '🐬',
  '🐳',
  '🦋',
  '🐞',
  // Nature & Weather
  '🌞',
  '🌈',
  '⭐',
  '🌙',
  '☁️',
  '❄️',
  '🌸',
  '🌺',
  '🌻',
  '🌲',
  '🌊',
  '🔥',
  '💧',
  '🌍',
  // Objects
  '👑',
  '💎',
  '🏆',
  '🥇',
  '📱',
  '📸',
  '⌚',
  '👓',
  '🧢',
  '👗',
  '👕',
  '👟',
  '🧦',
  '🧤',
  // Emotions/People
  '😀',
  '😎',
  '🥳',
  '👻',
  '👽',
  '🤖',
  '🦸',
  '🧚',
  '🧜',
  '🧞',
  '🧙',
  '🕺',
  '💃',
]

export const CATEGORY_STYLES = {
  [TaskCategory.LIFE]: {
    bg: 'bg-lime-50',
    border: 'border-lime-200',
    text: 'text-lime-700',
    iconBg: 'bg-lime-400',
    accent: 'text-lime-500',
  },
  [TaskCategory.BEHAVIOR]: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-700',
    iconBg: 'bg-sky-400',
    accent: 'text-sky-500',
  },
  [TaskCategory.BONUS]: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-400',
    accent: 'text-amber-500',
  },
  [TaskCategory.PENALTY]: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    iconBg: 'bg-rose-400',
    accent: 'text-rose-500',
  },
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'FIRST_STEP',
    title: '第一步',
    description: '累计获得 10 颗星星',
    icon: '🌱',
    conditionType: 'lifetime_stars',
    threshold: 10,
  },
  {
    id: 'STREAK_3',
    title: '习惯养成',
    description: '连续打卡 3 天',
    icon: '🔥',
    conditionType: 'streak',
    threshold: 3,
  },
  {
    id: 'HEALTHY_KID',
    title: '生活小达人',
    description: '完成 20 次生活习惯任务',
    icon: '🌞',
    conditionType: 'category_count',
    threshold: 20,
    categoryFilter: TaskCategory.LIFE,
  },
  {
    id: 'SCHOLAR',
    title: '小小博士',
    description: '完成 20 次行为习惯任务',
    icon: '🎓',
    conditionType: 'category_count',
    threshold: 20,
    categoryFilter: TaskCategory.BEHAVIOR,
  },
  {
    id: 'HELPER_10',
    title: '家务小能手',
    description: '完成 10 次加分项任务',
    icon: '🧹',
    conditionType: 'category_count',
    threshold: 10,
  },
  {
    id: 'STREAK_7',
    title: '坚持不懈',
    description: '连续打卡 7 天',
    icon: '🚀',
    conditionType: 'streak',
    threshold: 7,
  },
  {
    id: 'SAVING_MASTER',
    title: '储蓄专家',
    description: '当前持有星星超过 200 颗',
    icon: '🐷',
    conditionType: 'balance_level',
    threshold: 200,
  },
  {
    id: 'SHOPAHOLIC',
    title: '购物狂',
    description: '在商城兑换 5 次奖励',
    icon: '🛍️',
    conditionType: 'redemption_count',
    threshold: 5,
  },
  {
    id: 'LUCKY_DOG',
    title: '幸运儿',
    description: '开启 5 次神秘盲盒',
    icon: '🎰',
    conditionType: 'mystery_box_count',
    threshold: 5,
  },
  {
    id: 'FASHIONISTA',
    title: '时尚达人',
    description: '拥有 5 件不同的装扮',
    icon: '🕶️',
    conditionType: 'avatar_count',
    threshold: 5,
  },
  {
    id: 'WISHLIST_1',
    title: '梦想成真',
    description: '达成 1 个心愿',
    icon: '🌠',
    conditionType: 'wishlist_complete',
    threshold: 1,
  },
  {
    id: 'RICH_KID',
    title: '小小富翁',
    description: '累计获得 1000 颗星星',
    icon: '💰',
    conditionType: 'lifetime_stars',
    threshold: 1000,
  },
]

// --- Avatar Items ---

export const AVATAR_ITEMS: AvatarItem[] = [
  // Heads
  {
    id: 'h_crown_gold',
    type: 'head',
    name: '黄金皇冠',
    cost: 150,
    icon: '👑',
    color: '#FFD700',
  },
  {
    id: 'h_cap_blue',
    type: 'head',
    name: '蓝色棒球帽',
    cost: 50,
    icon: '🧢',
    color: '#3B82F6',
  },
  {
    id: 'h_ears_bunny',
    type: 'head',
    name: '兔耳朵',
    cost: 80,
    icon: '🐰',
    color: '#F472B6',
  },
  {
    id: 'h_flower',
    type: 'head',
    name: '小红花',
    cost: 30,
    icon: '🌺',
    color: '#EF4444',
  },
  {
    id: 'h_wizard',
    type: 'head',
    name: '魔法帽',
    cost: 120,
    icon: '🧙',
    color: '#8B5CF6',
  },

  // Bodies (Shirts/Dresses)
  {
    id: 'b_shirt_red',
    type: 'body',
    name: '红色T恤',
    cost: 0,
    icon: '👕',
    color: '#EF4444',
  }, // Default
  {
    id: 'b_dress_pink',
    type: 'body',
    name: '粉色裙子',
    cost: 60,
    icon: '👗',
    color: '#F472B6',
  },
  {
    id: 'b_suit_super',
    type: 'body',
    name: '超人服',
    cost: 200,
    icon: '🦸',
    color: '#3B82F6',
  },
  {
    id: 'b_shirt_green',
    type: 'body',
    name: '绿色卫衣',
    cost: 40,
    icon: '👚',
    color: '#10B981',
  },
  {
    id: 'b_robe_wizard',
    type: 'body',
    name: '魔法长袍',
    cost: 150,
    icon: '👘',
    color: '#6D28D9',
  },

  // Back (Wings)
  {
    id: 'bk_wings_angel',
    type: 'back',
    name: '天使翅膀',
    cost: 300,
    icon: '👼',
    color: '#FFFFFF',
  },
  {
    id: 'bk_cape_red',
    type: 'back',
    name: '红色披风',
    cost: 100,
    icon: '🧣',
    color: '#EF4444',
  },
  {
    id: 'bk_wings_dragon',
    type: 'back',
    name: '龙翅膀',
    cost: 250,
    icon: '🦖',
    color: '#10B981',
  },
  {
    id: 'bk_backpack',
    type: 'back',
    name: '小书包',
    cost: 60,
    icon: '🎒',
    color: '#F59E0B',
  },

  // Hands
  {
    id: 'hd_wand_star',
    type: 'hand',
    name: '星星魔杖',
    cost: 180,
    icon: '🪄',
    color: '#FCD34D',
  },
  {
    id: 'hd_sword',
    type: 'hand',
    name: '勇者之剑',
    cost: 150,
    icon: '🗡️',
    color: '#9CA3AF',
  },
  {
    id: 'hd_balloon',
    type: 'hand',
    name: '气球',
    cost: 40,
    icon: '🎈',
    color: '#EF4444',
  },
  {
    id: 'hd_bear',
    type: 'hand',
    name: '小熊',
    cost: 90,
    icon: '🧸',
    color: '#D97706',
  },

  // Faces (Glasses etc)
  {
    id: 'f_glasses',
    type: 'face',
    name: '酷酷墨镜',
    cost: 70,
    icon: '🕶️',
    color: '#1F2937',
  },
  {
    id: 'f_mask',
    type: 'face',
    name: '神秘面具',
    cost: 80,
    icon: '🎭',
    color: '#4B5563',
  },
]
