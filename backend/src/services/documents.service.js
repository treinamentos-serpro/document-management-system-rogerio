const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');
const storageRepository = require('../repositories/storage.repository');

const maxDocumentsPerOwner = Number(process.env.MAX_DOCUMENTS_PER_OWNER ?? 100);
const maxStorageBytesPerOwner = Number(process.env.MAX_STORAGE_BYTES_PER_OWNER ?? 104857600);

if (!Number.isSafeInteger(maxDocumentsPerOwner) || maxDocumentsPerOwner <= 0) {
  throw new Error('MAX_DOCUMENTS_PER_OWNER deve ser um inteiro positivo.');
}

if (!Number.isSafeInteger(maxStorageBytesPerOwner) || maxStorageBytesPerOwner <= 0) {
  throw new Error('MAX_STORAGE_BYTES_PER_OWNER deve ser um inteiro positivo.');
}

function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function normalizeOriginalName(originalName) {
  const normalized = String(originalName || 'document')
    .replace(/[\u0000-\u001f\u007f]/g, '_')
    .slice(0, 255)
    .trim();
  return normalized || 'document';
}

async function upload(file, owner) {
  const usage = await documentsRepository.getUsageByOwner(owner);
  if (usage.count >= maxDocumentsPerOwner || usage.size + file.size > maxStorageBytesPerOwner) {
    await storageRepository.removeFile(file.path).catch(() => {});
    throw createError(413, 'STORAGE_QUOTA_EXCEEDED', 'A cota de armazenamento do usuário foi excedida.');
  }

  const document = {
    id: randomUUID(),
    originalName: normalizeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    filePath: file.path,
  };

  try {
    await documentsRepository.create(document);
  } catch (error) {
    await storageRepository.removeFile(file.path).catch(() => {});
    throw error;
  }

  return toPublicDocument(document);
}

async function list(owner) {
  const documents = await documentsRepository.findByOwner(owner);
  return documents.map(toPublicDocument);
}

async function getDownload(id, owner) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  const document = await documentsRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  if (!(await storageRepository.fileExists(document.filePath))) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return document;
}

module.exports = { upload, list, getDownload };