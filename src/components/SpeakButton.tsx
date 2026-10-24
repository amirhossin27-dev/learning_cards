import { Volume2 } from 'lucide-react';

interface Props {
  onSpeak: () => void;
  active: boolean;
  label?: string;
  small?: boolean;
}

export function SpeakButton({ onSpeak, active, label = 'Vorlesen', small }: Props) {
  return (
    <button
      type="button"
      className={`speak-btn ${active ? 'is-active' : ''} ${small ? 'speak-btn--small' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSpeak();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      title={label}
    >
      <Volume2 size={small ? 16 : 20} />
      <span className="speak-btn__waves" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
