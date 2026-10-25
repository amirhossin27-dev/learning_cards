# Mitgelieferte Stapel

Jeder Stapel ist eine Datei in diesem Ordner und steht in `builtInDecks` in [`src/data/seed.ts`](../seed.ts).

Eine Karte hat `front` und `back`, dazu optional `example` (ein Beispielsatz in der Sprache der Vorderseite, wird vorgelesen), `note` (Eselsbrücke oder Hintergrund) und `tag` (Kategorie zum Filtern, am einfachsten mit `group`).

## Neue Karten in bestehenden Stapeln

Karten der ersten Version stehen ohne Datum. Alles, was später dazukommt, steht in `added('JJJJ-MM-TT', [...])`. Die App gibt diese Karten beim nächsten Start auch an Installationen weiter, die den Stapel schon haben: Der Lernstand bleibt, und Karten, die jemand gelöscht hat, kommen nicht wieder. Ohne `added` bekämen nur Neuinstallationen die Karten.

Vorderseiten werden nicht nachträglich geändert, denn die App erkennt Karten an ihrer Vorderseite. Eine geänderte Vorderseite käme bei bestehenden Installationen als zusätzliche Karte an.

## Wöchentliche Ergänzung

Jede Woche kommt ein Pull Request mit:

1. **Corporate Business English** (`business-english.ts`): 20 neue Karten. Vorderseite Englisch, Rückseite Deutsch, ein natürlicher englischer Beispielsatz, bei Bedarf eine Notiz (Eselsbrücke, typische Falle für Deutschsprachige).
2. **Programmieren Basics** (`programming.ts`): 20 neue Karten auf Deutsch, Einsteiger-Niveau, kurz und fachlich korrekt.
3. **Stapel der Woche**: ein neuer Stapel mit 25–30 Karten zu einem Thema aus der Liste unten. Eigene Datei, unten in `builtInDecks` anhängen, Icon aus `src/lib/deckIcons.tsx`, Farbe 0–5, Thema hier abhaken.

Prüfen vor dem Pull Request:

- Keine doppelten oder sinngleichen Vorderseiten im Stapel, bei Business English auch nicht gegenüber „Meine Vokabeln“.
- Fakten nachschlagen, wo es nicht eindeutig ist (Jahreszahlen, Rekorde, aktuelle Entwicklungen).
- Rechtschreibung, Tippfehler und einheitliche Schreibweise (deutsche Anführungszeichen „…“, Gedankenstrich –).
- `npm test` und `npm run build` laufen durch.
- Wenn es `scripts/audio/` gibt: Aufnahmen für die neuen englischen Texte erzeugen (siehe `scripts/audio/README.md`).

### Themen für den Stapel der Woche

- [x] Denkfehler & Psychologie (2026-10-25)
- [ ] Redewendungen und ihre Herkunft
- [ ] Weltraum & Astronomie
- [ ] Geld & Finanzen (Zinseszins, ETF, Inflation)
- [ ] Krypto & Blockchain
- [ ] Künstliche Intelligenz: Grundbegriffe
- [ ] IT-Sicherheit im Alltag
- [ ] Erfindungen und ihre Erfinder
- [ ] Philosophen und ihre Ideen
- [ ] Der menschliche Körper
- [ ] Tierwelt: erstaunliche Fakten
- [ ] Deutsche Rechtschreibung: typische Fallen
- [ ] Rhetorik & Stilmittel
- [ ] Wirtschaftsbegriffe
- [ ] Erste Hilfe
- [ ] Chemie: die wichtigsten Elemente
- [ ] Berühmte Gemälde und Künstler
- [ ] Komponisten & Musikgeschichte
- [ ] Weltreligionen
- [ ] Nobelpreise & große Entdeckungen
- [ ] Netzwerktechnik (OSI-Modell, Protokolle)
- [ ] Verhandeln & Gesprächsführung
- [ ] Kopfrechentricks
- [ ] Wetter & Klima
- [ ] Fremdwörter, die man kennen sollte

### Themen für Business English

Telefonate, Bewerbung & HR, Verträge, Kundenservice & Beschwerden, Marketing & Vertrieb, Zahlen und Berichte, Phrasal Verbs, Idioms, Geschäftsreise, Feedback geben, Remote Work, IT-Projekte, weitere Grammatik-Eselsbrücken, weitere False Friends.

### Themen für Programmieren Basics

Python-Grundlagen, JavaScript-Grundlagen, Linux-Befehle, Git im Alltag, Datenstrukturen (Stack, Queue, Hash-Map, Baum), Sortieren und Suchen, Testen, Clean Code und SOLID, Cloud & DevOps, Netzwerke, Datenformate (YAML, CSV, XML), reguläre Ausdrücke, Web-Sicherheit (OWASP), Anmeldung & Tokens (OAuth, JWT).
