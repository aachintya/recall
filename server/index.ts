import 'dotenv/config';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import { createApp } from './app.js';
import { readConfig } from './llm.js';

const config = readConfig();
const app = createApp(config);
const production = process.env.NODE_ENV === 'production';
let closeVite: (() => Promise<void>) | undefined;

if (production) {
  if (!existsSync(resolve('dist/index.html'))) {
    console.error('No production build found. Run npm run build first.');
    process.exit(1);
  }
  app.use(express.static(resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
  closeVite = () => vite.close();
}

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(
    `\n  Recall is ready → http://localhost:${port}\n  ${config.apiKey ? 'Live AI: Gemini configured' : 'Example sets ready. Add GEMINI_API_KEY to .env for live AI.'}\n`,
  );
});
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${port} is in use. Set PORT in .env to choose another port.`
      : 'The server could not start.',
  );
  process.exit(1);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await closeVite?.();
    server.close(() => process.exit(0));
  });
}
