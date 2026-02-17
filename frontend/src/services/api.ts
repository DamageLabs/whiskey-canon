import type {
  BackupRecord,
  BackupSchedule,
  CollectionTotals,
  CreateWhiskeyData,
  PaginationMeta,
  PublicProfile,
  RestorePreview,
  User,
  Whiskey,
  WhiskeyType,
} from '../types';
import { fetchCsrfToken, getCsrfHeaders } from '../utils/csrf';

const API_BASE = '/api';

export class APIError extends Error {
  status: number;
  requiresVerification?: boolean;
  email?: string;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.requiresVerification = data?.requiresVerification;
    this.email = data?.email;
  }
}

async function fetchAPI(url: string, options?: RequestInit, _retried = false) {
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const method = (options?.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfHeaders = await getCsrfHeaders();
    headers = { ...headers, ...csrfHeaders };
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    // On CSRF failure, fetch a fresh token and retry once
    if (response.status === 403 && !_retried) {
      const text = await response.text();
      if (text.toLowerCase().includes('csrf') || text.toLowerCase().includes('blocked')) {
        await fetchCsrfToken();
        return fetchAPI(url, options, true);
      }
      // Try to parse as JSON for other 403 errors
      try {
        const data = JSON.parse(text);
        throw new APIError(data.error || 'Forbidden', 403, data);
      } catch (e) {
        if (e instanceof APIError) throw e;
        throw new APIError(text || 'Forbidden', 403);
      }
    }

    const data = await response.json();

    // Handle validation errors array
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map((e: any) => e.msg || e.message).join(', ');
      throw new APIError(errorMessages || 'Validation failed', response.status, data);
    }
    throw new APIError(data.error || 'Request failed', response.status, data);
  }

  return response.json();
}

export const authAPI = {
  register: (
    username: string,
    email: string,
    password: string,
    role?: string,
    firstName?: string,
    lastName?: string
  ) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        role,
        firstName,
        lastName,
      }),
    }),

  login: (username: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => fetchAPI('/auth/logout', { method: 'POST' }),

  getCurrentUser: (): Promise<{ user: User }> => fetchAPI('/auth/me'),

  verifyEmail: (email: string, code: string) =>
    fetchAPI('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resendVerification: (email: string) =>
    fetchAPI('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  updateVisibility: (isPublic: boolean): Promise<{ message: string; user: User }> =>
    fetchAPI('/auth/settings/visibility', {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    }),
};

export const whiskeyAPI = {
  getAll: (filters?: {
    type?: WhiskeyType;
    distillery?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    whiskeys: Whiskey[];
    pagination?: PaginationMeta;
    collectionTotals?: CollectionTotals;
  }> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.distillery) params.append('distillery', filters.distillery);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const query = params.toString();
    return fetchAPI(`/whiskeys${query ? `?${query}` : ''}`);
  },

  getById: (id: number): Promise<{ whiskey: Whiskey }> => fetchAPI(`/whiskeys/${id}`),

  search: (
    query: string,
    pagination?: { page?: number; limit?: number }
  ): Promise<{
    whiskeys: Whiskey[];
    pagination?: PaginationMeta;
    collectionTotals?: CollectionTotals;
  }> => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (pagination?.page) params.append('page', String(pagination.page));
    if (pagination?.limit) params.append('limit', String(pagination.limit));
    return fetchAPI(`/whiskeys/search?${params.toString()}`);
  },

  create: (data: CreateWhiskeyData): Promise<{ whiskey: Whiskey; message: string }> =>
    fetchAPI('/whiskeys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<CreateWhiskeyData>
  ): Promise<{ whiskey: Whiskey; message: string }> =>
    fetchAPI(`/whiskeys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/whiskeys/${id}`, {
      method: 'DELETE',
    }),

  openBottle: (
    id: number
  ): Promise<{ message: string; openedBottle: Whiskey; sourceBottle: Whiskey }> =>
    fetchAPI(`/whiskeys/${id}/open-bottle`, {
      method: 'POST',
    }),

  deleteMany: (ids: number[]): Promise<{ message: string; deleted: number }> =>
    fetchAPI('/whiskeys/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),

  deleteAll: (): Promise<{ message: string; deleted: number }> =>
    fetchAPI('/whiskeys/all', {
      method: 'DELETE',
    }),

  exportCSV: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/whiskeys/export/csv`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to export whiskeys');
    }

    // Get the CSV blob
    const blob = await response.blob();

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whiskey-collection-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  importCSV: async (
    file: File
  ): Promise<{
    message: string;
    summary: {
      total: number;
      imported: number;
      skipped: number;
      errors: number;
    };
    imported: Array<{ name: string; type: string; id: number }>;
    skipped: string[];
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const csrfHeaders = await getCsrfHeaders();
    const response = await fetch(`${API_BASE}/whiskeys/import/csv`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfHeaders,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to import whiskeys');
    }

    return data;
  },
};

export interface LookupResponse {
  found: boolean;
  data?: Partial<CreateWhiskeyData>;
}

export const lookupAPI = {
  lookupByName: (name: string): Promise<LookupResponse> =>
    fetchAPI('/whiskeys/lookup', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  lookupByImage: async (file: File): Promise<LookupResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const csrfHeaders = await getCsrfHeaders();
    const response = await fetch(`${API_BASE}/whiskeys/lookup`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfHeaders,
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new APIError(data.error || 'Lookup failed', response.status, data);
    }

    return response.json();
  },
};

export const apiKeyAPI = {
  getStatus: (provider?: string): Promise<{ hasKey: boolean; lastFour: string | null }> =>
    fetchAPI(`/auth/api-key${provider ? `?provider=${provider}` : ''}`),

  save: (apiKey: string, provider?: string): Promise<{ message: string; lastFour: string }> =>
    fetchAPI('/auth/api-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey, provider }),
    }),

  delete: (provider?: string): Promise<{ message: string }> =>
    fetchAPI(`/auth/api-key${provider ? `?provider=${provider}` : ''}`, {
      method: 'DELETE',
    }),

  setProvider: (provider: string): Promise<{ message: string; provider: string }> =>
    fetchAPI('/auth/ai-provider', {
      method: 'PUT',
      body: JSON.stringify({ provider }),
    }),
};

export const ollamaAPI = {
  getStatus: (): Promise<{ available: boolean; models: string[] }> =>
    fetchAPI('/whiskeys/ollama/status'),
};

export const statisticsAPI = {
  getAll: () => fetchAPI('/statistics'),
};

export interface PublicStats {
  totalBottles: number;
  typeBreakdown: { type: string; count: number }[];
  topDistilleries: { distillery: string; count: number }[];
  totalDistilleries: number;
  averageRating: number | null;
  countriesRepresented: string[];
}

export const backupAPI = {
  create: (format: string): Promise<{ backup: BackupRecord; message: string }> =>
    fetchAPI('/backups', {
      method: 'POST',
      body: JSON.stringify({ format }),
    }),

  list: (): Promise<{ backups: BackupRecord[] }> => fetchAPI('/backups'),

  download: async (id: number): Promise<void> => {
    const csrfHeaders = await getCsrfHeaders();
    const response = await fetch(`${API_BASE}/backups/${id}/download`, {
      credentials: 'include',
      headers: csrfHeaders,
    });

    if (!response.ok) {
      throw new Error('Failed to download backup');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : `backup-${id}`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  restore: (
    id: number,
    dryRun: boolean,
    conflictStrategy?: string
  ): Promise<{
    preview?: RestorePreview;
    result?: {
      whiskeysRestored: number;
      commentsRestored: number;
      skipped: number;
    };
    message?: string;
  }> =>
    fetchAPI(`/backups/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ dryRun, conflictStrategy }),
    }),

  upload: async (file: File): Promise<{ backup: BackupRecord; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const csrfHeaders = await getCsrfHeaders();
    const response = await fetch(`${API_BASE}/backups/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfHeaders,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload backup');
    }

    return data;
  },

  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/backups/${id}`, { method: 'DELETE' }),

  getSchedule: (): Promise<{ schedule: BackupSchedule }> => fetchAPI('/backups/schedule'),

  updateSchedule: (
    interval: string,
    format: string,
    retentionDays: number
  ): Promise<{ schedule: BackupSchedule; message: string }> =>
    fetchAPI('/backups/schedule', {
      method: 'PUT',
      body: JSON.stringify({ interval, format, retentionDays }),
    }),
};

export const usersAPI = {
  getPublicProfile: (username: string): Promise<{ profile: PublicProfile }> =>
    fetchAPI(`/users/${encodeURIComponent(username)}`),

  getPublicStats: (username: string): Promise<{ stats: PublicStats }> =>
    fetchAPI(`/users/${encodeURIComponent(username)}/stats`),

  listPublicProfiles: (): Promise<{ profiles: PublicProfile[] }> => fetchAPI('/users'),
};
