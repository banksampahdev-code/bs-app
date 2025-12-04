import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  nama_lengkap: string;
  email: string;
  role: 'admin' | 'pengelola' | 'pengguna';
  saldo: number;
  no_hp?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  detail_alamat?: string;
  profile_completed?: boolean;
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
      return localStorage.getItem(name);
    } catch (error) {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      // ignore
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch (error) {
      // ignore
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
        set({
          user: { ...user, profile_completed: user.profile_completed ?? false },
          token,
        });
      },
      logout: () => {
        set({ user: null, token: null });
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      updateUser: (user) =>
        set({
          user: { ...user, profile_completed: user.profile_completed ?? false },
        }),
    }),
    {
      name: 'bank-sampah-auth', // Unique name for this app
      storage: createJSONStorage(() => customStorage),
      // Only persist user and token, not _hasHydrated
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      version: 2, // bump to ensure new fields persisted
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error) {
            state?.setHasHydrated(true);
          }
        };
      },
      migrate: (persistedState: any) => {
        // ensure profile_completed exists
        if (persistedState?.user && persistedState.user.profile_completed === undefined) {
          persistedState.user.profile_completed = false;
        }
        return persistedState;
      },
    }
  )
);
