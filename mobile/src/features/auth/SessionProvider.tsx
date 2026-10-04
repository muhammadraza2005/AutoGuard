import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runtime } from '@/config/runtime';
import { type AppSection, type SessionView } from './access';

type SessionContextValue = {
  session: SessionView | null;
  setPreviewSection: (section: AppSection) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<SessionView | null>(() =>
    runtime.isDemo
      ? { source: 'design-fixture', subject: 'synthetic-preview', sectionGrants: ['consumer'] }
      : null,
  );

  function setPreviewSection(section: AppSection) {
    if (!runtime.isDemo) throw new Error('Preview identities are disabled in live mode.');
    queryClient.clear();
    setSession({
      source: 'design-fixture',
      subject: 'synthetic-preview',
      sectionGrants: section === 'consumer' ? ['consumer'] : ['consumer', section],
    });
  }

  // No local function sets a real session. Add verified server session loading here.
  return <SessionContext.Provider value={{ session, setPreviewSection }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used within SessionProvider.');
  return value;
}

