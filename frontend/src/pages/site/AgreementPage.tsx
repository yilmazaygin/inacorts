import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { publicSiteApi } from '@/api/publicSite';
import { formatDateTime } from '@/utils/format';
import type { PublicAgreement, SiteContent } from '@/types/site';

export const AgreementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [agreement, setAgreement] = useState<PublicAgreement | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([publicSiteApi.site(), publicSiteApi.agreement()])
      .then(([site, text]) => {
        setContent(site);
        setAgreement(text);
      })
      .catch(() => setError(t('errors.loadFailed')));
  }, [t]);

  const body = agreement
    ? (i18n.language.startsWith('en') ? agreement.body_en : agreement.body_tr)
    : '';

  return (
    <SiteChrome content={content}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {!agreement && !error && (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {error && <p className="text-center text-red-600">{error}</p>}
        {agreement && (
          <>
            <p className="text-sm text-slate-500">{t('site.lastEdited', { date: formatDateTime(agreement.updated_at) })}</p>
            <h1 className="mt-2 text-3xl font-semibold">{t('site.userAgreement')}</h1>
            <div className="mt-6 whitespace-pre-wrap text-base leading-7 text-slate-700 dark:text-slate-200">
              {body}
            </div>
          </>
        )}
      </div>
    </SiteChrome>
  );
};
