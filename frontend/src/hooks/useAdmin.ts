import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type {
  CreateAPIKeyRequest,
  CreateLLMProviderRequest,
  CreateExchangeConfigRequest,
  CreateDataSourceConfigRequest,
} from '../types/admin';

// ==================== API Keys ====================
export const useAPIKeys = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['apiKeys', page, pageSize],
    queryFn: () => adminApi.apiKeys.list(page, pageSize),
  });
};

export const useCreateAPIKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAPIKeyRequest) => adminApi.apiKeys.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
};

export const useUpdateAPIKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAPIKeyRequest> }) =>
      adminApi.apiKeys.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
};

export const useDeleteAPIKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.apiKeys.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });
};

// ==================== LLM Providers ====================
export const useLLMProviders = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['llmProviders', page, pageSize],
    queryFn: () => adminApi.llmProviders.list(page, pageSize),
  });
};

export const useDefaultLLMProvider = () => {
  return useQuery({
    queryKey: ['defaultLLMProvider'],
    queryFn: () => adminApi.llmProviders.getDefault(),
  });
};

export const useCreateLLMProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLLMProviderRequest) =>
      adminApi.llmProviders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llmProviders'] });
      queryClient.invalidateQueries({ queryKey: ['defaultLLMProvider'] });
    },
  });
};

export const useUpdateLLMProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLLMProviderRequest> }) =>
      adminApi.llmProviders.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llmProviders'] });
      queryClient.invalidateQueries({ queryKey: ['defaultLLMProvider'] });
    },
  });
};

export const useDeleteLLMProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.llmProviders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llmProviders'] });
    },
  });
};

// ==================== Exchange Configs ====================
export const useExchangeConfigs = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['exchangeConfigs', page, pageSize],
    queryFn: () => adminApi.exchanges.list(page, pageSize),
  });
};

export const useCreateExchangeConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExchangeConfigRequest) =>
      adminApi.exchanges.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeConfigs'] });
    },
  });
};

export const useUpdateExchangeConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExchangeConfigRequest> }) =>
      adminApi.exchanges.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeConfigs'] });
    },
  });
};

export const useDeleteExchangeConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.exchanges.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeConfigs'] });
    },
  });
};

// ==================== Data Source Configs ====================
export const useDataSourceConfigs = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['dataSourceConfigs', page, pageSize],
    queryFn: () => adminApi.dataSources.list(page, pageSize),
  });
};

export const useCreateDataSourceConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDataSourceConfigRequest) =>
      adminApi.dataSources.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSourceConfigs'] });
    },
  });
};

export const useUpdateDataSourceConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDataSourceConfigRequest> }) =>
      adminApi.dataSources.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSourceConfigs'] });
    },
  });
};

export const useDeleteDataSourceConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.dataSources.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSourceConfigs'] });
    },
  });
};

// ==================== System Health ====================
export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => adminApi.system.health(),
    refetchInterval: 30000, // 每30秒刷新一次
  });
};
