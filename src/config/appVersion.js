import { version } from '../../package.json';

// Atualize WHATS_NEW a cada release com novidades relevantes para o usuário final.
// A versão vem do package.json (única fonte): para lançar uma versão nova, use
// `npm version <patch|minor|major>`. O pop-up de novidades usa APP_VERSION para
// mostrar cada resumo uma única vez por instalação (guardado no localStorage).
export const APP_VERSION = version;

export const WHATS_NEW = [
  'Modelo de IA atualizado para respostas mais naturais e variadas.',
  'Corrigido texto ilegível (branco sobre branco) nas caixas de "Sugerir Pergunta" e "Buscar Versículos".',
  'O botão "voltar" do Android agora navega entre as telas do app corretamente, em vez de fechar o aplicativo.',
  'Aviso exibido quando o dispositivo está sem conexão com a internet.',
];
