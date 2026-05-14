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
          ["Document outline & landmarks", "Forms & validation UX", "Flexbox vs grid decision tree", "Responsive units & clamp()", "Motion without layout thrash"],
          ["Build 3-page marketing site with keyboard-nav menu", "Implement dark/light toggle with CSS variables", "Audit with axe and fix critical issues"],
          ["Accessible landing page", "Component library starter (tokens only)"]
        ),
        topic(
          "fe-js-ts",
          "JavaScript + TypeScript",
          "45h",
          "Beginner → Intermediate",
          ["fe-html-css"],
          ["Scope, closures, event loop", "Modules & bundler mental model", "Generics & utility types", "Narrowing & discriminated unions", "Async patterns & error boundaries"],
          ["Refactor 500-line script into ES modules", "Add strict TS to a JS repo incrementally"],
          ["CLI file organizer", "Typed REST client SDK"]
        ),
        topic(
          "fe-react",
          "React ecosystem",
          "55h",
          "Intermediate",
          ["fe-js-ts"],
          ["Hooks rules & stale closures", "Server vs client components (Next)", "Data fetching + suspense boundaries", "Performance: memo, transitions", "Testing with RTL"],
          ["Implement URL-driven filters with useSearchParams", "Build optimistic UI with rollback"],
          ["Kanban with undo stack", "Docs site with MDX"]
        ),
        topic(
          "fe-next-tailwind",
          "Next.js, Tailwind, Vite",
          "40h",
          "Intermediate",
          ["fe-react"],
          ["Routing layouts & loading UI", "Edge vs Node runtimes", "Image & font optimization", "Tailwind design tokens", "Vite code-splitting"],
          ["Ship OG images via route handlers", "Add Playwright smoke suite"],
          ["SaaS dashboard shell", "Blog with ISR"]
        ),
        topic(
          "fe-tooling",
          "Bundlers, Git workflow, quality gates",
          "25h",
          "Beginner",
          ["fe-js-ts"],
          ["Webpack vs Vite tradeoffs", "Source maps in prod", "Husky + lint-staged", "Conventional commits", "Preview deploys"],
          ["Configure CI matrix for lint/test/typecheck", "Add bundle analyzer budget"],
          ["Design system CI package"]
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
          ["Event loop & libuv", "Streams & backpressure", "Cluster vs worker_threads", "Observability hooks", "Graceful shutdown"],
          ["Add /ready and /live with dependency checks", "Stress test with autocannon + flamegraph"],
          ["Task queue dashboard API"]
        ),
        topic(
          "be-http",
          "Express / Nest / HTTP semantics",
          "50h",
          "Intermediate",
          ["be-node"],
          ["Middleware ordering", "Validation at boundary", "Idempotency-Key patterns", "Pagination cursors", "API versioning"],
          ["Implement RBAC decorator + e2e matrix", "Add OpenAPI + contract tests"],
          ["Billing webhook processor"]
        ),
        topic(
          "be-data",
          "MongoDB, Postgres, Prisma, Redis",
          "55h",
          "Intermediate",
          ["be-http"],
          ["Normalization vs denorm", "Indexes & explain plans", "Transactions & isolation", "Cache stampede mitigation", "Migrations playbook"],
          ["Add outbox pattern for reliable side effects", "Simulate failover read replica lag"],
          ["Multi-tenant SaaS schema"]
        ),
        topic(
          "be-realtime",
          "GraphQL, WebSockets, auth",
          "45h",
          "Advanced",
          ["be-http"],
          ["JWT vs sessions", "Refresh rotation", "OAuth/OIDC flows", "GraphQL N+1 defenses", "Socket auth & reconnect"],
          ["Threat-model refresh token theft", "Add subscription load tests"],
          ["Realtime ops room"]
        ),
        topic(
          "be-search",
          "Search, caching, background jobs",
          "30h",
          "Advanced",
          ["be-data"],
          ["Redis data structures", "Full-text vs vector", "Sagas & compensations", "DLQ handling"],
          ["Build hybrid BM25 + cache layer", "Tune TTLs with metrics"],
          ["Support agent assist backend"]
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
        topic("do-linux", "Linux & networking", "35h", "Intermediate", [], ["Processes, fds, limits", "systemd units", "iptables/nft basics", "TLS cert lifecycle", "Performance tooling"], ["Harden SSH + fail2ban lab", "Tune sysctl for web tier"], ["Bastion-less access pattern"]),
        topic("do-docker", "Docker & Compose", "40h", "Intermediate", ["do-linux"], ["Images vs containers", "Multi-stage builds", "BuildKit cache", "Healthchecks", "Compose networks"], ["Shrink image 60%+ with dive", "Add SBOM step in CI"], ["Local full stack stack"]),
        topic("do-k8s", "Kubernetes", "55h", "Advanced", ["do-docker"], ["Pods, Deployments, Services", "HPA + probes", "ConfigMaps/Secrets", "RBAC", "GitOps"], ["Blue/green rollout lab", "NetworkPolicy least privilege"], ["Internal platform preview envs"]),
        topic("do-aws", "AWS core (EC2/S3/CF/IAM)", "50h", "Advanced", ["do-linux"], ["IAM boundaries", "S3 policies & OAC", "CloudFront behaviors", "Cost dashboards"], ["Least-priv CI role", "S3 malware scan hook"], ["Static + API edge"]),
        topic("do-cicd", "Terraform & GitHub Actions", "40h", "Advanced", ["do-docker"], ["Remote state locking", "Modules & workspaces", "Reusable workflows", "OIDC to cloud", "Security scanning"], ["Drift detection job", "Canary deploy with smoke tests"], ["Org golden path template"]),
        topic("do-observe", "Monitoring & logging", "30h", "Advanced", ["do-k8s"], ["RED/USE metrics", "SLO burn alerts", "Structured logs", "Tracing sampling"], ["Game day: inject latency", "Runbook timed restore"], ["SRE starter pack"]),
      ],
    },
    {
      n: 4,
      title: "Security & Reliability",
      meta: ["Expert", "~300h", "Defensible systems"],
      summary:
        "OWASP depth, modern TLS, authZ patterns, rate limiting, secure SDLC, and reliability engineering habits that compound.",
      topics: [
        topic("sec-owasp", "OWASP & secure design", "45h", "Advanced", ["be-http"], ["STRIDE basics", "SSRF & deserialization", "CSP rollout", "Secrets hygiene", "Dependency governance"], ["Map Top 10 to your app", "Fix ZAP findings with tests"], ["Security CI gate"]),
        topic("sec-authz", "AuthN/Z hardening", "40h", "Expert", ["be-realtime"], ["mTLS", "OPA/Rego", "Session fixation", "Device binding"], ["Replay attack drill", "JWKS rotation"], ["Zero-trust service mesh lab"]),
        topic("sec-ops", "Incident readiness", "35h", "Expert", ["do-observe"], ["Tabletops", "Forensics timelines", "Comms templates", "Postmortems"], ["Run 90-min incident sim", "Chaos experiment with guardrails"], ["SOC-lite playbook"]),
      ],
    },
    {
      n: 5,
      title: "Data Science, ML & AI Systems",
      meta: ["Specialization", "~260h", "Production ML"],
      summary:
        "Python scientific stack, classical ML, deep learning, NLP/CV, LLM apps with RAG, vector retrieval, evaluation, and MLOps guardrails.",
      topics: [
        topic("ai-py", "Python data stack", "35h", "Beginner", [], ["Environments", "typing in notebooks", "Packaging", "Testing numerics"], ["Parametrize notebook -> script", "Add pre-commit to repo"], ["Reproducible dataset card"]),
        topic("ai-ml", "NumPy, Pandas, sklearn", "45h", "Intermediate", ["ai-py"], ["Broadcasting", "Leaky features", "Metrics beyond accuracy", "Calibration"], ["Walk-forward validation", "Feature importance stability"], ["Churn model baseline"]),
        topic("ai-dl", "TensorFlow / PyTorch", "55h", "Advanced", ["ai-ml"], ["Autograd", "Mixed precision", "ONNX export", "Data pipelines"], ["Train with checkpoint resume", "Profile GPU util"], ["CV classifier + CI eval"]),
        topic("ai-llm", "LLM apps & RAG", "45h", "Advanced", ["ai-ml"], ["Chunking strategies", "Embeddings hygiene", "Grounding eval", "Safety filters"], ["Build RAG with citations UI", "Measure faithfulness"], ["Support copilot"]),
        topic("ai-mlops", "MLOps & monitoring", "40h", "Expert", ["ai-dl"], ["Model registry", "Drift monitors", "Rollback", "Cost controls"], ["Shadow deployment", "Latency SLO tests"], ["Responsible AI checklist"]),
      ],
    },
  ];

  global.TM_ROADMAP = { phases: phases };
})(window);
