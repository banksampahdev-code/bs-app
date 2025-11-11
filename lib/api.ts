import { useAuthStore } from './store/authStore';

const API_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const { token } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add cache busting untuk memastikan data selalu fresh
  const cacheBuster = `_t=${Date.now()}`;
  const separator = endpoint.includes('?') ? '&' : '?';
  const urlWithCacheBuster = `${API_URL}/api${endpoint}${separator}${cacheBuster}`;

  const response = await fetch(urlWithCacheBuster, {
    ...options,
    headers,
    cache: 'no-store', // PENTING: Disable Next.js cache
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth services
export const authService = {
  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: any) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Setoran services
export const setoranService = {
  create: (data: any) =>
    apiCall('/setoran/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: () => apiCall('/setoran/list'),

  validate: (id: string, data: any) =>
    apiCall(`/setoran/validate/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ... (kode sebelumnya tetap)

// Pencairan services
export const pencairanService = {
  request: (nominal: number) =>
    apiCall('/pencairan/request', {
      method: 'POST',
      body: JSON.stringify({ nominal }),
    }),

  list: (status?: string) =>
    apiCall(`/pencairan/list${status ? `?status=${status}` : ''}`),

  approve: (id: string, status: 'approved' | 'rejected', catatan?: string) =>
    apiCall(`/pencairan/approve/${id}`, {
      method: 'POST',
      body: JSON.stringify({ status, catatan }),
    }),
};

// Artikel services
export const artikelService = {
  list: (limit = 10, offset = 0) =>
    apiCall(`/artikel/list?limit=${limit}&offset=${offset}`),

  create: (data: { judul: string; konten: string; gambar?: string }) =>
    apiCall('/artikel/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall(`/artikel/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/artikel/delete/${id}`, {
      method: 'DELETE',
    }),
};

// Member services
export const memberService = {
  list: (role?: string, search?: string) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    return apiCall(`/member/list?${params.toString()}`);
  },

  detail: (id: string) =>
    apiCall(`/member/${id}`),
};

// Laporan services
export const laporanService = {
  export: (type: 'setoran' | 'pencairan', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ type });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    // For file download, we return the URL instead
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/laporan/export?${params.toString()}`;
  },
};

// Dashboard services
export const dashboardService = {
  stats: () => apiCall('/dashboard/stats'),
};