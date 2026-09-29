const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('o fluxo de documentos funciona com isolamento por usuário', async (t) => {
  const storageDirectory = path.resolve(__dirname, '../storage');
  const filesBefore = new Set(await fs.readdir(storageDirectory).catch(() => []));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    const filesAfter = await fs.readdir(storageDirectory).catch(() => []);
    await Promise.all(filesAfter
      .filter((fileName) => !filesBefore.has(fileName))
      .map((fileName) => fs.rm(path.join(storageDirectory, fileName), { force: true })));
  });

  const form = new FormData();
  form.append('file', new Blob(['documento de teste']), 'report.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();

  const ownerList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.deepStrictEqual((await ownerList.json()).documents.map(({ id }) => id), [document.id]);

  const otherUserDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.strictEqual(otherUserDownload.status, 404);

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.strictEqual(download.status, 200);
  assert.strictEqual(await download.text(), 'documento de teste');
});
