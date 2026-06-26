import { existsSync, unlinkSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { closeDb, DB_PATH } from '../graph/store.js';

export function runReset(): void {
  if (!existsSync(DB_PATH)) {
    console.log('No graph database found. Nothing to reset.');
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  rl.question('Delete ~/.synapse/graph.db? This cannot be undone. [y/N] ', (answer) => {
    rl.close();

    if (answer.trim().toLowerCase() !== 'y') {
      console.log('Aborted.');
      return;
    }

    closeDb();
    unlinkSync(DB_PATH);
    console.log('Graph reset. Run synapse scan to rebuild.');
  });
}
