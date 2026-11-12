(function () {
  var root = document.documentElement;
  var stored = {};
  try {
    stored = JSON.parse(localStorage.getItem("logibot.preferences") || "{}") || {};
  } catch (error) {
    stored = {};
  }
  function matches(query) {
    return !!(window.matchMedia && window.matchMedia(query).matches);
  }
  var theme = stored.theme === "light" ? "light" : stored.theme === "system" && matches("(prefers-color-scheme: light)") ? "light" : "dark";
  var contrast = stored.contrast === "more" || stored.contrast === "default" ? stored.contrast : matches("(prefers-contrast: more)") ? "more" : "default";
  var reduce = stored.motion === "reduce" || (stored.motion !== "full" && matches("(prefers-reduced-motion: reduce)"));
  root.classList.add(theme);
  root.dataset.text = stored.textSize === "large" || stored.textSize === "larger" ? stored.textSize : "default";
  root.dataset.contrast = contrast;
  root.dataset.motion = reduce ? "reduce" : "full";
  root.dataset.palette = ["redGreen", "blueYellow", "monochrome"].indexOf(stored.palette) >= 0 ? stored.palette : "default";
})();
