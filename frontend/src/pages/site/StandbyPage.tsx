import React from 'react';
import { useGate } from '@/contexts/GateContext';
import { MaintenancePage } from './MaintenancePage';

type LocalModule = {
  default?: React.ComponentType;
  StandbyPage?: React.ComponentType;
  pages?: Record<string, React.ComponentType | undefined>;
};

const localModules = import.meta.glob('./StandbyPage.local.tsx', { eager: true }) as Record<string, LocalModule>;
const local = Object.values(localModules)[0];
const LocalPage = local?.StandbyPage ?? local?.default;

/** Page shown by `pages --page`. A gitignored local file can register named pages. */
export const StandbyPage: React.FC = () => {
  const { page_name } = useGate();
  if (page_name) {
    const Named = local?.pages?.[page_name];
    if (Named) return <Named />;
    return <MaintenancePage />;
  }
  if (LocalPage) return <LocalPage />;
  return <MaintenancePage />;
};
