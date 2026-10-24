import { Play, Plus, Sparkles, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToday } from '../hooks/useToday';
import { href } from '../lib/router';
import { addDays, endOfDay, isNew } from '../lib/srs';
import { deckStats, minutesFor, useAppData } from '../lib/store';
import type { Card } from '../types';
import { BoxBar } from './BoxBar';
import { DeckEditor } from './DeckEditor';
import { DeckTile } from './DeckTile';
import { GoalCard } from './GoalCard';
import { Heatmap } from './Heatmap';
import { ImportDialog } from './ImportDialog';

const DATE = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

function greeting(now: number) {
  const h = new Date(now).getHours();
  if (h < 5) return 'Noch wach?';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Hallo';
  if (h < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

export function HomePage() {
  const { decks, cards, history } = useAppData();
  const { now, plan, count, reviews, goal, streak } = useToday();
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);

  const byDeck = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of cards) map.set(c.deckId, [...(map.get(c.deckId) ?? []), c]);
    return map;
  }, [cards]);

  const todayByDeck = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of [...plan.due, ...plan.fresh]) map.set(c.deckId, (map.get(c.deckId) ?? 0) + 1);
    return map;
  }, [plan]);

  const tomorrow = useMemo(() => {
    const from = endOfDay(now);
    const to = endOfDay(addDays(now, 1));
    return cards.filter((c) => !isNew(c) && (c.due ?? 0) > from && (c.due ?? 0) <= to).length;
  }, [cards, now]);

  const all = deckStats(cards, now);
  const goalCard = <GoalCard reviews={reviews} goal={goal} streak={streak} />;

  return (
    <div className="page today">
      <div className="today__main">
        <section className="today__hero">
          <p className="eyebrow">
            {greeting(now)} · {DATE.format(now)}
          </p>
          {count > 0 ? (
            <>
              <h1>
                <mark>
                  {count} {count === 1 ? 'Karte' : 'Karten'}
                </mark>{' '}
                {count === 1 ? 'ist' : 'sind'} heute dran
              </h1>
              <p className="today__sub">
                {[plan.due.length > 0 && `${plan.due.length} zum Wiederholen`, plan.fresh.length > 0 && `${plan.fresh.length} neu`]
                  .filter(Boolean)
                  .join(', ')}
                {todayByDeck.size > 1 && ` aus ${todayByDeck.size} Stapeln`} · etwa {minutesFor(count)} Min.
              </p>
            </>
          ) : (
            <>
              <h1>
                Alles <mark>erledigt</mark> für heute
              </h1>
              <p className="today__sub">
                {reviews > 0 ? `Du hast heute ${reviews} ${reviews === 1 ? 'Karte' : 'Karten'} gelernt. ` : ''}
                {tomorrow > 0 ? `Morgen ${tomorrow === 1 ? 'ist 1 Karte' : `sind ${tomorrow} Karten`} fällig.` : 'Morgen ist nichts fällig.'}
              </p>
            </>
          )}
          <div className="only-narrow">{goalCard}</div>
          <div className="today__actions">
            {count > 0 ? (
              <a className="btn btn--primary btn--lg" href={href({ name: 'study' })}>
                <Play size={18} fill="currentColor" /> Lernen starten
              </a>
            ) : (
              <>
                {all.fresh > 0 && (
                  <a className="btn btn--primary btn--lg" href={href({ name: 'study', mode: 'new' })}>
                    <Plus size={18} /> Neue Karten lernen
                  </a>
                )}
                <a
                  className={`btn btn--lg ${all.fresh > 0 ? 'btn--secondary' : 'btn--primary'} ${cards.length === 0 ? 'is-disabled' : ''}`}
                  href={href({ name: 'study', mode: 'extra' })}
                >
                  <Sparkles size={18} /> Extra-Runde
                </a>
              </>
            )}
            <button className="btn btn--secondary btn--lg hide-mobile" onClick={() => setImporting(true)}>
              <Upload size={18} /> CSV importieren
            </button>
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>Deine Stapel</h2>
            <a className="section-head__link" href={href({ name: 'decks' })}>
              {decks.length} Stapel · {cards.length} Karten
            </a>
          </div>
          <div className="deck-grid deck-grid--today">
            {decks.map((d) => (
              <DeckTile key={d.id} deck={d} stats={deckStats(byDeck.get(d.id) ?? [], now)} today={todayByDeck.get(d.id) ?? 0} />
            ))}
            <button className="deck-tile deck-tile--new" onClick={() => setEditing(true)}>
              <Plus size={20} />
              <span>Neuer Stapel</span>
            </button>
          </div>
          <div className="deck-list--today">
            {decks.map((d) => (
              <DeckTile key={d.id} compact deck={d} stats={deckStats(byDeck.get(d.id) ?? [], now)} today={todayByDeck.get(d.id) ?? 0} />
            ))}
          </div>
        </section>
      </div>

      <aside className="today__rail">
        <section>
          <h3 className="rail-title">Tagesziel</h3>
          {goalCard}
        </section>
        <section>
          <h3 className="rail-title">
            Lernkalender <span>15 Wochen</span>
          </h3>
          <Heatmap history={history} goal={goal} weeks={15} now={now} />
        </section>
        <section>
          <h3 className="rail-title">
            Lernstand <span>{all.total} Karten</span>
          </h3>
          <BoxBar boxes={all.boxes} legend size="md" />
        </section>
      </aside>

      {editing && <DeckEditor onClose={() => setEditing(false)} />}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </div>
  );
}
