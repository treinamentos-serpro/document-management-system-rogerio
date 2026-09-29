import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function fileExtension(fileName) {
  const extension = fileName.split('.').pop();
  return extension && extension !== fileName ? extension.slice(0, 5).toUpperCase() : 'ARQ';
}

export default function DocumentList({ documents, loading, downloadingId, onDownload }) {
  return (
    <section className="document-section" aria-labelledby="documents-title">
      <div className="section-heading document-heading">
        <div>
          <p className="eyebrow">ARQUIVO PESSOAL</p>
          <h2 id="documents-title">Seus documentos</h2>
        </div>
        <span className="document-count" aria-label={`${documents.length} documentos`}>
          {String(documents.length).padStart(2, '0')}
        </span>
      </div>

      {loading && <p className="list-status" role="status">Atualizando documentos...</p>}

      {!loading && documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">—</span>
          <h3>Ainda não há documentos</h3>
          <p>Os arquivos enviados aparecerão aqui.</p>
        </div>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <span className="file-type" aria-hidden="true">
                {fileExtension(document.originalName)}
              </span>
              <div className="document-details">
                <span className="document-name" title={document.originalName}>
                  {document.originalName}
                </span>
                <span className="document-meta">
                  {formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatDate(document.uploadedAt)}
                </span>
              </div>
              <DownloadButton
                document={document}
                disabled={downloadingId === document.id}
                onDownload={onDownload}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}