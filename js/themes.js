/* Theme palettes for the cozy CRT portfolio.
   Each sets the CSS custom properties consumed by css/crt.css. */
(function () {
  const THEMES = {
    cozy: {
      label: "cozy",
      swatch: ["#1c1714", "#e8a55c", "#b7c98a"],
      vars: {
        "--bg": "#1c1714", "--bg-soft": "#241d19", "--bg-panel": "#221b17",
        "--fg": "#ece0d0", "--fg-dim": "#b9a892", "--fg-faint": "#7c6f60",
        "--border": "#4a3d33", "--border-bright": "#6b5848",
        "--accent": "#e8a55c", "--accent-2": "#b7c98a", "--accent-3": "#d98a7b",
        "--ok": "#b7c98a", "--warn": "#e8a55c", "--err": "#d98a7b", "--info": "#9bb8c4",
        "--glow": "0.5", "--scan": "0.20",
      },
    },
    tokyonight: {
      label: "tokyo night",
      swatch: ["#1a1b26", "#7aa2f7", "#bb9af7"],
      vars: {
        "--bg": "#1a1b26", "--bg-soft": "#1f2335", "--bg-panel": "#1e2030",
        "--fg": "#c0caf5", "--fg-dim": "#9aa5ce", "--fg-faint": "#565f89",
        "--border": "#2f3549", "--border-bright": "#414868",
        "--accent": "#7aa2f7", "--accent-2": "#9ece6a", "--accent-3": "#bb9af7",
        "--ok": "#9ece6a", "--warn": "#e0af68", "--err": "#f7768e", "--info": "#7dcfff",
        "--glow": "0.55", "--scan": "0.18",
      },
    },
    gruvbox: {
      label: "gruvbox",
      swatch: ["#282828", "#fabd2f", "#b8bb26"],
      vars: {
        "--bg": "#282828", "--bg-soft": "#32302f", "--bg-panel": "#3c3836",
        "--fg": "#ebdbb2", "--fg-dim": "#d5c4a1", "--fg-faint": "#928374",
        "--border": "#504945", "--border-bright": "#665c54",
        "--accent": "#fabd2f", "--accent-2": "#b8bb26", "--accent-3": "#fe8019",
        "--ok": "#b8bb26", "--warn": "#fabd2f", "--err": "#fb4934", "--info": "#83a598",
        "--glow": "0.45", "--scan": "0.20",
      },
    },
    moderndark: {
      label: "modern dark",
      swatch: ["#0d0e10", "#5eead4", "#a1a1aa"],
      vars: {
        "--bg": "#0d0e10", "--bg-soft": "#16181c", "--bg-panel": "#131519",
        "--fg": "#e4e4e7", "--fg-dim": "#a1a1aa", "--fg-faint": "#5c5f66",
        "--border": "#26282e", "--border-bright": "#3a3d45",
        "--accent": "#5eead4", "--accent-2": "#86efac", "--accent-3": "#7dd3fc",
        "--ok": "#86efac", "--warn": "#fcd34d", "--err": "#fda4af", "--info": "#7dd3fc",
        "--glow": "0.35", "--scan": "0.12",
      },
    },
    amber: {
      label: "amber crt",
      swatch: ["#150d00", "#ffb000", "#ffcb52"],
      vars: {
        "--bg": "#150d00", "--bg-soft": "#1d1402", "--bg-panel": "#1b1201",
        "--fg": "#ffb000", "--fg-dim": "#cc8c00", "--fg-faint": "#7a5500",
        "--border": "#3d2c00", "--border-bright": "#5c4200",
        "--accent": "#ffcb52", "--accent-2": "#ffd980", "--accent-3": "#ff9e3b",
        "--ok": "#ffcb52", "--warn": "#ffb000", "--err": "#ff7a3b", "--info": "#ffcb52",
        "--glow": "0.8", "--scan": "0.30",
      },
    },
    green: {
      label: "green crt",
      swatch: ["#001000", "#33ff66", "#9dff9d"],
      vars: {
        "--bg": "#001000", "--bg-soft": "#031703", "--bg-panel": "#021402",
        "--fg": "#33ff66", "--fg-dim": "#23bb49", "--fg-faint": "#147028",
        "--border": "#0d3a16", "--border-bright": "#175a26",
        "--accent": "#5dff8a", "--accent-2": "#9dff9d", "--accent-3": "#33ffcc",
        "--ok": "#5dff8a", "--warn": "#c8ff5d", "--err": "#ff6b6b", "--info": "#5dffd6",
        "--glow": "0.9", "--scan": "0.32",
      },
    },
    solarized: {
      label: "solarized",
      swatch: ["#002b36", "#268bd2", "#b58900"],
      vars: {
        "--bg": "#002b36", "--bg-soft": "#073642", "--bg-panel": "#053541",
        "--fg": "#93a1a1", "--fg-dim": "#839496", "--fg-faint": "#586e75",
        "--border": "#0a4a59", "--border-bright": "#13606f",
        "--accent": "#268bd2", "--accent-2": "#859900", "--accent-3": "#cb4b16",
        "--ok": "#859900", "--warn": "#b58900", "--err": "#dc322f", "--info": "#2aa198",
        "--glow": "0.4", "--scan": "0.16",
      },
    },
  };

  const ORDER = ["cozy", "tokyonight", "gruvbox", "moderndark", "amber", "green", "solarized"];

  function apply(name) {
    const t = THEMES[name] || THEMES.cozy;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    try { localStorage.setItem("portfolio.theme", name); } catch (e) {}
    return name;
  }

  function init() {
    let saved = "cozy";
    try { saved = localStorage.getItem("portfolio.theme") || "cozy"; } catch (e) {}
    if (!THEMES[saved]) saved = "cozy";
    apply(saved);
    return saved;
  }

  window.THEMES = THEMES;
  window.THEME_ORDER = ORDER;
  window.applyTheme = apply;
  window.initTheme = init;
})();
