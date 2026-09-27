import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '@/components/site/SiteChrome';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NO_PRODUCT_IMAGE, ProductGallery } from '@/components/common/ProductImage';
import { publicSiteApi } from '@/api/publicSite';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/format';
import { PersonPhoto } from '@/components/site/PersonPhoto';
import { salesConsultants } from '@/utils/siteText';
import type { PublicCategory, PublicProduct, SiteContent } from '@/types/site';

const VIEW_KEY = 'inacorts_catalog_view';

const CartControl: React.FC<{ product: PublicProduct; allowOutOfStock: boolean; wide?: boolean }> = ({ product, allowOutOfStock, wide }) => {
  const { t } = useTranslation();
  const { lines, add, setQuantity } = useCart();
  const line = lines.find((item) => item.productId === product.id);
  const blocked = !product.in_stock && !allowOutOfStock;

  if (blocked && !line) {
    return (
      <span className={`text-xs font-semibold text-red-600 ${wide ? 'flex h-10 w-full items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10' : ''}`}>
        {t('site.outOfStock')}
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
        className={`rounded-xl bg-amber-500 font-semibold text-slate-950 ${wide ? 'h-10 w-full text-sm' : 'px-3 py-1.5 text-xs'}`}
      >
        {t('site.addToCart')}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border border-stone-200 bg-stone-50 dark:border-slate-700 dark:bg-slate-950 ${wide ? 'h-10 w-full justify-center' : ''}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" className="h-8 w-8 text-base leading-none" onClick={() => setQuantity(product.id, line.quantity - 1)} aria-label="-">−</button>
      <span className="min-w-6 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
      <button type="button" className="h-8 w-8 text-base leading-none" onClick={() => setQuantity(product.id, line.quantity + 1)} aria-label="+">+</button>
    </div>
  );
};

export const CatalogPage: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'az' | 'za' | 'price-asc' | 'price-desc'>('az');
  const [sortOpen, setSortOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>(() => (
    localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  ));
  const [selected, setSelected] = useState<PublicProduct | null>(null);
  const [error, setError] = useState('');

  const chooseLayout = (next: 'grid' | 'list') => {
    setLayout(next);
    localStorage.setItem(VIEW_KEY, next);
  };

  const categoryId = Number(params.get('kategori')) || 0;
  const productId = Number(params.get('urun')) || 0;

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
    if (!productId || products.length === 0) return;
    const match = products.find((item) => item.id === productId);
    if (match) setSelected(match);
  }, [productId, products]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr');
    const filtered = products.filter((product) => {
      if (categoryId && product.category_id !== categoryId) return false;
      if (!needle) return true;
      return `${product.name} ${product.description || ''} ${product.category_name}`.toLocaleLowerCase('tr').includes(needle);
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'za') return b.name.localeCompare(a.name, 'tr');
      if (sort === 'price-asc') return a.list_price - b.list_price;
      if (sort === 'price-desc') return b.list_price - a.list_price;
      return a.name.localeCompare(b.name, 'tr');
    });
  }, [products, categoryId, query, sort]);

  const selectCategory = (id: number) => {
    const next = new URLSearchParams(params);
    if (id) next.set('kategori', String(id));
    else next.delete('kategori');
    next.delete('urun');
    setParams(next);
  };

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

  const toolButton = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

  return (
    <SiteChrome content={content}>
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-semibold tracking-tight">{t('site.products')}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 md:mx-0">{t('site.catalogIntro')}</p>
          {content && (
            <p className="mt-1 text-xs text-slate-400">{t('site.productCount', { count: visible.length })}</p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('site.searchPlaceholder')}
              className="h-11 w-full rounded-2xl border border-stone-200 bg-white pl-10 pr-3 text-sm outline-none ring-amber-500/40 placeholder:text-slate-400 focus:ring-2 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <select
                value={categoryId || ''}
                onChange={(event) => selectCategory(Number(event.target.value) || 0)}
                aria-label={t('site.category')}
                className="h-11 w-full appearance-none rounded-2xl border border-stone-200 bg-white pl-3 pr-9 text-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="">{t('site.allCategories')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label={t('site.sort')}
                onClick={() => setSortOpen((open) => !open)}
                className={toolButton}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h13M3 12h9M3 17h5M17 6v12m0 0l-3-3m3 3l3-3" />
                </svg>
              </button>
              {sortOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label={t('common.close')} onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    {([
                      ['az', t('site.sortAz')],
                      ['za', t('site.sortZa')],
                      ['price-asc', t('site.sortPriceAsc')],
                      ['price-desc', t('site.sortPriceDesc')],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSort(value);
                          setSortOpen(false);
                        }}
                        className={`block w-full px-3 py-2.5 text-left text-sm ${sort === value ? 'bg-amber-50 font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'text-slate-700 hover:bg-stone-50 dark:text-slate-200 dark:hover:bg-slate-800'}`}
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
              aria-label={layout === 'grid' ? t('site.viewList') : t('site.viewGrid')}
              onClick={() => chooseLayout(layout === 'grid' ? 'list' : 'grid')}
              className={toolButton}
            >
              {layout === 'grid' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {!content && !error && (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {error && <p className="py-10 text-center text-red-600">{error}</p>}

        {content && visible.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-stone-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700">
            {t('site.noProducts')}
          </div>
        )}

        {content && visible.length > 0 && (layout === 'grid' ? (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <article key={product.id} className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => openProduct(product)} className="block w-full text-left">
                  <div className="aspect-square bg-stone-100 dark:bg-slate-800">
                    <img src={product.image_url || NO_PRODUCT_IMAGE} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="px-3 pt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{product.category_name}</p>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm font-medium leading-5">{product.name}</p>
                    <p className="mt-2 text-center text-base font-semibold tabular-nums">{formatCurrency(product.list_price)}</p>
                  </div>
                </button>
                <div className="mt-auto px-3 pb-3 pt-3">
                  <CartControl product={product} allowOutOfStock={content.order_out_of_stock} wide />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {visible.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => openProduct(product)} className="flex w-full gap-3 p-3 text-left">
                  <img src={product.image_url || NO_PRODUCT_IMAGE} alt="" className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-xl bg-stone-100 object-cover dark:bg-slate-800" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">{product.category_name}</span>
                    <span className="mt-1 block text-sm font-medium leading-5">{product.name}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{product.description}</span>
                  </span>
                </button>
                <div className="border-t border-stone-100 px-3 py-3 text-center dark:border-slate-800">
                  <p className="text-base font-semibold tabular-nums">{formatCurrency(product.list_price)}</p>
                  <div className="mt-2 flex justify-center">
                    <CartControl product={product} allowOutOfStock={content.order_out_of_stock} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>

      <Modal isOpen={!!selected} onClose={closeProduct} title={selected?.name || t('site.details')} size="lg">
        {selected && (
          <div className="grid gap-5 sm:grid-cols-2">
            <ProductGallery
              urls={selected.image_urls?.length ? selected.image_urls : (selected.image_url ? [selected.image_url] : [])}
              alt={selected.name}
            />
            <div className="flex flex-col">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{selected.category_name}</p>
              <p className="mt-2 text-center text-3xl font-semibold tracking-tight tabular-nums">{formatCurrency(selected.list_price)}</p>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{selected.description}</p>
              <div className="mt-5">
                <CartControl product={selected} allowOutOfStock={Boolean(content?.order_out_of_stock)} wide />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{t('site.quoteHint')}</p>
              {salesConsultants(content).some((advisor) => advisor.phone) && (
                <div className="mt-4 flex flex-col gap-2">
                  {salesConsultants(content).filter((advisor) => advisor.phone).map((advisor) => (
                    <a
                      key={advisor.name}
                      href={`tel:${advisor.phone.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-3 rounded-2xl border border-stone-200 px-3 py-3 text-sm dark:border-slate-700"
                    >
                      <PersonPhoto name={advisor.name} url={advisor.photo_url} className="h-10 w-10" />
                      <span className="min-w-0 flex-1 font-medium">{advisor.name}</span>
                      <span className="text-slate-500">{t('site.call')}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </SiteChrome>
  );
};
