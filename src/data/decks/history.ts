import type { SeedDeck } from '../seed';
import { added, group } from './util';

const ANTIQUITY = 'Antike';
const MIDDLE_AGES = 'Mittelalter';
const MODERN = 'Neuzeit';
const C20 = '20. Jahrhundert';
const C21 = '21. Jahrhundert';

// The first release.
const classics = [
  { front: 'Wann fiel die Berliner Mauer?', back: '9. November 1989', tag: C20 },
  { front: 'Wann war die Wiedervereinigung Deutschlands?', back: '3. Oktober 1990', note: 'Seitdem Nationalfeiertag: Tag der Deutschen Einheit.', tag: C20 },
  { front: 'Wer erfand den Buchdruck mit beweglichen Lettern?', back: 'Johannes Gutenberg (um 1450)', note: 'In Mainz; sein bekanntestes Werk ist die Gutenberg-Bibel.', tag: MIDDLE_AGES },
  { front: 'Wann landeten Menschen zum ersten Mal auf dem Mond?', back: '20. Juli 1969 (Apollo 11)', note: 'Neil Armstrong betrat als Erster den Mond, Buzz Aldrin folgte.', tag: C20 },
  { front: 'Wann begann die Französische Revolution?', back: '1789 mit dem Sturm auf die Bastille', note: 'Am 14. Juli – bis heute Nationalfeiertag in Frankreich.', tag: MODERN },
  { front: 'Wann endete der Zweite Weltkrieg in Europa?', back: '8. Mai 1945', note: 'In Asien endete er erst mit der Kapitulation Japans am 2. September 1945.', tag: C20 },
  { front: 'Wer war der erste römische Kaiser?', back: 'Augustus (27 v. Chr.)', tag: ANTIQUITY },
  { front: 'Wann entdeckte Kolumbus Amerika?', back: '1492', note: 'Er landete auf den Bahamas und glaubte, in Indien zu sein. Wikinger waren schon um das Jahr 1000 in Nordamerika.', tag: MODERN },
  { front: 'Was war die Magna Carta?', back: 'Englische Urkunde von 1215, die die Macht des Königs begrenzte.', tag: MIDDLE_AGES },
  { front: 'Wann wurde das Grundgesetz verkündet?', back: '23. Mai 1949', tag: C20 },
  { front: 'Wann begann Luthers Reformation?', back: '1517 mit den 95 Thesen', note: 'Darum ist der 31. Oktober Reformationstag.', tag: MODERN },
  { front: 'Wann wurde die EU (Vertrag von Maastricht) gegründet?', back: '1992 unterzeichnet, 1993 in Kraft', tag: C20 },
];

const antiquity = group(ANTIQUITY, [
  { front: 'Wann wurde die Cheops-Pyramide gebaut?', back: 'Um 2560 v. Chr.', note: 'Über 3.800 Jahre lang das höchste Bauwerk der Welt.' },
  { front: 'Wo und wann entstand die Demokratie?', back: 'Im antiken Athen, um 500 v. Chr.', note: 'Mit den Reformen des Kleisthenes. Mitbestimmen durften aber nur freie Männer.' },
  { front: 'Wann wurde Rom der Sage nach gegründet?', back: '753 v. Chr.', note: 'Eselsbrücke: „7-5-3, Rom kroch aus dem Ei.“' },
  { front: 'Wer war Alexander der Große?', back: 'König von Makedonien (356–323 v. Chr.), der ein Reich von Griechenland bis Indien eroberte.' },
  { front: 'Wann wurde Julius Caesar ermordet?', back: 'An den Iden des März: 15. März 44 v. Chr.' },
  { front: 'Was geschah in der Varusschlacht?', back: 'Germanen unter Arminius vernichteten im Jahr 9 n. Chr. drei römische Legionen.', note: 'Auch „Schlacht im Teutoburger Wald“ genannt.' },
  { front: 'Wann endete das Weströmische Reich?', back: '476 n. Chr., als Odoaker den letzten Kaiser Romulus Augustulus absetzte.' },
]);

const middleAges = group(MIDDLE_AGES, [
  { front: 'Wann wurde Karl der Große zum Kaiser gekrönt?', back: 'Am 25. Dezember 800 in Rom' },
  { front: 'Was geschah 1066 bei Hastings?', back: 'Wilhelm der Eroberer besiegte die Angelsachsen und wurde König von England.' },
  { front: 'Wann begann der Erste Kreuzzug?', back: '1096, nach dem Aufruf von Papst Urban II. im Jahr 1095' },
  { front: 'Was regelte die Goldene Bulle von 1356?', back: 'Die Wahl des römisch-deutschen Königs durch sieben Kurfürsten.' },
  { front: 'Wann wütete der „Schwarze Tod“ in Europa?', back: 'Ab 1347. Die Pest tötete schätzungsweise ein Drittel bis die Hälfte der Bevölkerung Europas.' },
  { front: 'Was war die Hanse?', back: 'Ein Bund von Kaufleuten und Städten wie Lübeck und Hamburg, der vom 12. bis 17. Jahrhundert den Handel in Nordeuropa prägte.' },
  { front: 'Wann eroberten die Osmanen Konstantinopel?', back: '1453 – das Ende des Byzantinischen Reichs' },
]);

const modern = group(MODERN, [
  { front: 'Wann umsegelte eine Expedition erstmals die Erde?', back: '1519–1522, die Expedition von Ferdinand Magellan', note: 'Magellan selbst starb 1521 auf den Philippinen; Juan Sebastián Elcano führte die Fahrt zu Ende.' },
  { front: 'Wann war der Dreißigjährige Krieg?', back: '1618–1648, beendet durch den Westfälischen Frieden' },
  { front: 'Wann wurde die Unabhängigkeitserklärung der USA verabschiedet?', back: '4. Juli 1776', note: 'Seitdem Nationalfeiertag: Independence Day.' },
  { front: 'Wann begann die Industrielle Revolution?', back: 'Um 1760 in England, angetrieben u. a. von der Dampfmaschine.', note: 'James Watt verbesserte die Dampfmaschine ab 1769 entscheidend.' },
  { front: 'Wann verlor Napoleon die Schlacht bei Waterloo?', back: '18. Juni 1815' },
  { front: 'Was war der Wiener Kongress?', back: 'Die Konferenz von 1814/15, auf der Europa nach Napoleon neu geordnet wurde.' },
  { front: 'Was geschah 1848/49 in Deutschland?', back: 'Die Märzrevolution: In der Frankfurter Paulskirche tagte das erste gesamtdeutsche Parlament.' },
  { front: 'Wann wurde die Sklaverei in den USA abgeschafft?', back: '1865 mit dem 13. Zusatzartikel zur Verfassung, nach dem Bürgerkrieg' },
  { front: 'Wann wurde das Deutsche Kaiserreich gegründet?', back: 'Am 18. Januar 1871 im Spiegelsaal von Versailles' },
  { front: 'Wer war Otto von Bismarck?', back: 'Der erste Reichskanzler des Deutschen Kaiserreichs (1871–1890), der „Eiserne Kanzler“.', note: 'Führte die Kranken-, Unfall- und Rentenversicherung ein.' },
]);

const c20 = group(C20, [
  { front: 'Wann begann der Erste Weltkrieg?', back: '1914, nach dem Attentat von Sarajevo am 28. Juni' },
  { front: 'Wann endete der Erste Weltkrieg?', back: 'Am 11. November 1918 mit dem Waffenstillstand von Compiègne', note: 'Der Friedensvertrag von Versailles folgte 1919.' },
  { front: 'Wann wurde in Deutschland die Republik ausgerufen?', back: 'Am 9. November 1918 durch Philipp Scheidemann', note: 'Der 9. November gilt als „Schicksalstag“: 1918, 1923, 1938 und 1989.' },
  { front: 'Wann wurde Hitler Reichskanzler?', back: 'Am 30. Januar 1933' },
  { front: 'Wann begann der Zweite Weltkrieg?', back: 'Am 1. September 1939 mit dem Überfall auf Polen' },
  { front: 'Wann wurden die Vereinten Nationen gegründet?', back: '1945 – die UN-Charta trat am 24. Oktober in Kraft', note: 'Darum ist der 24. Oktober der Tag der Vereinten Nationen.' },
  { front: 'Was waren die Römischen Verträge?', back: 'Die Gründungsverträge der EWG von 1957, der Vorläuferin der EU.' },
  { front: 'Wann wurde die Berliner Mauer gebaut?', back: 'Ab dem 13. August 1961' },
  { front: 'Was war die Kubakrise?', back: 'Der Streit zwischen USA und Sowjetunion um Atomraketen auf Kuba 1962 – die Welt stand am Rand eines Atomkriegs.' },
  { front: 'Wann zerfiel die Sowjetunion?', back: 'Im Dezember 1991' },
  { front: 'Wann ging das World Wide Web online?', back: '1991, entwickelt von Tim Berners-Lee am CERN' },
  { front: 'Wann wurde der Euro eingeführt?', back: '1999 als Buchgeld, 2002 als Bargeld' },
]);

const c21 = group(C21, [
  { front: 'Was geschah am 11. September 2001?', back: 'Terroranschläge auf das World Trade Center in New York und das Pentagon, fast 3.000 Menschen starben.' },
  { front: 'Wann kam das erste iPhone auf den Markt?', back: '2007', note: 'Vorgestellt im Januar, verkauft ab Juni.' },
  { front: 'Wann trat Großbritannien aus der EU aus?', back: 'Am 31. Januar 2020', note: 'Das Referendum dazu war 2016.' },
  { front: 'Wann erklärte die WHO COVID-19 zur Pandemie?', back: 'Am 11. März 2020' },
]);

export const historyDeck: SeedDeck = {
  id: 'history',
  name: 'Geschichte kompakt',
  description: 'Wichtige Jahreszahlen und Ereignisse von der Antike bis heute.',
  oldDescriptions: ['Wichtige Jahreszahlen und Ereignisse, die man kennen sollte.'],
  icon: 'landmark',
  color: 4,
  frontLang: 'de-DE',
  backLang: 'de-DE',
  cards: [...classics, ...added('2026-10-25', [...antiquity, ...middleAges, ...modern, ...c20, ...c21])],
};
