/**
 * Multi-note workspace with local persistence, pins, tags, and auto-save.
 */
(function (global) {
  var C = global.TM_CONFIG;
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

  function uid() {
    return "n_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
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
    }, 2400);
  }

  var state = {
    notes: [],
    activeId: null,
    saveTimer: null,
  };

  function migrateLegacyNotes() {
    var legacy = localStorage.getItem(SK.notes);
    if (!legacy) return;
    try {
      if (state.notes.length === 0 && legacy.trim().length > 0) {
        state.notes.push({
          id: uid(),
          title: "Imported scratch",
          body: legacy,
          tags: "general",
          pinned: true,
          updatedAt: Date.now(),
        });
        saveJSON(SK.notesV2, state.notes);
      }
    } catch (e) {}
  }

  function loadState() {
    state.notes = loadJSON(SK.notesV2, []);
    migrateLegacyNotes();
    if (!state.notes.length) {
      state.notes.push({
        id: uid(),
        title: "Welcome note",
        body: "# TechMaster Notes\n\n- Pin important checklists\n- Use tags like `interview`, `roadmap`\n- Auto-saves every few seconds",
        tags: "getting-started",
        pinned: true,
        updatedAt: Date.now(),
      });
      saveJSON(SK.notesV2, state.notes);
    }
    state.activeId = state.notes[0].id;
  }

  function activeNote() {
    return state.notes.find(function (n) {
      return n.id === state.activeId;
    });
  }

  function renderList() {
    var q = (document.getElementById("notes-search").value || "").toLowerCase();
    var list = state.notes
      .filter(function (n) {
        if (!q) return true;
        return (
          n.title.toLowerCase().indexOf(q) >= 0 ||
          n.body.toLowerCase().indexOf(q) >= 0 ||
          (n.tags || "").toLowerCase().indexOf(q) >= 0
        );
      })
      .sort(function (a, b) {
        if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
    document.getElementById("notes-list").innerHTML = list
      .map(function (n) {
        var active = n.id === state.activeId ? " active" : "";
        return (
          '<button type="button" class="notes-item' +
          active +
          '" data-note-id="' +
          n.id +
          '">' +
          (n.pinned ? '<span class="notes-pin">📌</span>' : "") +
          '<span class="notes-item-title">' +
          escapeHtml(n.title || "Untitled") +
          '</span><span class="notes-item-meta">' +
          formatTime(n.updatedAt) +
          "</span></button>"
        );
      })
      .join("");
    document.querySelectorAll("#notes-list [data-note-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        flushEditor();
        state.activeId = btn.getAttribute("data-note-id");
        fillEditor();
        renderList();
      });
    });
  }

  function formatTime(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/`/g, "&#x60;");
  }

  function fillEditor() {
    var n = activeNote();
    if (!n) return;
    document.getElementById("notes-title").value = n.title || "";
    document.getElementById("notes-tags").value = n.tags || "";
    document.getElementById("notes-body").value = n.body || "";
    document.getElementById("notes-pin").classList.toggle("active", !!n.pinned);
    document.getElementById("notes-status").textContent = "Saved";
  }

  function flushEditor() {
    var n = activeNote();
    if (!n) return;
    n.title = document.getElementById("notes-title").value.trim() || "Untitled";
    n.tags = document.getElementById("notes-tags").value.trim();
    n.body = document.getElementById("notes-body").value;
    n.updatedAt = Date.now();
    saveJSON(SK.notesV2, state.notes);
  }

  function scheduleSave() {
    document.getElementById("notes-status").textContent = "Editing…";
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(function () {
      flushEditor();
      document.getElementById("notes-status").textContent = "Auto-saved";
      renderList();
    }, 900);
  }

  function bindEditorInputs() {
    ["notes-title", "notes-tags", "notes-body"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.bound === "1") return;
      el.dataset.bound = "1";
      el.addEventListener("input", scheduleSave);
    });
  }

  function init() {
    loadState();
    bindEditorInputs();
    fillEditor();
    renderList();

    document.getElementById("notes-new").addEventListener("click", function () {
      flushEditor();
      var n = { id: uid(), title: "New note", body: "", tags: "general", pinned: false, updatedAt: Date.now() };
      state.notes.unshift(n);
      state.activeId = n.id;
      saveJSON(SK.notesV2, state.notes);
      fillEditor();
      renderList();
      toast("Note created");
    });

    document.getElementById("notes-delete").addEventListener("click", function () {
      var n = activeNote();
      if (!n) return;
      if (!global.confirm("Delete this note?")) return;
      state.notes = state.notes.filter(function (x) {
        return x.id !== n.id;
      });
      state.activeId = (state.notes[0] && state.notes[0].id) || null;
      saveJSON(SK.notesV2, state.notes);
      if (!state.activeId) {
        state.notes.push({ id: uid(), title: "Scratch", body: "", tags: "general", pinned: false, updatedAt: Date.now() });
        state.activeId = state.notes[0].id;
        saveJSON(SK.notesV2, state.notes);
      }
      fillEditor();
      renderList();
      toast("Note deleted");
    });

    document.getElementById("notes-pin").addEventListener("click", function () {
      var n = activeNote();
      if (!n) return;
      n.pinned = !n.pinned;
      saveJSON(SK.notesV2, state.notes);
      document.getElementById("notes-pin").classList.toggle("active", n.pinned);
      renderList();
    });

    document.getElementById("notes-search").addEventListener("input", function () {
      renderList();
    });

    document.getElementById("notes-save-now").addEventListener("click", function () {
      flushEditor();
      toast("Notes saved");
      document.getElementById("notes-status").textContent = "Saved";
      renderList();
    });
  }

  global.TMNotes = { init: init, flush: flushEditor };
})(window);
