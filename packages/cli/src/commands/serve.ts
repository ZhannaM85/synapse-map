import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import open from 'open';
import { createApp } from '../server/app.js';

export interface ServeOptions {
  port?: number;
  open?: boolean;
}

export function runServe(options: ServeOptions = {}): void {
  const port = options.port ?? 4242;
  const shouldOpen = options.open !== false;

  const app = createApp();

  const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
  app.use(express.static(publicDir));

  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Synapse running at ${url}`);

    if (shouldOpen) {
      open(url);
    }
  });
}
