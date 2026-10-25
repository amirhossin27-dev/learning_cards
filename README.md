# Karteikarten 🎓

Eine moderne Lernkarten-App für iPhone und Desktop: Karte antippen, sie dreht sich um, Antwort ansehen, bewerten. Mit Aussprache, Lernfortschritt und CSV-Import/-Export.

## Funktionen

- **Umdreh-Karten** mit 3D-Animation. Auf dem iPhone nach rechts wischen = gewusst, nach links = nochmal.
- **Aussprache**: Lautsprecher-Button liest Wörter und Beispielsätze vor. Die englischen Texte der mitgelieferten Stapel sind als Aufnahmen dabei, die auch im Stummmodus des iPhones zu hören sind. Alles andere spricht die Web Speech API (auf dem iPhone die Siri-Stimmen, im Stummmodus still). US- oder UK-Akzent und Tempo einstellbar.
- **Lernmodus** mit Leitner-System: Karten, die du nicht wusstest, kommen in derselben Runde wieder und später öfter dran. Lernrichtung wählbar (Vorderseite, Rückseite, gemischt).
- **Stapel und Karten** anlegen, bearbeiten, durchsuchen und nach Kategorie filtern. Jede Karte kann einen Beispielsatz und eine Eselsbrücke haben.
- **CSV-Import/-Export**: Komma oder Semikolon, mit oder ohne Kopfzeile. Einträge, die in beide Richtungen doppelt vorkommen, werden zu einer Karte zusammengefasst.
- **Mitgelieferte Stapel**: *Corporate Business English* und *Programmieren Basics* (je 20 neue Karten pro Woche), *Meine Vokabeln*, alle Hauptstädte der Welt, *Geschichte kompakt* und jede Woche ein neuer Stapel. Neue Karten kommen auch in schon installierten Stapeln an, der Lernstand bleibt ([src/data/decks/README.md](src/data/decks/README.md)).
- Hell- und Dunkelmodus, installierbar auf dem Home-Bildschirm.

Alle Daten bleiben lokal im Browser (localStorage).

## CSV-Format

```csv
front,back,example,note,tag
to follow up,nachfassen,I'm just following up on my email.,,E-Mail
```

Nur die ersten beiden Spalten sind Pflicht. Erkannte Kopfzeilen-Namen sind u. a. `front/frage/question`, `back/antwort/answer`, `example/beispiel`, `note/notiz/eselsbrücke`, `tag/kategorie/thema`.

## Entwicklung

```bash
npm install
npm run dev     # lokaler Server
npm test        # Tests
npm run build   # Produktions-Build nach dist/
```

App-Icons neu erzeugen (braucht Playwright): `node scripts/render-icons.mjs`

Aufnahmen nach Änderungen an den mitgelieferten Stapeln ergänzen: siehe [scripts/audio/README.md](scripts/audio/README.md).

## Veröffentlichung

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Pages (`.github/workflows/deploy.yml`). Einmalig nötig: **Settings → Pages → Source: GitHub Actions**.
