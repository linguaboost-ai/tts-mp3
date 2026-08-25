// Prüft den API-Key und liefert die verfügbaren Stimmen einer Sprache.

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

module.exports = async (req, res) => {
  noStore(res);

  const url = new URL(req.url, 'http://localhost');
  const languageCode = url.searchParams.get('languageCode') || 'ar-XA';
  const apiKey = process.env.GOOGLE_TTS_API_KEY || url.searchParams.get('apiKey');

  if (!apiKey) {
    return res.status(400).json({ error: 'Kein API-Key vorhanden.' });
  }

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?languageCode=${encodeURIComponent(languageCode)}&key=${encodeURIComponent(apiKey)}`
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = (data && data.error && data.error.message) || `HTTP ${response.status}`;
      return res.status(response.status).json({ error: message });
    }
    const voices = (data.voices || [])
      .map((v) => ({ name: v.name, gender: v.ssmlGender }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).json({ ok: true, voices });
  } catch (err) {
    return res.status(502).json({ error: `Netzwerkfehler: ${err.message}` });
  }
};
