import React from 'react';
import { useTranslation } from 'react-i18next';
import { siteText, useSiteLabel } from '@/utils/siteText';
import { whatsappUrl } from '@/utils/whatsapp';
import type { SalesConsultant, SiteContent } from '@/types/site';

const link = 'underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-600 dark:decoration-slate-600';

const PhoneIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.03L7.91 9.91a12 12 0 006.18 6.18l1.6-1.25a1 1 0 011.03-.27l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.61 21 3 14.39 3 6V5z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 3C7.31 3 3.47 6.84 3.47 11.57c0 1.5.39 2.96 1.14 4.25L3 21l5.32-1.39a8.5 8.5 0 003.72.86h.01c4.73 0 8.57-3.84 8.57-8.57C20.62 6.84 16.77 3 12.04 3zm4.95 12.16c-.2.57-1.18 1.04-1.64 1.1-.42.06-.96.09-1.55-.1-.36-.11-.82-.26-1.41-.51-2.48-1.07-4.1-3.57-4.22-3.74-.12-.17-1-1.33-1-2.54s.63-1.8.86-2.05c.22-.24.49-.3.65-.3h.47c.15 0 .35-.06.55.42.2.49.69 1.7.75 1.82.06.12.1.27.02.43-.08.17-.12.27-.24.41-.12.14-.25.32-.36.43-.12.12-.24.24-.1.47.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.15z" />
  </svg>
);

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Row: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  iconClass: string;
}> = ({ icon, label, value, href, external, iconClass }) => {
  const body = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${iconClass}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{label}</span>
        <span className={`mt-0.5 block truncate text-sm ${href ? link : 'text-stone-400 dark:text-slate-500'}`}>{value}</span>
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-3 py-3">{body}</div>;
  }

  return (
    <a
      href={href}
      className="flex items-center gap-3 py-3"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {body}
    </a>
  );
};

export const ConsultantCard: React.FC<{ person: SalesConsultant; content: SiteContent }> = ({ person, content }) => {
  const { i18n } = useTranslation();
  const label = useSiteLabel(content);
  const phone = person.phone.trim();
  const email = person.email?.trim() || '';
  const whatsapp = phone ? whatsappUrl(phone, siteText(content, 'consultant_whatsapp', i18n.language)) : null;
  const tel = phone ? `tel:${phone.replace(/\s/g, '')}` : '';

  const initial = person.name.trim().charAt(0).toUpperCase();

  return (
    <article>
      <div className="flex items-center gap-4">
        {person.photo_url ? (
          <img src={person.photo_url} alt="" className="h-16 w-16 shrink-0 bg-stone-200 object-cover dark:bg-slate-800" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-stone-200 text-lg font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{initial}</span>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{label('salesConsultant')}</p>
          <h3 className="mt-1 font-medium text-2xl leading-tight text-slate-950 dark:text-white">{person.name}</h3>
        </div>
      </div>
      <div className="mt-4 divide-y divide-stone-200 border-y border-stone-200 dark:divide-slate-800 dark:border-slate-800">
        <Row
          icon={<PhoneIcon />}
          label={label('phone')}
          value={phone || '—'}
          href={tel || undefined}
          iconClass="text-slate-800 dark:text-slate-100"
        />
        <Row
          icon={<WhatsAppIcon />}
          label={label('whatsapp')}
          value={phone || '—'}
          href={whatsapp || undefined}
          external
          iconClass={whatsapp ? 'text-[#25D366]' : 'text-stone-400 dark:text-slate-500'}
        />
        <Row
          icon={<MailIcon />}
          label={label('consultantEmail')}
          value={email || '—'}
          href={email ? `mailto:${email}` : undefined}
          iconClass={email ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400 dark:text-slate-500'}
        />
      </div>
    </article>
  );
};
