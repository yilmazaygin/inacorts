import { format as dateFnsFormat, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsFormat(dateObj, 'd MMM yyyy', { locale: tr });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsFormat(dateObj, 'd MMM yyyy HH:mm', { locale: tr });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

/**
 * Format currency in compact form for large values.
 * e.g. ₺1.2M, ₺45.3K, ₺500.00
 * Returns short display text; use formatCurrency() for hover tooltip.
 */
export const formatCompactCurrency = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}₺${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}₺${(abs / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('tr-TR').format(value);
};

/**
 * Extract a human-readable error message from API error responses.
 * Handles both string details and Pydantic validation error arrays.
 */
export const getErrorMessage = (err: any, fallback: string = 'An error occurred'): string => {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => {
      if (typeof d === 'string') return d;
      if (d.msg) {
        const field = d.loc ? d.loc.filter((l: any) => l !== 'body').join('.') : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      }
      return JSON.stringify(d);
    }).join('; ');
  }
  if (typeof detail === 'object' && detail.msg) return detail.msg;
  return fallback;
};
