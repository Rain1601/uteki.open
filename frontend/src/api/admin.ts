import { get, post, patch, del } from './client';
import type {
  APIKey,
  CreateAPIKeyRequest,
  LLMProvider,
  CreateLLMProviderRequest,
  ExchangeConfig,
  CreateExchangeConfigRequest,
  DataSourceConfig,
  CreateDataSourceConfigRequest,
  SystemHealth,
  PaginatedResponse,
  MessageResponse,
} from '../types/admin';

// ==================== API Keys ====================
export const adminApi = {
  // API Keys
  apiKeys: {
    list: (page = 1, pageSize = 10) =>
      get<PaginatedResponse<APIKey>>('/api/admin/api-keys', {
        params: { page, page_size: pageSize },
      }),

    create: (data: CreateAPIKeyRequest) =>
      post<APIKey>('/api/admin/api-keys', data),

    update: (id: string, data: Partial<CreateAPIKeyRequest>) =>
      patch<APIKey>(`/api/admin/api-keys/${id}`, data),

    delete: (id: string) =>
      del<MessageResponse>(`/api/admin/api-keys/${id}`),
  },

  // LLM Providers
  llmProviders: {
    list: (page = 1, pageSize = 10) =>
      get<PaginatedResponse<LLMProvider>>('/api/admin/llm-providers', {
        params: { page, page_size: pageSize },
      }),

    getDefault: () =>
      get<LLMProvider>('/api/admin/llm-providers/default'),

    create: (data: CreateLLMProviderRequest) =>
      post<LLMProvider>('/api/admin/llm-providers', data),

    update: (id: string, data: Partial<CreateLLMProviderRequest>) =>
      patch<LLMProvider>(`/api/admin/llm-providers/${id}`, data),

    delete: (id: string) =>
      del<MessageResponse>(`/api/admin/llm-providers/${id}`),
  },

  // Exchange Configs
  exchanges: {
    list: (page = 1, pageSize = 10) =>
      get<PaginatedResponse<ExchangeConfig>>('/api/admin/exchanges', {
        params: { page, page_size: pageSize },
      }),

    getByExchange: (exchangeName: string) =>
      get<ExchangeConfig[]>(`/api/admin/exchanges/by-exchange/${exchangeName}`),

    create: (data: CreateExchangeConfigRequest) =>
      post<ExchangeConfig>('/api/admin/exchanges', data),

    update: (id: string, data: Partial<CreateExchangeConfigRequest>) =>
      patch<ExchangeConfig>(`/api/admin/exchanges/${id}`, data),

    delete: (id: string) =>
      del<MessageResponse>(`/api/admin/exchanges/${id}`),
  },

  // Data Sources
  dataSources: {
    list: (page = 1, pageSize = 10) =>
      get<PaginatedResponse<DataSourceConfig>>('/api/admin/data-sources', {
        params: { page, page_size: pageSize },
      }),

    getByType: (dataType: string) =>
      get<DataSourceConfig[]>(`/api/admin/data-sources/by-type/${dataType}`),

    create: (data: CreateDataSourceConfigRequest) =>
      post<DataSourceConfig>('/api/admin/data-sources', data),

    update: (id: string, data: Partial<CreateDataSourceConfigRequest>) =>
      patch<DataSourceConfig>(`/api/admin/data-sources/${id}`, data),

    delete: (id: string) =>
      del<MessageResponse>(`/api/admin/data-sources/${id}`),
  },

  // System Health
  system: {
    health: () =>
      get<SystemHealth>('/api/admin/system/health'),
  },
};
