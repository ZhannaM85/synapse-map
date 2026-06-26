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

// Merges one session's extraction result into the knowledge graph in place.
// Returns the mutated graph (same reference) for easy chaining.
export function mergeSession(
  graph: KnowledgeGraph,
  session: ParsedSession,
  result: ExtractionResult,
  fileHash: string,
): KnowledgeGraph {
  const now = new Date().toISOString();
  const nodeIds: string[] = [];

  // ── Upsert concept nodes ────────────────────────────────────────────────────
  for (const label of result.topics) {
    const id = toSlug(label);
    if (!id) continue;
    nodeIds.push(id);
    upsertNode(graph, id, label, 'concept', session.sessionId, session.timestamp, now);
  }

  // ── Upsert project nodes ────────────────────────────────────────────────────
  for (const name of result.projects) {
    const id = toSlug(name);
    if (!id) continue;
    nodeIds.push(id);
    upsertNode(graph, id, name, 'project', session.sessionId, session.timestamp, now);
  }

  // ── Upsert co-occurrence edges ──────────────────────────────────────────────
  // Cap at 20 nodes to prevent O(n²) edge explosion on noisy sessions.
  const edgeNodes = nodeIds.slice(0, 20);
  for (let i = 0; i < edgeNodes.length; i++) {
    for (let j = i + 1; j < edgeNodes.length; j++) {
      const [a, b] = [edgeNodes[i]!, edgeNodes[j]!].sort();
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

function upsertNode(
  graph: KnowledgeGraph,
  id: string,
  label: string,
  type: GraphNode['type'],
  sessionId: string,
  sessionTimestamp: string,
  now: string,
): void {
  const existing = graph.nodes[id];
  if (existing) {
    // Only increment weight if this session hasn't been counted yet.
    // Guards against re-processing the same session due to a bug upstream.
    if (!existing.conversationRefs.includes(sessionId)) {
      existing.weight += 1;
      existing.conversationRefs.push(sessionId);
    }
    existing.lastSeen = now;
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
  }
}
