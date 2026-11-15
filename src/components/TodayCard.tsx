import { Flame } from 'lucide-react';

interface Props {
  /** Answers given today. */
  reviews: number;
  streak: number;
  className?: string;
}

/** How much was learned today and for how many days in a row. There is no number to reach. */
export function TodayCard({ reviews, streak, className = '' }: Props) {
  return (
    <div className={`goal ${className}`}>
      <b className="goal__count">{Math.min(reviews, 999)}</b>
      <div>
        <strong>{reviews === 0 ? 'Heute noch nichts gelernt' : reviews === 1 ? 'Karte heute gelernt' : 'Karten heute gelernt'}</strong>
        <span>
          <Flame size={14} />
          {streak === 0 ? 'Starte heute deine Lernserie' : streak === 1 ? '1 Tag in Folge gelernt' : `${streak} Tage in Folge gelernt`}
        </span>
      </div>
    </div>
  );
}
