/**
 * TechMaster Roadmap v2 — navigation, documentation viewer, interviews,
 * projects, dashboard analytics, global search, themes, and persistence.
 */
(function () {
  var C = window.TM_CONFIG;
  var SK = C.STORAGE_KEYS;

  function loadJSON(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function toast(msg) {
    var w = document.getElementById("toast-wrap");
    if (!w) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () {
      t.classList.add("removing");
      setTimeout(function () { t.remove(); }, 260);
    }, 3400);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/`/g, "&#x60;");
  }

  var state = loadJSON(SK.progress, {});
  if (!state.heatmap) state.heatmap = {};
  if (!state.studyLog) state.studyLog = {};
  if (typeof state.streak !== "number") state.streak = 0;
  if (!state.lastDate) state.lastDate = "";

  var pageHistory = [];

  var interviewExtra = loadJSON(SK.interview, { done: {}, bookmarks: {} });
  var favProjects = loadJSON(SK.favoritesProjects, {});
  var projOverrides = loadJSON(SK.projectOverrides, {});
  var roadmapProg = loadJSON(SK.roadmapTopics, {});

  function persist() {
    saveJSON(SK.progress, state);
    saveJSON(SK.interview, interviewExtra);
    saveJSON(SK.favoritesProjects, favProjects);
    saveJSON(SK.projectOverrides, projOverrides);
    saveJSON(SK.roadmapTopics, roadmapProg);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function recordVisit() {
    var t = todayStr();
    if (state.lastDate !== t) {
      var prev = state.lastDate ? new Date(state.lastDate) : null;
      var cur = new Date(t);
      if (prev) {
        var diff = Math.round((cur - prev) / 86400000);
        if (diff === 1) state.streak = (state.streak || 0) + 1;
        else if (diff > 1) state.streak = 1;
      } else {
        state.streak = 1;
      }
      state.lastDate = t;
    }
    state.heatmap[t] = Math.min(4, (state.heatmap[t] || 0) + 1);
    if (typeof state.xp !== "number") state.xp = 0;
    state.xp += 2;
    checkAchievements();
    persist();
  }

  function addStudyMinutes(m) {
    var t = todayStr();
    state.studyLog[t] = (state.studyLog[t] || 0) + m;
    state.xp = (state.xp || 0) + Math.floor(m / 5);
    checkAchievements();
    persist();
    renderDashboard();
  }

  function xpLevel(xp) {
    var need = C.LEVEL_BASE_XP;
    var lvl = 1;
    var rem = xp;
    while (rem >= need) {
      rem -= need;
      lvl++;
      need = Math.floor(need * 1.12);
    }
    return { level: lvl, into: rem, need: need };
  }

  var achievementsUnlocked = loadJSON(SK.achievements, {});

  function unlockAch(id, title) {
    if (achievementsUnlocked[id]) return;
    achievementsUnlocked[id] = { title: title, at: new Date().toISOString() };
    saveJSON(SK.achievements, achievementsUnlocked);
    toast("Achievement: " + title);
  }

  function checkAchievements() {
    var doneN = Object.keys(interviewExtra.done || {}).length;
    if (doneN >= 1) unlockAch("first-q", "First rep");
    if (doneN >= 25) unlockAch("25-q", "25 interview items");
    if ((state.streak || 0) >= 7) unlockAch("streak-7", "7-day streak");
    if ((state.xp || 0) >= 500) unlockAch("xp-500", "500 XP");
  }

  function showPage(id, noHistory) {
    var old = document.querySelector(".page.active");
    if (old && !noHistory) {
      var oldId = old.id.replace("page-", "");
      if (oldId !== id) pageHistory.push(oldId);
    }
    document.querySelectorAll(".page").forEach(function (p) {
      p.classList.remove("active");
    });
    var page = document.getElementById("page-" + id);
    if (page) page.classList.add("active");
    document.querySelectorAll(".nav-link").forEach(function (l) {
      l.classList.toggle("active", l.getAttribute("data-nav") === id);
    });
    document.querySelectorAll("#nav-drawer .nav-link").forEach(function (l) {
      l.classList.toggle("active", l.getAttribute("data-nav") === id);
    });
    document.querySelectorAll(".bottom-nav-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-nav") === id);
    });
    document.body.classList.toggle("page-dashboard", id === "dashboard");
    document.body.classList.toggle("page-home", id === "home");
    window.scrollTo(0, 0);
    document.getElementById("nav-drawer").classList.remove("open");
    var toggle = document.getElementById("nav-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    var target = page && id !== "home" && page.querySelector("h2");
    if (target) target.setAttribute("tabindex", "-1"), target.focus();
    updatePageNav(id);
    updateBackBtn();
    recordVisit();
    if (id === "documentation") renderDocs();
    if (id === "projects") renderProjects();
    if (id === "interview") renderInterviews();
    if (id === "dashboard") renderDashboard();
    if (id === "data-ai") renderDataAiCards();
  }

  function initNav() {
    var links = C.PAGES.map(function (p) {
      return (
        '<button type="button" class="nav-link' +
        (p.id === "home" ? " active" : "") +
        '" data-nav="' +
        esc(p.id) +
        '">' +
        esc(p.label) +
        "</button>"
      );
    });
    var el = document.getElementById("nav-links");
    var dr = document.getElementById("nav-drawer");
    el.innerHTML = links.join("");
    dr.innerHTML = links.join("");
    function bind(container) {
      container.querySelectorAll("[data-nav]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-nav");
          if (id === "chest" && typeof showChestSurprise === "function") {
            showChestSurprise();
          } else {
            showPage(id);
          }
        });
      });
    }
    bind(document);
    document.getElementById("nav-toggle").addEventListener("click", function () {
      var dr = document.getElementById("nav-drawer");
      var open = dr.classList.toggle("open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initRoadmap() {
    var phases = (window.TM_ROADMAP && window.TM_ROADMAP.phases) || [];
    if (!phases.length) {
      document.getElementById("roadmap-timeline").innerHTML =
        '<p style="color:var(--muted)">Roadmap data failed to load. Ensure <code>js/roadmap-data.js</code> is included before <code>app.js</code>.</p>';
      return;
    }

    function topicBlock(ph, t) {
      var subs = (t.subtopics || [])
        .map(function (s, si) {
          var key = "rm-" + t.id + "-s-" + si;
          var checked = roadmapProg[key] ? " checked" : "";
          return (
            '<label class="subtopic-row"><input type="checkbox" data-rm="' +
            esc(key) +
            '"' +
            checked +
            ' /><span>' +
            esc(s) +
            "</span></label>"
          );
        })
        .join("");
      var pr = (t.practice || [])
        .map(function (s, si) {
          var key = "rm-" + t.id + "-p-" + si;
          var checked = roadmapProg[key] ? " checked" : "";
          return (
            '<label class="subtopic-row practice-row"><input type="checkbox" data-rm="' +
            esc(key) +
            '"' +
            checked +
            ' /><span>' +
            esc(s) +
            "</span></label>"
          );
        })
        .join("");
      var pj = (t.projects || [])
        .map(function (s) {
          return "<li>" + esc(s) + "</li>";
        })
        .join("");
      var deps = (t.deps || []).length
        ? '<div class="roadmap-meta">Depends on: ' +
          t.deps
            .map(function (d) {
              return '<span class="meta-chip">' + esc(d) + "</span>";
            })
            .join(" ") +
          "</div>"
        : "";
      return (
        '<div class="roadmap-topic" data-topic-id="' +
        esc(t.id) +
        '"><div class="roadmap-topic-head"><div><div class="roadmap-topic-title">' +
        esc(t.title) +
        '</div><div class="roadmap-topic-sub">' +
        esc(t.hours) +
        " · " +
        esc(t.difficulty) +
        "</div>" +
        deps +
        '</div><svg class="chevron chevron-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div><div class="roadmap-topic-body"><div class="roadmap-section-label">Subtopics</div>' +
        subs +
        '<div class="roadmap-section-label">Practice tasks</div>' +
        pr +
        '<div class="roadmap-section-label">Project ideas</div><ul class="proj-list">' +
        pj +
        "</ul></div></div>"
      );
    }

    var html = phases
      .map(function (ph) {
        var chips = (ph.meta || [])
          .map(function (m, i) {
            var cls = i === 0 ? "background:rgba(37,99,235,.15);color:#60a5fa" : "background:rgba(255,255,255,.06);color:var(--muted)";
            return '<span class="meta-chip" style="' + cls + '">' + esc(m) + "</span>";
          })
          .join("");
        var topics = (ph.topics || []).map(function (t) {
          return topicBlock(ph, t);
        }).join("");
        return (
          '<div class="phase"><div class="phase-dot"></div><div class="phase-card" data-phase="' +
          ph.n +
          '"><div class="phase-header"><div class="phase-info"><div class="phase-num">Phase ' +
          ph.n +
          "</div><div class=\"phase-title\">" +
          esc(ph.title) +
          '</div><div class="phase-meta">' +
          chips +
          '</div></div><svg class="chevron" data-chev="' +
          ph.n +
          '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div><div class="phase-body" id="body-' +
          ph.n +
          '"><p class="phase-summary">' +
          esc(ph.summary || "") +
          '</p><div class="roadmap-topics">' +
          topics +
          "</div></div></div></div>"
        );
      })
      .join("");
    var timeline = document.getElementById("roadmap-timeline");
    timeline.innerHTML = html;
    timeline.querySelectorAll(".phase-header").forEach(function (hdr) {
      hdr.addEventListener("click", function () {
        var card = hdr.closest(".phase-card");
        var n = card.getAttribute("data-phase");
        var body = document.getElementById("body-" + n);
        var chev = hdr.querySelector("[data-chev]");
        body.classList.toggle("open");
        if (chev) chev.classList.toggle("open", body.classList.contains("open"));
      });
    });
    timeline.querySelectorAll(".roadmap-topic-head").forEach(function (h) {
      h.addEventListener("click", function (e) {
        e.stopPropagation();
        var body = h.nextElementSibling;
        if (!body) return;
        body.classList.toggle("open");
        var mini = h.querySelector(".chevron-mini");
        if (mini) mini.classList.toggle("open", body.classList.contains("open"));
      });
    });
    if (!timeline.dataset.rmBound) {
      timeline.dataset.rmBound = "1";
      timeline.addEventListener("change", function (e) {
        var cb = e.target.closest("input[type=\"checkbox\"][data-rm]");
        if (!cb) return;
        roadmapProg[cb.getAttribute("data-rm")] = cb.checked;
        saveJSON(SK.roadmapTopics, roadmapProg);
      });
    }
  }

  var currentDocId = window.TMDocs.DOC_INDEX[0].id;

  function renderDocsSidebar() {
    var q = (document.getElementById("docs-search-input").value || "").toLowerCase();
    var g = document.getElementById("docs-group-filter").value;
    var list = window.TMDocs.DOC_INDEX.filter(function (d) {
      var okG = g === "all" || d.group === g;
      var okQ =
        !q ||
        d.title.toLowerCase().indexOf(q) >= 0 ||
        d.oneLiner.toLowerCase().indexOf(q) >= 0 ||
        d.id.indexOf(q) >= 0;
      return okG && okQ;
    });
    var by = {};
    list.forEach(function (d) {
      by[d.group] = by[d.group] || [];
      by[d.group].push(d);
    });
    var html = window.TMDocs.DOC_GROUPS.map(function (grp) {
      var items = by[grp.id];
      if (!items || !items.length) return "";
      var inner = items
        .map(function (d) {
          return (
            '<button type="button" class="doc-nav-link' +
            (d.id === currentDocId ? " active" : "") +
            '" data-doc="' +
            esc(d.id) +
            '">' +
            esc(d.title) +
            "</button>"
          );
        })
        .join("");
      return (
        '<div class="doc-nav-group"><div class="doc-nav-group-title">' +
        esc(grp.label) +
        '</div><div class="doc-nav-list">' +
        inner +
        "</div></div>"
      );
    }).join("");
    document.getElementById("docs-sidebar").innerHTML = html || "<p style=\"color:var(--muted);font-size:.85rem\">No matches.</p>";
    document.querySelectorAll("#docs-sidebar .doc-nav-link").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentDocId = btn.getAttribute("data-doc");
        renderDocs();
      });
    });
  }

  function renderDocs() {
    var meta = window.TMDocs.getDocById(currentDocId);
    if (!meta) meta = window.TMDocs.DOC_INDEX[0];
    currentDocId = meta.id;
    document.getElementById("docs-breadcrumb").innerHTML =
      '<a href="#" data-doc-home>Documentation</a> <span>/</span> <span>' + esc(meta.title) + "</span>";
    document.getElementById("docs-article").innerHTML = "<h1>" + esc(meta.title) + "</h1>" + window.TMDocs.buildArticleHtml(meta);
    var toc = window.TMDocs.buildToc();
    document.getElementById("docs-toc-links").innerHTML = toc
      .map(function (t) {
        return '<a class="doc-toc-link" href="#' + esc(t.id) + '">' + esc(t.label) + "</a>";
      })
      .join("");
    renderDocsSidebar();
    if (window.hljs) {
      document.querySelectorAll("#docs-article pre code").forEach(function (block) {
        hljs.highlightElement(block);
      });
    }
  }

  function initDocArticleUi() {
    var root = document.getElementById("docs-article");
    if (!root || root.dataset.delegationBound === "1") return;
    root.dataset.delegationBound = "1";
    root.addEventListener("click", function (e) {
      var tab = e.target.closest(".doc-tab");
      if (tab && tab.closest("[data-tabs]")) {
        var wrap = tab.closest("[data-tabs]");
        var key = tab.getAttribute("data-tab");
        wrap.querySelectorAll(".doc-tab").forEach(function (t) {
          t.classList.toggle("active", t === tab);
        });
        wrap.parentElement.querySelectorAll(".doc-tab-panel").forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-panel") === key);
        });
        return;
      }
      var copyBtn = e.target.closest("[data-copy-code]");
      if (copyBtn) {
        var wrapEl = copyBtn.closest("[data-code-wrap]");
        var code = wrapEl && wrapEl.querySelector("code");
        if (!code) return;
        navigator.clipboard.writeText(code.textContent).then(
          function () {
            toast("Copied to clipboard");
          },
          function () {
            toast("Copy blocked by browser");
          }
        );
        return;
      }
      var chip = e.target.closest(".res-chip[data-res-tier]");
      if (chip && chip.closest("[data-res-panel]")) {
        var panel = chip.closest("[data-res-panel]");
        var tier = chip.getAttribute("data-res-tier");
        panel.querySelectorAll(".res-chip[data-res-tier]").forEach(function (c) {
          c.classList.toggle("active", c === chip);
        });
        applyResourceFilter(panel, tier, (panel.querySelector(".doc-res-filter") || {}).value || "");
        return;
      }
    });
    root.addEventListener("input", function (e) {
      if (!e.target.matches(".doc-res-filter")) return;
      var panel = e.target.closest("[data-res-panel]");
      if (!panel) return;
      var activeChip = panel.querySelector(".res-chip.active[data-res-tier]") || panel.querySelector(".res-chip[data-res-tier]");
      var tier = activeChip ? activeChip.getAttribute("data-res-tier") : "all";
      applyResourceFilter(panel, tier, e.target.value || "");
    });
  }

  function applyResourceFilter(panel, tier, text) {
    var q = (text || "").toLowerCase().trim();
    panel.querySelectorAll("tbody tr").forEach(function (tr) {
      var tVal = tr.getAttribute("data-tier") || "";
      var title = tr.textContent.toLowerCase();
      var tierOk = tier === "all" || tVal === tier;
      var textOk = !q || title.indexOf(q) >= 0;
      tr.style.display = tierOk && textOk ? "" : "none";
    });
  }

  function initDocsPage() {
    var gf = document.getElementById("docs-group-filter");
    gf.innerHTML =
      '<option value="all">All groups</option>' +
      window.TMDocs.DOC_GROUPS.map(function (g) {
        return '<option value="' + esc(g.id) + '">' + esc(g.label) + "</option>";
      }).join("");
    gf.addEventListener("change", renderDocsSidebar);
    document.getElementById("docs-search-input").addEventListener("input", function () {
      renderDocsSidebar();
    });
    var ts = document.getElementById("docs-topic-select");
    window.TMDocs.DOC_INDEX.forEach(function (d) {
      var o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.title;
      ts.appendChild(o);
    });
    ts.addEventListener("change", function () {
      if (ts.value) { currentDocId = ts.value; renderDocs(); ts.value = ""; }
    });
    document.getElementById("docs-breadcrumb").addEventListener("click", function (e) {
      var a = e.target.closest("[data-doc-home]");
      if (!a) return;
      e.preventDefault();
      currentDocId = window.TMDocs.DOC_INDEX[0].id;
      renderDocs();
    });
    initDocArticleUi();
  }

  function renderDataAiCards() {
    var items = window.TMDocs.DOC_INDEX.filter(function (d) {
      return d.group === "data-ai";
    });
    document.getElementById("data-ai-cards").innerHTML = items
      .map(function (d) {
        return (
          '<div class="card c-cyan" data-open-doc="' +
          esc(d.id) +
          '"><div class="card-icon" style="background:rgba(6,182,212,.15)">◇</div><h3>' +
          esc(d.title) +
          "</h3><p>" +
          esc(d.oneLiner) +
          '</p><div class="card-tag" style="background:rgba(6,182,212,.15);color:var(--cyan)">Open in Docs</div></div>'
        );
      })
      .join("");
    document.querySelectorAll("[data-open-doc]").forEach(function (card) {
      card.addEventListener("click", function () {
        currentDocId = card.getAttribute("data-open-doc");
        showPage("documentation");
      });
    });
  }

  function cssBgThumb(u) {
    if (!u) return "";
    return "background-image:url('" + String(u).replace(/'/g, "%27") + "');background-size:cover;background-position:center;";
  }

  function renderProjects() {
    var cat = document.getElementById("proj-cat").value;
    var tier = document.getElementById("proj-tier").value;
    var q = (document.getElementById("proj-search").value || "").toLowerCase();
    var favOnly = document.getElementById("proj-fav-only").classList.contains("active");
    var list = window.TMProjects.all.filter(function (p) {
      var okC = cat === "all" || p.cat === cat;
      var okT = tier === "all" || p.tier === tier;
      var okQ =
        !q ||
        p.title.toLowerCase().indexOf(q) >= 0 ||
        p.desc.toLowerCase().indexOf(q) >= 0 ||
        p.stack.join(" ").toLowerCase().indexOf(q) >= 0;
      var okF = !favOnly || favProjects[p.id];
      return okC && okT && okQ && okF;
    });
    document.getElementById("proj-grid").innerHTML = list
      .map(function (p) {
        var fav = favProjects[p.id] ? "★" : "☆";
        var ov = projOverrides[p.id] || {};
        var shot = ov.screenshot || p.screenshot;
        var thumb = cssBgThumb(shot);
        return (
          '<div class="proj-card" data-proj="' +
          esc(p.id) +
          '"><div class="proj-card-img" style="background:' +
          p.color +
          "20;border-bottom:1px solid " +
          p.color +
          "30;" +
          thumb +
          '">' +
          esc(p.emoji) +
          '</div><div class="proj-card-body"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><h3>' +
          esc(p.title) +
          '<span class="tier-pill">' +
          esc(p.tier) +
          "</span></h3><button type=\"button\" class=\"icon-btn\" data-fav=\"" +
          esc(p.id) +
          '" title="Favorite">' +
          fav +
          "</button></div><p>" +
          esc(p.desc) +
          '</p><div style="font-size:.72rem;color:var(--muted);margin-bottom:.5rem">⏱ ' +
          esc(p.time) +
          " · " +
          esc(p.diff) +
          '</div><div class="proj-tags">' +
          p.stack
            .map(function (s) {
              return '<span class="proj-tag" style="background:' + p.color + '22;color:#bae6fd">' + esc(s) + "</span>";
            })
            .join("") +
          "</div></div></div>"
        );
      })
      .join("");
    document.querySelectorAll(".proj-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-fav]")) return;
        openProjectModal(card.getAttribute("data-proj"));
      });
    });
    document.querySelectorAll("[data-fav]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-fav");
        favProjects[id] = !favProjects[id];
        persist();
        renderProjects();
        toast(favProjects[id] ? "Added to favorites" : "Removed from favorites");
      });
    });
  }

  var lastFocus; // for focus restoration

  function openProjectModal(id) {
    var p = window.TMProjects.all.find(function (x) {
      return x.id === id;
    });
    if (!p) return;
    var ov = projOverrides[id] || {};
    var demo = ov.demo || p.demo;
    var repo = ov.repo || p.repo;
    var shot = ov.screenshot || p.screenshot;
    document.getElementById("mp-title").textContent = p.title;
    var feats = (p.features || [])
      .map(function (f) {
        return "<li>" + esc(f) + "</li>";
      })
      .join("");
    var apis = (p.apis || []).map(function (a) {
      return "<li>" + esc(a) + "</li>";
    }).join("");
    document.getElementById("mp-body").innerHTML =
      '<div class="modal-section"><strong>Objective</strong><br />' +
      esc(p.desc) +
      "</div>" +
      '<div class="modal-section"><strong>Feature checklist</strong><ul class="proj-list">' +
      feats +
      "</ul></div>" +
      '<div class="modal-section"><strong>Step-by-step build plan</strong><ol class="proj-list" style="list-style:decimal;padding-left:1.25rem"><li>Define API contracts + ERD on paper.</li><li>Scaffold repo (apps/packages), lint/test in CI.</li><li>Implement auth boundary + happy path CRUD.</li><li>Add background jobs, emails, or websockets as required.</li><li>Instrument metrics/logs, load test critical routes.</li><li>Deploy with secrets manager + rollback drill.</li><li>Harden: rate limits, CSP, dependency audit.</li></ol></div>' +
      '<div class="modal-section"><strong>Difficulty / duration</strong><br />' +
      esc(p.diff) +
      " · " +
      esc(p.time) +
      "</div>" +
      '<div class="modal-section"><strong>Architecture</strong><br />' +
      esc(p.architecture) +
      "</div>" +
      '<div class="modal-section"><strong>Folder structure</strong><pre style="white-space:pre-wrap;font-size:.78rem;background:var(--code-bg);color:var(--text);padding:.75rem;border-radius:10px;border:1px solid var(--code-border)">' +
      esc(p.folderStructure) +
      "</pre></div>" +
      '<div class="modal-section"><strong>APIs</strong><ul class="proj-list">' +
      apis +
      "</ul></div>" +
      '<div class="modal-section"><strong>Database schema (guidance)</strong><br />' +
      esc(p.database) +
      "</div>" +
      '<div class="modal-section"><strong>Authentication flow</strong><br />Sessions or JWT with refresh rotation; enforce least privilege per route. Document threat assumptions.</div>' +
      '<div class="modal-section"><strong>Deployment guide</strong><br />' +
      esc(p.deploy) +
      "</div>" +
      '<div class="modal-section"><strong>Security</strong><br />' +
      esc(p.securityNotes) +
      "</div>" +
      '<div class="modal-section"><strong>Scalability</strong><br />' +
      esc(p.scaleNotes) +
      "</div>" +
      '<div class="modal-section"><strong>Learning outcome</strong><br />' +
      esc(p.learn) +
      "</div>" +
      '<div class="modal-section"><strong>Resume angle</strong><br />' +
      esc(p.resume) +
      "</div>" +
      '<div class="modal-section"><strong>Interview angle</strong><br />' +
      esc(p.interview) +
      '</div><div class="modal-section"><strong>Live links & preview</strong><br /><a href="' +
      esc(demo) +
      '" target="_blank" rel="noopener noreferrer">Open demo ↗</a> · <a href="' +
      esc(repo) +
      '" target="_blank" rel="noopener noreferrer">Open repository ↗</a><br /><img src="' +
      esc(shot) +
      '" alt="Project preview" class="proj-modal-shot" loading="lazy" /></div>' +
      '<div class="modal-section modal-project-edit"><h3 style="margin-bottom:.5rem;color:var(--gold)">Edit demo, repo & screenshot</h3><p style="font-size:.8rem;color:var(--muted);margin-bottom:.75rem">Saved per project in localStorage (great for your real deploy URLs).</p>' +
      '<label class="modal-field"><span>Live demo URL</span><input id="mp-ov-demo" type="url" value="' +
      esc(demo) +
      '" /></label>' +
      '<label class="modal-field"><span>GitHub repository URL</span><input id="mp-ov-repo" type="url" value="' +
      esc(repo) +
      '" /></label>' +
      '<label class="modal-field"><span>Preview image</span><input id="mp-ov-file" type="file" accept="image/*" />' +
      '<span class="modal-hint">Upload replaces card thumbnail (stored as data URL).</span></label>' +
      '<div class="modal-actions"><button type="button" class="btn-primary" id="mp-ov-save">Save links</button>' +
      '<button type="button" class="btn-ghost" id="mp-ov-clear">Reset to template</button></div></div>';
    lastFocus = document.activeElement;
    document.getElementById("modal-project").classList.add("open");
    document.getElementById("modal-project").setAttribute("aria-hidden", "false");
    var firstField = document.querySelector("#modal-project input, #modal-project button, #modal-project select, #modal-project textarea");
    if (firstField) setTimeout(function () { firstField.focus(); }, 100);
    document.getElementById("mp-ov-save").addEventListener("click", function () {
      var prev = projOverrides[id] || {};
      projOverrides[id] = {
        demo: document.getElementById("mp-ov-demo").value.trim() || p.demo,
        repo: document.getElementById("mp-ov-repo").value.trim() || p.repo,
        screenshot: prev.screenshot || shot,
      };
      persist();
      toast("Project links saved locally");
      renderProjects();
      openProjectModal(id);
    });
    document.getElementById("mp-ov-clear").addEventListener("click", function () {
      delete projOverrides[id];
      persist();
      toast("Reset to template defaults");
      renderProjects();
      openProjectModal(id);
    });
    document.getElementById("mp-ov-file").addEventListener("change", function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        projOverrides[id] = projOverrides[id] || {};
        projOverrides[id].screenshot = reader.result;
        projOverrides[id].demo = document.getElementById("mp-ov-demo").value.trim() || demo;
        projOverrides[id].repo = document.getElementById("mp-ov-repo").value.trim() || repo;
        persist();
        toast("Image attached to this project");
        renderProjects();
        openProjectModal(id);
      };
      reader.readAsDataURL(f);
    });
  }

  var bank = [];

  function buildInterviewBank() {
    var version = (window.TMInterviewGen && window.TMInterviewGen.BANK_VERSION) || "v1";
    var CACHE_KEY = "tm-interview-bank-" + version;
    var cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { bank = JSON.parse(cached); return; } catch (e) { /* fall through to generate */ }
    }
    var gen = (window.TMInterviewGen && window.TMInterviewGen.buildInterviewBank()) || [];
    var hand = [
      {
        id: "hand-react-vdom",
        technology: "react",
        technologyLabel: "React",
        difficulty: "intermediate",
        category: "intermediate",
        question: "What is the Virtual DOM and how does React use it?",
        answer:
          "The Virtual DOM is a lightweight tree of plain JS objects describing UI. On update, React builds a new tree, diffs it against the previous one (reconciliation), and commits the minimal set of mutations to the real DOM. This batches work, avoids layout thrash in many cases, and pairs with Fiber scheduling for concurrency.",
        strategy: "Define → mechanism → benefit → nuance (e.g., keys, concurrent rendering).",
        example: "Mention reconciliation + keys stabilizing list identity.",
        mistakes: ["Claim Virtual DOM is always faster than direct DOM", "Ignore keys in lists"],
        followUps: ["How do keys affect reconciliation?", "What breaks async rendering assumptions?"],
      },
      {
        id: "hand-node-eventloop",
        technology: "nodejs",
        technologyLabel: "Node.js",
        difficulty: "intermediate",
        category: "intermediate",
        question: "How does Node handle concurrency on a single thread?",
        answer:
          "Node runs JS on one thread per isolate but uses libuv thread pool and OS async facilities for I/O. The event loop schedules timers, I/O callbacks, microtasks, and phases in order. CPU-bound work blocks the loop—mitigate with worker threads or separate processes.",
        strategy: "Event loop phases + concrete example + mitigation for CPU work.",
        mistakes: ["Say Node is multi-threaded for all JS", "Omit microtask starvation cases"],
        followUps: ["How would you profile event loop lag?", "Where do promises run?"],
      },
      {
        id: "hand-docker-image",
        technology: "docker",
        technologyLabel: "Docker",
        difficulty: "beginner",
        category: "beginner",
        question: "Image vs container—what is the difference?",
        answer:
          "An image is an immutable artifact (layers + metadata). A container is a writable instance with isolated process namespace, cgroup limits, and optional volumes. Many containers can share one image; containers should be ephemeral—persist data in volumes or external stores.",
        strategy: "Two-sentence definitions + lifecycle + persistence note.",
        mistakes: ["Store DB data only in container FS", "Confuse tags and digests"],
        followUps: ["How do layers affect rebuild time?", "What is multi-stage for?"],
      },
    ];
    var map = {};
    hand.forEach(function (x) {
      map[x.id] = x;
    });
    gen.forEach(function (x) {
      map[x.id] = x;
    });
    bank = Object.keys(map).map(function (k) {
      return map[k];
    });
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(bank)); } catch (e) { /* storage full */ }
    document.getElementById("stat-questions").textContent = bank.length + "+";
  }

  function renderInterviews() {
    var tech = document.getElementById("int-tech").value;
    var diff = document.getElementById("int-diff").value;
    var q = (document.getElementById("int-search").value || "").toLowerCase();
    var list = bank.filter(function (item) {
      var okT = tech === "all" || item.technology === tech;
      var okD = diff === "all" || item.difficulty === diff || item.category === diff;
      var text = (item.question + " " + item.answer + " " + (item.technologyLabel || "")).toLowerCase();
      var okQ = !q || text.indexOf(q) >= 0;
      return okT && okD && okQ;
    });
    document.getElementById("qa-list").innerHTML = list
      .map(function (item, idx) {
        var done = interviewExtra.done[item.id];
        var bm = interviewExtra.bookmarks[item.id];
        return (
          '<div class="qa-item" data-qid="' +
          esc(item.id) +
          '"><div class="qa-q" data-toggle="' +
          esc(item.id) +
          '"><span class="qa-title">' +
          esc(item.question) +
          '</span><div class="qa-tools"><button type="button" class="icon-btn" data-bookmark="' +
          esc(item.id) +
          '" title="Bookmark">' +
          (bm ? "★" : "☆") +
          '</button><button type="button" class="icon-btn" data-done="' +
          esc(item.id) +
          '" title="Mark done">' +
          (done ? "✓" : "○") +
          '</button><span class="cat-badge" style="background:rgba(30,64,175,.15);color:#93c5fd">' +
          esc(item.technologyLabel || item.technology) +
          "</span></div></div>" +
          '<div class="qa-a" id="qa-' +
          esc(item.id) +
          '"><div class="qa-block"><h4>Answer</h4><p>' +
          esc(item.answer) +
          '</p></div><div class="qa-block"><h4>Strategy</h4><p>' +
          esc(item.strategy) +
          '</p></div><div class="qa-block"><h4>Example</h4><pre><code>' +
          esc(item.example || "") +
          '</code></pre></div><div class="qa-block"><h4>Common mistakes</h4><ul>' +
          (item.mistakes || [])
            .map(function (m) {
              return "<li>" + esc(m) + "</li>";
            })
            .join("") +
          '</ul></div><div class="qa-block"><h4>Follow-ups</h4><ul>' +
          (item.followUps || [])
            .map(function (m) {
              return "<li>" + esc(m) + "</li>";
            })
            .join("") +
          "</ul></div></div></div>"
        );
      })
      .join("");
    document.querySelectorAll(".qa-q[data-toggle]").forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest("[data-bookmark]") || e.target.closest("[data-done]")) return;
        var id = row.getAttribute("data-toggle");
        document.getElementById("qa-" + id).classList.toggle("open");
      });
    });
    document.querySelectorAll("[data-done]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-done");
        var now = !interviewExtra.done[id];
        interviewExtra.done[id] = now;
        if (now) state.xp = (state.xp || 0) + C.XP_PER_INTERVIEW;
        else state.xp = Math.max(0, (state.xp || 0) - C.XP_PER_INTERVIEW);
        checkAchievements();
        persist();
        renderInterviews();
        renderDashboard();
      });
    });
    document.querySelectorAll("[data-bookmark]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-bookmark");
        interviewExtra.bookmarks[id] = !interviewExtra.bookmarks[id];
        persist();
        renderInterviews();
      });
    });
    if (window.hljs) {
      document.querySelectorAll("#qa-list pre code").forEach(function (block) {
        hljs.highlightElement(block);
      });
    }
  }

  function initInterviewFilters() {
    var techSel = document.getElementById("int-tech");
    var keys = {};
    bank.forEach(function (b) {
      keys[b.technology] = b.technologyLabel || b.technology;
    });
    techSel.innerHTML =
      '<option value="all">All technologies</option>' +
      Object.keys(keys)
        .map(function (k) {
          return '<option value="' + esc(k) + '">' + esc(keys[k]) + "</option>";
        })
        .join("");
    techSel.addEventListener("change", renderInterviews);
    var df = document.getElementById("int-diff");
    df.innerHTML =
      '<option value="all">All difficulties</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="system-design">System design</option><option value="debugging">Debugging</option>';
    df.addEventListener("change", renderInterviews);
    document.getElementById("int-search").addEventListener("input", debounce(renderInterviews, 180));
    document.getElementById("int-expand").addEventListener("click", function () {
      document.querySelectorAll("#qa-list .qa-a").forEach(function (a) {
        return a.classList.add("open");
      });
    });
    document.getElementById("int-collapse").addEventListener("click", function () {
      document.querySelectorAll("#qa-list .qa-a").forEach(function (a) {
        return a.classList.remove("open");
      });
    });
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      var ctx = this, args = arguments;
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  var skills = [
    { name: "HTML/CSS", color: "#3b82f6" },
    { name: "JavaScript", color: "#f59e0b" },
    { name: "React", color: "#06b6d4" },
    { name: "Node.js", color: "#10b981" },
    { name: "Data & AI", color: "#14b8a6" },
    { name: "Docker/K8s", color: "#8b5cf6" },
    { name: "AWS", color: "#f97316" },
    { name: "Security", color: "#d4af37" },
  ];

  var checklist = [
    "Local toolchain reproducible (Docker/devcontainer)",
    "Shipped one full-stack feature with tests",
    "Documented runbook + rollback for a change",
    "Completed 25 interview reps with notes",
    "Deployed to cloud with HTTPS and monitoring",
    "Threat model for an app you own",
    "Explained one architecture on diagram in <10 min",
    "Contributed fix/docs to an OSS repo",
  ];

  function renderDashboard() {
    var done = Object.keys(interviewExtra.done || {}).length;
    document.getElementById("int-done").textContent = done;
    var checks = 0;
    checklist.forEach(function (_, i) {
      if (state["check-" + i]) checks++;
    });
    var pct = Math.round((checks / checklist.length) * 100);
    document.getElementById("pct-val").textContent = pct + "%";
    var xl = xpLevel(state.xp || 0);
    document.getElementById("xp-val").textContent = state.xp || 0;
    document.getElementById("lvl-val").textContent = xl.level;
    document.getElementById("streak-val").textContent = state.streak || 0;
    var last7 = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var k = d.toISOString().slice(0, 10);
      last7.push(state.studyLog[k] || 0);
    }
    var mx = Math.max.apply(null, last7.concat([1]));
    document.getElementById("weekly-chart").innerHTML = last7
      .map(function (v) {
        var h = Math.round((v / mx) * 100);
        return '<div class="chart-bar" style="height:' + h + '%" title="' + v + ' min"></div>';
      })
      .join("");
    var heat = "";
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 14; c++) {
        var day = new Date();
        day.setDate(day.getDate() - (13 - c + r * 14));
        var kk = day.toISOString().slice(0, 10);
        var lvl = state.heatmap[kk] || 0;
        heat += '<div class="heat-cell l' + lvl + '" title="' + kk + '"></div>';
      }
    }
    document.getElementById("heatmap").innerHTML = heat;
    var sb = document.getElementById("skill-bars");
    sb.innerHTML = skills
      .map(function (s, i) {
        var p = state["skill-" + i] || 0;
        return (
          '<div class="skill-bar-row"><div class="skill-bar-label"><span>' +
          esc(s.name) +
          '</span><span class="skill-pct" id="sf-lbl-' +
          i +
          '">' +
          p +
          "%</span></div><div class=\"skill-bar-track\"><div class=\"skill-bar-fill\" style=\"width:" +
          p +
          "%;background:" +
          s.color +
          '" id="sf-' +
          i +
          '"></div></div><input type="range" min="0" max="100" value="' +
          p +
          '" data-ski="' +
          i +
          '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
          p +
          '" aria-label="' +
          esc(s.name) +
          " skill level" +
          '" style="width:100%;margin-top:4px;accent-color:' +
          s.color +
          '"/></div>'
        );
      })
      .join("");
    sb.querySelectorAll("input[data-ski]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var i = inp.getAttribute("data-ski");
        state["skill-" + i] = parseInt(inp.value, 10);
        var f = document.getElementById("sf-" + i);
        if (f) f.style.width = inp.value + "%";
        var lbl = document.getElementById("sf-lbl-" + i);
        if (lbl) lbl.textContent = inp.value + "%";
        inp.setAttribute("aria-valuenow", inp.value);
        persist();
      });
    });
    var cl = document.getElementById("checklist");
    cl.innerHTML = checklist
      .map(function (item, i) {
        var done = state["check-" + i];
        return (
          '<label><input type="checkbox" data-check="' +
          i +
          '" ' +
          (done ? "checked" : "") +
          "/><span style=\"color:" +
          (done ? "var(--muted)" : "var(--text)") +
          ';text-decoration:' +
          (done ? "line-through" : "none") +
          '">' +
          esc(item) +
          "</span></label>"
        );
      })
      .join("");
    cl.querySelectorAll("input[data-check]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var i = cb.getAttribute("data-check");
        state["check-" + i] = cb.checked;
        if (cb.checked) state.xp = (state.xp || 0) + 40;
        else state.xp = Math.max(0, (state.xp || 0) - 40);
        checkAchievements();
        persist();
        renderDashboard();
      });
    });
    var mins7 = last7.reduce(function (a, b) {
      return a + b;
    }, 0);
    document.getElementById("study-val").textContent = mins7;
    var todayM = state.studyLog[todayStr()] || 0;
    var te = document.getElementById("today-study");
    if (te) te.textContent = todayM;
    var ach = document.getElementById("achievements");
    var keys = Object.keys(achievementsUnlocked);
    ach.innerHTML = keys.length
      ? keys
          .map(function (k) {
            var a = achievementsUnlocked[k];
            return '<span class="meta-chip" style="border:1px solid rgba(212,175,55,.35);color:var(--gold)">' + esc(a.title) + "</span>";
          })
          .join("")
      : '<span class="meta-chip">Complete interview items and daily visits to unlock achievements.</span>';
  }

  function initPlannerNotes() {
    var pl = loadJSON(SK.planner, { items: [] });
    function renderPl() {
      document.getElementById("planner-list").innerHTML =
        pl.items.length === 0
          ? '<p style="color:var(--muted);font-size:.85rem">No blocks yet.</p>'
          : pl.items
              .map(function (it, idx) {
                return (
                  '<div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:6px"><input type="checkbox" data-pi="' +
                  idx +
                  '" ' +
                  (it.done ? "checked" : "") +
                  '/><span style="flex:1;font-size:.85rem">' +
                  esc(it.text) +
                  '</span><span style="font-size:.72rem;color:var(--muted)">' +
                  it.min +
                  'm</span><button type="button" data-pdel="' +
                  idx +
                  '" class="icon-btn">×</button></div>'
                );
              })
              .join("");
      document.querySelectorAll("[data-pi]").forEach(function (cb) {
        cb.addEventListener("change", function () {
          var i = +cb.getAttribute("data-pi");
          pl.items[i].done = cb.checked;
          if (cb.checked) addStudyMinutes(pl.items[i].min || 0);
          saveJSON(SK.planner, pl);
          renderPl();
        });
      });
      document.querySelectorAll("[data-pdel]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          pl.items.splice(+btn.getAttribute("data-pdel"), 1);
          saveJSON(SK.planner, pl);
          renderPl();
        });
      });
    }
    renderPl();
    document.getElementById("planner-add").addEventListener("click", function () {
      var t = document.getElementById("planner-input").value.trim();
      var m = parseInt(document.getElementById("planner-min").value, 10) || 25;
      if (!t) return;
      pl.items.push({ text: t, min: m, done: false });
      document.getElementById("planner-input").value = "";
      saveJSON(SK.planner, pl);
      renderPl();
    });
    var goals = loadJSON(SK.weeklyGoals, { weekly: 10, monthly: 2 });
    document.getElementById("goal-weekly").value = goals.weekly;
    document.getElementById("goal-monthly").value = goals.monthly;
    document.getElementById("goal-save").addEventListener("click", function () {
      saveJSON(SK.weeklyGoals, {
        weekly: +document.getElementById("goal-weekly").value || 10,
        monthly: +document.getElementById("goal-monthly").value || 2,
      });
      toast("Goals saved");
    });
    if (window.TMNotes) window.TMNotes.init();
    var dashO = document.getElementById("dash-overview");
    if (dashO && !dashO.dataset.dailyBound) {
      dashO.dataset.dailyBound = "1";
      document.getElementById("daily-add").addEventListener("click", function () {
        var m = parseInt(document.getElementById("daily-minutes").value, 10) || 25;
        addStudyMinutes(m);
        toast("Logged " + m + " focused minutes");
      });
      document.getElementById("daily-reset").addEventListener("click", function () {
        state.studyLog[todayStr()] = 0;
        persist();
        renderDashboard();
        toast("Cleared today's study log");
      });
    }
    document.getElementById("dash-tabs").addEventListener("click", function (e) {
      var tab = e.target.closest("[data-dash-tab]");
      if (!tab) return;
      var key = tab.getAttribute("data-dash-tab");
      document.querySelectorAll("#dash-tabs .doc-tab").forEach(function (t) {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      document.getElementById("dash-overview").style.display = key === "overview" ? "block" : "none";
      document.getElementById("dash-planner").style.display = key === "planner" ? "block" : "none";
      document.getElementById("dash-notes").style.display = key === "notes" ? "block" : "none";
    });
  }

  function initCareer() {
    document.getElementById("career-tabs").addEventListener("click", function (e) {
      var t = e.target.closest("[data-career-tab]");
      if (!t) return;
      var key = t.getAttribute("data-career-tab");
      document.querySelectorAll("#career-tabs .doc-tab").forEach(function (x) {
        x.classList.toggle("active", x === t);
        x.setAttribute("aria-selected", x === t ? "true" : "false");
      });
      ["strategy", "resume", "github", "portfolio", "certs"].forEach(function (k) {
        document.getElementById("career-panel-" + k).style.display = k === key ? "block" : "none";
      });
      if (key === "strategy") initStrategyTabs();
    });

    // ---- PORTFOLIO CHECKLIST WITH SCORING ----
    var pfKey = "tm-portfolio-checklist";
    var pfChecks = loadJSON(pfKey, {});
    var portfolioItems = [
      { id: "hero", title: "Hero section with clear value prop", desc: "Tagline, headline, and CTA that tell visitors what you do in 3 seconds" },
      { id: "about", title: "About section with narrative", desc: "Your journey, expertise, and what makes you unique as a developer" },
      { id: "projects-3", title: "3 flagship case studies with metrics", desc: "Each project shows problem, approach, result with quantifiable impact" },
      { id: "live-demo", title: "Live demos on custom domain with HTTPS", desc: "Deployed projects accessible via your own domain with SSL" },
      { id: "contact", title: "Contact funnel with spam protection", desc: "Easy way for recruiters to reach you, with spam filtering" },
      { id: "tech-stack", title: "Tech stack visual display", desc: "Clear, badge-style icons showing your technology expertise" },
      { id: "resume-link", title: "Resume download link", desc: "ATS-friendly resume available as PDF download" },
      { id: "seo", title: "SEO meta tags + structured data", desc: "Title, description, Open Graph, and JSON-LD for search engines" },
      { id: "perf", title: "Performance Lighthouse score 90+", desc: "Optimized images, code splitting, and efficient loading" },
      { id: "responsive", title: "Mobile responsive design", desc: "Flawless experience across all device sizes" },
      { id: "accessibility", title: "Accessibility (a11y) compliance", desc: "WCAG 2.1 AA standards, keyboard nav, screen reader friendly" },
      { id: "github", title: "GitHub profile linked", desc: "Prominent GitHub link with profile optimized for recruiters" },
    ];
    function renderPortfolioChecklist() {
      var checked = 0;
      var html = '<div class="checklist-score"><span class="score-val" id="pf-score">0</span><span class="score-label">/ ' + portfolioItems.length + ' items</span></div>';
      portfolioItems.forEach(function (it) {
        var isChecked = pfChecks[it.id];
        if (isChecked) checked++;
        html += '<label class="checklist-item' + (isChecked ? " checked" : "") + '"><input type="checkbox" data-pf="' + esc(it.id) + '" ' + (isChecked ? "checked" : "") + ' /><div><div class="item-title">' + esc(it.title) + '</div><div class="item-desc">' + esc(it.desc) + '</div></div></label>';
      });
      document.getElementById("portfolio-checklist").innerHTML = html;
      document.getElementById("pf-score").textContent = checked;
      document.querySelectorAll("[data-pf]").forEach(function (cb) {
        cb.addEventListener("change", function () {
          pfChecks[cb.getAttribute("data-pf")] = cb.checked;
          saveJSON(pfKey, pfChecks);
          renderPortfolioChecklist();
        });
      });
    }
    renderPortfolioChecklist();

    // ---- RESUME BUILDER ----
    var rd = loadJSON(SK.resumeDraft, {
      headline: "", summary: "", skills: "", bullets: "", template: "ats",
      experience: [], projects: [], education: [], certifications: [], achievements: []
    });
    var TEMPLATE_META = {
      ats: { label: "Minimal ATS", icon: "📄", bestFor: "Freshers & corporate jobs", desc: "Clean black-and-white, single-column layout with maximum ATS readability. No graphics, no icons — just perfect spacing and typography.", features: ["Single-column layout", "Black & white only", "No icons or graphics", "ATS-optimized spacing", "Recruiter-friendly"], promptHint: "Use with Claude, ChatGPT, or any AI to generate a clean ATS resume." },
      faang: { label: "FAANG Style", icon: "🏢", bestFor: "Top tech companies", desc: "Highly structured, achievement-focused layout inspired by Google, Amazon, Meta, Microsoft, and Apple standards. Metrics-driven bullet points with strong hierarchy.", features: ["Achievement-focused format", "Metrics-driven bullets", "Strong visual hierarchy", "Skills grouped by category", "System design & AI sections"], promptHint: "Build with FAANG-level formatting using any AI coding tool." },
      modern: { label: "Modern Developer", icon: "⚡", bestFor: "Developers & designers", desc: "Elegant typography with tech stack chips, GitHub stats integration, and portfolio links. Balances visual appeal with ATS compatibility.", features: ["Tech stack chips & badges", "GitHub & portfolio links", "Elegant typography", "Dark/light mode ready", "Startup-ready layout"], promptHint: "Generate with AI for a modern, premium developer resume." },
      startup: { label: "Executive Professional", icon: "💼", bestFor: "Managers & senior roles", desc: "Premium corporate design with strong leadership sections, professional summary, and multi-level experience formatting for senior positions.", features: ["Leadership section", "Professional summary", "Multi-level formatting", "Executive branding", "Board-ready layout"], promptHint: "Prompt AI to craft an executive-level resume with leadership impact." },
      minimal: { label: "Creative ATS", icon: "🎨", bestFor: "UI/UX, creators, marketing", desc: "Stylish but still ATS-compatible with balanced accents, section dividers, and modern visual hierarchy. Shows personality without breaking parsers.", features: ["Balanced color accents", "Section dividers", "Modern hierarchy", "Personality-safe", "Portfolio-friendly"], promptHint: "Ask AI for a creative yet ATS-safe resume design." },
    };

    function escAttr(s) { return String(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

    function renderSectionEntries(key, label, fields, renderItem) {
      var items = rd[key] || [];
      var h = '<details class="resume-section-block" data-rs="' + key + '" ' + (items.length ? '' : 'open') + '>';
      h += '<summary class="resume-section-head"><span class="resume-section-label">' + label + '</span><span class="resume-section-count">' + items.length + '</span></summary>';
      h += '<div class="resume-section-entries" id="rs-' + key + '">';
      if (!items.length) h += '<p class="resume-section-empty">No entries yet. Add one below.</p>';
      items.forEach(function (item, idx) {
        h += renderItem(item, idx);
      });
      h += '</div>';
      h += '<button type="button" class="btn-ghost resume-add-btn" data-rs-add="' + key + '" style="margin-top:8px;font-size:.78rem">+ Add ' + label.slice(0,-1) + '</button>';
      h += '</details>';
      return h;
    }

    function renderExpItem(item, idx) {
      var e = item || {};
      return '<div class="resume-entry" data-rs-e="experience-' + idx + '">' +
        '<div class="resume-entry-summary" data-rs-toggle="experience-' + idx + '">' +
        '<div class="resume-entry-title"><strong>' + esc(e.role || "Role") + '</strong> at ' + esc(e.company || "Company") + '</div>' +
        '<div class="resume-entry-meta">' + esc(e.location || "") + (e.location && e.start ? " · " : "") + esc(e.start || "") + (e.end ? " – " + esc(e.end) : "") + '</div></div>' +
        '<div class="resume-entry-body" id="rs-body-experience-' + idx + '">' +
        '<input class="resume-ef" data-rsf="experience-' + idx + '-company" type="text" value="' + escAttr(e.company || "") + '" placeholder="Company" />' +
        '<input class="resume-ef" data-rsf="experience-' + idx + '-role" type="text" value="' + escAttr(e.role || "") + '" placeholder="Role" />' +
        '<input class="resume-ef" data-rsf="experience-' + idx + '-location" type="text" value="' + escAttr(e.location || "") + '" placeholder="Location" />' +
        '<div style="display:flex;gap:8px"><input class="resume-ef" data-rsf="experience-' + idx + '-start" type="text" value="' + escAttr(e.start || "") + '" placeholder="Start (e.g. Jan 2020)" style="flex:1" />' +
        '<input class="resume-ef" data-rsf="experience-' + idx + '-end" type="text" value="' + escAttr(e.end || "") + '" placeholder="End (or Present)" style="flex:1" /></div>' +
        '<textarea class="resume-ef" data-rsf="experience-' + idx + '-bullets" rows="3" placeholder="• Led migration of 12 microservices to Kubernetes, reducing deployment time by 80%">' + esc(e.bullets || "") + '</textarea>' +
        '<button type="button" class="btn-ghost resume-del-btn" data-rs-del="experience-' + idx + '" style="font-size:.72rem;color:#f87171">Remove</button></div></div>';
    }

    function renderProjItem(item, idx) {
      var e = item || {};
      return '<div class="resume-entry" data-rs-e="projects-' + idx + '">' +
        '<div class="resume-entry-summary" data-rs-toggle="projects-' + idx + '">' +
        '<div class="resume-entry-title"><strong>' + esc(e.name || "Project") + '</strong></div>' +
        '<div class="resume-entry-meta">' + esc(e.tech || "") + '</div></div>' +
        '<div class="resume-entry-body" id="rs-body-projects-' + idx + '">' +
        '<input class="resume-ef" data-rsf="projects-' + idx + '-name" type="text" value="' + escAttr(e.name || "") + '" placeholder="Project name" />' +
        '<input class="resume-ef" data-rsf="projects-' + idx + '-tech" type="text" value="' + escAttr(e.tech || "") + '" placeholder="Tech stack" />' +
        '<textarea class="resume-ef" data-rsf="projects-' + idx + '-desc" rows="2" placeholder="Brief description">' + esc(e.desc || "") + '</textarea>' +
        '<input class="resume-ef" data-rsf="projects-' + idx + '-url" type="url" value="' + escAttr(e.url || "") + '" placeholder="Live URL or repo" />' +
        '<textarea class="resume-ef" data-rsf="projects-' + idx + '-bullets" rows="2" placeholder="• Built real-time dashboard handling 50k events/sec">' + esc(e.bullets || "") + '</textarea>' +
        '<button type="button" class="btn-ghost resume-del-btn" data-rs-del="projects-' + idx + '" style="font-size:.72rem;color:#f87171">Remove</button></div></div>';
    }

    function renderEduItem(item, idx) {
      var e = item || {};
      return '<div class="resume-entry" data-rs-e="education-' + idx + '">' +
        '<div class="resume-entry-summary" data-rs-toggle="education-' + idx + '">' +
        '<div class="resume-entry-title"><strong>' + esc(e.school || "School") + '</strong> — ' + esc(e.degree || "Degree") + '</div>' +
        '<div class="resume-entry-meta">' + esc(e.field || "") + (e.field && e.startYear ? " · " : "") + esc(e.startYear || "") + (e.endYear ? " – " + esc(e.endYear) : "") + '</div></div>' +
        '<div class="resume-entry-body" id="rs-body-education-' + idx + '">' +
        '<input class="resume-ef" data-rsf="education-' + idx + '-school" type="text" value="' + escAttr(e.school || "") + '" placeholder="School / University" />' +
        '<input class="resume-ef" data-rsf="education-' + idx + '-degree" type="text" value="' + escAttr(e.degree || "") + '" placeholder="Degree (B.S., M.S., etc.)" />' +
        '<input class="resume-ef" data-rsf="education-' + idx + '-field" type="text" value="' + escAttr(e.field || "") + '" placeholder="Field of study" />' +
        '<div style="display:flex;gap:8px"><input class="resume-ef" data-rsf="education-' + idx + '-startYear" type="text" value="' + escAttr(e.startYear || "") + '" placeholder="Start year" style="flex:1" />' +
        '<input class="resume-ef" data-rsf="education-' + idx + '-endYear" type="text" value="' + escAttr(e.endYear || "") + '" placeholder="End year" style="flex:1" />' +
        '<input class="resume-ef" data-rsf="education-' + idx + '-gpa" type="text" value="' + escAttr(e.gpa || "") + '" placeholder="GPA" style="width:80px" /></div>' +
        '<button type="button" class="btn-ghost resume-del-btn" data-rs-del="education-' + idx + '" style="font-size:.72rem;color:#f87171">Remove</button></div></div>';
    }

    function renderCertItem(item, idx) {
      var e = item || {};
      return '<div class="resume-entry" data-rs-e="certifications-' + idx + '">' +
        '<div class="resume-entry-summary" data-rs-toggle="certifications-' + idx + '">' +
        '<div class="resume-entry-title"><strong>' + esc(e.name || "Certification") + '</strong></div>' +
        '<div class="resume-entry-meta">' + esc(e.issuer || "") + (e.issuer && e.year ? " · " : "") + esc(e.year || "") + '</div></div>' +
        '<div class="resume-entry-body" id="rs-body-certifications-' + idx + '">' +
        '<input class="resume-ef" data-rsf="certifications-' + idx + '-name" type="text" value="' + escAttr(e.name || "") + '" placeholder="Certification name" />' +
        '<input class="resume-ef" data-rsf="certifications-' + idx + '-issuer" type="text" value="' + escAttr(e.issuer || "") + '" placeholder="Issuer (AWS, Google, etc.)" />' +
        '<div style="display:flex;gap:8px"><input class="resume-ef" data-rsf="certifications-' + idx + '-year" type="text" value="' + escAttr(e.year || "") + '" placeholder="Year" style="width:120px" />' +
        '<input class="resume-ef" data-rsf="certifications-' + idx + '-url" type="url" value="' + escAttr(e.url || "") + '" placeholder="Credential URL (optional)" style="flex:1" /></div>' +
        '<button type="button" class="btn-ghost resume-del-btn" data-rs-del="certifications-' + idx + '" style="font-size:.72rem;color:#f87171">Remove</button></div></div>';
    }

    function renderAchItem(item, idx) {
      var e = item || {};
      return '<div class="resume-entry" data-rs-e="achievements-' + idx + '">' +
        '<div class="resume-entry-summary" data-rs-toggle="achievements-' + idx + '">' +
        '<div class="resume-entry-title"><strong>' + esc(e.title || "Achievement") + '</strong></div></div>' +
        '<div class="resume-entry-body" id="rs-body-achievements-' + idx + '">' +
        '<input class="resume-ef" data-rsf="achievements-' + idx + '-title" type="text" value="' + escAttr(e.title || "") + '" placeholder="Achievement title" />' +
        '<textarea class="resume-ef" data-rsf="achievements-' + idx + '-desc" rows="2" placeholder="Description or context">' + esc(e.desc || "") + '</textarea>' +
        '<button type="button" class="btn-ghost resume-del-btn" data-rs-del="achievements-' + idx + '" style="font-size:.72rem;color:#f87171">Remove</button></div></div>';
    }

    function collectSectionData() {
      function collectOne(key, fieldMap) {
        var items = [];
        var container = document.getElementById("rs-" + key);
        if (!container) return items;
        var entries = container.querySelectorAll('[data-rs-e]');
        entries.forEach(function (wrapper) {
          var idx = wrapper.getAttribute("data-rs-e").replace(key + "-", "");
          var item = {};
          fieldMap.forEach(function (f) {
            var el = wrapper.querySelector('[data-rsf="' + key + '-' + idx + '-' + f + '"]');
            item[f] = el ? el.value : "";
          });
          items.push(item);
        });
        return items;
      }
      rd.experience = collectOne("experience", ["company","role","location","start","end","bullets"]);
      rd.projects = collectOne("projects", ["name","tech","desc","url","bullets"]);
      rd.education = collectOne("education", ["school","degree","field","startYear","endYear","gpa"]);
      rd.certifications = collectOne("certifications", ["name","issuer","year","url"]);
      rd.achievements = collectOne("achievements", ["title","desc"]);
      rd.headline = document.getElementById("resume-headline").value;
      rd.summary = document.getElementById("resume-summary").value;
      rd.skills = document.getElementById("resume-skills").value;
      rd.bullets = document.getElementById("resume-bullets").value;
    }

    function renderResumeBuilder() {
      var meta = TEMPLATE_META[rd.template] || TEMPLATE_META.ats;
      var html = '<div class="resume-builder-layout">';

      // Left column: Template cards + guidance
      html += '<div class="resume-builder-sidebar">';
      html += '<h3 style="font-size:.9rem;font-weight:700;margin-bottom:1rem;color:var(--gold);letter-spacing:.02em">Choose Template</h3>';
      html += '<div class="resume-tpl-grid">';
      var tplOrder = ["ats", "faang", "modern", "startup", "minimal"];
      tplOrder.forEach(function (t) {
        var m = TEMPLATE_META[t];
        if (!m) return;
        var active = rd.template === t ? " active" : "";
        html += '<button type="button" class="resume-tpl-card' + active + '" data-rt="' + t + '">';
        html += '<div class="resume-tpl-icon">' + m.icon + '</div>';
        html += '<div class="resume-tpl-info">';
        html += '<div class="resume-tpl-name">' + m.label + '</div>';
        html += '<div class="resume-tpl-badge">' + esc(m.bestFor) + '</div>';
        html += '</div></button>';
      });
      html += '</div>';

      // Active template description
      html += '<div class="resume-tpl-detail panel" style="margin-top:1rem">';
      html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:.65rem"><span style="font-size:1.4rem">' + meta.icon + '</span><div><div style="font-weight:700;font-size:.9rem">' + meta.label + '</div><div class="resume-tpl-badge" style="margin-top:2px">' + esc(meta.bestFor) + '</div></div></div>';
      html += '<p style="font-size:.82rem;color:var(--muted);line-height:1.7;margin-bottom:.75rem">' + meta.desc + '</p>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:.85rem">';
      meta.features.forEach(function (f) {
        html += '<span class="badge badge-gold">' + esc(f) + '</span>';
      });
      html += '</div>';
      html += '<details class="resume-prompt-details"><summary style="font-size:.78rem;color:var(--gold);cursor:pointer;font-weight:600">📝 View AI prompt for this template</summary>';
      html += '<div class="resume-prompt-box"><pre style="font-size:.72rem;line-height:1.6;white-space:pre-wrap;color:var(--muted)">' + esc(getTemplatePrompt(rd.template)) + '</pre></div></details>';
      html += '</div></div>';

      // Right column: Editor
      html += '<div class="resume-builder-editor">';
      html += '<h3 style="font-size:.9rem;font-weight:700;margin-bottom:1rem;color:var(--gold)">Build Your Resume</h3>';
      html += '<label class="resume-field"><span>Professional headline</span><input id="resume-headline" type="text" value="' + esc(rd.headline) + '" placeholder="Senior Full Stack Engineer · Cloud & Security" /></label>';
      html += '<label class="resume-field"><span>Professional summary</span><textarea id="resume-summary" rows="3" placeholder="Brief professional summary highlighting your key strengths and career narrative">' + esc(rd.summary) + '</textarea></label>';
      html += '<label class="resume-field"><span>Technical skills (comma separated)</span><input id="resume-skills" type="text" value="' + esc(rd.skills) + '" placeholder="React, Node.js, TypeScript, AWS, Docker, PostgreSQL" /></label>';
      html += '<label class="resume-field"><span>Impact bullets (general experience)</span><textarea id="resume-bullets" rows="4" placeholder="• Led migration of 12 microservices to Kubernetes, reducing deployment time by 80%&#10;• Built real-time analytics dashboard handling 50k events/sec with 99.9% uptime&#10;• Designed auth system serving 2M+ users with OAuth2, JWT rotation">' + esc(rd.bullets) + '</textarea></label>';

      // Structured sections
      html += '<div class="resume-sections-stack" style="margin-top:1.25rem">';
      html += renderSectionEntries("experience", "Experience", ["company","role","location","start","end","bullets"], renderExpItem);
      html += renderSectionEntries("projects", "Projects", ["name","tech","desc","url","bullets"], renderProjItem);
      html += renderSectionEntries("education", "Education", ["school","degree","field","startYear","endYear","gpa"], renderEduItem);
      html += renderSectionEntries("certifications", "Certifications", ["name","issuer","year","url"], renderCertItem);
      html += renderSectionEntries("achievements", "Achievements", ["title","desc"], renderAchItem);
      html += '</div>';

      // Export actions
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:1.25rem">';
      html += '<button type="button" class="btn-primary" id="resume-save">💾 Save draft</button>';
      html += '<button type="button" class="btn-outline" id="resume-export-text">Export .txt</button>';
      html += '<button type="button" class="btn-outline" id="resume-export-md">Export .md</button>';
      html += '<button type="button" class="btn-ghost" id="resume-copy-ats">Copy ATS text</button>';
      html += '</div>';
      html += '<div class="resume-preview-box" id="resume-preview">' + buildResumePreview(rd) + '</div>';
      html += '</div></div>';

      document.getElementById("career-panel-resume").innerHTML = html;

      // Template selection
      document.querySelectorAll("[data-rt]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          collectSectionData();
          rd.template = btn.getAttribute("data-rt");
          saveJSON(SK.resumeDraft, rd);
          renderResumeBuilder();
        });
      });

      // Toggle entry body
      document.querySelectorAll("[data-rs-toggle]").forEach(function (toggle) {
        toggle.addEventListener("click", function () {
          var id = toggle.getAttribute("data-rs-toggle");
          var body = document.getElementById("rs-body-" + id);
          if (body) body.classList.toggle("open");
        });
      });

      // Add entry
      document.querySelectorAll("[data-rs-add]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          collectSectionData();
          var key = btn.getAttribute("data-rs-add");
          var emptyMap = { experience: {company:"",role:"",location:"",start:"",end:"",bullets:""}, projects: {name:"",tech:"",desc:"",url:"",bullets:""}, education: {school:"",degree:"",field:"",startYear:"",endYear:"",gpa:""}, certifications: {name:"",issuer:"",year:"",url:""}, achievements: {title:"",desc:""} };
          rd[key].push(emptyMap[key] || {});
          saveJSON(SK.resumeDraft, rd);
          renderResumeBuilder();
        });
      });

      // Delete entry
      document.querySelectorAll("[data-rs-del]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          collectSectionData();
          var parts = btn.getAttribute("data-rs-del").split("-");
          var key = parts.slice(0, -1).join("-");
          var idx = parseInt(parts[parts.length - 1], 10);
          if (rd[key] && rd[key].length > idx) rd[key].splice(idx, 1);
          saveJSON(SK.resumeDraft, rd);
          renderResumeBuilder();
        });
      });

      // Save draft
      document.getElementById("resume-save").addEventListener("click", function () {
        collectSectionData();
        saveJSON(SK.resumeDraft, rd);
        document.getElementById("resume-preview").textContent = buildResumePreview(rd);
        toast("Resume draft saved");
      });

      document.getElementById("resume-export-text").addEventListener("click", function () {
        collectSectionData();
        var t = buildResumePlain(rd);
        downloadText(t, "resume-" + rd.template + ".txt");
        toast("Resume exported as text");
      });
      document.getElementById("resume-export-md").addEventListener("click", function () {
        collectSectionData();
        var m = buildResumeMarkdown(rd);
        downloadText(m, "resume-" + rd.template + ".md");
        toast("Resume exported as markdown");
      });
      document.getElementById("resume-copy-ats").addEventListener("click", function () {
        collectSectionData();
        var t = buildResumePlain(rd);
        navigator.clipboard.writeText(t).then(function () { toast("ATS text copied to clipboard"); }, function () { toast("Copy failed"); });
      });
    }
    renderResumeBuilder();

    // ---- GITHUB PROFILE ----
    renderGitHubPanel();

    // ---- CERTIFICATE PREMIUM ----
    var certKey = "tm-cert-name";
    var certName = localStorage.getItem(certKey) || "Dedicated Learner";
    function renderCertPanel() {
      var html = '<h3 style="font-size:.9rem;font-weight:600;margin-bottom:.5rem;color:var(--gold)">🎓 Certificate of Progress</h3>';
      html += '<p style="font-size:.82rem;color:var(--muted);margin-bottom:1rem">Generate a premium, shareable certificate celebrating your progress through TechMaster Roadmap modules.</p>';
      html += '<label style="display:block;margin-bottom:.75rem;font-size:.82rem"><span>Your name on the certificate</span><input id="cert-recipient-input" type="text" value="' + esc(certName) + '" style="width:100%;margin-top:4px;padding:10px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)" /></label>';
      html += '<div class="export-group"><button type="button" class="btn-primary" id="btn-gen-cert-p">Generate Certificate</button><button type="button" class="btn-outline" id="btn-download-cert">Download as text</button></div>';
      html += '<div id="cert-preview-area" style="margin-top:1.25rem"></div>';
      document.getElementById("career-panel-certs").innerHTML = html;
      document.getElementById("btn-gen-cert-p").addEventListener("click", generateCertPreview);
      document.getElementById("btn-download-cert").addEventListener("click", function () {
        var name = document.getElementById("cert-recipient-input").value.trim() || "Dedicated Learner";
        var text = "========================================\n  TECHMASTER ROADMAP\n  Certificate of Progress\n========================================\n\n  Awarded to: " + name + "\n\n  For sustained completion across TechMaster\n  Roadmap modules, demonstrating dedication to\n  professional growth in software engineering.\n\n  Date: " + new Date().toLocaleDateString() + "\n\n  — TechMaster Roadmap Platform —\n========================================";
        downloadText(text, "techmaster-certificate.txt");
        toast("Certificate downloaded");
      });
    }
    renderCertPanel();

    // ---- STRATEGY TABS ----
    function initStrategyTabs() {
      var panel = document.getElementById("career-panel-strategy");
      if (!panel || panel.dataset.strategyInit) return;
      panel.dataset.strategyInit = "1";
      var html = '<div class="doc-tabs" id="strategy-subtabs" style="margin-bottom:1rem">';
      var tabs = [
        { id: "startup", label: "🚀 Startup Jobs" },
        { id: "freelance", label: "💼 Freelancing" },
        { id: "remote", label: "🌍 Remote Work" },
        { id: "networking", label: "🤝 Networking & Brand" },
      ];
      tabs.forEach(function (t, i) {
        html += '<button type="button" class="doc-tab' + (i === 0 ? " active" : "") + '" data-stab="' + t.id + '" role="tab" aria-selected="' + (i === 0 ? "true" : "false") + '">' + t.label + "</button>";
      });
      html += "</div>";
      tabs.forEach(function (t) {
        html += '<div class="strategy-section" id="stab-' + t.id + '" style="display:' + (t.id === "startup" ? "block" : "none") + '">' + getStrategyContent(t.id) + "</div>";
      });
      panel.innerHTML = html + panel.innerHTML;
      panel.addEventListener("click", function (e) {
        var tab = e.target.closest("[data-stab]");
        if (!tab) return;
        var key = tab.getAttribute("data-stab");
        panel.querySelectorAll("[data-stab]").forEach(function (x) { x.classList.toggle("active", x === tab); x.setAttribute("aria-selected", x === tab ? "true" : "false"); });
        tabs.forEach(function (t) {
          var sec = document.getElementById("stab-" + t.id);
          if (sec) sec.style.display = t.id === key ? "block" : "none";
        });
      });
    }
    initStrategyTabs();
  }

  function fetchGitHubProfile() {
    var username = document.getElementById("gh-username").value.trim();
    if (!username) { toast("Enter a GitHub username"); return; }
    toast("Fetching GitHub profile...");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.github.com/users/" + encodeURIComponent(username));
    xhr.onload = function () {
      if (xhr.status !== 200) { toast("GitHub user not found"); return; }
      try {
        var data = JSON.parse(xhr.responseText);
        var pending = 4;
        var langOwner = data.login;
        function done() { pending--; if (pending === 0) { saveJSON("tm-github-data", data); toast("GitHub profile loaded!"); document.getElementById("career-panel-github").innerHTML = ""; renderGitHubPanel(); } }
        var reposReq = new XMLHttpRequest();
        reposReq.open("GET", data.repos_url + "?sort=stars&per_page=100&type=all");
        reposReq.onload = function () {
          try { data.repos = JSON.parse(reposReq.responseText); } catch (e) { data.repos = []; }
          var langBytes = {};
          var allTopics = {};
          data.repos.forEach(function (r) {
            if (r.language) langBytes[r.language] = (langBytes[r.language] || 0) + 1;
            if (r.topics) r.topics.forEach(function (t) { allTopics[t] = (allTopics[t] || 0) + 1; });
          });
          data.languages = Object.keys(langBytes).map(function (k) { return { name: k, count: langBytes[k] }; }).sort(function (a, b) { return b.count - a.count; });
          data.topics = Object.keys(allTopics).map(function (k) { return { name: k, count: allTopics[k] }; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 15);
          var starTotal = 0; data.repos.forEach(function (r) { starTotal += r.stargazers_count || 0; });
          data.totalStars = starTotal;

          // Fetch detailed language bytes for top repos
          data.detailLangs = {};
          var topRepos = data.repos.slice(0, 20);
          var langPending = topRepos.length;
          if (!langPending) { done(); return; }
          topRepos.forEach(function (r) {
            var lr = new XMLHttpRequest();
            lr.open("GET", "https://api.github.com/repos/" + encodeURIComponent(langOwner) + "/" + encodeURIComponent(r.name) + "/languages");
            lr.onload = function () {
              try {
                var lm = JSON.parse(lr.responseText);
                Object.keys(lm).forEach(function (k) { data.detailLangs[k] = (data.detailLangs[k] || 0) + lm[k]; });
              } catch (e) {}
              langPending--; if (langPending === 0) { var dl = []; Object.keys(data.detailLangs).forEach(function (k) { dl.push({ name: k, bytes: data.detailLangs[k] }); }); data.detailLangs = dl.sort(function (a, b) { return b.bytes - a.bytes; }); done(); }
            };
            lr.onerror = function () { langPending--; if (langPending === 0) { var dl = []; Object.keys(data.detailLangs).forEach(function (k) { dl.push({ name: k, bytes: data.detailLangs[k] }); }); data.detailLangs = dl.sort(function (a, b) { return b.bytes - a.bytes; }); done(); } };
            lr.send();
          });
        };
        reposReq.send();
        var evtReq = new XMLHttpRequest();
        evtReq.open("GET", "https://api.github.com/users/" + encodeURIComponent(username) + "/events?per_page=100");
        evtReq.onload = function () {
          try { data.events = JSON.parse(evtReq.responseText); } catch (e) { data.events = []; }
          var pushTotal = 0; (data.events || []).forEach(function (e) { if (e.type === "PushEvent") pushTotal += (e.payload && e.payload.size) || 0; });
          data.totalCommits = pushTotal;
          done();
        };
        evtReq.onerror = function () { data.events = []; done(); };
        evtReq.send();
        var orgsReq = new XMLHttpRequest();
        orgsReq.open("GET", "https://api.github.com/users/" + encodeURIComponent(username) + "/orgs");
        orgsReq.onload = function () {
          try { data.orgs = JSON.parse(orgsReq.responseText); } catch (e) { data.orgs = []; }
          done();
        };
        orgsReq.onerror = function () { data.orgs = []; done(); };
        orgsReq.send();
        // Fetch commit activity for top repos
        data.commitWeeks = [];
        var caReq = new XMLHttpRequest();
        caReq.open("GET", "https://api.github.com/users/" + encodeURIComponent(username) + "/repos?sort=stars&per_page=5&type=all");
        caReq.onload = function () {
          try {
            var top5 = JSON.parse(caReq.responseText);
            var cap = top5.length;
            if (!cap) { done(); return; }
            top5.forEach(function (r) {
              var cr = new XMLHttpRequest();
              cr.open("GET", "https://api.github.com/repos/" + encodeURIComponent(langOwner) + "/" + encodeURIComponent(r.name) + "/stats/commit_activity");
              cr.onload = function () {
                try {
                  var weeks = JSON.parse(cr.responseText);
                  if (weeks && weeks.length) {
                    weeks.forEach(function (w, wi) {
                      data.commitWeeks[wi] = (data.commitWeeks[wi] || 0) + (w.total || 0);
                    });
                  }
                } catch (e) {}
                cap--; if (cap === 0) { data.commitWeeks = data.commitWeeks.slice(-26); done(); }
              };
              cr.onerror = function () { cap--; if (cap === 0) { data.commitWeeks = data.commitWeeks.slice(-26); done(); } };
              cr.send();
            });
          } catch (e) { done(); }
        };
        caReq.onerror = function () { done(); };
        caReq.send();
      } catch (e) { toast("Failed to parse profile"); }
    };
    xhr.onerror = function () { toast("Network error fetching GitHub"); };
    xhr.send();
  }

  function renderGitHubPanel() {
    var ghKey = "tm-github-data";
    var ghData = loadJSON(ghKey, null);
    var langColors = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", Ruby: "#701516", "C#": "#178600", PHP: "#4F5D95", Swift: "#ffac45", Kotlin: "#A97BFF", Dart: "#00B4AB" };
    var html = '<div style="margin-bottom:1rem;display:flex;gap:10px;flex-wrap:wrap;align-items:center">';
    html += '<input id="gh-username" type="text" placeholder="Enter GitHub username..." value="' + esc(ghData && ghData.login ? ghData.login : "") + '" style="flex:1;min-width:200px;padding:10px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)" />';
    html += '<button type="button" class="btn-primary" id="gh-fetch">Fetch Profile</button>';
    html += '<button type="button" class="btn-ghost" id="gh-clear">Clear</button>';
    html += "</div>";
    if (ghData && ghData.login) {
      var createdAt = ghData.created_at ? new Date(ghData.created_at) : null;
      var accountAge = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 86400000 / 365) + " yrs" : "";
      // Profile header
      html += '<div class="github-card"><div class="github-card-header">';
      if (ghData.avatar_url) html += '<img src="' + esc(ghData.avatar_url) + '" alt="" class="github-avatar" loading="lazy" />';
      html += '<div class="github-info"><div class="github-name">' + esc(ghData.name || ghData.login) + '</div><div class="github-login">@' + esc(ghData.login) + '</div>';
      if (ghData.bio) html += '<div class="github-bio">' + esc(ghData.bio) + "</div>";
      html += '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;font-size:.72rem;color:var(--muted)">';
      if (ghData.company) html += '<span class="badge badge-blue">🏢 ' + esc(ghData.company) + '</span>';
      if (ghData.location) html += '<span class="badge">📍 ' + esc(ghData.location) + '</span>';
      if (ghData.email) html += '<span class="badge">✉️ ' + esc(ghData.email) + '</span>';
      if (ghData.twitter_username) html += '<span class="badge badge-blue">🐦 @' + esc(ghData.twitter_username) + '</span>';
      if (ghData.hireable) html += '<span class="badge badge-green">✅ Open to work</span>';
      if (accountAge) html += '<span class="badge">📅 ' + accountAge + ' on GitHub</span>';
      if (ghData.blog) html += '<a href="' + esc(ghData.blog) + '" target="_blank" class="badge badge-gold">🌐 Website</a>';
      html += '</div></div></div>';
      // Stats row
      html += '<div class="github-stats"><div class="github-stat"><div class="github-stat-num">' + (ghData.public_repos || 0) + '</div><div class="github-stat-label">Repos</div></div><div class="github-stat"><div class="github-stat-num">' + (ghData.followers || 0) + '</div><div class="github-stat-label">Followers</div></div><div class="github-stat"><div class="github-stat-num">' + (ghData.following || 0) + '</div><div class="github-stat-label">Following</div></div><div class="github-stat"><div class="github-stat-num">' + (ghData.totalStars || 0) + '</div><div class="github-stat-label">Total ⭐</div></div></div>';

      // Orgs
      if (ghData.orgs && ghData.orgs.length) {
        html += '<div class="panel" style="margin-top:.75rem"><h3>Organizations</h3><div style="display:flex;flex-wrap:wrap;gap:10px">';
        ghData.orgs.forEach(function (o) {
          html += '<a href="https://github.com/' + esc(o.login) + '" target="_blank" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.03);text-decoration:none;color:var(--text);font-size:.78rem;transition:all .2s" onmouseover="this.style.borderColor=\'rgba(212,175,55,.4)\'" onmouseout="this.style.borderColor=\'\'">' + (o.avatar_url ? '<img src="' + esc(o.avatar_url) + '" alt="" style="width:24px;height:24px;border-radius:6px" loading="lazy" />' : '') + esc(o.login) + '</a>';
        });
        html += '</div></div>';
      }

      // Languages chart (byte-level detail)
      if (ghData.detailLangs && ghData.detailLangs.length) {
        var maxDL = ghData.detailLangs[0].bytes;
        html += '<div class="panel" style="margin-top:.75rem"><h3>Languages by bytes</h3><div style="display:flex;flex-direction:column;gap:5px">';
        ghData.detailLangs.forEach(function (l) {
          var pct = Math.round((l.bytes / maxDL) * 100);
          var color = langColors[l.name] || "#94a3b8";
          var pretty = l.bytes >= 1000000 ? (l.bytes / 1000000).toFixed(1) + " MB" : l.bytes >= 1000 ? (l.bytes / 1000).toFixed(0) + " KB" : l.bytes + " B";
          html += '<div style="display:flex;align-items:center;gap:8px;font-size:.78rem"><span style="width:100px;flex-shrink:0;color:var(--muted)">' + esc(l.name) + '</span><div class="progress-bar" style="flex:1;height:8px"><div class="progress-fill" style="width:' + pct + '%;background:' + color + '"></div></div><span style="width:60px;text-align:right;color:var(--text);font-weight:600;font-size:.7rem">' + pretty + '</span></div>';
        });
        html += '</div></div>';
      } else if (ghData.languages && ghData.languages.length) {
        var maxLang = ghData.languages[0].count;
        html += '<div class="panel" style="margin-top:.75rem"><h3>Languages by repo count</h3><div style="display:flex;flex-direction:column;gap:5px">';
        ghData.languages.forEach(function (l) {
          var pct = Math.round((l.count / maxLang) * 100);
          var color = langColors[l.name] || "#94a3b8";
          html += '<div style="display:flex;align-items:center;gap:8px;font-size:.78rem"><span style="width:100px;flex-shrink:0;color:var(--muted)">' + esc(l.name) + '</span><div class="progress-bar" style="flex:1;height:8px"><div class="progress-fill" style="width:' + pct + '%;background:' + color + '"></div></div><span style="width:36px;text-align:right;color:var(--text);font-weight:600">' + l.count + '</span></div>';
        });
        html += '</div></div>';
      }

      // Topics
      if (ghData.topics && ghData.topics.length) {
        html += '<div class="panel" style="margin-top:.75rem"><h3>Common Topics</h3><div style="display:flex;flex-wrap:wrap;gap:5px">';
        ghData.topics.forEach(function (t) {
          html += '<span class="proj-tag" style="background:rgba(212,175,55,.1);color:var(--gold);font-size:.7rem">' + esc(t.name) + '</span>';
        });
        html += '</div></div>';
      }

      // Recent activity
      if (ghData.events && ghData.events.length) {
        var evtCounts = { PushEvent: 0, CreateEvent: 0, PullRequestEvent: 0, IssuesEvent: 0, WatchEvent: 0, IssueCommentEvent: 0, ForkEvent: 0 };
        ghData.events.forEach(function (ev) { if (evtCounts[ev.type] !== undefined) evtCounts[ev.type]++; });
        var evtLabels = { PushEvent: "Pushes", CreateEvent: "Created", PullRequestEvent: "PRs", IssuesEvent: "Issues", WatchEvent: "Stars", IssueCommentEvent: "Comments", ForkEvent: "Forks" };
        var evtMax = 0; var evtArr = [];
        Object.keys(evtCounts).forEach(function (k) { if (evtCounts[k] > 0) { evtArr.push({ type: k, count: evtCounts[k], label: evtLabels[k] || k }); if (evtCounts[k] > evtMax) evtMax = evtCounts[k]; } });
        if (evtArr.length) {
          html += '<div class="panel" style="margin-top:.75rem"><h3>Activity (last 90 days)</h3><div style="display:flex;align-items:center;gap:10px;margin-bottom:.75rem;flex-wrap:wrap">';
          html += '<span class="badge badge-gold">⚡ ' + (ghData.totalCommits || 0) + ' commits pushed</span>';
          html += '<span class="badge badge-blue">📦 ' + (ghData.public_repos || 0) + ' repos</span>';
          html += '</div><div class="chart-row" style="height:90px">';
          evtArr.forEach(function (ev) {
            var h = Math.round((ev.count / Math.max(evtMax, 1)) * 100);
            html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px"><div class="chart-bar" style="height:' + h + '%;width:80%;min-height:6px;background:linear-gradient(180deg,rgba(212,175,55,.85),rgba(212,175,55,.15))"></div><span style="font-size:.58rem;color:var(--muted);text-align:center;white-space:nowrap">' + esc(ev.label) + '</span><span style="font-size:.62rem;font-weight:700;color:var(--gold)">' + ev.count + '</span></div>';
          });
          html += '</div></div>';
        }
      }

      // Weekly commit chart
      if (ghData.commitWeeks && ghData.commitWeeks.length >= 8) {
        var cwMax = 1;
        ghData.commitWeeks.forEach(function (c) { if (c > cwMax) cwMax = c; });
        html += '<div class="panel" style="margin-top:.75rem"><h3>Weekly commits (last 6 months)</h3><div class="chart-row" style="height:80px;gap:3px">';
        ghData.commitWeeks.forEach(function (c) {
          var h = Math.round((c / cwMax) * 100);
          html += '<div class="chart-bar" style="height:' + Math.max(h, 2) + '%;min-height:2px;flex:1;background:linear-gradient(180deg,rgba(16,185,129,.9),rgba(16,185,129,.2))" title="' + c + ' commits"></div>';
        });
        html += '</div><div style="display:flex;justify-content:space-between;font-size:.6rem;color:var(--muted);margin-top:4px"><span>26 weeks ago</span><span>This week</span></div></div>';
      }

      // Repos
      if (ghData.repos && ghData.repos.length) {
        html += '<div class="github-repos" style="margin-top:.75rem"><div style="font-size:.78rem;color:var(--gold);margin-bottom:.5rem;font-weight:600">📌 Top Repositories</div>';
        ghData.repos.slice(0, 10).forEach(function (r) {
          var langColor = langColors[r.language] || "#94a3b8";
          var stars = r.stargazers_count ? "★ " + r.stargazers_count : "";
          var forks = r.forks_count ? "⑂ " + r.forks_count : "";
          var license = r.license && r.license.spdx_id ? '<span class="badge" style="font-size:.62rem">' + esc(r.license.spdx_id) + '</span>' : "";
          var topics = (r.topics || []).slice(0, 3).map(function (t) { return '<span style="font-size:.6rem;padding:1px 6px;border-radius:3px;background:rgba(212,175,55,.08);color:var(--gold)">' + esc(t) + '</span>'; }).join("");
          var pushed = r.pushed_at ? new Date(r.pushed_at) : null;
          var timeAgo = pushed ? Math.floor((Date.now() - pushed.getTime()) / 86400000) + "d" : "";
          html += '<div class="github-repo-item"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><a href="' + esc(r.html_url) + '" target="_blank" style="color:var(--text);text-decoration:none;font-weight:500">' + esc(r.name) + '</a>' + topics + license + '</div>' + (r.description ? '<div style="font-size:.7rem;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.description) + '</div>' : '') + '</div><div style="display:flex;align-items:center;gap:8px;flex-shrink:0"><span class="github-repo-lang" style="color:' + langColor + '">' + esc(r.language || "") + '</span>' + (stars ? '<span style="font-size:.68rem;color:var(--gold)">' + stars + '</span>' : '') + (forks ? '<span style="font-size:.68rem;color:var(--muted)">' + forks + '</span>' : '') + (timeAgo ? '<span style="font-size:.6rem;color:var(--muted)">' + timeAgo + '</span>' : '') + '</div></div>';
        });
        html += "</div>";
      }
      html += "</div>";
      // README Generator
      html += '<div style="margin-top:1.25rem"><h3 style="font-size:.9rem;font-weight:600;margin-bottom:.5rem;color:var(--gold)">📝 Profile README Generator</h3>';
      html += '<p style="font-size:.8rem;color:var(--muted);margin-bottom:.75rem">Generate a premium README for your GitHub profile profile.</p>';
      html += '<div style="margin-bottom:.75rem"><input id="gh-readme-intro" type="text" value="Building software that scales. Full-stack engineer passionate about distributed systems, DX, and clean architecture." style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)" /></div>';
      html += '<div style="margin-bottom:.75rem"><input id="gh-readme-focus" type="text" value="Deepening expertise in system design, Kubernetes, and AI/ML pipelines" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)" /></div>';
      html += '<div style="margin-bottom:.75rem"><input id="gh-readme-fun" type="text" value="I automate everything more than twice." style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text)" /></div>';
      html += '<div class="export-group"><button type="button" class="btn-outline" id="gh-gen-readme">Generate README</button><button type="button" class="btn-ghost" id="gh-copy-readme">Copy</button></div>';
      html += '<pre id="gh-readme-output" style="margin-top:.75rem;background:var(--code-bg);border:1px solid var(--code-border);border-radius:12px;padding:1rem;font-size:.78rem;white-space:pre-wrap;color:var(--text);max-height:400px;overflow:auto;display:none"></pre></div>';
    }
    document.getElementById("career-panel-github").innerHTML = html;
    document.getElementById("gh-fetch").addEventListener("click", fetchGitHubProfile);
    var clearBtn2 = document.getElementById("gh-clear");
    if (clearBtn2) clearBtn2.addEventListener("click", function () { saveJSON("tm-github-data", null); renderGitHubPanel(); toast("GitHub data cleared"); });
    var genBtn2 = document.getElementById("gh-gen-readme");
    if (genBtn2) genBtn2.addEventListener("click", generateGitHubReadme);
    var copyBtn2 = document.getElementById("gh-copy-readme");
    if (copyBtn2) copyBtn2.addEventListener("click", function () {
      var out = document.getElementById("gh-readme-output");
      if (!out || out.style.display === "none") { toast("Generate README first"); return; }
      navigator.clipboard.writeText(out.textContent).then(function () { toast("README copied!"); }, function () { toast("Copy failed"); });
    });
  }

  function generateGitHubReadme() {
    var ghKey = "tm-github-data";
    var ghData = loadJSON(ghKey, null);
    var intro = document.getElementById("gh-readme-intro").value.trim() || "Building software that scales.";
    var focus = document.getElementById("gh-readme-focus").value.trim() || "Full-stack development";
    var fun = document.getElementById("gh-readme-fun").value.trim() || "I write code.";
    var name = ghData && ghData.name ? ghData.name : "Developer";
    var login = ghData && ghData.login ? ghData.login : "username";
    var statsMd = ghData ? "\n[![" + login + " GitHub stats](https://github-readme-stats.vercel.app/api?username=" + login + "&show_icons=true&theme=dark&hide_border=true)](https://github.com/" + login + ")" : "";
    var streakMd = ghData ? "\n[![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=" + login + "&theme=dark&hide_border=true)](https://github.com/" + login + ")" : "";
    var md = "# Hi there, I'm " + name + " 👋\n\n" + intro + "\n\n## 🔭 Currently\n" + focus + "\n\n## ⚡ Fun fact\n" + fun + "\n" + statsMd + streakMd + "\n\n## 🛠️ Tech Stack\n![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)\n![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)\n![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)\n![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)\n![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)\n![AWS](https://img.shields.io/badge/-AWS-232F3E?style=flat-square&logo=amazon-aws&logoColor=white)\n\n## 📫 Connect\n[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/" + login + ")\n[![Twitter](https://img.shields.io/badge/-Twitter-1DA1F2?style=flat-square&logo=twitter&logoColor=white)](https://twitter.com/" + login + ")\n[![Portfolio](https://img.shields.io/badge/-Portfolio-000000?style=flat-square&logo=vercel&logoColor=white)](https://" + login + ".dev)";
    var el = document.getElementById("gh-readme-output");
    el.textContent = md;
    el.style.display = "block";
    toast("README generated!");
  }

  function fmtBullets(b) {
    if (!b) return "";
    return b.split("\n").filter(function (l) { return l.trim(); }).join("\n");
  }

  function fmtSectionLines(label, items, formatter) {
    if (!items || !items.length) return "";
    var lines = ["", "── " + label + " ──", ""];
    items.forEach(function (item) {
      lines.push(formatter(item));
    });
    return lines.filter(function (l) { return l; }).join("\n");
  }

  function fmtSectionMd(label, items, formatter) {
    if (!items || !items.length) return "";
    var md = "\n## " + label + "\n\n";
    items.forEach(function (item) {
      md += formatter(item) + "\n";
    });
    return md;
  }

  function buildResumePreview(rd) {
    var tpl = rd.template || "ats";
    var headline = rd.headline || "Senior Software Engineer";
    var summary = rd.summary || "";
    var skills = rd.skills || "";
    var bullets = rd.bullets || "";
    var exp = rd.experience || [];
    var proj = rd.projects || [];
    var edu = rd.education || [];
    var certs = rd.certifications || [];
    var ach = rd.achievements || [];
    var body = [];

    // Header
    if (tpl === "minimal") body.push(headline, "=".repeat(headline.length));
    else if (tpl === "startup") body.push("⚡ " + headline + " ⚡");
    else if (tpl === "faang") body.push(headline);
    else if (tpl === "modern") body.push("▸ " + headline + " ◂");
    else body.push(headline);
    body.push("");

    // Summary
    if (summary) body.push(summary, "");

    // Skills
    if (skills) {
      if (tpl === "faang") body.push("Core Competencies: " + skills, "");
      else if (tpl === "startup") body.push("Stack: " + skills, "");
      else if (tpl === "minimal") body.push("Skills: " + skills, "");
      else if (tpl === "modern") body.push("■ Skills: " + skills, "");
      else body.push(skills, "");
    }

    // Experience entries
    if (exp.length) {
      body.push(tpl === "modern" ? "● Experience" : "── Experience ──", "");
      exp.forEach(function (e) {
        var line = (e.role || "") + (e.company ? " at " + e.company : "");
        if (e.location || e.start) line += " — " + [e.location, e.start + (e.end ? "–" + e.end : "")].filter(Boolean).join(" · ");
        body.push(line);
        if (e.bullets) body.push(fmtBullets(e.bullets));
        body.push("");
      });
    } else if (bullets) {
      body.push("── Experience ──", "");
      body.push(fmtBullets(bullets));
      body.push("");
    }

    // Projects
    if (proj.length) {
      body.push("── Projects ──", "");
      proj.forEach(function (p) {
        body.push((p.name || "") + (p.tech ? " [" + p.tech + "]" : ""));
        if (p.desc) body.push(p.desc);
        if (p.bullets) body.push(fmtBullets(p.bullets));
        if (p.url) body.push("🔗 " + p.url);
        body.push("");
      });
    }

    // Education
    if (edu.length) {
      body.push("── Education ──", "");
      edu.forEach(function (e) {
        body.push((e.school || "") + (e.degree ? " — " + e.degree : "") + (e.field ? " in " + e.field : "") + (e.gpa ? " (GPA: " + e.gpa + ")" : ""));
        if (e.startYear || e.endYear) body.push((e.startYear || "") + (e.endYear ? " – " + e.endYear : ""));
        body.push("");
      });
    }

    // Certifications
    if (certs.length) {
      body.push("── Certifications ──", "");
      certs.forEach(function (c) {
        body.push((c.name || "") + (c.issuer ? " — " + c.issuer : "") + (c.year ? " (" + c.year + ")" : ""));
      });
      body.push("");
    }

    // Achievements
    if (ach.length) {
      body.push("── Achievements ──", "");
      ach.forEach(function (a) {
        body.push((a.title || "") + (a.desc ? ": " + a.desc : ""));
      });
    }

    return body.filter(function (l) { return l !== undefined; }).join("\n");
  }

  function buildResumePlain(rd) {
    var headline = rd.headline || "Senior Software Engineer";
    var summary = rd.summary || "";
    var skills = rd.skills || "";
    var bullets = rd.bullets || "";
    var exp = rd.experience || [];
    var proj = rd.projects || [];
    var edu = rd.education || [];
    var certs = rd.certifications || [];
    var ach = rd.achievements || [];
    var lines = [headline, ""];
    if (summary) lines.push(summary, "");
    if (skills) lines.push("Skills: " + skills, "");

    if (exp.length) {
      lines.push("EXPERIENCE", "");
      exp.forEach(function (e) {
        var l = (e.role || "") + (e.company ? " at " + e.company : "");
        if (e.location || e.start) l += " (" + [e.location, e.start + (e.end ? "–" + e.end : "")].filter(Boolean).join(", ") + ")";
        lines.push(l);
        if (e.bullets) lines.push(e.bullets);
        lines.push("");
      });
    } else if (bullets) {
      lines.push("EXPERIENCE", "", bullets, "");
    }

    if (proj.length) {
      lines.push("PROJECTS", "");
      proj.forEach(function (p) {
        lines.push((p.name || "") + (p.tech ? " [" + p.tech + "]" : ""));
        if (p.desc) lines.push(p.desc);
        if (p.bullets) lines.push(p.bullets);
        lines.push("");
      });
    }

    if (edu.length) {
      lines.push("EDUCATION", "");
      edu.forEach(function (e) {
        lines.push((e.school || "") + (e.degree ? " — " + e.degree : "") + (e.field ? " (" + e.field + ")" : "") + (e.gpa ? " GPA: " + e.gpa : ""));
      });
      lines.push("");
    }

    if (certs.length) {
      lines.push("CERTIFICATIONS", "");
      certs.forEach(function (c) {
        lines.push((c.name || "") + (c.issuer ? " — " + c.issuer : ""));
      });
      lines.push("");
    }

    if (ach.length) {
      lines.push("ACHIEVEMENTS", "");
      ach.forEach(function (a) {
        lines.push((a.title || "") + (a.desc ? ": " + a.desc : ""));
      });
    }

    return lines.filter(function (l) { return l !== undefined; }).join("\n");
  }

  function buildResumeMarkdown(rd) {
    var headline = rd.headline || "Senior Software Engineer";
    var summary = rd.summary || "";
    var skills = rd.skills || "";
    var bullets = rd.bullets || "";
    var exp = rd.experience || [];
    var proj = rd.projects || [];
    var edu = rd.education || [];
    var certs = rd.certifications || [];
    var ach = rd.achievements || [];
    var md = "# " + headline + "\n\n";
    if (summary) md += summary + "\n\n";
    if (skills) md += "## Technical Skills\n" + skills.split(",").map(function (s) { return "- " + s.trim(); }).join("\n") + "\n\n";

    if (exp.length) {
      md += "## Experience\n\n";
      exp.forEach(function (e) {
        md += "### " + (e.role || "Engineer") + (e.company ? " at " + e.company : "") + "\n\n";
        if (e.location || e.start) md += "*" + [e.location, e.start + (e.end ? " – " + e.end : "")].filter(Boolean).join(" · ") + "*\n\n";
        if (e.bullets) md += e.bullets.split("\n").filter(function (l) { return l.trim(); }).map(function (l) { return "- " + l.trim(); }).join("\n") + "\n\n";
      });
    } else if (bullets) {
      md += "## Experience\n\n" + bullets.split("\n").filter(function (l) { return l.trim(); }).map(function (l) { return "- " + l.trim(); }).join("\n") + "\n\n";
    }

    if (proj.length) {
      md += "## Projects\n\n";
      proj.forEach(function (p) {
        md += "### " + (p.name || "Project") + (p.tech ? " — " + p.tech : "") + "\n\n";
        if (p.desc) md += p.desc + "\n\n";
        if (p.bullets) md += p.bullets.split("\n").filter(function (l) { return l.trim(); }).map(function (l) { return "- " + l.trim(); }).join("\n") + "\n\n";
        if (p.url) md += "[🔗 Live](" + p.url + ")\n\n";
      });
    }

    if (edu.length) {
      md += "## Education\n\n";
      edu.forEach(function (e) {
        md += "- **" + (e.school || "School") + "** — " + (e.degree || "Degree") + (e.field ? " in " + e.field : "") + (e.gpa ? " (GPA: " + e.gpa + ")" : "") + "\n";
      });
      md += "\n";
    }

    if (certs.length) {
      md += "## Certifications\n\n";
      certs.forEach(function (c) {
        md += "- " + (c.name || "Certification") + (c.issuer ? " — " + c.issuer : "") + (c.year ? " (" + c.year + ")" : "") + "\n";
      });
      md += "\n";
    }

    if (ach.length) {
      md += "## Achievements\n\n";
      ach.forEach(function (a) {
        md += "- **" + (a.title || "") + "**" + (a.desc ? ": " + a.desc : "") + "\n";
      });
    }

    return md;
  }

  function downloadText(text, filename) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getTemplatePrompt(id) {
    var prompts = {
      ats: 'Design an ultra-clean ATS-friendly resume template.\n\nRequirements:\n- Single-column layout\n- Black and white only\n- No icons\n- No graphics\n- Strong typography hierarchy\n- ATS optimized\n- Recruiter friendly\n- Modern spacing\n- Elegant font pairing\n\nSections: Header, Summary, Skills, Experience, Projects, Education, Certifications\n\nStyle: Minimal, Professional, Clean, Corporate\n\nUse with: Claude, ChatGPT, Lovable, Bolt.new, or Cursor',
      faang: 'Create a FAANG-level software engineer resume template.\n\nDesign:\n- ATS optimized\n- Professional engineering layout\n- Achievement-driven formatting\n- Strong technical skills section\n- Dense but readable\n\nBullet Format: "Accomplished X by implementing Y resulting in Z"\n\nInclude:\n- LeetCode/GitHub/Portfolio links\n- System design projects\n- AI/ML section\n- Full-stack projects\n\nUse with: Claude, ChatGPT, Lovable, Bolt.new, or Cursor',
      modern: 'Build a modern developer resume template.\n\nFeatures:\n- Modern sidebar layout\n- Tech stack chips\n- GitHub stats integration\n- Portfolio links\n- Elegant typography\n- Navy blue + gold theme\n- Dark/light mode\n\nSections: About, Tech Stack, Projects, Experience, Education, Achievements, Hackathons, Social Links\n\nStyle: Modern, Premium, Startup-ready, Developer-focused\n\nUse with: Claude, ChatGPT, Lovable, Bolt.new, or Cursor',
      startup: 'Create an executive professional resume template.\n\nDesign:\n- Premium corporate design\n- Strong leadership section\n- Professional summary\n- Multi-level experience formatting\n- Board-ready layout\n\nSections: Header, Executive Summary, Leadership Experience, Board Positions, Education, Publications\n\nStyle: Premium, Corporate, Executive, Board-ready\n\nUse with: Claude, ChatGPT, Lovable, Bolt.new, or Cursor',
      minimal: 'Create a creative ATS-compatible resume template.\n\nDesign:\n- Stylish but ATS-safe\n- Balanced color accents\n- Section dividers\n- Modern visual hierarchy\n- Personality without breaking parsers\n\nSections: Header, About, Skills, Experience, Projects, Education\n\nStyle: Creative, Modern, Colorful but Professional\n\nUse with: Claude, ChatGPT, Lovable, Bolt.new, or Cursor',
    };
    return prompts[id] || prompts.ats;
  }

  function getStrategyContent(id) {
    if (id === "startup") {
      return '<h3>🚀 Startup Job Strategy</h3><p>Startups hire differently than enterprises. Here\'s how to break in and thrive.</p>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Where to find startup jobs</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>YC Startup Jobs</strong> — Work at a Y Combinator company. Filter by stack, stage, and location.</li>' +
        '<li><strong>AngelList / Wellfound</strong> — Direct apply with profile. Recruiters search by skills and availability.</li>' +
        '<li><strong>LinkedIn (startup filter)</strong> — Use "company size: 1-50" or "11-200" filters. Search for early-stage roles.</li>' +
        '<li><strong>Twitter/X</strong> — Follow founders, CTOs, and eng leaders. Engage genuinely. Many roles are posted before job boards.</li>' +
        '<li><strong>Hacker News "Who is hiring?"</strong> — Monthly thread. Many startups post directly. Reply with your GitHub + LinkedIn.</li>' +
        '<li><strong>Discord communities</strong> — Tech, framework, and startup servers often have #jobs channels.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">How to stand out</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Ship fast, show proof.</strong> Deploy a real project and link it. Startups value momentum over credentials.</li>' +
        '<li><strong>Write about your process.</strong> Blog posts, Twitter threads, and GitHub READMEs show communication skills.</li>' +
        '<li><strong>Cold outreach that works.</strong> Find founder/CTO email. Send <em>specific</em> value: "I noticed your pricing page could improve X. Here\'s how I\'d approach it."</li>' +
        '<li><strong>Be a T-shaped engineer.</strong> Deep in one area (e.g., React) + broad ability across the stack.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Compensation strategy</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Salary vs equity tradeoff.</strong> Early stage = more equity risk, more upside. Series A+ = more salary stability.</li>' +
        '<li><strong>Negotiate with data.</strong> Use Levels.fyi, Blind, and Glassdoor. Know the range before talking numbers.</li>' +
        '<li><strong>Ask about equity structure.</strong> Number of shares, vesting schedule (4yr/1yr cliff), and what liquidation preferences mean.</li>' +
        '</ul>';
    }
    if (id === "freelance") {
      return '<h3>💼 Freelancing System</h3><p>Build a sustainable freelancing practice with these proven strategies.</p>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Finding your first clients</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Upwork</strong> — Start with smaller projects to build JSS (Job Success Score). Target fixed-price contracts first.</li>' +
        '<li><strong>Contra</strong> — Portfolio-first platform. Create a polished profile with case studies.</li>' +
        '<li><strong>LinkedIn services</strong> — Use the "Services" section on your profile. Post weekly about what you do.</li>' +
        '<li><strong>Cold emailing</strong> — Identify SaaS companies with broken or missing features. Offer a specific fix.</li>' +
        '<li><strong>Referral system</strong> — After each project, ask for 1-2 referrals. Offer a discount for referrals.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Pricing strategy</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Value-based pricing</strong> — "Build a dashboard that saves 10hrs/week → worth $2k/month, not $50/hour."</li>' +
        '<li><strong>Project vs hourly</strong> — Always prefer project-based. Align scope, milestones, and payment terms.</li>' +
        '<li><strong>Retainers</strong> — Target $2k-5k/month retainer for ongoing maintenance, updates, and monitoring.</li>' +
        '<li><strong>Raise rates yearly.</strong> Add 15-25% each year. Replace low-paying clients with better ones.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Scaling into an agency</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Package your services.</strong> "Website audit + fix" for $2k. "Monthly dev retainer" for $4k.</li>' +
        '<li><strong>Hire sub-contractors.</strong> When you have more work than time, bring in vetted developers.</li>' +
        '<li><strong>Build SOPs.</strong> Document everything: onboarding, communication, deployment, handoff.</li>' +
        '</ul>';
    }
    if (id === "remote") {
      return '<h3>🌍 Remote Job System</h3><p>Remote-first hiring requires a different approach to stand out.</p>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Best remote job boards</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Arc.dev</strong> — Remote dev roles with salary transparency. Strong matching algorithm.</li>' +
        '<li><strong>Remote.ok</strong> — Curated remote jobs across stacks. Filter by timezone and region.</li>' +
        '<li><strong>We Work Remotely</strong> — Largest remote job board. Categories for dev, ops, and design.</li>' +
        '<li><strong>LinkedIn Remote filter</strong> — Use "Remote" location filter + "On-site/Remote" toggle.</li>' +
        '<li><strong>Himalayas</strong> — Growing remote job board with salary ranges and company reviews.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">How to win remote applications</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Async communication examples.</strong> Show you can document and communicate in writing.</li>' +
        '<li><strong>Timezone strategy.</strong> At least 4h overlap with core team. Mention your timezone explicitly.</li>' +
        '<li><strong>Strong portfolio.</strong> Remote teams rely heavily on portfolios. Deploy real projects.</li>' +
        '<li><strong>Written interview prep.</strong> Many remote processes include take-home assignments. Practice time-boxed delivery.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Recruiter outreach template</h4>' +
        '<p style="font-size:.82rem;color:var(--muted);background:var(--code-bg);padding:.85rem;border-radius:10px;margin:.5rem 0;border:1px solid var(--code-border)">Hi [Name],<br><br>I came across [Company] and was impressed by [specific detail]. I have [X years] of experience with [Your Stack], including [specific achievement].<br><br>I\'m looking for a remote role with [timezone] overlap. Would you be open to a brief chat?<br><br>Portfolio: [link] · GitHub: [link]</p>';
    }
    if (id === "networking") {
      return '<h3>🤝 Networking & Personal Branding</h3><p>Building authority online is the single highest-ROI investment for your career.</p>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Twitter/X growth strategy</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Post daily.</strong> Share what you\'re learning, building, or debugging. Consistency > virality.</li>' +
        '<li><strong>Thread your learnings.</strong> "How I built X in Y days" threads consistently perform well.</li>' +
        '<li><strong>Engage with creators.</strong> Reply thoughtfully to developers you admire. Add value, don\'t self-promote.</li>' +
        '<li><strong>Share your work.</strong> Screenshots, demos, and architecture diagrams get attention.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">LinkedIn optimization</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Headline matters most.</strong> "Senior Full Stack Engineer | React, Node, AWS" beats "Software Engineer at X".</li>' +
        '<li><strong>Featured section.</strong> Pin your best projects, articles, and portfolio.</li>' +
        '<li><strong>Post weekly.</strong> Share insights, project updates, or industry commentary.</li>' +
        '<li><strong>Skills & endorsements.</strong> Keep your top 10 skills current. Recruiters search by skills.</li>' +
        '</ul>' +
        '<h4 style="color:var(--gold);margin:.85rem 0 .35rem">Technical writing</h4>' +
        '<ul class="strategy-list">' +
        '<li><strong>Start a blog.</strong> dev.to, Hashnode, or your own site. Write about problems you solved.</li>' +
        '<li><strong>Open source contributions.</strong> Fix docs, add tests, then tackle issues. Builds visibility naturally.</li>' +
        '<li><strong>Speak at meetups.</strong> Virtual or local. Start with a lightning talk (5-10 min).</li>' +
        '</ul>';
    }
    return "";
  }

  function generateCertPreview() {
    var name = document.getElementById("cert-recipient-input").value.trim() || "Dedicated Learner";
    localStorage.setItem("tm-cert-name", name);
    var html = '<div class="cert-card"><div class="cert-seal">🎓</div><div class="cert-title">Certificate of Progress</div><div class="cert-subtitle">TechMaster Roadmap</div><div class="cert-recipient">' + esc(name) + '</div><div class="cert-desc">This certifies sustained completion across TechMaster Roadmap modules, demonstrating dedication to professional growth in modern software engineering.</div><div class="cert-footer"><span>📅 ' + new Date().toLocaleDateString() + '</span><span>🏆 Level ' + (xpLevel(state.xp || 0).level) + '</span><span>⭐ ' + (state.xp || 0) + ' XP</span></div></div>';
    document.getElementById("cert-preview-area").innerHTML = html;
    toast("Certificate generated!");
  }

  function initProjectFilters() {
    var c = document.getElementById("proj-cat");
    c.innerHTML =
      '<option value="all">All categories</option><option value="frontend">Frontend</option><option value="backend">Backend</option><option value="devops">DevOps</option><option value="security">Security</option><option value="data-ai">Data &amp; AI</option>';
    var tr = document.getElementById("proj-tier");
    tr.innerHTML =
      '<option value="all">All tiers</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="production-grade">Production-grade</option>';
    c.addEventListener("change", renderProjects);
    tr.addEventListener("change", renderProjects);
    document.getElementById("proj-search").addEventListener("input", debounce(renderProjects, 160));
    document.getElementById("proj-fav-only").addEventListener("click", function () {
      document.getElementById("proj-fav-only").classList.toggle("active");
      renderProjects();
    });
  }

  function globalSearch(q) {
    q = q.toLowerCase().trim();
    var res = [];
    window.TMDocs.DOC_INDEX.forEach(function (d) {
      if (!q || d.title.toLowerCase().indexOf(q) >= 0) res.push({ type: "Documentation", title: d.title, action: function () {
        currentDocId = d.id;
        showPage("documentation");
        document.getElementById("glob-overlay").classList.remove("open");
      } });
    });
    window.TMProjects.all.slice(0, 80).forEach(function (p) {
      if (!q || p.title.toLowerCase().indexOf(q) >= 0) res.push({ type: "Project", title: p.title, action: function () {
        showPage("projects");
        document.getElementById("glob-overlay").classList.remove("open");
        openProjectModal(p.id);
      } });
    });
    bank.slice(0, 120).forEach(function (it) {
      if (!q || it.question.toLowerCase().indexOf(q) >= 0) res.push({ type: "Interview", title: it.question.slice(0, 72) + "…", action: function () {
        showPage("interview");
        document.getElementById("glob-overlay").classList.remove("open");
        document.getElementById("int-search").value = it.question.slice(0, 40);
        renderInterviews();
      } });
    });
    document.getElementById("glob-results").innerHTML = res
      .slice(0, 24)
      .map(function (r, i) {
        return (
          '<div class="glob-result" data-gr="' +
          i +
          '"><strong>' +
          esc(r.type) +
          "</strong><div>" +
          esc(r.title) +
          "</div><small>Open</small></div>"
        );
      })
      .join("");
    res.slice(0, 24).forEach(function (r, i) {
      var node = document.querySelector('[data-gr="' + i + '"]');
      if (node) node.addEventListener("click", r.action);
    });
  }

  function initGlobalSearch() {
    var ov = document.getElementById("glob-overlay");
    document.getElementById("btn-global-search").addEventListener("click", function () {
      ov.classList.add("open");
      ov.setAttribute("aria-hidden", "false");
      document.getElementById("glob-search").focus();
    });
    ov.addEventListener("click", function (e) {
      if (e.target === ov) { ov.classList.remove("open"); ov.setAttribute("aria-hidden", "true"); }
    });
    document.getElementById("glob-search").addEventListener("input", function () {
      globalSearch(document.getElementById("glob-search").value);
    });
  }

  function initDocsShell() {
    var btn = document.getElementById("docs-sidebar-toggle");
    var shell = document.getElementById("doc-shell");
    if (!btn || !shell) return;
    btn.addEventListener("click", function () {
      shell.classList.toggle("doc-shell--open");
      var open = shell.classList.contains("doc-shell--open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.getElementById("docs-sidebar").addEventListener("click", function (e) {
      if (e.target.closest(".doc-nav-link")) {
        shell.classList.remove("doc-shell--open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initThemes() {
    if (window.TMTheme) window.TMTheme.init();
  }

  function initScrollUi() {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var p = Math.min(1, window.scrollY / (document.body.scrollHeight - window.innerHeight));
          var bar = document.getElementById("scroll-progress");
          bar.style.width = p * 100 + "%";
          bar.setAttribute("aria-valuenow", Math.round(p * 100));
          ticking = false;
        });
        ticking = true;
      }
    });
    document.getElementById("fab-top").addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.getElementById("fab-quick").addEventListener("click", function () {
      toast("Shortcuts: Ctrl+K search · / focus docs · Esc close overlays");
    });
  }

  function initHotkeys() {
    window.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("glob-overlay").classList.add("open");
        document.getElementById("glob-overlay").setAttribute("aria-hidden", "false");
        document.getElementById("glob-search").focus();
      }
      if (e.key === "Escape") {
        closeModal("glob-overlay");
        closeModal("modal-project");
      }
    });
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove("open");
    document.getElementById(id).setAttribute("aria-hidden", "true");
    if (id === "modal-project" && lastFocus) {
      lastFocus.focus();
      lastFocus = null;
    }
  }

  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      closeModal(btn.getAttribute("data-close-modal"));
    });
  });

  // Focus trap for project modal
  document.getElementById("modal-project").addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !this.classList.contains("open")) return;
    var focusable = this.querySelectorAll('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function initStatsHome() {
    document.getElementById("stat-docs").textContent = window.TMDocs.DOC_INDEX.length + "+";
    document.getElementById("stat-projects").textContent = window.TMProjects.all.length + "+";
  }

  // ===== ANIMATION SYSTEM =====
  function initAnimations() {
    // Scroll reveal using IntersectionObserver
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
      document.querySelectorAll(".reveal").forEach(function (el) { obs.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("visible"); });
    }

    // Button ripple effect
    document.addEventListener("mousedown", function (e) {
      var btn = e.target.closest(".btn-primary, .btn-outline, .btn-ghost");
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var r = document.createElement("span");
      r.className = "btn-ripple";
      var size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + "px";
      r.style.left = (e.clientX - rect.left - size / 2) + "px";
      r.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(r);
      setTimeout(function () { r.remove(); }, 600);
    });
  }

  function initParticles() {
    var wrap = document.getElementById("page-home") || document.body;
    var count = 12;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "particle";
      p.style.cssText = "position:fixed;width:" + (2 + Math.random() * 3) + "px;height:" + (2 + Math.random() * 3) + "px;background:rgba(212,175,55," + (0.15 + Math.random() * 0.2) + ");border-radius:50%;pointer-events:none;left:" + (Math.random() * 100) + "vw;animation:floatParticle " + (12 + Math.random() * 20) + "s linear infinite;animation-delay:" + (Math.random() * 15) + "s;z-index:0;";
      wrap.appendChild(p);
    }
  }

  function initCustomSelect(sel) {
    if (!sel || sel.parentNode.classList.contains("custom-select")) return;
    var wrapper = document.createElement("div");
    wrapper.className = "custom-select";
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    var valSpan = document.createElement("span");
    valSpan.className = "sel-val";
    var arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("viewBox", "0 0 24 24");
    arrow.setAttribute("width", "14");
    arrow.setAttribute("height", "14");
    arrow.className = "select-arrow";
    arrow.innerHTML = '<polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2"/>';
    var menu = document.createElement("div");
    menu.className = "select-menu";
    menu.setAttribute("role", "listbox");
    function buildCustomMenu() {
      menu.innerHTML = "";
      Array.prototype.forEach.call(sel.options, function (opt, idx) {
        var item = document.createElement("div");
        item.className = "select-option" + (opt.selected ? " selected" : "");
        item.textContent = opt.text;
        item.dataset.value = opt.value;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", opt.selected ? "true" : "false");
        item.id = "cs-opt-" + sel.id + "-" + idx;
        item.addEventListener("click", function () {
          sel.value = opt.value;
          updateCustomTrigger();
          closeCustomMenu();
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        });
        menu.appendChild(item);
      });
    }
    function updateCustomTrigger() {
      valSpan.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : "";
      var items = menu.querySelectorAll(".select-option");
      for (var i = 0; i < items.length; i++) {
        var match = items[i].dataset.value === sel.value;
        items[i].classList.toggle("selected", match);
        items[i].setAttribute("aria-selected", match ? "true" : "false");
      }
    }
    function openCustomMenu() {
      document.querySelectorAll(".select-menu.open").forEach(function (m) {
        m.classList.remove("open");
        var t = m.previousElementSibling;
        if (t && t.classList) t.classList.remove("open");
      });
      menu.classList.add("open");
      trigger.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }
    function closeCustomMenu() {
      menu.classList.remove("open");
      trigger.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
    function selectNext(direction) {
      var items = menu.querySelectorAll(".select-option");
      var cur = menu.querySelector(".select-option.selected");
      var curIdx = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i] === cur) { curIdx = i; break; }
      }
      var next = curIdx + direction;
      if (next < 0) next = items.length - 1;
      if (next >= items.length) next = 0;
      items[next].click();
    }
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.classList.contains("open")) { closeCustomMenu(); } else { openCustomMenu(); }
    });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (!menu.classList.contains("open")) { openCustomMenu(); } else { selectNext(1); } }
      if (e.key === "ArrowUp") { e.preventDefault(); if (!menu.classList.contains("open")) { openCustomMenu(); } else { selectNext(-1); } }
      if (e.key === "Escape") { e.preventDefault(); closeCustomMenu(); trigger.focus(); }
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!menu.classList.contains("open")) { openCustomMenu(); } }
    });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); selectNext(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); selectNext(-1); }
      if (e.key === "Escape") { e.preventDefault(); closeCustomMenu(); trigger.focus(); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); var selOpt = menu.querySelector(".select-option.selected"); if (selOpt) selOpt.click(); }
    });
    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) closeCustomMenu();
    });
    valSpan.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : "";
    trigger.appendChild(valSpan);
    trigger.appendChild(arrow);
    buildCustomMenu();
    sel.classList.add("native-select");
    sel.setAttribute("tabindex", "-1");
    sel.parentNode.insertBefore(wrapper, sel);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    wrapper.appendChild(sel);
    sel.addEventListener("change", updateCustomTrigger);
  }

  function updatePageNav(id) {
    var label = document.getElementById("page-nav-label");
    if (!label) return;
    var pages = C.PAGES;
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].id === id) {
        label.textContent = (i + 1) + " / " + pages.length;
        break;
      }
    }
  }

  function initPageNav() {
    var pages = C.PAGES;
    document.getElementById("page-prev").addEventListener("click", function () {
      var cur = document.querySelector(".page.active");
      if (!cur) return;
      var curId = cur.id.replace("page-", "");
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].id === curId) {
          var prev = (i - 1 + pages.length) % pages.length;
          showPage(pages[prev].id);
          break;
        }
      }
    });
    document.getElementById("page-next").addEventListener("click", function () {
      var cur = document.querySelector(".page.active");
      if (!cur) return;
      var curId = cur.id.replace("page-", "");
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].id === curId) {
          var next = (i + 1) % pages.length;
          showPage(pages[next].id);
          break;
        }
      }
    });
  }

  function updateBackBtn() {
    var btn = document.getElementById("nav-back");
    if (btn) btn.classList.toggle("visible", pageHistory.length > 0);
  }

  function initBackButton() {
    document.getElementById("nav-back").addEventListener("click", function () {
      if (pageHistory.length < 1) return;
      var id = pageHistory.pop();
      showPage(id, true);
    });
  }

  function initCustomSelects() {
    ["docs-group-filter", "proj-cat", "proj-tier", "int-tech", "int-diff", "fb-type"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) initCustomSelect(el);
    });
  }

  buildInterviewBank();
  initNav();
  initRoadmap();
  initDocsShell();
  initDocsPage();
  initProjectFilters();
  initInterviewFilters();
  initPlannerNotes();
  initCareer();
  initGlobalSearch();
  initThemes();
  initScrollUi();
  initHotkeys();
  initAnimations();
  initParticles();
  initStatsHome();
  initPageNav();
  initBackButton();
  updatePageNav("home");
  globalSearch("");
  renderProjects();
  renderDashboard();
  initCustomSelects();

  // Feedback form — opens mailto with form data
  document.getElementById("feedback-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("fb-name").value.trim();
    var email = document.getElementById("fb-email").value.trim();
    var type = document.getElementById("fb-type").value;
    var message = document.getElementById("fb-message").value.trim();
    var body = "Feedback Type: " + type + "\nName: " + name + "\nEmail: " + email + "\n\nMessage:\n" + message;
    window.location.href = "mailto:ayushnegidet@gmail.com?subject=TechMaster Feedback - " + encodeURIComponent(type) + "&body=" + encodeURIComponent(body);
    document.getElementById("feedback-form").style.display = "none";
    document.getElementById("fb-success").classList.add("show");
  });

  // Observe cards for scroll reveal
  document.querySelectorAll(".card, .career-card, .proj-card, .strategy-card, .dash-stat, .hero-stat").forEach(function (el) {
    el.classList.add("reveal");
  });
  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    document.querySelectorAll(".reveal").forEach(function (el) { revealObs.observe(el); });
  }

  document.querySelectorAll(".card[data-nav]").forEach(function (c) {
    c.addEventListener("click", function () {
      var id = c.getAttribute("data-nav");
      if (id === "chest") {
        showChestSurprise();
      } else {
        showPage(id);
      }
    });
  });

  function showChestSurprise(){
    var overlay = document.getElementById("chestOverlay");
    var container = document.getElementById("chestSparkles");
    container.innerHTML = "";
    for(var i=0;i<40;i++){
      var p = document.createElement("div");
      p.className = "chest-particle";
      var angle = Math.random() * 360;
      var dist = 80 + Math.random() * 250;
      var rad = angle * Math.PI / 180;
      p.style.setProperty("--x", "0px");
      p.style.setProperty("--y", "0px");
      p.style.setProperty("--xe", Math.cos(rad)*dist + "px");
      p.style.setProperty("--ye", Math.sin(rad)*dist + "px");
      p.style.setProperty("--dur", (0.5 + Math.random() * 0.8) + "s");
      p.style.left = "50%";
      p.style.top = "50%";
      var colors = ["#D4AF37","#FFD700","#FFF8DC","#DAA520","#F0E68C","#FFDF00"];
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      p.style.width = (3+Math.random()*5)+"px";
      p.style.height = p.style.width;
      container.appendChild(p);
    }
    overlay.classList.add("active");
    setTimeout(function(){ overlay.classList.remove("active"); showPage("chest"); }, 1300);
  }

  // LifeQuest
  var lqCard = document.getElementById("lifequestCard");
  var lqOverlay = document.getElementById("lqOverlay");
  if(lqCard && lqOverlay){
    lqCard.addEventListener("click", function(){ lqOverlay.classList.add("active"); });
    document.getElementById("lqCancel").addEventListener("click", function(){ lqOverlay.classList.remove("active"); });
    document.getElementById("lqConfirm").addEventListener("click", function(){ lqOverlay.classList.remove("active"); window.open("https://life-quest-lac.vercel.app","_blank"); });
    lqOverlay.addEventListener("click", function(e){ if(e.target===lqOverlay) lqOverlay.classList.remove("active"); });
  }

})();
