
export type ThemeKey = 'lemon' | 'mint' | 'blueberry' | 'lavender';

export interface Theme {
  name: string;
  gradient: string;
  solid: string;
  light: string;
  border: string;
  shadow: string;
  accent: string;
  button: string;
  bg: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
  lemon: {
    name: '柠檬糖黄',
    gradient: 'from-yellow-400 to-orange-400',
    solid: 'bg-yellow-400',
    light: 'bg-yellow-50',
    border: 'border-yellow-200',
    shadow: 'shadow-yellow-200',
    accent: 'text-yellow-600',
    button: 'bg-yellow-400 hover:bg-yellow-500',
    bg: 'bg-yellow-50/30'
  },
  mint: {
    name: '薄荷奶油绿',
    gradient: 'from-emerald-400 to-teal-400',
    solid: 'bg-emerald-400',
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    shadow: 'shadow-emerald-200',
    accent: 'text-emerald-600',
    button: 'bg-emerald-400 hover:bg-emerald-500',
    bg: 'bg-emerald-50/30'
  },
  blueberry: {
    name: '蓝莓棉花糖',
    gradient: 'from-blue-400 to-indigo-400',
    solid: 'bg-blue-400',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    shadow: 'shadow-blue-200',
    accent: 'text-blue-600',
    button: 'bg-blue-400 hover:bg-blue-500',
    bg: 'bg-blue-50/30'
  },
  lavender: {
    name: '梦幻薰衣草',
    gradient: 'from-purple-400 to-pink-400',
    solid: 'bg-purple-400',
    light: 'bg-purple-50',
    border: 'border-purple-200',
    shadow: 'shadow-purple-200',
    accent: 'text-purple-600',
    button: 'bg-purple-400 hover:bg-purple-500',
    bg: 'bg-purple-50/30'
  }
};
