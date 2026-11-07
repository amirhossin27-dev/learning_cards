import type { SeedDeck } from '../seed';
import { group } from './util';

// Deck of the week, 2026-11-07.

const basics = group('Grundlagen', [
  { front: 'Was ist der Zinseszins?', back: 'Zinsen, die auf bereits gutgeschriebene Zinsen anfallen. So wächst Geld mit der Zeit immer schneller.', example: '1.000 € bei 5 % Zinsen pro Jahr werden in 10 Jahren zu rund 1.629 €, in 30 Jahren zu rund 4.322 €.', note: 'Darum lohnt es sich, früh mit dem Sparen anzufangen.' },
  { front: 'Was besagt die 72er-Regel?', back: '72 geteilt durch den Zinssatz ergibt ungefähr die Jahre, bis sich ein Betrag verdoppelt.', example: 'Bei 6 % Zinsen verdoppelt sich das Geld in etwa 12 Jahren.' },
  { front: 'Was ist Inflation?', back: 'Der allgemeine Anstieg der Preise. Mit demselben Geld kann man sich dadurch weniger kaufen.', note: 'Die Europäische Zentralbank strebt mittelfristig eine Inflationsrate von 2 % an.' },
  { front: 'Nominaler vs. realer Zins', back: 'Der nominale Zins ist der vereinbarte Zinssatz. Der reale Zins ist der nominale Zins minus Inflation.', example: '3 % Zinsen bei 2 % Inflation ergeben real nur etwa 1 % Zuwachs.' },
  { front: 'Was bedeutet Liquidität?', back: 'Wie schnell sich ein Vermögen in Bargeld umwandeln lässt – oder ob jemand seine Rechnungen zahlen kann.', note: 'Tagesgeld ist sehr liquide, eine Immobilie kaum.' },
  { front: 'Was ist ein Notgroschen?', back: 'Eine Rücklage für Unvorhergesehenes wie eine kaputte Waschmaschine oder Jobverlust.', note: 'Faustregel: drei bis sechs Monatsausgaben, jederzeit verfügbar, z. B. auf dem Tagesgeldkonto.' },
  { front: 'Wie hängen Rendite und Risiko zusammen?', back: 'Höhere Renditechancen gibt es fast nur mit höherem Risiko. Sichere Anlagen bringen meist wenig ein.', note: 'Wer hohe Rendite ohne Risiko verspricht, ist verdächtig.' },
]);

const investing = group('Sparen & Anlegen', [
  { front: 'Was ist eine Aktie?', back: 'Ein Anteil an einem Unternehmen. Wer sie besitzt, ist Miteigentümer und nimmt an Gewinn und Verlust teil.' },
  { front: 'Was ist eine Anleihe?', back: 'Ein Kredit an einen Staat oder ein Unternehmen, für den man feste Zinsen bekommt und am Ende das Geld zurück.', note: 'Auch: Rentenpapier oder Bond.' },
  { front: 'Was ist ein ETF?', back: 'Ein börsengehandelter Fonds, der einen Index wie den DAX oder MSCI World nachbildet – breit gestreut und günstig.', note: 'Exchange Traded Fund' },
  { front: 'Was bedeutet Diversifikation?', back: 'Das Geld auf viele verschiedene Anlagen verteilen, damit ein einzelner Verlust nicht so schwer wiegt.', note: 'Sinngemäß: Nicht alle Eier in einen Korb legen.' },
  { front: 'Was ist ein Sparplan?', back: 'Man legt regelmäßig einen festen Betrag an, z. B. jeden Monat 100 € in einen ETF.', note: 'Bei niedrigen Kursen kauft man so automatisch mehr Anteile (Cost-Average-Effekt).' },
  { front: 'Was ist eine Dividende?', back: 'Der Teil des Unternehmensgewinns, den eine Aktiengesellschaft an ihre Aktionäre ausschüttet.' },
  { front: 'Was ist der DAX?', back: 'Der wichtigste deutsche Aktienindex. Er bildet die 40 größten Unternehmen an der Frankfurter Börse ab.', note: 'Bis 2021 waren es 30 Unternehmen.' },
  { front: 'Was ist die Abgeltungsteuer?', back: 'Die Steuer auf Kapitalerträge wie Zinsen, Dividenden und Kursgewinne: 25 % plus Solidaritätszuschlag und gegebenenfalls Kirchensteuer.' },
  { front: 'Was ist der Sparerpauschbetrag?', back: 'Kapitalerträge bis 1.000 € im Jahr bleiben steuerfrei, bei Ehepaaren bis 2.000 €.', note: 'Dafür muss man der Bank einen Freistellungsauftrag erteilen.' },
  { front: 'Wie sicher ist Geld auf dem Bankkonto?', back: 'In der EU sind Einlagen bis 100.000 € pro Person und Bank gesetzlich abgesichert.', note: 'Das nennt man Einlagensicherung.' },
  { front: 'Bullenmarkt vs. Bärenmarkt', back: 'Bullenmarkt: Die Kurse steigen. Bärenmarkt: Die Kurse fallen.', note: 'Eselsbrücke: Der Bulle stößt mit den Hörnern nach oben, der Bär schlägt mit der Tatze nach unten.' },
]);

const credit = group('Kredite & Konto', [
  { front: 'Was ist ein Dispokredit?', back: 'Ein Kreditrahmen auf dem Girokonto, mit dem man ins Minus gehen kann – meist mit sehr hohen Zinsen.', note: 'Nur kurzfristig nutzen; für größere Beträge ist ein Ratenkredit günstiger.' },
  { front: 'Was ist der effektive Jahreszins?', back: 'Die Gesamtkosten eines Kredits pro Jahr in Prozent, einschließlich Gebühren.', note: 'Zum Vergleich von Krediten immer den effektiven, nicht den Sollzins nehmen.' },
  { front: 'Was ist die Schufa?', back: 'Eine Auskunftei, die Daten zur Kreditwürdigkeit sammelt. Banken und Vermieter fragen dort nach.', note: 'Eine kostenlose Kopie der eigenen Daten (Selbstauskunft) kann man dort jederzeit anfordern.' },
  { front: 'Was ist die Tilgung?', back: 'Der Teil einer Kreditrate, mit dem man die Schulden selbst zurückzahlt – im Unterschied zu den Zinsen.' },
  { front: 'Brutto vs. Netto beim Gehalt', back: 'Brutto ist das vereinbarte Gehalt, netto das, was nach Steuern und Sozialabgaben auf dem Konto ankommt.' },
]);

const economy = group('Wirtschaft', [
  { front: 'Was ist das BIP?', back: 'Das Bruttoinlandsprodukt: der Wert aller Waren und Dienstleistungen, die in einem Land in einem Jahr hergestellt werden.' },
  { front: 'Was ist eine Rezession?', back: 'Ein Abschwung der Wirtschaft. Als Faustregel gilt: Das BIP schrumpft zwei Quartale hintereinander.' },
  { front: 'Was macht die EZB?', back: 'Die Europäische Zentralbank in Frankfurt sorgt für stabile Preise im Euroraum, vor allem über den Leitzins.' },
  { front: 'Warum erhöht eine Zentralbank den Leitzins?', back: 'Um die Inflation zu bremsen: Kredite werden teurer, es wird weniger gekauft und investiert.', note: 'Bei schwacher Wirtschaft senkt sie ihn umgekehrt.' },
  { front: 'Was ist Deflation?', back: 'Das Gegenteil der Inflation: Die Preise sinken über längere Zeit.', note: 'Klingt gut, ist aber gefährlich: Viele schieben Käufe auf, und die Wirtschaft stockt.' },
]);

export const financeDeck: SeedDeck = {
  id: 'finanzen',
  name: 'Geld & Finanzen',
  description: 'Zinseszins, ETF, Inflation und Co. – was man über Geld wissen sollte.',
  icon: 'piggy',
  color: 2,
  frontLang: 'de-DE',
  backLang: 'de-DE',
  cards: [...basics, ...investing, ...credit, ...economy],
};
