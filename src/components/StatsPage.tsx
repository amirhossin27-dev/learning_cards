import { useMemo } from 'react';
import { useToday } from '../hooks/useToday';
import { href } from '../lib/router';
import { addDays, dayKey, endOfDay, isNew, startOfDay } from '../lib/srs';
import { deckStats, useAppData } from '../lib/store';
import type { Card } from '../types';
import { BoxBar } from './BoxBar';
import { Heatmap } from './Heatmap';

const WEEKDAY = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });

/** Cards due on each of the next seven days (today includes everything overdue). */
function forecast(cards: Card[], now: number) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfDay(now), i);
    return { day, label: i === 0 ? 'Heute' : i === 1 ? 'Morgen' : WEEKDAY.format(day), count: 0 };
  });
  for (const c of cards) {
    if (isNew(c) || c.due === undefined) continue;
    const i = days.findIndex((d) => c.due! <= endOfDay(d.day));
    if (i >= 0) days[i].count++;
  }
  return days;
}

export function StatsPage() {
  const { decks, cards, history } = useAppData();
  const { now, reviews, goal, streak } = useToday();

  const week = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += history[dayKey(addDays(now, -i))]?.reviews ?? 0;
    return sum;
  }, [history, now]);
  const activeDays = useMemo(() => Object.values(history).filter((d) => d.reviews > 0).length, [history]);
  const all = deckStats(cards, now);
  const days = useMemo(() => forecast(cards, now), [cards, now]);
  const max = Math.max(1, ...days.map((d) => d.count));
  const hardest = useMemo(
    () =>
      cards
        .filter((c) => (c.lapses ?? 0) > 0)
        .sort((a, b) => (b.lapses ?? 0) - (a.lapses ?? 0) || (a.ease ?? 2.5) - (b.ease ?? 2.5))
        .slice(0, 8),
    [cards],
  );

  return (
    <div className="page stats">
      <header className="page-head">
        <div>
          <h1>Statistik</h1>
          <p className="muted">{activeDays > 0 ? `An ${activeDays} ${activeDays === 1 ? 'Tag' : 'Tagen'} gelernt` : 'Noch keine Lerntage'}</p>
        </div>
      </header>

      <div className="stat-tiles">
        <div className="stat-tile">
          <span>Lernserie</span>
          <strong>{streak}</strong>
          <small>{streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}</small>
        </div>
        <div className="stat-tile">
          <span>Heute</span>
          <strong>{reviews}</strong>
          <small>von {goal} Karten</small>
        </div>
        <div className="stat-tile">
          <span>Letzte 7 Tage</span>
          <strong>{week}</strong>
          <small>Antworten</small>
        </div>
        <div className="stat-tile">
          <span>Gemeistert</span>
          <strong>{all.mastered}</strong>
          <small>von {all.total} Karten</small>
        </div>
      </div>

      <div className="stats__grid">
        <section className="panel">
          <h2 className="panel__title">Lernkalender</h2>
          <Heatmap history={history} goal={goal} weeks={20} now={now} />
        </section>

        <section className="panel">
          <h2 className="panel__title">Fällig in den nächsten 7 Tagen</h2>
          <div className="forecast" role="list">
            {days.map((d) => (
              <div className="forecast__col" role="listitem" key={d.day} aria-label={`${d.label}: ${d.count} Karten`}>
                <span className="forecast__value">{d.count}</span>
                <div className="forecast__track">
                  <i style={{ height: `${(d.count / max) * 100}%` }} />
                </div>
                <span className="forecast__label">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="panel__note">Ohne neue Karten. Davon kommen täglich so viele dazu, wie du in den Einstellungen festlegst.</p>
        </section>

        <section className="panel panel--wide">
          <h2 className="panel__title">Lernstand pro Stapel</h2>
          <ul className="deck-progress">
            {decks.map((d) => {
              const s = deckStats(
                cards.filter((c) => c.deckId === d.id),
                now,
              );
              return (
                <li key={d.id} data-marker={d.color % 6}>
                  <a href={href({ name: 'deck', id: d.id })}>
                    <i className="marker-tab" aria-hidden="true" />
                    <strong>{d.name}</strong>
                    <span>
                      {s.mastered} von {s.total} gemeistert
                    </span>
                  </a>
                  <BoxBar boxes={s.boxes} size="md" />
                </li>
              );
            })}
          </ul>
          <BoxBar boxes={all.boxes} legend size="md" />
        </section>

        <section className="panel panel--wide">
          <h2 className="panel__title">Schwierigste Karten</h2>
          {hardest.length === 0 ? (
            <p className="panel__note">Noch keine. Hier landen Karten, die du schon einmal konntest und danach wieder vergessen hast.</p>
          ) : (
            <ul className="hard-list">
              {hardest.map((c) => (
                <li key={c.id}>
                  <a href={href({ name: 'deck', id: c.deckId })}>
                    <strong>{c.front}</strong>
                    <span>{c.back}</span>
                  </a>
                  <em>{c.lapses}× vergessen</em>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
