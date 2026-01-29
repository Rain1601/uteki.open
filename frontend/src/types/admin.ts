// API Key类型
export interface APIKey {
  id: string;
  service_name: string;
  key_name: string;
  masked_key: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface CreateAPIKeyRequest {
  service_name: string;
  key_name: string;
  api_key: string;
  api_secret?: string;
  expires_at?: string;
}

// LLM Provider类型
export interface LLMProvider {
  id: string;
  provider_name: string;
  model_name: string;
  api_key_id: string;
  is_default: boolean;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
}

export interface CreateLLMProviderRequest {
  provider_name: string;
  model_name: string;
  api_key_id: string;
  is_default?: boolean;
  is_active?: boolean;
  config?: Record<string, any>;
}

// Exchange Config类型
export interface ExchangeConfig {
  id: string;
  exchange_name: string;
  api_key_id: string;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
}

export interface CreateExchangeConfigRequest {
  exchange_name: string;
  api_key_id: string;
  is_active?: boolean;
  config?: Record<string, any>;
}

// Data Source Config类型
export interface DataSourceConfig {
  id: string;
  source_name: string;
  data_type: string;
  api_key_id?: string;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
}

export interface CreateDataSourceConfigRequest {
  source_name: string;
  data_type: string;
  api_key_id?: string;
  is_active?: boolean;
  config?: Record<string, any>;
}

// System Health类型
export interface SystemHealth {
  status: string;
  databases: {
    postgresql: DatabaseStatus;
    redis: DatabaseStatus;
    clickhouse: DatabaseStatus;
    qdrant: DatabaseStatus;
    minio: DatabaseStatus;
  };
  timestamp: string;
}

export interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'degraded' | 'disabled';
  details?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Message Response
export interface MessageResponse {
  message: string;
}
