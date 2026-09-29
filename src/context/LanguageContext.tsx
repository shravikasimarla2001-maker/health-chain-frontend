import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, normalizeLanguage, getTranslation } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'hsc_language_preference';

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeLanguage(saved);
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang: string) => {
    const normalized = normalizeLanguage(newLang);
    setLanguageState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
    document.documentElement.lang = normalized;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: string, fallback?: string) => {
      return getTranslation(key, language, fallback);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
