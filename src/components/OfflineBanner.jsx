export default function OfflineBanner() {
  return (
    <div
      role="alert"
      className="bg-red-700 text-white text-center text-sm font-semibold py-2 px-4"
    >
      Sem conexão com a internet. O chat não funcionará até a conexão voltar.
    </div>
  );
}
