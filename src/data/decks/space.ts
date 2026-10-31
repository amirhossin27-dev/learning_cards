import type { SeedDeck } from '../seed';
import { group } from './util';

// Deck of the week, 2026-10-31.

const solarSystem = group('Sonnensystem', [
  { front: 'Wie viele Planeten hat unser Sonnensystem?', back: 'Acht: Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus, Neptun.', note: 'Eselsbrücke: „Mein Vater erklärt mir jeden Sonntag unseren Nachthimmel.“ Pluto gilt seit 2006 als Zwergplanet.' },
  { front: 'Welcher ist der größte Planet?', back: 'Jupiter – er hat mehr als doppelt so viel Masse wie alle anderen Planeten zusammen.' },
  { front: 'Welcher ist der heißeste Planet?', back: 'Die Venus, mit rund 465 °C an der Oberfläche – heißer als der sonnennähere Merkur.', note: 'Grund ist ihre dichte CO₂-Atmosphäre mit extremem Treibhauseffekt.' },
  { front: 'Was ist besonders an der Drehung der Venus?', back: 'Sie dreht sich rückwärts und so langsam, dass eine Drehung (rund 243 Erdtage) länger dauert als ein Umlauf um die Sonne (rund 225 Erdtage).' },
  { front: 'Wie lange braucht Sonnenlicht bis zur Erde?', back: 'Etwa 8 Minuten und 20 Sekunden.' },
  { front: 'Wie weit ist der Mond von der Erde entfernt?', back: 'Im Mittel rund 384.400 km.' },
  { front: 'Warum sehen wir immer dieselbe Seite des Mondes?', back: 'Er dreht sich in genau der Zeit einmal um sich selbst, in der er die Erde umrundet (gebundene Rotation).' },
  { front: 'Warum ist der Mars rot?', back: 'Sein Staub und Gestein enthalten viel Eisenoxid – also Rost.' },
  { front: 'Was ist der Olympus Mons?', back: 'Ein riesiger Vulkan auf dem Mars, rund 22 km hoch – etwa zweieinhalbmal so hoch wie der Mount Everest.' },
  { front: 'Wo liegt der Asteroidengürtel?', back: 'Zwischen Mars und Jupiter: ein Ring aus unzähligen Gesteinsbrocken.' },
  { front: 'Welcher Planet hat die auffälligsten Ringe?', back: 'Saturn. Seine Ringe bestehen vor allem aus Eis und Gestein.', note: 'Auch Jupiter, Uranus und Neptun haben Ringe, nur viel schwächere.' },
]);

const stars = group('Sterne & Galaxien', [
  { front: 'Was ist ein Lichtjahr?', back: 'Eine Entfernung, keine Zeit: die Strecke, die Licht in einem Jahr zurücklegt – rund 9,46 Billionen km.' },
  { front: 'Welcher Stern ist der Sonne am nächsten?', back: 'Proxima Centauri, rund 4,2 Lichtjahre entfernt.' },
  { front: 'Was für ein Stern ist die Sonne?', back: 'Ein gelber Zwerg – ein durchschnittlicher Stern, rund 4,6 Milliarden Jahre alt.' },
  { front: 'Was ist die Milchstraße?', back: 'Unsere Heimatgalaxie: eine Balkenspiralgalaxie mit schätzungsweise 100 bis 400 Milliarden Sternen.' },
  { front: 'Was ist die Andromedagalaxie?', back: 'Die große Nachbargalaxie der Milchstraße, rund 2,5 Millionen Lichtjahre entfernt.', note: 'Eines der fernsten Objekte, die man mit bloßem Auge sehen kann.' },
  { front: 'Was ist ein Schwarzes Loch?', back: 'Ein Bereich, in dem die Schwerkraft so stark ist, dass nicht einmal Licht entkommen kann.', note: 'Die Grenze heißt Ereignishorizont. 2019 wurde das erste Bild eines Schwarzen Lochs veröffentlicht (in der Galaxie M87).' },
  { front: 'Was ist eine Supernova?', back: 'Die gewaltige Explosion eines Sterns am Ende seines Lebens.' },
  { front: 'Wie alt ist das Universum?', back: 'Rund 13,8 Milliarden Jahre.' },
  { front: 'Wie alt ist die Erde?', back: 'Rund 4,5 Milliarden Jahre.' },
  { front: 'Was ist ein Exoplanet?', back: 'Ein Planet, der einen anderen Stern als die Sonne umkreist.', note: 'Inzwischen sind über 6.000 bestätigt.' },
  { front: 'Wie findet man den Polarstern?', back: 'Die hintere Kante des Großen Wagens etwa fünfmal nach oben verlängern.', note: 'Er steht fast genau über dem Nordpol und zeigt so die Nordrichtung.' },
]);

const spaceflight = group('Raumfahrt', [
  { front: 'Was war Sputnik 1?', back: 'Der erste künstliche Satellit, 1957 von der Sowjetunion gestartet.' },
  { front: 'Wer war der erste Mensch im Weltall?', back: 'Juri Gagarin, am 12. April 1961.' },
  { front: 'Wer war der erste Deutsche im All?', back: 'Sigmund Jähn aus der DDR, 1978.', note: 'Der erste Westdeutsche war Ulf Merbold, 1983.' },
  { front: 'Wer betrat als Letzter den Mond?', back: 'Eugene Cernan bei Apollo 17 im Dezember 1972.', note: 'Insgesamt haben zwölf Menschen den Mond betreten.' },
  { front: 'Was ist die ISS?', back: 'Die Internationale Raumstation: ein bewohntes Labor, das die Erde in rund 400 km Höhe etwa alle 90 Minuten umkreist.', note: 'Seit dem Jahr 2000 ständig bewohnt.' },
  { front: 'Was ist das James-Webb-Weltraumteleskop?', back: 'Das größte Weltraumteleskop, seit Ende 2021 im All. Es beobachtet im Infrarotbereich.', note: 'Es steht rund 1,5 Millionen km von der Erde entfernt am Lagrange-Punkt L2.' },
  { front: 'Was ist die Fluchtgeschwindigkeit?', back: 'Die Geschwindigkeit, die man braucht, um der Schwerkraft eines Himmelskörpers zu entkommen – bei der Erde rund 11,2 km/s.' },
  { front: 'Was war Artemis II?', back: 'Der erste bemannte Mondflug seit 1972: Im April 2026 flogen vier Astronauten in der Orion-Kapsel um den Mond und zurück.', note: 'Dabei entfernten sie sich weiter von der Erde als je ein Mensch zuvor.' },
]);

export const spaceDeck: SeedDeck = {
  id: 'weltraum',
  name: 'Weltraum & Astronomie',
  description: 'Planeten, Sterne und Raumfahrt – vom Sonnensystem bis zu Schwarzen Löchern.',
  icon: 'rocket',
  color: 1,
  frontLang: 'de-DE',
  backLang: 'de-DE',
  cards: [...solarSystem, ...stars, ...spaceflight],
};
