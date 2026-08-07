// Modelo Gemini utilizado pela aplicação.
export const GEMINI_MODEL = 'gemini-3.6-flash';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const isGeminiConfigured = Boolean(API_KEY);

export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
