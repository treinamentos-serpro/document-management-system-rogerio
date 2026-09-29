const fs = require('node:fs/promises');

const documents = new Map();

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function removeFile(filePath) {
  await fs.rm(filePath, { force: true });
}

module.exports = { create, findById, findByOwner, fileExists, removeFile };