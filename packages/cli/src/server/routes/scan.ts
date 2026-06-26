import { Router, type Request, type Response } from 'express';
import { runScan } from '../../commands/scan.js';

const router = Router();

let scanInProgress = false;
const sseClients = new Set<Response>();

router.post('/', (_req, res) => {
  if (scanInProgress) {
    res.status(409).json({ error: 'Scan already in progress' });
    return;
  }

  scanInProgress = true;
  broadcast({ type: 'started' });

  res.status(202).json({ status: 'accepted', message: 'Scan started' });

  setTimeout(() => {
    try {
      runScan({ force: false, dryRun: false });
      broadcast({ type: 'completed' });
    } catch (err) {
      broadcast({ type: 'error', message: String(err) });
    } finally {
      scanInProgress = false;
    }
  }, 0);
});

router.get('/progress', (_req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n');

  sseClients.add(res);
  res.on('close', () => {
    sseClients.delete(res);
  });
});

function broadcast(data: Record<string, unknown>): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

export default router;
