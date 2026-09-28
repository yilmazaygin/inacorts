import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SiteChrome } from '@/components/site/SiteChrome';
import { publicSiteApi } from '@/api/publicSite';
import { agreementHref } from '@/utils/agreementLink';
import { useSiteLabel } from '@/utils/siteText';
import type { SiteContent } from '@/types/site';

const textLink = 'underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-600 dark:decoration-slate-600';

export const HowToOrderPage: React.FC = () => {
  const location = useLocation();
  const here = `${location.pathname}${location.search}${location.hash}`;
  const [content, setContent] = useState<SiteContent | null>(null);
  const label = useSiteLabel(content);
  const steps = [1, 2, 3, 4].map((item) => ({
    title: label(`howToOrderStep${item}Title`),
    body: label(`howToOrderStep${item}`),
  }));

  useEffect(() => {
    publicSiteApi.site().then(setContent).catch(() => setContent(null));
  }, []);

  return (
    <SiteChrome content={content}>
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="font-semibold text-3xl tracking-tight text-slate-950 dark:text-white sm:text-5xl">{label('howToOrder')}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">{label('howToOrderLead')}</p>
        <ol className="mt-12 border-t border-stone-200 dark:border-slate-800">
          {steps.map((step, index) => (
            <li key={step.title} className="grid gap-3 border-b border-stone-200 py-8 dark:border-slate-800 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-8">
              <p className="font-medium text-3xl text-amber-700/80 dark:text-amber-400/90">{String(index + 1).padStart(2, '0')}</p>
              <div>
                <h2 className="font-medium text-2xl tracking-tight text-slate-950 dark:text-white">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{label('howToOrderClose')}</p>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          {label('orderAgreementBefore')}{' '}
          <Link to={agreementHref(here)} className={textLink}>
            {label('orderAgreementName')}
          </Link>
          {label('orderAgreementAfter')}
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            to="/urunler"
            className="inline-flex items-center bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-500"
          >
            {label('browseProducts')}
          </Link>
        </div>
      </article>
    </SiteChrome>
  );
};
