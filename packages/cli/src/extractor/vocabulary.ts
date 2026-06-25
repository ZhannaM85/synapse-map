// Seeded from job-search-tool/scripts/score_ats.py HARD_SKILLS, expanded for
// conversation-topic coverage (mobile, AI/ML, observability, more tooling).
// Matched case-insensitively with word boundaries against conversation text.
// Soft skills excluded — not meaningful as knowledge graph nodes.

export const VOCABULARY: string[] = [
  // ── Languages ──────────────────────────────────────────────────────────────
  "TypeScript", "JavaScript", "ECMAScript", "Python", "Java", "Kotlin",
  "Swift", "Go", "Rust", "C#", "C++", "Ruby", "PHP", "Scala", "Dart",
  "Elixir", "Haskell", "Clojure", "R", "MATLAB",
  "HTML", "CSS", "SCSS", "Sass", "LESS",
  "SQL", "ES6",

  // ── Frontend frameworks ─────────────────────────────────────────────────────
  "Angular", "React", "Vue", "Svelte", "Solid", "Qwik",
  "Next.js", "Nuxt", "Remix", "Astro", "SvelteKit",

  // ── Mobile ──────────────────────────────────────────────────────────────────
  "React Native", "Flutter", "Expo", "iOS", "Android",
  "SwiftUI", "Jetpack Compose", "Capacitor", "Ionic",

  // ── Backend / runtime ───────────────────────────────────────────────────────
  "Node.js", "NestJS", "Express", "Fastify", "Hono", "Deno", "Bun",
  "FastAPI", "Django", "Flask", "SQLAlchemy",
  "Spring Boot", "Spring", "Quarkus",
  "Ruby on Rails", "Laravel", "Symfony",
  "tRPC", "Hapi",

  // ── State management ────────────────────────────────────────────────────────
  "Redux", "Zustand", "MobX", "NgRx", "Pinia", "Jotai", "Recoil",
  "XState", "RxJS",

  // ── Data fetching / routing ─────────────────────────────────────────────────
  "TanStack Query", "React Query", "SWR", "Apollo", "URQL",
  "React Router", "TanStack Router",

  // ── API patterns ────────────────────────────────────────────────────────────
  "GraphQL", "REST", "REST API", "gRPC", "WebSocket", "WebSockets",
  "SSE", "Server-Sent Events", "OpenAPI", "Swagger",
  "webhooks",

  // ── Testing ─────────────────────────────────────────────────────────────────
  "Vitest", "Jest", "Cypress", "Playwright", "Puppeteer",
  "React Testing Library", "Testing Library",
  "Storybook", "Chromatic",
  "k6", "Locust",
  "TDD", "BDD", "unit testing", "integration testing", "e2e testing",

  // ── Build tooling ───────────────────────────────────────────────────────────
  "Webpack", "Vite", "esbuild", "Rollup", "Parcel", "Turbopack",
  "Nx", "Turborepo", "Lerna",
  "Babel", "SWC",

  // ── Package managers ────────────────────────────────────────────────────────
  "npm", "pnpm", "yarn",

  // ── UI / design systems ─────────────────────────────────────────────────────
  "Tailwind CSS", "Tailwind", "shadcn", "shadcn/ui",
  "Material UI", "MUI", "Chakra UI", "Radix UI", "Headless UI",
  "Ant Design", "Bootstrap", "Framer Motion", "GSAP",
  "Figma", "design system",
  "accessibility", "WCAG", "a11y",
  "responsive design", "CSS Grid", "Flexbox",

  // ── Databases ───────────────────────────────────────────────────────────────
  "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis",
  "Elasticsearch", "ClickHouse", "CockroachDB",
  "Supabase", "PlanetScale", "Neon", "Turso",
  "DynamoDB", "Firestore", "Bigtable",
  "Neo4j", "FaunaDB",
  "Prisma", "Drizzle", "TypeORM", "Sequelize", "Mongoose",

  // ── Vector / AI databases ───────────────────────────────────────────────────
  "Pinecone", "Weaviate", "Qdrant", "Milvus", "Chroma",
  "pgvector", "vector database", "embeddings",

  // ── DevOps / delivery ───────────────────────────────────────────────────────
  "Docker", "Kubernetes", "Helm", "Terraform", "Pulumi", "Ansible",
  "CI/CD", "GitHub Actions", "Jenkins", "CircleCI", "GitLab CI", "Bitbucket Pipelines",
  "Linux", "Nginx", "Caddy",
  "DevOps", "Platform Engineering", "SRE",
  "deployment", "infrastructure as code",

  // ── Cloud platforms ─────────────────────────────────────────────────────────
  "AWS", "Azure", "GCP", "Vercel", "Netlify", "Cloudflare",
  "Cloudflare Workers", "Fly.io", "Railway", "Render",
  "Firebase", "Supabase",
  "S3", "Lambda", "EC2", "ECS", "EKS",
  "Cloud Functions", "Cloud Run",
  "serverless", "edge functions",

  // ── Observability / monitoring ──────────────────────────────────────────────
  "Sentry", "Datadog", "New Relic", "Grafana", "Prometheus",
  "OpenTelemetry", "Jaeger", "Zipkin",
  "logging", "tracing", "monitoring", "alerting",

  // ── Source control / process ────────────────────────────────────────────────
  "Git", "GitHub", "GitLab", "Bitbucket",
  "Agile", "Scrum", "Kanban", "Jira", "Confluence", "Linear",

  // ── Security ────────────────────────────────────────────────────────────────
  "OAuth", "JWT", "SSO", "SAML", "OpenID Connect",
  "Keycloak", "Auth0", "Clerk",
  "authentication", "authorization", "RBAC",
  "OWASP", "penetration testing", "security",

  // ── AI / ML ─────────────────────────────────────────────────────────────────
  "OpenAI", "Anthropic", "Claude", "ChatGPT", "Gemini", "Mistral", "Llama",
  "LLM", "GPT", "RAG", "fine-tuning", "prompt engineering",
  "LangChain", "LlamaIndex", "Ollama", "Hugging Face",
  "TensorFlow", "PyTorch", "Keras", "scikit-learn",
  "machine learning", "deep learning", "neural network",
  "computer vision", "NLP", "natural language processing",
  "AI agents", "function calling", "tool use",
  "GitHub Copilot", "Claude Code", "Cursor",

  // ── Architecture / patterns ─────────────────────────────────────────────────
  "microservices", "monorepo", "microfrontend", "monolith",
  "event-driven", "event sourcing", "CQRS",
  "domain-driven design", "DDD", "clean architecture", "hexagonal architecture",
  "design patterns", "SOLID", "dependency injection",
  "WebAssembly", "WASM",
  "PWA", "SSR", "SSG", "ISR", "CSR",
  "GraphQL federation", "API gateway", "BFF",
  "message queue", "Kafka", "RabbitMQ", "SQS", "Pub/Sub",
  "caching", "CDN", "load balancing",
  "data modeling", "schema design",

  // ── Runtime / performance ───────────────────────────────────────────────────
  "performance", "Web Vitals", "Core Web Vitals", "Lighthouse",
  "code splitting", "lazy loading", "tree shaking",
  "memory management", "concurrency", "multithreading",

  // ── Data / analytics ────────────────────────────────────────────────────────
  "data visualization", "D3.js", "Chart.js", "Recharts", "ECharts",
  "analytics", "dashboards", "ETL", "data pipeline",
  "Pandas", "NumPy", "Jupyter",
  "Apache Spark", "Kafka", "Airflow",

  // ── Protocols / standards ───────────────────────────────────────────────────
  "HTTP", "HTTPS", "TCP", "DNS", "TLS", "SSL",
  "JSON", "XML", "YAML", "protobuf", "MessagePack",
  "CORS", "CSP", "CSRF",

  // ── Developer tooling ───────────────────────────────────────────────────────
  "ESLint", "Prettier", "Biome", "Husky", "lint-staged",
  "VS Code", "WebStorm", "Neovim",
  "Postman", "Insomnia", "Bruno",
  "Chrome DevTools", "Lighthouse",
  "code review", "debugging", "profiling",

  // ── Platforms / ecosystems ──────────────────────────────────────────────────
  "Electron", "Tauri",
  "Chrome Extension", "browser extension",
  "CLI", "terminal", "shell", "bash", "zsh",
  "npm package", "npm publish",

  // ── Domain / product ────────────────────────────────────────────────────────
  "SaaS", "B2B", "B2C",
  "product development", "software architecture",
  "technical writing", "documentation",
  "open source",
];
