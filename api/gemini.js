// Função serverless da Vercel: POST /api/gemini
import { handleGeminiRequest } from '../server/geminiProxy.js';

export default async function handler(req, res) {
  const result = await handleGeminiRequest({
    method: req.method,
    body: req.body,
    env: process.env,
  });
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
  res.status(result.status).json(result.body);
}
