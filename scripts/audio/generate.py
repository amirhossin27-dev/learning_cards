"""Records the texts listed by `npm run audio:texts` as MP3 files.

Usage: python3 scripts/audio/generate.py <models-dir>

<models-dir> holds the Kokoro voice model from the sherpa-onnx releases
(kokoro-en-v0_19). Needs `pip install sherpa-onnx==1.12.26 numpy` (newer
versions require a lexicon for this model) and ffmpeg. Existing recordings
are kept, recordings for texts that no longer exist are removed, and
src/data/audioClips.json is rewritten to match public/audio/.
"""

import hashlib
import json
import os
import subprocess
import sys
import wave

import numpy as np
import sherpa_onnx

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEXTS = os.path.join(ROOT, 'node_modules/.cache/audio/texts.json')
AUDIO = os.path.join(ROOT, 'public/audio')
MANIFEST = os.path.join(ROOT, 'src/data/audioClips.json')

# Kokoro speakers: af_sarah (American) and bf_emma (British), both female.
SPEAKERS = {'en-US': 3, 'en-GB': 7}

# Trim the silence the model leaves around speech, keep a short tail so playback doesn't end abruptly.
TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08'


def clip_id(key: str, lang: str) -> str:
    # The voice is part of the name, so a new voice never collides with a cached old recording.
    return hashlib.sha1(f'{key}|kokoro-{SPEAKERS[lang]}'.encode('utf-8')).hexdigest()[:12]


def load_model(models: str) -> sherpa_onnx.OfflineTts:
    d = os.path.join(models, 'kokoro-en-v0_19')
    kokoro = sherpa_onnx.OfflineTtsKokoroModelConfig(
        model=f'{d}/model.onnx', voices=f'{d}/voices.bin', tokens=f'{d}/tokens.txt', data_dir=f'{d}/espeak-ng-data'
    )
    config = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=kokoro, num_threads=os.cpu_count() or 4))
    return sherpa_onnx.OfflineTts(config)


def record(tts: sherpa_onnx.OfflineTts, text: str, lang: str, path: str) -> None:
    audio = tts.generate(text, sid=SPEAKERS[lang], speed=1.0)
    if not audio.samples:
        raise RuntimeError(f'no audio for {text!r}')
    wav = path + '.wav'
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(audio.sample_rate)
        w.writeframes((np.clip(np.array(audio.samples), -1, 1) * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af', TRIM, '-ac', '1', '-b:a', '40k', path], check=True)
    os.remove(wav)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    with open(TEXTS, encoding='utf-8') as f:
        texts = json.load(f)
    os.makedirs(AUDIO, exist_ok=True)

    tts = None
    manifest = {}
    for i, item in enumerate(texts, 1):
        cid = clip_id(item['key'], item['lang'])
        path = os.path.join(AUDIO, f'{cid}.mp3')
        if not os.path.exists(path):
            tts = tts or load_model(sys.argv[1])
            record(tts, item['text'], item['lang'], path)
            print(f'{i}/{len(texts)} {item["key"]}', flush=True)
        manifest[item['key']] = cid

    keep = {f'{cid}.mp3' for cid in manifest.values()}
    for name in os.listdir(AUDIO):
        if name.endswith('.mp3') and name not in keep:
            os.remove(os.path.join(AUDIO, name))

    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(manifest.items())), f, ensure_ascii=False, indent=0)
        f.write('\n')
    print(f'{len(manifest)} recordings in public/audio')


if __name__ == '__main__':
    main()
