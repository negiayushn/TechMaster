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
