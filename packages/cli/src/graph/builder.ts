import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  ParsedSession,
  ExtractionResult,
} from './types.js';

// Converts a canonical label to a stable, URL-safe node ID.
// Must be deterministic — the same label must always produce the same slug.
export function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/\+\+/g, 'pp')       // C++ → cpp
    .replace(/#/g, 'sharp')       // C# → csharp
    .replace(/\./g, '-')          // Next.js → next-js, Node.js → node-js
    .replace(/[^a-z0-9-]+/g, '-') // spaces and other chars → hyphens
    .replace(/-+/g, '-')          // collapse runs of hyphens
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens
}

// Only this many nodes per session participate in co-occurrence edge
// generation (≤190 pairs). Projects + highest-confidence topics make the cut.
const MAX_EDGE_NODES = 20;

// Merges one session's extraction result into the knowledge graph in place.
// Returns the mutated graph (same reference) for easy chaining.
export function mergeSession(
  graph: KnowledgeGraph,
  session: ParsedSession,
  result: ExtractionResult,
  fileHash: string,
): KnowledgeGraph {
  const now = new Date().toISOString();
  // id → whether this session was newly counted for that node in this merge.
  // Deduped by id: a topic and a project can slug to the same node.
  // Insertion order matters — edge generation below keeps only the first
  // MAX_EDGE_NODES ids, so projects go in first (they anchor concepts to the
  // project), followed by topics in extraction-confidence order.
  const counted = new Map<string, boolean>();

  // ── Upsert project nodes ────────────────────────────────────────────────────
  for (const name of result.projects) {
    const id = toSlug(name);
    if (!id) continue;
    const isNew = upsertNode(graph, id, name, 'project', session.sessionId, session.timestamp, now);
    counted.set(id, (counted.get(id) ?? false) || isNew);
  }

  // ── Upsert concept nodes ────────────────────────────────────────────────────
  for (const label of result.topics) {
    const id = toSlug(label);
    if (!id) continue;
    const isNew = upsertNode(graph, id, label, 'concept', session.sessionId, session.timestamp, now);
    counted.set(id, (counted.get(id) ?? false) || isNew);
  }

  // ── Upsert co-occurrence edges ──────────────────────────────────────────────
  // Cap pair generation to the highest-confidence nodes: sessions routinely
  // extract 80+ topics, and all-pairs over those is O(n²) co-occurrence noise
  // that swamps the graph (#45). All nodes are still upserted above — the cap
  // only limits which ones form edges.
  const edgeNodes = Array.from(counted.keys()).slice(0, MAX_EDGE_NODES);
  for (let i = 0; i < edgeNodes.length; i++) {
    for (let j = i + 1; j < edgeNodes.length; j++) {
      const [a, b] = [edgeNodes[i]!, edgeNodes[j]!].sort();

      // If neither endpoint was newly counted, both nodes already carried this
      // session in conversationRefs — meaning a previous merge of this same
      // session already counted the pair. Skipping keeps re-processing
      // (e.g. scan --force) from inflating edge weights.
      if (!counted.get(a) && !counted.get(b)) continue;

      const edgeId = `${a}→${b}`;

      const existing = graph.edges[edgeId];
      if (existing) {
        existing.weight += 1;
        existing.lastSeen = now;
      } else {
        graph.edges[edgeId] = {
          id: edgeId,
          source: a,
          target: b,
          weight: 1,
          type: 'related',
          firstSeen: now,
          lastSeen: now,
        } satisfies GraphEdge;
      }
    }
  }

  // ── Record the processed session ────────────────────────────────────────────
  graph.processedSessions[session.sessionId] = {
    sessionId: session.sessionId,
    cwd: session.cwd,
    processedAt: now,
    fileHash,
  };

  graph.updatedAt = now;
  return graph;
}

// Returns true if this session was newly counted for the node (node created,
// or sessionId appended to conversationRefs); false when the session had
// already been counted by a previous merge.
function upsertNode(
  graph: KnowledgeGraph,
  id: string,
  label: string,
  type: GraphNode['type'],
  sessionId: string,
  sessionTimestamp: string,
  now: string,
): boolean {
  const existing = graph.nodes[id];
  if (existing) {
    // Only increment weight if this session hasn't been counted yet.
    // Guards against re-processing the same session due to a bug upstream.
    if (!existing.conversationRefs.includes(sessionId)) {
      existing.weight += 1;
      existing.conversationRefs.push(sessionId);
      existing.lastSeen = now;
      return true;
    }
    existing.lastSeen = now;
    return false;
  } else {
    graph.nodes[id] = {
      id,
      label,
      type,
      weight: 1,
      firstSeen: sessionTimestamp,
      lastSeen: sessionTimestamp,
      conversationRefs: [sessionId],
      metadata: {},
    } satisfies GraphNode;
    return true;
  }
}
