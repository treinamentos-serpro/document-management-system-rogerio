export default function DownloadButton({ document, disabled, onDownload }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onDownload(document)} aria-label={`Baixar ${document.originalName}`}>
      {disabled ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
