import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentsApi.js';

function storedUserId() {
  return window.localStorage.getItem('dms-user-id') || 'usuario-123';
}

export default function App() {
  const [userId, setUserId] = useState(storedUserId);
  const [userDraft, setUserDraft] = useState(storedUserId);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    listDocuments(userId)
      .then((result) => active && setDocuments(result))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [userId]);

  function changeUser(event) {
    event.preventDefault();
    const nextUserId = userDraft.trim();
    if (!nextUserId) return setError('Informe um identificador de usuário.');
    window.localStorage.setItem('dms-user-id', nextUserId);
    setError('');
    setMessage('');
    setUserId(nextUserId);
  }

  async function upload(file) {
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const document = await uploadDocument(file, userId);
      setDocuments((current) => [document, ...current]);
      setMessage(`${document.originalName} enviado com sucesso.`);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function download(document) {
    setDownloadingId(document.id);
    setError('');
    try {
      await downloadDocument(document, userId);
      setMessage(`${document.originalName} pronto para download.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="app-shell">
      <header><strong>DMS</strong><span>ARMAZENAMENTO LOCAL</span></header>
      <section className="hero">
        <p>DOCUMENT MANAGEMENT SYSTEM</p>
        <h1>Seus documentos, em ordem.</h1>
        <p className="muted">Faça upload, consulte e baixe seus arquivos.</p>
      </section>
      <form className="identity-form" onSubmit={changeUser}>
        <label htmlFor="user-id">Identificador do usuário</label>
        <input id="user-id" value={userDraft} onChange={(event) => setUserDraft(event.target.value)} />
        <button type="submit">Acessar</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success" role="status">{message}</p>}
      <div className="content-grid">
        <section>
          <h2>Novo documento</h2>
          <UploadComponent disabled={uploading} onUpload={upload} />
        </section>
        <DocumentList
          documents={documents}
          loading={loading}
          downloadingId={downloadingId}
          onDownload={download}
        />
      </div>
      <footer>O armazenamento é local ao dispositivo.</footer>
    </main>
  );
}
