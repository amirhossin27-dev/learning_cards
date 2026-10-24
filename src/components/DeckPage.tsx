import { ArrowLeft, Download, Ellipsis, Pencil, Play, Plus, RotateCcw, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { exportCsv } from '../lib/csv';
import { downloadText, slugify } from '../lib/download';
import { href, navigate } from '../lib/router';
import { resolveLang, useSpeech } from '../lib/speech';
import { useNow } from '../hooks/useToday';
import { DeckIcon } from '../lib/deckIcons';
import { BOX_COUNT, BOX_LABELS, DAY, endOfDay, isDue, isNew } from '../lib/srs';
import { actions, deckStats, newCardsLeft, planToday, useAppData } from '../lib/store';
import type { Card } from '../types';
import { BoxBar } from './BoxBar';
import { CardEditor } from './CardEditor';
import { DeckEditor } from './DeckEditor';
import { ImportDialog } from './ImportDialog';
import { Modal } from './Modal';
import { SpeakButton } from './SpeakButton';
import { toast } from './Toast';

type Dialog =
  | { kind: 'card'; card?: Card }
  | { kind: 'deck' }
  | { kind: 'import' }
  | { kind: 'confirm'; title: string; text: string; action: () => void; danger?: boolean }
  | null;

function BoxDots({ box }: { box: number }) {
  return (
    <span className="box-dots" title={BOX_LABELS[box]} aria-label={BOX_LABELS[box]}>
      {Array.from({ length: BOX_COUNT }, (_, i) => (
        <i key={i} className={i <= box ? 'is-on' : ''} />
      ))}
    </span>
  );
}

function dueLabel(card: Card, now: number): string {
  if (isNew(card)) return 'neu';
  if (isDue(card, now)) return 'fällig';
  const days = Math.ceil(((card.due ?? 0) - endOfDay(now)) / DAY);
  return days <= 1 ? 'morgen' : `in ${days} Tagen`;
}

export function DeckPage({ deckId }: { deckId: string }) {
  const data = useAppData();
  const { decks, cards, settings } = data;
  const now = useNow();
  const deck = decks.find((d) => d.id === deckId);
  const deckCards = useMemo(() => cards.filter((c) => c.deckId === deckId), [cards, deckId]);
  const tags = useMemo(() => [...new Set(deckCards.map((c) => c.tag).filter(Boolean) as string[])], [deckCards]);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const { speak, speakingKey, supported } = useSpeech(settings.speechRate);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deckCards.filter(
      (c) =>
        (!tag || c.tag === tag) &&
        (!q || c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q) || c.example?.toLowerCase().includes(q)),
    );
  }, [deckCards, query, tag]);

  if (!deck) {
    return (
      <div className="empty">
        <p>Diesen Stapel gibt es nicht.</p>
        <a className="btn btn--primary" href={href({ name: 'home' })}>
          Zur Übersicht
        </a>
      </div>
    );
  }

  const stats = deckStats(deckCards, now);
  const tagCards = tag ? deckCards.filter((c) => c.tag === tag) : deckCards;
  const tagPlan = planToday(tagCards, newCardsLeft(data, now), [], now);
  const todayCount = tagPlan.due.length + tagPlan.fresh.length;
  const tagNew = tagCards.filter(isNew).length;
  const scope = { name: 'study', id: deck.id, tag: tag ?? undefined } as const;

  const exportDeck = () => {
    setMenuOpen(false);
    downloadText(`${slugify(deck.name)}.csv`, exportCsv(deckCards));
    toast(`${deckCards.length} Karten exportiert`);
  };

  const menuItem = (icon: typeof Pencil, label: string, onClick: () => void, danger = false) => {
    const Icon = icon;
    return (
      <button
        className={`menu__item ${danger ? 'menu__item--danger' : ''}`}
        onClick={() => {
          setMenuOpen(false);
          onClick();
        }}
      >
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div className="page">
      <a className="back-link" href={href({ name: 'decks' })}>
        <ArrowLeft size={18} /> Alle Stapel
      </a>

      <section className="deck-hero" data-marker={deck.color % 6}>
        <i className="tab" aria-hidden="true" />
        <div className="deck-hero__main">
          <span className="deck-hero__icon">
            <DeckIcon name={deck.icon} size={22} />
          </span>
          <div>
            <h1>{deck.name}</h1>
            {deck.description && <p>{deck.description}</p>}
          </div>
        </div>
        <dl className="deck-hero__stats">
          <div>
            <dt>Heute dran</dt>
            <dd>{todayCount}</dd>
          </div>
          <div>
            <dt>Neu</dt>
            <dd>{stats.fresh}</dd>
          </div>
          <div>
            <dt>Gemeistert</dt>
            <dd>{stats.mastered}</dd>
          </div>
        </dl>
        <BoxBar boxes={stats.boxes} legend size="md" />
        <div className="deck-hero__actions">
          {todayCount > 0 || tagCards.length === 0 ? (
            <a
              className={`btn btn--primary btn--lg ${tagCards.length === 0 ? 'is-disabled' : ''}`}
              href={href(scope)}
              aria-disabled={tagCards.length === 0}
            >
              <Play size={18} fill="currentColor" /> {tag ? `${tag} lernen` : 'Lernen starten'}
            </a>
          ) : (
            <>
              {/* Today's new-card budget is used up elsewhere, but this deck still has unseen cards. */}
              {tagNew > 0 && (
                <a className="btn btn--primary btn--lg" href={href({ ...scope, mode: 'new' })}>
                  <Plus size={18} /> Neue Karten lernen
                </a>
              )}
              <a className={`btn btn--lg ${tagNew > 0 ? 'btn--secondary' : 'btn--primary'}`} href={href({ ...scope, mode: 'extra' })}>
                <Sparkles size={18} /> Extra-Runde
              </a>
            </>
          )}
          <div className="menu" ref={menu}>
            <button className="btn btn--secondary btn--icon btn--lg" onClick={() => setMenuOpen((o) => !o)} aria-label="Weitere Aktionen" aria-expanded={menuOpen}>
              <Ellipsis size={20} />
            </button>
            {menuOpen && (
              <div className="menu__panel" role="menu">
                {menuItem(Pencil, 'Stapel bearbeiten', () => setDialog({ kind: 'deck' }))}
                {menuItem(Upload, 'CSV importieren', () => setDialog({ kind: 'import' }))}
                <button className="menu__item" onClick={exportDeck} disabled={deckCards.length === 0}>
                  <Download size={16} /> CSV exportieren
                </button>
                {menuItem(RotateCcw, 'Fortschritt zurücksetzen', () =>
                  setDialog({
                    kind: 'confirm',
                    title: 'Fortschritt zurücksetzen?',
                    text: `Alle ${deckCards.length} Karten in „${deck.name}“ gelten danach wieder als neu.`,
                    action: () => {
                      actions.resetProgress(deck.id);
                      toast('Fortschritt zurückgesetzt');
                    },
                  }),
                )}
                {menuItem(
                  Trash2,
                  'Stapel löschen',
                  () =>
                    setDialog({
                      kind: 'confirm',
                      title: 'Stapel löschen?',
                      text: `„${deck.name}“ und alle ${deckCards.length} Karten werden gelöscht. Tipp: Exportiere ihn vorher als CSV.`,
                      danger: true,
                      action: () => {
                        actions.deleteDeck(deck.id);
                        toast('Stapel gelöscht');
                        navigate({ name: 'decks' });
                      },
                    }),
                  true,
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>
            Karten <span className="muted">{deckCards.length}</span>
          </h2>
          <button className="btn btn--primary btn--sm hide-mobile" onClick={() => setDialog({ kind: 'card' })}>
            <Plus size={16} /> Karte hinzufügen
          </button>
        </div>

        <div className="toolbar">
          <label className="search">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Karten durchsuchen" type="search" />
          </label>
          {tags.length > 0 && (
            <div className="chips" role="group" aria-label="Nach Kategorie filtern">
              <button className={`chip ${tag === null ? 'is-active' : ''}`} onClick={() => setTag(null)}>
                Alle
              </button>
              {tags.map((t) => (
                <button key={t} className={`chip ${tag === t ? 'is-active' : ''}`} onClick={() => setTag(tag === t ? null : t)}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="empty empty--inline">
            <p>{deckCards.length === 0 ? 'Noch keine Karten. Leg die erste an oder importiere eine CSV-Datei.' : 'Keine Karten gefunden.'}</p>
            {deckCards.length === 0 && (
              <div className="empty__actions">
                <button className="btn btn--primary" onClick={() => setDialog({ kind: 'card' })}>
                  <Plus size={16} /> Karte anlegen
                </button>
                <button className="btn btn--ghost" onClick={() => setDialog({ kind: 'import' })}>
                  <Upload size={16} /> CSV importieren
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="card-list">
            {visible.map((c) => (
              <li key={c.id} className="card-row" onClick={() => setDialog({ kind: 'card', card: c })}>
                <div className="card-row__text">
                  <strong>{c.front}</strong>
                  <span>{c.back}</span>
                </div>
                <div className="card-row__meta">
                  {c.tag && !tag && <span className="chip chip--sm hide-mobile">{c.tag}</span>}
                  <span className={`card-row__due ${isDue(c, now) ? 'is-due' : ''}`}>{dueLabel(c, now)}</span>
                  <BoxDots box={c.box} />
                  {supported && (
                    <SpeakButton
                      small
                      active={speakingKey === c.id}
                      onSpeak={() => speak(c.front, resolveLang(deck.frontLang, settings), c.id)}
                    />
                  )}
                  <button
                    className="icon-btn icon-btn--sm hide-mobile"
                    aria-label="Karte löschen"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.deleteCard(c.id);
                      toast('Karte gelöscht');
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button className="fab only-mobile" onClick={() => setDialog({ kind: 'card' })} aria-label="Karte hinzufügen">
        <Plus size={26} />
      </button>

      {dialog?.kind === 'card' && <CardEditor deckId={deck.id} card={dialog.card} tags={tags} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'deck' && <DeckEditor deck={deck} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'import' && <ImportDialog deckId={deck.id} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'confirm' && (
        <Modal
          title={dialog.title}
          onClose={() => setDialog(null)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setDialog(null)}>
                Abbrechen
              </button>
              <button
                className={`btn ${dialog.danger ? 'btn--danger' : 'btn--primary'}`}
                onClick={() => {
                  dialog.action();
                  setDialog(null);
                }}
              >
                Bestätigen
              </button>
            </>
          }
        >
          <p>{dialog.text}</p>
        </Modal>
      )}
    </div>
  );
}
