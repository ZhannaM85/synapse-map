// Phase 1 active types: 'concept' | 'project'
// 'decision' | 'artifact' | 'question' reserved for future LLM extraction phase
export type NodeType = 'concept' | 'project' | 'decision' | 'artifact' | 'question';

export type EdgeType = 'related' | 'belongs-to' | 'decided-in' | 'raised-in';

export interface GraphNode {
  id: string;                  // stable slug, e.g. "react", "react-query"
  label: string;               // canonical display name, e.g. "React"
  type: NodeType;
  weight: number;              // total conversations this node appeared in
  firstSeen: string;           // ISO timestamp
  lastSeen: string;            // ISO timestamp
  conversationRefs: string[];  // sessionIds that mention this node
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;                  // "[nodeA]→[nodeB]" sorted alphabetically — no duplicates
  source: string;              // node id
  target: string;              // node id
  weight: number;              // co-occurrence count across conversations
  type: EdgeType;
  firstSeen: string;
  lastSeen: string;
}

export interface ProcessedSession {
  sessionId: string;
  cwd: string;
  processedAt: string;         // ISO timestamp
  fileHash: string;            // SHA-256 of JSONL content — skip if unchanged on rescan
}

export interface KnowledgeGraph {
  version: number;             // schema version for future migrations
  createdAt: string;
  updatedAt: string;
  nodes: Record<string, GraphNode>;
  edges: Record<string, GraphEdge>;
  processedSessions: Record<string, ProcessedSession>;
}

// ── Input types (used by reader and extractor) ────────────────────────────────

export interface ParsedSession {
  sessionId: string;
  filePath: string;
  cwd: string;
  timestamp: string;           // ISO timestamp of the first user message
  userMessages: string[];      // text of user messages only; assistant messages excluded
}

// Phase 1: topics and projects only.
// decisions / questions / artifacts added when LLM extraction is introduced.
export interface ExtractionResult {
  topics: string[];            // canonical labels: ["React", "TypeScript", "Docker"]
  projects: string[];          // project names inferred from cwd or message content
}

// ── Extractor interface (pluggable — LLM backends will implement this too) ────

export interface Extractor {
  extract(session: ParsedSession): ExtractionResult;
}

// ── Graph builder helpers ─────────────────────────────────────────────────────

export function emptyGraph(): KnowledgeGraph {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: {},
    edges: {},
    processedSessions: {},
  };
}
