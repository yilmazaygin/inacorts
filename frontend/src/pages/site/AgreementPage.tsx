import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { publicSiteApi } from '@/api/publicSite';
import { safeReturnPath } from '@/utils/agreementLink';
import { formatDateTime } from '@/utils/format';
import { useSiteLabel } from '@/utils/siteText';
import type { PublicAgreement, SiteContent } from '@/types/site';

type Block =
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; text: string };

type Section = { title: string | null; blocks: Block[] };

const heading = (line: string) => line.length <= 72 && !/[.!?…:;]$/.test(line);

function sectionsFrom(body: string): Section[] {
  const chunks = body.split(/\n\n+/).map((chunk) => chunk.trim()).filter(Boolean);
  const sections: Section[] = [];

  chunks.forEach((chunk) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 1 && heading(lines[0])) {
      sections.push({ title: lines[0], blocks: [] });
      return;
    }
    const unordered = lines.every((line) => /^[-*•]\s+/.test(line));
    const ordered = lines.every((line) => /^\d+[.)]\s+/.test(line));
    const block: Block = unordered
      ? { kind: 'list', ordered: false, items: lines.map((line) => line.replace(/^[-*•]\s+/, '')) }
      : ordered
        ? { kind: 'list', ordered: true, items: lines.map((line) => line.replace(/^\d+[.)]\s+/, '')) }
        : { kind: 'paragraph', text: lines.join('\n') };
    if (sections.length === 0) sections.push({ title: null, blocks: [] });
    sections[sections.length - 1].blocks.push(block);
  });

  return sections.filter((section) => section.title || section.blocks.length > 0);
}

const AgreementBody: React.FC<{ body: string }> = ({ body }) => {
  const sections = sectionsFrom(body);
  return (
    <div className="agreement-body mt-8 border-t border-stone-200 dark:border-slate-800">
      {sections.map((section, index) => (
        <section key={`${section.title ?? 'p'}-${index}`} className="border-b border-stone-200 py-6 dark:border-slate-800">
          {section.title && (
            <h2 className="font-medium text-2xl tracking-tight text-slate-950 dark:text-white">{section.title}</h2>
          )}
          <div className={section.title ? 'mt-3 space-y-4' : 'space-y-4'}>
            {section.blocks.map((block, blockIndex) => (
              block.kind === 'paragraph' ? (
                <p key={blockIndex} className="whitespace-pre-wrap text-base leading-7 text-slate-700 dark:text-slate-200">{block.text}</p>
              ) : block.ordered ? (
                <ol key={blockIndex} className="list-decimal space-y-2 pl-5 text-base leading-7 text-slate-700 dark:text-slate-200">
                  {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ol>
              ) : (
                <ul key={blockIndex} className="list-disc space-y-2 pl-5 text-base leading-7 text-slate-700 marker:text-amber-700 dark:text-slate-200 dark:marker:text-amber-400">
                  {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              )
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export const AgreementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const backTo = safeReturnPath(params.get('geri'))
    ?? safeReturnPath((location.state as { from?: string } | null)?.from)
    ?? '/';
  const [content, setContent] = useState<SiteContent | null>(null);
  const [agreement, setAgreement] = useState<PublicAgreement | null>(null);
  const [error, setError] = useState('');
  const label = useSiteLabel(content);

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
      <article className="agreement-sheet mx-auto max-w-3xl px-4 py-10 md:py-14">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 print:hidden dark:hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {label('goBack')}
        </button>
        {!agreement && !error && (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {error && <p className="py-10 text-center text-red-600">{error}</p>}
        {agreement && (
          <>
            <h1 className="mt-8 font-semibold text-3xl tracking-tight text-slate-950 dark:text-white sm:text-5xl">{label('userAgreement')}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-950 dark:text-white">{label('agreementLanguage')}</span>
                <span className="mx-2 text-stone-300 dark:text-slate-600" aria-hidden="true">·</span>
                <span>{label('lastEdited', { date: formatDateTime(agreement.updated_at) })}</span>
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="text-sm text-slate-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-600 print:hidden dark:text-white dark:decoration-slate-600"
              >
                {label('printAgreement')}
              </button>
            </div>
            <AgreementBody body={body} />
          </>
        )}
      </article>
    </SiteChrome>
  );
};
