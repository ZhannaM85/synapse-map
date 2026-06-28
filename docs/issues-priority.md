# Issues Priority List

Issues grouped by implementation tier. Work top-to-bottom within each tier; dependencies are noted where order matters within a tier.

---

## Tier 1 — Foundation
_Monorepo setup, core types, and data access. Must be done first — everything depends on these._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#1](https://github.com/ZhannaM85/synapse-map/issues/1)~~ | ~~feat: initialize monorepo with npm workspaces (packages/cli + packages/app)~~ | ~~Start here — sets up the project structure~~ |
| ~~[#2](https://github.com/ZhannaM85/synapse-map/issues/2)~~ | ~~feat: define core TypeScript interfaces (GraphNode, GraphEdge, KnowledgeGraph)~~ | ~~Do immediately after #1 — all other modules depend on these types~~ |
| ~~[#3](https://github.com/ZhannaM85/synapse-map/issues/3)~~ | ~~feat: implement JSONL reader — getAllSessions and parseSession~~ | ~~Reads ~/.claude/projects/ conversation history~~ |
| ~~[#4](https://github.com/ZhannaM85/synapse-map/issues/4)~~ | ~~feat: implement SQLite storage layer with FTS5 (node:sqlite)~~ | ~~Persists the graph; required by scan, serve, status, reset~~ |

---

## Tier 2 — Rule-Based Extraction Pipeline
_No LLM, no API key. Three layers combined into a single pluggable interface. #5, #6, #7 are independent and can be done in parallel; #8 requires all three._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#5](https://github.com/ZhannaM85/synapse-map/issues/5)~~ | ~~feat: build tech vocabulary list (~800 terms) for vocabulary matching~~ | ~~Standalone — highest-confidence extraction layer~~ |
| ~~[#6](https://github.com/ZhannaM85/synapse-map/issues/6)~~ | ~~feat: implement TF-IDF extractor across conversation corpus~~ | ~~Standalone — surfaces project-specific terms~~ |
| ~~[#7](https://github.com/ZhannaM85/synapse-map/issues/7)~~ | ~~feat: integrate compromise.js for noun phrase extraction~~ | ~~Standalone — catches concepts vocabulary misses~~ |
| ~~[#8](https://github.com/ZhannaM85/synapse-map/issues/8)~~ | ~~feat: implement Extractor interface and RuleBasedExtractor combining all three layers~~ | ~~Depends on #5, #6, #7 — also defines the interface for future LLM backends~~ |

---

## Tier 3 — Graph Builder + Scan Command
_Core domain logic: merge algorithm, slug generation, and the scan orchestration._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#9](https://github.com/ZhannaM85/synapse-map/issues/9)~~ | ~~feat: implement slug generation, alias table, and graph merge algorithm~~ | ~~Depends on #2, #8~~ |
| ~~[#10](https://github.com/ZhannaM85/synapse-map/issues/10)~~ | ~~feat: implement synapse scan command~~ | ~~Depends on #3, #4, #8, #9 — completes the full scan pipeline~~ |

---

## Tier 4 — Server + Remaining CLI Commands
_The Express API and CLI wiring. #11, #13 can be done in parallel; #12 and #14 follow._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#11](https://github.com/ZhannaM85/synapse-map/issues/11)~~ | ~~feat: implement Express REST API (graph, nodes, edges, search, status routes)~~ | ~~Depends on #4 — required by serve and frontend~~ |
| ~~[#13](https://github.com/ZhannaM85/synapse-map/issues/13)~~ | ~~feat: implement synapse status and synapse reset commands~~ | ~~Depends on #4 — independent of #11~~ |
| ~~[#12](https://github.com/ZhannaM85/synapse-map/issues/12)~~ | ~~feat: implement synapse serve command (Express + static file serving)~~ | ~~Depends on #11~~ |
| ~~[#14](https://github.com/ZhannaM85/synapse-map/issues/14)~~ | ~~feat: implement commander CLI entry point with all subcommands~~ | ~~Depends on #10, #12, #13 — ties the whole CLI together~~ |

---

## Tier 5 — React Frontend
_Full graph visualization UI. #15 first (scaffold); then #16, #17; then the rest in parallel._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#15](https://github.com/ZhannaM85/synapse-map/issues/15)~~ | ~~feat: scaffold React + Vite + Tailwind + shadcn/ui frontend app~~ | ~~Do first in this tier — required by all other frontend issues~~ |
| ~~[#16](https://github.com/ZhannaM85/synapse-map/issues/16)~~ | ~~feat: implement Zustand graph store~~ | ~~Depends on #15 — required by GraphCanvas, NodeDetail, SearchBar~~ |
| ~~[#17](https://github.com/ZhannaM85/synapse-map/issues/17)~~ | ~~feat: implement React Flow canvas with d3-force layout~~ | ~~Depends on #15, #16 — the main visualization~~ |
| ~~[#18](https://github.com/ZhannaM85/synapse-map/issues/18)~~ | ~~feat: implement custom ConceptNode component (shadcn Card + weight badge)~~ | ~~Depends on #15, #17~~ |
| ~~[#19](https://github.com/ZhannaM85/synapse-map/issues/19)~~ | ~~feat: implement NodeDetail sidebar~~ | ~~Depends on #15, #16~~ |
| ~~[#20](https://github.com/ZhannaM85/synapse-map/issues/20)~~ | ~~feat: implement SearchBar with shadcn Command palette~~ | ~~Depends on #15, #16~~ |
| [#21](https://github.com/ZhannaM85/synapse-map/issues/21) | feat: implement ScanProgress SSE component | Depends on #11, #16 |
| [#33](https://github.com/ZhannaM85/synapse-map/issues/33) | feat: zoom-based LOD — filter nodes and edges by weight x zoom level | Depends on #17 — do before #34 |
| [#34](https://github.com/ZhannaM85/synapse-map/issues/34) | feat: simplified node rendering modes (dot / compact / card) driven by LOD | Depends on #17, #33 |

---

## Tier 6 — Distribution
_Packaging, wiring the build pipeline, and documentation. Do last — the tool should be functional before packaging._

| # | Issue | Notes |
|---|-------|-------|
| [#22](https://github.com/ZhannaM85/synapse-map/issues/22) | feat: configure Vite output to packages/cli/public/ and wire CLI static serving | Depends on #15 — makes CLI self-contained for npm publish |
| [#24](https://github.com/ZhannaM85/synapse-map/issues/24) | feat: auto-refresh graph via Claude Code Stop hook | `synapse-map hook install` wires a Stop hook into ~/.claude/settings.json; requires CLI installed globally |
| [#25](https://github.com/ZhannaM85/synapse-map/issues/25) | feat: GitHub Actions workflow for automated npm publishing | Needs NPM_TOKEN secret; triggers on version tags (v*) |
| [#23](https://github.com/ZhannaM85/synapse-map/issues/23) | docs: README with install and usage instructions | Do last |
