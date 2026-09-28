const AGREEMENT_PATH = /^\/sozlesme(?:[/?#]|$)/;

export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('://')) return null;
  if (AGREEMENT_PATH.test(path)) return null;
  return path;
}

export function agreementHref(from: string): string {
  const path = safeReturnPath(from);
  if (!path) return '/sozlesme';
  return `/sozlesme?geri=${encodeURIComponent(path)}`;
}
