export const ICON_OPTIONS = [
  { key: 'code', name: 'code', library: 'MaterialIcons', label: 'Coding' },
  { key: 'fitness', name: 'fitness-center', library: 'MaterialIcons', label: 'Workout' },
  { key: 'book', name: 'menu-book', library: 'MaterialIcons', label: 'Reading' },
  { key: 'work', name: 'work', library: 'MaterialIcons', label: 'Work' },
  { key: 'school', name: 'school', library: 'MaterialIcons', label: 'Study' },
  { key: 'water', name: 'water-drop', library: 'MaterialIcons', label: 'Hydration' },
  { key: 'bolt', name: 'bolt', library: 'MaterialIcons', label: 'Energy' },
  { key: 'brush', name: 'brush', library: 'MaterialIcons', label: 'Creative' },
  { key: 'music', name: 'music-note', library: 'MaterialIcons', label: 'Music' },
  { key: 'savings', name: 'savings', library: 'MaterialIcons', label: 'Savings' },
  { key: 'star', name: 'star', library: 'MaterialIcons', label: 'Priority' },
];

export const COLOR_OPTIONS = [
  '#0ECB81', // Binance Green
  '#F0B90B', // Binance Yellow
  '#3861FB', // Blue
  '#F6465D', // Red / Coral
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export function getIconMeta(key) {
  const found = ICON_OPTIONS.find((item) => item.key === key);
  return found || { key: 'code', name: 'code', library: 'MaterialIcons', label: 'Custom' };
}
