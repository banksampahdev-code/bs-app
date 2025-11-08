'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setoranService } from '@/lib/api';
import { Trash2, Package } from 'lucide-react';

export default function SetorSampahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jenis_sampah: '',
    metode: 'drop-off' as 'pick-up' | 'drop-off',
  });

  const jenisSampahOptions = [
    'Plastik',
    'Kertas',
    'Botol Kaca',
    'Botol Plastik',
    'Kardus',
    'Kaleng',
    'Elektronik',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await setoranService.create(formData);
      alert('Setoran berhasil dibuat! Menunggu validasi dari pengelola.');
      router.push('/dashboard/riwayat-sampah');
    } catch (error: any) {
      alert(error.message || 'Gagal membuat setoran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Setor Sampah</h1>
          <p className="text-gray-600">Buat permintaan setoran sampah baru</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Jenis Sampah */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Sampah
            </label>
            <select
              value={formData.jenis_sampah}
              onChange={(e) => setFormData({ ...formData, jenis_sampah: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Pilih jenis sampah</option>
              {jenisSampahOptions.map((jenis) => (
                <option key={jenis} value={jenis}>
                  {jenis}
                </option>
              ))}
            </select>
          </div>

          {/* Metode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Setoran
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, metode: 'drop-off' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.metode === 'drop-off'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Drop Off</p>
                <p className="text-sm text-gray-500">Antar sendiri</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, metode: 'pick-up' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.metode === 'pick-up'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <Trash2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Pick Up</p>
                <p className="text-sm text-gray-500">Dijemput</p>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Berat sampah dan harga akan ditentukan oleh pengelola
              setelah melakukan penimbangan dan validasi.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Memproses...' : 'Buat Setoran'}
          </button>
        </form>
      </div>
    </div>
  );
}