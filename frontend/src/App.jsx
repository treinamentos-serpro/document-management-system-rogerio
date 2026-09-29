import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from './services/documentsApi.js';

function getStoredUserId() {
  return window.localStorage.getItem('dms-user-id') || 'usuario-123';
}

export default function App() {
  const [userId, setUserId] = useState(getStoredUserId);
  const [userDraft, setUserDraft] = useState(getStoredUserId);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setError('');
      try {
        const result = await listDocuments(userId);
        if (isCurrent) setDocuments(result);
      } catch (requestError) {
        if (isCurrent) setError(requestError.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextUserId = userDraft.trim();
    if (!nextUserId) {
      setError('Informe um identificador para consultar seus documentos.');
      return;
    }

    window.localStorage.setItem('dms-user-id', nextUserId);
    setError('');
    setNotice('');
    setUserDraft(nextUserId);
    setUserId(nextUserId);
  }

  async function handleUpload(file) {
    setError('');
    setNotice('');
    setIsUploading(true);
    try {
      const document = await uploadDocument(file, userId);
      setDocuments((currentDocuments) => [document, ...currentDocuments]);
      setNotice(`${document.originalName} foi enviado.`);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setError('');
    setNotice('');
    setDownloadingId(document.id);
    try {
      await downloadDocument(document, userId);
      setNotice(`${document.originalName} está pronto para baixar.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="DMS, início">
          <span className="brand-mark">D</span>
          <span>DOCS<span className="brand-light">/LOCAL</span></span>
        </a>
        <span className="connection-status"><span /> ARMAZENAMENTO LOCAL</span>
      </header>

      <div className="workspace" id="top">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">DOCUMENT MANAGEMENT SYSTEM <span> / 01</span></p>
          <h1 id="page-title">Tudo em <em>ordem.</em></h1>
          <p className="intro-copy">Seus arquivos, reunidos em um só lugar.</p>
        </section>

        <form className="identity-form" onSubmit={handleUserSubmit}>
          <label htmlFor="user-id">IDENTIFICADOR</label>
          <div className="identity-controls">
            <input
              id="user-id"
              value={userDraft}
              onChange={(event) => setUserDraft(event.target.value)}
              autoComplete="username"
              spellCheck="false"
            />
            <button className="button button-quiet" type="submit">Acessar</button>
          </div>
          <span className="identity-note">Identificador local, sem autenticação</span>
        </form>

        <div className="status-messages" aria-live="polite">
          {error && <p className="message message-error" role="alert">{error}</p>}
          {notice && <p className="message message-success" role="status">{notice}</p>}
        </div>

        <div className="content-grid">
          <section className="upload-section" aria-labelledby="upload-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ADICIONAR AO ARQUIVO</p>
                <h2 id="upload-title">Novo documento</h2>
              </div>
              <span className="section-index">01</span>
            </div>
            <UploadComponent disabled={isUploading} onUpload={handleUpload} />
            <p className="upload-footnote">Um arquivo por envio <span>·</span> limite padrão de 10 MB</p>
          </section>

          <DocumentList
            documents={documents}
            loading={isLoading}
            downloadingId={downloadingId}
            onDownload={handleDownload}
          />
        </div>
      </div>
      <footer className="page-footer">
        <span>DMS <span className="footer-divider">/</span> ARQUIVO PESSOAL</span>
        <span>ARMAZENADO NESTE DISPOSITIVO</span>
      </footer>
    </main>
  );
}
