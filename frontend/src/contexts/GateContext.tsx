import React, { createContext, useContext, useEffect, useState } from 'react';
import { publicSiteApi } from '@/api/publicSite';
import type { SiteGate } from '@/types/site';

const OPEN: SiteGate = {
  login_locked: false,
  login_message: '',
  pages: 'open',
  cover_admin: false,
};

interface GateContextValue extends SiteGate {
  ready: boolean;
}

const GateContext = createContext<GateContextValue>({ ...OPEN, ready: false });

const normalize = (value: SiteGate): SiteGate => {
  const pages = value.pages === 'closed' || value.pages === 'page' ? value.pages : 'open';
  return {
    login_locked: Boolean(value.login_locked),
    login_message: typeof value.login_message === 'string' ? value.login_message : '',
    pages,
    cover_admin: pages === 'page' && Boolean(value.cover_admin),
  };
};

export const GateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gate, setGate] = useState<SiteGate>(OPEN);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = normalize(await publicSiteApi.gate());
        if (!cancelled) setGate(next);
      } catch {
        if (!cancelled) setGate(OPEN);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    load();
    const timer = window.setInterval(load, 8000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <GateContext.Provider value={{ ...gate, ready }}>{children}</GateContext.Provider>;
};

export const useGate = (): GateContextValue => useContext(GateContext);

export const isAdminPath = (pathname: string): boolean =>
  pathname === '/admin' ||
  pathname.startsWith('/admin/') ||
  pathname === '/login' ||
  pathname === '/forgot-password';
