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

async function getUsageByOwner(owner) {
  const ownerDocuments = [...documents.values()].filter((document) => document.owner === owner);
  return {
    count: ownerDocuments.length,
    size: ownerDocuments.reduce((total, document) => total + document.size, 0),
  };
}

module.exports = {
  create,
  findById,
  findByOwner,
  getUsageByOwner,
};