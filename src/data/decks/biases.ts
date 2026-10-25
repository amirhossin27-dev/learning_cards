import type { SeedDeck } from '../seed';
import { group } from './util';

// Deck of the week, 2026-10-25.

const decisions = group('Entscheidungen', [
  { front: 'Ankereffekt', back: 'Die erste Zahl, die wir hören, beeinflusst unsere Schätzung – selbst wenn sie willkürlich ist.', example: 'Wer in einer Verhandlung zuerst einen hohen Preis nennt, erzielt meist ein höheres Ergebnis.', note: 'Gegenmittel: vorher die eigene Zahl festlegen.' },
  { front: 'Verlustaversion', back: 'Verluste schmerzen etwa doppelt so stark, wie gleich große Gewinne uns freuen.', example: '50 Euro zu verlieren ärgert mehr, als 50 Euro zu finden freut.', note: 'Beschrieben von Daniel Kahneman und Amos Tversky.' },
  { front: 'Sunk-Cost-Effekt', back: 'Wir halten an etwas fest, weil wir schon viel hineingesteckt haben – obwohl Aufhören besser wäre.', example: 'Ein schlechtes Projekt weiterführen, „weil schon so viel Geld drinsteckt“.', note: 'Hilfsfrage: Würde ich heute noch einmal neu einsteigen?' },
  { front: 'Framing-Effekt', back: 'Wie etwas formuliert ist, beeinflusst unsere Entscheidung, obwohl die Fakten gleich bleiben.', example: '„90 % fettfrei“ klingt besser als „10 % Fett“.' },
  { front: 'Status-quo-Verzerrung', back: 'Wir bevorzugen den aktuellen Zustand, auch wenn eine Änderung besser wäre.', example: 'Jahrelang beim teuren Stromanbieter bleiben, weil der Wechsel Mühe macht.' },
  { front: 'Besitztumseffekt (Endowment-Effekt)', back: 'Was uns gehört, bewerten wir höher als dasselbe Ding, wenn es uns nicht gehört.', example: 'Im Experiment verlangten Besitzer einer Kaffeetasse etwa doppelt so viel, wie andere dafür zahlen wollten.' },
  { front: 'Köder-Effekt (Decoy-Effekt)', back: 'Eine unattraktive dritte Option lässt eine andere plötzlich besonders günstig aussehen.', example: 'Popcorn klein 4 €, mittel 6,50 €, groß 7 € – die meisten greifen zum großen.' },
  { front: 'Spielerfehlschluss', back: 'Der Glaube, nach einer Serie sei das Gegenteil „fällig“ – obwohl jedes Ereignis vom vorigen unabhängig ist.', example: 'Nach fünfmal Rot beim Roulette auf Schwarz setzen, weil es „jetzt kommen muss“.' },
  { front: 'Planungsfehlschluss', back: 'Wir unterschätzen fast immer, wie lange Vorhaben dauern und was sie kosten.', example: 'Der Flughafen BER sollte 2011 eröffnen – es wurde Ende 2020.', note: 'Hilfsfrage: Wie lange haben ähnliche Projekte wirklich gedauert?' },
]);

const judgements = group('Urteile', [
  { front: 'Bestätigungsfehler (Confirmation Bias)', back: 'Wir suchen und glauben vor allem Informationen, die unsere Meinung bestätigen.', example: 'Man liest nur Artikel, die die eigene Aktie loben.', note: 'Gegenmittel: gezielt nach Gegenargumenten suchen.' },
  { front: 'Dunning-Kruger-Effekt', back: 'Wer wenig von einem Thema versteht, überschätzt sein Können oft am stärksten.', note: 'Wer viel weiß, unterschätzt sich dagegen eher.' },
  { front: 'Halo-Effekt', back: 'Eine auffällige gute Eigenschaft überstrahlt unser Urteil über die ganze Person.', example: 'Gut aussehende Bewerber werden oft auch für kompetenter gehalten.' },
  { front: 'Verfügbarkeitsheuristik', back: 'Was uns schnell einfällt, halten wir für häufiger oder wahrscheinlicher.', example: 'Nach Berichten über Flugzeugabstürze wirkt Fliegen gefährlich – dabei ist es viel sicherer als Autofahren.' },
  { front: 'Rückschaufehler (Hindsight Bias)', back: 'Im Nachhinein glauben wir, wir hätten es „schon immer gewusst“.', example: 'Nach einem Börsencrash sagen viele, er sei absehbar gewesen.' },
  { front: 'Survivorship Bias', back: 'Wir sehen nur die Erfolgsgeschichten und übersehen die vielen, die gescheitert sind.', example: '„Er hat das Studium abgebrochen und wurde Milliardär“ – die vielen anderen Abbrecher sieht niemand.', note: 'Im Zweiten Weltkrieg erkannte Abraham Wald: Panzern muss man die Stellen, an denen zurückgekehrte Flugzeuge keine Treffer hatten.' },
  { front: 'Selbstwertdienliche Verzerrung', back: 'Erfolge schreiben wir uns selbst zu, Misserfolge den Umständen.', example: '„Bestanden habe ich, weil ich gut bin. Durchgefallen bin ich, weil die Prüfung unfair war.“' },
  { front: 'Fundamentaler Attributionsfehler', back: 'Das Verhalten anderer erklären wir mit ihrem Charakter und unterschätzen die Umstände.', example: 'Der Kollege kommt zu spät: „unzuverlässig“ – statt an einen Stau zu denken.' },
  { front: 'Optimismus-Verzerrung', back: 'Wir glauben, uns treffe Schlechtes seltener als andere.', example: '„Mir passiert beim Autofahren schon nichts.“' },
  { front: 'Barnum-Effekt', back: 'Vage, allgemeine Aussagen empfinden wir als treffende Beschreibung unserer Person.', example: 'Horoskope: „Du wirkst nach außen selbstsicher, zweifelst aber manchmal an dir.“' },
]);

const others = group('Andere Menschen', [
  { front: 'Mitläufereffekt', back: 'Wir übernehmen Meinungen oder Verhalten, weil viele andere es auch tun.', example: 'Das Restaurant mit Warteschlange wirkt automatisch besser.', note: 'Englisch: bandwagon effect' },
  { front: 'Pygmalion-Effekt', back: 'Hohe Erwartungen an einen Menschen verbessern seine Leistung.', example: 'Schüler, denen Lehrer viel zutrauen, machen oft größere Fortschritte.', note: 'Bekannt durch das Rosenthal-Experiment in den 1960er-Jahren.' },
  { front: 'Spotlight-Effekt', back: 'Wir überschätzen, wie sehr andere auf unser Aussehen und unsere Fehler achten.', example: 'Den Fleck auf dem Hemd bemerkt kaum jemand.', note: 'In einer Studie glaubten Träger eines peinlichen T-Shirts, die Hälfte bemerke es – tatsächlich war es etwa ein Viertel.' },
  { front: 'Zuschauereffekt (Bystander-Effekt)', back: 'Je mehr Menschen dabei sind, desto seltener hilft der Einzelne.', note: 'Im Notfall eine Person direkt ansprechen: „Sie in der roten Jacke, rufen Sie die 112!“' },
  { front: 'Gruppendenken (Groupthink)', back: 'In harmonischen Gruppen wird Kritik unterdrückt, um Einigkeit zu wahren – oft mit schlechten Entscheidungen als Folge.', example: 'Die gescheiterte Invasion in der Schweinebucht 1961 gilt als Lehrbuchbeispiel.', note: 'Gegenmittel: bewusst jemanden zum Advocatus Diaboli bestimmen.' },
]);

const mind = group('Gedächtnis & Gefühl', [
  { front: 'Zeigarnik-Effekt', back: 'Unerledigte Aufgaben bleiben besser im Gedächtnis als erledigte.', note: 'Tipp: Offene Punkte aufschreiben entlastet den Kopf.' },
  { front: 'Primacy- und Recency-Effekt', back: 'Von einer Reihe merken wir uns den Anfang und das Ende am besten.', example: 'In einer Präsentation bleiben Einstieg und Schluss am stärksten hängen.' },
  { front: 'Placebo-Effekt', back: 'Eine Behandlung ohne Wirkstoff wirkt, weil wir an sie glauben.', note: 'Das Gegenstück ist der Nocebo-Effekt: Beschwerden allein durch die Erwartung.' },
  { front: 'Kognitive Dissonanz', back: 'Das unangenehme Gefühl, wenn Handeln und Überzeugung nicht zusammenpassen – oft biegen wir dann die Überzeugung zurecht.', example: 'Raucher sagen: „Mein Opa hat auch geraucht und wurde 90.“' },
  { front: 'Mere-Exposure-Effekt', back: 'Was wir oft sehen oder hören, finden wir sympathischer.', example: 'Darum wiederholen Werbespots immer wieder denselben Slogan.' },
  { front: 'IKEA-Effekt', back: 'Was wir selbst gebaut haben, schätzen wir höher ein.', example: 'Das selbst aufgebaute Regal wirkt wertvoller als ein fertig gekauftes.' },
]);

export const biasesDeck: SeedDeck = {
  id: 'denkfehler',
  name: 'Denkfehler & Psychologie',
  description: 'Warum uns der Kopf austrickst: Effekte, die man im Alltag und im Job wiedererkennt.',
  icon: 'brain',
  color: 5,
  frontLang: 'de-DE',
  backLang: 'de-DE',
  cards: [...decisions, ...judgements, ...others, ...mind],
};
