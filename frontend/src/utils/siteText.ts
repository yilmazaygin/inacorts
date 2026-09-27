import type { SalesConsultant, SiteContent } from '@/types/site';

export function salesConsultants(content: SiteContent | null): SalesConsultant[] {
  return (content?.sales_consultants ?? []).filter((person) => person.name.trim());
}

export function siteText(content: SiteContent, field: string, language: string): string {
  const lang = language.toLowerCase().startsWith('en') ? 'en' : 'tr';
  const record = content as unknown as Record<string, string>;
  return record[`${field}_${lang}`] || record[`${field}_tr`] || '';
}
