const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const documentsRepository = require('../src/repositories/documents.repository');

const previousUploadLimit = process.env.MAX_UPLOAD_SIZE_BYTES;
process.env.MAX_UPLOAD_SIZE_BYTES = '4';
const app = require('../src/app');
if (previousUploadLimit === undefined) {
  delete process.env.MAX_UPLOAD_SIZE_BYTES;
} else {
  process.env.MAX_UPLOAD_SIZE_BYTES = previousUploadLimit;
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam os contratos e o dono', async (t) => {
  const storageDirectory = path.resolve(__dirname, '../storage');
  const filesBefore = new Set(await fs.readdir(storageDirectory).catch(() => []));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    const filesAfter = await fs.readdir(storageDirectory).catch(() => []);
    await Promise.all(
      filesAfter
        .filter((fileName) => !filesBefore.has(fileName))
        .map((fileName) => fs.rm(path.join(storageDirectory, fileName), { force: true })),
    );
  });

  const missingOwner = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingOwner.status, 400);
  assert.strictEqual((await missingOwner.json()).error.code, 'USER_ID_REQUIRED');

  const invalidOwner = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': `user-${'x'.repeat(128)}` },
  });
  assert.strictEqual(invalidOwner.status, 400);
  assert.strictEqual((await invalidOwner.json()).error.code, 'USER_ID_INVALID');

  const invalidId = await fetch(`${baseUrl}/documents/not-a-uuid/download`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.strictEqual(invalidId.status, 404);
  assert.strictEqual((await invalidId.json()).error.code, 'DOCUMENT_NOT_FOUND');

  assert.strictEqual(
    await documentsRepository.fileExists(path.resolve(storageDirectory, '..', 'outside-file')),
    false,
  );

  const form = new FormData();
  form.append('file', new Blob(['ok'], { type: 'text/plain' }), 'report.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: form,
  });
  assert.strictEqual(uploadResponse.status, 201);
  const uploaded = await uploadResponse.json();
  assert.deepStrictEqual(Object.keys(uploaded).sort(), [
    'id', 'originalName', 'owner', 'size', 'uploadedAt',
  ]);
  assert.strictEqual(uploaded.originalName, 'report.txt');
  assert.strictEqual(uploaded.size, 2);
  assert.strictEqual(uploaded.owner, 'user-1');

  const ownerList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.deepStrictEqual((await ownerList.json()).documents.map(({ id }) => id), [uploaded.id]);

  const otherUserList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.deepStrictEqual((await otherUserList.json()).documents, []);

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${uploaded.id}/download`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.strictEqual(forbiddenDownload.status, 404);
  assert.strictEqual((await forbiddenDownload.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const download = await fetch(`${baseUrl}/documents/${uploaded.id}/download`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.strictEqual(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /attachment/);
  assert.strictEqual(await download.text(), 'ok');

  const emptyForm = new FormData();
  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: emptyForm,
  });
  assert.strictEqual(missingFile.status, 400);
  assert.strictEqual((await missingFile.json()).error.code, 'FILE_REQUIRED');

  const largeForm = new FormData();
  largeForm.append('file', new Blob(['12345']), 'large.txt');
  const tooLarge = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: largeForm,
  });
  assert.strictEqual(tooLarge.status, 413);
  assert.strictEqual((await tooLarge.json()).error.code, 'FILE_TOO_LARGE');
});
