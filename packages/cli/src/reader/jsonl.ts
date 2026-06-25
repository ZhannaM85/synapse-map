import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, join } from 'node:path';
import type { ParsedSession } from '../graph/types.js';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

// Strip system-injected XML blocks that Claude Code injects into user message
// content — these pollute topic extraction with internal framework terms.
// Strip all XML-style block tags injected by Claude Code (tool inputs/outputs,
// system state, skill invocations). Uses a broad pattern — any lowercase tag
// containing hyphens or known prefixes. Keeps natural user prose intact.
const SYSTEM_TAG_RE = /<([a-z][a-z0-9]*(-[a-z0-9]+)+|antml:[a-z]+)[^>]*>[\s\S]*?<\/\1>/g;

function extractText(content: unknown): string {
  if (typeof content === 'string') {
    return content.replace(SYSTEM_TAG_RE, '').trim();
  }
  if (Array.isArray(content)) {
    // Array content mixes user text parts with tool_result entries.
    // Only extract type==="text" items; skip tool_result, image, etc.
    return (content as Array<Record<string, unknown>>)
      .filter((item) => item['type'] === 'text')
      .map((item) => String(item['text'] ?? '').replace(SYSTEM_TAG_RE, '').trim())
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function collectJsonlFiles(dir: string, results: string[] = []): string[] {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsonlFiles(full, results);
    } else if (entry.isFile() && extname(entry.name) === '.jsonl') {
      results.push(full);
    }
  }
  return results;
}

export function getAllSessions(): string[] {
  return collectJsonlFiles(CLAUDE_PROJECTS_DIR);
}

export function hashFile(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

export function parseSession(filePath: string): ParsedSession | null {
  const lines = readFileSync(filePath, 'utf8').split('\n').filter(Boolean);

  const userMessages: string[] = [];
  let sessionId = basename(filePath, '.jsonl');
  let cwd = '';
  let timestamp = '';

  for (const line of lines) {
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue; // skip malformed lines
    }

    if (entry['type'] !== 'user') continue;

    const msg = entry['message'] as Record<string, unknown> | undefined;
    if (!msg) continue;

    // Capture session metadata from the first user message that has it
    if (!cwd && typeof entry['cwd'] === 'string') cwd = entry['cwd'];
    if (!timestamp && typeof entry['timestamp'] === 'string') timestamp = entry['timestamp'];
    if (typeof entry['sessionId'] === 'string') sessionId = entry['sessionId'];

    const text = extractText(msg['content']);
    if (text.length >= 10) userMessages.push(text);
  }

  if (userMessages.length === 0) return null;

  return { sessionId, filePath, cwd, timestamp, userMessages };
}
