import React, { useState, useEffect, useRef } from 'react';



// --- Constantes da Aplicação ---



// URL da API do Gemini (usando o modelo especificado)

// A linha abaixo JÁ ESTÁ CORRIGIDA para funcionar com o Vercel.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;



// Definição dos casos de aconselhamento

const COUNSELING_CASES = [

  {

    id: 'case_01',

    title: 'Conflito Conjugal Crônico',

    description: 'Um casal que briga constantemente sobre finanças, criação de filhos e comunicação. O aconselhando está frustrado e cético.',

    // Este é o prompt do sistema que define a persona da IA

    systemPrompt: `

      Assuma a persona de 'Carlos', 42 anos, casado com 'Sandra' há 15 anos.

      Vocês têm dois filhos. Você está frustrado e cansado.

      Seu tom é inicialmente cético e um pouco defensivo.

      - Você sente que Sandra não o respeita e só o critica.

      - Vocês não conseguem concordar sobre o orçamento; você a acha gastadora, ela o acha controlador.

      - Você trabalha muito e sente que não é apreciado.

      - Você está aqui quase por obrigação, porque "ela disse que era a última chance".

      - Não use jargões de "igrejês". Fale como uma pessoa real e frustrada.

    `

  },

  {

    id: 'case_02',

    title: 'Ansiedade e Culpa',

    description: 'Uma jovem mãe lutando contra ansiedade, culpa e sentimentos de sobrecarga, questionando sua própria fé.',

    systemPrompt: `

      Assuma a persona de 'Ana', 28 anos, mãe de um bebê de 6 meses.

      Seu tom é ansioso, cansado e cheio de culpa.

      - Você ama seu bebê, mas se sente constantemente sobrecarregada e triste.

      - Você tem crises de ansiedade e pensamentos negativos o futuro.

      - Você se sente culpada por não "confiar em Deus o suficiente" ou não "ter mais alegria".

      - Pessoas na igreja disseram para você "apenas orar mais", e isso a fez se sentir pior.

      - Você tem medo de estar falhando como mãe e como cristã.

    `

  },

  {

    id: 'case_03',

    title: 'Adolescente com Crise de Fé',

    description: 'Um estudante universitário que cresceu na igreja, mas agora está cheio de dúvidas sobre a Bíblia, ciência e a existência de Deus.',

    systemPrompt: `

      Assuma a persona de 'Lucas', 19 anos, calouro na universidade.

      Seu tom é inquisitivo, um pouco arrogante, mas também assustado.

      - Você cresceu em um lar cristão reformado e sempre "soube" as respostas.

      - Suas aulas de biologia e filosofia o fizeram questionar a veracidade de Gênesis e a moralidade bíblica.

      - Você vê hipocrisia na igreja e se sente atraído por argumentos ateístas.

      - Você está aqui porque seus pais insistiram, mas parte de você realmente quer respostas.

      - Você fará perguntas difíceis sobre ciência vs. fé, o problema do mal e a confiabilidade da Bíblia.

    `

  },

  {

    id: 'case_04',

    title: 'Luta Secreta com Pecado',

    description: 'Um homem casado que luta secretamente contra um vício (pornografia) e está com medo e vergonha de procurar ajuda.',

    systemPrompt: `

      Assuma a persona de 'Daniel', 35 anos, casado, líder do louvor.

      Seu tom é envergonhado, hesitante e cheio de auto-aversão.

      - Você vai demorar a admitir o problema real. Comece falando sobre "estresse" e "pressão".

      - O problema real é um vício em pornografia que já dura anos.

      - Você se sente um hipocípocrita total, especialmente na igreja.

      - Você já tentou parar "sozinho" com oração e jejum, mas sempre falha.

      - Você tem pavor que sua esposa ou alguém da igreja descubra.

      - Você está desesperado por mudança, mas teme o processo de confissão.

    `

  },

  // --- NOVOS CASOS ADICIONADOS ---

  {

    id: 'case_05',

    title: 'Gestão do Tempo e Prioridades (Chão de Fábrica)',

    description: 'Uma mãe sobrecarregada que negligencia sua vida devocional, sentindo-se culpada mas justificando-se pelo cansaço.',

    systemPrompt: `

      Assuma a persona de 'Marta', 38 anos, mãe de dois filhos pequenos e trabalha meio período.

      Seu tom é cansado, justificador e um pouco ansioso.

      - Você se sente exausta o tempo todo.

      - Você "sabe" que deveria ler mais a Bíblia e orar, mas diz que "não tem tempo".

      - Você se sente culpada, mas também se justifica dizendo que está fazendo o melhor que pode.

      - Você espera que o conselheiro lhe dê uma "dica rápida" ou "validação", e não mais um fardo.

    `

  },

  {

    id: 'case_06',

    title: 'Dificuldade em Perdoar (Amargura)',

    description: 'Um homem mais velho que se recusa a perdoar um ex-sócio da igreja que o prejudicou financeiramente, justificando sua amargura.',

    systemPrompt: `

      Assuma a persona de 'Roberto', 55 anos, empresário.

      Seu tom é justo, teimoso e amargurado.

      - Você foi traído financeiramente por um ex-sócio, que also é membro da igreja, há dois anos.

      - Você não consegue perdoar. Você quer "justiça", não "graça".

      - Você cita a Bíblia para justificar sua raiva (ex: "olho por olho").

      - Sua esposa o forçou a vir, pois sua amargura está afetando a família.

      - Você é muito reticente em admitir seu próprio pecado de falta de perdão.

    `

  },

  {

    id: 'case_07',

    title: 'Pecado Contumaz com Justificação (Complexo)',

    description: 'Um jovem casal vivendo em coabitação, que vê a posição da igreja como "antiquada" e está pronto para debater e se justificar.',

    systemPrompt: `

      Assuma a persona de 'Tiago', 25 anos. Você está aqui "representando" você e sua namorada 'Julia'.

      Vocês estão morando juntos há 6 meses. Seu tom é desafiador, defensivo e um pouco arrogante.

      - Você foi confrontado por um presbítero e concordou em vir, mas "só para ser ouvido".

      - Você acha que as regras da igreja sobre coabitação são legalistas e antiquadas.

      - Você diz: "Nós nos amamos", "Qual é o problema? Deus não olha o coração?", "O papel do casamento é só burocracia".

      - Você é teimoso e vê o conselheiro como um inquisidor. Você está pronto para debater e justificar suas ações.

    `

  },

  {

    id: 'case_08',

    title: 'Membro Divisivo e Manipulador (Complexo)',

    description: 'Uma membro antiga da igreja que causa fofoca e divisão, mas se coloca como vítima e nega qualquer responsabilidade.',

    systemPrompt: `

      Assuma a persona de 'Dona Elza', 63 anos, membro da igreja há 40 anos.

      Seu tom é doce na superfície, mas manipulador, defensivo e passivo-agressivo.

      - Você está aqui porque o pastor pediu, após múltiplos relatos de que você está causando divisão (fofoca, panelinhas, crítica velada).

      - Você nega tudo veementemente. Você se faz de vítima: "Eu só estava tentando ajudar", "As pessoas são muito sensíveis hoje em dia".

      - Você usa sua antiguidade na igreja como escudo.

      - Você tentará desviar a conversa para os pecados dos *outros* ou para como *você* está sendo perseguida.

      - Você é highly reticente em admitir qualquer falha pessoal.

    `

  }

];



// --- Componentes da UI ---



/**

 * Tela de Boas-vindas e Preparação Espiritual

 */

function HomeScreen({ onStart }) {

  return (

    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8 font-sans">

      <div className="max-w-3xl text-center">

        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif tracking-tight">

          Plataforma de Treinamento em Aconselhamento Bíblico

        </h1>

        <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">



          {/* --- NOVO AVISO DE SEGURANÇA --- */}

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

          {/* --- FIM DO AVISO --- */}



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



          {/* --- INFORMAÇÕES DO DESENVOLVEDOR --- */}

          <div className="mt-10 pt-6 border-t border-slate-700 text-center text-slate-400 text-sm">

            <p>Desenvolvido por: Rodrigo Niskier Ferreira Barbosa</p>

            <p className="text-slate-500">Presbítero da Igreja Presbiteriana de Altiplano</p>

            <p className="text-slate-500">Seminarista do Seminário Presbiteriano do Norte</p>

          </div>

          {/* --- FIM DAS INFORMAÇÕES --- */}



        </div>

      </div>

    </div>

  );

}



/**

 * Tela de Menu com os Casos (O COMPONENTE QUE FALTAVA)

 */

function MenuScreen({ onCaseSelect }) {

  return (

    <div className="min-h-screen bg-slate-100 p-8 md:p-12">

      <h1 className="text-4xl font-bold text-slate-800 text-center mb-4">

        Selecione um Cenário

      </h1>

      <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">

        Escolha um dos casos simulados abaixo para iniciar uma sessão de aconselhamento. A IA assumirá a persona do aconselhando.

      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

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



/**

 * Modal para exibir respostas dos helpers (O OUTRO COMPONENTE QUE FALTAVA)

 */

function HelperModal({ content, onClose, isLoading }) {

  return (

    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 font-sans">

      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all scale-100 opacity-100">

        <div className="p-5 border-b border-slate-200 flex justify-between items-center">

          <h3 className="text-xl font-bold text-blue-800">✨ Assistente do Conselheiro</h3>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>

        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">

          {isLoading ? (

            <div className="flex justify-center items-center h-32">

              <div className="flex items-center space-x-2">

                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>

                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>

                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>

              </div>

            </div>

          ) : (

            <div

              className="prose prose-sm prose-slate max-w-none"

              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}

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





/**

 * Tela de Chat de Aconselhamento

 */

function ChatScreen({ selectedCase, onEndSession }) {

  const [chatHistory, setChatHistory] = useState([]);

  const [userInput, setUserInput] = useState("");

  const [isLoading, setIsLoading] = useState(false); // Loading do chat principal

  const chatEndRef = useRef(null);



  // --- NOVOS ESTADOS PARA OS RECURSOS DA GEMINI API ---

  const [isHelperLoading, setIsHelperLoading] = useState(false); // Loading dos botões de ajuda

  const [helperContent, setHelperContent] = useState(null); // Conteúdo do modal de ajuda



  // Função para chamar a API do Gemini com retentativa

  async function fetchWithRetry(url, options, retries = 3, delay = 1000) {

    for (let i = 0; i < retries; i++) {

      try {

        const response = await fetch(url, options);

        if (response.ok) {

          return await response.json();

        }

        if (response.status === 429) { // Too Many Requests

          // console.warn(`Retrying request (attempt ${i + 1}/${retries}) due to 429...`);

          await new Promise(res => setTimeout(res, delay * (2 ** i))); // Exponential backoff

        } else {

          const errorText = await response.text();

          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);

        }

      } catch (error) {

        // console.error(`Fetch error (attempt ${i + 1}/${retries}):`, error.message);

        if (i === retries - 1) throw error;

        await new Promise(res => setTimeout(res, delay * (2 ** i)));

      }

    }

  }



  // Função genérica para chamar a API (para o chat principal)

  const callGeminiAPI = async (history) => {

    setIsLoading(true);



    const payload = {

      // Formata o histórico para a API

      contents: history.map(msg => ({

        role: msg.role === 'user' ? 'user' : 'model',

        parts: [{ text: msg.text }]

      })),

      // Adiciona o prompt do sistema que define a persona

      systemInstruction: {

        parts: [{ text: selectedCase.systemPrompt }]

      },

      generationConfig: {

        temperature: 0.7,

        topK: 1,

        topP: 1,

        maxOutputTokens: 2048,

      },

    };



    try {

      const result = await fetchWithRetry(API_URL, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

      });



      if (result.candidates && result.candidates.length > 0) {

        const modelResponse = result.candidates[0].content.parts[0].text;

        setChatHistory(prev => [...prev, { role: 'model', text: modelResponse }]);

      } else {

        throw new Error("Resposta da API inválida ou vazia.");

      }

    } catch (error) {

      // console.error("Erro ao chamar a API do Gemini:", error);

      const errorMessage = "Desculpe, ocorreu um erro ao processar sua resposta. Verifique sua conexão ou a configuração da API. (" + error.message + ")";

      setChatHistory(prev => [...prev, { role: 'model', text: errorMessage, isError: true }]);

    } finally {

      setIsLoading(false);

    }

  };

  

  // --- NOVA FUNÇÃO: Chamar a API para os "helpers" (sem afetar o chat principal) ---

  const callGeminiHelper = async (systemPrompt, history) => {

    setIsHelperLoading(true);

    setHelperContent(null); // Limpa o conteúdo anterior



    // --- INÍCIO DA CORREÇÃO ---

    // Em vez de enviar o histórico de turnos (o que causa o erro 400),

    // vamos formatar o histórico como um único texto de análise.

    const historyText = history

      .map(msg => `${msg.role === 'user' ? 'Conselheiro' : 'Aconselhando'}: ${msg.text}`)

      .join('\n');

    

    const fullUserPrompt = `

      Aqui está o histórico da conversa para sua análise:

      ---

      ${historyText}

      ---

      Fim do histórico. Por favor, forneça sua assistência com base nisso.

    `;



    const payload = {

      // Agora, o 'contents' é sempre um único turno do usuário,

      // o que resolve o erro "end with a user role".

      contents: [

        { role: 'user', parts: [{ text: fullUserPrompt }] }

      ],

      systemInstruction: {

        parts: [{ text: systemPrompt }]

      },

      generationConfig: {

        temperature: 0.5, // Mais focado para helpers

        maxOutputTokens: 1024,

      },

    };

    // --- FIM DA CORREÇÃO ---



    try {

      const result = await fetchWithRetry(API_URL, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

      });



      if (result.candidates && result.candidates.length > 0) {

        const modelResponse = result.candidates[0].content.parts[0].text;

        setHelperContent(modelResponse); // Coloca a resposta no estado do modal

      } else {

        throw new Error("Resposta da API inválida.");

      }

    } catch (error)

 {

      // console.error("Erro ao chamar o helper da API:", error);

      // CORREÇÃO: Corrigido o erro de digitação ( "ax" -> " " + )

      setHelperContent("Desculpe, ocorreu um erro ao buscar sua assistência: " + error.message);

    } finally {

      // CORREÇÃO: Adicionado o bloco 'finally' que faltava para parar o loading do helper

      setIsHelperLoading(false);

    }

  };



  // Efeito para iniciar a conversa assim que o caso é selecionado

  // A IA (aconselhando) fala primeiro.

  useEffect(() => {

    if (selectedCase) {

      setChatHistory([]); // Limpa o histórico anterior

      setIsLoading(true);



      // Criamos um histórico "falso" inicial para a IA responder

      // O usuário diz "Olá" para que a IA se apresente.

      const initialHistory = [

        { role: 'user', text: "Olá. Estou pronto para começar nossa sessão. Por favor, comece me dizendo o que o traz aqui." }

      ];



      // Não mostramos o "Olá" inicial do usuário, apenas a resposta da IA.

      // Chamamos a API para obter a primeira fala do aconselhando.

      const getInitialResponse = async () => {

        const payload = {

          contents: initialHistory.map(msg => ({

            role: msg.role === 'user' ? 'user' : 'model',

            parts: [{ text: msg.text }]

          })),

          systemInstruction: {

            parts: [{ text: selectedCase.systemPrompt }]

          },

          generationConfig: {

            temperature: 0.7,

            topK: 1,

            topP: 1,

            maxOutputTokens: 2048,

          },

        };



        try {

          const result = await fetchWithRetry(API_URL, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(payload)

          });

          

          if (result.candidates && result.candidates.length > 0) {

            const modelResponse = result.candidates[0].content.parts[0].text;

            // Agora sim, iniciamos o histórico com a primeira fala do modelo

            setChatHistory([{ role: 'model', text: modelResponse }]);

          } else {

            throw new Error("Resposta da API inválida ou vazia.");

          }

        } catch (error) {

          // CORREÇÃO: Usando a função correta (setChatHistory) e corrigindo o erro de digitação

          const errorMessage = "Erro ao iniciar a simulação. " + error.message;

          setChatHistory([{ role: 'model', text: errorMessage, isError: true }]);

        } finally {

          // CORREÇÃO: Usando o 'setter' de loading correto (setIsLoading e não setIsHelperLoading)

      setIsLoading(false);

    }

  };

  

  getInitialResponse();



  } // <--- ESTA CHAVE ESTAVA FALTANDO. Ela fecha o "if (selectedCase)".



// eslint-disable-next-line react-hooks/exhaustive-deps

}, [selectedCase]);



// --- CORREÇÃO ESTRUTURAL: O CÓDIGO ABAIXO ESTAVA NO LUGAR ERRADO ---



// Efeito para rolar para o final do chat

useEffect(() => {

  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

}, [chatHistory]);



// Enviar uma nova mensagem

const handleSendMessage = (e) => {

  e.preventDefault();

  if (!userInput.trim() || isLoading || isHelperLoading) return;



  const newUserMessage = { role: 'user', text: userInput.trim() };

  const newHistory = [...chatHistory, newUserMessage];



  setChatHistory(newHistory);

  setUserInput("");

  callGeminiAPI(newHistory);

};



// Solicitar a avaliação final

const handleRequestEvaluation = () => {

  if (isLoading || isHelperLoading) return;



  // O 'evaluationPrompt' estava solto no código. Ele deve ser uma constante aqui.

  const evaluationPrompt = `

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



  const newUserMessage = { role: 'user', text: evaluationPrompt, isMeta: true };

  const newHistory = [...chatHistory, newUserMessage];



    setChatHistory(newHistory);

    callGeminiAPI(newHistory);

  };

  

  // --- NOVOS HANDLERS PARA RECURSOS DA GEMINI API ---



  // Handler para sugerir perguntas

  const handleSuggestQuestion = () => {

    const helperPrompt = `

      Atue como um Supervisor de Aconselhamento Bíblico reformado e neocalvinista.

      Analise o histórico do chat fornecido.

      Forneça 3 perguntas curtas e diretas que o conselheiro (user) pode fazer a seguir para aprofundar a conversa ou confrontar gentilmente o aconselhando (model).

      Responda apenas com as 3 perguntas, numeradas.

    `;

    callGeminiHelper(helperPrompt, chatHistory);

  };



  // Handler para buscar versículos

  const handleFindVerses = () => {

    const helperPrompt = `

      Atue como um assistente de teologia.

      Analise o histórico do chat, focando no ÚLTIMO problema, emoção ou pecado expresso pelo aconselhando (model).

      Forneça 2-3 versículos bíblicos (referência e texto completo) que se aplicam diretamente a esse problema específico.

      Responda apenas com os versículos, sem comentários adicionais.

    `;

    callGeminiHelper(helperPrompt, chatHistory);

  };



  // Handler para fechar o modal

  const handleCloseModal = () => {

    setHelperContent(null);

    setIsHelperLoading(false);

  };



  return (

    <div className="flex flex-col h-screen bg-slate-100 font-sans">

      {/* Modal de Ajuda da Gemini API (Renderiza se houver conteúdo ou se estiver carregando) */}

      {(isHelperLoading || helperContent) && (

        <HelperModal

          content={helperContent}

          isLoading={isHelperLoading}

          onClose={handleCloseModal}

        />

      )}



      {/* Cabeçalho */}

      <header className="bg-white shadow-md border-b border-slate-200 p-4 flex justify-between items-center z-10">

        <h1 className="text-xl md:text-2xl font-bold text-slate-800">

          Sessão: <span className="text-blue-700">{selectedCase.title}</span>

        </h1>

        <button

          onClick={onEndSession}

          disabled={isLoading || isHelperLoading}

          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:bg-slate-400"

        >

          Encerrar Sessão

        </button>

      </header>

      

      {/* AVISO IMPORTANTE */}

      <div className="bg-yellow-100 border-b-2 border-yellow-300 text-yellow-900 p-3 text-center font-semibold shadow-sm">

        <span className="font-bold">ATENÇÃO:</span> Esta conversa não é salva automaticamente. Copie e cole qualquer interação que deseje guardar.

      </div>



      {/* Área do Chat */}

      <main className="flex-grow overflow-y-auto p-4 md:p-8 space-y-4">

        {chatHistory.map((msg, index) => (

          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            <div

              className={`max-w-xs md:max-w-2xl p-4 rounded-xl shadow-md ${

                msg.role === 'user'

                  ? 'bg-blue-600 text-white'

                  // --- CORREÇÃO DO ERRO DE DIGITAÇÃO ---

                  // Troquei o '-' (traço) por ':' (dois pontos)

                  : 'bg-white text-slate-800 border border-slate-200'

              } ${msg.isError ? 'bg-red-100 border-red-300 text-red-800' : ''}`}

            >

              {/* Oculta o prompt de avaliação do usuário, mostrando apenas a resposta */}

              {msg.isMeta ? (

                <p className="italic font-semibold">[Solicitação de avaliação enviada...]</p>

              ) : (

                <div

                  className="prose prose-sm prose-blue"

                  dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}

                />

              )}

            </div>

          </div>

        ))}

        

        {isLoading && (

          <div className="flex justify-start">

            <div className="bg-white text-slate-800 border border-slate-200 p-4 rounded-xl shadow-md">

              <div className="flex items-center space-x-2">

                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>

                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>

                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>

              </div>

            </div>

          </div>

        )}

        <div ref={chatEndRef} />

      </main>



      {/* Área de Input */}

      <footer className="bg-white border-t-2 border-slate-200 p-4 md:p-6 shadow-up z-10">

        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">

          <input

            type="text"

            value={userInput}

            onChange={(e) => setUserInput(e.target.value)}

            placeholder="Digite sua resposta como conselheiro..."

            disabled={isLoading || isHelperLoading}

            className="flex-grow p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"

          />

          <button

            type="submit"

            disabled={isLoading || isHelperLoading || !userInput.trim()}

            className="bg-blue-600 text-white p-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"

          >

            Enviar

          </button>

        </form>

        {/* --- NOVO LAYOUT DE BOTÕES COM RECURSOS DA GEMINI API --- */}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">

          <button

            onClick={handleRequestEvaluation}

            disabled={isLoading || isHelperLoading}

            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-slate-400 disabled:cursor-not-allowed"

          >

            Solicitar Avaliação

          </button>

           <button

            onClick={handleSuggestQuestion}

            disabled={isLoading || isHelperLoading}

            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:bg-slate-400 disabled:cursor-not-allowed"

          >

            ✨ Sugerir Pergunta

          </button>

           <button

            onClick={handleFindVerses}

            disabled={isLoading || isHelperLoading}

            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-slate-400 disabled:cursor-not-allowed"

          >

            ✨ Buscar Versículos

          </Button>

        </div>

      </footer>

    </div>

  );

}



/**

 * Componente Principal da Aplicação

 */

export default function App() {

  const [screen, setScreen] = useState('home'); // 'home', 'menu', 'chat'

  const [selectedCase, setSelectedCase] = useState(null);



  const handleStart = () => {

    setScreen('menu');

  };



  const handleCaseSelect = (caseItem) => {

    setSelectedCase(caseItem);

    setScreen('chat');

  };



  const handleEndSession = () => {

    setSelectedCase(null);

    setScreen('menu');

  };



  // Renderização condicional da tela

  switch (screen) {

    case 'home':

      return <HomeScreen onStart={handleStart} />;

    case 'menu':

      return <MenuScreen onCaseSelect={handleCaseSelect} />;

    case 'chat':

      return <ChatScreen selectedCase={selectedCase} onEndSession={handleEndSession} />;

    default:

      return <HomeScreen onStart={handleStart} />;

  }

}
