const fs = require('node:fs/promises');
const path = require('node:path');

const documents = new Map();
const storageDirectory = path.resolve(__dirname, '../../storage');

async function create(document) {
  documents.set(document.id, { ...document });
  return { ...document };
}

async function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

async function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((left, right) => {
      const dateOrder = right.uploadedAt.localeCompare(left.uploadedAt);
      return dateOrder || left.id.localeCompare(right.id);
    })
    .map((document) => ({ ...document }));
}

async function getUsageByOwner(owner) {
  const ownerDocuments = [...documents.values()].filter((document) => document.owner === owner);
  return {
    count: ownerDocuments.length,
    size: ownerDocuments.reduce((total, document) => total + document.size, 0),
  };
}

function isStoredPath(filePath) {
  const relativePath = path.relative(storageDirectory, path.resolve(filePath));
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

async function fileExists(filePath) {
  if (!isStoredPath(filePath)) return false;

  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function removeFile(filePath) {
  if (!isStoredPath(filePath)) return;
  await fs.rm(filePath, { force: true });
}

module.exports = {
  create,
  findById,
  findByOwner,
  getUsageByOwner,
  fileExists,
  removeFile,
};