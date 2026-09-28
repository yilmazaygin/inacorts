import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SiteChrome } from '@/components/site/SiteChrome';
import { Modal } from '@/components/common/Modal';
import { NO_PRODUCT_IMAGE } from '@/components/common/ProductImage';
import { publicSiteApi } from '@/api/publicSite';
import { useCart } from '@/contexts/CartContext';
import { agreementHref } from '@/utils/agreementLink';
import { formatCurrency } from '@/utils/format';
import { salesConsultants, useSiteLabel } from '@/utils/siteText';
import { whatsappUrl } from '@/utils/whatsapp';
import type { SiteContent } from '@/types/site';

const textLink = 'text-sm text-slate-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-600 dark:text-white dark:decoration-slate-600';
const primaryButton = 'inline-flex items-center bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-500';

export const CartPage: React.FC = () => {
  const location = useLocation();
  const here = `${location.pathname}${location.search}${location.hash}`;
  const { lines, total, setQuantity, clear } = useCart();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [picking, setPicking] = useState(false);
  const label = useSiteLabel(content);

  useEffect(() => {
    publicSiteApi.site().then(setContent).catch(() => setContent(null));
  }, []);

  const consultants = salesConsultants(content);

  const orderMessage = [
    label('orderIntro'),
    '',
    ...lines.map((line) => `• ${label('orderLine', { count: line.quantity, name: line.name })}`),
  ].join('\n');

  const sendOrder = (phone: string) => {
    const url = whatsappUrl(phone, orderMessage);
    if (!url) return;
    setPicking(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <SiteChrome content={content}>
      <section className="mx-auto max-w-lg px-4 py-8 md:max-w-3xl md:py-12">
        <h1 className="font-semibold text-3xl tracking-tight text-slate-950 dark:text-white">{label('cart')}</h1>
        {lines.length === 0 ? (
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{label('cartEmpty')}</p>
        ) : (
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
            {label('cartIntroBefore')}{' '}
            <Link to="/nasil-siparis" className={textLink}>{label('cartIntroLink')}</Link>
          </p>
        )}

        {lines.length === 0 ? (
          <Link to="/urunler" className={`${primaryButton} mt-6`}>
            {label('browseProducts')}
          </Link>
        ) : (
          <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_16rem] md:items-start md:gap-10">
            <div>
              <div className="flex items-baseline gap-2 border-b border-stone-200 pb-3 dark:border-slate-800">
                <button type="button" onClick={clear} className="text-sm text-stone-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                  {label('clearCart')}
                </button>
                <span className="text-stone-300 dark:text-slate-600" aria-hidden="true">·</span>
                <p className="text-sm text-slate-600 dark:text-slate-300">{label('productCount', { count })}</p>
              </div>
              <ul>
                {lines.map((line) => (
                  <li key={line.productId} className="border-b border-stone-200 py-5 dark:border-slate-800">
                    <div className="flex items-end gap-3">
                      <img
                        src={line.imageUrl || NO_PRODUCT_IMAGE}
                        alt=""
                        className="h-16 w-16 shrink-0 bg-stone-200 object-cover dark:bg-slate-800"
                      />
                      <div className="min-w-0 flex-1 self-start pt-0.5">
                        <p className="line-clamp-2 font-medium leading-5 text-slate-950 dark:text-white">{line.name}</p>
                        <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                          {label('unitListPrice', { price: formatCurrency(line.price) })}
                        </p>
                      </div>
                      <div className="flex h-16 shrink-0 flex-col items-end justify-between">
                        <p className="font-medium text-base tabular-nums tracking-tight text-slate-950 dark:text-white">{formatCurrency(line.price * line.quantity)}</p>
                        <div className="inline-flex items-center border border-stone-300 dark:border-slate-700">
                          <button type="button" className="flex h-6 w-6 min-h-0 items-center justify-center text-xs leading-none" onClick={() => setQuantity(line.productId, line.quantity - 1)} aria-label="-">−</button>
                          <span className="min-w-5 text-center text-xs tabular-nums">{line.quantity}</span>
                          <button type="button" className="flex h-6 w-6 min-h-0 items-center justify-center text-xs leading-none" onClick={() => setQuantity(line.productId, line.quantity + 1)} aria-label="+">+</button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="mt-6 border-t border-stone-200 pt-5 dark:border-slate-800 md:sticky md:top-24 md:mt-0 md:border-t-0 md:pt-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{label('cartTotal')}</p>
              <p className="mt-1 font-medium text-3xl tabular-nums tracking-tight text-slate-950 dark:text-white">{formatCurrency(total)}</p>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {label('acceptAgreementBefore')}
                <Link to={agreementHref(here)} className="underline decoration-stone-300 underline-offset-4 hover:decoration-amber-600 dark:decoration-slate-600">
                  {label('acceptAgreementName')}
                </Link>
                {label('acceptAgreementAfter')}
              </p>
              <button type="button" onClick={() => setPicking(true)} className={`${primaryButton} mt-4 w-full justify-center`}>
                {label('placeOrder')}
              </button>
            </aside>
          </div>
        )}
      </section>

      <Modal isOpen={picking} onClose={() => setPicking(false)} title={label('pickConsultant')} size="sm" variant="site">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          {label('acceptAgreementBefore')}
          <Link
            to={agreementHref(here)}
            onClick={() => setPicking(false)}
            className="underline decoration-stone-300 underline-offset-4 hover:decoration-amber-600 dark:decoration-slate-600"
          >
            {label('acceptAgreementName')}
          </Link>
          {label('acceptAgreementAfter')}
        </p>
        {consultants.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">{label('noConsultantPhone')}</p>
        ) : (
          <div className="mt-5 divide-y divide-stone-200 border-y border-stone-200 dark:divide-slate-800 dark:border-slate-800">
            {consultants.map((person) => {
              const ready = Boolean(whatsappUrl(person.phone, orderMessage));
              const initial = person.name.trim().charAt(0).toUpperCase();
              return (
                <button
                  key={person.name}
                  type="button"
                  disabled={!ready}
                  onClick={() => sendOrder(person.phone)}
                  className="flex w-full items-center gap-4 py-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {person.photo_url ? (
                    <img src={person.photo_url} alt="" className="h-12 w-12 shrink-0 bg-stone-200 object-cover dark:bg-slate-800" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-stone-200 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{initial}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-lg leading-tight text-slate-950 dark:text-white">{person.name}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                      <span className="truncate">{ready ? person.phone : label('noConsultantPhone')}</span>
                      {ready && (
                        <svg className="h-4 w-4 shrink-0 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12.04 3C7.31 3 3.47 6.84 3.47 11.57c0 1.5.39 2.96 1.14 4.25L3 21l5.32-1.39a8.5 8.5 0 003.72.86h.01c4.73 0 8.57-3.84 8.57-8.57C20.62 6.84 16.77 3 12.04 3zm4.95 12.16c-.2.57-1.18 1.04-1.64 1.1-.42.06-.96.09-1.55-.1-.36-.11-.82-.26-1.41-.51-2.48-1.07-4.1-3.57-4.22-3.74-.12-.17-1-1.33-1-2.54s.63-1.8.86-2.05c.22-.24.49-.3.65-.3h.47c.15 0 .35-.06.55.42.2.49.69 1.7.75 1.82.06.12.1.27.02.43-.08.17-.12.27-.24.41-.12.14-.25.32-.36.43-.12.12-.24.24-.1.47.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.15z" />
                        </svg>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </SiteChrome>
  );
};
