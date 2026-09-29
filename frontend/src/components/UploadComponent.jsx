import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function UploadComponent({ disabled, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInput = useRef(null);

  function selectFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setValidationError('O arquivo excede o limite de 10 MB.');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }

    setValidationError('');
    setSelectedFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || disabled || validationError) return;

    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      setValidationError('');
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`drop-zone${isDragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}
        htmlFor="document-file"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="upload-mark" aria-hidden="true">↑</span>
        <span className="drop-title">Solte um arquivo aqui</span>
        <span className="drop-caption">ou escolha no seu dispositivo</span>
        <input
          ref={fileInput}
          id="document-file"
          className="visually-hidden"
          type="file"
          disabled={disabled}
          onChange={(event) => selectFile(event.target.files[0])}
        />
      </label>

      <div className="upload-controls">
        <div className="selected-file" aria-live="polite">
          {selectedFile ? (
            <>
              <span className="file-dot" aria-hidden="true" />
              <span className="selected-name" title={selectedFile.name}>{selectedFile.name}</span>
              <span className="selected-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </>
          ) : (
            <span className="selection-hint">Nenhum arquivo selecionado</span>
          )}
        </div>
        <button className="button button-primary" type="submit" disabled={!selectedFile || disabled}>
          <span aria-hidden="true">↑</span>
          {disabled ? 'Enviando...' : 'Enviar documento'}
        </button>
      </div>
      {validationError && <p className="message message-error" role="alert">{validationError}</p>}
    </form>
  );
}