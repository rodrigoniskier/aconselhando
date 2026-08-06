/**
 * Tela de Boas-vindas e Preparação Espiritual
 */
export default function HomeScreen({ onStart }) {
  return (
    <div className="flex flex-col justify-center min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif tracking-tight">
          Plataforma de Treinamento em Aconselhamento Bíblico
        </h1>
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">

          <div className="bg-red-800 border-l-4 border-red-300 text-red-100 p-4 rounded-md mb-8 shadow-inner">
            <h3 className="font-bold text-lg mb-2">AVISO IMPORTANTE</h3>
            <p className="text-sm text-red-100 leading-relaxed">
              Este é um ambiente de treinamento simulado e não substitui o aconselhamento bíblico real. O objetivo é puramente didático e não visa resolver problemas reais.
            </p>
            <p className="text-sm text-red-100 leading-relaxed mt-2">
              Esta plataforma está em constante atualização para se aproximar de condições reais, mas permanece uma simulação com limitações. Pessoas com demandas reais devem buscar aconselhamento pastoral em sua igreja local.
            </p>
            <p className="text-sm text-red-100 leading-relaxed mt-2">
              Em casos específicos de saúde mental, angústia severa ou emergências, é fundamental procurar consulta médica ou outro profissional especializado. Não insira informações pessoais ou confidenciais de casos reais neste chat.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mb-4 text-blue-300">
            Uma Palavra ao Conselheiro
          </h2>
          <p className="text-lg md:text-xl font-serif leading-relaxed text-slate-200 mb-6">
            Aconselhador, antes de começar, lembre-se: esta não é uma obra de mera técnica, mas um ministério da Palavra. Você entra neste diálogo não com a sua própria sabedoria, mas como um embaixador de Cristo, um mordomo dos mistérios de Deus (1 Co 4:1).
          </p>
          <p className="text-lg md:text-xl font-serif leading-relaxed text-slate-200 mb-6">
            Nossa cosmovisão reformada nos ensina que só Deus, pelo Seu Espírito, pode mudar o coração (Ez 36:26). Nós somos apenas instrumentos. Aconselhar é um ato de <em className="italic">Coram Deo</em> – viver e falar perante a face de Deus.
          </p>
          <p className="text-lg md:text-xl font-serif leading-relaxed text-slate-200 mb-8">
            Que sua preparação seja em oração, sua ferramenta seja a Escritura Suficiente, e seu objetivo seja a glória de Deus na restauração do Seu povo.
          </p>
          <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-300 text-lg mb-8">
            "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção, para a educação na justiça, a fim de que o homem de Deus seja perfeito e perfeitamente habilitado para toda boa obra." (2 Timóteo 3:16-17)
          </blockquote>
          <button
            onClick={onStart}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-10 rounded-lg text-lg transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400"
          >
            Iniciar Treinamento
          </button>

          <div className="mt-10 pt-6 border-t border-slate-700 text-center text-slate-400 text-sm">
            <p>Desenvolvido por: Rodrigo Niskier Ferreira Barbosa</p>
            <p className="text-slate-500">Presbítero da Igreja Presbiteriana de Altiplano</p>
            <p className="text-slate-500">Seminarista do Seminário Presbiteriano do Norte</p>
          </div>

        </div>
      </div>
    </div>
  );
}
