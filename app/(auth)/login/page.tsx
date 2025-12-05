'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import dynamic from 'next/dynamic';

function LoginPageComponent() {
  const { user, _hasHydrated, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [csWhatsapp, setCsWhatsapp] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch public settings (CS WhatsApp) for forgot password CTA
  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        const raw = data?.cs_whatsapp_number?.value || '';
        const digits = raw.replace(/\D/g, '');
        setCsWhatsapp(digits);
      })
      .catch(() => {
        setCsWhatsapp('');
      });
  }, []);

  // Auto-redirect jika sudah login
  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if (user) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('✅ Already logged in, redirecting to dashboard...');
      }
      window.location.href = '/dashboard';
      return;
    }

    setIsChecking(false);
  }, [user, _hasHydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // Server mungkin mengembalikan HTML/error page, tangani secara graceful
        console.error('Non-JSON response from /api/auth/login:', raw);
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Login gagal');
      }

      // Simpan auth data
      setAuth(data.user, data.token);

      // PENTING: Gunakan window.location.href untuk redirect
      window.location.href = '/dashboard';

      // JANGAN set loading false, biarkan loading sampai redirect selesai
      
    } catch (err: any) {
      setError(err.message || 'Login gagal');
      setLoading(false); // Set false hanya jika error
    }
  };

  // Tunda render sampai client mounted untuk mencegah mismatch SSR/CSR
  if (!mounted) {
    return null;
  }

  // Show loading saat checking auth
  if (!_hasHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Bank Sampah</h1>
          <p className="text-gray-600 mt-2">Login ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => {
                  const number = csWhatsapp || '62';
                  const phone = number.startsWith('62') ? number : `62${number.replace(/^0/, '')}`;
                  const message = encodeURIComponent(
                    `Halo Admin, saya lupa password Bank Sampah.\nEmail: ${email || '-belum diisi-'}\nMohon bantuan reset.`
                  );
                  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                }}
                className="text-sm text-green-600 hover:text-green-700 font-medium disabled:text-gray-400"
                disabled={!csWhatsapp}
              >
                Lupa password? Hubungi Admin via WhatsApp
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Redirecting...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Belum punya akun?{' '}
          <a href="/register" className="text-green-600 hover:underline font-medium">
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}

// Non-SSR to avoid hydration mismatch from persisted store
export default dynamic(() => Promise.resolve(LoginPageComponent), {
  ssr: false,
});
