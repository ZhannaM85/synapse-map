import { Router } from 'express';
import { searchNodes } from '../../graph/store.js';

const router = Router();

router.get('/', (req, res) => {
  const q = req.query['q'];
  if (typeof q !== 'string' || q.trim().length === 0) {
    res.status(400).json({ error: 'Missing query parameter: q' });
    return;
  }

  const results = searchNodes(q);
  res.json(results);
});

export default router;
