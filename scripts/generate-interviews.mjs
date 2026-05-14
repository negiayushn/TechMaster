/**
 * Generates 100+ interview items per technology from structured subtopic knowledge.
 * Run: npm run generate:interviews
 * Output: data/generated-interviews.json (loaded optionally by the app)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "data", "generated-interviews.json");

const TECH_CONFIG = {
  html: { label: "HTML", subtopics: semanticSubtopics("HTML", "documents", "accessibility tree") },
  css: { label: "CSS", subtopics: semanticSubtopics("CSS", "layout and paint", "cascade") },
  javascript: { label: "JavaScript", subtopics: jsSubtopics() },
  react: { label: "React", subtopics: reactSubtopics() },
  nextjs: { label: "Next.js", subtopics: nextSubtopics() },
  nodejs: { label: "Node.js", subtopics: nodeSubtopics() },
  express: { label: "Express", subtopics: expressSubtopics() },
  mongodb: { label: "MongoDB", subtopics: mongoSubtopics() },
  sql: { label: "SQL", subtopics: sqlSubtopics() },
  docker: { label: "Docker", subtopics: dockerSubtopics() },
  kubernetes: { label: "Kubernetes", subtopics: k8sSubtopics() },
  aws: { label: "AWS", subtopics: awsSubtopics() },
  security: { label: "Security", subtopics: securitySubtopics() },
  datascience: { label: "Data Science", subtopics: dsSubtopics() },
  python: { label: "Python", subtopics: pythonSubtopics() },
  ml: { label: "Machine Learning", subtopics: mlSubtopics() },
  devops: { label: "DevOps", subtopics: devopsSubtopics() },
  "system-design": { label: "System Design", subtopics: sdSubtopics() },
};

const DIFF_VARIANTS = [
  { key: "beginner", title: "Foundations" },
  { key: "intermediate", title: "Applied" },
  { key: "advanced", title: "Deep dive" },
  { key: "system", title: "System design angle" },
  { key: "debugging", title: "Debugging / incident" },
];

function semanticSubtopics(tech, core, mechanism) {
  return [
    { id: "semantics", name: "Semantics & structure", hook: "how structure impacts parsers and assistive tech" },
    { id: "forms", name: "Forms & validation", hook: "progressive enhancement and security boundaries" },
    { id: "media", name: "Media & performance", hook: "lazy loading, responsive images, and Core Web Vitals" },
    { id: "a11y", name: "Accessibility", hook: "WCAG principles, focus management, and ARIA usage" },
    { id: "seo", name: "SEO fundamentals", hook: "crawl budget, canonicalization, and structured data" },
    { id: "security", name: "HTML security basics", hook: "CSP, sandboxing iframes, and link rel policies" },
    { id: "dom", name: "DOM relationship", hook: "how markup becomes the ${mechanism}" },
    { id: "meta", name: "Meta tags & social", hook: "OpenGraph, Twitter cards, and PWA manifests" },
    { id: "email", name: "Email HTML constraints", hook: "table layouts, inline CSS, and client quirks" },
    { id: "templates", name: "Templating in frameworks", hook: "how ${tech} composes reusable UI fragments" },
    { id: "perf", name: "Rendering performance", hook: "minimizing reflow when changing ${core}" },
    { id: "i18n", name: "Internationalization", hook: "dir attributes, lang tags, and unicode considerations" },
    { id: "legacy", name: "Legacy browser constraints", hook: "polyfills, progressive enhancement, and fallbacks" },
    { id: "testing", name: "UI testing implications", hook: "stable selectors vs brittle XPath in e2e tests" },
    { id: "design", name: "Design handoff", hook: "translating Figma spacing and typography into ${tech}" },
    { id: "tokens", name: "Design tokens", hook: "centralizing color, spacing, and typography decisions" },
    { id: "components", name: "Component boundaries", hook: "where presentation logic should live in teams" },
    { id: "micro", name: "Micro-frontends", hook: "composition patterns and shared dependencies" },
    { id: "ssr", name: "SSR markup", hook: "hydration mismatches and streaming HTML" },
    { id: "edge", name: "Edge rendering", hook: "HTML personalization close to users" },
    { id: "caching", name: "HTTP caching", hook: "ETags, cache-control, and stale-while-revalidate" },
    { id: "cdn", name: "CDN behavior", hook: "cache keys and purging strategies" },
    { id: "pwa", name: "PWA shell", hook: "service workers and offline-first HTML shells" },
    { id: "cms", name: "Headless CMS", hook: "structured content models feeding frontends" },
    { id: "analytics", name: "Analytics instrumentation", hook: "privacy-friendly event capture in markup" },
  ];
}

function jsSubtopics() {
  return semanticSubtopics("JavaScript", "event loop", "execution model").map((s, i) =>
    i < 12 ? s : { ...s, name: s.name + " (JS runtime)" }
  );
}
function reactSubtopics() {
  const base = [
    { id: "fiber", name: "React rendering model", hook: "Fiber, concurrent features, and scheduling" },
    { id: "hooks", name: "Hooks rules", hook: "stale closures, dependency arrays, and custom hooks" },
    { id: "state", name: "State management", hook: "lifting state, colocation, and performance" },
    { id: "suspense", name: "Suspense & boundaries", hook: "error boundaries and async UI" },
    { id: "ssr", name: "SSR & hydration", hook: "streaming, selective hydration, and mismatches" },
    { id: "perf", name: "Memoization", hook: "useMemo, useCallback, and when they hurt" },
    { id: "forms", name: "Controlled inputs", hook: "validation patterns and accessibility" },
    { id: "context", name: "Context API", hook: "avoiding unnecessary rerenders" },
    { id: "portal", name: "Portals", hook: "modals, z-index, and event bubbling" },
    { id: "refs", name: "Refs & DOM", hook: "imperative handles and third-party integration" },
    { id: "effects", name: "useEffect lifecycle", hook: "cleanups, subscriptions, and race conditions" },
    { id: "testing", name: "Testing React", hook: "RTL philosophy and user-centric queries" },
    { id: "router", name: "Routing", hook: "data routers and loaders in modern stacks" },
    { id: "rsc", name: "Server Components", hook: "client/server boundaries and serialization" },
    { id: "a11y", name: "Accessibility in React", hook: "focus traps and aria live regions" },
    { id: "i18n", name: "i18n", hook: "lazy translation loading and ICU messages" },
    { id: "security", name: "XSS in React", hook: "dangerouslySetInnerHTML and sanitization" },
    { id: "bundle", name: "Bundle splitting", hook: "dynamic import and route-based code splitting" },
    { id: "patterns", name: "Compound components", hook: "flexible APIs vs prop drilling" },
    { id: "errors", name: "Error handling", hook: "error boundaries vs try/catch in async" },
    { id: "animation", name: "Animation integration", hook: "layout thrashing and FLIP techniques" },
    { id: "charts", name: "Data viz", hook: "large datasets and virtualization" },
    { id: "tables", name: "Data grids", hook: "windowing and keyboard navigation" },
    { id: "auth", name: "Auth in SPAs", hook: "token storage tradeoffs" },
    { id: "realtime", name: "Realtime UI", hook: "websocket reconnect strategies in React" },
  ];
  return base;
}
function nextSubtopics() {
  return [
    { id: "app-router", name: "App Router", hook: "layouts, nested routing, and caching semantics" },
    { id: "rsc", name: "React Server Components", hook: "data fetching at the edge of server/client" },
    { id: "isr", name: "ISR & caching", hook: "revalidate tags, paths, and stale data risks" },
    { id: "middleware", name: "Middleware", hook: "auth redirects, geo, and A/B at the edge" },
    { id: "images", name: "next/image", hook: "optimization pipeline and layout stability" },
    { id: "fonts", name: "Font optimization", hook: "FOIT/FOUT and subsetting" },
    { id: "api", name: "Route handlers", hook: "when to use vs separate backend" },
    { id: "deploy", name: "Deployment model", hook: "serverless vs Node servers" },
    { id: "env", name: "Environment variables", hook: "public vs server secrets" },
    { id: "analytics", name: "Web vitals", hook: "measuring INP and LCP in production" },
    { id: "i18n", name: "Internationalization", hook: "subpath routing and locale detection" },
    { id: "auth", name: "Auth patterns", hook: "session cookies vs JWT in Next" },
    { id: "db", name: "Database access", hook: "connection pooling in serverless" },
    { id: "streaming", name: "Streaming SSR", hook: "suspense boundaries and waterfalls" },
    { id: "security", name: "Security headers", hook: "CSP, HSTS, and next.config headers" },
    { id: "monorepo", name: "Monorepos", hook: "Turborepo caching and shared UI packages" },
    { id: "testing", name: "Testing Next", hook: "Playwright vs Jest for app router" },
    { id: "edge", name: "Edge runtime", hook: "limitations vs Node APIs" },
    { id: "cdn", name: "CDN caching", hook: "cache-control for HTML vs assets" },
    { id: "observability", name: "Observability", hook: "OpenTelemetry in Next services" },
    { id: "perf", name: "Performance tuning", hook: "bundle analysis and server timings" },
    { id: "migration", name: "Migrating Pages→App", hook: "incremental adoption strategies" },
    { id: "content", name: "Content layer", hook: "MDX, content collections, and build-time data" },
    { id: "commerce", name: "E-commerce patterns", hook: "cart state and payment webhooks" },
    { id: "seo", name: "SEO", hook: "metadata API and canonical URLs" },
  ];
}
function nodeSubtopics() {
  return [
    { id: "eventloop", name: "Event loop", hook: "phases, timers, and microtasks" },
    { id: "streams", name: "Streams", hook: "backpressure and memory" },
    { id: "cluster", name: "Cluster & workers", hook: "scaling CPU-bound tasks" },
    { id: "buffers", name: "Buffers & encoding", hook: "binary protocols and UTF-8 pitfalls" },
    { id: "crypto", name: "crypto module", hook: "randomness, hashing, and timing attacks" },
    { id: "fs", name: "File system", hook: "async APIs and symlink security" },
    { id: "http", name: "HTTP server", hook: "keep-alive, timeouts, and slowloris" },
    { id: "net", name: "Networking", hook: "TCP vs UDP tradeoffs" },
    { id: "child", name: "Child processes", hook: "shell injection risks" },
    { id: "env", name: "Environment", hook: "12-factor config and secrets" },
    { id: "logging", name: "Logging", hook: "PII redaction and structured logs" },
    { id: "testing", name: "Testing", hook: "supertest and testcontainers" },
    { id: "modules", name: "Modules", hook: "CJS vs ESM interop" },
    { id: "perf", name: "Profiling", hook: "clinic.js and flamegraphs" },
    { id: "memory", name: "Memory leaks", hook: "event listeners and global caches" },
    { id: "security", name: "Security", hook: "prototype pollution and dependency audits" },
    { id: "package", name: "npm supply chain", hook: "lockfiles, provenance, and pinning" },
    { id: "native", name: "Native addons", hook: "N-API and ABI stability" },
    { id: "wasm", name: "WebAssembly", hook: "offloading hot paths" },
    { id: "observability", name: "Tracing", hook: "OpenTelemetry auto-instrumentation" },
    { id: "graphql", name: "GraphQL servers", hook: "N+1 and DataLoader" },
    { id: "websocket", name: "WebSockets", hook: "heartbeats and reconnect storms" },
    { id: "queue", name: "Queues", hook: "BullMQ and idempotency" },
    { id: "grpc", name: "gRPC", hook: "protobuf and HTTP/2" },
    { id: "serverless", name: "Serverless Node", hook: "cold starts and connection limits" },
  ];
}
function expressSubtopics() {
  return nodeSubtopics().slice(0, 22).map((s, i) => ({
    ...s,
    name: s.name.includes("Express") ? s.name : `Express: ${s.name}`,
    hook: s.hook + " in middleware-centric apps",
  }));
}
function mongoSubtopics() {
  return [
    { id: "docs", name: "Document model", hook: "embedding vs referencing" },
    { id: "indexes", name: "Indexing", hook: "compound indexes and ESR rule" },
    { id: "agg", name: "Aggregation", hook: "pipeline stages and memory limits" },
    { id: "transactions", name: "Transactions", hook: "multi-document ACID" },
    { id: "sharding", name: "Sharding", hook: "shard keys and hot partitions" },
    { id: "repl", name: "Replication", hook: "write concern and read preferences" },
    { id: "schema", name: "Schema design", hook: "anti-patterns for analytics" },
    { id: "ttl", name: "TTL indexes", hook: "data lifecycle" },
    { id: "search", name: "Atlas Search", hook: "full-text relevance" },
    { id: "changestream", name: "Change streams", hook: "event-driven architectures" },
    { id: "security", name: "Security", hook: "field-level encryption and least privilege" },
    { id: "backup", name: "Backups", hook: "PITR and restore drills" },
    { id: "migration", name: "Migrations", hook: "online schema changes" },
    { id: "orm", name: "ODM patterns", hook: "Mongoose middleware pitfalls" },
    { id: "perf", name: "Performance", hook: "explain plans and winning queries" },
    { id: "json", name: " BSON types", hook: "Decimal128 and dates" },
    { id: "gridfs", name: "GridFS", hook: "large blobs vs object storage" },
    { id: "multi", name: "Multi-tenancy", hook: "database-per-tenant vs shared collections" },
    { id: "capped", name: "Capped collections", hook: "ordered logs" },
    { id: "vector", name: "Vector search", hook: "embeddings and ANN indexes" },
    { id: "cost", name: "Cost control", hook: "Atlas tiering and data locality" },
    { id: "sql", name: "SQL vs Mongo", hook: "when relational wins" },
    { id: "dwh", name: "Warehouse offload", hook: "CDC to analytics" },
    { id: "compliance", name: "Compliance", hook: "encryption at rest and audit logs" },
    { id: "drivers", name: "Drivers", hook: "connection pools in serverless" },
  ];
}
function sqlSubtopics() {
  return [
    { id: "joins", name: "Joins", hook: "inner vs outer and cardinality" },
    { id: "indexes", name: "Indexes", hook: "B-tree vs hash and covering indexes" },
    { id: "transactions", name: "Transactions", hook: "isolation levels and anomalies" },
    { id: "locking", name: "Locking", hook: "row vs table locks and deadlocks" },
    { id: "mvcc", name: "MVCC", hook: "Postgres snapshots" },
    { id: "normalization", name: "Normalization", hook: "1NF-3NF tradeoffs" },
    { id: "denorm", name: "Denormalization", hook: "read optimization" },
    { id: "views", name: "Views & CTEs", hook: "readability vs optimization fences" },
    { id: "window", name: "Window functions", hook: "PARTITION BY pitfalls" },
    { id: "explain", name: "EXPLAIN plans", hook: "seq scans vs index scans" },
    { id: "partition", name: "Partitioning", hook: "pruning and maintenance" },
    { id: "replica", name: "Replication", hook: "lag and read-your-writes" },
    { id: "backup", name: "Backups", hook: "PITR" },
    { id: "migration", name: "Migrations", hook: "expand/contract pattern" },
    { id: "json", name: "JSON in SQL", hook: "indexing JSON paths" },
    { id: "fts", name: "Full-text search", hook: "ranking and stemming" },
    { id: "security", name: "SQL injection defense", hook: "prepared statements" },
    { id: "roles", name: "Roles", hook: "least privilege" },
    { id: "pool", name: "Connection pooling", hook: "PgBouncer modes" },
    { id: "orm", name: "ORM tradeoffs", hook: "N+1 queries" },
    { id: "analytics", name: "Analytics SQL", hook: "star schema queries" },
    { id: "cdc", name: "CDC", hook: "logical decoding" },
    { id: "temporal", name: "Temporal tables", hook: "auditing changes" },
    { id: "graph", name: "Graph patterns", hook: "recursive CTEs" },
    { id: "perf", name: "Query tuning", hook: "statistics and autovacuum" },
  ];
}
function dockerSubtopics() {
  return [
    { id: "image", name: "Images & layers", hook: "layer caching and multi-stage builds" },
    { id: "container", name: "Containers", hook: "namespaces and cgroups" },
    { id: "network", name: "Networking", hook: "bridge vs overlay" },
    { id: "volume", name: "Volumes", hook: "bind mounts vs named volumes" },
    { id: "compose", name: "Compose", hook: "service dependencies and healthchecks" },
    { id: "registry", name: "Registries", hook: "image signing and SBOMs" },
    { id: "security", name: "Container security", hook: "rootless, seccomp, AppArmor" },
    { id: "root", name: "Root user risks", hook: "USER directive" },
    { id: "secrets", name: "Secrets", hook: "BuildKit secrets and runtime mounts" },
    { id: "buildkit", name: "BuildKit", hook: "cache mounts and reproducible builds" },
    { id: "context", name: "Build context", hook: ".dockerignore hygiene" },
    { id: "distroless", name: "Distroless/minimal images", hook: "attack surface reduction" },
    { id: "debug", name: "Debugging", hook: "docker exec and ephemeral debug containers" },
    { id: "logs", name: "Logging", hook: "log drivers and centralized logging" },
    { id: "resource", name: "Resource limits", hook: "CPU/mem requests in orchestrators" },
    { id: "gpu", name: "GPU containers", hook: "nvidia runtime" },
    { id: "windows", name: "Windows containers", hook: "LCOW vs WCOW" },
    { id: "swarm", name: "Swarm mode", hook: "when Kubernetes is overkill" },
    { id: "k8s", name: "Kubernetes integration", hook: "imagePullPolicy and probes" },
    { id: "ci", name: "CI builds", hook: "layer caching in pipelines" },
    { id: "sbom", name: "SBOM & scanning", hook: "Trivy/Grype workflows" },
    { id: "migration", name: "VM→container", hook: "lift-and-shift pitfalls" },
    { id: "storage", name: "Storage drivers", hook: "overlay2 vs btrfs" },
    { id: "dns", name: "Embedded DNS", hook: "service discovery in compose" },
    { id: "health", name: "Healthchecks", hook: "start_period and flaky dependencies" },
  ];
}
function k8sSubtopics() {
  return [
    { id: "pods", name: "Pods & controllers", hook: "ReplicaSet vs Deployment" },
    { id: "svc", name: "Services", hook: "ClusterIP vs NodePort vs LoadBalancer" },
    { id: "ingress", name: "Ingress", hook: "controllers and TLS termination" },
    { id: "deploy", name: "Deployments", hook: "rollouts and maxUnavailable" },
    { id: "hpa", name: "Autoscaling", hook: "HPA metrics and lag" },
    { id: "vpa", name: "VPA", hook: "right-sizing tradeoffs" },
    { id: "sched", name: "Scheduling", hook: "affinity/anti-affinity" },
    { id: "taints", name: "Taints & tolerations", hook: "dedicated nodes" },
    { id: "rbac", name: "RBAC", hook: "least privilege for service accounts" },
    { id: "secrets", name: "Secrets", hook: "encryption at rest and external secret operators" },
    { id: "netpol", name: "NetworkPolicy", hook: "default deny patterns" },
    { id: "cni", name: "CNI", hook: "Calico/Cilium differences at a high level" },
    { id: "storage", name: "PV/PVC", hook: "access modes and expansion" },
    { id: "stateful", name: "StatefulSets", hook: "stable network identity" },
    { id: "jobs", name: "Jobs/CronJobs", hook: "backoff and concurrency" },
    { id: "crds", name: "CRDs & operators", hook: "level-based reconciliation" },
    { id: "helm", name: "Helm", hook: "templating pitfalls and values layering" },
    { id: "gitops", name: "GitOps", hook: "Argo CD drift detection" },
    { id: "mesh", name: "Service mesh", hook: "mTLS and observability sidecars" },
    { id: "cost", name: "Cost", hook: "requests/limits and cluster autoscaling" },
    { id: "upgrade", name: "Cluster upgrades", hook: "surge/unavailability budgets" },
    { id: "debug", name: "Debugging", hook: "kubectl events and ephemeral containers" },
    { id: "multi", name: "Multi-cluster", hook: "federation vs active-active" },
    { id: "windows", name: "Windows nodes", hook: "taints and image compatibility" },
    { id: "policy", name: "Policy engines", hook: "OPA/Gatekeeper" },
  ];
}
function awsSubtopics() {
  return [
    { id: "iam", name: "IAM", hook: "roles, policies, and SCPs" },
    { id: "ec2", name: "EC2", hook: "placement groups and instance families" },
    { id: "s3", name: "S3", hook: "strong consistency and lifecycle rules" },
    { id: "cf", name: "CloudFront", hook: "caching behaviors and signed URLs" },
    { id: "rds", name: "RDS/Aurora", hook: "failover and read replicas" },
    { id: "vpc", name: "VPC", hook: "subnets, NACLs, and security groups" },
    { id: "lambda", name: "Lambda", hook: "cold starts and concurrency limits" },
    { id: "api", name: "API Gateway", hook: "throttling and auth" },
    { id: "sqs", name: "SQS/SNS", hook: "fan-out and deduplication" },
    { id: "kinesis", name: "Kinesis", hook: "ordering vs throughput" },
    { id: "dynamo", name: "DynamoDB", hook: "single-table design" },
    { id: "cfn", name: "CloudFormation", hook: "drift and change sets" },
    { id: "terraform", name: "Terraform on AWS", hook: "state backends and workspaces" },
    { id: "eks", name: "EKS", hook: "control plane networking" },
    { id: "ecs", name: "ECS/Fargate", hook: "task definitions vs k8s pods" },
    { id: "cw", name: "CloudWatch", hook: "metrics vs logs vs traces" },
    { id: "xray", name: "X-Ray", hook: "sampling and service maps" },
    { id: "waf", name: "WAF", hook: "managed rule groups" },
    { id: "kms", name: "KMS", hook: "envelope encryption" },
    { id: "secrets", name: "Secrets Manager", hook: "rotation" },
    { id: "org", name: "Organizations", hook: "multi-account strategy" },
    { id: "cost", name: "Cost Explorer", hook: "RI/SP and tagging" },
    { id: "ha", name: "HA architectures", hook: "multi-AZ patterns" },
    { id: "disaster", name: "DR", hook: "RPO/RTO and backups" },
    { id: "compliance", name: "Compliance", hook: "shared responsibility model" },
  ];
}
function securitySubtopics() {
  return [
    { id: "owasp", name: "OWASP Top 10", hook: "prioritization for web apps" },
    { id: "xss", name: "XSS", hook: "stored vs reflected vs DOM" },
    { id: "csrf", name: "CSRF", hook: "double-submit vs SameSite cookies" },
    { id: "sqli", name: "SQLi", hook: "blind techniques and ORM gaps" },
    { id: "ssrf", name: "SSRF", hook: "metadata endpoints and allowlists" },
    { id: "idor", name: "IDOR/BOLA", hook: "object-level authorization" },
    { id: "authn", name: "Authentication", hook: "MFA, phishing resistance" },
    { id: "authz", name: "Authorization", hook: "RBAC/ABAC/ReBAC" },
    { id: "jwt", name: "JWT pitfalls", hook: "alg:none, kid injection, revocation" },
    { id: "oauth", name: "OAuth/OIDC", hook: "redirect URI validation" },
    { id: "session", name: "Session fixation", hook: "rotation on privilege change" },
    { id: "cors", name: "CORS misconfig", hook: "null origin and credentials" },
    { id: "csp", name: "CSP", hook: "nonce vs hash policies" },
    { id: "hsts", name: "Transport security", hook: "HSTS preload" },
    { id: "secrets", name: "Secret management", hook: "vaulting and rotation" },
    { id: "deps", name: "Dependency risk", hook: "SCA and provenance" },
    { id: "sast", name: "SAST/DAST", hook: "where tools fail" },
    { id: "threat", name: "Threat modeling", hook: "STRIDE/PASTA" },
    { id: "zero", name: "Zero trust", hook: "identity-aware proxies" },
    { id: "logging", name: "Security logging", hook: "tamper-evident audit trails" },
    { id: "incident", name: "Incident response", hook: "containment and forensics" },
    { id: "crypto", name: "Crypto basics", hook: "AEAD, KDFs, and randomness" },
    { id: "pki", name: "PKI/TLS", hook: "mTLS in microservices" },
    { id: "container", name: "Container escape classes", hook: "kernel CVE impact" },
    { id: "cloud", name: "Cloud IAM blast radius", hook: "overprivileged roles" },
  ];
}
function dsSubtopics() {
  return [
    { id: "pipeline", name: "Data pipelines", hook: "ETL vs ELT" },
    { id: "quality", name: "Data quality", hook: "great expectations and monitoring" },
    { id: "viz", name: "Visualization", hook: "honest charting and accessibility" },
    { id: "stats", name: "Statistics", hook: "hypothesis testing pitfalls" },
    { id: "sampling", name: "Sampling bias", hook: "selection and survivorship" },
    { id: "leakage", name: "Train/test leakage", hook: "target leakage and temporal splits" },
    { id: "features", name: "Feature engineering", hook: "encoding categoricals" },
    { id: "scaling", name: "Scaling", hook: "standardization vs normalization" },
    { id: "metrics", name: "Evaluation metrics", hook: "precision/recall tradeoffs" },
    { id: "imbalance", name: "Class imbalance", hook: "resampling and calibrated thresholds" },
    { id: "experiment", name: "Experimentation", hook: "A/B testing and power" },
    { id: "causal", name: "Causal thinking", hook: "confounders" },
    { id: "deploy", name: "Model deployment", hook: "batch vs online inference" },
    { id: "monitor", name: "Monitoring", hook: "data drift vs concept drift" },
    { id: "privacy", name: "Privacy", hook: "PII minimization and DP basics" },
    { id: "gpu", name: "GPU workflows", hook: "memory ceilings" },
    { id: "storage", name: "Feature stores", hook: "online/offline consistency" },
    { id: "vector", name: "Embeddings", hook: "vector DB tradeoffs" },
    { id: "llm", name: "LLM evaluation", hook: "benchmarks vs product metrics" },
    { id: "rag", name: "RAG systems", hook: "chunking, retrieval, and grounding" },
    { id: "mlops", name: "MLOps", hook: "CI/CD for models" },
    { id: "governance", name: "Governance", hook: "model cards" },
    { id: "cost", name: "Cost", hook: "training vs inference spend" },
    { id: "ethics", name: "Ethics", hook: "fairness constraints" },
    { id: "interview", name: "Interview patterns", hook: "communicating uncertainty" },
  ];
}
function pythonSubtopics() {
  return dsSubtopics().map((s) => ({ ...s, name: `Python: ${s.name}`, hook: s.hook + " with CPython ergonomics" }));
}
function mlSubtopics() {
  return [
    { id: "sup", name: "Supervised learning", hook: "bias/variance" },
    { id: "lin", name: "Linear models", hook: "regularization" },
    { id: "trees", name: "Tree models", hook: "monotonic constraints and interactions" },
    { id: "ensemble", name: "Ensembles", hook: "bagging vs boosting" },
    { id: "cv", name: "Cross-validation", hook: "grouped CV for leakage prevention" },
    { id: "opt", name: "Optimization", hook: "learning rates and schedulers" },
    { id: "dl", name: "Neural nets", hook: "initialization and vanishing gradients" },
    { id: "cnn", name: "CNNs", hook: "inductive bias for vision" },
    { id: "rnn", name: "Sequence models", hook: "LSTM/GRU vs Transformers" },
    { id: "nlp", name: "NLP", hook: "tokenization and subword models" },
    { id: "cv2", name: "Computer vision", hook: "data augmentation" },
    { id: "uns", name: "Unsupervised", hook: "clustering assumptions" },
    { id: "dim", name: "Dimensionality reduction", hook: "PCA vs UMAP intent" },
    { id: "prob", name: "Probabilistic ML", hook: "calibration and Platt scaling" },
    { id: "auto", name: "AutoML", hook: "when it helps vs hides issues" },
    { id: "xai", name: "Explainability", hook: "SHAP limitations" },
    { id: "robust", name: "Robustness", hook: "adversarial examples" },
    { id: "online", name: "Online learning", hook: "concept drift handling" },
    { id: "graph", name: "Graph ML", hook: "message passing intuition" },
    { id: "rec", name: "Recommenders", hook: "two-tower retrieval" },
    { id: "rank", name: "Learning to rank", hook: "pairwise vs listwise" },
    { id: "ts", name: "Time series", hook: "stationarity and seasonality" },
    { id: "causal", name: "Causal ML", hook: "uplift modeling" },
    { id: "sys", name: "Training systems", hook: "mixed precision and distributed training" },
    { id: "eval", name: "Offline metrics vs online", hook: "interleaving and guardrails" },
  ];
}
function devopsSubtopics() {
  return [
    { id: "cicd", name: "CI/CD", hook: "quality gates and trunk-based development" },
    { id: "iac", name: "IaC", hook: "idempotency and drift" },
    { id: "obs", name: "Observability pillars", hook: "metrics, logs, traces" },
    { id: "slo", name: "SLOs & error budgets", hook: "burn alerts" },
    { id: "postmortem", name: "Blameless postmortems", hook: "action items and follow-through" },
    { id: "release", name: "Release strategy", hook: "blue/green vs canary" },
    { id: "dbm", name: "Database migrations", hook: "expand/contract with zero downtime" },
    { id: "secrets", name: "Secrets distribution", hook: "short-lived credentials" },
    { id: "supply", name: "Supply chain security", hook: "SLSA and signing" },
    { id: "oncall", name: "On-call", hook: "runbooks and escalation" },
    { id: "capacity", name: "Capacity planning", hook: "load testing methodology" },
    { id: "chaos", name: "Chaos engineering", hook: "blast radius control" },
    { id: "cost", name: "FinOps", hook: "unit economics of services" },
    { id: "platform", name: "Platform engineering", hook: "golden paths" },
    { id: "k8s", name: "Kubernetes ops", hook: "upgrades and node rotation" },
    { id: "linux", name: "Linux hardening", hook: "sysctl and seccomp" },
    { id: "network", name: "Networking", hook: "MTU, DNS, and timeouts" },
    { id: "logging", name: "Logging pipelines", hook: "cardinality explosion" },
    { id: "tracing", name: "Distributed tracing", hook: "sampling head vs tail" },
    { id: "apm", name: "APM", hook: "custom instrumentation" },
    { id: "pager", name: "Alerting", hook: "symptoms vs causes" },
    { id: "backup", name: "Backups & restores", hook: "game days" },
    { id: "multi", name: "Multi-region", hook: "data locality laws" },
    { id: "compliance", name: "Compliance automation", hook: "policy as code" },
    { id: "devxp", name: "Developer experience", hook: "local dev parity with prod" },
  ];
}
function sdSubtopics() {
  return [
    { id: "requirements", name: "Requirements shaping", hook: "NFRs: latency, throughput, durability" },
    { id: "estimation", name: "Back-of-envelope", hook: "QPS, storage, bandwidth" },
    { id: "api", name: "API design", hook: "idempotency keys and versioning" },
    { id: "db", name: "Database choice", hook: "SQL vs NoSQL vs NewSQL" },
    { id: "cache", name: "Caching", hook: "cache-aside vs write-through" },
    { id: "cdn", name: "CDN", hook: "edge caching and invalidation" },
    { id: "search", name: "Search", hook: "inverted indexes and ranking" },
    { id: "queue", name: "Message queues", hook: "ordering, DLQs, and poison messages" },
    { id: "stream", name: "Stream processing", hook: "windowing and exactly-once myths" },
    { id: "sharding", name: "Sharding", hook: "resharding strategies" },
    { id: "replication", name: "Replication", hook: "leader/follower and quorum" },
    { id: "consistency", name: "Consistency models", hook: "strong vs eventual in UX" },
    { id: "rate", name: "Rate limiting", hook: "token bucket at gateway" },
    { id: "auth", name: "Auth at scale", hook: "session stores and device binding" },
    { id: "payments", name: "Payments", hook: "ledgering and idempotency" },
    { id: "notifications", name: "Notifications", hook: "fan-out and templating" },
    { id: "feed", name: "Feeds/timelines", hook: "push vs pull models" },
    { id: "geo", name: "Geodistributed systems", hook: "multi-master tradeoffs" },
    { id: "obs", name: "Observability architecture", hook: "golden signals per service" },
    { id: "degradation", name: "Graceful degradation", hook: "feature flags and load shedding" },
    { id: "incident", name: "Incident design", hook: "bulkheads and timeouts" },
    { id: "cost", name: "Cost-aware design", hook: "S3 tiers and lifecycle" },
    { id: "compliance", name: "Compliance", hook: "audit trails and retention" },
    { id: "migration", name: "Strangler fig migrations", hook: "incremental cutover" },
    { id: "interview", name: "Interview communication", hook: "clarifying questions checklist" },
  ];
}

function buildQuestion(techKey, techLabel, sub, variant, index) {
  const v = DIFF_VARIANTS.find((x) => x.key === variant) || DIFF_VARIANTS[0];
  const qStem = questionStem(techLabel, sub.name, v.key);
  return {
    id: `${techKey}-${sub.id}-${variant}-${index}`,
    technology: techKey,
    technologyLabel: techLabel,
    difficulty: v.key,
    category: classify(sub, v.key),
    question: qStem,
    answer: answerParagraph(techLabel, sub, v.key),
    strategy: answerStrategy(v.key),
    example: exampleSnippet(techKey, v.key, sub.id),
    mistakes: mistakesList(techLabel, v.key),
    followUps: followUps(sub.name, v.key),
  };
}

function classify(sub, diff) {
  if (diff === "system") return "system-design";
  if (diff === "debugging") return "debugging";
  if (diff === "advanced") return "advanced";
  if (diff === "intermediate") return "intermediate";
  return "beginner";
}

function questionStem(techLabel, topicName, diff) {
  if (diff === "beginner") return `In ${techLabel}, explain ${topicName} to a junior engineer. What matters most day-to-day?`;
  if (diff === "intermediate") return `${techLabel} interview: How would you implement or reason about ${topicName} in a production service?`;
  if (diff === "advanced") return `Advanced ${techLabel}: What are the sharp edges of ${topicName}, and how do senior engineers mitigate them?`;
  if (diff === "system") return `System design angle: Where does ${topicName} show up in architecture tradeoffs for a high-traffic ${techLabel} stack?`;
  return `Debugging scenario: Users report intermittent failures tied to ${topicName} in ${techLabel}. How do you isolate root cause and verify the fix?`;
}

function answerParagraph(techLabel, sub, diff) {
  const hook = sub.hook || "real-world constraints";
  if (diff === "beginner")
    return `Start with a crisp definition of ${sub.name} in ${techLabel}, then connect it to ${hook}. Mention the primary user-visible outcome, the main moving parts teams configure, and one concrete checklist item you always verify in code review (correctness, safety, or operability). Close with how this topic interacts with adjacent concerns like performance, security, or maintainability.`;
  if (diff === "intermediate")
    return `Walk through a practical approach: requirements, constraints, and a stepwise implementation plan for ${sub.name}. Discuss tradeoffs teams debate in production (latency vs complexity, consistency vs availability, DX vs strictness), and name monitoring or tests that prove the behavior. Tie it back to ${hook} so the answer sounds like shipping experience, not textbook memorization.`;
  if (diff === "advanced")
    return `Go deep on failure modes: race conditions, scaling cliffs, misleading metrics, and “works on my machine” traps for ${sub.name}. Explain how you would prove correctness under concurrency, how you’d bound blast radius during rollout, and what observability signals you’d watch. Reference ${hook} explicitly and give a senior-level mitigation pattern (automation, guardrails, or platform defaults).`;
  if (diff === "system")
    return `Frame the discussion around bottlenecks and contracts: which service owns ${sub.name}, how data flows across boundaries, and what SLIs degrade first under load. Compare at least two architectural options, including operational cost and team cognitive load. Anchor the narrative in ${hook} and end with a phased rollout plan and rollback triggers.`;
  return `Describe a disciplined incident workflow: reproduce, narrow (binary search configs/versions), inspect logs/traces/metrics, form hypotheses, and run a minimal experiment. For ${sub.name}, list two common misconfigurations and one subtle code bug pattern. Explain verification (canary, shadow traffic, feature flag) and how you’d prevent recurrence via tests, guardrails, or runbooks tied to ${hook}.`;
}

function answerStrategy(diff) {
  if (diff === "beginner") return "Clarify scope in one sentence, define terms, then give a memorable mental model and a tiny example.";
  if (diff === "intermediate") return "Use STAR-lite: situation/constraints → actions → measurable outcome → tradeoffs.";
  if (diff === "advanced") return "Lead with risks and invariants, then mechanisms, then how you validate in prod-like conditions.";
  if (diff === "system") return "Start with requirements and estimates, draw boundaries, then iterate on tradeoffs with explicit assumptions.";
  return "Show structured debugging: hypotheses, evidence, smallest change, verification, and prevention.";
}

function exampleSnippet(techKey, diff, subId) {
  const codeByTech = {
    javascript: `// Example: defensive async sequencing\nasync function fetchUserSafe(id) {\n  const res = await fetch(\`/api/users/\${id}\`);\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n}`,
    react: `// Example: stable callback without stale state surprises\nfunction useDebounced(cb, ms) {\n  const ref = useRef(cb);\n  useEffect(() => { ref.current = cb; }, [cb]);\n  return useMemo(() => debounce((...a) => ref.current(...a), ms), [ms]);\n}`,
    nodejs: `// Example: bounded concurrency pool\nasync function mapPool(items, limit, worker) {\n  const ret = new Array(items.length);\n  let i = 0;\n  const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {\n    while (i < items.length) {\n      const idx = i++;\n      ret[idx] = await worker(items[idx], idx);\n    }\n  });\n  await Promise.all(runners);\n  return ret;\n}`,
    docker: `# Example: multi-stage Node build\nFROM node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nFROM gcr.io/distroless/nodejs20-debian12\nCOPY --from=build /app/dist /app/dist\nCMD ["/app/dist/server.js"]`,
    sql: `-- Example: safer pagination than OFFSET for large tables\nSELECT * FROM posts\nWHERE (created_at, id) < (:cursor_ts, :cursor_id)\nORDER BY created_at DESC, id DESC\nLIMIT 50;`,
    kubernetes: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  replicas: 3\n  selector: { matchLabels: { app: api } }\n  template:\n    metadata: { labels: { app: api } }\n    spec:\n      containers:\n        - name: api\n          image: ghcr.io/org/api:1.4.2\n          resources:\n            requests: { cpu: "250m", memory: "512Mi" }\n            limits: { memory: "1Gi" }`,
  };
  const base = codeByTech[techKey] || `// ${techKey}: illustrate ${subId} with a minimal, testable snippet tied to your last project.`;
  return diff === "debugging" ? `${base}\n\n// Add: temporary structured logs + correlation id` : base;
}

function mistakesList(techLabel, diff) {
  const common = [
    "Answering with buzzwords instead of mechanisms.",
    "Ignoring operational constraints (rollbacks, migrations, observability).",
    "Claiming a single 'best' tool with no tradeoff discussion.",
  ];
  if (diff === "debugging") return ["Skipping reproduction steps.", "Changing multiple variables at once.", ...common];
  return common;
}

function followUps(topicName, diff) {
  return [
    `How would your answer change at 10× traffic for ${topicName}?`,
    `What metrics would you monitor to detect regressions in ${topicName}?`,
    diff === "system" ? "How does cost scale with your proposed design?" : "What tests would you add to lock the behavior in?",
  ];
}

function buildAll() {
  const out = [];
  for (const [techKey, cfg] of Object.entries(TECH_CONFIG)) {
    const subs = cfg.subtopics;
    for (const sub of subs) {
      for (const variant of DIFF_VARIANTS) {
        out.push(buildQuestion(techKey, cfg.label, sub, variant.key, out.length));
      }
    }
  }
  return out;
}

const items = buildAll();
fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: items.length, items }, null, 0), "utf8");
console.log(`Wrote ${items.length} interview items to ${outPath}`);
