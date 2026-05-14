/**
 * Expanded project library (50+ per domain aggregate, 90+ total).
 * Each entry is resume/interview ready with architecture and deployment notes.
 */
(function (global) {
  function proj(o) {
    return Object.assign(
      {
        demo: "https://example.com/demo-placeholder",
        repo: "https://github.com/yourusername/project-placeholder",
        screenshot: "assets/screenshots/placeholder.svg",
      },
      o
    );
  }

  var FE_TEMPLATES = [
    ["SaaS analytics shell", "saas", "Multi-tenant layout with sidebar, KPI cards, and role-aware navigation.", "React|TanStack Query|Recharts"],
    ["Kanban productivity", "kanban", "Drag columns, WIP limits, optimistic updates, and offline cache.", "React|dnd-kit|IndexedDB"],
    ["AI prompt studio", "ai-ui", "Streaming completions UI, preset library, and cost estimator.", "Next.js|Tailwind|SSE"],
    ["Admin CRUD console", "admin", "RBAC tables, audit log viewer, and CSV export.", "Next.js|Prisma|Postgres"],
    ["E-commerce storefront", "ecom", "Catalog, cart, promo codes, and checkout UI (mock payments).", "Next.js|Stripe test|Zustand"],
    ["Creative portfolio", "portfolio", "Case studies, MDX blog, and contact funnel with spam guard.", "Astro|Tailwind|Resend API"],
    ["Social feed UI", "social", "Infinite scroll, skeletons, reactions, and image CDN.", "React|TanStack Virtual|CloudFront"],
    ["Design system docs", "frontend", "Tokens, Storybook-like previews, and accessibility checks.", "React|Vite|axe-core"],
    ["Realtime dashboard", "frontend", "Live charts from websocket stream with reconnect UX.", "React|Socket.io client"],
    ["Multi-theme UI kit", "frontend", "Dark/gold luxury theme + WCAG AA contrast validation.", "CSS variables|React"],
  ];

  var BE_TEMPLATES = [
    ["Auth service", "auth", "Register/login, refresh rotation, device sessions, and audit trail.", "Node|Express|JWT|Redis"],
    ["Chat gateway", "chat", "Rooms, presence, typing indicators, and message persistence.", "Socket.io|MongoDB"],
    ["Payments webhook hub", "payments", "Idempotent Stripe webhooks, ledger table, and replay protection.", "NestJS|Postgres"],
    ["Object storage API", "files", "Signed uploads, virus scan hook, and lifecycle to Glacier.", "Express|S3|SQS"],
    ["Notification orchestrator", "notify", "Email/SMS/push templates with per-user preferences.", "BullMQ|Redis|SES"],
    ["Rate-limited public API", "backend", "API keys, quotas, and abuse detection with honeypot routes.", "Express|Redis"],
    ["GraphQL federation edge", "backend", "Stitching two subgraphs with authz directives.", "Apollo|Node"],
    ["Search service", "backend", "Postgres full-text + Redis cache for popular queries.", "Postgres|Redis"],
    ["Feature flag service", "backend", "Percentage rollouts, targeting rules, and admin UI.", "NestJS|Postgres"],
    ["Audit log ingest", "backend", "Append-only events, hash chain verification, and SIEM export.", "Kafka|Node"],
  ];

  var DO_TEMPLATES = [
    ["GitHub Actions mono-ci", "cicd", "Matrix builds, cache, deploy to staging on main.", "Actions|Docker"],
    ["K8s blue/green", "k8s", "Two Deployments, Service switch, and automated smoke tests.", "Kubernetes|Helm"],
    ["Observability stack", "monitoring", "Prometheus, Grafana dashboards, and Alertmanager routes.", "Docker Compose"],
    ["Centralized logging", "logging", "Vector → OpenSearch with retention tiers.", "Vector|OpenSearch"],
    ["Terraform VPC", "iac", "3-tier VPC, NAT, bastion-less SSM, and least-priv IAM.", "Terraform|AWS"],
    ["Nginx TLS edge", "nginx", "ACME certs, OCSP stapling, and security headers.", "Nginx|Certbot"],
    ["Auto scaling lab", "devops", "CPU target tracking with warm pools for demo API.", "AWS|ASG|ALB"],
    ["S3 static hosting", "devops", "Origin access, CloudFront, and cache invalidation workflow.", "S3|CloudFront"],
    ["Secrets rotation", "devops", "AWS Secrets Manager rotation Lambda + app reload.", "Lambda|SecretsMgr"],
    ["Disaster recovery drill", "devops", "Runbook + timed restore from backup into isolated account.", "RDS snapshots|S3"],
  ];

  var SEC_TEMPLATES = [
    ["OWASP regression suite", "security", "Automated checks mapped to ASVS levels in CI.", "ZAP baseline|GitHub Actions"],
    ["JWT hardening kit", "security", "Short-lived AT, RT rotation, reuse detection, and JWKS.", "Node|Redis"],
    ["API gateway policies", "security", "mTLS between services, OPA policy bundle, and deny-by-default.", "Envoy|OPA"],
    ["Secure reverse proxy", "security", "Geo blocklist, bot scoring, and WAF managed rules.", "Nginx|ModSecurity"],
    ["Secrets scanner", "security", "Pre-commit + CI gitleaks with SARIF upload.", "gitleaks|GitHub Advanced Security"],
  ];

  var DS_TEMPLATES = [
    ["Movie recommender", "recsys", "Matrix factorization baseline + cold-start heuristics.", "Python|Pandas|Surprise"],
    ["Sentiment pipeline", "nlp", "Label schema, active learning loop, and calibration plots.", "scikit-learn|matplotlib"],
    ["Support chatbot RAG", "rag", "Chunking policy, hybrid BM25+vector retrieval, citations UI.", "OpenAI|pgvector"],
    ["Fraud rules + model", "ml", "Rule engine + gradient boosting with monotonic constraints.", "XGBoost|Pandas"],
    ["Image classifier", "cv", "Augmentations, mixed precision training, export ONNX.", "PyTorch|torchvision"],
    ["Demand forecasting", "ts", "Seasonal decomposition, backtesting, and confidence intervals.", "statsmodels|Pandas"],
    ["Topic explorer", "nlp", "BERTopic or LDA with interactive pydeck map.", "Python|pydeck"],
    ["Vector search microservice", "rag", "FastAPI + FAISS index rebuild job on schedule.", "FastAPI|FAISS"],
    ["Notebook-driven ETL", "data", "Great Expectations checks and data docs site.", "Pandas|GE"],
    ["Model card generator", "mlops", "Template from metrics JSON + human review workflow.", "Jinja|Python"],
  ];

  function tierFor(i, cat) {
    if (i % 7 === 0) return "production-grade";
    if (i % 3 === 0) return "advanced";
    if (i % 2 === 0) return "intermediate";
    return "beginner";
  }

  function diffFor(tier) {
    if (tier === "beginner") return "Easy";
    if (tier === "intermediate") return "Medium";
    return "Hard";
  }

  function expand(cat, templates, catKey, emojiBase) {
    var out = [];
    for (var wave = 0; wave < 2; wave++) {
      templates.forEach(function (tpl, idx) {
        var i = wave * templates.length + idx;
        var title = tpl[0] + (wave ? " — Variant " + (wave + 1) : "");
        var slug = tpl[1];
        var tier = tierFor(i, catKey);
        out.push(
          proj({
            id: catKey + "-" + slug + "-" + wave + "-" + idx,
            cat: catKey,
            tier: tier,
            emoji: emojiBase[(i + idx) % emojiBase.length],
            color: catKey === "frontend" ? "#1e3a8a" : catKey === "backend" ? "#065f46" : catKey === "devops" ? "#4c1d95" : catKey === "security" ? "#78350f" : "#0e7490",
            title: title,
            desc: tpl[2] + " Includes tests, Dockerfile stub, and README deployment checklist.",
            stack: tpl[3].split("|"),
            diff: diffFor(tier),
            time: tier === "beginner" ? "3–5 days" : tier === "intermediate" ? "1–2 weeks" : "2–4 weeks",
            features: ["Auth-ready boundaries", "Observability hooks", "Seed data/fixtures", "CI workflow stub"],
            architecture: "Clients → API gateway → service modules → datastore/cache → async workers. Feature flags guard risky paths.",
            folderStructure: "/apps/web\n/apps/api\n/packages/ui\n/packages/config\n/infra/terraform\n/.github/workflows",
            apis: ["REST or GraphQL depending on template", "Webhooks or SSE where noted"],
            database: catKey === "backend" ? "Postgres or Mongo (swap in README)" : catKey === "data-ai" ? "Parquet + DuckDB or Postgres" : "Static JSON + optional Redis",
            deploy: catKey === "devops" ? "AWS or local Compose" : "Vercel/Render/Fly + managed DB",
            securityNotes: "Secrets via env manager, least-priv DB roles, CSP on web, rate limits on public routes.",
            scaleNotes: "Add cache tier, read replicas, horizontal pods, and queue backpressure dashboards.",
            learn: "End-to-end ownership: UX, API contracts, infra basics, and measurable outcomes.",
            resume: "Quantify latency/cost changes; link live demo; pin README architecture diagram.",
            interview: "Be ready to whiteboard data model, failure modes, and rollback plan.",
          })
        );
      });
    }
    return out;
  }

  var emj = ["🎨", "📊", "🧭", "⚡", "🛰️", "💎", "🧪", "🌊", "🧩", "🔭"];

  var projects = []
    .concat(expand("frontend", FE_TEMPLATES, "frontend", emj))
    .concat(expand("backend", BE_TEMPLATES, "backend", ["🔐", "💬", "💳", "📁", "📣", "🧱", "🔎", "🚦", "🧬", "📜"]))
    .concat(expand("devops", DO_TEMPLATES, "devops", ["🐳", "☸️", "📡", "🪵", "🧭", "🔒", "📈", "🗄️", "🔄", "🛡️"]))
    .concat(expand("security", SEC_TEMPLATES, "security", ["🛡️", "🔑", "🧱", "🔍", "📜"]))
    .concat(expand("data-ai", DS_TEMPLATES, "data-ai", ["🧠", "📉", "💬", "🕵️", "🖼️", "📈", "🗺️", "🔎", "📓", "⚙️"]));

  global.TMProjects = { all: projects };
})(window);
