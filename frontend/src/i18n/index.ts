import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('language') || 'tr';

const applyDocumentLanguage = (language: string) => {
  document.documentElement.lang = language.startsWith('en') ? 'en' : 'tr';
};

applyDocumentLanguage(savedLanguage);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
