import { TranslocoTestingOptions } from '@jsverse/transloco';

/** Mirrors the merged feature dictionaries for TranslocoTestingModule. */
export const TESTING_LANGS = {
  en: {
    layout: {
      nav: {
        home: 'Home',
        registry: 'Registry',
        charts: 'Charts',
        about: 'About',
        main: 'Main',
      },
      menu: 'Menu',
    },
    home: {
      title: 'Home',
      plateNumber: 'Licence plate number',
    },
    plate: { title: 'Plate' },
    voivodeship: { title: 'Voivodeship' },
    registry: { title: 'Registry' },
    charts: { title: 'Charts' },
    about: { title: 'About' },
    theme: {
      switchToDark: 'Switch to dark theme',
      switchToLight: 'Switch to light theme',
    },
  },
  pl: {
    layout: {
      nav: {
        home: 'Strona główna',
        registry: 'Rejestr',
        charts: 'Wykresy',
        about: 'O aplikacji',
        main: 'Menu główne',
      },
      menu: 'Menu',
    },
    home: {
      title: 'Strona główna',
      plateNumber: 'Numer rejestracyjny',
    },
    plate: { title: 'Tablica rejestracyjna' },
    voivodeship: { title: 'Województwo' },
    registry: { title: 'Rejestr' },
    charts: { title: 'Wykresy' },
    about: { title: 'O aplikacji' },
    theme: {
      switchToDark: 'Przełącz na ciemny motyw',
      switchToLight: 'Przełącz na jasny motyw',
    },
  },
};

export const TRANSLOCO_TESTING: TranslocoTestingOptions = {
  langs: TESTING_LANGS,
  preloadLangs: true,
  translocoConfig: {
    reRenderOnLangChange: true,
    availableLangs: ['en', 'pl'],
    defaultLang: 'en',
  },
};
