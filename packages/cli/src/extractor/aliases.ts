// Maps any variant (lowercased) → canonical label used as the graph node label.
// Seeded from job-search-tool/scripts/score_ats.py TERM_ALIASES, expanded with
// additional tech abbreviations and common misspellings for conversations.
//
// Usage: look up alias[token.toLowerCase()] before slugging.

export const ALIASES: Record<string, string> = {
  // ── Database variants (from score_ats.py) ───────────────────────────────────
  "postgres":                   "PostgreSQL",
  "mongo":                      "MongoDB",
  "elastic":                    "Elasticsearch",
  "clickhouse":                 "ClickHouse",   // casing variant

  // ── Framework / library name variants ──────────────────────────────────────
  "nextjs":                     "Next.js",
  "next js":                    "Next.js",
  "nuxtjs":                     "Nuxt",
  "nuxt js":                    "Nuxt",
  "reactjs":                    "React",
  "react js":                   "React",
  "vuejs":                      "Vue",
  "vue js":                     "Vue",
  "sveltejs":                   "Svelte",
  "angularjs":                  "Angular",
  "nodejs":                     "Node.js",
  "node js":                    "Node.js",
  "node":                       "Node.js",
  "nestjs":                     "NestJS",
  "expressjs":                  "Express",
  "express js":                 "Express",
  "tanstack query":             "React Query",
  "react query":                "React Query",

  // ── Language short forms ────────────────────────────────────────────────────
  "js":                         "JavaScript",
  "ts":                         "TypeScript",
  "py":                         "Python",
  "golang":                     "Go",

  // ── CSS / styling variants ──────────────────────────────────────────────────
  "sass":                       "SCSS",         // treat as same node
  "tailwind":                   "Tailwind CSS",
  "tailwindcss":                "Tailwind CSS",

  // ── Cloud short forms ───────────────────────────────────────────────────────
  "google cloud":               "GCP",
  "google cloud platform":      "GCP",
  "amazon web services":        "AWS",
  "microsoft azure":            "Azure",
  "cloudflare workers":         "Cloudflare Workers",

  // ── AI / LLM variants ───────────────────────────────────────────────────────
  "ai":                         "artificial intelligence",
  "artificial intelligence":    "AI",
  "openai":                     "OpenAI",
  "chatgpt":                    "ChatGPT",
  "gpt-4":                      "GPT",
  "gpt-3":                      "GPT",
  "gpt4":                       "GPT",
  "claude code":                "Claude Code",
  "github copilot":             "GitHub Copilot",
  "huggingface":                "Hugging Face",
  "langchain":                  "LangChain",
  "llamaindex":                 "LlamaIndex",
  "llama index":                "LlamaIndex",
  "rag":                        "RAG",
  "retrieval augmented generation": "RAG",

  // ── DevOps / CI variants (from score_ats.py) ────────────────────────────────
  "ci/cd":                      "CI/CD",
  "continuous integration":     "CI/CD",
  "continuous deployment":      "CI/CD",
  "continuous delivery":        "CI/CD",
  "github actions":             "GitHub Actions",
  "gitlab ci":                  "GitLab CI",
  "k8s":                        "Kubernetes",
  "kube":                       "Kubernetes",
  "tf":                         "Terraform",

  // ── Architecture variants ───────────────────────────────────────────────────
  "full stack":                 "full-stack",
  "fullstack":                  "full-stack",
  "back end":                   "backend",
  "front end":                  "frontend",
  "microfrontend":              "microfrontend",
  "micro frontend":             "microfrontend",
  "ddd":                        "domain-driven design",
  "domain driven design":       "domain-driven design",
  "cqrs":                       "CQRS",
  "event sourcing":             "event sourcing",

  // ── API / protocol variants ─────────────────────────────────────────────────
  "rest api":                   "REST API",
  "restful":                    "REST API",
  "restful api":                "REST API",
  "graphql":                    "GraphQL",
  "grpc":                       "gRPC",
  "websocket":                  "WebSockets",
  "web socket":                 "WebSockets",
  "sse":                        "Server-Sent Events",
  "server sent events":         "Server-Sent Events",
  "openapi":                    "OpenAPI",

  // ── Security variants ───────────────────────────────────────────────────────
  "jwt":                        "JWT",
  "json web token":             "JWT",
  "sso":                        "SSO",
  "single sign-on":             "SSO",
  "oauth2":                     "OAuth",
  "oauth 2":                    "OAuth",
  "openid":                     "OpenID Connect",
  "oidc":                       "OpenID Connect",
  "rbac":                       "RBAC",
  "role-based access control":  "RBAC",

  // ── Rendering / web patterns ─────────────────────────────────────────────────
  "server side rendering":      "SSR",
  "server-side rendering":      "SSR",
  "static site generation":     "SSG",
  "static site generator":      "SSG",
  "incremental static regeneration": "ISR",
  "client side rendering":      "CSR",
  "progressive web app":        "PWA",
  "webassembly":                "WebAssembly",

  // ── ORM / query builder variants ────────────────────────────────────────────
  "typeorm":                    "TypeORM",
  "drizzle orm":                "Drizzle",

  // ── Tool variants ───────────────────────────────────────────────────────────
  "vscode":                     "VS Code",
  "visual studio code":         "VS Code",
  "neovim":                     "Neovim",
  "vim":                        "Neovim",

  // ── British/American spelling variants (from score_ats.py) ──────────────────
  "data visualisation":         "data visualization",
  "optimisation":               "optimization",
  "prioritising":               "prioritizing",

  // ── Misc short forms ────────────────────────────────────────────────────────
  "saas":                       "SaaS",
  "b2b":                        "B2B",
  "b2c":                        "B2C",
  "ui/ux":                      "UX/UI",
  "ux/ui":                      "UX/UI",
  "a11y":                       "accessibility",
  "i18n":                       "internationalisation",
  "l10n":                       "localisation",
  "pnpm":                       "pnpm",
  "esm":                        "ES modules",
  "cjs":                        "CommonJS",
};
