import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { emptyGraph, type GraphEdge, type GraphNode, type KnowledgeGraph, type ProcessedSession } from './types.js';

const SCHEMA_VERSION = 1;

export const SYNAPSE_DIR = join(homedir(), '.synapse');
export const DB_PATH = join(SYNAPSE_DIR, 'graph.db');

// ── Schema ────────────────────────────────────────────────────────────────────

const DDL = `
  CREATE TABLE IF NOT EXISTS nodes (
    id               TEXT PRIMARY KEY,
    label            TEXT NOT NULL,
    type             TEXT NOT NULL,
    weight           INTEGER NOT NULL DEFAULT 1,
    first_seen       TEXT NOT NULL,
    last_seen        TEXT NOT NULL,
    conversation_refs TEXT NOT NULL DEFAULT '[]',
    metadata         TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS edges (
    id         TEXT PRIMARY KEY,
    source     TEXT NOT NULL,
    target     TEXT NOT NULL,
    weight     INTEGER NOT NULL DEFAULT 1,
    type       TEXT NOT NULL DEFAULT 'related',
    first_seen TEXT NOT NULL,
    last_seen  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    session_id   TEXT PRIMARY KEY,
    cwd          TEXT NOT NULL DEFAULT '',
    processed_at TEXT NOT NULL,
    file_hash    TEXT NOT NULL
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts
    USING fts5(node_id UNINDEXED, label);
`;

// ── Open / init ───────────────────────────────────────────────────────────────

let _db: DatabaseSync | null = null;

export function openDb(dbPath = DB_PATH): DatabaseSync {
  if (_db) return _db;

  if (!existsSync(SYNAPSE_DIR)) mkdirSync(SYNAPSE_DIR, { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(DDL);

  const { user_version } = db.prepare('PRAGMA user_version').get() as { user_version: number };
  if (user_version === 0) {
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  _db = db;
  return db;
}

// Reset the singleton — used in tests or after reset command
export function closeDb(): void {
  _db?.close();
  _db = null;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function isSessionProcessed(sessionId: string, fileHash: string): boolean {
  const db = openDb();
  const row = db.prepare('SELECT file_hash FROM sessions WHERE session_id = ?').get(sessionId) as
    | { file_hash: string }
    | undefined;
  return row?.file_hash === fileHash;
}

export function searchNodes(query: string): GraphNode[] {
  const db = openDb();
  const term = query.trim().replace(/['"*]/g, '') + '*'; // prefix match
  const rows = db
    .prepare(
      `SELECT n.* FROM nodes n
       JOIN nodes_fts f ON f.node_id = n.id
       WHERE nodes_fts MATCH ?
       ORDER BY f.rank
       LIMIT 20`,
    )
    .all(term) as Array<Record<string, unknown>>;
  return rows.map(rowToNode);
}

// ── Load ──────────────────────────────────────────────────────────────────────

export function loadGraph(): KnowledgeGraph {
  const db = openDb();

  const nodeRows = db.prepare('SELECT * FROM nodes').all() as Array<Record<string, unknown>>;
  const edgeRows = db.prepare('SELECT * FROM edges').all() as Array<Record<string, unknown>>;
  const sessionRows = db.prepare('SELECT * FROM sessions').all() as Array<Record<string, unknown>>;

  const nodes: Record<string, GraphNode> = {};
  for (const row of nodeRows) {
    const node = rowToNode(row);
    nodes[node.id] = node;
  }

  const edges: Record<string, GraphEdge> = {};
  for (const row of edgeRows) {
    const edge = rowToEdge(row);
    edges[edge.id] = edge;
  }

  const processedSessions: Record<string, ProcessedSession> = {};
  for (const row of sessionRows) {
    const s: ProcessedSession = {
      sessionId: String(row['session_id']),
      cwd: String(row['cwd']),
      processedAt: String(row['processed_at']),
      fileHash: String(row['file_hash']),
    };
    processedSessions[s.sessionId] = s;
  }

  if (nodeRows.length === 0 && edgeRows.length === 0) return emptyGraph();

  return {
    version: SCHEMA_VERSION,
    createdAt: sessionRows.length > 0 ? String(sessionRows[0]!['processed_at']) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
    processedSessions,
  };
}

// ── Save ──────────────────────────────────────────────────────────────────────

export function saveGraph(graph: KnowledgeGraph): void {
  const db = openDb();

  const upsertNode = db.prepare(`
    INSERT INTO nodes (id, label, type, weight, first_seen, last_seen, conversation_refs, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      weight           = excluded.weight,
      last_seen        = excluded.last_seen,
      conversation_refs = excluded.conversation_refs,
      metadata         = excluded.metadata
  `);

  // FTS5 virtual tables don't support ON CONFLICT — delete first, then insert.
  const deleteFts = db.prepare(`DELETE FROM nodes_fts WHERE node_id = ?`);
  const insertFts = db.prepare(`INSERT INTO nodes_fts (node_id, label) VALUES (?, ?)`);

  const upsertEdge = db.prepare(`
    INSERT INTO edges (id, source, target, weight, type, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      weight    = excluded.weight,
      last_seen = excluded.last_seen
  `);

  const upsertSession = db.prepare(`
    INSERT INTO sessions (session_id, cwd, processed_at, file_hash)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      processed_at = excluded.processed_at,
      file_hash    = excluded.file_hash
  `);

  // Wrap everything in a single transaction for atomicity
  db.exec('BEGIN');
  try {
    for (const node of Object.values(graph.nodes)) {
      upsertNode.run(
        node.id,
        node.label,
        node.type,
        node.weight,
        node.firstSeen,
        node.lastSeen,
        JSON.stringify(node.conversationRefs),
        JSON.stringify(node.metadata),
      );
      deleteFts.run(node.id);
      insertFts.run(node.id, node.label);
    }

    for (const edge of Object.values(graph.edges)) {
      upsertEdge.run(
        edge.id,
        edge.source,
        edge.target,
        edge.weight,
        edge.type,
        edge.firstSeen,
        edge.lastSeen,
      );
    }

    for (const session of Object.values(graph.processedSessions)) {
      upsertSession.run(session.sessionId, session.cwd, session.processedAt, session.fileHash);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToNode(row: Record<string, unknown>): GraphNode {
  return {
    id: String(row['id']),
    label: String(row['label']),
    type: String(row['type']) as GraphNode['type'],
    weight: Number(row['weight']),
    firstSeen: String(row['first_seen']),
    lastSeen: String(row['last_seen']),
    conversationRefs: JSON.parse(String(row['conversation_refs'] ?? '[]')) as string[],
    metadata: JSON.parse(String(row['metadata'] ?? '{}')) as Record<string, unknown>,
  };
}

function rowToEdge(row: Record<string, unknown>): GraphEdge {
  return {
    id: String(row['id']),
    source: String(row['source']),
    target: String(row['target']),
    weight: Number(row['weight']),
    type: String(row['type']) as GraphEdge['type'],
    firstSeen: String(row['first_seen']),
    lastSeen: String(row['last_seen']),
  };
}
