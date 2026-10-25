import { CircleCheck, Info } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type ToastKind = 'done' | 'info';

interface ToastItem {
  id: number;
  text: string;
  kind: ToastKind;
}

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, kind: ToastKind = 'done') {
  const id = nextId++;
  toasts = [...toasts, { id, text, kind }];
  emit();
  // Hints need a little longer to read than confirmations.
  setTimeout(
    () => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    },
    kind === 'info' ? 5000 : 3200,
  );
}

export function Toaster() {
  const items = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
  );
  return (
    <div className="toaster" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.kind === 'info' ? <Info size={18} /> : <CircleCheck size={18} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
