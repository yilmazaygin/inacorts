import React from 'react';
import { MaintenancePage } from './MaintenancePage';

type LocalModule = {
  default?: React.ComponentType;
  StandbyPage?: React.ComponentType;
};

const localModules = import.meta.glob('./StandbyPage.local.tsx', { eager: true }) as Record<string, LocalModule>;
const local = Object.values(localModules)[0];
const LocalPage = local?.StandbyPage ?? local?.default;

/** Page shown by `pages --page`. A gitignored local file replaces the maintenance page. */
export const StandbyPage: React.FC = () => {
  if (LocalPage) return <LocalPage />;
  return <MaintenancePage />;
};
