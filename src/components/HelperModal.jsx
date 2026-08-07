import { formatMessageHtml } from '../utils/sanitize';

/**
 * Modal para exibir respostas dos helpers (sugestão de perguntas, versículos, etc.)
 */
export default function HelperModal({ content, onClose, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all scale-100 opacity-100">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-blue-800">✨ Assistente do Conselheiro</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : (
            <div
              className="text-slate-800 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMessageHtml(content) }}
            />
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
