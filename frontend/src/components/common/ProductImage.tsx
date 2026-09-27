import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';

export const NO_PRODUCT_IMAGE = '/images/no-product.svg';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

interface ProductImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'lg';
}

export const ProductImage: React.FC<ProductImageProps> = ({ src, alt, size = 'sm' }) => {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showPlaceholder = !src || failed;
  const sizeClass = size === 'lg' ? 'h-40 w-40' : 'h-12 w-12';

  const image = (
    <img
      src={showPlaceholder ? NO_PRODUCT_IMAGE : src}
      alt={showPlaceholder ? t('products.noImage') : alt}
      title={showPlaceholder ? t('products.noImage') : alt}
      className={`${sizeClass} rounded-lg object-cover bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
      onError={() => setFailed(true)}
    />
  );

  if (!showPlaceholder || size === 'sm') {
    return image;
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {image}
      <span className="text-xs text-gray-500 dark:text-gray-400">{t('products.noImage')}</span>
    </div>
  );
};

interface ProductImageFieldProps {
  currentUrls: string[];
  files: File[];
  removedUrls: string[];
  onFilesChange: (files: File[]) => void;
  onRemovedUrlsChange: (urls: string[]) => void;
  alt: string;
}

export const ProductImageField: React.FC<ProductImageFieldProps> = ({
  currentUrls,
  files,
  removedUrls,
  onFilesChange,
  onRemovedUrlsChange,
  alt,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setObjectUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const kept = currentUrls.filter((url) => !removedUrls.includes(url));

  const handleFiles = (selected: FileList | null) => {
    if (!selected?.length) return;
    const next = [...files];
    let message = '';
    for (const file of Array.from(selected)) {
      const typeOk = ALLOWED_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
      if (!typeOk) {
        message = t('products.imageInvalidType');
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        message = t('products.imageTooLarge');
        continue;
      }
      if (kept.length + next.length >= MAX_IMAGES) {
        message = t('products.imageLimit');
        break;
      }
      next.push(file);
    }
    setError(message);
    onFilesChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {t('products.image')}
      </label>
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1">
        {kept.map((url) => (
          <div key={url} className="relative shrink-0">
            <ProductImage src={url} alt={alt} size="lg" />
            <button
              type="button"
              onClick={() => onRemovedUrlsChange([...removedUrls, url])}
              className="absolute right-1 top-1 rounded-full bg-slate-950/80 px-1.5 text-xs text-white"
              aria-label={t('products.removeImage')}
            >
              ×
            </button>
          </div>
        ))}
        {objectUrls.map((url, index) => (
          <div key={url} className="relative shrink-0">
            <ProductImage src={url} alt={alt} size="lg" />
            <button
              type="button"
              onClick={() => onFilesChange(files.filter((_, item) => item !== index))}
              className="absolute right-1 top-1 rounded-full bg-slate-950/80 px-1.5 text-xs text-white"
              aria-label={t('products.removeImage')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="mt-2 space-y-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          {t('products.addImages')}
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('products.imageHint')}</p>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export const ProductGallery: React.FC<{ urls: string[]; alt: string }> = ({ urls, alt }) => {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = urls.length > 0 ? urls : [NO_PRODUCT_IMAGE];
  const slideKey = slides.join('|');

  useEffect(() => {
    setIndex(0);
    scroller.current?.scrollTo({ left: 0 });
  }, [slideKey]);

  const onScroll = () => {
    const element = scroller.current;
    if (!element || element.clientWidth === 0) return;
    setIndex(Math.round(element.scrollLeft / element.clientWidth));
  };

  const go = (next: number) => {
    const element = scroller.current;
    if (!element) return;
    const clamped = (next + slides.length) % slides.length;
    element.scrollTo({ left: clamped * element.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex aspect-square snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-lg scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((url, slideIndex) => (
          <img
            key={`${url}-${slideIndex}`}
            src={url}
            alt={alt}
            draggable={false}
            className="aspect-square w-full min-w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t('site.prevImage')}
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-lg text-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={t('site.nextImage')}
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-lg text-white"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {slides.map((url, slideIndex) => (
              <button
                key={`${url}-dot-${slideIndex}`}
                type="button"
                aria-label={`${slideIndex + 1}`}
                onClick={() => go(slideIndex)}
                className={`h-1.5 rounded-full ${slideIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
