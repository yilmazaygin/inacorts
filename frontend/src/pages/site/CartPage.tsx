import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { Modal } from '@/components/common/Modal';
import { NO_PRODUCT_IMAGE } from '@/components/common/ProductImage';
import { publicSiteApi } from '@/api/publicSite';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/format';
import { PersonPhoto } from '@/components/site/PersonPhoto';
import { salesConsultants } from '@/utils/siteText';
import type { SiteContent } from '@/types/site';

function whatsappUrl(phone: string, text: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  if (digits.length < 11) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const CartPage: React.FC = () => {
  const { t } = useTranslation();
  const { lines, total, setQuantity, remove, clear } = useCart();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    publicSiteApi.site().then(setContent).catch(() => setContent(null));
  }, []);

  const consultants = salesConsultants(content);

  const orderMessage = [
    t('site.orderIntro'),
    '',
    ...lines.map((line) => `• ${t('site.orderLine', { count: line.quantity, name: line.name })}`),
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
      <div className="mx-auto max-w-lg px-4 py-5 md:max-w-3xl md:py-10">
        {lines.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <h1 className="text-2xl font-semibold">{t('site.cart')}</h1>
            <p className="mt-2 text-sm text-slate-500">{t('site.cartEmpty')}</p>
            <Link to="/urunler" className="mt-6 inline-flex rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950">
              {t('site.browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:items-start md:gap-6">
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{t('site.cart')}</h1>
                <div className="flex items-baseline gap-3">
                  <button
                    type="button"
                    onClick={clear}
                    className="text-sm text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
                  >
                    {t('site.clearCart')}
                  </button>
                  <p className="text-sm text-slate-500">{t('site.productCount', { count })}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-3">
                {lines.map((line) => (
                  <li key={line.productId} className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex gap-3">
                      <img
                        src={line.imageUrl || NO_PRODUCT_IMAGE}
                        alt=""
                        className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl bg-stone-100 object-cover dark:bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-medium leading-5">{line.name}</p>
                          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(line.price * line.quantity)}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {line.categoryName}
                          <span className="px-1.5 text-stone-300 dark:text-slate-600">·</span>
                          {formatCurrency(line.price)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 dark:border-slate-700 dark:bg-slate-950">
                        <button type="button" className="h-8 w-8 text-base leading-none" onClick={() => setQuantity(line.productId, line.quantity - 1)} aria-label="-">−</button>
                        <span className="min-w-5 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
                        <button type="button" className="h-8 w-8 text-base leading-none" onClick={() => setQuantity(line.productId, line.quantity + 1)} aria-label="+">+</button>
                      </div>
                      <button type="button" onClick={() => remove(line.productId)} className="text-xs font-medium text-slate-400 hover:text-red-500">
                        {t('site.remove')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="mt-5 md:sticky md:top-24 md:mt-0">
              <div className="rounded-3xl border border-stone-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-sm text-slate-500">{t('site.cartTotal')}</span>
                  <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  className="mt-4 w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-semibold text-slate-950"
                >
                  {t('site.placeOrder')}
                </button>
                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  {t('site.orderAgreementBefore')}{' '}
                  <Link to="/sozlesme" className="font-medium text-slate-700 underline dark:text-slate-200">
                    {t('site.orderAgreementName')}
                  </Link>
                  {t('site.orderAgreementAfter')}
                </p>
                <p className="mt-3 text-center text-xs leading-5 text-slate-500">{t('site.howToOrderBrief')}</p>
                <Link to="/nasil-siparis" className="mt-2 block text-center text-xs font-medium text-slate-700 underline dark:text-slate-200">
                  {t('site.howToOrder')}
                </Link>
              </div>
            </aside>

            <Modal isOpen={picking} onClose={() => setPicking(false)} title={t('site.pickConsultant')} size="sm">
              <div className="mb-4" style={{ containerType: 'inline-size' }}>
                <p
                  className="whitespace-nowrap text-center leading-5 text-slate-400"
                  style={{ fontSize: 'clamp(8px, 2.45cqi, 13px)' }}
                >
                  {t('site.orderAgreementBefore')}{' '}
                  <Link to="/sozlesme" className="underline decoration-slate-500 underline-offset-2" onClick={() => setPicking(false)}>
                    {t('site.orderAgreementName')}
                  </Link>
                  {t('site.orderAgreementAfter')}
                </p>
              </div>
              <p className="mb-2 text-center text-xs leading-5 text-slate-400">{t('site.howToOrderBrief')}</p>
              <Link
                to="/nasil-siparis"
                onClick={() => setPicking(false)}
                className="mb-4 block text-center text-xs font-medium text-slate-500 underline"
              >
                {t('site.howToOrder')}
              </Link>
              {consultants.length === 0 ? (
                <p className="text-sm text-slate-500">{t('site.noConsultantPhone')}</p>
              ) : (
                <div className="grid gap-2">
                  {consultants.map((person) => {
                    const ready = Boolean(whatsappUrl(person.phone, orderMessage));
                    return (
                      <button
                        key={person.name}
                        type="button"
                        disabled={!ready}
                        onClick={() => sendOrder(person.phone)}
                        className="flex items-center gap-3 rounded-2xl border border-stone-200 px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700"
                      >
                        <PersonPhoto name={person.name} url={person.photo_url} className="h-10 w-10" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{person.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {ready ? person.phone : t('site.noConsultantPhone')}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Modal>
          </div>
        )}
      </div>
    </SiteChrome>
  );
};
