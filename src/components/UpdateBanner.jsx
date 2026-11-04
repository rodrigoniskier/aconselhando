/**
 * Aviso de nova versão disponível. Só atualiza quando a pessoa aceita,
 * para não perder uma conversa em andamento.
 */
export default function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div role="status" className="bg-green-700 text-white text-center text-sm font-semibold py-2 px-4">
      Nova versão disponível. A atualização recarrega a página e encerra a conversa atual.{' '}
      <button type="button" onClick={onUpdate} className="underline mr-3">
        Atualizar agora
      </button>
      <button type="button" onClick={onDismiss} className="underline">
        Depois
      </button>
    </div>
  );
}
