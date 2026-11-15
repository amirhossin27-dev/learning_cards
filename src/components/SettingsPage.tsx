import { Download, Monitor, Moon, RefreshCcw, Sun, Volume2 } from 'lucide-react';
import { exportCsv } from '../lib/csv';
import { downloadText } from '../lib/download';
import { playTone, SOUND_LEVELS } from '../lib/sounds';
import { isAppleTouch, SAMPLE_SENTENCE, useSpeech } from '../lib/speech';
import { actions, useAppData } from '../lib/store';
import type { Settings } from '../types';
import { toast } from './Toast';

const THEMES: { value: Settings['theme']; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Automatisch', icon: Monitor },
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'dark', label: 'Dunkel', icon: Moon },
];


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
        <label className="setting setting--toggle">
          <div className="setting__label">
            <strong>Vorderseite automatisch vorlesen</strong>
            <span>Liest die Frage jeder Karte vor, sobald sie erscheint, bei allen Methoden außer dem Lückentext (da wäre es die Lösung)</span>
          </div>
          <input type="checkbox" className="switch" checked={settings.autoSpeak} onChange={(e) => set({ autoSpeak: e.target.checked })} />
        </label>
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
        <p className="form__hint">
          Tipp fürs iPhone: Unter Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen kannst du „Erweiterte“ Stimmen laden. Die
          klingen deutlich natürlicher. Die englischen Wörter und Sätze der mitgelieferten Stapel sind als Aufnahmen dabei und klingen auch im Stummmodus. Alles andere liest die Siri-Stimme, und die bleibt im Stummmodus still.
        </p>
      </section>

      <section className="settings-group">
        <h2>Töne</h2>
        <div className="setting">
          <div className="setting__label">
            <strong>Ton bei richtig und falsch</strong>
            <span>Ein kurzes Glöckchen nach jeder Antwort</span>
          </div>
          <div className="setting__control">
            <div className="segmented" role="group" aria-label="Ton bei richtig und falsch">
              {SOUND_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  className={(settings.sounds ?? 'normal') === value ? 'is-active' : ''}
                  onClick={() => {
                    set({ sounds: value });
                    playTone('right', value);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => playTone('wrong', settings.sounds)} disabled={settings.sounds === 'off'}>
              <Volume2 size={16} /> Falsch
            </button>
          </div>
        </div>
        {isAppleTouch && <p className="form__hint">Am iPhone bleiben die Töne still, solange der Stummschalter an ist.</p>}
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
