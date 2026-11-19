// A chave do Gemini fica no servidor (api/gemini.js, variável GEMINI_API_KEY).
// O navegador só conhece o endpoint do proxy.
export const GEMINI_API_URL = '/api/gemini';

// O proxy responde 503 quando a chave não está configurada; não há como
// saber isso no cliente, então o aviso de configuração deixa de existir.
export const isGeminiConfigured = true;
