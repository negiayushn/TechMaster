/**
 * TechMaster Roadmap v2 — navigation, documentation viewer, interviews,
 * projects, dashboard analytics, global search, themes, and persistence.
 */
(function () {
  var C = window.TM_CONFIG;
  var SK = C.STORAGE_KEYS;

  // Supabase config
  var SUPABASE_EDGE_URL = "https://rscslbxdhhkkjltpenxn.supabase.co/functions/v1/get-data";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzY3NsYnhkaGhra2psdHBlbnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTMwOTYsImV4cCI6MjA5NDQyOTA5Nn0.cBSdIp88Dn9A3636Zq56IfC_KG9VMdK5Ggj8P966BQs";
  var SUPABASE_URL = "https://rscslbxdhhkkjltpenxn.supabase.co";

  // Auth state
  var supabaseClient = null;
  var currentUser = null;

  function initAuth() {
    try {
      if (typeof supabase !== "undefined") {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
    } catch(e) {}
    var saved = localStorage.getItem("tm-auth-user");
    if (saved) { try { currentUser = JSON.parse(saved); } catch(e) {} }
    updateAuthUI();
    if (currentUser) {
      syncFromSupabase();
    }
    // Auto-sync every 30s when user is signed in
    setInterval(function() {
      if (currentUser) syncToSupabase();
    }, 30000);
  }

  function updateAuthUI() {
    var btn = document.getElementById("btn-login");
    if (!btn) return;
    if (currentUser) {
      btn.innerHTML = currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U";
      btn.style.width = "32px";
      btn.style.height = "32px";
      btn.style.borderRadius = "50%";
      btn.style.background = "linear-gradient(135deg,var(--gold),#daa520)";
      btn.style.color = "#020617";
      btn.style.fontWeight = "700";
      btn.style.fontSize = ".8rem";
      btn.title = currentUser.email || "Signed in";
      btn.onclick = function() { openProfilePanel(); };
    } else {
      btn.innerHTML = "👤";
      btn.style.width = "";
      btn.style.height = "";
      btn.style.borderRadius = "";
      btn.style.background = "";
      btn.style.color = "";
      btn.style.fontWeight = "";
      btn.style.fontSize = "";
      btn.title = "Sign in";
      btn.onclick = function() {
        var overlay = document.getElementById('auth-overlay');
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
      };
    }
  }

  function openProfilePanel() {
    var panel = document.getElementById("profile-panel");
    if (!panel) return;
    document.getElementById("profile-email").textContent = currentUser ? currentUser.email : "";
    document.getElementById("profile-avatar").textContent = currentUser && currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "U";

    // Load saved avatar
    var savedAvatar = localStorage.getItem("tm-profile-avatar");
    if (savedAvatar) document.getElementById("profile-avatar").innerHTML = '<img src="' + savedAvatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />';

    // Joined date
    var joinedEl = document.getElementById("profile-joined");
    if (currentUser && currentUser.id) {
      var key = "tm-user-created-" + currentUser.id;
      var savedDate = localStorage.getItem(key);
      if (savedDate) joinedEl.textContent = savedDate;
      else { joinedEl.textContent = "Today"; localStorage.setItem(key, new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})); }
    }

    // Study time
    var totalMinutes = 0, dayCount = 0;
    if (state && state.studyLog) {
      Object.keys(state.studyLog).forEach(function(k) {
        var m = parseInt(state.studyLog[k]) || 0;
        if (m > 0) { totalMinutes += m; dayCount++; }
      });
    }
    var hours = Math.floor(totalMinutes / 60);
    var mins = totalMinutes % 60;
    document.getElementById("profile-studytime").textContent = hours > 0 ? hours + "h " + mins + "m" : mins + "m";
    document.getElementById("profile-dailyavg").textContent = dayCount > 0 ? Math.round(totalMinutes / dayCount) + " min/day" : "-";

    panel.classList.add("open");
  }

  // Avatar upload handler
  document.addEventListener("change", function(e) {
    if (e.target.id === "profile-avatar-input" && e.target.files && e.target.files[0]) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        var dataUrl = ev.target.result;
        localStorage.setItem("tm-profile-avatar", dataUrl);
        document.getElementById("profile-avatar").innerHTML = '<img src="' + dataUrl + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />';
        toast("Profile photo updated!");
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  function handleAuth() {
    var form = document.getElementById("auth-form");
    var overlay = document.getElementById("auth-overlay");
    var error = document.getElementById("auth-error");
    var submit = document.getElementById("auth-submit");
    var switchBtn = document.getElementById("auth-switch");
    var title = document.getElementById("auth-title");
    var sub = document.getElementById("auth-sub");
    var mobileField = document.getElementById("auth-mobile-field");
    var forgotBtn = document.getElementById("auth-forgot");
    var isSignUp = false;

    if (!form) return;

    // Profile panel events
    var ppClose = document.getElementById("profile-panel-close");
    if (ppClose) ppClose.addEventListener("click", function() { document.getElementById("profile-panel").classList.remove("open"); });
    var ppBg = document.getElementById("profile-panel-bg");
    if (ppBg) ppBg.addEventListener("click", function() { document.getElementById("profile-panel").classList.remove("open"); });
    var ppSignout = document.getElementById("profile-signout");
    if (ppSignout) ppSignout.addEventListener("click", function() {
      currentUser = null;
      localStorage.removeItem("tm-auth-user");
      updateAuthUI();
      document.getElementById("profile-panel").classList.remove("open");
      toast("Signed out");
      if (typeof renderDashboard === "function") renderDashboard();
    });

    switchBtn.addEventListener("click", function() {
      isSignUp = !isSignUp;
      title.textContent = isSignUp ? "Create Account" : "Welcome to TechMaster";
      sub.textContent = isSignUp ? "Sign up to save your progress" : "Sign in to save your progress";
      submit.textContent = isSignUp ? "Sign Up" : "Sign In";
      switchBtn.textContent = isSignUp ? "Sign in" : "Sign up";
      error.textContent = "";
      if (mobileField) mobileField.style.display = isSignUp ? "block" : "none";
    });

    // Forgot password
    forgotBtn.addEventListener("click", async function() {
      var email = document.getElementById("auth-email").value.trim();
      if (!email) { error.textContent = "Enter your email first"; return; }
      if (!supabaseClient) { error.textContent = "Auth not available"; return; }
      forgotBtn.disabled = true;
      forgotBtn.textContent = "Sending...";
      var { error: err } = await supabaseClient.auth.resetPasswordForEmail(email);
      if (err) { error.textContent = err.message; } else { error.textContent = ""; toast("Password reset email sent!"); }
      forgotBtn.disabled = false;
      forgotBtn.textContent = "Forgot password?";
    });

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      var email = document.getElementById("auth-email").value.trim();
      var password = document.getElementById("auth-password").value.trim();
      var mobile = document.getElementById("auth-mobile") ? document.getElementById("auth-mobile").value.trim() : "";
      if (!email || !password) { error.textContent = "Fill in all fields"; return; }
      submit.disabled = true;
      submit.textContent = "Please wait...";
      error.textContent = "";

      try {
        if (!supabaseClient) { error.textContent = "Auth not available"; submit.disabled = false; submit.textContent = isSignUp ? "Sign Up" : "Sign In"; return; }
        var result;
        if (isSignUp) {
          result = await supabaseClient.auth.signUp({ email: email, password: password, options: { data: { mobile: mobile } } });
          if (result.data && result.data.user && !result.error) {
            currentUser = { id: result.data.user.id, email: result.data.user.email };
            localStorage.setItem("tm-auth-user", JSON.stringify(currentUser));
            updateAuthUI();
            overlay.classList.remove("open");
            var syncResult = await syncFromSupabase();
            toast(syncResult === "restored" ? "Progress restored from cloud!" : "Account created! Check email for confirmation.");
          } else {
            error.textContent = result.error ? result.error.message : "Sign up failed";
          }
        } else {
          result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
          if (result.data && result.data.user && !result.error) {
            currentUser = { id: result.data.user.id, email: result.data.user.email };
            localStorage.setItem("tm-auth-user", JSON.stringify(currentUser));
            updateAuthUI();
            overlay.classList.remove("open");
            var syncResult = await syncFromSupabase();
            toast(syncResult === "restored" ? "Progress restored from cloud!" : "Signed in successfully!");
            if (typeof renderDashboard === "function") renderDashboard();
          } else {
            error.textContent = result.error ? result.error.message : "Invalid credentials";
          }
        }
      } catch(e) { error.textContent = "Connection error"; }
      submit.disabled = false;
      submit.textContent = isSignUp ? "Sign Up" : "Sign In";
    });

    document.getElementById("auth-close").addEventListener("click", function() {
      var overlay = document.getElementById("auth-overlay");
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    });
    overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.classList.remove("open"); });

    // Password visibility toggle
    var pwToggle = document.getElementById("auth-toggle-pw");
    var pwInput = document.getElementById("auth-password");
    if (pwToggle && pwInput) {
      pwToggle.addEventListener("click", function() {
        if (pwInput.type === "password") {
          pwInput.type = "text";
          pwToggle.textContent = "👁️";
        } else {
          pwInput.type = "password";
          pwToggle.textContent = "🙈";
        }
      });
    }
  }

  // Sync functions for Supabase
  function getAllUserData() {
    return { state: state, interviewExtra: interviewExtra, favProjects: favProjects, projOverrides: projOverrides, roadmapProg: roadmapProg, avatar: localStorage.getItem("tm-profile-avatar") || "" };
  }

  function restoreAllUserData(data) {
    if (data.state) { Object.assign(state, data.state); saveJSON(SK.progress, state); }
    if (data.interviewExtra) { Object.assign(interviewExtra, data.interviewExtra); saveJSON(SK.interview, interviewExtra); }
    if (data.favProjects) { favProjects = data.favProjects; saveJSON(SK.favoritesProjects, favProjects); }
    if (data.projOverrides) { projOverrides = data.projOverrides; saveJSON(SK.projectOverrides, projOverrides); }
    if (data.roadmapProg) { roadmapProg = data.roadmapProg; saveJSON(SK.roadmapTopics, roadmapProg); }
    if (data.avatar) { localStorage.setItem("tm-profile-avatar", data.avatar); }
  }

  async function syncToSupabase() {
    if (!currentUser || !supabaseClient) return;
    try {
      var data = getAllUserData();
      var { error } = await supabaseClient.from("user_data").upsert(
        { id: currentUser.id, data: data, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
      if (error) console.warn("Sync error:", error.message);
    } catch(e) {}
  }

  async function syncFromSupabase() {
    if (!currentUser || !supabaseClient) return "no_user";
    try {
      var { data: row, error } = await supabaseClient.from("user_data").select("data").eq("id", currentUser.id).single();
      if (error) return "no_data";
      if (row && row.data) {
        restoreAllUserData(row.data);
        return "restored";
      }
    } catch(e) {}
    return "error";
  }

  function getTopicEmoji(topicId) {
    var emojis = { html: "📄", css: "🎨", javascript: "⚡", react: "⚛️", nextjs: "▲", nodejs: "🟢", express: "🚀", mongodb: "🍃", sql: "🗃️", docker: "🐳", kubernetes: "☸️", aws: "☁️", security: "🔒", python: "🐍", ml: "🤖", dataai: "📊" };
    return emojis[topicId] || "📚";
  }

  async function loadInterviewTopics() {
    var topics = []; bank.forEach(function(item) { var tid = item.technology; if (!topics.find(function(t) { return t.id === tid; })) topics.push({ id: tid, name: item.technologyLabel || tid }); });
    return topics;
  }

  async function loadInterviewQuestions(topicId) {
    return bank.filter(function(b) { return b.technology === topicId; });
  }

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
    syncToSupabase();
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

  var interviewTopicsLoaded = false;
  var currentInterviewTopic = null;
  var currentTopicId = null;
  var currentTopicName = null;

  window.showInterviewTopics = function() {
    currentInterviewTopic = null;
    currentTopicId = null;
    currentTopicName = null;
    interviewTopicsLoaded = false;
    renderInterviews();
  };

  async function showInterviewQuestions(topicId, topicName) {
    currentInterviewTopic = topicId;
    currentTopicId = topicId;
    currentTopicName = topicName;
    var container = document.getElementById("qa-list");
    
    var html = '<div style="margin-bottom:1rem">';
    html += '<button type="button" class="int-back-btn" style="background:none;border:1px solid var(--border);color:var(--text);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.9rem">← Back to Topics</button>';
    html += '<h2 style="margin:1rem 0;color:var(--gold)">' + esc(topicName) + ' - Questions</h2>';
    html += '</div>';
    html += '<div id="questions-list" class="questions-list"><p style="text-align:center;color:var(--muted);padding:2rem">Loading questions...</p></div>';
    container.innerHTML = html;
    
    var questions = await loadInterviewQuestions(topicId);
    if (!questions.length) {
      document.getElementById("questions-list").innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem">No questions found</p>';
      return;
    }
    
    var qHtml = '<div class="qa-cards">';
    questions.forEach(function(item) {
      var q = item.question || "", a = item.answer || "", done = interviewExtra.done[item.id], bm = interviewExtra.bookmarks[item.id];
      var strategy = item.strategy || "", example = item.example || "", mistakes = item.mistakes || [], followUps = item.followUps || [];
      var d = done ? "var(--emerald)" : "var(--muted)";
      var b = bm ? "var(--gold)" : "var(--muted)";
      qHtml += '<div class="card qa-card" data-qid="' + esc(item.id) + '">';
      qHtml += '<div class="qa-card-header" style="display:flex;justify-content:space-between;align-items:flex-start">';
      qHtml += '<h3 style="margin:0;font-size:1rem;flex:1;padding-right:8px">' + esc(q) + '</h3>';
      qHtml += '<div style="display:flex;gap:8px;flex-shrink:0">';
      qHtml += '<span class="int-bookmark" data-qid="' + esc(item.id) + '" style="font-size:1.2rem;cursor:pointer;color:' + b + '">' + (bm ? "★" : "☆") + '</span>';
      qHtml += '<span class="int-done" data-qid="' + esc(item.id) + '" style="font-size:1.2rem;cursor:pointer;color:' + d + '">' + (done ? "✓" : "○") + '</span>';
      qHtml += '<span style="color:var(--muted);font-size:.8rem">▼</span>';
      qHtml += '</div></div>';
      qHtml += '<div class="q-details" style="display:none;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">';
      qHtml += '<div style="margin-bottom:1rem"><h4 style="color:var(--gold);font-size:.85rem;margin-bottom:.5rem">Answer</h4><p style="color:var(--muted);font-size:.9rem;line-height:1.6">' + esc(a) + '</p></div>';
      if (strategy) qHtml += '<div style="margin-bottom:1rem"><h4 style="color:var(--emerald);font-size:.85rem;margin-bottom:.5rem">Strategy</h4><p style="color:var(--muted);font-size:.9rem;line-height:1.6">' + esc(strategy) + '</p></div>';
      if (example) qHtml += '<div style="margin-bottom:1rem"><h4 style="color:var(--cyan);font-size:.85rem;margin-bottom:.5rem">Example</h4><pre style="background:rgba(0,0,0,.3);padding:.75rem;border-radius:8px;overflow-x:auto;font-size:.8rem;color:var(--text)"><code>' + esc(example) + '</code></pre></div>';
      if (mistakes.length) qHtml += '<div><h4 style="color:#f87171;font-size:.85rem;margin-bottom:.5rem">Common mistakes</h4><ul style="color:var(--muted);font-size:.85rem;padding-left:1.25rem;line-height:1.6">' + mistakes.map(function(m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>';
      if (followUps.length) qHtml += '<div><h4 style="color:var(--violet);font-size:.85rem;margin-bottom:.5rem">Follow-up questions</h4><ul style="color:var(--muted);font-size:.85rem;padding-left:1.25rem;line-height:1.6">' + followUps.map(function(f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>';
      qHtml += '</div></div>';
    });
    qHtml += '</div>';
    document.getElementById("questions-list").innerHTML = qHtml;

    // Attach event listeners
    var qlist = document.getElementById("questions-list");
    qlist.querySelectorAll(".qa-card").forEach(function(card) {
      card.addEventListener("click", function(e) {
        if (e.target.closest(".int-bookmark") || e.target.closest(".int-done")) return;
        card.querySelector(".q-details").classList.toggle("open");
        card.querySelector(".q-details").style.display = card.querySelector(".q-details").style.display === "none" ? "block" : "none";
      });
    });
    qlist.querySelectorAll(".int-done").forEach(function(el) {
      el.addEventListener("click", function(e) {
        e.stopPropagation();
        var qid = el.getAttribute("data-qid");
        var now = !interviewExtra.done[qid];
        interviewExtra.done[qid] = now;
        if (now) state.xp = (state.xp || 0) + C.XP_PER_INTERVIEW;
        else state.xp = Math.max(0, (state.xp || 0) - C.XP_PER_INTERVIEW);
        checkAchievements();
        persist();
        showInterviewQuestions(currentTopicId, currentTopicName);
        renderDashboard();
      });
    });
    qlist.querySelectorAll(".int-bookmark").forEach(function(el) {
      el.addEventListener("click", function(e) {
        e.stopPropagation();
        var qid = el.getAttribute("data-qid");
        interviewExtra.bookmarks[qid] = !interviewExtra.bookmarks[qid];
        persist();
        showInterviewQuestions(currentTopicId, currentTopicName);
      });
    });
    document.querySelector(".int-back-btn").addEventListener("click", function() { showInterviewTopics(); });
  }

  async function renderInterviews() {
    var container = document.getElementById("qa-list");
    if (currentInterviewTopic) return;
    
    if (!interviewTopicsLoaded) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem">Loading topics...</p>';
      var topics = await loadInterviewTopics();
      if (!topics.length) { container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem">No topics available</p>'; return; }
      
      var html = "";
      topics.forEach(function(topic) {
        var topicQuestions = bank.filter(function(b) { return b.technology === topic.id; });
        var totalQ = topicQuestions.length;
        var doneQ = topicQuestions.filter(function(q) { return interviewExtra.done[q.id]; }).length;
        html += '<div class="card" data-topic="' + esc(topic.id) + '" data-name="' + esc(topic.name) + '">';
        html += '<div class="card-icon" style="background:rgba(212,175,55,.15)">' + getTopicEmoji(topic.id) + '</div>';
        html += '<h3>' + esc(topic.name) + '</h3>';
        html += '<div style="display:flex;gap:12px;margin-top:6px;font-size:.72rem">';
        html += '<span style="color:var(--muted)">📝 ' + totalQ + ' questions</span>';
        html += '<span style="color:' + (doneQ > 0 ? 'var(--emerald)' : 'var(--muted)') + '">✅ ' + doneQ + ' done</span>';
        html += '</div>';
        if (totalQ > 0) {
          var pct = Math.round((doneQ / totalQ) * 100);
          html += '<div style="margin-top:8px;height:4px;background:rgba(100,116,139,0.2);border-radius:4px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--gold),var(--emerald));border-radius:4px;transition:width .4s"></div></div>';
        }
        html += '<p style="margin-top:4px;font-size:.65rem;color:var(--muted)">Click to view questions</p>';
        html += '</div>';
      });
      container.innerHTML = '<div class="cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));gap:1.25rem">' + html + '</div>';
      interviewTopicsLoaded = true;
      
      document.querySelectorAll(".card[data-topic]").forEach(function(card) {
        card.addEventListener("click", function() {
          showInterviewQuestions(card.getAttribute("data-topic"), card.getAttribute("data-name"));
        });
      });
    }
  }

  function initInterviewFilters() {
    // Hide toolbar elements
    var toolbar = document.querySelector("#page-interview .toolbar");
    if (toolbar) toolbar.style.display = "none";
    var sectionSub = document.querySelector("#page-interview .section-sub");
    if (sectionSub) sectionSub.style.display = "none";
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
        var pending = 5;
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
          
          // Build contribution data (52 weeks)
          data.contributionData = [];
          var now = new Date();
          var weekMap = {};
          for (var w = 51; w >= 0; w--) {
            var d = new Date(now.getTime() - w * 7 * 86400000);
            var wd = d.toISOString().split("T")[0];
            weekMap[wd] = { date: wd, count: 0 };
          }
          (data.events || []).forEach(function(e) {
            var cd = e.created_at.split("T")[0];
            if (weekMap[cd]) weekMap[cd].count++;
          });
          Object.keys(weekMap).sort().forEach(function(k) { data.contributionData.push(weekMap[k]); });
          
          // Build weekly activity
          data.weeklyActivity = [];
          var weekActivityMap = {};
          (data.events || []).forEach(function(e) {
            var ed = new Date(e.created_at);
            var wn = "W" + Math.ceil((ed.getTime() - new Date(now.getTime() - 90 * 86400000).getTime()) / (7 * 86400000));
            if (!weekActivityMap[wn]) weekActivityMap[wn] = { week: wn, pushes: 0, prs: 0, creates: 0 };
            if (e.type === "PushEvent") weekActivityMap[wn].pushes++;
            else if (e.type === "PullRequestEvent") weekActivityMap[wn].prs++;
            else if (e.type === "CreateEvent") weekActivityMap[wn].creates++;
          });
          Object.keys(weekActivityMap).slice(-12).forEach(function(k) { data.weeklyActivity.push(weekActivityMap[k]); });
          
          done();
        };
        evtReq.onerror = function () { data.events = []; done(); };
        evtReq.send();
        
        // Fetch real contribution data for streaks from GitHub's public API
        var contribReq = new XMLHttpRequest();
        contribReq.open("GET", "https://github-contributions-api.jogruber.de/v4/" + encodeURIComponent(username));
        contribReq.onload = function() {
          try {
            var contribJson = JSON.parse(contribReq.responseText);
            if (contribJson && contribJson.length) {
              data.contributionData = contribJson.map(function(d) { return { date: d.date, count: d.count }; });
              // Calculate real streaks
              var activeDays = contribJson.filter(function(d) { return d.count > 0; });
              data.totalActiveDays = activeDays.length;
              var sortedDates = activeDays.map(function(d) { return d.date; }).sort();
              var currentStreak = 0, longestStreak = 0, tempStreak = 0, prevDate = null;
              var today = new Date().toISOString().split("T")[0];
              sortedDates.forEach(function(date, idx) {
                if (prevDate) {
                  var diff = (new Date(date) - new Date(prevDate)) / 86400000;
                  if (diff === 1) { tempStreak++; }
                  else { tempStreak = 1; }
                } else { tempStreak = 1; }
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                prevDate = date;
              });
              var hasToday = sortedDates.includes(today);
              var yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
              var hasYesterday = sortedDates.includes(yesterday);
              data.currentStreak = (hasToday || hasYesterday) ? tempStreak : 0;
              data.longestStreak = longestStreak;
              // Calculate weekly consistency
              var weekSet = {};
              contribJson.forEach(function(d) {
                if (d.count > 0) {
                  var wn = d.date.substring(0, 7);
                  weekSet[wn] = true;
                }
              });
              data.weeklyConsistency = Math.round((Object.keys(weekSet).length / 52) * 100);
            }
          } catch(e) {}
          done();
        };
        contribReq.onerror = function() { done(); };
        contribReq.send();
        
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

  // Role-based roadmap
  var ROLE_PROJ_MAP = {
    frontend: ["frontend"],
    backend: ["backend"],
    fullstack: ["fullstack"],
    devops: ["devops"],
    devsecops: ["devops","security"],
    dataanalyst: ["data-ai"],
    aiengineer: ["ai"],
    aidatascientist: ["ai","data-ai"],
    dataengineer: ["data-ai","backend"],
    android: ["frontend"],
    machinelearning: ["ai"],
    postgresql: ["backend","data-ai"],
    ios: ["frontend"],
    blockchain: ["blockchain"],
    qa: ["backend","devops"],
    softwarearchitect: ["fullstack","devops"],
    apidesign: ["backend"],
    cybersecurity: ["security"],
    uxdesign: ["frontend"],
    technicalwriter: ["frontend"],
    gamedev: ["frontend"],
    servergamedev: ["backend"],
    mlops: ["ai","devops"],
    productmanager: ["fullstack"],
    engineeringmanager: ["fullstack"],
    devrel: ["frontend"],
    bianalyst: ["data-ai"],
    airedteaming: ["ai","security"],
    networkengineer: ["devops"]
  };

  var ROLES = {
    frontend: { name: "Frontend Developer", icon: "🎨", desc: "Build beautiful, performant UIs with modern frameworks", color: "#3b82f6", topics: ["fe-html-css", "fe-js-ts", "fe-react", "fe-next-tailwind", "fe-tooling", "be-http", "do-docker", "sec-owasp"], salaryInr: "3-8 LPA", salaryUsd: "$50-110k" },
    backend: { name: "Backend Developer", icon: "⚙️", desc: "Design scalable APIs, databases, and server-side systems", color: "#10b981", topics: ["be-node", "be-http", "be-data", "be-realtime", "be-search", "do-docker", "do-cicd", "sec-owasp", "fe-js-ts"], salaryInr: "4-10 LPA", salaryUsd: "$60-130k" },
    fullstack: { name: "Full Stack Developer", icon: "🚀", desc: "Own the entire stack from UI to infrastructure", color: "var(--gold)", topics: ["fe-html-css", "fe-js-ts", "fe-react", "fe-next-tailwind", "be-node", "be-http", "be-data", "do-docker", "do-cicd", "ai-llm"], salaryInr: "4-12 LPA", salaryUsd: "$60-140k" },
    devops: { name: "DevOps Engineer", icon: "☸️", desc: "Build deployment pipelines, manage infra at scale", color: "#8b5cf6", topics: ["do-linux", "do-docker", "do-k8s", "do-aws", "do-cicd", "do-observe", "sec-owasp", "sec-ops", "be-http"], salaryInr: "5-14 LPA", salaryUsd: "$70-150k" },
    devsecops: { name: "DevSecOps Engineer", icon: "🔐", desc: "Embed security into CI/CD and infrastructure", color: "#ef4444", topics: ["do-linux", "do-docker", "do-k8s", "do-cicd", "do-observe", "sec-owasp", "sec-authz", "sec-ops", "be-realtime"], salaryInr: "6-16 LPA", salaryUsd: "$80-160k" },
    dataanalyst: { name: "Data Analyst", icon: "📊", desc: "Analyze data, build dashboards, derive insights", color: "#06b6d4", topics: ["ai-py", "ai-ml", "be-data", "fe-html-css", "fe-js-ts"], salaryInr: "3-7 LPA", salaryUsd: "$50-100k" },
    aiengineer: { name: "AI Engineer", icon: "🤖", desc: "Build and deploy AI-powered applications", color: "#f59e0b", topics: ["ai-py", "ai-ml", "ai-dl", "ai-llm", "ai-mlops", "be-http", "be-data", "do-docker"], salaryInr: "6-20 LPA", salaryUsd: "$80-180k" },
    aidatascientist: { name: "AI & Data Scientist", icon: "🧠", desc: "Research, model, and productionize ML solutions", color: "#8b5cf6", topics: ["ai-py", "ai-ml", "ai-dl", "ai-llm", "ai-mlops", "be-data", "do-observe"], salaryInr: "6-22 LPA", salaryUsd: "$80-200k" },
    dataengineer: { name: "Data Engineer", icon: "🗄️", desc: "Build data pipelines, warehouses, and ETL systems", color: "#3b82f6", topics: ["ai-py", "ai-ml", "be-data", "do-linux", "do-docker", "do-cicd", "do-observe"], salaryInr: "5-15 LPA", salaryUsd: "$70-150k" },
    android: { name: "Android Developer", icon: "📱", desc: "Build native Android apps with Kotlin/Jetpack", color: "#22c55e", topics: ["fe-js-ts", "fe-react", "be-http", "be-data", "be-realtime", "do-cicd"], salaryInr: "3-9 LPA", salaryUsd: "$50-120k" },
    machinelearning: { name: "Machine Learning Engineer", icon: "🧬", desc: "Design, train, and deploy ML models", color: "#f59e0b", topics: ["ai-py", "ai-ml", "ai-dl", "ai-llm", "ai-mlops", "be-http", "do-docker", "do-observe"], salaryInr: "6-18 LPA", salaryUsd: "$80-170k" },
    postgresql: { name: "PostgreSQL DBA", icon: "🐘", desc: "Manage, tune, and scale PostgreSQL databases", color: "#336791", topics: ["be-data", "be-search", "do-linux", "do-observe", "sec-owasp"], salaryInr: "4-12 LPA", salaryUsd: "$60-130k" },
    ios: { name: "iOS Developer", icon: "🍎", desc: "Build native iOS apps with Swift/SwiftUI", color: "#64748b", topics: ["fe-js-ts", "fe-react", "be-http", "be-data", "be-realtime", "fe-tooling"], salaryInr: "4-10 LPA", salaryUsd: "$60-130k" },
    blockchain: { name: "Blockchain Developer", icon: "⛓️", desc: "Build smart contracts and decentralized apps", color: "#f59e0b", topics: ["fe-js-ts", "fe-react", "be-node", "be-http", "be-data", "sec-owasp", "sec-authz"], salaryInr: "5-18 LPA", salaryUsd: "$70-160k" },
    qa: { name: "QA / Test Engineer", icon: "🧪", desc: "Ensure quality through automated testing", color: "#22c55e", topics: ["fe-tooling", "be-http", "do-cicd", "fe-js-ts", "be-node", "do-observe"], salaryInr: "3-7 LPA", salaryUsd: "$50-100k" },
    softwarearchitect: { name: "Software Architect", icon: "🏗️", desc: "Design system architecture and technical strategy", color: "var(--gold)", topics: ["fe-js-ts", "be-http", "be-data", "be-realtime", "be-search", "do-k8s", "do-cicd", "sec-owasp", "ai-llm", "do-observe"], salaryInr: "15-40 LPA", salaryUsd: "$130-250k" },
    apidesign: { name: "API Designer", icon: "🔌", desc: "Design clean, versioned, and developer-friendly APIs", color: "#3b82f6", topics: ["be-node", "be-http", "be-realtime", "be-data", "be-search", "sec-owasp", "fe-js-ts"], salaryInr: "4-12 LPA", salaryUsd: "$60-130k" },
    cybersecurity: { name: "Cyber Security Engineer", icon: "🛡️", desc: "Protect systems, networks, and data from threats", color: "#ef4444", topics: ["sec-owasp", "sec-authz", "sec-ops", "do-linux", "do-k8s", "do-observe", "be-http", "be-realtime"], salaryInr: "5-16 LPA", salaryUsd: "$70-160k" },
    uxdesign: { name: "UX Designer", icon: "🎯", desc: "Design intuitive, accessible, and delightful user experiences", color: "#ec4899", topics: ["fe-html-css", "fe-js-ts", "fe-react", "fe-tooling"], salaryInr: "3-8 LPA", salaryUsd: "$50-110k" },
    technicalwriter: { name: "Technical Writer", icon: "✍️", desc: "Create clear documentation, guides, and API references", color: "#64748b", topics: ["fe-html-css", "fe-js-ts", "be-http", "fe-tooling", "do-cicd"], salaryInr: "3-7 LPA", salaryUsd: "$45-95k" },
    gamedev: { name: "Game Developer", icon: "🎮", desc: "Build interactive games and game systems", color: "#8b5cf6", topics: ["fe-js-ts", "fe-react", "be-node", "be-http", "be-data", "ai-ml", "fe-tooling", "do-docker"], salaryInr: "3-10 LPA", salaryUsd: "$50-120k" },
    servergamedev: { name: "Server-Side Game Developer", icon: "🖥️", desc: "Build scalable game backends and matchmaking", color: "#10b981", topics: ["be-node", "be-http", "be-data", "be-realtime", "be-search", "do-docker", "do-k8s", "do-observe"], salaryInr: "4-12 LPA", salaryUsd: "$60-130k" },
    mlops: { name: "MLOps Engineer", icon: "🔄", desc: "Operationalize ML models with CI/CD and monitoring", color: "#f59e0b", topics: ["ai-py", "ai-ml", "ai-dl", "ai-llm", "ai-mlops", "do-docker", "do-k8s", "do-cicd", "do-observe"], salaryInr: "7-22 LPA", salaryUsd: "$90-190k" },
    productmanager: { name: "Product Manager", icon: "📋", desc: "Define product strategy, roadmap, and delivery", color: "#ec4899", topics: ["fe-js-ts", "be-http", "fe-react", "do-cicd", "ai-llm"], salaryInr: "8-25 LPA", salaryUsd: "$80-180k" },
    engineeringmanager: { name: "Engineering Manager", icon: "👥", desc: "Lead engineering teams and technical delivery", color: "var(--gold)", topics: ["fe-js-ts", "be-http", "be-data", "do-cicd", "do-observe", "sec-owasp", "ai-llm"], salaryInr: "15-40 LPA", salaryUsd: "$120-250k" },
    devrel: { name: "Developer Relations", icon: "🤝", desc: "Build community, create content, and drive adoption", color: "#3b82f6", topics: ["fe-html-css", "fe-js-ts", "fe-react", "be-http", "do-cicd", "ai-llm", "fe-tooling"], salaryInr: "5-14 LPA", salaryUsd: "$70-140k" },
    bianalyst: { name: "BI Analyst", icon: "📈", desc: "Create reports, dashboards, and business intelligence", color: "#06b6d4", topics: ["ai-py", "ai-ml", "be-data", "fe-html-css", "do-observe"], salaryInr: "3-8 LPA", salaryUsd: "$50-105k" },
    airedteaming: { name: "AI Red Teaming", icon: "⚔️", desc: "Stress-test AI systems for safety and robustness", color: "#ef4444", topics: ["ai-py", "ai-ml", "ai-dl", "ai-llm", "sec-owasp", "sec-ops", "sec-authz"], salaryInr: "8-25 LPA", salaryUsd: "$100-200k" },
    networkengineer: { name: "Network Engineer", icon: "🌐", desc: "Design, configure, and maintain network infrastructure", color: "#8b5cf6", topics: ["do-linux", "do-k8s", "do-aws", "do-observe", "sec-owasp", "sec-ops"], salaryInr: "4-10 LPA", salaryUsd: "$55-120k" }
  };

  function renderRoleRoadmap() {
    var container = document.getElementById("roadmap-role");
    var phases = (window.TM_ROADMAP && window.TM_ROADMAP.phases) || [];
    var allTopics = {};
    phases.forEach(function(ph) { (ph.topics || []).forEach(function(t) { allTopics[t.id] = t; }); });

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,350px),1fr));gap:1rem">';
    Object.keys(ROLES).forEach(function(key) {
      var role = ROLES[key];
      var roleTopics = role.topics.map(function(id) { return allTopics[id]; }).filter(function(t) { return t; });
      var doneCount = roleTopics.filter(function(t) {
        return (t.subtopics || []).every(function(s, si) { return roadmapProg["rm-" + t.id + "-s-" + si]; });
      }).length;

      html += '<div class="card role-card" data-role="' + key + '" style="border:1px solid ' + role.color + '40;cursor:pointer">';
      html += '<div class="role-card-head" style="display:flex;align-items:center;gap:10px">';
      html += '<span style="font-size:1.5rem">' + role.icon + '</span>';
      html += '<div style="flex:1"><h3 style="margin:0;font-size:.95rem;color:' + role.color + '">' + role.name + '</h3>';
      html += '<span style="font-size:.7rem;color:var(--muted)">' + role.desc + '</span></div>';
      html += '<svg class="chevron chevron-mini role-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>';
      html += '</div>';
      html += '<div class="role-salary" style="margin:6px 0 0 0;display:flex;gap:12px;flex-wrap:wrap">';
      html += '<span style="font-size:.7rem;background:rgba(255,255,255,.05);padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.08)">🇮🇳 Fresher: ' + role.salaryInr + '</span>';
      html += '<span style="font-size:.7rem;background:rgba(255,255,255,.05);padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.08)">🌍 Fresher: ' + role.salaryUsd + '</span>';
      html += '</div>';
      // Progress bar + module count shown directly on card
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 0">';
      html += '<span style="font-size:.68rem;color:var(--gold)">📚 ' + doneCount + '/' + roleTopics.length + ' modules</span>';
      html += '<span style="font-size:.68rem;color:var(--muted)">⏱ ' + roleTopics.reduce(function(s,t){var h=parseInt(t.hours)||0;return s+h;},0) + 'h</span>';
      html += '</div>';
      html += '<div style="height:3px;background:rgba(100,116,139,0.2);border-radius:3px;overflow:hidden;margin-top:4px"><div style="height:100%;width:' + (roleTopics.length ? Math.round((doneCount/roleTopics.length)*100) : 0) + '%;background:' + role.color + ';transition:width.4s ease"></div></div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderRoleDetail(key) {
    var phases = (window.TM_ROADMAP && window.TM_ROADMAP.phases) || [];
    var allTopics = {};
    phases.forEach(function(ph) { (ph.topics || []).forEach(function(t) { allTopics[t.id] = t; }); });
    var topicPhase = {};
    phases.forEach(function(ph) { (ph.topics || []).forEach(function(t) { topicPhase[t.id] = ph; }); });
    var difColors = { Beginner: "#22c55e", Intermediate: "#3b82f6", Advanced: "#f59e0b", Expert: "#ef4444" };

    var role = ROLES[key];
    if (!role) return;
    var roleTopics = role.topics.map(function(id) { return allTopics[id]; }).filter(function(t) { return t; });
    var doneCount = roleTopics.filter(function(t) {
      return (t.subtopics || []).every(function(s, si) { return roadmapProg["rm-" + t.id + "-s-" + si]; });
    }).length;

    var html = '';
    // Back button header
    html += '<div class="rd-back-bar" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(212,175,55,0.15);position:sticky;top:0;background:rgba(2,6,23,0.98);backdrop-filter:blur(12px);z-index:10">';
    html += '<button type="button" class="btn-ghost" id="rd-back-btn" style="display:flex;align-items:center;gap:6px;padding:8px 14px;font-size:.8rem">← Back to Roles</button>';
    html += '<div style="flex:1;text-align:center;font-size:.85rem;font-weight:600;color:' + role.color + '">' + role.icon + ' ' + role.name + '</div>';
    html += '<button type="button" class="btn-ghost modal-close rd-close-x" style="font-size:1.3rem;padding:4px 12px">×</button>';
    html += '</div>';

    // Content — modal itself scrolls (overflow:auto on .modal-role-detail)
    html += '<div style="padding:20px 24px">';

    // Role header
    html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;margin-top:8px">';
    html += '<span style="font-size:2.5rem">' + role.icon + '</span>';
    html += '<div><h2 style="margin:0;font-size:1.3rem;color:' + role.color + '">' + role.name + '</h2>';
    html += '<p style="margin:4px 0 0;font-size:.82rem;color:var(--muted)">' + role.desc + '</p></div></div>';

    // Salary badges + progress
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px">';
    html += '<span style="font-size:.75rem;background:rgba(255,255,255,.05);padding:5px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.08)">🇮🇳 Fresher: ' + role.salaryInr + '</span>';
    html += '<span style="font-size:.75rem;background:rgba(255,255,255,.05);padding:5px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.08)">🌍 Fresher: ' + role.salaryUsd + '</span>';
    html += '</div>';

    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 4px">';
    html += '<span style="font-size:.75rem;color:var(--gold)">📚 ' + doneCount + '/' + roleTopics.length + ' modules completed</span>';
    html += '<span style="font-size:.75rem;color:var(--muted)">⏱ ' + roleTopics.reduce(function(s,t){var h=parseInt(t.hours)||0;return s+h;},0) + 'h total</span>';
    html += '</div>';
    html += '<div style="height:5px;background:rgba(100,116,139,0.2);border-radius:5px;overflow:hidden;margin-bottom:20px"><div style="height:100%;width:' + (roleTopics.length ? Math.round((doneCount/roleTopics.length)*100) : 0) + '%;background:' + role.color + ';border-radius:5px;transition:width.4s ease"></div></div>';

    // Modules accordion
    html += '<div class="role-modules">';
    roleTopics.forEach(function(t) {
      var ph = topicPhase[t.id];
      var subsTotal = (t.subtopics || []).length;
      var subsDone = (t.subtopics || []).filter(function(s, si) { return roadmapProg["rm-" + t.id + "-s-" + si]; }).length;
      var prTotal = (t.practice || []).length;
      var prDone = (t.practice || []).filter(function(s, si) { return roadmapProg["rm-" + t.id + "-p-" + si]; }).length;
      var allSubsDone = subsTotal > 0 && subsDone === subsTotal;
      var allPracticeDone = prTotal > 0 && prDone === prTotal;
      var subPct = subsTotal ? Math.round((subsDone/subsTotal)*100) : 0;
      var difCol = difColors[t.difficulty] || "var(--muted)";

      var subs = (t.subtopics || []).map(function(s, si) {
        var k = "rm-" + t.id + "-s-" + si;
        return '<label class="subtopic-row"><input type="checkbox" data-rm="' + k + '"' + (roadmapProg[k] ? " checked" : "") + ' /><span>' + esc(s) + '</span></label>';
      }).join("");
      var pr = (t.practice || []).map(function(s, si) {
        var k = "rm-" + t.id + "-p-" + si;
        return '<label class="subtopic-row practice-row"><input type="checkbox" data-rm="' + k + '"' + (roadmapProg[k] ? " checked" : "") + ' /><span>' + esc(s) + '</span></label>';
      }).join("");
      var pj = (t.projects || []).map(function(s) { return "<li>" + esc(s) + "</li>"; }).join("");
      var deps = (t.deps || []).length ? t.deps.map(function(d) {
        var dt = allTopics[d];
        return '<span style="font-size:.65rem;padding:3px 8px;border-radius:6px;background:rgba(212,175,55,.1);color:var(--gold);border:1px solid rgba(212,175,55,.2)">' + (dt ? esc(dt.title) : esc(d)) + '</span>';
      }).join(" ") : "";

      html += '<div class="roadmap-topic role-topic" data-topic-id="' + esc(t.id) + '">';
      html += '<div class="roadmap-topic-head role-topic-head">';
      html += '<div style="flex:1">';
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
      html += '<span class="roadmap-topic-title" style="font-size:.82rem">' + esc(t.title) + '</span>';
      html += '<span style="font-size:.62rem;padding:2px 8px;border-radius:20px;background:' + difCol + '20;color:' + difCol + ';border:1px solid ' + difCol + '40;font-weight:600">' + esc(t.difficulty || "") + '</span>';
      if (allSubsDone && allPracticeDone) { html += '<span style="font-size:.65rem">✅</span>'; }
      html += '</div>';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-top:3px;flex-wrap:wrap">';
      html += '<span style="font-size:.68rem;color:var(--muted)">⏱ ' + esc(t.hours || "") + '</span>';
      if (ph) { html += '<span style="font-size:.68rem;color:var(--muted)">📂 Phase ' + ph.n + ': ' + esc(ph.title) + '</span>'; }
      if (subsTotal) { html += '<span style="font-size:.68rem;color:var(--muted)">📖 ' + subsDone + '/' + subsTotal + '</span>'; }
      html += '</div></div>';
      html += '<svg class="chevron chevron-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
      html += '</div>';
      if (subsTotal) {
        html += '<div style="height:2px;margin:0 1rem;background:rgba(100,116,139,0.15);border-radius:2px;overflow:hidden"><div style="height:100%;width:' + subPct + '%;background:' + (subPct === 100 ? "var(--emerald, #22c55e)" : difCol) + ';border-radius:2px"></div></div>';
      }
      html += '<div class="roadmap-topic-body role-topic-body">';
      if (deps) { html += '<div style="margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px;align-items:center"><span style="font-size:.68rem;color:var(--muted);margin-right:4px">🔗 Prerequisites:</span>' + deps + '</div>'; }
      if (subs) {
        html += '<div class="roadmap-section-label" style="display:flex;align-items:center;gap:6px"><span>📖 Subtopics</span>' + (subsTotal ? '<span style="font-size:.62rem;font-weight:400;color:var(--muted)">(' + subsDone + '/' + subsTotal + ')</span>' : '') + '</div>' + subs;
      }
      if (pr) {
        html += '<div class="roadmap-section-label" style="display:flex;align-items:center;gap:6px;margin-top:10px"><span>⚡ Practice tasks</span>' + (prTotal ? '<span style="font-size:.62rem;font-weight:400;color:var(--muted)">(' + prDone + '/' + prTotal + ')</span>' : '') + '</div>' + pr;
      }
      if (pj) {
        html += '<div class="roadmap-section-label" style="display:flex;align-items:center;gap:6px;margin-top:10px"><span>🚀 Project ideas</span></div><ul class="proj-list">' + pj + "</ul>";
      }
      html += '</div></div>';
    });
    html += '</div>';

    // Portfolio projects
    var projCats = ROLE_PROJ_MAP[key] || [key];
    var roleProjects = (window.TMProjects && window.TMProjects.all || []).filter(function(p) { return projCats.indexOf(p.cat) >= 0; }).slice(0, 6);
    if (roleProjects.length) {
      html += '<div style="margin-top:20px;border-top:1px solid rgba(212,175,55,0.12);padding-top:14px">';
      html += '<div class="roadmap-section-label" style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span>🏆 Portfolio Projects</span><span style="font-size:.65rem;font-weight:400;color:var(--muted)">(' + roleProjects.length + ' ready)</span></div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));gap:8px">';
      roleProjects.forEach(function(rp) {
        html += '<div class="role-portfolio-proj" data-proj-id="' + esc(rp.id) + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all .2s">';
        html += '<span style="font-size:1.3rem">' + esc(rp.emoji) + '</span>';
        html += '<div style="flex:1;min-width:0">';
        html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">';
        html += '<span style="font-size:.78rem;font-weight:500;color:var(--text)">' + esc(rp.title) + '</span>';
        html += '<span style="font-size:.6rem;padding:1px 6px;border-radius:4px;background:' + rp.color + '22;color:' + rp.color + '">' + esc(rp.tier) + '</span>';
        html += '</div>';
        html += '<div style="font-size:.68rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">' + esc(rp.desc) + '</div>';
        html += '</div>';
        html += '<span style="font-size:.6rem;color:var(--muted);flex-shrink:0">⏱ ' + esc(rp.time) + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    html += '</div>'; // close content wrapper

    var overlay = document.getElementById("modal-role-detail");
    document.getElementById("rd-content").innerHTML = html;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Close handlers use delegation on #modal-role-detail instead of per-render listeners
  }

  // Shared handler for role interactions (cards + overlay)
  function handleRoleInteraction(e) {
    var projEl = e.target.closest(".role-portfolio-proj");
    if (projEl) {
      var pid = projEl.getAttribute("data-proj-id");
      if (pid && typeof openProjectModal === "function") { openProjectModal(pid); }
      return;
    }
    var cb = e.target.closest("[data-rm]");
    if (cb) {
      roadmapProg[cb.getAttribute("data-rm")] = cb.checked;
      saveJSON(SK.roadmapTopics, roadmapProg);
      syncToSupabase();
      return;
    }
    var head = e.target.closest(".role-topic-head");
    if (head) {
      e.stopPropagation();
      var topic = head.closest(".role-topic");
      if (!topic) return;
      var body = topic.querySelector(".role-topic-body");
      var chev = head.querySelector(".chevron");
      if (body) { body.classList.toggle("open"); if (chev) chev.classList.toggle("open"); }
      return;
    }
    var card = e.target.closest(".role-card");
    if (card) {
      var roleKey = card.getAttribute("data-role");
      if (roleKey) renderRoleDetail(roleKey);
    }
  }
  if (document.getElementById("roadmap-role")) {
    document.getElementById("roadmap-role").addEventListener("click", handleRoleInteraction);
    document.getElementById("modal-role-detail").addEventListener("click", function(e) {
      if (e.target.closest("#rd-back-btn") || e.target.closest(".rd-close-x") || e.target === this) {
        this.classList.remove("open");
        this.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        return;
      }
      handleRoleInteraction(e);
    });
  }

  // Toggle roadmap views
  document.addEventListener("click", function(e) {
    var btn = e.target.closest(".roadmap-view-btn");
    if (!btn) return;
    document.querySelectorAll(".roadmap-view-btn").forEach(function(b) { b.className = b.className.replace(" btn-primary", " btn-ghost").replace(" active", ""); });
    btn.className = "btn-primary roadmap-view-btn active";
    var view = btn.getAttribute("data-view");
    document.getElementById("roadmap-timeline").style.display = view === "timeline" ? "" : "none";
    document.getElementById("roadmap-role").style.display = view === "role" ? "" : "none";
    if (view === "role") renderRoleRoadmap();
  });

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

      // Contribution graph (52 weeks like GitHub) - external API is primary
      var contribData = ghData.contributionData;
      if (contribData && contribData.length) {
        var currentStreak = ghData.currentStreak || 0;
        var longestStreak = ghData.longestStreak || 0;
        var totalActive = ghData.totalActiveDays || contribData.filter(function(w){return w.count>0;}).length;
        var weeklyConsistency = ghData.weeklyConsistency || (function(){
          var ws={};contribData.forEach(function(w){if(w.count>0){var m=w.date.substring(0,7);ws[m]=true;}});return Math.round((Object.keys(ws).length/Math.max(1,Object.keys(ws).length))*100);
        })();
        
        // Convert flat daily data to weeks (properly aligned)
        var daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        var sortedDays = contribData.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
        if (!sortedDays.length) sortedDays = contribData;
        var firstDate = new Date(sortedDays[0].date);
        var padStart = firstDate.getDay();
        var padded = [];
        for (var p=0; p<padStart; p++) padded.push({date:"",count:-1});
        padded = padded.concat(sortedDays);
        var weeks = [];
        for (var i=0; i<padded.length; i+=7) weeks.push(padded.slice(i,i+7));
        while (weeks.length>0 && weeks[weeks.length-1].length<7) weeks[weeks.length-1].push({date:"",count:-1});
        weeks = weeks.slice(-53);
        
        var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        var dayLabels=["","Mon","","Wed","","Fri",""];
        var monthPositions={};
        weeks.forEach(function(w,wi){
          if(w[3]&&w[3].date){var m=new Date(w[3].date).getMonth();if(monthPositions[m]===undefined)monthPositions[m]=wi;}
        });
        
        // Premium streak panel with glassmorphism - redesigned with better visuals
        html += '<div class="panel streak-panel" style="margin-top:1rem;background:linear-gradient(145deg,rgba(12,20,38,0.95),rgba(20,35,60,0.85));border:1px solid rgba(212,175,55,0.25);border-radius:24px;padding:1.75rem;position:relative;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(212,175,55,0.12)">';
        // Animated gradient orbs
        html += '<div style="position:absolute;top:-80px;right:-80px;width:240px;height:240px;background:radial-gradient(circle,rgba(212,175,55,0.12) 0%,transparent 70%);border-radius:50%;pointer-events:none;animation:float 8s ease-in-out infinite"></div>';
        html += '<div style="position:absolute;bottom:-60px;left:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(56,152,236,0.08) 0%,transparent 70%);border-radius:50%;pointer-events:none;animation:float 12s ease-in-out infinite reverse"></div>';
        html += '<div class="streak-grid-bg"></div>';
        html += '<div style="position:relative;z-index:2">';
        
        // Header with decorative line
        html += '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:1.5rem">';
        html += '<div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,0.3))"></div>';
        html += '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">&#x1F525;</span><span style="font-size:.9rem;font-weight:600;color:var(--gold);letter-spacing:2px;text-transform:uppercase">Contribution Graph</span></div>';
        html += '<div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(212,175,55,0.3),transparent)"></div>';
        html += '</div>';
        
        // Stats cards with better design
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(120px,100%),1fr));gap:10px;margin-bottom:1.25rem">';
        var statCards = [
          {val:currentStreak,lab:"Current Streak",col:"var(--gold)",bg:"rgba(212,175,55,0.1)",bd:"rgba(212,175,55,0.25)",glow:true},
          {val:longestStreak,lab:"Longest Streak",col:"var(--emerald)",bg:"rgba(16,185,129,0.08)",bd:"rgba(16,185,129,0.2)",glow:false},
          {val:totalActive,lab:"Active Days",col:"#3b82f6",bg:"rgba(59,130,246,0.08)",bd:"rgba(59,130,246,0.2)",glow:false},
          {val:weeklyConsistency+"%",lab:"Consistency",col:"#8b5cf6",bg:"rgba(139,92,246,0.08)",bd:"rgba(139,92,246,0.2)",glow:false}
        ];
        statCards.forEach(function(c){
          var extra=c.glow?'background:radial-gradient(circle at 50% 50%,rgba(212,175,55,0.15),transparent 100%);animation:pulse 2.5s ease-in-out infinite;':'';
          html += '<div style="background:'+c.bg+';border:1px solid '+c.bd+';border-radius:16px;padding:14px 8px;text-align:center;position:relative;overflow:hidden;transition:all .3s;backdrop-filter:blur(4px)" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.3)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'\'">';
          if(c.glow)html+='<div style="position:absolute;top:-60%;left:-60%;width:220%;height:220%;'+extra+'"></div>';
          html += '<div style="font-size:1.6rem;font-weight:700;color:'+c.col+';position:relative;z-index:1;text-shadow:'+(c.glow?'0 0 20px rgba(212,175,55,0.4)':'none')+'">'+c.val+'</div>';
          html += '<div style="font-size:.6rem;color:var(--muted);position:relative;z-index:1;margin-top:4px;letter-spacing:.5px">'+c.lab+'</div></div>';
        });
        html += '</div>';
        
        // Heatmap with cleaner design
        html += '<div style="display:flex;gap:6px;margin-top:.5rem;overflow-x:auto;padding:8px 0;justify-content:center">';
        html += '<div style="display:flex;flex-direction:column;gap:2px;padding-top:2px">';
        dayLabels.forEach(function(d){html+='<div style="font-size:.5rem;color:var(--muted);height:14px;line-height:14px;width:28px;text-align:right;padding-right:6px">'+d+'</div>';});
        html += '</div>';
        var gridHtml = '<div style="display:grid;grid-template-rows:repeat(7,14px);grid-auto-flow:column;gap:3px">';
        var levels=["rgba(30,41,59,0.8)","rgba(212,175,55,0.15)","rgba(212,175,55,0.35)","rgba(212,175,55,0.55)","rgba(212,175,55,0.8)"];
        var maxC=0;contribData.forEach(function(w){if(w.count>maxC)maxC=w.count;});
        weeks.forEach(function(week){
          week.forEach(function(w){
            if(!w||!w.date||w.count<0){gridHtml+='<div style="width:14px;height:14px;border-radius:3px;background:rgba(30,41,59,0.4);border:1px solid rgba(100,116,139,0.08)"></div>';return;}
            var lv=0;
            if(w.count>0&&maxC>0){var r=w.count/maxC;if(r>0.75)lv=4;else if(r>0.5)lv=3;else if(r>0.25)lv=2;else lv=1;}
            var dn=daysOfWeek[new Date(w.date).getDay()];
            var glow=lv===4?'0 0 6px rgba(212,175,55,0.4),0 0 12px rgba(212,175,55,0.15)':'none';
            gridHtml+='<div class="streak-cell" style="width:14px;height:14px;background:'+levels[lv]+';border-radius:3px;border:1px solid '+(lv>0?'rgba(212,175,55,0.35)':'rgba(100,116,139,0.12)')+';box-shadow:'+glow+';transition:all .25s cubic-bezier(.4,0,.2,1)" title="'+dn+', '+w.date+': '+w.count+' contributions"></div>';
          });
        });
        gridHtml+='</div>';
        html += gridHtml;
        html += '</div>';
        
        // Month labels with better spacing
        html += '<div style="display:flex;justify-content:space-between;margin-top:.35rem;font-size:.55rem;color:var(--muted);padding-left:34px">';
        var sm=Object.keys(monthPositions).sort(function(a,b){return monthPositions[a]-monthPositions[b];});
        sm.forEach(function(m){html+='<span>'+months[m]+'</span>';});
        html += '</div>';
        
        // Legend with better style
        html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:1rem;padding:.5rem;background:rgba(0,0,0,0.15);border-radius:12px;border:1px solid rgba(212,175,55,0.06)">';
        html += '<span style="font-size:.6rem;color:var(--muted);letter-spacing:.5px">LESS</span>';
        levels.forEach(function(c,i){
          html+='<div style="width:14px;height:14px;background:'+c+';border-radius:3px;border:1px solid rgba(212,175,55,0.25);transition:all .2s" onmouseover="this.style.transform=\'scale(1.3)\'" onmouseout="this.style.transform=\'\'"></div>';
        });
        html += '<span style="font-size:.6rem;color:var(--muted);letter-spacing:.5px">MORE</span></div>';
        
        // Motivational quote
        var qs=["Keep the streak alive! &#x1F525;","Consistency is key! &#x1F4AA;","Every commit counts! &#x1F680;","Building greatness day by day! &#x2B50;","You&apos;re unstoppable! &#x26A1;","Progress over perfection! &#x1F4C8;"];
        var quote=qs[Math.floor(Math.random()*qs.length)];
        html += '<div style="text-align:center;margin-top:1rem;padding:.75rem;background:rgba(212,175,55,0.04);border-radius:12px;border:1px solid rgba(212,175,55,0.08)"><span style="font-size:.72rem;color:rgba(212,175,55,0.7);font-style:italic;letter-spacing:.3px">'+quote+'</span></div>';
        html += '</div></div>';
      }

      // Activity stats cards with emojis
      if (ghData.events && ghData.events.length) {
        var pushes = 0, prs = 0, creates = 0, forks = 0, stars = 0, issues = 0;
        ghData.events.forEach(function(ev) {
          if (ev.type === "PushEvent") pushes++;
          else if (ev.type === "PullRequestEvent") prs++;
          else if (ev.type === "CreateEvent") creates++;
          else if (ev.type === "ForkEvent") forks++;
          else if (ev.type === "WatchEvent") stars++;
          else if (ev.type === "IssuesEvent") issues++;
        });
        html += '<div class="panel" style="margin-top:.75rem"><h3>Activity Stats (90 days)</h3>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:.75rem;margin-top:.5rem">';
        if (pushes > 0) html += '<div class="card" style="padding:.75rem;text-align:center;background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2)"><div style="font-size:1.5rem;margin-bottom:.25rem">📤</div><div style="font-size:1.25rem;font-weight:700;color:var(--gold)">' + pushes + '</div><div style="font-size:.65rem;color:var(--muted)">Pushes</div></div>';
        if (prs > 0) html += '<div class="card" style="padding:.75rem;text-align:center;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2)"><div style="font-size:1.5rem;margin-bottom:.25rem">🔀</div><div style="font-size:1.25rem;font-weight:700;color:var(--emerald)">' + prs + '</div><div style="font-size:.65rem;color:var(--muted)">PRs</div></div>';
        if (creates > 0) html += '<div class="card" style="padding:.75rem;text-align:center;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2)"><div style="font-size:1.5rem;margin-bottom:.25rem">✨</div><div style="font-size:1.25rem;font-weight:700;color:#3b82f6">' + creates + '</div><div style="font-size:.65rem;color:var(--muted)">Created</div></div>';
        if (forks > 0) html += '<div class="card" style="padding:.75rem;text-align:center;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2)"><div style="font-size:1.5rem;margin-bottom:.25rem">🍴</div><div style="font-size:1.25rem;font-weight:700;color:#8b5cf6">' + forks + '</div><div style="font-size:.65rem;color:var(--muted)">Forks</div></div>';
        if (stars > 0) html += '<div class="card" style="padding:.75rem;text-align:center;background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2)"><div style="font-size:1.5rem;margin-bottom:.25rem">⭐</div><div style="font-size:1.25rem;font-weight:700;color:var(--gold)">' + stars + '</div><div style="font-size:.65rem;color:var(--muted)">Stars</div></div>';
        if (issues > 0) html += '<div class="card" style="padding:.75rem;text-align:center;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2)"><div style="font-size:1.5rem;margin-bottom:.25rem">🐛</div><div style="font-size:1.25rem;font-weight:700;color:#ef4444">' + issues + '</div><div style="font-size:.65rem;color:var(--muted)">Issues</div></div>';
        html += '</div></div>';
      }

      // Animated bar charts for pushes/PRs/creates
      var weeklyAct = ghData.weeklyActivity;
      if ((!weeklyAct || !weeklyAct.length) && ghData.events && ghData.events.length) {
        weeklyAct = [];
        var now = new Date();
        var weekActivityMap = {};
        ghData.events.forEach(function(e) {
          var ed = new Date(e.created_at);
          var wn = "W" + Math.ceil((ed.getTime() - new Date(now.getTime() - 90 * 86400000).getTime()) / (7 * 86400000));
          if (!weekActivityMap[wn]) weekActivityMap[wn] = { week: wn, pushes: 0, prs: 0, creates: 0 };
          if (e.type === "PushEvent") weekActivityMap[wn].pushes++;
          else if (e.type === "PullRequestEvent") weekActivityMap[wn].prs++;
          else if (e.type === "CreateEvent") weekActivityMap[wn].creates++;
        });
        Object.keys(weekActivityMap).slice(-12).forEach(function(k) { weeklyAct.push(weekActivityMap[k]); });
      }
      if (weeklyAct && weeklyAct.length) {
        html += '<div class="panel" style="margin-top:.75rem"><h3>📈 Weekly Activity</h3>';
        html += '<div style="display:flex;align-items:flex-end;height:120px;gap:4px;margin-top:.5rem;padding-bottom:20px">';
        var waMax = 0;
        weeklyAct.forEach(function(w) { var t = (w.pushes || 0) + (w.prs || 0) + (w.creates || 0); if (t > waMax) waMax = t; });
        weeklyAct.forEach(function(w) {
          var total = (w.pushes || 0) + (w.prs || 0) + (w.creates || 0);
          var h = waMax > 0 ? Math.round((total / waMax) * 100) : 0;
          html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
          html += '<div style="width:100%;display:flex;flex-direction:column;align-items:center;height:' + h + '%">';
          if (w.creates > 0) html += '<div style="width:100%;background:#3b82f6;height:' + Math.round((w.creates / total) * 100) + '%" title="Creates: ' + w.creates + '"></div>';
          if (w.prs > 0) html += '<div style="width:100%;background:#10b981;height:' + Math.round((w.prs / total) * 100) + '%" title="PRs: ' + w.prs + '"></div>';
          if (w.pushes > 0) html += '<div style="width:100%;background:var(--gold);height:' + Math.round((w.pushes / total) * 100) + '%" title="Pushes: ' + w.pushes + '"></div>';
          html += '</div>';
          html += '<span style="font-size:.5rem;color:var(--muted)">' + (w.week || "") + '</span>';
          html += '</div>';
        });
        html += '</div>';
        html += '<div style="display:flex;gap:1rem;margin-top:.5rem;font-size:.65rem"><span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:var(--gold);border-radius:2px"></span>Pushes</span><span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#10b981;border-radius:2px"></span>PRs</span><span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#3b82f6;border-radius:2px"></span>Creates</span></div></div>';
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
    document.getElementById("career-panel-github").style.display = "block";
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
      '<option value="all">All categories</option><option value="frontend">Frontend</option><option value="backend">Backend</option><option value="fullstack">Full Stack</option><option value="devops">DevOps</option><option value="security">Security</option><option value="ai">AI Engineer</option><option value="data-ai">Data &amp; AI</option><option value="blockchain">Blockchain</option>';
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
    document.getElementById("fab-chat").addEventListener("click", function () {
      var panel = document.getElementById("chat-panel");
      var open = panel.classList.toggle("open");
      panel.setAttribute("aria-hidden", String(!open));
      if (open) document.getElementById("chat-input").focus();
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
        closeModal("modal-role-detail");
      }
    });
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove("open");
    document.getElementById(id).setAttribute("aria-hidden", "true");
    if (id === "modal-role-detail" || id === "modal-project") document.body.style.overflow = "";
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
  function initChat() {
    var input = document.getElementById("chat-input");
    var send = document.getElementById("chat-send");
    var close = document.getElementById("chat-close");
    var deferredPrompt = null;

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
    });

    // greeting suggestions already shown in HTML, but handle any suggestion click via delegation
    document.getElementById("chat-body").addEventListener("click", function (e) {
      var btn = e.target.closest(".chat-quick");
      if (!btn) return;
      var val = btn.getAttribute("data-val") || btn.textContent;
      // trigger native install prompt if Download app chip is clicked
      if (/download|install/i.test(val) && deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
      }
      input.value = val;
      send.click();
    });

    function handleMessage() {
      var text = input.value.trim();
      if (!text) return;
      addChatMsg(text, "user");
      input.value = "";
      setTimeout(function () { chatResponse(text); }, 300);
    }

    send.addEventListener("click", handleMessage);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") handleMessage();
    });
    close.addEventListener("click", function () {
      document.getElementById("chat-panel").classList.remove("open");
      document.getElementById("chat-panel").setAttribute("aria-hidden", "true");
    });
  }

  function addChatMsg(text, who) {
    var body = document.getElementById("chat-body");
    var div = document.createElement("div");
    div.className = "chat-msg " + who;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function chatResponse(text) {
    var t = text.toLowerCase();
    var body = document.getElementById("chat-body");
    var div = document.createElement("div");
    div.className = "chat-msg bot";

    if (/home|start|hello|hi|hey/.test(t)) {
      div.innerHTML = "👋 Welcome! You're on the <strong>Home</strong> page. I can take you to:<br><br>" +
        "📚 <strong>Documentation Hub</strong> — MDN-style reference<br>" +
        "🧱 <strong>Project Lab</strong> — portfolio-ready builds<br>" +
        "🎤 <strong>Interview Dojo</strong> — spaced repetition prep<br>" +
        "📈 <strong>Dashboard</strong> — XP, streaks, analytics<br>" +
        "🗺️ <strong>Roadmap</strong> — role-based career paths<br>" +
        "⚔️ <strong>Chest</strong> — surprise rewards<br><br>" +
        "Just type the section name to go there!<br><br>" +
        '<button class="chat-quick" data-val="Docs">📚 Docs</button> <button class="chat-quick" data-val="Projects">🧱 Projects</button> <button class="chat-quick" data-val="Interview">🎤 Interview</button> <button class="chat-quick" data-val="Dashboard">📈 Dashboard</button> <button class="chat-quick" data-val="Roadmap">🗺️ Roadmap</button> <button class="chat-quick" data-val="Chest">⚔️ Chest</button>' +
        '<br><br><button class="chat-quick" data-val="How to use">🛠️ How to use</button> <button class="chat-quick" data-val="Feedback">💡 Feedback</button> <button class="chat-quick" data-val="Download app">📱 Download app</button>';
    } else if (/feedback|suggest|improve|bug|issue/.test(t)) {
      div.innerHTML = "💡 Got feedback or a suggestion? Head to the <strong>Feedback</strong> section on the Home page (scroll down) or email us directly. We'd love to hear from you!<br><br>👉 <em>Tip:</em> You can also use the form at the bottom of the Home page." +
        '<br><br><button class="chat-quick" data-val="Hi">🔙 Back to menu</button>';
    } else if (/how.*(use|work|navigate|site)|guide|tutorial|help/.test(t)) {
      div.innerHTML = "🛠️ <strong>How to use TechMaster:</strong><br><br>" +
        "• <strong>Home</strong> — Overview of everything<br>" +
        "• <strong>Roadmap</strong> — Pick a career path & track progress<br>" +
        "• <strong>Docs</strong> — Browse reference topics with TOC<br>" +
        "• <strong>Projects</strong> — Filter by tier/category and build<br>" +
        "• <strong>Interview</strong> — Practice with spaced repetition<br>" +
        "• <strong>Dashboard</strong> — See your XP, streaks & heatmaps<br>" +
        "• <strong>Notes</strong> — Save personal notes per topic<br>" +
        "• Press <kbd>Ctrl+K</kbd> to search everything instantly<br><br>" +
        "Ask me to take you anywhere!" +
        '<br><br><button class="chat-quick" data-val="Hi">🔙 Back to menu</button>';
    } else if (/download|install|pwa|app|mobile|offline/.test(t)) {
      div.innerHTML = "📱 <strong>Install on your device:</strong><br><br>" +
        "On <strong>Chrome (Android)</strong>: open the menu (⋮) → tap <em>Add to Home screen</em>.<br>" +
        "On <strong>Safari (iOS)</strong>: tap the Share icon → <em>Add to Home Screen</em>.<br>" +
        "On <strong>Desktop Chrome</strong>: click the install icon (⊕) in the address bar.<br><br>" +
        "Once installed, TechMaster works offline with cached content! 🚀" +
        '<br><br><button class="chat-quick" data-val="Hi">🔙 Back to menu</button>';
    } else if (/documentation|docs|doc/.test(t)) {
      div.innerHTML = "Heading to <strong>Documentation Hub</strong> 📚";
      setTimeout(function () { showPage("documentation"); }, 600);
    } else if (/project|build|lab/.test(t)) {
      div.innerHTML = "Heading to <strong>Project Lab</strong> 🧱";
      setTimeout(function () { showPage("projects"); }, 600);
    } else if (/interview|dojo/.test(t)) {
      div.innerHTML = "Heading to <strong>Interview Dojo</strong> 🎤";
      setTimeout(function () { showPage("interview"); }, 600);
    } else if (/dashboard|dash|analytics/.test(t)) {
      div.innerHTML = "Heading to <strong>Dashboard</strong> 📈";
      setTimeout(function () { showPage("dashboard"); }, 600);
    } else if (/roadmap|map|career/.test(t)) {
      div.innerHTML = "Heading to <strong>Roadmap</strong> 🗺️";
      setTimeout(function () { showPage("roadmap"); }, 600);
    } else if (/chest|surprise|reward/.test(t)) {
      div.innerHTML = "Heading to <strong>Chest</strong> ⚔️";
      setTimeout(function () { showPage("chest"); }, 600);
    } else {
      div.innerHTML = "I can help you navigate the site! Try saying:<br>" +
        "• <strong>Docs</strong> — Documentation Hub<br>" +
        "• <strong>Projects</strong> — Project Lab<br>" +
        "• <strong>Interview</strong> — Interview Dojo<br>" +
        "• <strong>Dashboard</strong> — Productivity Dashboard<br>" +
        "• <strong>Roadmap</strong> — Role-based paths<br>" +
        "• <strong>Chest</strong> — Surprise rewards<br><br>" +
        "Or try: <strong>Feedback</strong>, <strong>How to use</strong>, <strong>Download app</strong>";
    }

    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

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

  try {
    buildInterviewBank();
    initAuth();
    handleAuth();
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
    initChat();
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
  } catch(e) { console.error("Startup error:", e); }
  
  // Feedback form — opens mailto with form data
  try {
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
  } catch(e) {}

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
        if (c.getAttribute("data-nav-role") === "true") {
          var roleBtn = document.querySelector('.roadmap-view-btn[data-view="role"]');
          if (roleBtn) setTimeout(function() { roleBtn.click(); }, 100);
        }
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

  window.showPage = showPage; // expose for inline onclick handlers

})();
