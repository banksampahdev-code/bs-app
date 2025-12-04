'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export default function ProfilePage() {
  const { user, token, updateUser, _hasHydrated } = useAuthStore();
  const [formData, setFormData] = useState({
    no_hp: '',
    kelurahan: '',
    kecamatan: '',
    kabupaten: '',
    detail_alamat: '',
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!_hasHydrated || !user) return;
    setFormData({
      no_hp: user.no_hp || '',
      kelurahan: user.kelurahan || '',
      kecamatan: user.kecamatan || '',
      kabupaten: user.kabupaten || '',
      detail_alamat: user.detail_alamat || '',
    });
  }, [user, _hasHydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil');
      }
      if (data.user) {
        updateUser(data.user);
      }
      alert('Profil berhasil diperbarui');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !_hasHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Profil</h1>
      <p className="text-gray-600 mb-6">Ubah informasi kontak dan alamat Anda.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input
            type="text"
            value={user.nama_lengkap}
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
          <input
            type="tel"
            value={formData.no_hp}
            onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="08123456789"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan</label>
            <input
              type="text"
              value={formData.kelurahan}
              onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
            <input
              type="text"
              value={formData.kecamatan}
              onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten</label>
            <input
              type="text"
              value={formData.kabupaten}
              onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detail Alamat</label>
          <textarea
            value={formData.detail_alamat}
            onChange={(e) => setFormData({ ...formData, detail_alamat: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Jalan/RT/RW/Patokan"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}
