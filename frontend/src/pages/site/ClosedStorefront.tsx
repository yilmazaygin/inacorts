import React, { useEffect } from 'react';
import { useBrand } from '@/contexts/BrandContext';

/** Empty screen used while the storefront is closed. Management stays at /admin. */
export const ClosedStorefront: React.FC = () => {
  const brand = useBrand();

  useEffect(() => {
    document.title = brand;
  }, [brand]);

  return <div className="min-h-screen bg-stone-50 dark:bg-slate-950" />;
};
