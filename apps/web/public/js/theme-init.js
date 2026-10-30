(function () {
  // Repeats the storage key and link ids as literals because it runs before the app and cannot import TS.
  let theme;
  try {
    theme = localStorage.getItem('pr-theme');
  } catch {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    return;
  }
  const light = document.getElementById('theme-light');
  const dark = document.getElementById('theme-dark');
  if (!light || !dark) {
    return;
  }
  if (theme === 'dark') {
    dark.media = 'all';
    light.media = 'not all';
  } else {
    light.media = 'all';
    dark.media = 'not all';
  }
})();
