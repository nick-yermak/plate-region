(function () {
  // Repeats the storage key, the pl prefix check and the dictionary URL as
  // literals because this script runs before the app and cannot import TS.
  let stored;
  try {
    stored = localStorage.getItem('pr-lang');
  } catch {
    stored = null;
  }
  let lang;
  if (stored === 'en' || stored === 'pl') {
    lang = stored;
  } else {
    const navigatorLanguage =
      (typeof navigator !== 'undefined' && navigator.language) || '';
    lang = navigatorLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en';
  }
  document.documentElement.lang = lang;
  const link = document.createElement('link');
  link.setAttribute('rel', 'preload');
  link.setAttribute('as', 'fetch');
  link.setAttribute('href', 'i18n/' + lang + '.json');
  link.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(link);
})();
