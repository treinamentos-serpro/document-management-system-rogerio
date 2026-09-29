import DownloadButton from './DownloadButton.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export default function DocumentList({ documents, loading, downloadingId, onDownload }) {
  return (
    <section aria-labelledby="documents-title">
      <div className="section-title"><h2 id="documents-title">Seus documentos</h2><span>{documents.length}</span></div>
      {loading && <p>Carregando documentos...</p>}
      {!loading && documents.length === 0 && <p className="muted">Nenhum documento enviado.</p>}
      <ul className="document-list">
        {documents.map((document) => (
          <li key={document.id}>
            <div><strong title={document.originalName}>{document.originalName}</strong><small>{formatSize(document.size)} · {formatDate(document.uploadedAt)}</small></div>
            <DownloadButton document={document} disabled={downloadingId === document.id} onDownload={onDownload} />
          </li>
        ))}
      </ul>
    </section>
  );
}
