const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');
const { randomUUID } = require('node:crypto');

const storageDirectory = path.resolve(__dirname, '../../storage');

function createMulterStorage() {
  return multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDirectory, { recursive: true }, (error) => {
        callback(error, storageDirectory);
      });
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  });
}

function isStoredPath(filePath) {
  const relativePath = path.relative(storageDirectory, path.resolve(filePath));
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

async function fileExists(filePath) {
  if (!isStoredPath(filePath)) return false;

  try {
    await fsPromises.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function removeFile(filePath) {
  if (!isStoredPath(filePath)) return;
  await fsPromises.rm(filePath, { force: true });
}

module.exports = { createMulterStorage, fileExists, removeFile };