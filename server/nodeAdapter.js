// Adaptador para servidores Node simples (usado pelo `npm run dev` e `npm run preview`).
// Na Vercel, quem faz esse papel é api/gemini.js.
import { handleGeminiRequest } from './geminiProxy.js';
import { createDefaultRateLimiter, getClientId } from './rateLimiter.js';

const MAX_BODY_BYTES = 1_000_000;

function readJsonBody(req) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= MAX_BODY_BYTES) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY_BYTES) return resolve(undefined);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolve(undefined);
      }
    });
    req.on('error', () => resolve(undefined));
  });
}

export function createNodeMiddleware(env) {
  const rateLimiter = createDefaultRateLimiter(env);
  return async (req, res) => {
    const body = req.method === 'POST' ? await readJsonBody(req) : undefined;
    const result = await handleGeminiRequest({
      method: req.method,
      body,
      env,
      rateLimiter,
      clientId: getClientId(req.headers, req.socket?.remoteAddress),
    });
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
    res.end(JSON.stringify(result.body));
  };
}
