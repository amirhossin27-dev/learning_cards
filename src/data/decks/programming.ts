import type { SeedDeck } from '../seed';
import { added, group } from './util';

const BASICS = 'Grundlagen';
const CONCEPTS = 'Konzepte';
const DATA = 'Daten';
const WEB = 'Web & Netzwerk';
const TOOLS = 'Werkzeuge & Abläufe';
const SECURITY = 'Sicherheit';
const SHELL = 'Kommandozeile';
const STRUCTURES = 'Datenstrukturen';
const PYTHON = 'Python';

// The first release.
const classics = [
  { front: 'Was ist eine API?', back: 'Eine Schnittstelle, über die Programme miteinander kommunizieren.', note: 'Application Programming Interface', tag: WEB },
  { front: 'Was macht Git?', back: 'Versionsverwaltung: speichert den Verlauf aller Änderungen am Code.', tag: TOOLS },
  { front: 'Unterschied: Frontend vs. Backend', back: 'Frontend = was der Nutzer sieht (UI). Backend = Server, Datenbank, Logik dahinter.', tag: WEB },
  { front: 'Was ist ein Bug?', back: 'Ein Fehler im Programm, der zu falschem Verhalten führt.', note: '1947 fand man eine echte Motte in einem Computer.', tag: BASICS },
  { front: 'Was bedeutet HTTP-Status 404?', back: 'Not Found – die angeforderte Seite existiert nicht.', tag: WEB },
  { front: 'Was ist JSON?', back: 'Ein Textformat für strukturierte Daten: { "name": "Amir" }', note: 'JavaScript Object Notation', tag: DATA },
  { front: 'Was ist eine Variable?', back: 'Ein benannter Speicherplatz für einen Wert.', tag: BASICS },
  { front: 'Was ist eine Schleife (Loop)?', back: 'Code, der wiederholt ausgeführt wird, solange eine Bedingung gilt.', note: 'for = feste Anzahl Durchläufe, while = solange eine Bedingung gilt.', tag: BASICS },
  { front: 'Was ist SQL?', back: 'Eine Sprache, um Daten in relationalen Datenbanken abzufragen und zu ändern.', note: 'Structured Query Language', tag: DATA },
  { front: 'Was ist Refactoring?', back: 'Code verbessern, ohne sein Verhalten zu ändern.', tag: CONCEPTS },
  { front: 'Was ist CI/CD?', back: 'Continuous Integration / Delivery: Code wird automatisch getestet und ausgeliefert.', tag: TOOLS },
  { front: 'Was ist ein Pull Request?', back: 'Ein Vorschlag, Änderungen in den Hauptzweig zu übernehmen – mit Review.', tag: TOOLS },
];

const basics = group(BASICS, [
  { front: 'Was ist eine Funktion?', back: 'Ein benannter, wiederverwendbarer Codeblock, der Eingaben (Parameter) annimmt und oft ein Ergebnis zurückgibt.' },
  { front: 'Was ist eine Bedingung (if/else)?', back: 'Code, der nur ausgeführt wird, wenn eine Bedingung wahr ist – sonst läuft der else-Zweig.' },
  { front: 'Was ist ein Datentyp?', back: 'Die Art eines Werts, z. B. Zahl (Integer, Float), Text (String) oder Wahrheitswert (Boolean).' },
  { front: 'Was ist ein Boolean?', back: 'Ein Wahrheitswert: true oder false.', note: 'Benannt nach dem Mathematiker George Boole.' },
  { front: 'Was ist ein String?', back: 'Eine Zeichenkette, also Text wie "Hallo Welt".' },
  { front: 'Was ist ein Array (Liste)?', back: 'Eine geordnete Sammlung von Werten, auf die man über einen Index zugreift.', note: 'In den meisten Sprachen beginnt der Index bei 0.' },
  { front: 'Compiler vs. Interpreter', back: 'Ein Compiler übersetzt den ganzen Code vorab in Maschinencode (z. B. C, Go). Ein Interpreter führt ihn beim Ausführen Schritt für Schritt aus (z. B. Python).', note: 'Viele Sprachen mischen beides, z. B. Java mit Bytecode oder JavaScript mit JIT-Compiler.' },
  { front: 'Was ist ein Algorithmus?', back: 'Eine eindeutige Schritt-für-Schritt-Anleitung, die ein Problem löst.', note: 'Wie ein Kochrezept.' },
  { front: 'Was ist Rekursion?', back: 'Eine Funktion ruft sich selbst auf, bis ein Abbruchfall erreicht ist.', note: 'Ohne Abbruchfall läuft der Speicher voll: Stack Overflow.' },
  { front: 'Wozu dienen Kommentare im Code?', back: 'Text für Menschen, den das Programm ignoriert. Gute Kommentare erklären das Warum, nicht das Was.' },
  { front: 'Was ist eine Exception?', back: 'Ein Fehler zur Laufzeit, der den normalen Ablauf unterbricht und sich mit try/catch abfangen lässt.' },
  { front: 'Was ist Debugging?', back: 'Fehler systematisch suchen und beheben, z. B. mit Breakpoints, an denen das Programm anhält.' },
]);

const concepts = group(CONCEPTS, [
  { front: 'Was ist objektorientierte Programmierung (OOP)?', back: 'Programme bestehen aus Objekten, die Daten (Attribute) und Verhalten (Methoden) bündeln.' },
  { front: 'Klasse vs. Objekt', back: 'Die Klasse ist der Bauplan, das Objekt ein konkretes Exemplar (Instanz) nach diesem Bauplan.', note: 'Klasse „Auto“, Objekt „mein roter Golf“.' },
  { front: 'Was ist Vererbung?', back: 'Eine Klasse übernimmt Eigenschaften und Methoden einer anderen Klasse und kann sie erweitern.' },
  { front: 'Was ist eine Bibliothek (Library)?', back: 'Fertiger, wiederverwendbarer Code, den man ins eigene Programm einbindet.' },
  { front: 'Bibliothek vs. Framework', back: 'Eine Bibliothek rufst du selbst auf. Ein Framework gibt die Struktur vor und ruft deinen Code auf.', note: 'Hollywood-Prinzip: „Don’t call us, we’ll call you.“' },
  { front: 'Was ist ein Unit-Test?', back: 'Ein automatischer Test, der eine kleine Einheit, z. B. eine Funktion, für sich allein prüft.' },
  { front: 'Was bedeutet DRY?', back: 'Don’t Repeat Yourself: Jede Logik steht nur an einer Stelle im Code.' },
  { front: 'Was sind technische Schulden?', back: 'Spätere Mehrarbeit, die durch schnelle, unsaubere Lösungen von heute entsteht.', note: 'Englisch: technical debt' },
  { front: 'Was ist Open Source?', back: 'Software, deren Quellcode öffentlich ist und die man je nach Lizenz nutzen, ändern und weitergeben darf.' },
  { front: 'Was bedeutet O(n)?', back: 'Die Laufzeit wächst linear mit der Datenmenge n (Big-O-Notation).', note: 'O(1) = konstant, O(log n) = z. B. binäre Suche, O(n²) = z. B. zwei verschachtelte Schleifen.' },
]);

const data = group(DATA, [
  { front: 'Relationale vs. NoSQL-Datenbank', back: 'Relational: Tabellen mit festem Schema und Beziehungen (z. B. PostgreSQL). NoSQL: flexible Formate wie Dokumente oder Schlüssel-Wert-Paare (z. B. MongoDB, Redis).' },
  { front: 'Was ist ein Primärschlüssel?', back: 'Eine Spalte, die jede Zeile einer Tabelle eindeutig kennzeichnet, z. B. eine ID.' },
  { front: 'Was ist ein Fremdschlüssel?', back: 'Ein Feld, das auf den Primärschlüssel einer anderen Tabelle verweist und so Tabellen verknüpft.' },
  { front: "Was liefert SELECT * FROM kunden WHERE stadt = 'Berlin'?", back: 'Alle Spalten aller Kunden, deren Stadt Berlin ist.', note: '* = alle Spalten, WHERE = Filter' },
  { front: 'Was ist ein Datenbank-Index?', back: 'Eine Hilfsstruktur, die Suchen stark beschleunigt – wie das Stichwortverzeichnis eines Buchs.', note: 'Kostet Speicher und macht Schreiben etwas langsamer.' },
]);

const web = group(WEB, [
  { front: 'Was ist HTML?', back: 'Die Auszeichnungssprache für Aufbau und Inhalt von Webseiten.', note: 'HTML = Struktur, CSS = Aussehen, JavaScript = Verhalten.' },
  { front: 'Was ist CSS?', back: 'Die Sprache, die das Aussehen von Webseiten festlegt: Farben, Schriften, Layout.', note: 'Cascading Style Sheets' },
  { front: 'Was ist DNS?', back: 'Das „Telefonbuch“ des Internets: übersetzt Namen wie example.com in IP-Adressen.', note: 'Domain Name System' },
  { front: 'HTTP vs. HTTPS', back: 'HTTPS ist HTTP mit Verschlüsselung (TLS), damit niemand die Daten mitlesen oder verändern kann.' },
  { front: 'HTTP-Statuscodes 2xx, 4xx, 5xx', back: '2xx = Erfolg (200 OK), 4xx = Fehler auf Client-Seite (z. B. 404), 5xx = Fehler auf dem Server (z. B. 500).', note: '3xx = Weiterleitung' },
  { front: 'GET vs. POST', back: 'GET ruft Daten ab, Parameter stehen in der URL. POST schickt Daten an den Server, z. B. ein Formular.' },
  { front: 'Was ist REST?', back: 'Ein Stil für Web-APIs: Ressourcen haben URLs, Aktionen laufen über HTTP-Methoden wie GET, POST, PUT und DELETE.' },
  { front: 'Was ist localhost?', back: 'Der eigene Rechner als Server, erreichbar unter der Adresse 127.0.0.1.' },
]);

const tools = group(TOOLS, [
  { front: 'Was macht git commit?', back: 'Speichert die vorgemerkten Änderungen als neuen Stand im lokalen Verlauf.', note: 'Erst git push bringt die Commits ins Remote-Repository.' },
  { front: 'Was ist ein Branch?', back: 'Ein eigener Entwicklungszweig, auf dem man arbeitet, ohne den Hauptzweig zu verändern.' },
  { front: 'Was ist ein Merge-Konflikt?', back: 'Zwei Branches haben dieselbe Stelle unterschiedlich geändert – ein Mensch muss entscheiden, was gilt.' },
  { front: 'Was ist eine IDE?', back: 'Eine integrierte Entwicklungsumgebung: Editor, Debugger und Werkzeuge in einem Programm, z. B. VS Code oder IntelliJ.' },
  { front: 'Was ist ein Container (Docker)?', back: 'Ein Paket aus Anwendung und allen Abhängigkeiten, das auf jedem Rechner gleich läuft.', note: 'Leichter als eine virtuelle Maschine, weil er den Kernel des Hosts mitbenutzt.' },
  { front: 'Was ist ein Paketmanager?', back: 'Ein Werkzeug, das Bibliotheken installiert und aktualisiert, z. B. npm, pip oder apt.' },
]);

const security = group(SECURITY, [
  { front: 'Was ist SQL-Injection?', back: 'Ein Angriff, bei dem Eingaben als SQL-Code ausgeführt werden.', note: 'Schutz: parametrisierte Abfragen (Prepared Statements).' },
  { front: 'Warum speichert man Passwörter nur als Hash?', back: 'Ein Hash lässt sich nicht zurückrechnen. Bei einem Datenleck liegen die Passwörter so nicht im Klartext vor.', note: 'Mit Salt und bewusst langsamen Verfahren wie bcrypt oder Argon2.' },
  { front: 'Was ist Cross-Site-Scripting (XSS)?', back: 'Angreifer schleusen eigenes JavaScript in eine Webseite ein, das dann im Browser anderer Nutzer läuft.', note: 'Schutz: Eingaben bei der Ausgabe immer maskieren (escapen).' },
]);

const shell = group(SHELL, [
  { front: 'Was macht ls?', back: 'Listet Dateien und Ordner im aktuellen Verzeichnis auf.', note: 'ls -la zeigt auch versteckte Dateien und Details wie Rechte und Größe.' },
  { front: 'Was macht cd?', back: 'Wechselt das Verzeichnis (change directory).', note: 'cd .. = eine Ebene höher, cd ~ = ins Home-Verzeichnis.' },
  { front: 'Was macht pwd?', back: 'Zeigt den Pfad des Verzeichnisses, in dem man gerade ist (print working directory).' },
  { front: 'Was macht sudo?', back: 'Führt einen Befehl mit Administratorrechten (als root) aus.', note: 'Kurz für „superuser do“. Vorsicht damit!' },
  { front: 'Was macht grep?', back: 'Durchsucht Text oder Dateien nach einem Muster und zeigt die passenden Zeilen.', note: 'grep "Fehler" log.txt zeigt alle Zeilen mit „Fehler“.' },
  { front: 'Was bedeutet chmod 755?', back: 'Der Besitzer darf lesen, schreiben und ausführen (7), Gruppe und alle anderen dürfen lesen und ausführen (5).', note: 'r = 4, w = 2, x = 1 – die Summe ergibt die Ziffer.' },
  { front: 'Was macht die Pipe | in der Kommandozeile?', back: 'Sie gibt die Ausgabe eines Befehls als Eingabe an den nächsten weiter.', note: 'Beispiel: ps aux | grep node' },
  { front: 'Absoluter vs. relativer Pfad', back: 'Absolut: vollständig ab dem Wurzelverzeichnis, z. B. /home/anna/notizen.txt. Relativ: vom aktuellen Ordner aus, z. B. notizen.txt oder ../bilder.' },
]);

const structures = group(STRUCTURES, [
  { front: 'Was ist ein Stack?', back: 'Ein Stapel nach dem Prinzip LIFO: Was zuletzt hineinkommt, kommt zuerst heraus.', note: 'Wie ein Tellerstapel. Die Operationen heißen push und pop.' },
  { front: 'Was ist eine Queue?', back: 'Eine Warteschlange nach dem Prinzip FIFO: Was zuerst hineinkommt, kommt zuerst heraus.', note: 'Wie die Schlange an der Supermarktkasse.' },
  { front: 'Was ist eine Hash-Map?', back: 'Sie speichert Schlüssel-Wert-Paare und findet einen Wert über seinen Schlüssel im Schnitt in konstanter Zeit, O(1).', note: 'In Python heißt sie dict, in Java HashMap, in JavaScript Map.' },
  { front: 'Was ist eine verkettete Liste?', back: 'Eine Folge von Knoten, in der jeder Knoten auf den nächsten zeigt.', note: 'Einfügen geht schnell, aber für das n-te Element muss man die Liste von vorne durchlaufen.' },
  { front: 'Was ist ein Baum (Datenstruktur)?', back: 'Eine hierarchische Struktur aus Knoten mit genau einer Wurzel; jeder Knoten kann Kindknoten haben.', note: 'Beispiele: Ordnerstruktur, HTML-Dokument (DOM).' },
  { front: 'Was ist ein Graph?', back: 'Knoten, die über Kanten verbunden sind – beliebig vernetzt, auch im Kreis.', note: 'Beispiele: Straßennetz, soziale Netzwerke.' },
]);

const python = group(PYTHON, [
  { front: 'Wie gibt man in Python etwas aus?', back: 'Mit print(), z. B. print("Hallo Welt")' },
  { front: 'Welche Rolle spielt die Einrückung in Python?', back: 'Sie gehört zur Syntax: Eingerückte Zeilen bilden einen Block, z. B. den Rumpf einer Schleife.', note: 'Üblich sind 4 Leerzeichen (Stilregel PEP 8).' },
  { front: 'Liste vs. Tupel in Python', back: 'Eine Liste [1, 2, 3] lässt sich ändern, ein Tupel (1, 2, 3) nicht.' },
  { front: 'Was liefert range(5) in Python?', back: 'Die Zahlen 0, 1, 2, 3, 4 – die obere Grenze ist nicht enthalten.' },
  { front: 'Was ist eine List Comprehension?', back: 'Eine Kurzform, um Listen zu erzeugen: [x * 2 for x in zahlen]' },
  { front: 'Was bedeutet None in Python?', back: 'Der Wert für „kein Wert“, vergleichbar mit null in anderen Sprachen.' },
]);

export const programmingDeck: SeedDeck = {
  id: 'programming',
  name: 'Programmieren Basics',
  description: 'Grundbegriffe der Softwareentwicklung – jede Woche 20 neue Karten.',
  oldDescriptions: ['Grundbegriffe aus der Softwareentwicklung, kurz erklärt.'],
  icon: 'code',
  color: 2,
  frontLang: 'de-DE',
  backLang: 'de-DE',
  cards: [
    ...classics,
    ...added('2026-10-25', [...basics, ...concepts, ...data, ...web, ...tools, ...security]),
    ...added('2026-10-31', [...shell, ...structures, ...python]),
  ],
};
