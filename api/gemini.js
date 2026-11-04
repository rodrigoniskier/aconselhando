// Função serverless da Vercel: POST /api/gemini
import { handleGeminiRequest } from '../server/geminiProxy.js';
import { createDefaultRateLimiter, getClientId } from '../server/rateLimiter.js';

// Fica fora do handler para sobreviver entre chamadas da mesma instância.
const rateLimiter = createDefaultRateLimiter(process.env);

export default async function handler(req, res) {
  const result = await handleGeminiRequest({
    method: req.method,
    body: req.body,
    env: process.env,
    rateLimiter,
    clientId: getClientId(req.headers, req.socket?.remoteAddress),
  });
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
  res.status(result.status).json(result.body);
}
