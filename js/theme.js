/**
 * UI + syntax highlighting themes: system preference, persistence, smooth transitions.
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
  var HL_DARK = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
  var HL_LIGHT = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";

  function saveJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function prefersDark() {
    return global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function effectiveUiDark(scheme) {
    if (scheme === "system" || !scheme) return prefersDark();
    return scheme === "dark";
  }

  function applyUiScheme(scheme, opts) {
    var dark = effectiveUiDark(scheme);
    var root = document.documentElement;
    if (!opts || !opts.skipTransition) {
      root.classList.add("theme-transitioning");
      setTimeout(function () {
        root.classList.remove("theme-transitioning");
      }, 320);
    }
    root.classList.toggle("theme-light", !dark);
    var uiBtn = document.getElementById("btn-ui-theme");
    if (uiBtn) {
      uiBtn.textContent = dark ? "☾" : "☀";
      uiBtn.title = "Theme: " + (scheme === "system" ? "system (" + (dark ? "dark" : "light") + ")" : dark ? "dark" : "light");
    }
    syncHljs(!dark);
  }

  function syncHljs(uiIsLight) {
    var link = document.getElementById("hljs-theme");
    if (!link) return;
    var codePref = loadJSON(SK.codeTheme, { auto: true, dark: true });
    var useLightHl = uiIsLight || (!codePref.auto && !codePref.dark);
    link.href = useLightHl ? HL_LIGHT : HL_DARK;
  }

  function persistScheme(scheme) {
    saveJSON(SK.theme, { scheme: scheme });
  }

  function migrateLegacy() {
    var cur = loadJSON(SK.theme, null);
    if (cur && cur.scheme) return cur.scheme;
    if (cur && cur.mode) return cur.mode === "light" ? "light" : "dark";
    return "system";
  }

  function init() {
    var scheme = migrateLegacy();
    applyUiScheme(scheme, { skipTransition: true });
    persistScheme(scheme);

    if (global.matchMedia) {
      var mq = global.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", function () {
        var s = migrateLegacy();
        if (s === "system") applyUiScheme("system", { skipTransition: true });
      });
    }

    var uiBtn = document.getElementById("btn-ui-theme");
    if (uiBtn) {
      uiBtn.addEventListener("click", function () {
        var s = migrateLegacy();
        var order = ["system", "dark", "light"];
        var next = order[(order.indexOf(s) + 1 + order.length) % order.length];
        persistScheme(next);
        applyUiScheme(next);
      });
    }

    var codeBtn = document.getElementById("btn-code-theme");
    if (codeBtn) {
      var codePref = loadJSON(SK.codeTheme, { auto: true, dark: true });
      if (typeof codePref.dark !== "boolean") codePref.dark = true;
      codeBtn.addEventListener("click", function () {
        var uiLight = document.documentElement.classList.contains("theme-light");
        var cp = loadJSON(SK.codeTheme, { auto: true, dark: true });
        if (cp.auto) {
          cp = { auto: false, dark: !cp.dark };
        } else {
          cp = { auto: true, dark: true };
        }
        saveJSON(SK.codeTheme, cp);
        syncHljs(uiLight);
        toast(cp.auto ? "Code theme: follow UI" : "Code theme: " + (cp.dark ? "dark" : "light"));
      });
    }

    var initialCode = loadJSON(SK.codeTheme, { auto: true, dark: true });
    if (!initialCode.auto && typeof initialCode.dark === "boolean") {
      document.getElementById("hljs-theme").href = initialCode.dark ? HL_DARK : HL_LIGHT;
    }
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

  global.TMTheme = { init: init, effectiveUiDark: effectiveUiDark, syncHljs: syncHljs };
})(window);
