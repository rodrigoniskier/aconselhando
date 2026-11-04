import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import MenuScreen from './components/MenuScreen';
import ChatScreen from './components/ChatScreen';
import OfflineBanner from './components/OfflineBanner';
import WhatsNewModal from './components/WhatsNewModal';
import { useScreenHistory } from './hooks/useScreenHistory';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useWhatsNew } from './hooks/useWhatsNew';

/**
 * Componente Principal da Aplicação
 */
export default function App() {
  const { screen, navigateTo, goBack, reloadNotice, dismissReloadNotice } = useScreenHistory('home');
  const [selectedCase, setSelectedCase] = useState(null);
  const isOnline = useOnlineStatus();
  const { visible: showWhatsNew, dismiss: dismissWhatsNew } = useWhatsNew();

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
      {showWhatsNew && <WhatsNewModal onClose={dismissWhatsNew} />}
      {!isOnline && <OfflineBanner />}
      {reloadNotice && screen === 'menu' && (
        <div role="status" className="bg-blue-100 text-blue-900 text-center text-sm font-semibold py-2 px-4">
          A página foi recarregada e a sessão anterior não é salva. Escolha um caso para recomeçar.{' '}
          <button type="button" onClick={dismissReloadNotice} className="underline">
            Entendi
          </button>
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
