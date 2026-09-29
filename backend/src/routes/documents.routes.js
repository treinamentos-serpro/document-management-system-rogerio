const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const documentsController = require('../controllers/documents.controller');

const storageDirectory = path.resolve(__dirname, '../../storage');
const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 10485760);

if (!Number.isSafeInteger(maxUploadSize) || maxUploadSize <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadSize,
    files: 1,
    fields: 0,
    parts: 2,
    fieldNameSize: 100,
    headerPairs: 100,
  },
});

const router = require('express').Router();

router.post(
  '/upload',
  documentsController.requireUserId,
  upload.single('file'),
  documentsController.upload,
);
router.get('/documents', documentsController.requireUserId, documentsController.list);
router.get(
  '/documents/:id/download',
  documentsController.requireUserId,
  documentsController.download,
);

module.exports = { router, uploadErrorHandler };

function uploadErrorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.status && error.code) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    const status = tooLarge ? 413 : 400;
    const code = tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    const message = tooLarge
      ? 'O arquivo excede o limite permitido.'
      : 'A requisição de upload é inválida.';
    return res.status(status).json({ error: { code, message } });
  }

  if (/^(Multipart: Boundary not found|Unexpected end of form|Unexpected end of file)/.test(error.message)) {
    return res.status(400).json({
      error: { code: 'INVALID_UPLOAD', message: 'A requisição de upload é inválida.' },
    });
  }

  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
  });
}