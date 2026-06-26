# synapse-map

Transform your Claude Code conversation history into a living knowledge graph.

Every time you work with Claude Code, topics accumulate in isolated conversations that are hard to revisit. Synapse Map reads those conversations locally, extracts tech concepts and project names using rule-based NLP, builds a graph of how they relate, and serves an interactive visualization in your browser.

**No API key. No cloud. Everything stays on your machine.**

> Work in progress — CLI and UI are under active development.

---

## How it works

```
~/.claude/projects/*.jsonl
          │
          ▼
   Reader (jsonl.ts)          parse user messages only
          │
          ▼
   RuleBasedExtractor         three layers combined:
   ├── vocabulary matching     391 known tech terms
   ├── TF-IDF                  surfaces session-specific terms
   └── compromise.js NLP       multi-word noun phrases
          │
          ▼
   Graph Builder              slug → node, co-occurrence → edge
          │
          ▼
   SQLite (~/.synapse/)        WAL mode + FTS5 search index
          │
          ▼
   Express + React Flow        served at localhost:4242
```

---

## Usage

```bash
npx synapse-map scan          # index ~/.claude/projects/ conversations
npx synapse-map serve         # open graph in browser (localhost:4242)
npx synapse-map               # scan if needed, then serve

npx synapse-map scan --force  # re-process all sessions
npx synapse-map status        # node / edge / session counts
npx synapse-map reset         # delete ~/.synapse/ data
```

After scanning, the browser opens to an interactive graph where nodes are concepts and projects, edges show co-occurrence, and the sidebar shows which conversations each topic appeared in.

---

## Install

```bash
npm install -g synapse-map
```

Or use without installing:

```bash
npx synapse-map
```

Requires **Node.js 22+** (uses the built-in `node:sqlite` module — no native compilation needed).

---

## Auto-update after each conversation

Wire a Claude Code Stop hook so the graph updates automatically when you finish a session:

```bash
npx synapse-map hook install
```

This adds a Stop hook to `~/.claude/settings.json`. After that, `synapse-map scan` runs silently whenever Claude Code finishes a conversation.

---

## Storage

The graph is stored at `~/.synapse/graph.db` (SQLite). It is never uploaded anywhere. To remove all data:

```bash
npx synapse-map reset
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| CLI | Node.js + TypeScript + commander |
| Extraction | compromise.js (NLP) + custom TF-IDF |
| Storage | SQLite via `node:sqlite` + FTS5 |
| Server | Express |
| UI | React 19 + React Flow + Zustand + Tailwind CSS |
| Layout | d3-force |

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a detailed breakdown of every module — why it exists and what each function does. Updated after each feature is added.
