import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  nama_lengkap: string;
  email: string;
  role: 'admin' | 'pengelola' | 'pengguna';
  saldo: number;
  qr_code?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  updateUser: (user: User) => void;
}

// Custom storage yang lebih reliable untuk PWA
const customStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const value = localStorage.getItem(name);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Auth Storage - GET:', name, value ? 'Found' : 'Not found');
      }
      return value;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reading from localStorage:', error);
      }
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Auth Storage - SET:', name, 'Saved successfully');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error writing to localStorage:', error);
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Auth Storage - REMOVE:', name);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing from localStorage:', error);
      }
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('🔐 Setting auth:', { userId: user.id, role: user.role });
        }
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('👋 Logging out');
        }
        set({ user: null, token: null });
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'bank-sampah-auth', // Unique name for this app
      storage: createJSONStorage(() => customStorage),
      // Only persist user and token, not _hasHydrated
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      version: 1, // For future migrations
      onRehydrateStorage: () => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('🔄 Hydration starting...');
        }
        return (state, error) => {
          if (error) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.error('❌ Hydration failed:', error);
            }
          } else {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.log('✅ Hydration complete:', {
                hasUser: !!state?.user,
                hasToken: !!state?.token,
              });
            }
            state?.setHasHydrated(true);
          }
        };
      },
    }
  )
);