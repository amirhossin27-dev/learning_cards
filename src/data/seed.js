import { businessEnglishDeck } from './decks/business-english';
import { biasesDeck } from './decks/biases';
import { dockerKubernetesDeck } from './decks/docker-kubernetes';
import { englishGrammarDeck } from './decks/english-grammar';
import { financeDeck } from './decks/finance';
import { geographyDeck } from './decks/geography';
import { historyDeck } from './decks/history';
import { myVocabDeck } from './decks/my-vocab';
import { programmingDeck } from './decks/programming';
import { pythonDeck } from './decks/python';
import { spaceDeck } from './decks/space';
export const builtInDecks = [
    businessEnglishDeck,
    myVocabDeck,
    geographyDeck,
    programmingDeck,
    historyDeck,
    englishGrammarDeck,
    pythonDeck,
    dockerKubernetesDeck,
    // Decks of the week, oldest first (see decks/README.md).
    biasesDeck,
    spaceDeck,
    financeDeck,
];
