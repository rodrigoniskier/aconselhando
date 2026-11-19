// Função serverless (Vercel): mantém a chave do Gemini no servidor.
// O navegador envia apenas o corpo da requisição; a chave nunca chega ao cliente.
const MODEL = 'gemini-3.6-flash';
const MAX_BODY_BYTES = 64 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Serviço não configurado.' });
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Requisição grande demais.' });
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      },
    );
    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch {
    res.status(502).json({ error: 'Falha ao contatar o serviço de IA.' });
  }
}
