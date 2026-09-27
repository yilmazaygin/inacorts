import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { publicSiteApi } from '@/api/publicSite';
import type { SiteContent } from '@/types/site';

export const HowToOrderPage: React.FC = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState<SiteContent | null>(null);
  const steps = [
    t('site.howToOrderStep1'),
    t('site.howToOrderStep2'),
    t('site.howToOrderStep3'),
    t('site.howToOrderStep4'),
  ];

  useEffect(() => {
    publicSiteApi.site().then(setContent).catch(() => setContent(null));
  }, []);

  return (
    <SiteChrome content={content}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t('site.howToOrder')}</h1>
        <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-200">{t('site.howToOrderLead')}</p>
        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-base leading-7 text-slate-700 dark:text-slate-200">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-slate-950">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-base leading-7 text-slate-700 dark:text-slate-200">{t('site.howToOrderClose')}</p>
        <p className="mt-4 text-base leading-7 text-slate-500">
          {t('site.orderAgreementBefore')}{' '}
          <Link to="/sozlesme" className="font-medium text-slate-700 underline dark:text-slate-200">
            {t('site.orderAgreementName')}
          </Link>
          {t('site.orderAgreementAfter')}
        </p>
      </div>
    </SiteChrome>
  );
};
