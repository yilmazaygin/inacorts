import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { publicSiteApi } from '@/api/publicSite';
import { NO_PRODUCT_IMAGE } from '@/components/common/ProductImage';
import { formatCurrency } from '@/utils/format';
import { ConsultantCard } from '@/components/site/ConsultantCard';
import { salesConsultants, siteText, useSiteLabel, visibleFaqs } from '@/utils/siteText';
import type { PublicCategory, PublicProduct, SiteContent } from '@/types/site';

const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-in');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.classList.add('is-in');
        observer.disconnect();
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
};

const Glow: React.FC<{ id: number }> = ({ id }) => {
  const skip = useRef(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    setTick((current) => current + 1);
  }, [id]);

  if (tick === 0) return null;
  return <span key={tick} aria-hidden className="slide-glow is-on" />;
};

const HeroFrame: React.FC<{ products: PublicProduct[] }> = ({ products }) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;
  const product = products[index];

  return (
    <figure
      className="hero-rise"
      style={{ animationDelay: '180ms' }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <Link to={`/urunler?urun=${product.id}`} className="relative block aspect-[5/4] overflow-hidden bg-stone-200 dark:bg-slate-800 lg:aspect-[4/5]">
        {products.map((item, slide) => (
          <img
            key={item.id}
            src={item.image_url || NO_PRODUCT_IMAGE}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${slide === index ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <Glow id={product.id} />
        <span className="sr-only">{product.name}</span>
      </Link>
      <figcaption key={product.id} className="slide-fade mt-3 flex items-baseline justify-between gap-4">
        <p className="font-medium text-lg leading-tight text-slate-950 dark:text-white">{product.name}</p>
        <p className="shrink-0 text-sm tabular-nums text-slate-600 dark:text-slate-300">{formatCurrency(product.list_price)}</p>
      </figcaption>
      {count > 1 && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5">
            {products.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.name}
                onClick={() => setIndex(dot)}
                className={`h-8 min-w-0 flex-1 overflow-hidden bg-stone-200 dark:bg-slate-800 ${dot === index ? 'opacity-100 ring-1 ring-inset ring-white' : 'opacity-45'}`}
              >
                <img src={item.image_url || NO_PRODUCT_IMAGE} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={t('common.previous')}
              onClick={() => setIndex((current) => (current - 1 + count) % count)}
              className="flex h-8 w-8 items-center justify-center text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={t('common.next')}
              onClick={() => setIndex((current) => (current + 1) % count)}
              className="flex h-8 w-8 items-center justify-center text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </figure>
  );
};

const SectionTitle: React.FC<{ title: string; action?: React.ReactNode; lead?: string }> = ({ title, action, lead }) => (
  <div className="mb-6 flex items-baseline justify-between gap-4 md:mb-8">
    <div className="min-w-0 max-w-xl">
      <h2 className="font-medium text-3xl tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h2>
      {lead && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{lead}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const textLink = 'text-sm text-slate-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-600 dark:text-white dark:decoration-slate-600';

function splitAbout(paragraph: string) {
  const match = paragraph.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (!match) return { lead: paragraph, rest: '' };
  return { lead: match[1], rest: match[2].trim() };
}

function aboutLead(paragraph: string) {
  return splitAbout(paragraph).lead;
}

function aboutRest(paragraphs: string[]) {
  if (paragraphs.length === 0) return [];
  const rest = splitAbout(paragraphs[0]).rest;
  return [...(rest ? [rest] : []), ...paragraphs.slice(1)];
}

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [masterProduct, setMasterProduct] = useState<PublicProduct | null>(null);
  const [chosenProducts, setChosenProducts] = useState<PublicProduct[]>([]);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const label = useSiteLabel(content);

  useEffect(() => {
    let active = true;
    Promise.all([publicSiteApi.site(), publicSiteApi.categories(), publicSiteApi.products({ page_size: 48 })])
      .then(async ([site, cats, page]) => {
        if (!active) return;
        setContent(site);
        setCategories(cats);
        setProducts(page.items);
        const masterId = site.featured_master_product_id ?? 0;
        const otherIds = (site.featured_product_ids ?? []).filter((id) => id !== masterId);
        const ids = [...(masterId ? [masterId] : []), ...otherIds];
        if (ids.length === 0) {
          setMasterProduct(null);
          setChosenProducts([]);
          return;
        }
        const loaded = await Promise.all(ids.map((id) => publicSiteApi.product(id).catch(() => null)));
        if (!active) return;
        const byId = new Map(loaded.filter((item): item is PublicProduct => Boolean(item)).map((item) => [item.id, item]));
        setMasterProduct(masterId ? byId.get(masterId) ?? null : null);
        setChosenProducts(otherIds.flatMap((id) => {
          const product = byId.get(id);
          return product ? [product] : [];
        }));
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

  const shownCategories = useMemo(() => {
    const ids = content?.featured_category_ids ?? [];
    const byId = new Map(categories.map((category) => [category.id, category]));
    return ids.flatMap((id) => {
      const category = byId.get(id);
      return category ? [category] : [];
    });
  }, [categories, content]);

  const text = (field: string) => (content ? siteText(content, field, i18n.language) : '');
  const aboutParagraphs = text('about').split(/\n\n+/).filter(Boolean);
  const featured = [
    ...(masterProduct ? [masterProduct] : []),
    ...chosenProducts.filter((item) => item.id !== masterProduct?.id),
  ];
  const lead = featured[0] ?? null;
  const rest = featured.slice(1, 5);
  const slides = lead ? [lead, ...rest] : [];
  const consultants = salesConsultants(content);
  const faqs = visibleFaqs(content, i18n.language);

  const goContact = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('iletisim')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', '#iletisim');
  };

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
          <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 md:py-12 lg:grid-cols-12 lg:gap-12">
            <div className={slides.length > 0 ? 'lg:col-span-6' : 'lg:col-span-10'}>
              <h1
                className="hero-rise text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-5xl"
                style={{ animationDelay: '80ms' }}
              >
                {text('hero_title')}
              </h1>
              <p
                className="hero-rise mt-5 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300"
                style={{ animationDelay: '160ms' }}
              >
                {text('hero_subtitle')}
              </p>
              <div className="hero-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: '240ms' }}>
                <Link
                  to="/urunler"
                  className="inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-500"
                >
                  {label('browseProducts')}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <a href="#iletisim" onClick={goContact} className={textLink}>
                  {label('getInTouch')}
                </a>
              </div>
            </div>
            {slides.length > 0 && (
              <div className="lg:col-span-6">
                <HeroFrame products={slides} />
              </div>
            )}
          </section>

          <section className="border-y border-stone-200 dark:border-slate-800">
            <p className="mx-auto max-w-xl px-4 py-6 text-center md:py-8">
              <span className="block text-[11px] font-medium uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                {label('replyGuaranteeKicker')}
              </span>
              <span className="mt-4 block text-balance font-semibold text-[1.85rem] leading-[1.15] tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {label('replyGuaranteeBefore')}{' '}
                <span className="text-amber-600 dark:text-amber-400">{label('replyGuaranteeTime')}</span>
                {label('replyGuaranteeAfter')}
              </span>
            </p>
          </section>

          {shownCategories.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pt-6 pb-3 md:pt-8 md:pb-4">
              <Reveal>
                <SectionTitle
                  title={label('categories')}
                  action={<Link to="/urunler" className={textLink}>{label('viewAll')}</Link>}
                />
              </Reveal>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
                {shownCategories.map((category, index) => {
                  const cover = products.find((item) => item.category_id === category.id);
                  return (
                    <Reveal key={category.id} delay={Math.min(index, 3) * 70}>
                      <Link to={`/urunler?kategori=${category.id}`} className="group block">
                        <div className="overflow-hidden bg-stone-200 dark:bg-slate-800">
                          <img
                            src={category.image_url || cover?.image_url || NO_PRODUCT_IMAGE}
                            alt=""
                            className="aspect-[4/5] w-full object-cover transition duration-700 ease-out motion-reduce:transition-none motion-safe:group-hover:scale-[1.04]"
                          />
                        </div>
                        <div className="mt-3 flex items-baseline justify-between gap-3">
                          <p className="font-medium text-lg leading-tight text-slate-950 dark:text-white sm:text-xl">{category.name}</p>
                          <p className="shrink-0 text-xs tabular-nums text-stone-500 dark:text-slate-400">{category.product_count}</p>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          )}

          {lead && (
            <section className="border-t border-stone-200 dark:border-slate-800">
              <div className="mx-auto max-w-6xl px-4 pt-3 pb-6 md:pt-4 md:pb-8">
                <Reveal>
                  <SectionTitle
                    title={label('featured')}
                    action={<Link to="/urunler" className={textLink}>{label('viewAll')}</Link>}
                  />
                </Reveal>
                <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
                  <Reveal className="lg:col-span-7">
                    <Link to={`/urunler?urun=${lead.id}`} className="group block">
                      <div className="relative overflow-hidden bg-stone-200 dark:bg-slate-800">
                        <img
                          src={lead.image_url || NO_PRODUCT_IMAGE}
                          alt=""
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </div>
                      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{lead.category_name}</p>
                      <h3 className="mt-2 font-medium text-3xl leading-tight text-slate-950 dark:text-white sm:text-4xl">{lead.name}</h3>
                      {(lead.description || text('bulk_price_note').trim()) && (
                        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {lead.description}
                          {text('bulk_price_note').trim() && (
                            <span className="italic text-slate-500 dark:text-slate-400"> {text('bulk_price_note').trim()}</span>
                          )}
                        </p>
                      )}
                      <p className="mt-4 font-medium text-2xl tabular-nums text-slate-950 dark:text-white">{formatCurrency(lead.list_price)}</p>
                    </Link>
                  </Reveal>
                  {rest.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:col-span-5">
                      {rest.map((product, index) => (
                        <Reveal key={product.id} delay={index * 60}>
                          <Link to={`/urunler?urun=${product.id}`} className="group block">
                            <div className="overflow-hidden bg-stone-200 dark:bg-slate-800">
                              <img
                                src={product.image_url || NO_PRODUCT_IMAGE}
                                alt=""
                                className="aspect-square w-full object-cover"
                              />
                            </div>
                            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500 dark:text-slate-400">{product.category_name}</p>
                            <p className="mt-1 line-clamp-2 font-medium text-lg leading-snug text-slate-950 dark:text-white">{product.name}</p>
                            <p className="mt-2 text-sm tabular-nums text-slate-700 dark:text-slate-200">{formatCurrency(product.list_price)}</p>
                          </Link>
                        </Reveal>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="border-y border-stone-200 dark:border-slate-800">
            <Link to="/nasil-siparis" className="mx-auto block max-w-xl px-4 py-6 text-center md:py-8">
              <span className="block text-[11px] font-medium uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                {label('orderHeading')}
              </span>
              <span className="mt-4 block text-balance font-semibold text-[1.85rem] leading-[1.15] tracking-tight text-slate-950 underline decoration-stone-300 underline-offset-[6px] transition hover:decoration-amber-600 dark:text-white dark:decoration-slate-600 sm:text-4xl">
                {label('howToOrder')}
              </span>
            </Link>
          </section>

          <section id="hakkimizda" className="scroll-mt-20">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:py-14 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-4">
                <h2 className="font-medium text-3xl tracking-tight text-slate-950 dark:text-white sm:text-4xl">{label('about')}</h2>
              </Reveal>
              <Reveal className="lg:col-span-8">
                <div className="max-w-xl">
                  {aboutParagraphs[0] && (
                    <p className="font-medium text-xl leading-snug text-slate-950 dark:text-white">{aboutLead(aboutParagraphs[0])}</p>
                  )}
                  <div className="mt-6 space-y-5 text-base leading-7 text-slate-600 dark:text-slate-300">
                    {aboutRest(aboutParagraphs).map((paragraph) => (
                      <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {faqs.length > 0 && (
          <section id="sss" className="scroll-mt-24 border-t border-stone-200 dark:border-slate-800">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:py-8 lg:grid-cols-12">
              <Reveal className="lg:col-span-4">
                <h2 className="font-medium text-3xl tracking-tight text-slate-950 dark:text-white sm:text-4xl">{label('faqHeading')}</h2>
                <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-300">{label('faqLead')}</p>
              </Reveal>
              <div className="border-t border-stone-200 lg:col-span-8 dark:border-slate-800">
                {faqs.map((item, index) => {
                  const open = openFaq === index + 1;
                  return (
                    <div key={`${item.question}-${index}`} className="border-b border-stone-200 dark:border-slate-800">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenFaq(open ? 0 : index + 1)}
                        className="flex w-full items-center justify-between gap-6 py-5 text-left"
                      >
                        <span className="font-medium text-xl text-slate-950 dark:text-white">{item.question}</span>
                        <span className={`faq-mark font-medium text-2xl leading-none text-stone-400 ${open ? 'is-open' : ''}`} aria-hidden="true">
                          <span className="is-plus">+</span>
                          <span className="is-minus">–</span>
                        </span>
                      </button>
                      <div className={`faq-panel ${open ? 'is-open' : ''}`}>
                        <div className="faq-panel-inner">
                          <p className="faq-panel-body max-w-xl pb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          )}

          <section id="iletisim" className="scroll-mt-24 border-t border-stone-200 dark:border-slate-800">
            <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
              <Reveal>
                <SectionTitle title={label('contact')} lead={text('contact_intro')} />
              </Reveal>
              <div className="flex flex-col md:flex-row md:items-stretch">
                {consultants.map((advisor, index) => (
                  <Reveal
                    key={advisor.name}
                    delay={index * 70}
                    className={`min-w-0 flex-1 ${index > 0 ? 'md:border-l md:border-stone-200 md:pl-12 dark:md:border-slate-800' : 'md:pr-12'}`}
                  >
                    {index > 0 && (
                      <div className="flex justify-center py-8 md:hidden" aria-hidden="true">
                        <span className="h-px w-12 bg-amber-600/80 dark:bg-amber-400/70" />
                      </div>
                    )}
                    <ConsultantCard person={advisor} content={content} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </SiteChrome>
  );
};
