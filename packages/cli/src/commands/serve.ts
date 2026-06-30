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

  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Synapse running at ${url}`);

    if (shouldOpen) {
      open(url);
    }
  });
}
