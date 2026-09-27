import React, { createContext, useContext, useEffect, useState } from 'react';
import { publicSiteApi } from '@/api/publicSite';

const BrandContext = createContext('INACORTS');

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState('INACORTS');

  useEffect(() => {
    const load = () => {
      publicSiteApi.site()
        .then((site) => setBrand(site.company_name?.trim() || 'INACORTS'))
        .catch(() => undefined);
    };
    load();
    window.addEventListener('site-meta', load);
    return () => window.removeEventListener('site-meta', load);
  }, []);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
};

export const useBrand = (): string => useContext(BrandContext);
