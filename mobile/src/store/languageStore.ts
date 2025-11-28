import {create} from 'zustand';
import i18n from '../i18n';

type Language = 'ko' | 'en' | 'ja';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>(set => ({
  language: i18n.language as Language,
  setLanguage: (language: Language) => {
    i18n.changeLanguage(language);
    set({language});
  },
}));
