import { Flame } from 'lucide-react';
import { ProgressRing } from './ProgressRing';

interface Props {
  reviews: number;
  goal: number;
  streak: number;
  className?: string;
}

export function GoalCard({ reviews, goal, streak, className = '' }: Props) {
  const reached = reviews >= goal;
  return (
    <div className={`goal ${reached ? 'is-reached' : ''} ${className}`}>
      <ProgressRing value={reviews / Math.max(1, goal)} size={52} stroke={6} label={String(Math.min(reviews, 999))} />
      <div>
        <strong>{reached ? 'Tagesziel erreicht' : `Tagesziel: ${reviews} von ${goal} Karten`}</strong>
        <span>
          <Flame size={14} />
          {streak === 0 ? 'Starte heute deine Lernserie' : streak === 1 ? '1 Tag in Folge gelernt' : `${streak} Tage in Folge gelernt`}
        </span>
      </div>
    </div>
  );
}
