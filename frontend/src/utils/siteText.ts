import { useTranslation } from 'react-i18next';
import type { FaqItem, SalesConsultant, SiteContent } from '@/types/site';

export function salesConsultants(content: SiteContent | null): SalesConsultant[] {
  return (content?.sales_consultants ?? []).filter((person) => person.name.trim());
}

export function siteText(content: SiteContent, field: string, language: string): string {
  const lang = language.toLowerCase().startsWith('en') ? 'en' : 'tr';
  const record = content as unknown as Record<string, string>;
  return record[`${field}_${lang}`] || record[`${field}_tr`] || '';
}

function fill(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return Object.entries(vars).reduce(
    (current, [name, value]) => current.split(`{{${name}}}`).join(String(value)),
    text,
  );
}

export function siteLabel(
  content: SiteContent | null | undefined,
  key: string,
  language: string,
  fallback: string,
  vars?: Record<string, string | number>,
): string {
  const lang = language.toLowerCase().startsWith('en') ? 'en' : 'tr';
  const labels = content?.labels ?? {};
  const stored = labels[`${key}_${lang}`] ?? (lang === 'en' ? labels[`${key}_tr`] : undefined);
  const text = stored != null && stored.trim() ? stored : fallback;
  return fill(text, vars);
}

export function useSiteLabel(content: SiteContent | null | undefined) {
  const { t, i18n } = useTranslation();
  return (key: string, vars?: Record<string, string | number>) => siteLabel(
    content,
    key,
    i18n.language,
    String(t(`site.${key}`, vars)),
    vars,
  );
}

export function visibleFaqs(content: SiteContent | null | undefined, language: string): Array<{ question: string; answer: string }> {
  const lang = language.toLowerCase().startsWith('en') ? 'en' : 'tr';
  return (content?.faqs ?? []).flatMap((item: FaqItem) => {
    const question = (lang === 'en' ? item.question_en : item.question_tr).trim() || item.question_tr.trim();
    const answer = (lang === 'en' ? item.answer_en : item.answer_tr).trim() || item.answer_tr.trim();
    if (!question) return [];
    return [{ question, answer }];
  });
}
