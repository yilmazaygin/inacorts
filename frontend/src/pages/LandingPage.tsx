import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { publicSiteApi } from '@/api/publicSite';
import { NO_PRODUCT_IMAGE } from '@/components/common/ProductImage';
import { formatCurrency } from '@/utils/format';
import { PersonPhoto } from '@/components/site/PersonPhoto';
import { salesConsultants, siteText } from '@/utils/siteText';
import type { PublicCategory, PublicProduct, SiteContent } from '@/types/site';

const SlowRail: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let direction = 1;
    let holdUntil = 0;
    let last = performance.now();
    const speed = 28;

    const tick = (now: number) => {
      const delta = Math.min(now - last, 48) / 1000;
      last = now;
      const max = element.scrollWidth - element.clientWidth;
      if (!paused.current && max > 8 && now >= holdUntil) {
        element.scrollLeft += direction * speed * delta;
        if (element.scrollLeft >= max - 1) {
          element.scrollLeft = max;
          direction = -1;
          holdUntil = now + 700;
        } else if (element.scrollLeft <= 0) {
          element.scrollLeft = 0;
          direction = 1;
          holdUntil = now + 700;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={scroller}
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; }}
      onPointerDown={() => { paused.current = true; }}
      onPointerUp={() => { paused.current = false; }}
      className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([publicSiteApi.site(), publicSiteApi.categories(), publicSiteApi.products()])
      .then(([site, cats, items]) => {
        if (!active) return;
        setContent(site);
        setCategories(cats);
        setProducts(items);
      })
      .catch(() => {
        if (active) setError(t('errors.loadFailed'));
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash || !content) return;
    const timer = window.setTimeout(() => {
      const section = document.getElementById(hash);
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [location.hash, content]);

  const featured = useMemo(() => {
    const picked: PublicProduct[] = [];
    const seen = new Set<number>();
    for (const category of categories) {
      const product = products.find((item) => item.category_id === category.id);
      if (product) {
        picked.push(product);
        seen.add(product.id);
      }
    }
    for (const product of products) {
      if (picked.length >= 8) break;
      if (!seen.has(product.id)) picked.push(product);
    }
    return picked.slice(0, 8);
  }, [categories, products]);

  const text = (field: string) => (content ? siteText(content, field, i18n.language) : '');
  const aboutParagraphs = text('about').split(/\n\n+/).filter(Boolean);

  return (
    <SiteChrome content={content}>
      {!content && !error && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}
      {error && <p className="px-4 py-16 text-center text-red-600">{error}</p>}
      {content && (
        <>
          <section className="text-slate-900 dark:text-white">
            <div className="mx-auto max-w-3xl px-4 py-8 text-center md:py-12">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{text('hero_title')}</h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">{text('hero_subtitle')}</p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/urunler"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3.5 text-sm font-semibold text-slate-950"
                >
                  {t('site.browseProducts')}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <a
                  href="#iletisim"
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById('iletisim')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.pushState(null, '', '#iletisim');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  {t('site.getInTouch')}
                </a>
              </div>
            </div>
          </section>

          <section className="mx-auto min-w-0 max-w-6xl overflow-x-clip px-4 pb-8">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              <Link to="/urunler" className="inline-flex items-center gap-1 hover:text-amber-700 dark:hover:text-amber-400">
                {t('site.categories')}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </h2>
            <SlowRail>
              {categories.map((category) => {
                const cover = products.find((item) => item.category_id === category.id);
                return (
                  <Link
                    key={category.id}
                    to={`/urunler?kategori=${category.id}`}
                    className="group relative w-52 shrink-0 overflow-hidden rounded-2xl border border-stone-200 sm:w-60 dark:border-slate-800"
                  >
                    <img
                      src={category.image_url || cover?.image_url || NO_PRODUCT_IMAGE}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                      <p className="text-sm font-semibold">{category.name}</p>
                      <p className="mt-0.5 text-xs text-slate-300">{t('site.productCount', { count: category.product_count })}</p>
                    </div>
                  </Link>
                );
              })}
            </SlowRail>
          </section>

          <section className="overflow-x-clip pb-10">
            <div className="mx-auto min-w-0 max-w-6xl overflow-x-clip px-4">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">
                <Link to="/urunler" className="inline-flex items-center gap-1 hover:text-amber-700 dark:hover:text-amber-400">
                  {t('site.featured')}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </h2>
              <SlowRail>
                {featured.map((product) => (
                  <Link key={product.id} to={`/urunler?urun=${product.id}`} className="w-44 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:w-52">
                    <div className="aspect-square bg-stone-100 dark:bg-slate-800">
                      <img src={product.image_url || NO_PRODUCT_IMAGE} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{product.category_name}</p>
                      <p className="mt-1 line-clamp-2 min-h-10 text-sm font-medium leading-5">{product.name}</p>
                      <p className="mt-2 text-center text-sm font-semibold tabular-nums">{formatCurrency(product.list_price)}</p>
                    </div>
                  </Link>
                ))}
              </SlowRail>
            </div>
          </section>

          <section id="hakkimizda" className="scroll-mt-20 px-4 pb-10">
            <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white px-5 py-8 text-center dark:border-slate-800 dark:bg-slate-900 md:px-8 md:text-left">
              <h2 className="text-2xl font-semibold tracking-tight">{t('site.about')}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {aboutParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>

          <section id="iletisim" className="scroll-mt-24 px-4 pb-12">
            <div className="mx-auto max-w-6xl">
              <div className="mx-auto max-w-xl text-center">
                <h2 className="text-2xl font-semibold tracking-tight">{t('site.contact')}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text('contact_intro')}</p>
                <p className="mt-2 text-xs text-slate-400">{content.hours}</p>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {salesConsultants(content).map((advisor) => (
                  <a
                    key={advisor.name}
                    href={advisor.phone ? `tel:${advisor.phone.replace(/\s/g, '')}` : undefined}
                    className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left dark:border-slate-800 dark:bg-slate-900"
                  >
                    <PersonPhoto name={advisor.name} url={advisor.photo_url} />
                    <span className="min-w-0">
                      <span className="block text-base font-semibold">{advisor.name}</span>
                      {advisor.phone && <span className="mt-0.5 block text-sm text-slate-500">{advisor.phone}</span>}
                    </span>
                  </a>
                ))}
                <a href={`mailto:${content.email}`} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left dark:border-slate-800 dark:bg-slate-900">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-slate-400">{t('site.email')}</span>
                    <span className="mt-0.5 block break-all text-sm font-semibold">{content.email}</span>
                  </span>
                </a>
              </div>
            </div>
          </section>
        </>
      )}
    </SiteChrome>
  );
};
