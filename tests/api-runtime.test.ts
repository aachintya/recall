import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('serves API requests from compiled ESM under native Node without a TypeScript loader', () => {
  const directory = mkdtempSync(join(tmpdir(), 'recall-api-runtime-'));
  try {
    execFileSync(process.execPath, [
      'node_modules/typescript/bin/tsc',
      '--project',
      'api/tsconfig.json',
      '--noEmit',
      'false',
      '--allowImportingTsExtensions',
      'false',
      '--rootDir',
      '.',
      '--outDir',
      directory,
    ]);
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }));
    symlinkSync(resolve('node_modules'), join(directory, 'node_modules'), 'junction');
    const result = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
      import assert from 'node:assert/strict';
      import { createServer } from 'node:http';
      import { once } from 'node:events';
      import handler from './api/index.js';
      const server = createServer(handler);
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      try {
        const base = 'http://127.0.0.1:' + server.address().port;
        const health = await fetch(base + '/api/health');
        assert.equal(health.status, 200);
        assert.deepEqual(await health.json(), { configured: false, provider: 'Gemini', model: 'gemini-2.5-flash' });
        const generated = await fetch(base + '/api/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Explain how photosynthesis works.', count: 6, difficulty: 'standard' }),
        });
        assert.equal(generated.status, 503);
        assert.equal((await generated.json()).error.code, 'NOT_CONFIGURED');
        console.log('native-runtime-ok');
      } finally { await new Promise(resolve => server.close(resolve)); }
    `,
      ],
      {
        cwd: directory,
        encoding: 'utf8',
        timeout: 10_000,
        env: { ...process.env, GEMINI_API_KEY: '', GEMINI_MODEL: 'gemini-2.5-flash' },
      },
    );
    expect(result.trim()).toBe('native-runtime-ok');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 20_000);
