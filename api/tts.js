// Google Cloud Text-to-Speech proxy.
// Der API-Key kommt aus der Env-Var GOOGLE_TTS_API_KEY oder – als Fallback –
// aus dem Request-Body (dann wird er nur im Browser des Nutzers gespeichert).

const GOOGLE_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

module.exports = async (req, res) => {
  noStore(res);

  if (req.method === 'GET') {
    return res.status(200).json({ hasServerKey: Boolean(process.env.GOOGLE_TTS_API_KEY) });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await readBody(req);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const apiKey = process.env.GOOGLE_TTS_API_KEY || body.apiKey;

  if (!apiKey) {
    return res.status(400).json({
      error: 'Kein API-Key. Entweder GOOGLE_TTS_API_KEY als Environment Variable setzen oder den Key im Formular eintragen.'
    });
  }
  if (!text) {
    return res.status(400).json({ error: 'Kein Text übergeben.' });
  }

  const payload = {
    input: body.ssml ? { ssml: text } : { text },
    voice: {
      languageCode: body.languageCode || 'ar-XA',
      name: body.voice || 'ar-XA-Wavenet-A'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: Number(body.pitch ?? 0),
      speakingRate: Number(body.speakingRate ?? 1),
      effectsProfileId: ['medium-bluetooth-speaker-class-device']
    }
  };

  try {
    const response = await fetch(`${GOOGLE_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.audioContent) {
      const message = (data && data.error && data.error.message) || `Google API Fehler (HTTP ${response.status})`;
      return res.status(response.status === 200 ? 502 : response.status).json({ error: message });
    }
    return res.status(200).json({ audioContent: data.audioContent });
  } catch (err) {
    return res.status(502).json({ error: `Netzwerkfehler: ${err.message}` });
  }
};
