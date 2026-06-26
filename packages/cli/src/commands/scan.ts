import { basename } from 'node:path';
import { getAllSessions, hashFile, parseSession } from '../reader/jsonl.js';
import { RuleBasedExtractor } from '../extractor/index.js';
import { mergeSession } from '../graph/builder.js';
import { isSessionProcessed, loadGraph, saveGraph } from '../graph/store.js';
import type { ParsedSession } from '../graph/types.js';

export interface ScanOptions {
  force?: boolean;
  dryRun?: boolean;
}

export function runScan(options: ScanOptions = {}): void {
  const start = Date.now();

  // ── Discover all session files ─────────────────────────────────────────────
  const allPaths = getAllSessions();
  if (allPaths.length === 0) {
    console.log('No sessions found in ~/.claude/projects/');
    return;
  }

  // ── Quick-filter: which files need processing? ────────────────────────────
  // Uses the filename as a fast sessionId proxy; confirmed with the real
  // sessionId after parsing (handles the rare case where they differ).
  const toProcess: Array<{ filePath: string; hash: string }> = [];
  let skipped = 0;

  for (const filePath of allPaths) {
    const quickId = basename(filePath, '.jsonl');
    const hash = hashFile(filePath);
    if (!options.force && isSessionProcessed(quickId, hash)) {
      skipped++;
    } else {
      toProcess.push({ filePath, hash });
    }
  }

  if (toProcess.length === 0) {
    console.log(`Graph is up to date. (${skipped} sessions already indexed)`);
    return;
  }

  console.log(
    `Found ${allPaths.length} sessions ` +
    `(${toProcess.length} to process, ${skipped} already indexed)`,
  );

  // ── Parse all sessions — full corpus needed for TF-IDF accuracy ───────────
  process.stdout.write('Parsing sessions...');
  const allSessions: ParsedSession[] = [];
  for (const filePath of allPaths) {
    const session = parseSession(filePath);
    if (session) allSessions.push(session);
  }
  console.log(` ${allSessions.length} parsed`);

  // ── Build extractor with full corpus ──────────────────────────────────────
  const extractor = new RuleBasedExtractor(allSessions);

  // ── Load existing graph from DB ───────────────────────────────────────────
  const graph = loadGraph();
  const prevNodeCount = Object.keys(graph.nodes).length;
  const prevEdgeCount = Object.keys(graph.edges).length;

  // ── Process new/changed sessions ──────────────────────────────────────────
  // Build a filePath → ParsedSession map for O(1) lookups
  const sessionByPath = new Map(allSessions.map(s => [s.filePath, s]));

  let processed = 0;
  for (const { filePath, hash } of toProcess) {
    const session = sessionByPath.get(filePath);
    if (!session) continue; // file had no user messages

    // Secondary check with the real sessionId from the JSONL data
    if (!options.force && isSessionProcessed(session.sessionId, hash)) {
      skipped++;
      continue;
    }

    const result = extractor.extract(session);
    processed++;

    const dir = session.cwd.split(/[\\/]/).filter(Boolean).pop()
      ?? session.sessionId.slice(0, 8);
    const topicsPreview = result.topics.slice(0, 5).join(', ')
      + (result.topics.length > 5 ? ` +${result.topics.length - 5} more` : '');
    const prefix = `[${String(processed).padStart(String(toProcess.length).length)}/${toProcess.length}]`;

    if (options.dryRun) {
      console.log(`${prefix} ${dir.padEnd(24)}  ${topicsPreview}`);
    } else {
      console.log(`${prefix} ${dir.padEnd(24)}  ${result.topics.length} topics, ${result.projects.length} project`);
      mergeSession(graph, session, result, hash);
    }
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  if (options.dryRun) {
    console.log('\nDry run — no changes written.');
    return;
  }

  if (processed > 0) {
    saveGraph(graph);
  }

  const newNodes = Object.keys(graph.nodes).length - prevNodeCount;
  const newEdges = Object.keys(graph.edges).length - prevEdgeCount;
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(
    `\nGraph: ${Object.keys(graph.nodes).length} nodes` +
    (newNodes > 0 ? ` (+${newNodes})` : '') +
    `, ${Object.keys(graph.edges).length} edges` +
    (newEdges > 0 ? ` (+${newEdges})` : '') +
    `  [${elapsed}s]`,
  );
}
