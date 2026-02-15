// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  detail: string;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenRefresh {
  access_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  search?: string;
}
