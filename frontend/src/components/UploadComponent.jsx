import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function UploadComponent({ disabled, onUpload }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function selectFile(nextFile) {
    if (!nextFile) return;
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError('O arquivo excede o limite de 10 MB.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setError('');
    setFile(nextFile);
  }

  async function submit(event) {
    event.preventDefault();
    if (!file || disabled || error) return;
    if (await onUpload(file)) {
      setFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <form onSubmit={submit} className="upload-form">
      <label htmlFor="document-file" className="drop-zone">
        <strong>Selecione um documento</strong>
        <span>ou arraste um arquivo para esta área</span>
        <input ref={inputRef} id="document-file" type="file" disabled={disabled} onChange={(event) => selectFile(event.target.files[0])} />
      </label>
      <div className="upload-actions">
        <span title={file?.name}>{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : 'Nenhum arquivo selecionado'}</span>
        <button type="submit" disabled={!file || disabled || Boolean(error)}>{disabled ? 'Enviando...' : 'Enviar'}</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
