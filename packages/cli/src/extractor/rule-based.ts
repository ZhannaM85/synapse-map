import type { Extractor, ExtractionResult, ParsedSession } from '../graph/types.js';
import { VOCABULARY } from './vocabulary.js';
import { ALIASES } from './aliases.js';
import { TfIdf, buildCorpus, topTermsForSession } from './tfidf.js';
import { extractNounPhrases } from './nlp.js';

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Precompile one regex per vocabulary term at module load time — avoids
// recompiling 391 patterns on every extract() call.
const VOCAB_PATTERNS: Array<{ term: string; re: RegExp }> = VOCABULARY.map(term => ({
  term,
  re: new RegExp(`(?<![a-zA-Z0-9_])${escapeRe(term)}(?![a-zA-Z0-9_])`, 'i'),
}));

// Build a lowercase → canonical lookup for O(1) vocab normalisation.
const VOCAB_LOWER = new Map<string, string>(
  VOCABULARY.map(t => [t.toLowerCase(), t]),
);

// Normalises a raw token from TF-IDF or NLP to a canonical label.
// Returns null for tokens that should be filtered out.
function normalizeToken(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  if (lower.length < 3) return null;

  const aliased = ALIASES[lower];
  if (aliased) return aliased;

  const vocabTerm = VOCAB_LOWER.get(lower);
  if (vocabTerm) return vocabTerm;

  // Unknown term: title-case simple words; preserve hyphenated project-style names
  if (/^[a-z][a-z0-9]*$/.test(raw)) {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return raw;
}

// Generic top-level directory names that aren't meaningful project names
const GENERIC_DIRS = new Set([
  'projects', 'repos', 'repository', 'repositories', 'workspace', 'workspaces',
  'src', 'source', 'code', 'dev', 'development', 'work', 'home', 'users', 'user',
  'documents', 'desktop', 'downloads', 'temp', 'tmp', 'github', 'gitlab',
]);

// Strips URLs so "https://..." doesn't trigger HTTPS/HTTP vocabulary matches
function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/g, ' ');
}

function matchVocabulary(text: string): string[] {
  const found: string[] = [];
  for (const { term, re } of VOCAB_PATTERNS) {
    if (re.test(text)) found.push(term);
  }
  return found;
}

export class RuleBasedExtractor implements Extractor {
  private corpus: TfIdf;
  private sessionIndexMap: Map<string, number>;

  // allSessions must include the sessions you'll call extract() on — they're
  // needed to build the TF-IDF corpus so IDF scores reflect the full dataset.
  constructor(allSessions: ParsedSession[]) {
    // Recaps are part of the corpus documents so their terms carry TF-IDF
    // scores alongside the user messages.
    this.corpus = buildCorpus(allSessions.map(s => [...s.userMessages, ...s.recaps]));
    this.sessionIndexMap = new Map(allSessions.map((s, i) => [s.sessionId, i]));
  }

  extract(session: ParsedSession): ExtractionResult {
    const rawText = session.userMessages.join('\n');
    const text = stripUrls(rawText);
    const labels = new Set<string>();

    // Layer 1 — vocabulary matching: fastest, highest-confidence, curated terms
    for (const term of matchVocabulary(text)) {
      labels.add(term);
    }

    // Layer 2 — TF-IDF: surfaces session-specific terms not in the vocabulary
    const sessionIndex = this.sessionIndexMap.get(session.sessionId) ?? -1;
    if (sessionIndex >= 0) {
      for (const token of topTermsForSession(session.userMessages, this.corpus, sessionIndex, 20)) {
        const norm = normalizeToken(token);
        if (norm) labels.add(norm);
      }
    }

    // Layer 3 — NLP: catches multi-word proper noun phrases
    const sampleText = text.slice(0, 8000);
    for (const phrase of extractNounPhrases(sampleText)) {
      const norm = normalizeToken(phrase);
      if (norm) labels.add(norm);
    }

    // Layer 4 — session recaps: LLM-written end-of-session summaries.
    // Short, clean prose with high signal density — vocabulary and NLP both
    // run over the full text (no sampling needed, unlike raw messages).
    const recapText = stripUrls(session.recaps.join('\n'));
    if (recapText) {
      for (const term of matchVocabulary(recapText)) {
        labels.add(term);
      }
      for (const phrase of extractNounPhrases(recapText)) {
        const norm = normalizeToken(phrase);
        if (norm) labels.add(norm);
      }
    }

    // Project: last path segment, skipping generic directory names
    const cwdParts = session.cwd.split(/[\\/]/).filter(Boolean);
    const projectName = cwdParts.slice().reverse().find(
      (p) => !GENERIC_DIRS.has(p.toLowerCase()) && !/^[a-z]:$/i.test(p),
    );
    const projects = projectName ? [projectName] : [];

    return { topics: Array.from(labels), projects };
  }
}
