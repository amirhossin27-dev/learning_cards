import { Download, Monitor, Moon, RefreshCcw, Sun, Volume2 } from 'lucide-react';
import { exportCsv } from '../lib/csv';
import { downloadText } from '../lib/download';
import { isAppleTouch, SAMPLE_SENTENCE, useSpeech } from '../lib/speech';
import { actions, useAppData } from '../lib/store';
import type { Settings } from '../types';
import { toast } from './Toast';

const THEMES: { value: Settings['theme']; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Automatisch', icon: Monitor },
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'dark', label: 'Dunkel', icon: Moon },
];

const SESSION_SIZES = [10, 20, 50, 0];
const DAILY_GOALS = [10, 20, 30, 50];
const NEW_PER_DAY = [5, 10, 20, 50];

export function SettingsPage() {
  const { settings, decks, cards } = useAppData();
  const { speak, supported, voices } = useSpeech(settings.speechRate);
  const englishVoices = voices.filter((v) => v.lang.replace('_', '-').startsWith(settings.englishAccent)).length;
  const set = (patch: Partial<Settings>) => actions.updateSettings(patch);

  const exportAll = () => {
    const rows = cards.map((c) => ({ ...c, tag: [decks.find((d) => d.id === c.deckId)?.name, c.tag].filter(Boolean).join(' · ') }));
    downloadText('alle-karteikarten.csv', exportCsv(rows));
    toast(`${rows.length} Karten exportiert`);
  };

  return (
    <div className="page page--narrow">
      <h1 className="page-title">Einstellungen</h1>

      <section className="settings-group">
        <h2>Darstellung</h2>
        <div className="setting">
          <div className="setting__label">
            <strong>Farbschema</strong>
          </div>
          <div className="segmented" role="group" aria-label="Farbschema">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button key={value} className={settings.theme === value ? 'is-active' : ''} onClick={() => set({ theme: value })}>
                <Icon size={16} /> <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-group">
        <h2>Aussprache</h2>
        {!supported && <p className="form__error">Dein Browser unterstützt keine Sprachausgabe.</p>}
        <div className="setting">
          <div className="setting__label">
            <strong>Englischer Akzent</strong>
            <span>
              {isAppleTouch
                ? 'Mit der Stimme aus den iPhone-Einstellungen'
                : englishVoices > 0
                  ? `${englishVoices} passende Stimmen auf diesem Gerät`
                  : 'Stimmen werden geladen …'}
            </span>
          </div>
          <div className="segmented" role="group" aria-label="Akzent">
            <button className={settings.englishAccent === 'en-US' ? 'is-active' : ''} onClick={() => set({ englishAccent: 'en-US' })}>
              <span>Amerikanisch</span>
            </button>
            <button className={settings.englishAccent === 'en-GB' ? 'is-active' : ''} onClick={() => set({ englishAccent: 'en-GB' })}>
              <span>Britisch</span>
            </button>
          </div>
        </div>
        <div className="setting">
          <div className="setting__label">
            <strong>Sprechtempo</strong>
            <span>{settings.speechRate.toFixed(2).replace('.', ',')}×</span>
          </div>
          <div className="setting__control">
            <input
              type="range"
              min={0.5}
              max={1.3}
              step={0.05}
              value={settings.speechRate}
              onChange={(e) => set({ speechRate: Number(e.target.value) })}
              aria-label="Sprechtempo"
            />
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => speak(SAMPLE_SENTENCE, settings.englishAccent)}
              disabled={!supported}
            >
              <Volume2 size={16} /> Test
            </button>
          </div>
        </div>
        <label className="setting setting--toggle">
          <div className="setting__label">
            <strong>Automatisch vorlesen</strong>
            <span>Liest jede neue Karte beim Lernen sofort vor</span>
          </div>
          <input type="checkbox" className="switch" checked={settings.autoSpeak} onChange={(e) => set({ autoSpeak: e.target.checked })} />
        </label>
        <p className="form__hint">
          Tipp fürs iPhone: Unter Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen kannst du „Erweiterte“ Stimmen laden. Die
          klingen deutlich natürlicher. Die englischen Wörter und Sätze der mitgelieferten Stapel sind als Aufnahmen dabei und klingen auch im Stummmodus. Alles andere liest die Siri-Stimme, und die bleibt im Stummmodus still.
        </p>
      </section>

      <section className="settings-group">
        <h2>Lernen</h2>
        <div className="setting">
          <div className="setting__label">
            <strong>Tagesziel</strong>
            <span>Antworten pro Tag, die als geschafft zählen</span>
          </div>
          <div className="segmented" role="group" aria-label="Tagesziel">
            {DAILY_GOALS.map((n) => (
              <button key={n} className={settings.dailyGoal === n ? 'is-active' : ''} onClick={() => set({ dailyGoal: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <div className="setting__label">
            <strong>Neue Karten pro Tag</strong>
            <span>So viele noch nie gelernte Karten kommen täglich dazu</span>
          </div>
          <div className="segmented" role="group" aria-label="Neue Karten pro Tag">
            {NEW_PER_DAY.map((n) => (
              <button key={n} className={settings.newPerDay === n ? 'is-active' : ''} onClick={() => set({ newPerDay: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <div className="setting__label">
            <strong>Karten pro Runde</strong>
          </div>
          <div className="segmented" role="group" aria-label="Karten pro Runde">
            {SESSION_SIZES.map((n) => (
              <button key={n} className={settings.sessionSize === n ? 'is-active' : ''} onClick={() => set({ sessionSize: n })}>
                {n === 0 ? 'Alle' : n}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-group">
        <h2>Daten</h2>
        <p className="form__hint">
          Deine Karten und dein Lernfortschritt werden nur auf diesem Gerät im Browser gespeichert. Einmal geöffnet, funktioniert die App auch ohne
          Internet, am besten über „Zum Home-Bildschirm“ in Safari.
        </p>
        <div className="settings-actions">
          <button className="btn btn--ghost" onClick={exportAll} disabled={cards.length === 0}>
            <Download size={16} /> Alle Karten als CSV
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              actions.restoreBuiltIns();
              toast('Beispielstapel wiederhergestellt');
            }}
          >
            <RefreshCcw size={16} /> Beispielstapel wiederherstellen
          </button>
        </div>
      </section>
    </div>
  );
}
