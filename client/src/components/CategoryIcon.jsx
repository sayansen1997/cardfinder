import * as LucideIcons from 'lucide-react';

export default function CategoryIcon({ name, size = 20, color = '#94A3B8' }) {
  if (!name) return null;

  const Icon = LucideIcons[name];
  if (!Icon) {
    const Fallback = LucideIcons.Circle;
    return <Fallback size={size} color={color} />;
  }

  return <Icon size={size} color={color} />;
}
