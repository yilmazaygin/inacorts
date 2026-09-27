export interface SalesConsultant {
  name: string;
  phone: string;
  photo_url?: string | null;
}

export interface SiteContent {
  company_name: string;
  tab_title: string;
  favicon_url?: string | null;
  phone: string;
  email: string;
  address: string;
  hours: string;
  sales1_name: string;
  sales1_phone: string;
  sales2_name: string;
  sales2_phone: string;
  order_out_of_stock: boolean;
  sales_consultants?: SalesConsultant[];
  hero_title_tr: string;
  hero_title_en: string;
  hero_subtitle_tr: string;
  hero_subtitle_en: string;
  about_tr: string;
  about_en: string;
  contact_intro_tr: string;
  contact_intro_en: string;
  feature1_title_tr: string;
  feature1_title_en: string;
  feature1_text_tr: string;
  feature1_text_en: string;
  feature2_title_tr: string;
  feature2_title_en: string;
  feature2_text_tr: string;
  feature2_text_en: string;
  feature3_title_tr: string;
  feature3_title_en: string;
  feature3_text_tr: string;
  feature3_text_en: string;
}

export interface PublicAgreement {
  body_tr: string;
  body_en: string;
  updated_at: string;
}

export interface AgreementLog {
  id: number;
  username: string;
  edited_at: string;
}

export interface AgreementAdmin extends PublicAgreement {
  logs: AgreementLog[];
}

export interface AgreementUpdate {
  body_tr: string;
  body_en: string;
}

export interface PublicCategory {
  id: number;
  name: string;
  product_count: number;
  image_url?: string | null;
}

export interface PublicProduct {
  id: number;
  name: string;
  description?: string | null;
  category_id: number;
  category_name: string;
  list_price: number;
  in_stock: boolean;
  image_url?: string | null;
  image_urls?: string[];
}
