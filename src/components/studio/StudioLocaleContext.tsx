"use client";

import { createContext, useContext } from "react";
import type { I18nLocale } from "@/src/i18n";

const StudioLocaleContext = createContext<I18nLocale>("en");

export function StudioLocaleProvider({
  locale,
  children,
}: {
  locale: I18nLocale;
  children: React.ReactNode;
}) {
  return (
    <StudioLocaleContext.Provider value={locale}>
      {children}
    </StudioLocaleContext.Provider>
  );
}

export function useStudioLocale(): I18nLocale {
  return useContext(StudioLocaleContext);
}
