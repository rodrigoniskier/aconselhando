import { COUNSELING_CASES } from '../data/counselingCases';

/**
 * Tela de Menu com os Casos
 */
export default function MenuScreen({ onCaseSelect }) {
  return (
    <div className="min-h-screen bg-slate-100 p-8 md:p-12">
      <h1 className="text-4xl font-bold text-slate-800 text-center mb-4">
        Selecione um Cenário
      </h1>
      <p className="text-lg text-slate-600 text-center mb-12 mx-auto">
        Escolha um dos casos simulados abaixo para iniciar uma sessão de aconselhamento. A IA assumirá a persona do aconselhando.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mx-auto">
        {COUNSELING_CASES.map((caseItem) => (
          <div
            key={caseItem.id}
            className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col"
          >
            <div className="p-8 flex-grow">
              <h2 className="text-2xl font-bold text-blue-800 mb-3">
                {caseItem.title}
              </h2>
              <p className="text-slate-700 text-base leading-relaxed">
                {caseItem.description}
              </p>
            </div>
            <div className="bg-slate-50 p-6">
              <button
                onClick={() => onCaseSelect(caseItem)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                Iniciar Sessão
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
