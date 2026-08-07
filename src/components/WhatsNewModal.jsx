import { APP_VERSION, WHATS_NEW } from '../config/appVersion';

/**
 * Pop-up exibido ao abrir o app quando há novidades ainda não vistas
 * nesta versão instalada.
 */
export default function WhatsNewModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-xl font-bold text-blue-800">🎉 Novidades da versão {APP_VERSION}</h3>
        </div>
        <div className="p-6">
          <ul className="list-disc pl-5 space-y-2 text-slate-800 text-sm leading-relaxed">
            {WHATS_NEW.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
