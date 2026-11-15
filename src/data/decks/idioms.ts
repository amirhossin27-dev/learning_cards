import type { SeedDeck } from '../seed';
import { group } from './util';

// Deck of the week, 2026-11-14. Many origins are not certain; where several
// explanations exist, the card says so.

const knights = group('Ritter & Mittelalter', [
  { front: 'Jemandem nicht das Wasser reichen können', back: 'Bei Weitem nicht so gut sein wie jemand.', example: 'Im Schach kann ihm keiner von uns das Wasser reichen.', note: 'Bei Tisch reichten Diener früher Wasser zum Händewaschen. Wer nicht einmal dafür taugte, stand ganz unten.' },
  { front: 'Etwas aus dem Stegreif tun', back: 'Etwas spontan und ohne Vorbereitung tun.', example: 'Sie hielt die Rede aus dem Stegreif.', note: 'Der Stegreif ist der Steigbügel. Ein Reiter, der etwas „aus dem Stegreif“ erledigte, tat es, ohne vom Pferd zu steigen.' },
  { front: 'Jemanden im Stich lassen', back: 'Jemanden in einer schwierigen Lage allein lassen.', example: 'Kurz vor der Deadline hat uns der Dienstleister im Stich gelassen.', note: 'Eine verbreitete Erklärung: Ein gestürzter Ritter war ohne Hilfe seines Knappen dem Stich des Gegners ausgeliefert.' },
  { front: 'Sich die Sporen verdienen', back: 'Sich zum ersten Mal bewähren.', example: 'Ihre ersten Sporen verdiente sie sich in einem kleinen Start-up.', note: 'Beim Ritterschlag bekam ein Knappe goldene Sporen als Zeichen seines neuen Standes.' },
  { front: 'Etwas im Schilde führen', back: 'Heimlich etwas (meist Böses) vorhaben.', example: 'Er ist so freundlich – was führt er wohl im Schilde?', note: 'Am Wappen auf dem Schild erkannte man, ob ein Ritter Freund oder Feind war.' },
  { front: 'Etwas auf dem Kerbholz haben', back: 'Etwas Unrechtes getan haben.', example: 'Der Verdächtige hat schon einiges auf dem Kerbholz.', note: 'Auf einem Kerbholz wurden früher Schulden oder Arbeitsleistungen als Kerben festgehalten.' },
  { front: 'Torschlusspanik', back: 'Die Angst, eine Gelegenheit endgültig zu verpassen.', example: 'Mit 39 bekam er Torschlusspanik und kaufte sich ein Motorrad.', note: 'Abends wurden die Stadttore geschlossen. Wer zu spät kam, musste die Nacht draußen verbringen.' },
  { front: 'Ein Schlitzohr', back: 'Ein gerissener, durchtriebener Mensch.', example: 'Der Händler ist ein echtes Schlitzohr.', note: 'Eine verbreitete Erklärung: Zunftgesellen trugen einen Ohrring. Wer gegen die Regeln verstieß, dem riss man ihn heraus.' },
]);

const trade = group('Handwerk & Handel', [
  { front: 'Blaumachen', back: 'Unentschuldigt nicht zur Arbeit oder Schule gehen.', example: 'Am Freitag hat er einfach blaugemacht.', note: 'Vermutlich vom „blauen Montag“, an dem Handwerker nicht arbeiteten. Oft wird es mit den Färbern erklärt: Mit Waid gefärbte Stoffe wurden erst an der Luft blau, und so lange hatten die Färber frei.' },
  { front: 'Den Nagel auf den Kopf treffen', back: 'Genau das Richtige sagen, den Kern einer Sache erfassen.', example: 'Mit deiner Frage hast du den Nagel auf den Kopf getroffen.', note: 'Wer den Nagel genau auf den Kopf trifft, schlägt ihn sauber ein. Manche führen es auch auf den Nagel in der Mitte einer Zielscheibe zurück.' },
  { front: 'Jemandem reinen Wein einschenken', back: 'Jemandem die ungeschönte Wahrheit sagen.', example: 'Es wird Zeit, dass wir dem Team reinen Wein einschenken.', note: 'Unehrliche Wirte verdünnten oder panschten den Wein. Ein ehrlicher Wirt schenkte reinen Wein aus.' },
  { front: 'Jemanden über den Löffel balbieren', back: 'Jemanden plump betrügen.', example: 'Beim Gebrauchtwagenkauf wurde er über den Löffel balbiert.', note: '„Balbieren“ heißt rasieren. Barbiere steckten Kunden mit eingefallenen Wangen einen Löffel in den Mund, um die Haut zu straffen – schnell und grob.' },
  { front: 'Pleite gehen', back: 'Zahlungsunfähig werden.', example: 'Das Restaurant ging nach einem Jahr pleite.', note: 'Aus dem Jiddischen: „pleite“ geht auf das hebräische Wort für Flucht zurück. Wer nicht zahlen konnte, floh vor seinen Gläubigern.' },
  { front: 'Die Katze im Sack kaufen', back: 'Etwas kaufen, ohne es vorher geprüft zu haben.', example: 'Ein Auto ohne Probefahrt? Da kaufst du die Katze im Sack.', note: 'Auf Märkten sollen Betrüger statt eines Ferkels oder Kaninchens eine Katze in den Sack gesteckt haben.' },
  { front: 'Einem geschenkten Gaul schaut man nicht ins Maul', back: 'Geschenke soll man nicht kritisieren.', example: 'Das Handy ist zwar alt, aber einem geschenkten Gaul schaut man nicht ins Maul.', note: 'An den Zähnen erkennt man das Alter eines Pferdes. Beim Pferdekauf prüfte man sie, bei einem Geschenk gehört sich das nicht.' },
  { front: 'Auf den Hund kommen', back: 'Herunterkommen, in schlechte Verhältnisse geraten.', example: 'Das einst schöne Hotel ist ziemlich auf den Hund gekommen.', note: 'Eine verbreitete Erklärung: Auf dem Boden von Geldtruhen war oft ein Hund als Wächter abgebildet. Wer ihn sah, hatte kein Geld mehr.' },
  { front: 'Etwas auf die lange Bank schieben', back: 'Etwas immer weiter aufschieben.', example: 'Die Steuererklärung schiebe ich seit Wochen auf die lange Bank.', note: 'In Amtsstuben und Gerichten lagen Akten in langen Truhenbänken. Was dort landete, blieb lange liegen.' },
]);

const everyday = group('Alltag früherer Zeiten', [
  { front: 'Jemandem auf den Leim gehen', back: 'Auf einen Trick hereinfallen.', example: 'Viele sind der gefälschten E-Mail auf den Leim gegangen.', note: 'Vogelfänger bestrichen Zweige mit Leim. Vögel, die sich daraufsetzten, blieben kleben.' },
  { front: 'Den Löffel abgeben', back: 'Sterben (salopp).', example: 'Der alte Rasenmäher hat endgültig den Löffel abgegeben.', note: 'Früher besaß jeder seinen eigenen Löffel. Nach dem Tod wurde er an andere weitergegeben.' },
  { front: 'Ins Fettnäpfchen treten', back: 'Unabsichtlich etwas Peinliches sagen oder tun.', example: 'Mit der Frage nach ihrem Alter bin ich voll ins Fettnäpfchen getreten.', note: 'In Bauernhäusern stand ein Napf mit Fett, um Stiefel wasserdicht zu machen. Wer hineintrat, verschmierte den Boden und zog sich den Ärger der Hausfrau zu.' },
  { front: 'Etwas ausbaden müssen', back: 'Die Folgen von etwas tragen müssen, das andere verursacht haben.', example: 'Die Fehler der Chefs müssen jetzt die Mitarbeiter ausbaden.', note: 'Im Badehaus badeten mehrere nacheinander im selben Wasser. Der Letzte saß im schmutzigsten Wasser und musste die Wanne leeren.' },
  { front: 'Ein Brett vor dem Kopf haben', back: 'Etwas Offensichtliches nicht verstehen.', example: 'Entschuldige, ich hatte gerade ein Brett vor dem Kopf.', note: 'Eine verbreitete Erklärung: Störrischen Ochsen band man ein Brett vor die Augen, damit sie ruhig blieben – sie sahen dann nichts mehr.' },
  { front: 'Mit Kind und Kegel', back: 'Mit der ganzen Familie.', example: 'Am Sonntag kamen die Nachbarn mit Kind und Kegel zum Grillen.', note: '„Kegel“ ist ein altes Wort für ein uneheliches Kind. Gemeint war also: mit allen Kindern.' },
  { front: 'Ins Gras beißen', back: 'Sterben (salopp).', example: 'In dem Actionfilm beißt der Bösewicht am Ende ins Gras.', note: 'Das Bild stammt vom Schlachtfeld: Tödlich getroffene Kämpfer stürzten zu Boden, mit dem Gesicht ins Gras.' },
]);

const language = group('Sprache, Bühne & See', [
  { front: 'Unter aller Kanone', back: 'Sehr schlecht.', example: 'Das Essen in der Kantine war heute unter aller Kanone.', note: 'Aus dem Lateinischen „sub omni canone“ = unter jedem Maßstab. Schüler machten aus dem „Kanon“ scherzhaft eine Kanone.' },
  { front: 'Hals- und Beinbruch!', back: 'Viel Glück!', example: 'Morgen ist deine Prüfung? Hals- und Beinbruch!', note: 'Vermutlich aus dem Jiddischen „hatslokhe un brokhe“ (Glück und Segen), das ähnlich klingt und umgedeutet wurde.' },
  { front: 'Kein Blatt vor den Mund nehmen', back: 'Offen und ohne Rücksicht seine Meinung sagen.', example: 'In der Besprechung nahm sie kein Blatt vor den Mund.', note: 'Eine verbreitete Erklärung: Schauspieler hielten sich ein Blatt vor das Gesicht, um unerkannt Kritik zu äußern. Wer das nicht tat, sprach offen.' },
  { front: 'Aus dem Ruder laufen', back: 'Außer Kontrolle geraten.', example: 'Die Kosten für das Projekt sind völlig aus dem Ruder gelaufen.', note: 'Aus der Seefahrt: Ein Schiff, das nicht mehr auf das Ruder reagiert, lässt sich nicht mehr steuern.' },
]);

export const idiomsDeck: SeedDeck = {
  id: 'redewendungen',
  name: 'Redewendungen & ihre Herkunft',
  description: 'Was „blaumachen“ mit Färbern und die „lange Bank“ mit Gerichten zu tun hat.',
  icon: 'quote',
  color: 4,
  frontLang: 'de-DE',
  backLang: 'de-DE',
  cards: [...knights, ...trade, ...everyday, ...language],
};
