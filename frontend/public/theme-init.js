// Apply the stored preference before the app paints. Storage is optional.
(() => {
  let theme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  try {
    const saved = localStorage.getItem("borrowher-theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch {
    /* Private browsing can disable storage. */
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
