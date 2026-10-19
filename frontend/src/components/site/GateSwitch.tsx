import React from 'react';
import { useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { isAdminPath, useGate } from '@/contexts/GateContext';
import { LoginClosedPage } from '@/pages/auth/LoginClosedPage';
import { ClosedStorefront } from '@/pages/site/ClosedStorefront';
import { StandbyPage } from '@/pages/site/StandbyPage';

const GateSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-slate-950">
    <LoadingSpinner size="lg" />
  </div>
);

export const GateSwitch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const gate = useGate();
  const { pathname } = useLocation();

  if (!gate.ready) return <GateSpinner />;

  const admin = isAdminPath(pathname);
  if (gate.pages === 'page' && (!admin || gate.cover_admin)) return <StandbyPage />;
  if (gate.pages === 'closed' && !admin) return <ClosedStorefront />;
  if (gate.login_locked && admin) return <LoginClosedPage message={gate.login_message} />;
  return <>{children}</>;
};
