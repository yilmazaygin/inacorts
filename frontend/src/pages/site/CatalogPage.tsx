import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NO_PRODUCT_IMAGE, ProductGallery } from '@/components/common/ProductImage';
import { publicSiteApi } from '@/api/publicSite';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/format';
import { siteText, useSiteLabel } from '@/utils/siteText';
import type { PublicCategory, PublicProduct, SiteContent } from '@/types/site';

const VIEW_KEY = 'inacorts_catalog_view';
const PAGE_SIZE = 12;

const textLink = 'text-sm text-slate-900 underline decoration-stone-300 underline-offset-4 transition hover:decoration-amber-600 dark:text-white dark:decoration-slate-600';
const cartButton = 'inline-flex h-10 shrink-0 items-center bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 dark:bg-white dark:text-slate-950 dark:hover:bg-amber-500';

const BulkNote: React.FC<{ note: string }> = ({ note }) => (
  note.trim() ? <span className="italic text-slate-500 dark:text-slate-400"> {note.trim()}</span> : null
);

const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number; immediate?: boolean }> = ({
  children,
  className = '',
  delay = 0,
  immediate = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-in');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.classList.add('is-in');
        observer.disconnect();
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div ref={ref} className={`reveal ${immediate ? 'is-in' : ''} ${className}`} style={delay && !immediate ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
};

const CartControl: React.FC<{ product: PublicProduct; allowOutOfStock: boolean; fullWidth?: boolean; content: SiteContent | null }> = ({ product, allowOutOfStock, fullWidth = false, content }) => {
  const label = useSiteLabel(content);
  const { lines, add, setQuantity } = useCart();
  const line = lines.find((item) => item.productId === product.id);
  const blocked = !product.in_stock && !allowOutOfStock;

  if (blocked && !line) {
    return (
      <span className={`inline-flex h-10 shrink-0 items-center border border-stone-300 px-3 text-sm text-stone-500 dark:border-slate-700 dark:text-slate-400 ${fullWidth ? 'w-full justify-center' : ''}`}>
        {label('outOfStock')}
      </span>
    );
  }

  if (!line) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          add(product);
        }}
        className={`${cartButton} ${fullWidth ? 'w-full justify-center' : ''}`}
      >
        {label('addToCart')}
      </button>
    );
  }

  return (
    <div
      className={`${fullWidth ? 'flex w-full justify-center' : 'inline-flex'} items-center border border-stone-300 dark:border-slate-700`}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" className="flex h-10 w-10 min-h-0 shrink-0 items-center justify-center text-base leading-none text-slate-800 dark:text-slate-100" onClick={() => setQuantity(product.id, line.quantity - 1)} aria-label="-">−</button>
      <span className="min-w-8 px-1 text-center text-sm tabular-nums">{line.quantity}</span>
      <button type="button" className="flex h-10 w-10 min-h-0 shrink-0 items-center justify-center text-base leading-none text-slate-800 dark:text-slate-100" onClick={() => setQuantity(product.id, line.quantity + 1)} aria-label="+">+</button>
    </div>
  );
};

export const CatalogPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState<'az' | 'za' | 'price-asc' | 'price-desc'>('az');
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>(() => (
    localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  ));
  const [selected, setSelected] = useState<PublicProduct | null>(null);
  const [error, setError] = useState('');
  const label = useSiteLabel(content);

  const chooseLayout = (next: 'grid' | 'list') => {
    const filters = filtersRef.current;
    const top = filters?.getBoundingClientRect().top;
    seenLayout.current = true;
    setLayout(next);
    localStorage.setItem(VIEW_KEY, next);
    if (top == null) return;
    const pin = () => {
      const node = filtersRef.current;
      if (!node) return;
      const delta = node.getBoundingClientRect().top - top;
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
    };
    requestAnimationFrame(() => {
      pin();
      requestAnimationFrame(pin);
    });
  };

  const categoryId = Number(params.get('kategori')) || 0;
  const productId = Number(params.get('urun')) || 0;
  const loadGen = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const seenLayout = useRef(false);
  const hasMore = products.length < total;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    Promise.all([publicSiteApi.site(), publicSiteApi.categories()])
      .then(([site, cats]) => {
        if (!active) return;
        setContent(site);
        setCategories(cats);
      })
      .catch(() => {
        if (active) setError(t('errors.loadFailed'));
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    const gen = ++loadGen.current;
    setLoading(true);
    setProducts([]);
    publicSiteApi.products({
      page: 1,
      page_size: PAGE_SIZE,
      category_id: categoryId || undefined,
      search: debouncedQuery || undefined,
      sort,
    })
      .then((result) => {
        if (gen !== loadGen.current) return;
        setProducts(result.items);
        setTotal(result.total);
        setPage(result.page);
        setError('');
      })
      .catch(() => {
        if (gen === loadGen.current) setError(t('errors.loadFailed'));
      })
      .finally(() => {
        if (gen === loadGen.current) setLoading(false);
      });
  }, [categoryId, debouncedQuery, sort, t]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || loadingMoreRef.current || loadGen.current === 0) return;
      const gen = loadGen.current;
      loadingMoreRef.current = true;
      setLoadingMore(true);
      publicSiteApi.products({
        page: page + 1,
        page_size: PAGE_SIZE,
        category_id: categoryId || undefined,
        search: debouncedQuery || undefined,
        sort,
      })
        .then((result) => {
          if (gen !== loadGen.current) return;
          setProducts((currentProducts) => {
            const seen = new Set(currentProducts.map((item) => item.id));
            return [...currentProducts, ...result.items.filter((item) => !seen.has(item.id))];
          });
          setTotal(result.total);
          setPage(result.page);
        })
        .catch(() => {
          if (gen === loadGen.current) setError(t('errors.loadFailed'));
        })
        .finally(() => {
          loadingMoreRef.current = false;
          if (gen === loadGen.current) setLoadingMore(false);
        });
    }, { rootMargin: '240px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, categoryId, debouncedQuery, sort, t]);

  useEffect(() => {
    if (!productId) return;
    const match = products.find((item) => item.id === productId);
    if (match) {
      setSelected(match);
      return;
    }
    let active = true;
    publicSiteApi.product(productId)
      .then((item) => {
        if (active) setSelected(item);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [productId, products]);

  const selectCategory = (id: number) => {
    const next = new URLSearchParams(params);
    if (id) next.set('kategori', String(id));
    else next.delete('kategori');
    next.delete('urun');
    setParams(next);
    setCategoryOpen(false);
  };

  useEffect(() => {
    if (!categoryOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoryOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [categoryOpen]);

  const openProduct = (product: PublicProduct) => {
    setSelected(product);
    const next = new URLSearchParams(params);
    next.set('urun', String(product.id));
    setParams(next, { replace: true });
  };

  const closeProduct = () => {
    setSelected(null);
    const next = new URLSearchParams(params);
    next.delete('urun');
    setParams(next, { replace: true });
  };

  const activeCategory = categories.find((category) => category.id === categoryId);
  const sortOptions = [
    ['az', label('sortAz')],
    ['za', label('sortZa')],
    ['price-asc', label('sortPriceAsc')],
    ['price-desc', label('sortPriceDesc')],
  ] as const;
  const sortLabel = sortOptions.find(([value]) => value === sort)?.[1] ?? label('sort');
  const filterClass = (active: boolean) => (
    active
      ? 'text-sm font-medium text-slate-950 underline decoration-amber-600 decoration-2 underline-offset-[6px] dark:text-white'
      : 'text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
  );

  return (
    <SiteChrome content={content}>
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 md:pt-16">
        <h1 className="hero-rise text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          {activeCategory?.name || label('products')}
        </h1>
        <p className="hero-rise mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300" style={{ animationDelay: '120ms' }}>
          {label('catalogIntro')}
        </p>

        <div className="hero-rise relative mt-8 max-w-xl" style={{ animationDelay: '180ms' }}>
          <svg className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={label('searchPlaceholder')}
            aria-label={label('searchPlaceholder')}
            className="w-full border-b border-stone-300 bg-transparent py-3 pl-8 text-base text-slate-950 outline-none placeholder:text-stone-400 focus:border-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white"
          />
        </div>

        <div ref={filtersRef} className="hero-rise mt-3 flex items-center gap-3 border-b border-stone-300 dark:border-slate-700" style={{ animationDelay: '240ms' }}>
          {categories.length > 0 && (
            <button
              type="button"
              aria-expanded={categoryOpen}
              onClick={() => setCategoryOpen(true)}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 text-left"
            >
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{label('category')}</span>
              <span className="min-w-0 truncate text-sm font-medium text-slate-950 dark:text-white">
                {activeCategory?.name || label('allCategories')}
              </span>
            </button>
          )}
          <div className="flex shrink-0 items-center gap-3 py-3">
            {categories.length > 0 && <span className="h-4 w-px bg-stone-300 dark:bg-slate-600" aria-hidden="true" />}
            <div className="relative">
              <button
                type="button"
                aria-label={label('sort')}
                aria-expanded={sortOpen}
                onClick={() => setSortOpen((open) => !open)}
                className={`${textLink} whitespace-nowrap`}
              >
                {sortLabel}
              </button>
              {sortOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label={t('common.close')} onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-52 border border-stone-200 bg-white py-1 dark:border-slate-700 dark:bg-slate-950">
                    {sortOptions.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSort(value);
                          setSortOpen(false);
                        }}
                        className={`block w-full px-3 py-2.5 text-left text-sm ${sort === value ? 'font-medium text-slate-950 dark:text-white' : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              aria-label={layout === 'grid' ? label('viewList') : label('viewGrid')}
              onClick={() => chooseLayout(layout === 'grid' ? 'list' : 'grid')}
              className="flex h-9 w-9 items-center justify-center text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              {layout === 'grid' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 [overflow-anchor:none] md:pb-24 md:pt-10">
        {(loading || !content) && !error && products.length === 0 && (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {error && <p className="py-10 text-center text-red-600">{error}</p>}

        {content && !loading && products.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">{label('noProducts')}</p>
        )}

        {content && products.length > 0 && (layout === 'grid' ? (
          <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 6) * 60} immediate={seenLayout.current} className="h-full">
                <article className="flex h-full flex-col">
                  <button type="button" onClick={() => openProduct(product)} className="group block w-full text-left">
                    <div className="overflow-hidden bg-stone-200 dark:bg-slate-800">
                      <img
                        src={product.image_url || NO_PRODUCT_IMAGE}
                        alt=""
                        className="aspect-[4/5] w-full object-cover transition duration-700 ease-out motion-reduce:transition-none motion-safe:group-hover:scale-[1.04]"
                      />
                    </div>
                    <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500 dark:text-slate-400">{product.category_name}</p>
                    <p className="mt-1 line-clamp-2 min-h-[3.1rem] font-medium text-lg leading-snug text-slate-950 dark:text-white">{product.name}</p>
                  </button>
                  <div className="mt-auto flex flex-col items-stretch gap-3 pt-3">
                    <p className="font-medium text-lg tabular-nums leading-none text-slate-950 dark:text-white sm:text-xl">{formatCurrency(product.list_price)}</p>
                    <CartControl product={product} allowOutOfStock={content.order_out_of_stock} content={content} fullWidth />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="border-t border-stone-200 dark:border-slate-800">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={Math.min(index, 4) * 50} immediate={seenLayout.current}>
                <article className="grid items-start gap-5 border-b border-stone-200 py-8 dark:border-slate-800 sm:grid-cols-12 sm:gap-8">
                  <button type="button" aria-label={product.name} onClick={() => openProduct(product)} className="group block sm:col-span-4">
                    <div className="overflow-hidden bg-stone-200 dark:bg-slate-800">
                      <img
                        src={product.image_url || NO_PRODUCT_IMAGE}
                        alt=""
                        className="aspect-[4/3] w-full object-cover transition duration-700 ease-out motion-reduce:transition-none motion-safe:group-hover:scale-[1.03]"
                      />
                    </div>
                  </button>
                  <div className="sm:col-span-8">
                    <button type="button" onClick={() => openProduct(product)} className="block text-left">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{product.category_name}</p>
                      <p className="mt-2 font-medium text-2xl leading-tight text-slate-950 dark:text-white sm:text-3xl">{product.name}</p>
                      {(product.description || siteText(content, 'bulk_price_note', i18n.language).trim()) && (
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {product.description}
                          <BulkNote note={siteText(content, 'bulk_price_note', i18n.language)} />
                        </p>
                      )}
                    </button>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{label('listPrice')}</p>
                        <p className="mt-1 font-medium text-2xl tabular-nums text-slate-950 dark:text-white">{formatCurrency(product.list_price)}</p>
                      </div>
                      <CartControl product={product} allowOutOfStock={content.order_out_of_stock} content={content} />
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ))}
        {hasMore && <div ref={sentinel} className="h-8" />}
        {loadingMore && (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        )}
      </section>

      <Modal isOpen={!!selected} onClose={closeProduct} title={selected?.name || label('details')} size="lg" variant="site">
        {selected && (
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <ProductGallery
              urls={selected.image_urls?.length ? selected.image_urls : (selected.image_url ? [selected.image_url] : [])}
              alt={selected.name}
              className="bg-stone-200 dark:bg-slate-800"
              prevLabel={label('prevImage')}
              nextLabel={label('nextImage')}
            />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{selected.category_name}</p>
              {(selected.description || (content && siteText(content, 'bulk_price_note', i18n.language).trim())) && (
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {selected.description}
                  {content && <BulkNote note={siteText(content, 'bulk_price_note', i18n.language)} />}
                </p>
              )}
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">{label('listPrice')}</p>
                  <p className="mt-1 font-medium text-3xl tabular-nums tracking-tight text-slate-950 dark:text-white">{formatCurrency(selected.list_price)}</p>
                </div>
                <CartControl product={selected} allowOutOfStock={Boolean(content?.order_out_of_stock)} content={content} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {categoryOpen && (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-slate-950/80" aria-label={t('common.close')} onClick={() => setCategoryOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto border-t border-stone-200 bg-stone-50 px-4 pb-8 pt-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-medium text-2xl tracking-tight text-slate-950 dark:text-white">{label('category')}</h2>
                <button type="button" onClick={() => setCategoryOpen(false)} className="text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white" aria-label={t('common.close')}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 divide-y divide-stone-200 border-y border-stone-200 dark:divide-slate-800 dark:border-slate-800">
                <button type="button" onClick={() => selectCategory(0)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left">
                  <span className={filterClass(!categoryId)}>{label('allCategories')}</span>
                </button>
                {categories.map((category) => (
                  <button key={category.id} type="button" onClick={() => selectCategory(category.id)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left">
                    <span className={filterClass(categoryId === category.id)}>{category.name}</span>
                    <span className="text-xs tabular-nums text-stone-400 dark:text-slate-500">{category.product_count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </SiteChrome>
  );
};
