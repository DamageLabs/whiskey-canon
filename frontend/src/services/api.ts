import { User, Whiskey, CreateWhiskeyData, WhiskeyType } from '../types';

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

async function fetchAPI(url: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle validation errors array
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map((e: any) => e.msg || e.message).join(', ');
      throw new APIError(errorMessages || 'Validation failed', response.status, data);
    }
    throw new APIError(data.error || 'Request failed', response.status, data);
  }

  return data;
}

export const authAPI = {
  register: (username: string, email: string, password: string, role?: string, firstName?: string, lastName?: string) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role, firstName, lastName }),
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
};

export const whiskeyAPI = {
  getAll: (filters?: { type?: WhiskeyType; distillery?: string }): Promise<{ whiskeys: Whiskey[] }> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.distillery) params.append('distillery', filters.distillery);

    const query = params.toString();
    return fetchAPI(`/whiskeys${query ? `?${query}` : ''}`);
  },

  getById: (id: number): Promise<{ whiskey: Whiskey }> =>
    fetchAPI(`/whiskeys/${id}`),

  search: (query: string): Promise<{ whiskeys: Whiskey[] }> =>
    fetchAPI(`/whiskeys/search?q=${encodeURIComponent(query)}`),

  create: (data: CreateWhiskeyData): Promise<{ whiskey: Whiskey; message: string }> =>
    fetchAPI('/whiskeys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateWhiskeyData>): Promise<{ whiskey: Whiskey; message: string }> =>
    fetchAPI(`/whiskeys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/whiskeys/${id}`, {
      method: 'DELETE',
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

  importCSV: async (file: File): Promise<{
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

    const response = await fetch(`${API_BASE}/whiskeys/import/csv`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to import whiskeys');
    }

    return data;
  },
};

export const statisticsAPI = {
  getAll: () => fetchAPI('/statistics'),
};
