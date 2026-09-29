const path = require('node:path');
const documentsService = require('../services/documents.service');

function requireUserId(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return res.status(400).json({
      error: { code: 'USER_ID_REQUIRED', message: 'O cabeçalho X-User-Id é obrigatório.' },
    });
  }

  req.owner = owner;
  return next();
}

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
      });
    }

    const document = await documentsService.upload(req.file, req.owner);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentsService.list(req.owner);
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

function safeDownloadName(originalName) {
  const name = path.basename(originalName.replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '_');
  return name || 'document';
}

async function download(req, res, next) {
  try {
    const document = await documentsService.getDownload(req.params.id, req.owner);
    return res.download(document.filePath, safeDownloadName(document.originalName), (error) => {
      if (error) next(error);
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireUserId, upload, list, download };