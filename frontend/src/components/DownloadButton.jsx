export default function DownloadButton({ document, disabled, onDownload }) {
  return (
    <button
      className="button button-download"
      type="button"
      disabled={disabled}
      onClick={() => onDownload(document)}
      aria-label={`Baixar ${document.originalName}`}
      title={`Baixar ${document.originalName}`}
    >
      <span aria-hidden="true">↓</span>
      {disabled ? 'Baixando...' : 'Baixar'}
    </button>
  );
}