/**
 * Curated free learning resources + cheat sheet fragments per documentation topic.
 * Consumed by js/docs-engine.js when building articles.
 */
(function (global) {
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/`/g, "&#x60;");
  }

  function linkRow(title, url, tier) {
    return (
      '<tr data-tier="' +
      esc(tier) +
      '"><td><span class="res-tier res-tier--' +
      esc(tier) +
      '">' +
      esc(tier) +
      '</span></td><td><a class="res-link" href="' +
      esc(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(title) +
      ' <span class="res-ext" aria-hidden="true">↗</span></a></td></tr>'
    );
  }

  var COMMON = {
    mdnLearn: ["https://developer.mozilla.org/en-US/docs/Learn", "MDN Curriculum", "beginner"],
    fcc: ["https://www.freecodecamp.org/", "freeCodeCamp core curriculum", "beginner"],
    odin: ["https://www.theodinproject.com/", "The Odin Project", "beginner"],
    roadmapSh: ["https://roadmap.sh/", "roadmap.sh visual paths", "intermediate"],
    fso: ["https://fullstackopen.com/en/", "Full Stack Open (University of Helsinki)", "intermediate"],
    cs50: ["https://cs50.harvard.edu/web/", "CS50 Web", "intermediate"],
    fireship: ["https://www.youtube.com/@Fireship", "Fireship (concise concepts)", "intermediate"],
    traversy: ["https://www.youtube.com/@TraversyMedia", "Traversy Media project builds", "beginner"],
    exercism: ["https://exercism.org/", "Exercism practice tracks", "interview"],
    leet: ["https://leetcode.com/problemset/all/", "LeetCode problem bank", "interview"],
    neet: ["https://neetcode.io/", "NeetCode curated patterns", "interview"],
    odinJs: ["https://www.theodinproject.com/paths/full-stack-javascript/courses/javascript", "Odin JavaScript path", "beginner"],
  };

  /** @type {Record<string, Array<[string,string,string]>>} */
  var EXTRA_BY_ID = {
    html5: [
      COMMON.mdnLearn,
      ["https://developer.mozilla.org/en-US/docs/Web/HTML", "MDN HTML reference", "beginner"],
      COMMON.fcc,
      COMMON.odin,
      ["https://web.dev/learn/html/", "web.dev Learn HTML", "beginner"],
      COMMON.roadmapSh,
      COMMON.cs50,
    ],
    css3: [
      ["https://developer.mozilla.org/en-US/docs/Web/CSS", "MDN CSS reference", "beginner"],
      ["https://web.dev/learn/css/", "web.dev Learn CSS", "beginner"],
      COMMON.fcc,
      ["https://tailwindcss.com/docs", "Tailwind docs (utility mindset)", "intermediate"],
      COMMON.roadmapSh,
    ],
    javascript: [
      COMMON.mdnLearn,
      COMMON.odinJs,
      COMMON.fcc,
      ["https://javascript.info/", "JavaScript.info deep tutorial", "beginner"],
      COMMON.fso,
      COMMON.neet,
    ],
    typescript: [
      ["https://www.typescriptlang.org/docs/", "Official TypeScript Handbook", "beginner"],
      ["https://github.com/typescript-cheatsheets/react", "React+TS cheatsheets (repo)", "intermediate"],
      COMMON.fso,
      COMMON.roadmapSh,
    ],
    react: [
      ["https://react.dev/learn", "React official Learn", "beginner"],
      ["https://beta.reactjs.org/learn/thinking-in-react", "Thinking in React", "beginner"],
      COMMON.fso,
      ["https://epicreact.dev/", "Epic React (Kent C. Dodds) — paid with free previews", "advanced"],
      COMMON.exercism,
    ],
    nextjs: [
      ["https://nextjs.org/learn", "Next.js Learn (official)", "beginner"],
      ["https://vercel.com/docs", "Vercel deployment docs", "intermediate"],
      COMMON.fso,
      COMMON.roadmapSh,
    ],
    "tailwind-css": [
      ["https://tailwindcss.com/docs", "Tailwind official docs", "beginner"],
      ["https://play.tailwindcss.com/", "Tailwind Play CDN sandbox", "beginner"],
      COMMON.fcc,
    ],
    nodejs: [
      ["https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", "Node.js official Learn", "beginner"],
      ["https://github.com/goldbergy/node-best-practices", "Node.js Best Practices (GitHub)", "advanced"],
      COMMON.fso,
    ],
    express: [
      ["https://expressjs.com/", "Express official guide", "beginner"],
      COMMON.fso,
      ["https://github.com/expressjs/express/tree/master/examples", "Express examples in repo", "intermediate"],
    ],
    mongodb: [
      ["https://learn.mongodb.com/", "MongoDB University (free courses)", "beginner"],
      ["https://www.mongodb.com/docs/", "MongoDB official docs", "intermediate"],
    ],
    postgresql: [
      ["https://www.postgresql.org/docs/", "PostgreSQL manuals", "intermediate"],
      ["https://www.enterprisedb.com/postgres-tutorials", "EDB tutorials", "beginner"],
    ],
    docker: [
      ["https://docs.docker.com/get-started/", "Docker official Get Started", "beginner"],
      ["https://github.com/docker/awesome-compose", "awesome-compose templates", "intermediate"],
    ],
    kubernetes: [
      ["https://kubernetes.io/docs/tutorials/", "Kubernetes official tutorials", "beginner"],
      ["https://kube.academy/", "KubeAcademy (VMware)", "intermediate"],
    ],
    linux: [
      ["https://linuxjourney.com/", "Linux Journey", "beginner"],
      ["https://ubuntu.com/tutorials", "Ubuntu tutorials", "beginner"],
    ],
    aws: [
      ["https://aws.amazon.com/getting-started-hands-on/", "AWS hands-on tutorials", "beginner"],
      ["https://docs.aws.amazon.com/", "AWS documentation portal", "intermediate"],
    ],
    "github-actions": [
      ["https://docs.github.com/actions", "GitHub Actions docs", "beginner"],
      ["https://github.com/skills", "GitHub Skills interactive labs", "beginner"],
    ],
    "python-ds": [
      ["https://docs.python.org/3/tutorial/", "Official Python tutorial", "beginner"],
      ["https://automatetheboringstuff.com/", "Automate the Boring Stuff", "beginner"],
    ],
    numpy: [["https://numpy.org/doc/stable/user/quickstart.html", "NumPy quickstart", "beginner"]],
    pandas: [["https://pandas.pydata.org/docs/getting_started/index.html", "Pandas getting started", "beginner"]],
    tensorflow: [["https://www.tensorflow.org/tutorials", "TensorFlow tutorials", "beginner"]],
    pytorch: [["https://pytorch.org/tutorials/", "PyTorch official tutorials", "beginner"]],
    git: [
      ["https://git-scm.com/book/en/v2", "Pro Git book (free)", "beginner"],
      ["https://learngitbranching.js.org/", "Learn Git Branching (interactive)", "beginner"],
      ["https://github.com/git-guides", "GitHub Git Guides", "beginner"],
    ],

    // === FRONTEND (additions) ===
    svelte: [
      ["https://svelte.dev/tutorial", "Svelte interactive tutorial", "beginner"],
      ["https://learn.svelte.dev/", "Svelte Learn (official)", "beginner"],
      COMMON.odin,
    ],
    threejs: [
      ["https://threejs.org/manual/", "Three.js fundamentals", "beginner"],
      ["https://threejs.org/examples/", "Three.js examples gallery", "intermediate"],
    ],
    gsap: [
      ["https://gsap.com/get-started/", "GSAP getting started guide", "beginner"],
      ["https://gsap.com/showcase/", "GSAP showcase demos", "intermediate"],
    ],

    // === BACKEND (additions) ===
    socketio: [
      ["https://socket.io/get-started/chat", "Socket.io chat tutorial", "beginner"],
      ["https://socket.io/docs/v4/", "Socket.io official docs", "intermediate"],
      COMMON.fso,
    ],
    fastapi: [
      ["https://fastapi.tiangolo.com/tutorial/", "FastAPI official tutorial", "beginner"],
      ["https://github.com/mjhea0/awesome-fastapi", "Awesome FastAPI resources", "intermediate"],
    ],
    kafka: [
      ["https://kafka.apache.org/quickstart", "Kafka quickstart", "beginner"],
      ["https://developer.confluent.io/", "Confluent developer tutorials", "intermediate"],
      COMMON.roadmapSh,
    ],
    elasticsearch: [
      ["https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html", "Elasticsearch getting started", "beginner"],
      ["https://www.elastic.co/training/free", "Elastic free training courses", "intermediate"],
    ],
    trpc: [
      ["https://trpc.io/docs/quickstart", "tRPC quickstart", "beginner"],
      ["https://trpc.io/docs/example-apps", "tRPC example apps", "intermediate"],
    ],

    // === DEVOPS (additions) ===
    prometheus: [
      ["https://prometheus.io/docs/prometheus/latest/getting_started/", "Prometheus getting started", "beginner"],
      ["https://prometheus.io/docs/practices/", "Prometheus best practices", "advanced"],
    ],
    grafana: [
      ["https://grafana.com/tutorials/", "Grafana tutorials", "beginner"],
      ["https://grafana.com/docs/grafana/latest/dashboards/", "Grafana dashboard docs", "intermediate"],
    ],
    helm: [
      ["https://helm.sh/docs/intro/quickstart/", "Helm quickstart guide", "beginner"],
      ["https://helm.sh/docs/chart_template_guide/", "Helm chart template guide", "advanced"],
    ],
    vault: [
      ["https://developer.hashicorp.com/vault/tutorials", "Vault tutorials (HashiCorp Learn)", "beginner"],
      ["https://developer.hashicorp.com/vault/docs", "Vault official documentation", "intermediate"],
    ],

    // === SECURITY (additions) ===
    trivy: [
      ["https://trivy.dev/docs/getting-started/installation/", "Trivy installation & quickstart", "beginner"],
      ["https://trivy.dev/docs/scanner/vulnerability/", "Trivy vulnerability scanning", "intermediate"],
    ],
    opa: [
      ["https://www.openpolicyagent.org/docs/latest/#getting-started", "OPA getting started", "beginner"],
      ["https://play.openpolicyagent.org/", "OPA Rego playground", "beginner"],
      ["https://www.openpolicyagent.org/docs/latest/policy-reference/", "OPA policy reference", "advanced"],
    ],

    // === DATA-AI (additions) ===
    langchain: [
      ["https://python.langchain.com/docs/tutorials/", "LangChain official tutorials", "beginner"],
      ["https://github.com/langchain-ai/langchain", "LangChain GitHub repo", "intermediate"],
    ],
    huggingface: [
      ["https://huggingface.co/learn/nlp-course", "Hugging Face NLP course", "beginner"],
      ["https://huggingface.co/docs/hub/", "Hugging Face Hub documentation", "intermediate"],
    ],
    xgboost: [
      ["https://xgboost.readthedocs.io/en/stable/get_started.html", "XGBoost getting started", "beginner"],
      ["https://github.com/dmlc/xgboost/tree/master/demo", "XGBoost demo gallery", "intermediate"],
    ],
    mlflow: [
      ["https://mlflow.org/docs/latest/quickstart.html", "MLflow quickstart", "beginner"],
      ["https://mlflow.org/docs/latest/tracking.html", "MLflow tracking docs", "intermediate"],
    ],
    shap: [
      ["https://shap.readthedocs.io/en/latest/example_notebooks/overviews/An%20introduction%20to%20SHAP.html", "SHAP introduction notebook", "beginner"],
      ["https://github.com/shap/shap", "SHAP GitHub repo with examples", "intermediate"],
    ],

    // === BLOCKCHAIN ===
    solidity: [
      ["https://cryptozombies.io/", "CryptoZombies interactive Solidity course", "beginner"],
      ["https://docs.soliditylang.org/en/latest/introduction-to-smart-contracts.html", "Solidity official introduction", "beginner"],
      ["https://github.com/OpenZeppelin/openzeppelin-contracts", "OpenZeppelin contract library", "intermediate"],
    ],
    hardhat: [
      ["https://hardhat.org/tutorial", "Hardhat official tutorial", "beginner"],
      ["https://hardhat.org/hardhat-runner/docs/guides/deploying", "Hardhat deployment guide", "intermediate"],
    ],
    ethersjs: [
      ["https://docs.ethers.org/v6/getting-started/", "ethers.js getting started", "beginner"],
      ["https://github.com/ethers-io/ethers.js", "ethers.js GitHub repo", "intermediate"],
    ],
    openzeppelin: [
      ["https://docs.openzeppelin.com/contracts/5.x/", "OpenZeppelin Contracts docs", "beginner"],
      ["https://docs.openzeppelin.com/contracts/5.x/wizard", "OpenZeppelin Contract Wizard", "beginner"],
    ],
    ipfs: [
      ["https://docs.ipfs.tech/quickstart/", "IPFS quickstart guide", "beginner"],
      ["https://proto.school/", "ProtoSchool IPFS tutorials", "beginner"],
      ["https://docs.ipfs.tech/concepts/", "IPFS concepts", "intermediate"],
    ],
  };

  function defaultPack(meta) {
    var rows = [];
    if (meta.official) rows.push([meta.official, "Official documentation", "beginner"]);
    rows.push(
      [COMMON.mdnLearn[0], COMMON.mdnLearn[1], COMMON.mdnLearn[2]],
      [COMMON.fcc[0], COMMON.fcc[1], COMMON.fcc[2]],
      [COMMON.roadmapSh[0], COMMON.roadmapSh[1], COMMON.roadmapSh[2]],
      [COMMON.fso[0], COMMON.fso[1], COMMON.fso[2]],
      [COMMON.exercism[0], COMMON.exercism[1], COMMON.exercism[2]],
      [COMMON.neet[0], COMMON.neet[1], COMMON.neet[2]]
    );
    return rows;
  }

  function resourceTable(meta) {
    var rows = (EXTRA_BY_ID[meta.id] || defaultPack(meta))
      .map(function (r) {
        return linkRow(r[1], r[0], r[2]);
      })
      .join("");
    return (
      '<div class="doc-resource-panel" data-res-panel><div class="doc-resource-toolbar">' +
      '<input type="search" class="doc-res-filter" data-res-filter placeholder="Filter resources…" aria-label="Filter resources" />' +
      '<div class="doc-res-chips">' +
      '<button type="button" class="res-chip active" data-res-tier="all">All</button>' +
      '<button type="button" class="res-chip" data-res-tier="beginner">Beginner</button>' +
      '<button type="button" class="res-chip" data-res-tier="intermediate">Intermediate</button>' +
      '<button type="button" class="res-chip" data-res-tier="advanced">Advanced</button>' +
      '<button type="button" class="res-chip" data-res-tier="interview">Interview</button>' +
      "</div></div>" +
      '<table class="doc-res-table"><tbody>' +
      rows +
      "</tbody></table></div>"
    );
  }

  function cheatSql() {
    return (
      codeBlock("sql", "-- Select with filter & sort\nSELECT id, email\nFROM users\nWHERE active = TRUE\nORDER BY created_at DESC\nLIMIT 50;") +
      quickTable("SQL quick ref", [
        ["SELECT … FROM … WHERE", "Filter rows"],
        ["JOIN … ON", "Relate tables"],
        ["GROUP BY + HAVING", "Aggregate filters"],
        ["INSERT … RETURNING", "Safe round-trip (Postgres)"],
        ["EXPLAIN ANALYZE", "Performance insight"],
      ])
    );
  }

  function codeBlock(lang, code) {
    return (
      '<div class="code-block-wrap" data-code-wrap><div class="code-block-toolbar"><span class="code-lang">' +
      esc(lang) +
      '</span><button type="button" class="code-copy-btn" data-copy-code>Copy</button></div><pre class="code-block"><code class="hljs language-' +
      esc(lang) +
      '">' +
      esc(code) +
      "</code></pre></div>"
    );
  }

  function quickTable(title, rows) {
    var body = rows
      .map(function (r) {
        return "<tr><td><code>" + esc(r[0]) + "</code></td><td>" + esc(r[1]) + "</td></tr>";
      })
      .join("");
    return (
      '<h4>' +
      esc(title) +
      '</h4><table class="doc-cheat-table"><thead><tr><th>Item</th><th>Meaning</th></tr></thead><tbody>' +
      body +
      "</tbody></table>"
    );
  }

  function cheatFor(meta) {
    var id = meta.id;
    if (id === "postgresql" || id === "mongodb" || id === "prisma" || id === "rest-api") return cheatSql();
    if (id === "docker" || id === "docker-compose")
      return (
        codeBlock("bash", "docker build -t app:1 .\ndocker run --rm -p 3000:3000 app:1\ndocker compose up --build") +
        quickTable("Docker CLI", [
          ["docker ps", "Running containers"],
          ["docker logs -f <id>", "Stream logs"],
          ["docker exec -it <id> sh", "Shell inside"],
          ["docker system df", "Disk usage"],
        ])
      );
    if (id === "kubernetes")
      return (
        codeBlock("bash", "kubectl get pods -n prod\nkubectl describe pod api-7d8f\nkubectl logs deploy/api -f --tail=50") +
        quickTable("kubectl essentials", [
          ["kubectl apply -f", "Declare desired state"],
          ["kubectl rollout status", "Watch deployment"],
          ["kubectl port-forward", "Local tunnel"],
        ])
      );
    if (id === "linux")
      return (
        codeBlock("bash", "ls -lah\ncd /var/log && tail -n 200 syslog\nps aux --sort=-%mem | head") +
        quickTable("Shell survival", [
          ["grep -RIn pattern .", "Recursive search"],
          ["chmod +x script.sh", "Executable bit"],
          ["journalctl -u nginx -f", "systemd logs"],
        ])
      );
    if (id === "github-actions")
      return (
        codeBlock("yaml", "name: ci\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 20 }\n      - run: npm ci && npm test") +
        quickTable("Actions patterns", [
          ["actions/cache", "Dependency caching"],
          ["concurrency:", "Cancel superseded runs"],
          ["permissions:", "Least-privilege token"],
        ])
      );
    if (id === "git")
      return (
        codeBlock("bash", "git switch -c feature/login\ngit add -p\ngit commit -m \"feat: login form\"\ngit push -u origin HEAD") +
        quickTable("Git essentials", [
          ["git restore --staged file", "Unstage"],
          ["git rebase -i HEAD~3", "Polish history"],
          ["git bisect", "Find bad commit"],
        ])
      );
    if (meta.group === "data-ai")
      return (
        codeBlock("python", "import pandas as pd\ndf = pd.read_csv('data.csv')\nprint(df.describe())") +
        quickTable("Pandas mental model", [
          ["df.loc vs df.iloc", "Label vs positional"],
          ["groupby().agg", "Split-apply-combine"],
          ["merge(how=…)", "SQL joins analog"],
        ])
      );
    if (id === "solidity")
      return (
        codeBlock("solidity", '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract Counter {\n    uint256 public count;\n    event Incremented(uint256 newCount);\n\n    function increment() external {\n        count += 1;\n        emit Incremented(count);\n    }\n}') +
        quickTable("Solidity essentials", [
          ["mapping(address => uint)", "Key-value storage"],
          ["require(cond, \"msg\")", "Guard with revert"],
          ["modifier onlyOwner", "Access control"],
          ["emit EventName()", "Log on-chain"],
        ])
      );
    if (id === "hardhat")
      return (
        codeBlock("typescript", 'import { ethers } from "hardhat";\n\nasync function deploy() {\n  const Counter = await ethers.getContractFactory("Counter");\n  const counter = await Counter.deploy();\n  await counter.waitForDeployment();\n  console.log("Deployed:", await counter.getAddress());\n}\n\ndeploy();') +
        quickTable("Hardhat commands", [
          ["npx hardhat compile", "Compile contracts"],
          ["npx hardhat test", "Run tests"],
          ["npx hardhat node", "Local network"],
          ["npx hardhat run scripts/deploy.ts --network sepolia", "Deploy to testnet"],
        ])
      );
    if (id === "socketio")
      return (
        codeBlock("javascript", 'import { Server } from "socket.io";\n\nconst io = new Server(3000);\nio.on("connection", (socket) => {\n  console.log("Client connected", socket.id);\n  socket.on("message", (data) => io.emit("message", data));\n  socket.on("disconnect", () => console.log("Gone"));\n});') +
        quickTable("Socket.io patterns", [
          ["io.emit()", "Broadcast to all"],
          ["socket.emit()", "Send to sender"],
          ["socket.broadcast.emit()", "All except sender"],
          ["socket.join(room)", "Room membership"],
        ])
      );
    if (id === "fastapi")
      return (
        codeBlock("python", "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get(\"/health\")\nasync def health():\n    return {\"ok\": True}\n\n@app.post(\"/items\")\nasync def create_item(name: str, price: float):\n    return {\"id\": 1, \"name\": name, \"price\": price}") +
        quickTable("FastAPI decorators", [
          ["@app.get/post/put/delete", "HTTP method routes"],
          ["Query(...) / Path(...)", "Validation & docs"],
          ["Depends()", "Dependency injection"],
          ["BackgroundTasks", "Async after response"],
        ])
      );
    if (id === "kafka")
      return (
        codeBlock("bash", "# Start Kafka with KRaft\nkafka-storage.sh format -t <uuid> -c config/kraft/server.properties\nkafka-server-start.sh config/kraft/server.properties\n\n# CLI basics\nkafka-topics.sh --create --topic orders --bootstrap-server localhost:9092\nkafka-console-producer.sh --topic orders\nkafka-console-consumer.sh --topic orders --from-beginning") +
        quickTable("Kafka concepts", [
          ["Topic", "Event category"],
          ["Partition", "Ordered log segment"],
          ["Consumer group", "Parallel processing"],
          ["Offset", "Position in partition"],
        ])
      );
    if (id === "elasticsearch")
      return (
        codeBlock("bash", "# Index a document\ncurl -X POST \"localhost:9200/products/_doc\" -H \"Content-Type: application/json\" -d\\\n  '{\"title\":\"Widget\",\"price\":9.99,\"in_stock\":true}'\n\n# Search\ncurl \"localhost:9200/products/_search?q=title:widget\"") +
        quickTable("ES query DSL", [
          ["match", "Full-text search"],
          ["term", "Exact value"],
          ["range", "Numeric/date filter"],
          ["bool must/filter/should", "Compound logic"],
        ])
      );
    if (id === "prometheus")
      return (
        codeBlock("yaml", "# prometheus.yml scrape config\nscrape_configs:\n  - job_name: \"api\"\n    static_configs:\n      - targets: [\"localhost:3000\"]") +
        quickTable("PromQL basics", [
          ["rate(http_requests_total[5m])", "Per-second rate"],
          ["histogram_quantile(0.95, …)", "p95 latency"],
          ["up == 0", "Down targets"],
          ["sum by (status) (…) ", "Grouped aggregation"],
        ])
      );
    if (id === "helm")
      return (
        codeBlock("bash", "helm create my-app\nhelm lint ./my-app\nhelm template ./my-app  # render locally\nhelm install release-name ./my-app\nhelm list\nhelm rollback release-name 1") +
        quickTable("Helm essentials", [
          ["Chart.yaml", "Metadata & deps"],
          ["values.yaml", "Config defaults"],
          ["_helpers.tpl", "Named templates"],
          ["helm upgrade --install", "Idempotent deploy"],
        ])
      );
    if (id === "langchain")
      return (
        codeBlock("python", "from langchain_core.prompts import ChatPromptTemplate\nfrom langchain_anthropic import ChatAnthropic\n\nprompt = ChatPromptTemplate.from_messages([\n  (\"system\", \"You are a helpful AI.\"),\n  (\"human\", \"{input}\"),\n])\nllm = ChatAnthropic(model=\"claude-3-5-sonnet-20241022\")\nchain = prompt | llm\n\nresponse = chain.invoke({\"input\": \"What is RAG?\"})") +
        quickTable("LangChain core", [
          ["ChatPromptTemplate", "Structured prompt"],
          ["RunnableSequence (|)", "Pipe components"],
          ["BaseRetriever", "Document fetch"],
          ["Tool / tool()", "Function calling"],
        ])
      );
    if (id === "xgboost")
      return (
        codeBlock("python", "import xgboost as xgb\nfrom sklearn.datasets import load_breast_cancer\n\nX, y = load_breast_cancer(return_X_y=True)\nmodel = xgb.XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, use_label_encoder=False, eval_metric=\"logloss\")\nmodel.fit(X, y)\nprint(\"Accuracy:\", model.score(X, y))") +
        quickTable("XGBoost params", [
          ["n_estimators", "Number of trees"],
          ["max_depth", "Tree complexity"],
          ["learning_rate", "Step size shrinkage"],
          ["subsample", "Row sampling ratio"],
        ])
      );
    if (id === "mlflow")
      return (
        codeBlock("python", "import mlflow\n\nmlflow.set_experiment(\"churn-prediction\")\nwith mlflow.start_run():\n    mlflow.log_param(\"model\", \"xgboost\")\n    mlflow.log_param(\"max_depth\", 6)\n    mlflow.log_metric(\"accuracy\", 0.94)\n    mlflow.sklearn.log_model(model, \"model\")") +
        quickTable("MLflow tracking", [
          ["log_param()", "Log hyperparameters"],
          ["log_metric()", "Log evaluation score"],
          ["log_model()", "Save model artifact"],
          ["mlflow ui", "View tracking UI"],
        ])
      );
    if (id === "shap")
      return (
        codeBlock("python", "import shap\nimport xgboost as xgb\n\nmodel = xgb.XGBClassifier().fit(X_train, y_train)\nexplainer = shap.Explainer(model)\nshap_values = explainer(X_test)\n\n# Summary plot\nshap.summary_plot(shap_values, X_test)") +
        quickTable("SHAP explanation types", [
          ["shap.Explainer", "Model-agnostic"],
          ["shap.TreeExplainer", "Fast for tree models"],
          ["shap_values[i]", "Single prediction"],
          ["shap.summary_plot", "Global importance"],
        ])
      );
    if (meta.group === "blockchain")
      return (
        codeBlock("javascript", '// Web3 provider interaction\nimport { ethers } from "ethers";\n\nconst provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_KEY");\nconst block = await provider.getBlockNumber();\nconsole.log("Current block:", block);') +
        quickTable("Web3 primitives", [
          ["Provider", "Blockchain connection"],
          ["Signer", "Wallet for tx signing"],
          ["Contract", "ABI + address wrapper"],
          ["ethers.parseEther()", "Convert ETH to wei"],
        ])
      );
    if (id === "react" || id === "nextjs")
      return (
        codeBlock("tsx", "import { useMemo, useState } from 'react';\n\nexport function Counter() {\n  const [n, setN] = useState(0);\n  const doubled = useMemo(() => n * 2, [n]);\n  return <button onClick={() => setN(n + 1)}>{doubled}</button>;\n}") +
        quickTable("React hooks", [
          ["useState", "Local state"],
          ["useEffect", "Sync with world"],
          ["useMemo", "Derived expensive values"],
          ["useCallback", "Stable function refs"],
        ])
      );
    if (id === "tailwind-css")
      return (
        codeBlock("html", '<button class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/40 hover:bg-slate-800">\n  Ship\n</button>') +
        quickTable("Tailwind moves", [
          ["min-h-screen grid place-items-center", "Hero centering"],
          ["md:grid-cols-2 gap-6", "Responsive grid"],
          ["@apply", "Extract in CSS layer sparingly"],
        ])
      );
    return (
      codeBlock(meta.group === "data-ai" ? "python" : "javascript", "// Starter snippet — adapt to your stack\nasync function fetchJSON(url) {\n  const res = await fetch(url, { headers: { Accept: 'application/json' } });\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);\n  return res.json();\n}") +
      quickTable("Patterns to memorize", [
        ["Guard clauses", "Fail fast, shallow nesting"],
        ["Pure helpers", "Easier tests & reuse"],
        ["Structured errors", "{code,message,details}"],
      ])
    );
  }

  global.TM_DOC_DATA = {
    resourceTable: resourceTable,
    cheatFor: cheatFor,
  };
})(window);
