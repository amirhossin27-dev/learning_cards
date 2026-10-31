import {
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Code,
  FlaskConical,
  Globe,
  Inbox,
  Landmark,
  Languages,
  Layers,
  Leaf,
  Lightbulb,
  MessagesSquare,
  Music,
  NotebookPen,
  Palette,
  Plane,
  Rocket,
  Scale,
  Stethoscope,
  Target,
  type LucideIcon,
} from 'lucide-react';

/** Line icons for decks, replacing the emoji symbols of version 1. */
export const DECK_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  layers: { icon: Layers, label: 'Stapel' },
  book: { icon: BookOpen, label: 'Buch' },
  briefcase: { icon: Briefcase, label: 'Beruf' },
  languages: { icon: Languages, label: 'Sprachen' },
  chat: { icon: MessagesSquare, label: 'Gespräch' },
  notebook: { icon: NotebookPen, label: 'Notizbuch' },
  globe: { icon: Globe, label: 'Welt' },
  plane: { icon: Plane, label: 'Reisen' },
  rocket: { icon: Rocket, label: 'Weltraum' },
  code: { icon: Code, label: 'Programmieren' },
  calculator: { icon: Calculator, label: 'Mathe' },
  flask: { icon: FlaskConical, label: 'Naturwissenschaft' },
  leaf: { icon: Leaf, label: 'Biologie' },
  stethoscope: { icon: Stethoscope, label: 'Medizin' },
  landmark: { icon: Landmark, label: 'Geschichte' },
  scale: { icon: Scale, label: 'Recht' },
  brain: { icon: Brain, label: 'Wissen' },
  lightbulb: { icon: Lightbulb, label: 'Idee' },
  target: { icon: Target, label: 'Ziel' },
  palette: { icon: Palette, label: 'Kunst' },
  music: { icon: Music, label: 'Musik' },
  inbox: { icon: Inbox, label: 'Import' },
};

export const ICON_KEYS = Object.keys(DECK_ICONS);

const FROM_EMOJI: Record<string, string> = {
  '📚': 'book',
  '💼': 'briefcase',
  '🌍': 'globe',
  '💻': 'code',
  '🏛️': 'landmark',
  '🧪': 'flask',
  '🧠': 'brain',
  '🎯': 'target',
  '🗣️': 'chat',
  '📒': 'notebook',
  '⚖️': 'scale',
  '💡': 'lightbulb',
  '🚀': 'plane',
  '🎨': 'palette',
  '🩺': 'stethoscope',
  '🎵': 'music',
  '📥': 'inbox',
};

export function iconFromEmoji(emoji: string | undefined): string {
  return (emoji && FROM_EMOJI[emoji]) || 'layers';
}

export function DeckIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = (DECK_ICONS[name] ?? DECK_ICONS.layers).icon;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}

/** Marker colours for decks; the index is stored on the deck. */
export const MARKER_NAMES = ['Gelb', 'Blau', 'Grün', 'Orange', 'Pink', 'Flieder'];
