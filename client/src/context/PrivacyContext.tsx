import { createContext, useContext, useState, ReactNode } from 'react';

interface PrivacyContextValue {
  privacyMode: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({ privacyMode: false, togglePrivacy: () => {} });

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem('privacyMode') === 'true');

  function togglePrivacy() {
    setPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('privacyMode', String(next));
      return next;
    });
  }

  return <PrivacyContext.Provider value={{ privacyMode, togglePrivacy }}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
