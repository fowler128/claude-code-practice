"use client";

import { createContext, useContext } from "react";

/**
 * Phase 1 note:
 * Business domain state and event-driven module logic are intentionally deferred.
 * This provider is a placeholder to keep a clean extension point for later phases.
 */

const CrmContext = createContext<Record<string, never>>({});

export function CrmProvider({ children }: { children: React.ReactNode }) {
  return <CrmContext.Provider value={{}}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  return useContext(CrmContext);
}
