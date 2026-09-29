const API_PREFIX = '/api';

async function request(path, userId, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('X-User-Id', userId.trim());

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return response;
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', userId, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function listDocuments(userId) {
  const response = await request('/documents', userId);
  const payload = await response.json();
  return payload.documents;
}

export async function downloadDocument(document, userId) {
  const response = await request(
    `/documents/${encodeURIComponent(document.id)}/download`,
    userId,
  );
  const objectUrl = window.URL.createObjectURL(await response.blob());
  const downloadLink = window.document.createElement('a');

  downloadLink.href = objectUrl;
  downloadLink.download = document.originalName || 'document';
  downloadLink.hidden = true;
  window.document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
}