/**
 * Documentation hub: metadata + programmatic sections (A–J) for every technology.
 * Renders MDN/Vercel-style structure while staying data-driven.
 */
(function (global) {
  var DOC_GROUPS = [
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend" },
    { id: "devops", label: "DevOps & Cloud" },
    { id: "security", label: "Security" },
    { id: "data-ai", label: "Data Science & AI" },
  ];

  function entry(id, title, group, oneLiner, official) {
    return { id: id, title: title, group: group, oneLiner: oneLiner, official: official || "" };
  }

  var DOC_INDEX = [
    entry("html5", "HTML5", "frontend", "Semantic structure of the web; accessibility and SEO start here.", "https://developer.mozilla.org/docs/Web/HTML"),
    entry("css3", "CSS3", "frontend", "Layout, paint, and motion for responsive interfaces.", "https://developer.mozilla.org/docs/Web/CSS"),
    entry("javascript", "JavaScript", "frontend", "The universal runtime language of browsers and a dominant server runtime.", "https://developer.mozilla.org/docs/Web/JavaScript"),
    entry("typescript", "TypeScript", "frontend", "Gradual typing for large-scale JavaScript with great editor tooling.", "https://www.typescriptlang.org/docs/"),
    entry("react", "React", "frontend", "Component-driven UI with a strong ecosystem for SPAs and full-stack apps.", "https://react.dev/"),
    entry("nextjs", "Next.js", "frontend", "React framework for routing, SSR/RSC, and edge-ready deployments.", "https://nextjs.org/docs"),
    entry("tailwind-css", "Tailwind CSS", "frontend", "Utility-first styling with design-system speed.", "https://tailwindcss.com/docs"),
    entry("redux", "Redux", "frontend", "Predictable global state with explicit actions and reducers.", "https://redux.js.org/"),
    entry("zustand", "Zustand", "frontend", "Minimal global state for React without boilerplate.", "https://docs.pmnd.rs/zustand/getting-started/introduction"),
    entry("react-query", "TanStack Query (React Query)", "frontend", "Server-state caching, synchronization, and background refetching.", "https://tanstack.com/query/latest"),
    entry("framer-motion", "Framer Motion", "frontend", "Declarative animations and gestures in React.", "https://www.framer.com/motion/"),
    entry("vite", "Vite", "frontend", "Fast dev server and optimized builds using native ESM.", "https://vitejs.dev/guide/"),
    entry("webpack", "Webpack", "frontend", "Mature bundler with deep customization for complex apps.", "https://webpack.js.org/concepts/"),
    entry("nodejs", "Node.js", "backend", "Event-driven JavaScript runtime for APIs, CLIs, and tooling.", "https://nodejs.org/docs/latest/api/"),
    entry("express", "Express.js", "backend", "Minimal HTTP framework for Node APIs and middleware pipelines.", "https://expressjs.com/"),
    entry("nestjs", "NestJS", "backend", "Structured Node framework with modules, DI, and enterprise patterns.", "https://docs.nestjs.com/"),
    entry("rest-api", "REST API Design", "backend", "Resource modeling, HTTP verbs, idempotency, and versioning.", "https://datatracker.ietf.org/doc/html/rfc9110"),
    entry("graphql", "GraphQL", "backend", "Client-shaped queries with schema-first typing and batching concerns.", "https://graphql.org/learn/"),
    entry("websockets", "WebSockets", "backend", "Full-duplex channels for realtime dashboards, chat, and presence.", "https://developer.mozilla.org/docs/Web/API/WebSockets_API"),
    entry("jwt", "JWT", "backend", "Signed bearer tokens for stateless auth with revocation tradeoffs.", "https://datatracker.ietf.org/doc/html/rfc7519"),
    entry("oauth", "OAuth 2.0 / OIDC", "backend", "Delegated authorization and identity federation for web and mobile.", "https://oauth.net/2/"),
    entry("prisma", "Prisma", "backend", "Type-safe ORM and migrations across SQL databases.", "https://www.prisma.io/docs"),
    entry("mongodb", "MongoDB", "backend", "Document database with flexible schema and horizontal scaling paths.", "https://www.mongodb.com/docs/"),
    entry("postgresql", "PostgreSQL", "backend", "Advanced open-source SQL with strong consistency and extensions.", "https://www.postgresql.org/docs/"),
    entry("redis", "Redis", "backend", "In-memory data structure server for cache, rate limits, and queues.", "https://redis.io/docs/"),
    entry("linux", "Linux", "devops", "Server OS foundation for containers, networking, and performance tuning.", "https://docs.kernel.org/"),
    entry("docker", "Docker", "devops", "Packaging apps as portable containers with isolated filesystems.", "https://docs.docker.com/"),
    entry("docker-compose", "Docker Compose", "devops", "Multi-container local stacks with networking and volumes.", "https://docs.docker.com/compose/"),
    entry("kubernetes", "Kubernetes", "devops", "Orchestration for scheduling, scaling, and self-healing workloads.", "https://kubernetes.io/docs/home/"),
    entry("nginx", "Nginx", "devops", "High-performance reverse proxy, TLS termination, and static file serving.", "https://nginx.org/en/docs/"),
    entry("aws", "AWS (Core)", "devops", "Broad cloud primitives: compute, storage, networking, and IAM.", "https://docs.aws.amazon.com/"),
    entry("ec2", "Amazon EC2", "devops", "Virtual machines, placement, and instance families for workloads.", "https://docs.aws.amazon.com/ec2/"),
    entry("s3", "Amazon S3", "devops", "Durable object storage with lifecycle, policies, and events.", "https://docs.aws.amazon.com/s3/"),
    entry("cloudfront", "CloudFront", "devops", "Global CDN for caching, TLS, and signed URLs at the edge.", "https://docs.aws.amazon.com/cloudfront/"),
    entry("cicd", "CI/CD Concepts", "devops", "Automated build, test, and deploy loops with quality gates.", "https://martinfowler.com/articles/continuousIntegration.html"),
    entry("github-actions", "GitHub Actions", "devops", "YAML workflows for CI/CD, releases, and security scanning.", "https://docs.github.com/actions"),
    entry("git", "Git", "devops", "Distributed version control, branching strategies, and review workflows that scale teams.", "https://git-scm.com/doc"),
    entry("terraform", "Terraform", "devops", "Declarative IaC with state, modules, and drift detection.", "https://developer.hashicorp.com/terraform/docs"),
    entry("monitoring", "Monitoring", "devops", "Golden signals, SLIs/SLOs, dashboards, and alert hygiene.", "https://sre.google/sre-book/monitoring-distributed-systems/"),
    entry("logging", "Logging", "devops", "Structured logs, correlation IDs, retention, and cost control.", "https://www.oreilly.com/library/view/distributed-systems/9781491982503/ch04.html"),
    entry("owasp-top-10", "OWASP Top 10", "security", "Prioritized web risks from injection to SSRF and misconfiguration.", "https://owasp.org/www-project-top-ten/"),
    entry("xss", "Cross-Site Scripting (XSS)", "security", "Injecting scripts into trusted contexts; defense in depth required.", "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"),
    entry("csrf", "CSRF", "security", "Forging state-changing requests via another site; token and cookie defenses.", "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"),
    entry("sql-injection", "SQL Injection", "security", "Breaking query structure via untrusted input; parameterization is baseline.", "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"),
    entry("authentication", "Authentication", "security", "Proving identity: passwords, MFA, WebAuthn, sessions, and tokens.", "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"),
    entry("authorization", "Authorization", "security", "Enforcing what identities can do: RBAC, ABAC, policy engines.", "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"),
    entry("https", "HTTPS & TLS", "security", "Transport encryption, certificate lifecycle, and modern TLS settings.", "https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html"),
    entry("rate-limiting", "Rate Limiting", "security", "Protecting APIs from abuse with token buckets, leaky buckets, and keys.", "https://cloud.google.com/architecture/rate-limiting-strategies-techniques"),
    entry("security-headers", "Security Headers", "security", "CSP, HSTS, XFO, CORP/COOP and hardening the browser execution context.", "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html"),
    entry("secure-architecture", "Secure Architecture", "security", "Threat modeling, least privilege, segmentation, and secure SDLC.", "https://owasp.org/www-project-threat-dragon/"),
    entry("python-ds", "Python (Data)", "data-ai", "The lingua franca for notebooks, ETL, and ML tooling.", "https://docs.python.org/3/"),
    entry("numpy", "NumPy", "data-ai", "Vectorized numerics and ndarray broadcasting for scientific computing.", "https://numpy.org/doc/stable/"),
    entry("pandas", "Pandas", "data-ai", "Tabular data manipulation: joins, resampling, and windowed analytics.", "https://pandas.pydata.org/docs/"),
    entry("matplotlib", "Matplotlib", "data-ai", "Foundational plotting library for publication-style charts.", "https://matplotlib.org/stable/contents.html"),
    entry("seaborn", "Seaborn", "data-ai", "Statistical visualization on top of Matplotlib.", "https://seaborn.pydata.org/tutorial.html"),
    entry("scikit-learn", "Scikit-learn", "data-ai", "Classic ML algorithms with consistent estimator APIs.", "https://scikit-learn.org/stable/user_guide.html"),
    entry("tensorflow", "TensorFlow", "data-ai", "Production-grade graphs and tf.data pipelines; Keras high-level API.", "https://www.tensorflow.org/learn"),
    entry("pytorch", "PyTorch", "data-ai", "Dynamic tensors and research-friendly autograd for deep learning.", "https://pytorch.org/docs/stable/index.html"),
    entry("jupyter", "Jupyter Notebook", "data-ai", "Interactive literate computing mixing prose, code, and plots.", "https://docs.jupyter.org/en/latest/"),
    entry("data-cleaning", "Data Cleaning", "data-ai", "Missing values, outliers, schema alignment, and reproducible pipelines.", "https://cran.r-project.org/web/packages/naniar/vignettes/getting-started-w-naniar.html"),
    entry("machine-learning", "Machine Learning", "data-ai", "Supervised/unsupervised learning, evaluation, and generalization.", "https://developers.google.com/machine-learning/crash-course"),
    entry("deep-learning", "Deep Learning", "data-ai", "Representation learning with neural networks at scale.", "https://www.deeplearningbook.org/"),
    entry("nlp", "Natural Language Processing", "data-ai", "Tokenization, embeddings, sequence models, and LLM-era tooling.", "https://huggingface.co/learn/nlp-course/chapter1/1"),
    entry("computer-vision", "Computer Vision", "data-ai", "Image classification, detection, segmentation, and augmentation.", "https://cs231n.github.io/"),
    entry("ai-apis", "AI APIs", "data-ai", "Hosted inference, batching, safety filters, and cost controls.", "https://platform.openai.com/docs/guides/text-generation"),
    entry("llm-basics", "LLM Basics", "data-ai", "Tokens, context windows, prompting, and evaluation beyond loss curves.", "https://platform.openai.com/docs/guides/prompt-engineering"),
    entry("rag-systems", "RAG Systems", "data-ai", "Retrieval-augmented generation: chunking, embeddings, and grounding.", "https://arxiv.org/abs/2005.11401"),
    entry("vector-databases", "Vector Databases", "data-ai", "ANN indexes, metadata filters, and hybrid search patterns.", "https://www.pinecone.io/learn/vector-database/"),
  ];

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/`/g, "&#x60;");
  }

  function callout(kind, title, body) {
    var cls = "doc-callout doc-callout--" + kind;
    return '<div class="' + cls + '"><strong>' + esc(title) + "</strong><p>" + body + "</p></div>";
  }

  function codeBlock(lang, code) {
    return (
      '<div class="code-block-wrap" data-code-wrap><div class="code-block-toolbar"><span class="code-lang">' +
      esc(lang || "text") +
      '</span><button type="button" class="code-copy-btn" data-copy-code>Copy</button></div><pre class="code-block"><code class="hljs language-' +
      esc(lang || "text") +
      '">' +
      esc(code) +
      "</code></pre></div>"
    );
  }

  function sectionBeginner(meta) {
    return (
      '<h2 id="sec-beginner">Beginner-friendly primer</h2><p>If you are <strong>brand new</strong>, read this section slowly. The goal is not to memorize jargon—it is to build a mental model you can extend with docs and practice.</p>' +
      "<h3>What problem does this solve?</h3><p>Every serious tool exists because teams repeatedly hit the same bottlenecks: speed, safety, cost, or collaboration. " +
      esc(meta.title) +
      " is chosen when those bottlenecks outweigh the learning curve.</p>" +
      "<h3>How to read official docs efficiently</h3><ol><li>Skim the <em>Getting started</em> in 15 minutes.</li><li>Reproduce the smallest example end-to-end.</li><li>Change one variable at a time to see what breaks.</li><li>Write a one-page cheat sheet in your own words.</li></ol>" +
      "<h3>Visual mental model</h3><div class=\"doc-diagram\" aria-label=\"Concept diagram\"><div class=\"doc-diagram-inner\"><div class=\"doc-node\">Inputs</div><div class=\"doc-arrow\">→</div><div class=\"doc-node doc-node--accent\">" +
      esc(meta.title) +
      '</div><div class="doc-arrow">→</div><div class="doc-node">Outputs</div></div><p class="doc-diagram-caption">Treat every subsystem as a box with explicit contracts: what enters, what leaves, and what must never happen.</p></div>' +
      callout(
        "note",
        "Common beginner traps",
        "Tutorial drift (skipping fundamentals), copy-paste without tests, skipping error handling, and avoiding observability until production pain arrives."
      ) +
      "<h3>30-minute warm-up lab</h3><ul><li>Install only what the official quickstart requires</li><li>Run the hello-world and commit it to git</li><li>Add one automated check (lint, test, or typecheck)</li><li>Write a README section titled <em>When this breaks</em></li></ul>"
    );
  }

  function sectionA(meta) {
    return (
      "<h2 id=\"sec-intro\">Introduction</h2><p><strong>" +
      esc(meta.title) +
      "</strong> — " +
      esc(meta.oneLiner) +
      "</p><p>Teams adopt it to reduce time-to-market for " +
      esc(meta.group) +
      " workloads while keeping operability predictable. It appears in production when reliability, security, and maintainability constraints outweigh toy-demo simplicity.</p>" +
      callout("tip", "Why companies care", "Hiring managers look for depth: tradeoffs, failure modes, and how you instrument and ship changes safely—not buzzwords.") +
      "<h3>Real-world use cases</h3><ul><li>Customer-facing web properties and dashboards</li><li>Internal platforms and admin consoles</li><li>Data-heavy APIs and batch/stream pipelines</li><li>Edge and mobile-adjacent experiences</li></ul>" +
      "<h3>Advantages & disadvantages</h3><ul><li><strong>Pros:</strong> ecosystem maturity, hiring pool, integrations, long-term vendor/community support.</li><li><strong>Cons:</strong> complexity creep, operational overhead, security surface area, and upgrade tax as versions evolve.</li></ul>"
    );
  }

  function sectionB(meta) {
    return (
      "<h2 id=\"sec-path\">Learning path</h2><div class=\"doc-tabs\" data-tabs><button type=\"button\" class=\"doc-tab active\" data-tab=\"basics\">Basics</button><button type=\"button\" class=\"doc-tab\" data-tab=\"mid\">Intermediate</button><button type=\"button\" class=\"doc-tab\" data-tab=\"adv\">Advanced</button><button type=\"button\" class=\"doc-tab\" data-tab=\"best\">Best practices</button></div>" +
      '<div class="doc-tab-panel active" data-panel="basics"><ul><li>Install toolchain and reproduce official quickstart</li><li>Build smallest end-to-end example with tests</li><li>Read error messages and logs as primary feedback loop</li></ul></div>' +
      '<div class="doc-tab-panel" data-panel="mid"><ul><li>Integrate with persistence, auth, and background jobs</li><li>Profile latency and memory; fix top hotspots</li><li>Add CI checks: lint, typecheck, unit tests</li></ul></div>' +
      '<div class="doc-tab-panel" data-panel="adv"><ul><li>Design for multi-region, sharding, or strict SLAs</li><li>Chaos drills, game days, and progressive delivery</li><li>Security reviews: threat modeling + dependency governance</li></ul></div>' +
      '<div class="doc-tab-panel" data-panel="best"><ul><li>Prefer boring technology where it reduces risk</li><li>Document runbooks and define SLOs before scaling spend</li><li>Automate rollbacks and keep changes small</li></ul></div>'
    );
  }

  function sectionC(meta) {
    var snippet =
      meta.group === "data-ai"
        ? "import numpy as np\nx = np.arange(12).reshape(3, 4)\nprint(x.mean(axis=1))"
        : "export async function health() {\n  return { ok: true, service: '" + esc(meta.id) + "' };\n}";
    return (
      "<h2 id=\"sec-syntax\">Syntax & examples</h2><p>Prefer small, composable examples that you can paste into a scratch repo and extend. Pair every snippet with a test or assertion that locks intent.</p>" +
      codeBlock(meta.group === "data-ai" ? "python" : "typescript", snippet) +
      callout("warn", "Common mistakes", "Copy-pasting snippets without adapting types, timeouts, retries, and auth boundaries is a top source of production incidents.") +
      "<h3>Best practices</h3><ul><li>Validate inputs at boundaries</li><li>Keep side effects explicit</li><li>Use structured logging with correlation IDs</li></ul>"
    );
  }

  function sectionD(meta) {
    return (
      "<h2 id=\"sec-arch\">Architecture & internals</h2><p>Explain the request/render lifecycle in your domain: how work enters the system, where state mutates, and where caches short-circuit expensive paths. For browser tech, connect parsing → style → layout → paint → composite. For services, connect sockets → parsers → handlers → IO → serializers.</p>" +
      "<h3>Execution & networking</h3><p>Describe timeouts, retries with jitter, cancellation, and backpressure. Security-wise, assume hostile inputs and compromised dependencies—defense in depth beats single controls.</p>"
    );
  }

  function sectionE(meta) {
    return (
      "<h2 id=\"sec-prod\">Production concepts</h2><ul><li><strong>Scaling:</strong> horizontal vs vertical, state locality, and cache tiers</li><li><strong>Optimization:</strong> measure first; avoid premature micro-optimizations</li><li><strong>Security:</strong> least privilege, secrets rotation, audit trails</li><li><strong>Deployment:</strong> blue/green or canary with automated health checks</li><li><strong>Monitoring:</strong> RED/USE metrics where applicable</li><li><strong>Debugging:</strong> bisect releases, compare traces, reproduce with fixtures</li><li><strong>Performance:</strong> budgets per route/screen; guard regressions in CI</li></ul>"
    );
  }

  function sectionF(meta) {
    return (
      "<h2 id=\"sec-tools\">Tooling ecosystem</h2><p>Map the surrounding tools your team actually uses: formatters, linters, test runners, bundlers, observability agents, and cloud control planes. Extensions and IDE integrations reduce friction; platform golden paths reduce decision fatigue.</p>"
    );
  }

  function sectionG(meta) {
    return (
      "<h2 id=\"sec-install\">Installation</h2><div class=\"doc-columns\"><div><h3>Windows</h3><p>Use WSL2 for parity with Linux servers. Install LTS runtimes, enable long paths, and prefer package managers (winget/choco) for repeatable setups.</p></div><div><h3>macOS</h3><p>Homebrew for CLIs; watch Apple Silicon compatibility for native modules.</p></div><div><h3>Linux</h3><p>Match distro packages vs upstream binaries; pin versions in containers.</p></div></div>" +
      callout("note", "Common errors", "PATH pollution, mixed Node/Python versions, and proxy SSL interception breaking installs.") +
      "<p>Required software usually includes a version manager, git, a modern terminal, and a container runtime for production-like dev.</p>"
    );
  }

  function sectionH(meta) {
    return (
      "<h2 id=\"sec-interview\">Interview notes</h2><ul><li>Explain tradeoffs, not definitions only</li><li>Prepare 2 war stories with metrics</li><li>Contrast with adjacent tools honestly</li><li>Discuss failure modes and observability</li></ul><p>Senior signals: incident response, migrations, and cost awareness.</p>"
    );
  }

  function sectionI(meta) {
    return (
      "<h2 id=\"sec-workflow\">Professional workflow</h2><p>Trunk-based development with small PRs, preview environments, feature flags, and automated checks mirror how strong teams ship " +
      esc(meta.title) +
      ". Pair Git hygiene (conventional commits, semantic release) with CI/CD that proves artifacts before promotion.</p>"
    );
  }

  function sectionCheats(meta) {
    if (!global.TM_DOC_DATA || typeof global.TM_DOC_DATA.cheatFor !== "function") return "";
    return '<h2 id="sec-cheats">Syntax cheat sheet & quick tables</h2><p>Copy snippets into a scratch repo. Prefer tiny experiments over passive reading.</p>' + global.TM_DOC_DATA.cheatFor(meta);
  }

  function sectionResourcesRich(meta) {
    var yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent(meta.title + " deep dive 2026");
    var base =
      "<h2 id=\"sec-resources\">Free learning resources</h2><p>High-signal links across levels. External resources open in a new tab.</p>" +
      (global.TM_DOC_DATA && typeof global.TM_DOC_DATA.resourceTable === "function"
        ? global.TM_DOC_DATA.resourceTable(meta)
        : "") +
      "<h3>Search & practice</h3><ul>" +
      (meta.official ? '<li><a href="' + esc(meta.official) + '" target="_blank" rel="noopener noreferrer">Official documentation ↗</a></li>' : "") +
      "<li><a href=\"" +
      yt +
      "\" target=\"_blank\" rel=\"noopener noreferrer\">YouTube search for this topic ↗</a></li>" +
      "<li><a href=\"https://github.com/search?q=" +
      encodeURIComponent(meta.title + " awesome") +
      "\" target=\"_blank\" rel=\"noopener noreferrer\">GitHub discovery search ↗</a></li>" +
      "<li>Capstone idea: ship a weekend project and publish a retrospective with metrics.</li></ul>";
    return base;
  }

  function buildArticleHtml(meta) {
    return (
      sectionA(meta) +
      sectionBeginner(meta) +
      sectionB(meta) +
      sectionC(meta) +
      sectionD(meta) +
      sectionE(meta) +
      sectionF(meta) +
      sectionG(meta) +
      sectionH(meta) +
      sectionI(meta) +
      sectionCheats(meta) +
      sectionResourcesRich(meta)
    );
  }

  function buildToc() {
    return [
      { id: "sec-intro", label: "Introduction" },
      { id: "sec-beginner", label: "Beginner primer" },
      { id: "sec-path", label: "Learning path" },
      { id: "sec-syntax", label: "Syntax & examples" },
      { id: "sec-arch", label: "Architecture" },
      { id: "sec-prod", label: "Production" },
      { id: "sec-tools", label: "Tooling" },
      { id: "sec-install", label: "Installation" },
      { id: "sec-interview", label: "Interview notes" },
      { id: "sec-workflow", label: "Workflow" },
      { id: "sec-cheats", label: "Cheat sheet" },
      { id: "sec-resources", label: "Free resources" },
    ];
  }

  function getDocById(id) {
    return DOC_INDEX.find(function (d) {
      return d.id === id;
    });
  }

  function searchDocs(q) {
    var qq = q.toLowerCase().trim();
    if (!qq) return DOC_INDEX.slice();
    return DOC_INDEX.filter(function (d) {
      return (
        d.title.toLowerCase().indexOf(qq) >= 0 ||
        d.oneLiner.toLowerCase().indexOf(qq) >= 0 ||
        d.id.indexOf(qq) >= 0 ||
        d.group.toLowerCase().indexOf(qq) >= 0
      );
    });
  }

  global.TMDocs = {
    DOC_GROUPS: DOC_GROUPS,
    DOC_INDEX: DOC_INDEX,
    getDocById: getDocById,
    searchDocs: searchDocs,
    buildArticleHtml: buildArticleHtml,
    buildToc: buildToc,
    esc: esc,
  };
})(window);
