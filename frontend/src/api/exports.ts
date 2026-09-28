import { downloadExport } from '@/utils/download';

export type ExportKind =
  | 'customers'
  | 'contacts'
  | 'orders'
  | 'products'
  | 'stock'
  | 'payments'
  | 'expenses'
  | 'financials';

export const exportsApi = {
  download: async (params: {
    kind: ExportKind;
    format: 'csv' | 'xlsx';
    lang: string;
    start_date?: string;
    end_date?: string;
  }): Promise<void> => {
    await downloadExport('/api/v1/exports', params, `${params.kind}.${params.format === 'xlsx' ? 'xlsx' : 'csv'}`);
  },
};
