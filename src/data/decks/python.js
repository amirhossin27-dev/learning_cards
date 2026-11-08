import { group } from './util';
// Added on request, 2026-11-08.
const basics = group('Grundlagen', [
    { front: 'Welche eingebauten Datentypen gibt es in Python?', back: 'Unter anderem int (ganze Zahl), float (Kommazahl), str (Text), bool (True/False), list, tuple, dict und set.' },
    { front: 'Wie findet man den Typ eines Werts heraus?', back: 'Mit type(), z. B. ergibt type(3.5) float.', note: 'isinstance(x, int) prüft, ob x ein int ist.' },
    { front: 'Was ergibt 7 / 2, 7 // 2 und 7 % 2?', back: '3.5, 3 und 1: normale Division, ganzzahlige Division und Rest (Modulo).' },
    { front: 'Was macht ** in Python?', back: 'Potenzieren: 2 ** 10 ergibt 1024.' },
    { front: 'Was ist ein f-String?', back: 'Ein String mit vorangestelltem f, in den man Werte in geschweiften Klammern einsetzt: f"Hallo {name}"', note: 'f"{preis:.2f}" zeigt zwei Nachkommastellen.' },
    { front: 'Wie liest man eine Eingabe vom Nutzer?', back: 'Mit input(). Das Ergebnis ist immer ein String.', note: 'Als Zahl: int(input("Alter: "))' },
    { front: 'Was sind truthy und falsy Werte?', back: 'In Bedingungen gelten 0, "", None und leere Listen oder Dicts als falsch, fast alles andere als wahr.', note: 'if namen: prüft also, ob die Liste nicht leer ist.' },
    { front: '== vs. is in Python', back: '== vergleicht Werte, is prüft, ob es dasselbe Objekt ist.', note: 'Für None nimmt man is: if x is None:' },
    { front: 'Wie schreibt man einen Kommentar in Python?', back: 'Mit #. Alles dahinter bis zum Zeilenende ignoriert Python.', note: 'Ein Text in """…""" am Anfang einer Funktion heißt Docstring und beschreibt sie.' },
    { front: 'Was ist PEP 8?', back: 'Der offizielle Stilleitfaden für Python-Code, z. B. 4 Leerzeichen Einrückung und snake_case für Namen.' },
]);
const sequences = group('Strings & Listen', [
    { front: 'Wie greift man auf das letzte Element einer Liste zu?', back: 'Mit dem Index -1: liste[-1].', note: 'Negative Indizes zählen von hinten.' },
    { front: 'Was ist Slicing?', back: 'Einen Ausschnitt nehmen: liste[1:4] liefert die Elemente mit Index 1 bis 3.', note: 'liste[::-1] liefert die Liste umgedreht.' },
    { front: 'Wie fügt man einer Liste ein Element hinzu?', back: 'Mit append() am Ende, z. B. liste.append(4), oder mit insert() an einer bestimmten Stelle.', note: 'extend() hängt mehrere Elemente auf einmal an.' },
    { front: 'sorted() vs. sort()', back: 'sorted(liste) gibt eine neue sortierte Liste zurück, liste.sort() sortiert die Liste selbst.', note: 'Absteigend mit reverse=True.' },
    { front: 'Wie bekommt man die Länge einer Liste oder eines Strings?', back: 'Mit len(), z. B. ergibt len("Hallo") 5.' },
    { front: 'Was machen split() und join()?', back: 'split() zerlegt einen String in eine Liste, join() fügt eine Liste zu einem String zusammen.', note: '"a,b,c".split(",") ergibt ["a", "b", "c"], "-".join(["a", "b"]) ergibt "a-b".' },
    { front: 'Kann man einen String in Python verändern?', back: 'Nein, Strings sind unveränderlich. Methoden wie upper() oder replace() liefern einen neuen String.' },
    { front: 'Wie prüft man, ob ein Element in einer Liste ist?', back: 'Mit in: if "Anna" in namen:' },
    { front: 'Was macht enumerate()?', back: 'Liefert beim Durchlaufen zu jedem Element auch seinen Index.', note: 'for i, name in enumerate(namen):' },
    { front: 'Was macht zip()?', back: 'Läuft mehrere Listen gleichzeitig durch und bildet Paare.', note: 'for name, alter in zip(namen, alter_liste):' },
]);
const collections = group('Dicts & Sets', [
    { front: 'Was ist ein Dictionary?', back: 'Eine Sammlung von Schlüssel-Wert-Paaren: {"name": "Anna", "alter": 30}', note: 'Zugriff: person["name"]' },
    { front: 'Warum dict.get() statt dict[schlüssel]?', back: 'get() liefert None oder einen Standardwert statt eines KeyError, wenn der Schlüssel fehlt.', note: 'person.get("email", "keine")' },
    { front: 'Wie durchläuft man Schlüssel und Werte eines Dicts?', back: 'Mit items(): for schluessel, wert in d.items():' },
    { front: 'Was ist ein Set?', back: 'Eine ungeordnete Menge ohne Duplikate: {1, 2, 3}', note: 'list(set(liste)) entfernt doppelte Einträge – die Reihenfolge geht dabei verloren.' },
    { front: 'Was ist eine Dict Comprehension?', back: 'Die Kurzform, um ein Dict zu bauen: {x: x ** 2 for x in range(5)}' },
    { front: 'Was darf ein Schlüssel in einem Dict sein?', back: 'Nur unveränderliche (hashbare) Werte wie str, int oder tuple – keine Listen.' },
]);
const functions = group('Funktionen', [
    { front: 'Wie definiert man eine Funktion in Python?', back: 'Mit def: def begruessen(name): return f"Hallo {name}"' },
    { front: 'Was ist ein Standardwert für einen Parameter?', back: 'Ein Wert, der gilt, wenn man das Argument weglässt: def hallo(name="Welt"):', note: 'Vorsicht: keine Liste als Standardwert, sie wird zwischen Aufrufen geteilt. Besser None.' },
    { front: 'Was gibt eine Funktion ohne return zurück?', back: 'None.' },
    { front: 'Was bedeuten *args und **kwargs?', back: '*args sammelt beliebig viele Positionsargumente als Tupel, **kwargs beliebig viele benannte Argumente als Dict.' },
    { front: 'Was ist eine Lambda-Funktion?', back: 'Eine kleine namenlose Funktion in einer Zeile: lambda x: x * 2', note: 'Oft als Sortierschlüssel: sorted(personen, key=lambda p: p["alter"])' },
    { front: 'Was ist ein Generator?', back: 'Eine Funktion mit yield statt return. Sie liefert Werte einzeln und erst bei Bedarf – das spart Speicher bei großen Datenmengen.' },
    { front: 'Was ist ein Decorator?', back: 'Eine Funktion, die eine andere Funktion umhüllt und erweitert. Man schreibt ihn mit @ über die Funktion.', note: 'Beispiel: @app.route("/") im Web-Framework Flask.' },
    { front: 'Was sind Type Hints?', back: 'Optionale Typangaben wie def summe(a: int, b: int) -> int:. Python selbst prüft sie nicht, aber Editoren und Werkzeuge wie mypy.' },
]);
const classes = group('Klassen & Fehler', [
    { front: 'Wie definiert man eine Klasse in Python?', back: 'Mit class, z. B. class Hund:, und darin Methoden mit def.' },
    { front: 'Was macht __init__?', back: 'Der Konstruktor: Er läuft beim Erzeugen eines Objekts und setzt die Startwerte.', note: 'def __init__(self, name): self.name = name' },
    { front: 'Wofür steht self?', back: 'Für das Objekt selbst. Jede Methode bekommt es als ersten Parameter.' },
    { front: 'Wie erbt eine Klasse von einer anderen?', back: 'Mit der Elternklasse in Klammern: class Dackel(Hund):', note: 'super().__init__() ruft den Konstruktor der Elternklasse auf.' },
    { front: 'Was ist eine Dataclass?', back: 'Eine Klasse mit @dataclass, für die Python __init__, Vergleich und Textausgabe automatisch erzeugt.', note: 'Import: from dataclasses import dataclass' },
    { front: 'Wie fängt man in Python Fehler ab?', back: 'Mit try und except: try: x = int(text) except ValueError: print("Keine Zahl")', note: 'Nur die erwarteten Fehler abfangen, kein nacktes except:.' },
    { front: 'Wofür ist finally?', back: 'Code in finally läuft immer – ob ein Fehler auftrat oder nicht, z. B. zum Aufräumen.' },
    { front: 'Wie löst man selbst einen Fehler aus?', back: 'Mit raise, z. B. raise ValueError("Alter darf nicht negativ sein")' },
]);
const practice = group('Module & Praxis', [
    { front: 'Wie importiert man ein Modul?', back: 'import math – oder gezielt: from math import sqrt' },
    { front: 'Was bedeutet if __name__ == "__main__":?', back: 'Der Code darunter läuft nur, wenn man die Datei direkt startet, nicht beim Import als Modul.' },
    { front: 'Was ist pip?', back: 'Der Paketmanager von Python: pip install requests installiert ein Paket aus dem Python Package Index (PyPI).' },
    { front: 'Was ist eine virtuelle Umgebung (venv)?', back: 'Ein abgeschotteter Ordner mit eigenen Paketen pro Projekt, damit sich Versionen nicht in die Quere kommen.', note: 'Anlegen: python -m venv .venv' },
    { front: 'Wozu dient requirements.txt?', back: 'Sie listet die Pakete eines Projekts. pip install -r requirements.txt installiert alle auf einmal.' },
    { front: 'Wie öffnet man in Python eine Datei, sodass sie sicher wieder geschlossen wird?', back: 'Mit with: with open("datei.txt") as f: – nach dem Block wird die Datei automatisch geschlossen.', note: 'with arbeitet mit sogenannten Kontextmanagern.' },
    { front: 'Wie liest und schreibt man JSON in Python?', back: 'Mit dem Modul json: json.load() liest aus einer Datei, json.dump() schreibt hinein.', note: 'json.loads() und json.dumps() arbeiten mit Strings statt Dateien.' },
    { front: 'Welche Python-Bibliotheken sind besonders verbreitet?', back: 'Zum Beispiel NumPy und pandas für Daten, requests für HTTP, Django und Flask fürs Web, pytest zum Testen.' },
]);
export const pythonDeck = {
    id: 'python',
    name: 'Python',
    description: 'Von Datentypen über Funktionen und Klassen bis zu Modulen – Python Schritt für Schritt.',
    icon: 'terminal',
    color: 4,
    frontLang: 'de-DE',
    backLang: 'de-DE',
    cards: [...basics, ...sequences, ...collections, ...functions, ...classes, ...practice],
};
