import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/layout/BackButton';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { TextArea } from '@/components/common/TextArea';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { siteSettingsApi } from '@/api/publicSite';
import { SiteCopyEditor } from '@/pages/settings/SiteCopyEditor';
import { categoriesApi } from '@/api/categories';
import { productsApi } from '@/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/format';
import type { SiteContent } from '@/types/site';

const MAX_FEATURED_CATEGORIES = 12;
const MAX_FEATURED_PRODUCTS = 4;

const moveId = (ids: number[], id: number, direction: -1 | 1) => {
  const index = ids.indexOf(id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= ids.length) return ids;
  const copy = [...ids];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
};

const HighlightPicker: React.FC<{
  label: string;
  hint: string;
  items: Array<{ id: number; name: string; detail?: string }>;
  selected: number[];
  max: number;
  onChange: (ids: number[]) => void;
  searchable?: boolean;
  searchLabel?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onQueryChange?: (query: string) => void;
  loadMoreLabel?: string;
  emptyLabel: string;
  upLabel: string;
  downLabel: string;
  removeLabel: string;
}> = ({ label, hint, items, selected, max, onChange, searchable, searchLabel, hasMore, onLoadMore, onQueryChange, loadMoreLabel, emptyLabel, upLabel, downLabel, removeLabel }) => {
  const [query, setQuery] = useState('');
  const byId = new Map(items.map((item) => [item.id, item]));
  const needle = query.trim().toLocaleLowerCase('tr');
  const visible = items.filter((item) => !needle || `${item.name} ${item.detail ?? ''}`.toLocaleLowerCase('tr').includes(needle));

  const toggle = (id: number) => {
    if (selected.includes(id)) onChange(selected.filter((item) => item !== id));
    else if (selected.length < max) onChange([...selected, id]);
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      <ol className="mt-3 space-y-1">
        {selected.length === 0 && <li className="text-sm text-gray-400">{emptyLabel}</li>}
        {selected.map((id, index) => (
          <li key={id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
            <span className="w-5 shrink-0 tabular-nums text-gray-400">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate">{byId.get(id)?.name || `#${id}`}</span>
            <button type="button" className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 dark:hover:text-white" disabled={index === 0} onClick={() => onChange(moveId(selected, id, -1))}>{upLabel}</button>
            <button type="button" className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 dark:hover:text-white" disabled={index === selected.length - 1} onClick={() => onChange(moveId(selected, id, 1))}>{downLabel}</button>
            <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => onChange(selected.filter((item) => item !== id))}>{removeLabel}</button>
          </li>
        ))}
      </ol>
      {searchable && (
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onQueryChange?.(event.target.value);
          }}
          placeholder={searchLabel}
          className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
      )}
      <div className="mt-2 max-h-56 space-y-0.5 overflow-y-auto rounded-md border border-gray-200 p-1 dark:border-slate-700">
        {visible.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && selected.length >= max}
                onChange={() => toggle(item.id)}
              />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {item.detail && <span className="shrink-0 text-xs text-gray-400">{item.detail}</span>}
            </label>
          );
        })}
      </div>
      {hasMore && onLoadMore && (
        <button type="button" className="mt-2 text-sm text-primary-700 dark:text-primary-300" onClick={onLoadMore}>
          {loadMoreLabel}
        </button>
      )}
    </div>
  );
};

const localizedFields: Array<{ key: string; label: string; area?: boolean; optional?: boolean }> = [
  { key: 'hero_title', label: 'site.heroTitle' },
  { key: 'hero_subtitle', label: 'site.heroSubtitle', area: true },
  { key: 'about', label: 'site.aboutText', area: true },
  { key: 'contact_intro', label: 'site.contactIntro', area: true },
  { key: 'bulk_price_note', label: 'site.bulkPriceNote', area: true, optional: true },
  { key: 'feature1_title', label: 'site.featureTitle' },
  { key: 'feature1_text', label: 'site.featureText', area: true },
  { key: 'feature2_title', label: 'site.featureTitle' },
  { key: 'feature2_text', label: 'site.featureText', area: true },
  { key: 'feature3_title', label: 'site.featureTitle' },
  { key: 'feature3_text', label: 'site.featureText', area: true },
];

export const SiteSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState<SiteContent | null>(null);
  const [catalog, setCatalog] = useState<{ categories: Array<{ id: number; name: string }>; products: Array<{ id: number; name: string; detail?: string }> }>({ categories: [], products: [] });
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPages, setCategoryPages] = useState(1);
  const [productQuery, setProductQuery] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const featuredProductIds = useRef<number[]>([]);
  featuredProductIds.current = [
    ...(form?.featured_master_product_id ? [form.featured_master_product_id] : []),
    ...(form?.featured_product_ids ?? []),
  ];

  useEffect(() => {
    siteSettingsApi.get()
      .then(async (settings) => {
        const featuredCategories = settings.featured_category_ids ?? [];
        const masterId = settings.featured_master_product_id ?? null;
        const featuredProducts = settings.featured_product_ids ?? [];
        const namedIds = [...(masterId ? [masterId] : []), ...featuredProducts];
        const [categories, namedCategories, namedProducts] = await Promise.all([
          categoriesApi.list({ page: 1, page_size: 50, sort: 'name', order: 'asc' }),
          Promise.all(featuredCategories.map((id) => categoriesApi.get(id).catch(() => null))),
          Promise.all(namedIds.map((id) => productsApi.get(id).catch(() => null))),
        ]);
        const categoryItems = categories.items.map((category) => ({ id: category.id, name: category.name }));
        for (const category of namedCategories) {
          if (category && !categoryItems.some((item) => item.id === category.id)) {
            categoryItems.unshift({ id: category.id, name: category.name });
          }
        }
        setCatalog({
          categories: categoryItems,
          products: namedProducts.filter((product) => product).map((product) => ({
            id: product!.id,
            name: product!.name,
          })),
        });
        setCategoryPage(1);
        setCategoryPages(categories.total_pages);
        setForm({
          ...settings,
          featured_category_ids: featuredCategories,
          featured_master_product_id: masterId,
          featured_product_ids: featuredProducts,
        });
        setCatalogReady(true);
      })
      .catch((err) => setError(getErrorMessage(err, t('errors.loadFailed'))));
  }, [t]);

  useEffect(() => {
    if (!catalogReady) return;
    const handle = window.setTimeout(() => {
      productsApi.list({ page: 1, page_size: 20, search: productQuery || undefined, sort: 'name', order: 'asc' })
        .then((products) => {
          setCatalog((current) => {
            const keep = new Set(featuredProductIds.current);
            const selected = new Map(current.products.filter((product) => keep.has(product.id)).map((product) => [product.id, product]));
            for (const product of products.items) {
              selected.set(product.id, { id: product.id, name: product.name });
            }
            return { ...current, products: Array.from(selected.values()) };
          });
        })
        .catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [productQuery, catalogReady]);

  const loadMoreCategories = () => {
    const next = categoryPage + 1;
    categoriesApi.list({ page: next, page_size: 50, sort: 'name', order: 'asc' })
      .then((categories) => {
        setCatalog((current) => {
          const seen = new Set(current.categories.map((category) => category.id));
          return {
            ...current,
            categories: [
              ...current.categories,
              ...categories.items.filter((category) => !seen.has(category.id)).map((category) => ({ id: category.id, name: category.name })),
            ],
          };
        });
        setCategoryPage(categories.page);
        setCategoryPages(categories.total_pages);
      })
      .catch(() => undefined);
  };

  const setIds = (key: 'featured_category_ids' | 'featured_product_ids', ids: number[]) => {
    if (!form) return;
    setSaved(false);
    setForm({ ...form, [key]: ids });
  };

  const setField = (key: keyof SiteContent, value: string) => {
    if (!form) return;
    setSaved(false);
    setForm({ ...form, [key]: value });
  };

  const featureIndex = (key: string) => {
    const match = key.match(/^feature(\d)/);
    return match ? match[1] : '';
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      const updated = await siteSettingsApi.update({ ...form, company_name: form.company_name.trim(), tab_title: form.company_name.trim() });
      setForm(updated);
      setSaved(true);
      window.dispatchEvent(new Event('site-meta'));
    } catch (err) {
      setError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <AppLayout>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('site.adminOnly')}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-1">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.siteSettings')}</h1>
        </div>
        {!form && !error && <LoadingSpinner size="lg" />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {form && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card title={t('site.systemName')}>
              <Input label={t('site.systemName')} value={form.company_name} onChange={(e) => setField('company_name', e.target.value)} fullWidth required />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('site.systemNameHint')}</p>
            </Card>
            <Card title={t('site.company')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">{t('site.favicon')}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={form.favicon_url || '/favicon.svg'}
                      alt=""
                      className="h-10 w-10 rounded-md border border-gray-200 bg-white object-contain dark:border-slate-700"
                    />
                    <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-800">
                      {t('site.faviconUpload')}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,.ico"
                        className="sr-only"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (!file) return;
                          try {
                            setError('');
                            const updated = await siteSettingsApi.uploadFavicon(file);
                            setForm((current) => current ? { ...current, favicon_url: updated.favicon_url ?? null } : updated);
                            window.dispatchEvent(new Event('site-meta'));
                          } catch (err) {
                            setError(getErrorMessage(err, t('errors.saveFailed')));
                          }
                        }}
                      />
                    </label>
                    {form.favicon_url && (
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={async () => {
                          try {
                            setError('');
                            await siteSettingsApi.deleteFavicon();
                            setForm((current) => current ? { ...current, favicon_url: null } : current);
                            window.dispatchEvent(new Event('site-meta'));
                          } catch (err) {
                            setError(getErrorMessage(err, t('errors.saveFailed')));
                          }
                        }}
                      >
                        {t('site.remove')}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('site.faviconHint')}</p>
                </div>
                <Input label={t('site.phone')} value={form.phone} onChange={(e) => setField('phone', e.target.value)} fullWidth required />
                <Input label={t('site.email')} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} fullWidth required />
                <Input label={t('site.hours')} value={form.hours} onChange={(e) => setField('hours', e.target.value)} fullWidth required />
                <div className="sm:col-span-2">
                  <TextArea label={t('site.address')} value={form.address} onChange={(e) => setField('address', e.target.value)} fullWidth required />
                </div>
              </div>
            </Card>

            <Card title={t('site.featuredPick')}>
              <div className="grid gap-8 lg:grid-cols-2">
                <HighlightPicker
                  label={t('site.featuredCategories')}
                  hint={t('site.featuredCategoriesHint')}
                  items={catalog.categories}
                  selected={form.featured_category_ids ?? []}
                  max={MAX_FEATURED_CATEGORIES}
                  onChange={(ids) => setIds('featured_category_ids', ids)}
                  hasMore={categoryPage < categoryPages}
                  onLoadMore={loadMoreCategories}
                  loadMoreLabel={t('common.loadMore')}
                  emptyLabel={t('site.featuredEmpty')}
                  upLabel={t('site.moveUp')}
                  downLabel={t('site.moveDown')}
                  removeLabel={t('site.remove')}
                />
                <div className="space-y-8">
                  <HighlightPicker
                    label={t('site.featuredMaster')}
                    hint={t('site.featuredMasterHint')}
                    items={catalog.products}
                    selected={form.featured_master_product_id ? [form.featured_master_product_id] : []}
                    max={1}
                    onChange={(ids) => {
                      if (!form) return;
                      setSaved(false);
                      setForm({ ...form, featured_master_product_id: ids[0] ?? null });
                    }}
                    searchable
                    onQueryChange={setProductQuery}
                    searchLabel={t('site.featuredSearch')}
                    emptyLabel={t('site.featuredEmpty')}
                    upLabel={t('site.moveUp')}
                    downLabel={t('site.moveDown')}
                    removeLabel={t('site.remove')}
                  />
                  <HighlightPicker
                    label={t('site.featuredProducts')}
                    hint={t('site.featuredProductsHint')}
                    items={catalog.products}
                    selected={form.featured_product_ids ?? []}
                    max={MAX_FEATURED_PRODUCTS}
                    onChange={(ids) => setIds('featured_product_ids', ids)}
                    searchable
                    onQueryChange={setProductQuery}
                    searchLabel={t('site.featuredSearch')}
                    emptyLabel={t('site.featuredEmpty')}
                    upLabel={t('site.moveUp')}
                    downLabel={t('site.moveDown')}
                    removeLabel={t('site.remove')}
                  />
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {(['tr', 'en'] as const).map((lang) => (
                <Card key={lang} title={lang === 'tr' ? t('site.turkish') : t('site.english')}>
                  <div className="space-y-4">
                    {localizedFields.map((field) => {
                      const name = `${field.key}_${lang}` as keyof SiteContent;
                      const label = field.key.startsWith('feature')
                        ? t(field.label, { n: featureIndex(field.key) })
                        : t(field.label);
                      return field.area ? (
                        <TextArea
                          key={name}
                          label={label}
                          value={String(form[name] ?? '')}
                          onChange={(e) => setField(name, e.target.value)}
                          fullWidth
                          required={!field.optional}
                        />
                      ) : (
                        <Input
                          key={name}
                          label={label}
                          value={String(form[name] ?? '')}
                          onChange={(e) => setField(name, e.target.value)}
                          fullWidth
                          required
                        />
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>

            <SiteCopyEditor
              form={form}
              onChange={(next) => {
                setSaved(false);
                setForm(next);
              }}
            />

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}>{t('common.saveChanges')}</Button>
              {saved && <span className="text-sm text-emerald-600">{t('site.saved')}</span>}
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
};
