# Arabisch → MP3

Webseite zum Umwandeln arabischer Texte in MP3-Dateien über die Google Cloud
Text-to-Speech API. Jede Zeile im Textfeld wird zu einer eigenen, ab 1
durchnummerierten MP3; alle Dateien lassen sich anschließend als ZIP herunterladen.

## Aufbau

- `public/index.html` – Formular, Fortschrittsliste, Audio-Vorschau, ZIP-Erzeugung im Browser
- `api/tts.js` – Serverless-Proxy auf `texttospeech.googleapis.com/v1/text:synthesize`
- `api/voices.js` – Key-Test und Liste der verfügbaren arabischen Stimmen
- `vercel.json` – Caching für alle Pfade deaktiviert (`no-store`)

## API-Key

Bevorzugt als Environment Variable in Vercel setzen:

    GOOGLE_TTS_API_KEY=AIza...

Ist sie nicht gesetzt, blendet die Seite ein Eingabefeld ein. Der Key wird dann
nur im `localStorage` des Browsers gehalten und pro Anfrage an die eigene
Serverless-Funktion geschickt – er landet nie im ausgelieferten HTML.

## Unterschiede zur ursprünglichen PHP-Funktion

- `audioEncoding` ist `MP3` statt `LINEAR16` (LINEAR16 liefert WAV).
- `pitch` ist ein Zahlenwert von -20 bis 20; `"1"` als String bedeutete in der
  alten Funktion eine leichte Anhebung, Standard ist `0`.
- `effectsProfileId` (`medium-bluetooth-speaker-class-device`) und
  `speakingRate` wurden übernommen.
