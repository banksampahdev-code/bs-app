'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { Settings, Save, Loader2, Phone } from 'lucide-react';

export default function SettingsPage() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [csWhatsapp, setCsWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gagal memuat settings');

      const data = await response.json();
      setCsWhatsapp(data.cs_whatsapp_number?.value || '');
    } catch (err: any) {
      setError(err.message || 'Gagal memuat settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Save WhatsApp number
      const whatsappResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          setting_key: 'cs_whatsapp_number',
          setting_value: csWhatsapp.replace(/\D/g, '') // Remove non-numeric characters
        })
      });

      if (!whatsappResponse.ok) throw new Error('Gagal menyimpan nomor WhatsApp');

      setSuccess('Settings berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan settings');
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Add 62 prefix if not present and starts with 0
    if (numbers.startsWith('0')) {
      return '62' + numbers.substring(1);
    }

    // Add 62 prefix if not present
    if (!numbers.startsWith('62')) {
      return '62' + numbers;
    }

    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCsWhatsapp(formatted);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengaturan Aplikasi</h1>
          <p className="text-gray-600">Kelola pengaturan sistem Bank Sampah</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Service</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                  <p className="font-medium">Berhasil</p>
                  <p className="text-sm">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor WhatsApp Customer Service
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={csWhatsapp}
                    onChange={handlePhoneChange}
                    placeholder="628123456789"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Nomor akan ditampilkan sebagai tombol "Hubungi CS" di dashboard user.
                  Format: 628xxxxxxxxxx (dengan kode negara 62)
                </p>
              </div>

              {/* Preview */}
              {csWhatsapp && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Preview Link WhatsApp:</p>
                  <a
                    href={`https://wa.me/${csWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline text-sm break-all"
                  >
                    https://wa.me/{csWhatsapp}
                  </a>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={fetchSettings}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
                disabled={saving}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Pengaturan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Informasi</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Customer Service:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Nomor WhatsApp akan digunakan untuk tombol "Hubungi CS" di dashboard user</li>
              <li>• Format nomor harus menggunakan kode negara (62 untuk Indonesia)</li>
              <li>• Contoh: 628123456789 (untuk nomor 0812-3456-789)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
