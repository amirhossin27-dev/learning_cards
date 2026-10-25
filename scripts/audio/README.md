# Aufnahmen für die Aussprache

Die englischen Wörter und Beispielsätze der mitgelieferten Stapel liegen als MP3 in `public/audio/`, in amerikanischer und britischer Aussprache. Anders als die Sprachausgabe des Browsers sind Aufnahmen auf dem iPhone auch im Stummmodus zu hören. `src/data/audioClips.json` ordnet jedem Text seine Datei zu. Texte ohne Aufnahme spricht weiterhin die Web Speech API.

Die Stimmen kommen aus [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0): `af_sarah` für Amerikanisch, `bf_emma` für Britisch.

## Neu erzeugen

Nach Änderungen an `src/data/decks/` fehlen Aufnahmen für neue Texte. So kommen sie dazu:

1. Modell `kokoro-en-v0_19.tar.bz2` aus den [sherpa-onnx-Releases](https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models) in einen Ordner entpacken.
2. `pip install sherpa-onnx==1.12.26 numpy` (neuere Versionen brauchen für dieses Modell ein Lexikon), dazu `ffmpeg`.
3. `npm run audio:texts` listet alle Texte.
4. `python3 scripts/audio/generate.py <Modell-Ordner>` nimmt fehlende Texte auf, löscht Aufnahmen ohne Text und schreibt `src/data/audioClips.json` neu.
