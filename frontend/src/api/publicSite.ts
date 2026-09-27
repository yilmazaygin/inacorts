import apiClient from './client';
import type { AgreementAdmin, AgreementUpdate, PublicAgreement, PublicCategory, PublicProduct, SiteContent } from '@/types/site';

export const publicSiteApi = {
  site: async (): Promise<SiteContent> => {
    const response = await apiClient.get<SiteContent>('/api/v1/public/site');
    return response.data;
  },

  categories: async (): Promise<PublicCategory[]> => {
    const response = await apiClient.get<PublicCategory[]>('/api/v1/public/categories');
    return response.data;
  },

  products: async (): Promise<PublicProduct[]> => {
    const response = await apiClient.get<PublicProduct[]>('/api/v1/public/products');
    return response.data;
  },

  agreement: async (): Promise<PublicAgreement> => {
    const response = await apiClient.get<PublicAgreement>('/api/v1/public/agreement');
    return response.data;
  },
};

export const siteSettingsApi = {
  get: async (): Promise<SiteContent> => {
    const response = await apiClient.get<SiteContent>('/api/v1/site-settings');
    return response.data;
  },

  update: async (data: SiteContent): Promise<SiteContent> => {
    const response = await apiClient.put<SiteContent>('/api/v1/site-settings', data);
    return response.data;
  },

  uploadFavicon: async (file: File): Promise<SiteContent> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<SiteContent>('/api/v1/site-settings/favicon', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteFavicon: async (): Promise<SiteContent> => {
    const response = await apiClient.delete<SiteContent>('/api/v1/site-settings/favicon');
    return response.data;
  },
};

export const agreementApi = {
  get: async (): Promise<AgreementAdmin> => {
    const response = await apiClient.get<AgreementAdmin>('/api/v1/agreement');
    return response.data;
  },

  update: async (data: AgreementUpdate): Promise<AgreementAdmin> => {
    const response = await apiClient.put<AgreementAdmin>('/api/v1/agreement', data);
    return response.data;
  },
};
