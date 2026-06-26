import { Router } from 'express';
import { loadGraph } from '../../graph/store.js';
import type { GraphEdge, GraphNode } from '../../graph/types.js';

const router = Router();

router.get('/', (req, res) => {
  const graph = loadGraph();
  const minEdgeWeight = parseInt(req.query['minEdgeWeight'] as string, 10);
  if (!isNaN(minEdgeWeight) && minEdgeWeight > 1) {
    const filtered: typeof graph.edges = {};
    for (const [id, edge] of Object.entries(graph.edges)) {
      if (edge.weight >= minEdgeWeight) filtered[id] = edge;
    }
    res.json({ ...graph, edges: filtered });
    return;
  }
  res.json(graph);
});

router.get('/nodes', (req, res) => {
  const graph = loadGraph();
  let nodes = Object.values(graph.nodes);

  const type = req.query['type'];
  if (typeof type === 'string') {
    nodes = nodes.filter((n: GraphNode) => n.type === type);
  }

  res.json(nodes);
});

router.get('/nodes/:id', (req, res) => {
  const graph = loadGraph();
  const node = graph.nodes[req.params['id']!];

  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }

  const edges = Object.values(graph.edges).filter(
    (e: GraphEdge) => e.source === node.id || e.target === node.id,
  );

  res.json({ node, edges });
});

router.get('/edges', (req, res) => {
  const graph = loadGraph();
  let edges = Object.values(graph.edges);

  const minWeight = req.query['minWeight'];
  if (typeof minWeight === 'string') {
    const threshold = parseInt(minWeight, 10);
    if (!isNaN(threshold)) {
      edges = edges.filter((e: GraphEdge) => e.weight >= threshold);
    }
  }

  res.json(edges);
});

export default router;
