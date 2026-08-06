import { useEffect, useRef, useState } from 'react';
import HelperModal from './HelperModal';
import { requestHelperAnalysis, sendChatTurn } from '../services/geminiService';
import { formatMessageHtml } from '../utils/sanitize';

const INITIAL_GREETING = 'Olá. Estou pronto para começar nossa sessão. Por favor, comece me dizendo o que o traz aqui.';

const EVALUATION_PROMPT = `
  --- FIM DA SIMULAÇÃO ---

  Por favor, pare de atuar como o aconselhando.

  Agora, assuma a persona de um "Supervisor Sênior de Aconselhamento Bíblico, com teologia reformada e neocalvinista".

  Com base em toda a nossa conversa anterior (minhas falas como conselheiro e suas como aconselhando), por favor, forneça uma avaliação detalhada em TEXTO SIMLES.
  NÃO use nenhuma formatação Markdown (sem '#', '*', '---', '|', etc.).
  Use apenas quebras de linha, letras maiúsculas para títulos e numeração simples.
  Siga esta estrutura exatamente:

  AVALIAÇÃO DA SESSÃO

  1. PONTOS POSITIVOS
  (Liste os pontos onde minha abordagem foi biblicamente sólida, empática e tecnicamente correta.)

  2. PONTOS DE MELHORIA E SUGESTÕES
  (Liste áreas onde eu poderia ter sido mais eficaz, feito perguntas melhores, aplicado melhor a Escritura, ou evitado armadilhas. Seja específico e construtivo.)

  3. LIÇÕES BÍBLICAS E TEOLÓGICAS CHAVE
  (Quais são as principais doutrinas ou passagens bíblicas centrais para este caso específico que eu deveria focar?)

  4. ROTEIRO SUGERIDO
  (Descreva um breve roteiro ou plano de como uma sessão de aconselhamento ideal para esta situação poderia progredir, desde a coleta de dados até a aplicação da Palavra e o encorajamento.)
`;

const SUGGEST_QUESTION_PROMPT = `
  Atue como um Supervisor de Aconselhamento Bíblico reformado e neocalvinista.
  Analise o histórico do chat fornecido.
  Forneça 3 perguntas curtas e diretas que o conselheiro (user) pode fazer a seguir para aprofundar a conversa ou confrontar gentilmente o aconselhando (model).
  Responda apenas com as 3 perguntas, numeradas.
`;

const FIND_VERSES_PROMPT = `
  Atue como um assistente de teologia.
  Analise o histórico do chat, focando no ÚLTIMO problema, emoção ou pecado expresso pelo aconselhando (model).
  Forneça 2-3 versículos bíblicos (referência e texto completo) que se aplicam diretamente a esse problema específico.
  Responda apenas com os versículos, sem comentários adicionais.
`;

/**
 * Tela de Chat de Aconselhamento
 */
export default function ChatScreen({ selectedCase, isOnline, onEndSession }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHelperLoading, setIsHelperLoading] = useState(false);
  const [helperContent, setHelperContent] = useState(null);

  const chatEndRef = useRef(null);
  const chatControllerRef = useRef(null);
  const helperControllerRef = useRef(null);

  const runChatTurn = async (history) => {
    chatControllerRef.current?.abort();
    const controller = new AbortController();
    chatControllerRef.current = controller;
    setIsLoading(true);

    try {
      const modelResponse = await sendChatTurn({
        history,
        systemPrompt: selectedCase.systemPrompt,
        signal: controller.signal,
      });
      setChatHistory((prev) => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Desculpe, ocorreu um erro ao processar sua resposta. Verifique sua conexão ou a configuração da API. (${error.message})`,
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
    setIsHelperLoading(true);
    setHelperContent(null);

    try {
      const response = await requestHelperAnalysis({
        systemPrompt,
        history: chatHistory,
        signal: controller.signal,
      });
      setHelperContent(response);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setHelperContent(`Desculpe, ocorreu um erro ao buscar sua assistência: ${error.message}`);
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

  const handleCloseModal = () => {
    helperControllerRef.current?.abort();
    setHelperContent(null);
    setIsHelperLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      {(isHelperLoading || helperContent) && (
        <HelperModal
          content={helperContent}
          isLoading={isHelperLoading}
          onClose={handleCloseModal}
        />
      )}

      <header className="bg-white shadow-md border-b border-slate-200 p-4 flex justify-between items-center z-10">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
          Sessão: <span className="text-blue-700">{selectedCase.title}</span>
        </h1>
        <button
          onClick={onEndSession}
          disabled={isBusy}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:bg-slate-400"
        >
          Encerrar Sessão
        </button>
      </header>

      <div className="bg-yellow-100 border-b-2 border-yellow-300 text-yellow-900 p-3 text-center font-semibold shadow-sm">
        <span className="font-bold">ATENÇÃO:</span> Esta conversa não é salva automaticamente. Copie e cole qualquer interação que deseje guardar.
      </div>

      <main className="flex-grow overflow-y-auto p-4 md:p-8 space-y-4">
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
                  className="prose prose-sm prose-blue"
                  dangerouslySetInnerHTML={{ __html: formatMessageHtml(msg.text) }}
                />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
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
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Digite sua resposta como conselheiro..."
            disabled={isBusy || !isOnline}
            className="flex-grow p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={isBusy || !isOnline || !userInput.trim()}
            className="bg-blue-600 text-white p-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleRequestEvaluation}
            disabled={isBusy || !isOnline}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Solicitar Avaliação
          </button>
          <button
            onClick={handleSuggestQuestion}
            disabled={isBusy || !isOnline}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            ✨ Sugerir Pergunta
          </button>
          <button
            onClick={handleFindVerses}
            disabled={isBusy || !isOnline}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            ✨ Buscar Versículos
          </button>
        </div>
      </footer>
    </div>
  );
}
