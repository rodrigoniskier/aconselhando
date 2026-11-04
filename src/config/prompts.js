// Textos de instrução enviados à IA. Ficam aqui, fora da tela, para facilitar revisão e testes.
export const INITIAL_GREETING = 'Olá. Estou pronto para começar nossa sessão. Por favor, comece me dizendo o que o traz aqui.';

export const EVALUATION_PROMPT = `
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

export const SUGGEST_QUESTION_PROMPT = `
  Atue como um Supervisor de Aconselhamento Bíblico reformado e neocalvinista.
  Analise o histórico do chat fornecido.
  Forneça 3 perguntas curtas e diretas que o conselheiro (user) pode fazer a seguir para aprofundar a conversa ou confrontar gentilmente o aconselhando (model).
  Responda apenas com as 3 perguntas, numeradas.
`;

export const FIND_VERSES_PROMPT = `
  Atue como um assistente de teologia.
  Analise o histórico do chat, focando no ÚLTIMO problema, emoção ou pecado expresso pelo aconselhando (model).
  Forneça 2-3 versículos bíblicos (referência e texto completo) que se aplicam diretamente a esse problema específico.
  Responda apenas com os versículos, sem comentários adicionais.
`;
