import { useEffect, useRef, useState } from 'react';
import HelperModal from './HelperModal';
import { GeminiError, requestHelperAnalysis, sendChatTurn } from '../services/geminiService';
import { formatMessageHtml } from '../utils/sanitize';
import { formatTranscript } from '../utils/transcript';
import {
  EVALUATION_PROMPT,
  FIND_VERSES_PROMPT,
  INITIAL_GREETING,
  buildPersonaPrompt,
  SUGGEST_QUESTION_PROMPT,
} from '../config/prompts';

const GENERIC_ERROR = 'Ocorreu um erro inesperado. Tente de novo.';

// Mostra ao usuário só a mensagem amigável; o detalhe técnico vai para o console.
function toUserMessage(error) {
  console.error('Erro ao falar com a IA:', error);
  return error instanceof GeminiError ? error.message : GENERIC_ERROR;
}

/**
 * Tela de Chat de Aconselhamento
 */
export default function ChatScreen({ selectedCase, isOnline, onEndSession }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHelperLoading, setIsHelperLoading] = useState(false);
  const [helperContent, setHelperContent] = useState(null);
  const [helperFailed, setHelperFailed] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);

  const chatEndRef = useRef(null);
  const chatControllerRef = useRef(null);
  const helperControllerRef = useRef(null);
  const lastChatHistoryRef = useRef(null);
  const lastHelperPromptRef = useRef(null);

  const runChatTurn = async (history) => {
    chatControllerRef.current?.abort();
    const controller = new AbortController();
    chatControllerRef.current = controller;
    lastChatHistoryRef.current = history;
    setIsLoading(true);

    try {
      const modelResponse = await sendChatTurn({
        // Mensagens de erro da tela nunca vão para a IA.
        history: history.filter((msg) => !msg.isError),
        systemPrompt: buildPersonaPrompt(selectedCase.systemPrompt),
        signal: controller.signal,
      });
      setChatHistory((prev) => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: toUserMessage(error),
          isError: true,
        },
      ]);
    } finally {
      if (chatControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const runHelper = async (systemPrompt) => {
    helperControllerRef.current?.abort();
    const controller = new AbortController();
    helperControllerRef.current = controller;
    lastHelperPromptRef.current = systemPrompt;
    setIsHelperLoading(true);
    setHelperContent(null);
    setHelperFailed(false);

    try {
      const response = await requestHelperAnalysis({
        systemPrompt,
        history: chatHistory,
        signal: controller.signal,
      });
      setHelperContent(response);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setHelperFailed(true);
      setHelperContent(toUserMessage(error));
    } finally {
      if (helperControllerRef.current === controller) {
        setIsHelperLoading(false);
      }
    }
  };

  // Inicia a conversa assim que o caso é selecionado. A IA (aconselhando) fala primeiro.
  useEffect(() => {
    setChatHistory([]);
    runChatTurn([{ role: 'user', text: INITIAL_GREETING }]);

    return () => {
      chatControllerRef.current?.abort();
      helperControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const isBusy = isLoading || isHelperLoading;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim() || isBusy || !isOnline) return;

    const newHistory = [...chatHistory, { role: 'user', text: userInput.trim() }];
    setChatHistory(newHistory);
    setUserInput('');
    runChatTurn(newHistory);
  };

  const handleRequestEvaluation = () => {
    if (isBusy || !isOnline) return;
    const newHistory = [...chatHistory, { role: 'user', text: EVALUATION_PROMPT, isMeta: true }];
    setChatHistory(newHistory);
    runChatTurn(newHistory);
  };

  const handleSuggestQuestion = () => {
    if (isBusy || !isOnline) return;
    runHelper(SUGGEST_QUESTION_PROMPT);
  };

  const handleFindVerses = () => {
    if (isBusy || !isOnline) return;
    runHelper(FIND_VERSES_PROMPT);
  };

  const hasConversation = chatHistory.some((msg) => msg.role === 'user');

  const handleEndSessionClick = () => {
    if (hasConversation) {
      const confirmed = window.confirm(
        'Encerrar a sessão? A conversa não é salva e será perdida. Use "Copiar conversa" antes, se quiser guardá-la.',
      );
      if (!confirmed) return;
    }
    onEndSession();
  };

  const handleCopyConversation = async () => {
    try {
      await navigator.clipboard.writeText(formatTranscript(chatHistory));
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    setTimeout(() => setCopyStatus(null), 3000);
  };

  const handleRetryChat = () => {
    if (isBusy || !isOnline || !lastChatHistoryRef.current) return;
    setChatHistory((prev) => prev.filter((msg) => !msg.isError));
    runChatTurn(lastChatHistoryRef.current);
  };

  const handleRetryHelper = () => {
    if (isBusy || !isOnline || !lastHelperPromptRef.current) return;
    runHelper(lastHelperPromptRef.current);
  };

  const handleCloseModal = () => {
    helperControllerRef.current?.abort();
    setHelperFailed(false);
    setHelperContent(null);
    setIsHelperLoading(false);
  };

  return (
    <div className="flex flex-col h-dvh bg-slate-100 font-sans">
      {(isHelperLoading || helperContent) && (
        <HelperModal
          content={helperContent}
          isLoading={isHelperLoading}
          onClose={handleCloseModal}
          onRetry={helperFailed ? handleRetryHelper : undefined}
        />
      )}

      <header className="bg-white shadow-md border-b border-slate-200 p-4 flex justify-between items-center z-10">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
          Sessão: <span className="text-blue-700">{selectedCase.title}</span>
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyConversation}
            disabled={!chatHistory.some((msg) => !msg.isError)}
            className="bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:bg-slate-300 disabled:text-slate-600"
          >
            {copyStatus === 'copied' ? 'Copiado!' : copyStatus === 'failed' ? 'Não foi possível copiar' : 'Copiar conversa'}
          </button>
        <button
          onClick={handleEndSessionClick}
          disabled={isBusy}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:bg-slate-300 disabled:text-slate-600"
        >
          Encerrar Sessão
        </button>
        </div>
      </header>

      <div className="bg-yellow-100 border-b-2 border-yellow-300 text-yellow-900 p-3 text-center font-semibold shadow-sm">
        <span className="font-bold">ATENÇÃO:</span> Simulação de treinamento com personagem fictício. Esta conversa não é salva automaticamente: use "Copiar conversa" para guardar. Em caso de sofrimento real, ligue 188 (CVV, 24 horas).
      </div>

      <main
        role="log"
        aria-live="polite"
        aria-label="Conversa de aconselhamento"
        className="flex-grow overflow-y-auto p-4 md:p-8 space-y-4"
      >
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`p-4 rounded-xl shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-800 border border-slate-200'
              } ${msg.isError ? 'bg-red-100 border-red-300 text-red-800' : ''}`}
            >
              {msg.isMeta ? (
                <p className="italic font-semibold">[Solicitação de avaliação enviada...]</p>
              ) : (
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessageHtml(msg.text) }}
                />
              )}
              {msg.isError && index === chatHistory.length - 1 && (
                <button
                  type="button"
                  onClick={handleRetryChat}
                  disabled={isBusy || !isOnline}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg disabled:bg-slate-300 disabled:text-slate-600"
                >
                  Tentar de novo
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start" role="status" aria-label="A IA está respondendo">
            <div className="bg-white text-slate-800 border border-slate-200 p-4 rounded-xl shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="bg-white border-t-2 border-slate-200 p-4 md:p-6 shadow-up z-10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          <input
            type="text"
            aria-label="Sua resposta como conselheiro"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Digite sua resposta como conselheiro..."
            disabled={isBusy || !isOnline}
            className="flex-grow p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={isBusy || !isOnline || !userInput.trim()}
            className="bg-blue-600 text-white p-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-300 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleRequestEvaluation}
            disabled={isBusy || !isOnline}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            Solicitar Avaliação
          </button>
          <button
            onClick={handleSuggestQuestion}
            disabled={isBusy || !isOnline}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            ✨ Sugerir Pergunta
          </button>
          <button
            onClick={handleFindVerses}
            disabled={isBusy || !isOnline}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            ✨ Buscar Versículos
          </button>
        </div>
      </footer>
    </div>
  );
}
