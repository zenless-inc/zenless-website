/* Runs synchronously in <head> (after the stylesheets) so the saved theme is
 * applied before first paint — no flash of the default palette.
 * The list mirrors builtin_themes() in the apps' shared theme.rs; the palettes
 * themselves live in /assets/css/themes.css. */
(function () {
  var themes = [
    ["zenless", "Zenless"],
    ["midnight", "Midnight"],
    ["amoled-purple", "AMOLED Purple"],
    ["amoled-mono", "AMOLED Mono"],
    ["amoled-crimson", "AMOLED Crimson"],
    ["amoled-emerald", "AMOLED Emerald"],
    ["dracula", "Dracula"],
    ["nord", "Nord"],
    ["tokyo-night", "Tokyo Night"],
    ["catppuccin-mocha", "Catppuccin Mocha"],
    ["gruvbox", "Gruvbox"],
    ["rose-pine", "Rosé Pine"],
    ["one-dark", "One Dark"],
    ["monokai-pro", "Monokai Pro"],
    ["everforest", "Everforest"],
    ["kanagawa", "Kanagawa"],
    ["ayu-dark", "Ayu Dark"],
    ["night-owl", "Night Owl"],
    ["github-dark", "GitHub Dark"],
    ["solarized-dark", "Solarized Dark"],
    ["synthwave", "Synthwave"],
    ["neon-cyber", "Neon Cyber"],
    ["night-city", "Night City"],
    ["matrix", "Matrix"],
    ["forest", "Forest"],
    ["ocean", "Ocean"],
    ["sunset", "Sunset"],
    ["espresso", "Espresso"],
    ["high-contrast", "High Contrast"],
    ["paper", "Paper"],
    ["solarized-light", "Solarized Light"],
    ["catppuccin-latte", "Catppuccin Latte"],
    ["lavender", "Lavender"],
    ["sakura", "Sakura"]
  ];
  window.ZENLESS_THEMES = themes;
  window.ZENLESS_THEME_KEY = "zenless-theme";

  var root = document.documentElement;
  root.classList.add("js");

  var saved = null;
  try {
    saved = window.localStorage.getItem(window.ZENLESS_THEME_KEY);
  } catch (e) {
    /* storage blocked (private mode, disabled cookies): use the default */
  }
  var valid = false;
  for (var i = 0; i < themes.length; i++) {
    if (themes[i][0] === saved) valid = true;
  }
  root.setAttribute("data-theme", valid ? saved : "zenless");
})();
