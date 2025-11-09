'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { pencairanService } from '@/lib/api';
import { Pencairan } from '@/lib/types';
import { Wallet, ArrowDownCircle } from 'lucide-react';

export default function SaldoPage() {
  const user = useAuthStore((state) => state.user);
  const [pencairan, setPencairan] = useState<Pencairan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nominal, setNominal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPencairan();
  }, []);

  const loadPencairan = async () => {
    try {
      const data = await pencairanService.list();
      setPencairan(data);
    } catch (error) {
      console.error('Load pencairan error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPencairan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await pencairanService.request(parseFloat(nominal));
      alert('Permintaan pencairan berhasil dibuat!');
      setShowModal(false);
      setNominal('');
      loadPencairan();
    } catch (error: any) {
      alert(error.message || 'Gagal membuat permintaan pencairan');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Wallet className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Saldo</h1>
          <p className="text-gray-600">Kelola saldo dan pencairan</p>
        </div>
      </div>

      {/* Saldo Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Saldo Tersedia</p>
          <p className="text-4xl font-bold mb-4">
            Rp {user?.saldo?.toLocaleString('id-ID')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            Cairkan Saldo
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-4">Statistik Pencairan</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Dicairkan</span>
              <span className="font-semibold">
                Rp {pencairan
                  .filter(p => p.status === 'approved')
                  .reduce((sum, p) => sum + parseFloat(p.nominal.toString()), 0)
                  .toLocaleString('id-ID')
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Menunggu Approval</span>
              <span className="font-semibold text-yellow-600">
                {pencairan.filter(p => p.status === 'pending').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Pencairan */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Riwayat Pencairan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nominal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal Pencairan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pencairan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Belum ada riwayat pencairan
                  </td>
                </tr>
              ) : (
                pencairan.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal_request).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {parseFloat(item.nominal.toString()).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                        {item.status === 'pending' && 'Menunggu'}
                        {item.status === 'approved' && 'Disetujui'}
                        {item.status === 'rejected' && 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tanggal_pencairan 
                        ? new Date(item.tanggal_pencairan).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.catatan || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pencairan */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cairkan Saldo</h3>
            <form onSubmit={handleRequestPencairan}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Tersedia: Rp {user?.saldo?.toLocaleString('id-ID')}
                </label>
                <input
                  type="number"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  max={user?.saldo}
                  min={10000}
                  step={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan nominal"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimal pencairan Rp 10.000</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Catatan:</strong> Pencairan akan diproses oleh pengelola. 
                  Pengambilan dilakukan secara tunai di lokasi bank sampah.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Ajukan Pencairan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}