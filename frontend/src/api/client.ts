import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const ACCESS_KEY = 'fh_access_token';
const REFRESH_KEY = 'fh_refresh_token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem('fh_user');
  },
};

export const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;
  refreshing = axios
    .post('/api/auth/refresh', { refreshToken })
    .then((res) => {
      const { accessToken, refreshToken: newRefresh } = res.data;
      tokenStore.set(accessToken, newRefresh);
      return accessToken as string;
    })
    .catch(() => {
      tokenStore.clear();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = original?.url ?? '';
    const skipRefresh =
      url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && original && !original._retry && !skipRefresh) {
      original._retry = true;
      const newToken = await (refreshing ?? refreshAccessToken());
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
      window.dispatchEvent(new Event('fh:logout'));
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorPayload {
  message?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
  status?: number;
}

export function toApiError(error: unknown): ApiErrorPayload {
  const err = error as AxiosError<ApiErrorPayload & { message?: string }>;
  if (err.response?.data) {
    return { ...err.response.data, status: err.response.status };
  }
  return { message: err.message || 'Something went wrong. Please try again.' };
}

export function errorMessage(error: unknown): string {
  const payload = toApiError(error);
  if (payload.fieldErrors) {
    const first = Object.values(payload.fieldErrors)[0];
    if (first) return first;
  }
  return payload.message || 'Something went wrong. Please try again.';
}
