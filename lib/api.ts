import { useAuthStore } from './store/authStore';

const API_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const { token } = useAuthStore.getState();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
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