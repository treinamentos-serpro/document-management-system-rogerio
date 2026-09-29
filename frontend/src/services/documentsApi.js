const API_PREFIX = '/api';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request(path, userId, options = {}) {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    throw new ApiError('Informe um identificador de usuário.', 400, 'USER_ID_REQUIRED');
  }

  const headers = new Headers(options.headers);
  headers.set('X-User-Id', normalizedUserId);
  const response = await fetch(`${API_PREFIX}${path}`, { ...options, headers });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.error?.message || 'Não foi possível concluir a solicitação.', response.status, payload?.error?.code || 'REQUEST_FAILED');
  }
  return response;
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);
  return (await request('/upload', userId, { method: 'POST', body: formData })).json();
}

export async function listDocuments(userId) {
  const payload = await (await request('/documents', userId)).json();
  return payload.documents;
}

export async function downloadDocument(document, userId) {
  const response = await request(`/documents/${encodeURIComponent(document.id)}/download`, userId);
  const objectUrl = window.URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName || 'document';
  link.click();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
}
