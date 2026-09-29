const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

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

async function upload(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    filePath: file.path,
  };

  try {
    await documentsRepository.create(document);
  } catch (error) {
    await documentsRepository.removeFile(file.path).catch(() => {});
    throw error;
  }

  return toPublicDocument(document);
}

async function list(owner) {
  const documents = await documentsRepository.findByOwner(owner);
  return documents.map(toPublicDocument);
}

async function getDownload(id, owner) {
  const document = await documentsRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  if (!(await documentsRepository.fileExists(document.filePath))) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return document;
}

module.exports = { upload, list, getDownload };