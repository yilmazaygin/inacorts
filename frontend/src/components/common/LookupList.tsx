import React, { useEffect, useRef, useState } from 'react';
import type { PaginatedResponse } from '@/types/api';

export interface LookupItem {
  id: number;
  label: string;
  detail?: string;
}

interface LookupListProps {
  query: string;
  selectedId: number;
  onSelect: (item: LookupItem) => void;
  fetchPage: (query: string, page: number) => Promise<PaginatedResponse<LookupItem>>;
  emptyLabel: string;
  loadMoreLabel: string;
  reloadKey?: string | number;
}

export const LookupList: React.FC<LookupListProps> = ({
  query,
  selectedId,
  onSelect,
  fetchPage,
  emptyLabel,
  loadMoreLabel,
  reloadKey = '',
}) => {
  const [items, setItems] = useState<LookupItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchRef.current(query, 1);
        if (cancelled) return;
        setItems(data.items);
        setPage(1);
        setTotalPages(data.total_pages);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, reloadKey]);

  const loadMore = async () => {
    const next = page + 1;
    setLoading(true);
    try {
      const data = await fetchRef.current(query, next);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...data.items.filter((item) => !seen.has(item.id))];
      });
      setPage(data.page);
      setTotalPages(data.total_pages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600">
      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {loading ? '…' : emptyLabel}
        </p>
      ) : (
        <ul className="max-h-48 divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
          {items.map((item) => {
            const selected = item.id === selectedId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
                      : 'text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700/60'
                  }`}
                >
                  <span className="min-w-0 truncate font-medium">{item.label}</span>
                  {item.detail && (
                    <span className={`shrink-0 text-xs ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.detail}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {page < totalPages && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="w-full border-t border-gray-200 px-3 py-2 text-sm text-primary-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-primary-300 dark:hover:bg-gray-700/60"
        >
          {loadMoreLabel}
        </button>
      )}
    </div>
  );
};
