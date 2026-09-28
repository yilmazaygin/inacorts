import apiClient from '@/api/client';

export async function downloadExport(
  url: string,
  params: Record<string, string | number | undefined>,
  fallbackName: string,
): Promise<void> {
  const response = await apiClient.get(url, { params, responseType: 'blob' });
  const blob = response.data as Blob;
  if (blob.type.includes('json')) {
    const text = await blob.text();
    throw new Error(text);
  }
  const header = String(response.headers['content-disposition'] || '');
  const match = header.match(/filename="([^"]+)"/);
  const filename = match?.[1] || fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
