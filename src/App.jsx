import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import MenuScreen from './components/MenuScreen';
import ChatScreen from './components/ChatScreen';
import OfflineBanner from './components/OfflineBanner';
import { useScreenHistory } from './hooks/useScreenHistory';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { isGeminiConfigured } from './config/gemini';

/**
 * Componente Principal da Aplicação
 */
export default function App() {
  const { screen, navigateTo, goBack } = useScreenHistory('home');
  const [selectedCase, setSelectedCase] = useState(null);
  const isOnline = useOnlineStatus();

  const handleStart = () => navigateTo('menu');

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
    navigateTo('chat');
  };

  const handleEndSession = () => {
    setSelectedCase(null);
    goBack();
  };

  return (
    <>
      {!isOnline && <OfflineBanner />}
      {!isGeminiConfigured && (
        <div role="alert" className="bg-amber-600 text-white text-center text-sm font-semibold py-2 px-4">
          Chave da API Gemini não configurada. Configure VITE_GEMINI_API_KEY para usar o chat.
        </div>
      )}

      {screen === 'menu' && <MenuScreen onCaseSelect={handleCaseSelect} />}
      {screen === 'chat' && selectedCase && (
        <ChatScreen
          key={selectedCase.id}
          selectedCase={selectedCase}
          isOnline={isOnline}
          onEndSession={handleEndSession}
        />
      )}
      {(screen === 'home' || (screen === 'chat' && !selectedCase)) && (
        <HomeScreen onStart={handleStart} />
      )}
    </>
  );
}
