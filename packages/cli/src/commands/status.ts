import { existsSync } from 'node:fs';
import { loadGraph } from '../graph/store.js';
import { DB_PATH } from '../graph/store.js';

export function runStatus(): void {
  if (!existsSync(DB_PATH)) {
    console.log('No graph found. Run synapse scan to build one.');
    return;
  }

  const graph = loadGraph();

  const nodes = Object.values(graph.nodes);
  const edges = Object.values(graph.edges);
  const sessions = Object.values(graph.processedSessions);

  const concepts = nodes.filter(n => n.type === 'concept').length;
  const projects = nodes.filter(n => n.type === 'project').length;

  const lastUpdated = sessions.length > 0
    ? sessions
        .map(s => s.processedAt)
        .sort()
        .pop()!
        .replace('T', ' ')
        .slice(0, 16)
    : 'never';

  console.log('Synapse knowledge graph');
  console.log(`Nodes:    ${nodes.length}  (concepts: ${concepts}, projects: ${projects})`);
  console.log(`Edges:    ${edges.length}`);
  console.log(`Sessions: ${sessions.length} conversations indexed`);
  console.log(`Updated:  ${lastUpdated}`);
}
