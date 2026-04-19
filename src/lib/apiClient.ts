export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface RequestOptions extends RequestInit {
  data?: unknown;
  responseType?: 'json' | 'blob';
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, responseType = 'json', ...rest } = options;

  const config: RequestInit = {
    credentials: 'include', // Default credentials mode, can be overridden
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data) {
    if (data instanceof FormData) {
      config.body = data;
      if (config.headers) {
        delete (config.headers as Record<string, string>)['Content-Type'];
      }
    } else {
      config.body = JSON.stringify(data);
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const errorData = await response.json().catch(() => ({}));
    const detail =
      typeof errorData?.detail === 'string'
        ? errorData.detail
        : Array.isArray(errorData?.detail)
          ? errorData.detail.map((d: Record<string, unknown>) => d?.msg).filter(Boolean).join(', ')
          : errorData?.message;
    throw new Error(detail || `API error: ${response.status} ${response.statusText}`);
  }

  // Handle empty responses (like 204 No Content or success with no body)
  if (response.status === 204) {
    return {} as T;
  }

  if (responseType === 'blob') {
    return response.blob() as unknown as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    apiClient<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', data }),
  
  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', data }),
  
  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', data }),
  
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
