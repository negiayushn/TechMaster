/**
 * Deep, nested roadmap phases — rendered by app.js with local progress.
 */
(function (global) {
  function topic(id, title, hours, difficulty, deps, subtopics, practice, projects) {
    return {
      id: id,
      title: title,
      hours: hours,
      difficulty: difficulty,
      deps: deps || [],
      subtopics: subtopics || [],
      practice: practice || [],
      projects: projects || [],
    };
  }

  var phases = [
    {
      n: 1,
      title: "Frontend Foundations",
      meta: ["Beginner", "~200h", "Portfolio-ready UI"],
      summary:
        "Semantic HTML, resilient CSS, modern JavaScript, TypeScript discipline, React mental models, Next.js delivery, and Tailwind-speed styling — sequenced like a production team onboarding.",
      topics: [
        topic(
          "fe-html-css",
          "HTML5 & CSS3 systems",
          "35h",
          "Beginner",
          [],
          ["Document outline & landmarks", "Forms & validation UX", "Flexbox vs grid decision tree", "Responsive units & clamp()", "Motion without layout thrash", "Custom properties & cascading", "CSS specificity & inheritance", "Accessible color contrast ratios", "HTML semantic elements deep dive", "CSS animations & keyframes", "Media queries & container queries", "CSS Grid advanced patterns"],
          ["Build 3-page marketing site with keyboard-nav menu", "Implement dark/light toggle with CSS variables", "Audit with axe and fix critical issues", "Create responsive image gallery with picture element", "Build form with native validation + custom styles", "Implement CSS-only accordion and tabs"],
          ["Accessible landing page", "Component library starter (tokens only)", "CSS art portfolio", "Responsive blog template with dark mode"]
        ),
        topic(
          "fe-js-ts",
          "JavaScript + TypeScript",
          "45h",
          "Beginner → Intermediate",
          ["fe-html-css"],
          ["Scope, closures, event loop", "Modules & bundler mental model", "Generics & utility types", "Narrowing & discriminated unions", "Async patterns & error boundaries", "Prototypal inheritance vs classes", "Promises, async/await deep dive", "TypeScript utility types & mapped types", "Decorators & metadata reflection", "Event delegation & bubbling", "Web Workers & Service Workers", "Memory leaks & performance profiling"],
          ["Refactor 500-line script into ES modules", "Add strict TS to a JS repo incrementally", "Implement throttle/debounce from scratch", "Build type-safe API client with generics", "Create custom ESLint rule for team conventions", "Write unit tests with Vitest for utility functions"],
          ["CLI file organizer", "Typed REST client SDK", "Browser extension with TypeScript", "NPM package with CI/CD", "Realtime collaborative whiteboard"]
        ),
        topic(
          "fe-react",
          "React ecosystem",
          "55h",
          "Intermediate",
          ["fe-js-ts"],
          ["Hooks rules & stale closures", "Server vs client components (Next)", "Data fetching + suspense boundaries", "Performance: memo, transitions", "Testing with RTL", "Context API vs Zustand vs Redux", "Compound components pattern", "Render props & higher-order components", "Error boundaries & recovery", "Portals & teleport patterns", "Custom hooks for reusable logic", "React DevTools profiling"],
          ["Implement URL-driven filters with useSearchParams", "Build optimistic UI with rollback", "Create accessible dialog with focus trap hook", "Build infinite scroll with Intersection Observer", "Implement drag-and-drop list with dnd-kit", "Add virtualization for long lists with react-window"],
          ["Kanban with undo stack", "Docs site with MDX", "E-commerce product grid with filters", "Realtime chat UI with WebSockets", "Form builder with drag-and-drop"]
        ),
        topic(
          "fe-next-tailwind",
          "Next.js, Tailwind, Vite",
          "40h",
          "Intermediate",
          ["fe-react"],
          ["Routing layouts & loading UI", "Edge vs Node runtimes", "Image & font optimization", "Tailwind design tokens", "Vite code-splitting", "Next.js middleware & rewrites", "Static vs server-side vs ISR strategies", "Route handlers & server actions", "Tailwind responsive breakpoints strategy", "Vite plugin development basics", "Incremental adoption patterns", "Bundle analysis & tree shaking"],
          ["Ship OG images via route handlers", "Add Playwright smoke suite", "Configure Tailwind custom theme with design tokens", "Set up Vite PWA with offline support", "Implement i18n routing in Next.js", "Create custom Vite plugin for SVG optimization"],
          ["SaaS dashboard shell", "Blog with ISR", "Multi-tenant admin panel", "Portfolio with CMS integration", "E-commerce storefront with ISR"]
        ),
        topic(
          "fe-tooling",
          "Bundlers, Git workflow, quality gates",
          "25h",
          "Beginner",
          ["fe-js-ts"],
          ["Webpack vs Vite tradeoffs", "Source maps in prod", "Husky + lint-staged", "Conventional commits", "Preview deploys", "ESLint & Prettier integration", "Semantic release & changelog generation", "Monorepo tools (Turborepo/Nx)", "Git hooks automation", "Code review best practices", "Dependency management & Dependabot", "Environment variable management"],
          ["Configure CI matrix for lint/test/typecheck", "Add bundle analyzer budget", "Set up monorepo with shared configs", "Create custom GitHub Action workflow", "Implement feature flags with flagsmith", "Build PR preview deployment pipeline"],
          ["Design system CI package", "CLI scaffolding tool", "Git hooks manager", "Monorepo starter template"]
        ),
      ],
    },
    {
      n: 2,
      title: "Backend & APIs",
      meta: ["Intermediate", "~320h", "Reliable services"],
      summary:
        "Design HTTP APIs that fail gracefully, model data with migrations, authenticate safely, and scale reads/writes with caches and queues.",
      topics: [
        topic(
          "be-node",
          "Node.js platform",
          "40h",
          "Intermediate",
          ["fe-js-ts"],
          ["Event loop & libuv", "Streams & backpressure", "Cluster vs worker_threads", "Observability hooks", "Graceful shutdown", "Buffer & TypedArray internals", "Child process & IPC", "Native addons with N-API", "AsyncLocalStorage for context propagation", "Diagnostics channel & profiling", "ESM vs CJS interop", "Node.js security best practices"],
          ["Add /ready and /live with dependency checks", "Stress test with autocannon + flamegraph", "Implement streaming CSV parser with backpressure", "Build custom CLI tool with yargs/commander", "Add APM tracing with OpenTelemetry", "Create worker pool for CPU-bound tasks"],
          ["Task queue dashboard API", "File upload service with streaming", "Realtime log tailer", "CLI database migrator", "Webhook receiver with retry logic"]
        ),
        topic(
          "be-http",
          "Express / Nest / HTTP semantics",
          "50h",
          "Intermediate",
          ["be-node"],
          ["Middleware ordering", "Validation at boundary", "Idempotency-Key patterns", "Pagination cursors", "API versioning", "Request rate limiting strategies", "Content negotiation & media types", "CORS, CSP & security headers", "Graceful degradation & circuit breakers", "Webhook signature verification", "API documentation with OpenAPI/Swagger", "health check & readiness probes"],
          ["Implement RBAC decorator + e2e matrix", "Add OpenAPI + contract tests", "Build rate limiter with Redis sliding window", "Create API gateway with request transformation", "Implement idempotency middleware with tests", "Add structured logging with correlation IDs"],
          ["Billing webhook processor", "Multi-tenant REST API starter", "API gateway with rate limiting", "Event-sourced order management", "GraphQL federation gateway"]
        ),
        topic(
          "be-data",
          "MongoDB, Postgres, Prisma, Redis",
          "55h",
          "Intermediate",
          ["be-http"],
          ["Normalization vs denorm", "Indexes & explain plans", "Transactions & isolation", "Cache stampede mitigation", "Migrations playbook", "Connection pooling strategies", "Read replicas & sharding", "Full-text search with PostgreSQL", "MongoDB aggregation pipelines", "Redis data structures & eviction", "Prisma schema design & relations", "Database backup & recovery"],
          ["Add outbox pattern for reliable side effects", "Simulate failover read replica lag", "Design migration strategy with rollback", "Implement Redis caching layer with TTL tiers", "Build pagination with keyset vs offset", "Create materialized view for reporting"],
          ["Multi-tenant SaaS schema", "Realtime leaderboard with Redis", "E-commerce inventory system", "Audit log with event sourcing", "Data warehouse ETL pipeline"]
        ),
        topic(
          "be-realtime",
          "GraphQL, WebSockets, auth",
          "45h",
          "Advanced",
          ["be-http"],
          ["JWT vs sessions", "Refresh rotation", "OAuth/OIDC flows", "GraphQL N+1 defenses", "Socket auth & reconnect", "DataLoader batching & caching", "Subscription filters & payload trimming", "WebSocket rooms & broadcasting", "SSE vs WebSocket tradeoffs", "Federated GraphQL architecture", "MFA & WebAuthn", "Session fixation & CSRF tokens"],
          ["Threat-model refresh token theft", "Add subscription load tests", "Implement OAuth2 with multiple providers", "Build GraphQL schema with authorization directives", "Create WebSocket heartbeat with auto-reconnect", "Add SSO with SAML/OIDC integration"],
          ["Realtime ops room", "GraphQL API gateway", "Multiplayer game backend", "Live notification system", "Collaborative document editing backend"]
        ),
        topic(
          "be-search",
          "Search, caching, background jobs",
          "30h",
          "Advanced",
          ["be-data"],
          ["Redis data structures", "Full-text vs vector", "Sagas & compensations", "DLQ handling", "Elasticsearch indexing strategies", "Search relevance tuning", "Background job queues with Bull/BullMQ", "Cron jobs & scheduled tasks", "Cache invalidation strategies", "Rate limiting with token bucket", "Bloom filters for caching", "Consistent hashing for distributed cache"],
          ["Build hybrid BM25 + cache layer", "Tune TTLs with metrics", "Implement job queue with retry & backoff", "Build autocomplete with trie + Redis", "Create search relevance tuning dashboard", "Implement cache warming on deploy"],
          ["Support agent assist backend", "Product search engine", "Job scheduler service", "Real-time analytics pipeline", "Distributed rate limiter"]
        ),
      ],
    },
    {
      n: 3,
      title: "DevOps & Cloud",
      meta: ["Advanced", "~280h", "Ship confidently"],
      summary:
        "Linux fundamentals, containers, Kubernetes operations, AWS core services, Terraform, CI/CD, and observability that catches regressions before users do.",
      topics: [
        topic("do-linux", "Linux & networking", "35h", "Intermediate", [], ["Processes, fds, limits", "systemd units", "iptables/nft basics", "TLS cert lifecycle", "Performance tooling", "File permissions & ACLs", "LVM & disk management", "Network namespaces & bridges", "SSH tunneling & port forwarding", "SELinux/AppArmor basics", "Kernel parameters & tuning", "Logrotate & journald"],
          ["Harden SSH + fail2ban lab", "Tune sysctl for web tier", "Debug with strace/lsof/perf", "Set up HAProxy load balancer", "Configure VPN with WireGuard", "Build custom systemd service with auto-restart"],
          ["Bastion-less access pattern", "Linux audit & compliance toolkit", "Self-hosted monitoring stack", "Network traffic analyzer"]),
        topic("do-docker", "Docker & Compose", "40h", "Intermediate", ["do-linux"], ["Images vs containers", "Multi-stage builds", "BuildKit cache", "Healthchecks", "Compose networks", "Docker volumes & bind mounts", "Dockerfile best practices", "Container security scanning", "Docker networking modes", "Registry & image tagging strategies", "Docker Compose profiles", "Resource constraints & limits"],
          ["Shrink image 60%+ with dive", "Add SBOM step in CI", "Set up Docker registry with auth", "Debug container networking with tcpdump", "Build development environment with Compose", "Implement healthcheck with retry logic"],
          ["Local full stack stack", "CI/CD build cache optimizer", "Microservice dev environment template", "Docker security scanner integration"]),
        topic("do-k8s", "Kubernetes", "55h", "Advanced", ["do-docker"], ["Pods, Deployments, Services", "HPA + probes", "ConfigMaps/Secrets", "RBAC", "GitOps", "Ingress controllers & TLS", "StatefulSets & persistent volumes", "Service mesh with Istio/Linkerd", "Pod security policies", "Custom resource definitions (CRDs)", "Helm charts & templating", "Cluster autoscaling & node pools"],
          ["Blue/green rollout lab", "NetworkPolicy least privilege", "Set up Prometheus operator monitoring", "Implement GitOps with ArgoCD", "Build custom operator with Operator SDK", "Chaos engineering with Litmus"],
          ["Internal platform preview envs", "Kubernetes cost optimizer", "Multi-cluster disaster recovery", "Service mesh observability stack"]),
        topic("do-aws", "AWS core (EC2/S3/CF/IAM)", "50h", "Advanced", ["do-linux"], ["IAM boundaries", "S3 policies & OAC", "CloudFront behaviors", "Cost dashboards", "VPC design & subnets", "Security groups & NACLs", "Load balancers & target groups", "RDS & Aurora", "ElasticCache & CDN", "Lambda & API Gateway", "CloudFormation & CDK", "AWS Organizations & SSO"],
          ["Least-priv CI role", "S3 malware scan hook", "Design multi-VPC architecture", "Set up CloudFront with WAF", "Implement CDK pipeline for infra", "Create cost anomaly alert system"],
          ["Static + API edge", "Serverless event processing pipeline", "Multi-region active-active setup", "AWS Well-Architected compliance kit"]),
        topic("do-cicd", "Terraform & GitHub Actions", "40h", "Advanced", ["do-docker"], ["Remote state locking", "Modules & workspaces", "Reusable workflows", "OIDC to cloud", "Security scanning", "Terraform plan validation", "State management & migration", "GitHub Actions environments", "Self-hosted runners", "Secrets management in CI", "Artifact caching strategies", "Deployment strategies: canary/blue-green"],
          ["Drift detection job", "Canary deploy with smoke tests", "Build reusable Terraform module registry", "Create GitHub Action composite action", "Implement security scanning pipeline", "Set up cost estimation in PRs"],
          ["Org golden path template", "Multi-env GitOps platform", "Terraform compliance enforcer", "CI/CD metrics dashboard"]),
        topic("do-observe", "Monitoring & logging", "30h", "Advanced", ["do-k8s"], ["RED/USE metrics", "SLO burn alerts", "Structured logs", "Tracing sampling", "Grafana dashboards", "Alertmanager routing & silences", "Log aggregation with Loki/ELK", "Distributed tracing with Jaeger", "SLO calculation & error budgets", "On-call & incident escalation", "Synthetic monitoring & probes", "Anomaly detection with ML"],
          ["Game day: inject latency", "Runbook timed restore", "Build SLO dashboard with burn rate", "Create alert fatigue reduction plan", "Implement distributed tracing pipeline", "Set up log-based metrics"],
          ["SRE starter pack", "Chaos engineering toolkit", "Observability as code stack", "Incident response playbook"]),
      ],
    },
    {
      n: 4,
      title: "Security & Reliability",
      meta: ["Expert", "~300h", "Defensible systems"],
      summary:
        "OWASP depth, modern TLS, authZ patterns, rate limiting, secure SDLC, and reliability engineering habits that compound.",
      topics: [
        topic("sec-owasp", "OWASP & secure design", "45h", "Advanced", ["be-http"], ["STRIDE basics", "SSRF & deserialization", "CSP rollout", "Secrets hygiene", "Dependency governance", "SQL injection prevention", "XSS mitigation strategies", "CSRF & same-site cookies", "Security headers checklist", "Container security scanning", "Supply chain attack prevention", "Privacy by design principles"],
          ["Map Top 10 to your app", "Fix ZAP findings with tests", "Implement CSP with report-only mode", "Conduct threat modeling workshop", "Set up secret scanning in CI", "Create security incident response plan"],
          ["Security CI gate", "Threat model template library", "Security compliance dashboard", "Bug bounty program starter kit"]),
        topic("sec-authz", "AuthN/Z hardening", "40h", "Expert", ["be-realtime"], ["mTLS", "OPA/Rego", "Session fixation", "Device binding", "Zero-trust architecture", "OAuth2 device authorization grant", "SCIM provisioning", "Kerberos & LDAP integration", "FIDO2/WebAuthn passwordless", "Token exchange & delegation", "Policy-as-code with OPA", "ABAC vs RBAC vs ReBAC"],
          ["Replay attack drill", "JWKS rotation", "Implement OPA policy for API access", "Build custom authorization service", "Set up FIDO2 authentication", "Create audit trail for auth decisions"],
          ["Zero-trust service mesh lab", "Authorization policy engine", "Identity federation gateway", "Compliance audit toolkit"]),
        topic("sec-ops", "Incident readiness", "35h", "Expert", ["do-observe"], ["Tabletops", "Forensics timelines", "Comms templates", "Postmortems", "Incident severity classification", "Containment & eradication strategies", "Digital forensics acquisition", "Malware analysis basics", "Legal hold & eDiscovery", "Crisis communication plans", "Red team vs blue team exercises", "Post-incident review best practices"],
          ["Run 90-min incident sim", "Chaos experiment with guardrails", "Create incident response runbook collection", "Build forensics analysis workstation", "Develop communication template pack", "Implement automated containment playbook"],
          ["SOC-lite playbook", "Incident response automation", "Forensics evidence tracker", "Security awareness training program"]),
      ],
    },
    {
      n: 5,
      title: "Data Science, ML & AI Systems",
      meta: ["Specialization", "~260h", "Production ML"],
      summary:
        "Python scientific stack, classical ML, deep learning, NLP/CV, LLM apps with RAG, vector retrieval, evaluation, and MLOps guardrails.",
      topics: [
        topic("ai-py", "Python data stack", "35h", "Beginner", [], ["Environments", "typing in notebooks", "Packaging", "Testing numerics", "Virtual environments & conda", "Jupyter lab extensions", "Data classes & Pydantic", "Profiling & optimization", "Parallel processing with multiprocessing", "Logging & debugging patterns", "API clients & requests session", "File I/O with pathlib"],
          ["Parametrize notebook -> script", "Add pre-commit to repo", "Build CLI data processing tool", "Create Python package with setuptools", "Set up CI for data pipelines", "Write property-based tests with Hypothesis"],
          ["Reproducible dataset card", "Data pipeline framework", "CLI data explorer", "Jupyter notebook linter"]),
        topic("ai-ml", "NumPy, Pandas, sklearn", "45h", "Intermediate", ["ai-py"], ["Broadcasting", "Leaky features", "Metrics beyond accuracy", "Calibration", "Feature engineering techniques", "Cross-validation strategies", "Hyperparameter tuning (Grid/Random/Bayesian)", "Ensemble methods (Random Forest, XGBoost)", "Dimensionality reduction (PCA/t-SNE/UMAP)", "Imbalanced datasets handling", "Pipelines & custom transformers", "Model interpretability (SHAP/LIME)"],
          ["Walk-forward validation", "Feature importance stability", "Build automated feature engineering pipeline", "Create model selection dashboard", "Implement cross-validation with time series", "Build interpretability report with SHAP"],
          ["Churn model baseline", "Fraud detection system", "Customer segmentation engine", "Demand forecasting API", "Anomaly detection in logs"]),
        topic("ai-dl", "TensorFlow / PyTorch", "55h", "Advanced", ["ai-ml"], ["Autograd", "Mixed precision", "ONNX export", "Data pipelines", "CNN architectures (ResNet, EfficientNet)", "Transformers (BERT, ViT)", "Transfer learning & fine-tuning", "GANs & diffusion models", "RNN/LSTM for sequence modeling", "Distributed training strategies", "Model quantization & pruning", "Experiment tracking with MLflow"],
          ["Train with checkpoint resume", "Profile GPU util", "Build custom training loop in PyTorch", "Implement distributed data parallel training", "Export model to ONNX with optimization", "Create experiment tracking dashboard"],
          ["CV classifier + CI eval", "Image segmentation pipeline", "NLP sentiment analyzer", "Neural style transfer app", "Time series forecasting model"]),
        topic("ai-llm", "LLM apps & RAG", "45h", "Advanced", ["ai-ml"], ["Chunking strategies", "Embeddings hygiene", "Grounding eval", "Safety filters", "Prompt engineering techniques", "Vector databases (Pinecone, Qdrant, Weaviate)", "RAG pipeline design", "LLM fine-tuning (LoRA, QLoRA)", "Agent & tool-use patterns", "Evaluation & benchmarking", "Guardrails & content moderation", "Cost optimization & caching"],
          ["Build RAG with citations UI", "Measure faithfulness", "Implement streaming chatbot with SSE", "Create custom agent with tool integrations", "Build evaluation suite for LLM responses", "Set up A/B testing for prompts"],
          ["Support copilot", "Document Q&A system", "Code review assistant", "Personal knowledge base with RAG", "LLM evaluation benchmark framework"]),
        topic("ai-mlops", "MLOps & monitoring", "40h", "Expert", ["ai-dl"], ["Model registry", "Drift monitors", "Rollback", "Cost controls", "Feature store design", "Model versioning & lineage", "A/B testing infrastructure", "Canary model deployment", "Data drift & concept drift detection", "ML pipeline orchestration (Kubeflow, Airflow)", "Model fairness & bias testing", "Compliance & governance for ML"],
          ["Shadow deployment", "Latency SLO tests", "Build feature store with Redis/Faiss", "Implement automated retraining pipeline", "Create drift monitoring dashboard", "Set up model governance & audit trail"],
          ["Responsible AI checklist", "ML platform self-service portal", "Feature store implementation", "Model performance monitoring suite"]),
      ],
    },
  ];

  global.TM_ROADMAP = { phases: phases };
})(window);
