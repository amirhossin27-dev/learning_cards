import { group } from './util';
// Added on request, 2026-11-08.
const tenses = group('Zeiten', [
    { front: 'She usually ___ (take) the bus to work.', back: 'takes (Simple Present)', example: 'She usually takes the bus, but today she is driving.', note: 'Gewohnheiten und Routinen → Simple Present. Signalwörter: usually, always, often, every day.' },
    { front: 'Look! It ___ (snow).', back: 'is snowing (Present Progressive)', example: 'Look! It is snowing outside.', note: 'Passiert genau jetzt → be + -ing.' },
    { front: 'I ___ (know) him for ten years.', back: 'have known', example: "I've known him for ten years.", note: 'Verben wie know, like, want und believe stehen fast nie in der -ing-Form. Darum nicht „have been knowing“.' },
    { front: 'I ___ (wait) for two hours!', back: 'have been waiting (Present Perfect Progressive)', example: "I've been waiting for two hours – where are you?", note: 'Betont die Dauer bis jetzt. Deutsch „Ich warte seit zwei Stunden“ – nie „I wait since two hours“.' },
    { front: 'When I arrived, the film ___ already ___ (start).', back: 'had … started (Past Perfect)', example: 'When I arrived, the film had already started.', note: 'Was vor einem anderen Ereignis in der Vergangenheit passiert war → had + 3. Form.' },
    { front: 'I ___ (read) when the phone rang.', back: 'was reading (Past Progressive)', example: 'I was reading when the phone rang.', note: 'Eine laufende Handlung (was/were + -ing) wird von einer kurzen unterbrochen (Simple Past).' },
    { front: 'will or going to? – Look at those clouds! It ___ rain.', back: "is going to (it's going to rain)", example: "Look at those clouds! It's going to rain. – Then I'll take an umbrella.", note: 'going to: Absicht oder klare Anzeichen. will: spontane Entscheidung, Vermutung, Versprechen.' },
    { front: "I ___ (meet) Tom at six tonight. It's in my calendar.", back: 'am meeting (Present Progressive für feste Pläne)', example: "I'm meeting Tom at six tonight.", note: 'Fest verabredete Termine in der Zukunft → Present Progressive.' },
    { front: 'The train ___ (leave) at 7:15 tomorrow.', back: 'leaves (Simple Present für Fahrpläne)', example: 'The train leaves at 7:15 tomorrow morning.', note: 'Fahrpläne, Programme und Öffnungszeiten → Simple Present, auch für die Zukunft.' },
    { front: 'By next summer, I ___ (finish) my degree.', back: 'will have finished (Future Perfect)', example: 'By next summer, I will have finished my degree.', note: 'Bis zu einem Zeitpunkt in der Zukunft abgeschlossen → will have + 3. Form. Signalwort: by.' },
    { front: 'I ___ live in Berlin, but now I live in Hamburg.', back: 'used to', example: 'I used to live in Berlin, but now I live in Hamburg.', note: 'used to + Grundform: früher regelmäßig oder dauerhaft, heute nicht mehr.' },
    { front: "I'm used to ___ (work) late.", back: 'working', example: "Don't worry, I'm used to working late.", note: 'be used to + -ing = an etwas gewöhnt sein. Nicht verwechseln mit used to + Grundform (früher).' },
    { front: 'Have you ever ___ (be) to Japan?', back: 'been', example: 'Have you ever been to Japan? – No, never.', note: 'Lebenserfahrung („schon einmal“) → Present Perfect mit ever oder never.' },
    { front: "been or gone? – Anna isn't here. She has ___ to Paris.", back: 'gone', example: "Anna isn't here – she has gone to Paris. I have been to Paris twice.", note: 'gone = hingefahren und noch dort. been = dort gewesen und wieder zurück.' },
]);
const sentences = group('Satzbau & Fragen', [
    { front: 'I ___ drink coffee in the morning. (always)', back: 'I always drink coffee …', example: 'I always drink coffee in the morning, and she is never late.', note: 'Häufigkeitswörter stehen vor dem Vollverb, aber nach „be“: She is never late.' },
    { front: 'Yesterday ___ (I / meet) Tom.', back: 'Yesterday I met Tom.', example: 'Yesterday I met Tom at the station.', note: 'Das Subjekt steht vor dem Verb, auch wenn der Satz mit einer Zeitangabe beginnt – anders als im Deutschen („Gestern traf ich Tom“).' },
    { front: '___ you like coffee?', back: 'Do', example: 'Do you like coffee? – Are you tired?', note: 'Fragen mit Vollverben brauchen do, does oder did. Nur bei be, can, will usw. stellt man einfach um.' },
    { front: 'Where ___ she work?', back: 'does', example: 'Where does she work? – She works in a bank.', note: 'Bei he, she, it: does – und das Verb verliert sein -s (nicht „does she works“).' },
    { front: "You're coming tonight, ___?", back: "aren't you", example: "You're coming tonight, aren't you? – You don't eat meat, do you?", note: 'Question Tags: positiver Satz → verneinter Anhang und umgekehrt. Wie „…, oder?“.' },
    { front: 'Who called you? or Who did you call?', back: 'Who called you? = Wer hat dich angerufen? Who did you call? = Wen hast du angerufen?', example: 'Who called you last night? – Who did you call?', note: 'Fragt who oder what nach dem Subjekt, fällt do/did weg.' },
    { front: 'Can you tell me where ___? (the station / is)', back: 'where the station is', example: 'Could you tell me where the station is?', note: 'In indirekten Fragen kein do und keine Umstellung: Wortstellung wie im Aussagesatz.' },
    { front: "I don't know ___. (anything / nothing)", back: 'anything', example: "I don't know anything about it. = I know nothing about it.", note: 'Keine doppelte Verneinung: don’t … anything oder nothing, nie „don’t know nothing“.' },
]);
const words = group('Artikel, Mengen & Vergleiche', [
    { front: 'a or an? – ___ hour, ___ university', back: 'an hour, a university', example: 'I waited an hour. She studies at a university in Leeds.', note: 'Es zählt der Laut, nicht der Buchstabe: an hour (h stumm), a university (gesprochen „ju“).' },
    { front: 'I love ___ music. (the or no article?)', back: 'kein Artikel: I love music.', example: "I love music, but I don't like the music in this bar.", note: 'Allgemeine Aussagen ohne the. Erst wenn es konkret wird: the music in this bar.' },
    { front: 'some or any? – Do you have ___ questions?', back: 'any', example: 'Do you have any questions? – Would you like some tea?', note: 'some in positiven Sätzen und Angeboten, any in Fragen und Verneinungen.' },
    { front: 'much or many? – How ___ people came?', back: 'many', example: 'How many people came? – How much time do we have?', note: 'many für Zählbares (people), much für Unzählbares (time, money). In positiven Sätzen klingt „a lot of“ natürlicher.' },
    { front: "a few or few? – I have ___ friends here, so I'm not lonely.", back: 'a few', example: "I have a few friends here. – Few people know that.", note: 'a few = einige (positiv), few = wenige, kaum welche (negativ). Genauso: a little / little.' },
    { front: 'Comparative of big, good and expensive?', back: 'bigger, better, more expensive', example: 'This phone is better and more expensive than mine.', note: 'Kurze Adjektive: -er (big → bigger). Lange: more. Unregelmäßig: good – better – best, bad – worse – worst.' },
    { front: 'than or then? – She is taller ___ me.', back: 'than', example: 'She is taller than me. Then we went home.', note: 'than = als (beim Vergleich), then = dann.' },
    { front: 'He is ___ tall ___ his brother.', back: 'as tall as', example: 'He is as tall as his brother, but not as fast.', note: 'Gleichheit: as … as (so … wie). Nicht „so tall like“.' },
    { front: 'I cut ___ while cooking.', back: 'myself', example: 'I cut myself while cooking. – Just relax!', note: 'Viele deutsche „sich“-Verben sind im Englischen nicht reflexiv: relax, remember, feel, meet.' },
    { front: "whose or who's?", back: "who's = who is / who has; whose = wessen", example: "Who's coming tonight? Whose jacket is this?", note: 'Wie bei its und it’s: Der Apostroph steht für ausgelassene Buchstaben.' },
]);
const verbs = group('Verben', [
    { front: 'buy, bring, think – past forms?', back: 'bought – bought, brought – brought, thought – thought', example: 'I bought a book, brought it home and thought about it all day.', note: 'Alle enden auf -ought. Nicht verwechseln: bought (kaufen) und brought (bringen).' },
    { front: 'take, write, speak – past forms?', back: 'took – taken, wrote – written, spoke – spoken', example: 'She has written three books and spoken at many conferences.' },
    { front: 'I enjoy ___ (swim).', back: 'swimming', example: 'I enjoy swimming in the lake.', note: 'Nach enjoy, finish, avoid, mind, suggest und keep folgt -ing.' },
    { front: 'I want ___ (learn) Spanish.', back: 'to learn', example: 'I want to learn Spanish next year.', note: 'Nach want, decide, hope, plan, agree, need und would like folgt to + Grundform.' },
    { front: 'stop smoking or stop to smoke?', back: 'stop smoking = mit dem Rauchen aufhören; stop to smoke = anhalten, um zu rauchen', example: 'He stopped smoking last year.', note: 'Auch bei remember, forget und try ändert die Form die Bedeutung.' },
    { front: "mustn't or don't have to?", back: "mustn't = darf nicht (Verbot); don't have to = muss nicht", example: "You mustn't smoke here. You don't have to come if you're busy.", note: 'Falle: „must not“ heißt nicht „muss nicht“!' },
    { front: 'I will ___ help you tomorrow. (can)', back: 'be able to', example: "I'll be able to help you tomorrow.", note: 'can hat keine Zukunfts- und keine Perfektform. Dafür: will be able to, have been able to.' },
    { front: 'should or must?', back: 'should = sollte (Rat); must = muss (Pflicht, Notwendigkeit)', example: 'You should see a doctor. You must wear a helmet.' },
    { front: 'They built the bridge in 1990. → The bridge ___', back: 'was built in 1990.', example: 'The bridge was built in 1990 by a Dutch company.', note: 'Passiv: be + 3. Form. Wer es getan hat, folgt mit by – wenn es wichtig ist.' },
    { front: 'I ___ my hair ___ yesterday. (cut)', back: 'had my hair cut', example: 'I had my hair cut yesterday.', note: 'have + Objekt + 3. Form = etwas machen lassen. „I cut my hair“ hieße: selbst geschnitten.' },
]);
const clauses = group('Nebensätze & Bedingungen', [
    { front: 'If I ___ (know), I would have helped you.', back: 'had known', example: 'If I had known, I would have helped you.', note: 'If-Satz Typ 3 (Vergangenheit, nicht mehr änderbar): If + Past Perfect, would have + 3. Form.' },
    { front: 'If you heat ice, it ___ (melt).', back: 'melts', example: 'If you heat ice, it melts.', note: 'Typ 0 für Allgemeingültiges: If + Present, Present.' },
    { front: 'I wish I ___ (have) more time.', back: 'had', example: 'I wish I had more time. I wish I had known earlier.', note: 'Wunsch zur Gegenwart: wish + Past. Zur Vergangenheit: wish + Past Perfect.' },
    { front: 'who, which or that? – The man ___ called you is my boss.', back: 'who (oder that)', example: 'The man who called you is my boss. The car which I bought is red.', note: 'who für Personen, which für Dinge, that für beides – aber nur ohne Kommas.' },
    { front: 'My brother, ___ lives in London, is a doctor.', back: 'who (nicht that)', example: 'My brother, who lives in London, is a doctor.', note: 'Zusatzinformation zwischen Kommas: nur who oder which, nie that.' },
    { front: '“I am tired,” she said. → She said that she ___ tired.', back: 'was', example: 'She said that she was tired.', note: 'Indirekte Rede: Die Zeit rückt meist eine Stufe zurück (am → was, will → would).' },
    { front: 'unless', back: 'wenn … nicht, es sei denn', example: "We'll go for a walk unless it rains.", note: 'unless = if not. Also nicht „unless it doesn’t rain“.' },
    { front: 'although or despite? – ___ the rain, we went out.', back: 'Despite', example: 'Despite the rain, we went out. Although it was raining, we went out.', note: 'despite + Nomen oder -ing, although + ganzer Satz.' },
]);
export const englishGrammarDeck = {
    id: 'englische-grammatik',
    name: 'Englische Grammatik',
    description: 'Zeiten, Satzbau, Artikel, Verben und Nebensätze – mit Eselsbrücken für Deutschsprachige.',
    icon: 'spellcheck',
    color: 3,
    frontLang: 'en-US',
    backLang: 'de-DE',
    cards: [...tenses, ...sentences, ...words, ...verbs, ...clauses],
};
