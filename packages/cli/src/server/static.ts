import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

export function serveStatic(app: express.Express): void {
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => res.sendFile(join(publicDir, 'index.html')));
}
