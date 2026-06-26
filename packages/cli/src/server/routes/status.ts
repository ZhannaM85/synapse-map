import { Router } from 'express';
import { loadGraph } from '../../graph/store.js';

const router = Router();

router.get('/', (_req, res) => {
  const graph = loadGraph();
  res.json({
    nodeCount: Object.keys(graph.nodes).length,
    edgeCount: Object.keys(graph.edges).length,
    sessionCount: Object.keys(graph.processedSessions).length,
    lastUpdated: graph.updatedAt,
  });
});

export default router;
