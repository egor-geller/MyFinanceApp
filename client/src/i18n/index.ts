import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import en from './locales/en';
import he from './locales/he';

const savedLang = localStorage.getItem('lang') ?? 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

applyLangToDocument(savedLang);

export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem('lang', lang);
  applyLangToDocument(lang);
}

function applyLangToDocument(lang: string) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}

export function useCurrencyLabel() {
  const { t } = useTranslation();
  return (code: string) => t(`currency.${code}`, { defaultValue: code });
}

export default i18n;
