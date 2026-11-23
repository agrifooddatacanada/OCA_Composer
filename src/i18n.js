import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18next.use(initReactI18next).use(LanguageDetector).use(Backend).init({
  debug: true,
  fallbackLng: "en",
  // Strip region subtags (en-US -> en) before resolving a locale file — only "en" and "fr"
  // exist under public/locales, so without this the detector's "en-US" causes a failed fetch,
  // a fallback to "en", and a flash of untranslated keys before the real strings load.
  load: "languageOnly"
  // saveMissing: true
});
