import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18next.use(initReactI18next).use(LanguageDetector).use(Backend).init({
  debug: true,
  fallbackLng: "en"
});
