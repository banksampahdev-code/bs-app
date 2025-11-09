'use client';

import { useEffect, useState } from 'react';
import { pencairanService } from '@/lib/api';
import { Pencairan } from '@/lib/types';
import { Wallet, CheckCircle, XCircle } from 'lucide-react';

export default function PencairanPage() {
  const [pencairan, setPencairan] = useState<Pencairan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPencairan, setSelectedPencairan] = useState<Pencairan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approved' | 'rejected'>('approved');
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    loadPencairan();
  }, [filter]);

  const loadPencairan = async () => {
    try {
      const data = await pencairanService.list(filter === 'all' ? undefined : filter);
      setPencairan(data);
    } catch (error) {
      console.error('Load pencairan error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (item: Pencairan, actionType: 'approved' | 'rejected') => {
    setSelectedPencairan(item);
    setAction(actionType);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedPencairan) return;

    try {
      await pencairanService.approve(selectedPencairan.id, action, catatan);
      alert(`Pencairan berhasil ${action === 'approved' ? 'disetujui' : 'ditolak'}!`);
      setShowModal(false);
      setCatatan('');
      loadPencairan();
    } catch (error: any) {
      alert(error.message || 'Gagal memproses pencairan');
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pencairan Saldo</h1>
            <p className="text-gray-600">Kelola permintaan pencairan dari pengguna</p>
          </div>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="all">Semua</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700 mb-1">Menunggu Approval</p>
          <p className="text-2xl font-bold text-yellow-800">
            {pencairan.filter(p => p.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Total Disetujui</p>
          <p className="text-2xl font-bold text-green-800">
            Rp {pencairan
              .filter(p => p.status === 'approved')
              .reduce((sum, p) => sum + parseFloat(p.nominal.toString()), 0)
              .toLocaleString('id-ID')
            }
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 mb-1">Ditolak</p>
          <p className="text-2xl font-bold text-red-800">
            {pencairan.filter(p => p.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nominal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pencairan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data pencairan
                  </td>
                </tr>
              ) : (
                pencairan.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal_request).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{item.users?.nama_lengkap}</p>
                        <p className="text-gray-500">{item.users?.email}</p>
                        <p className="text-gray-500">{item.users?.no_hp}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rp {parseFloat(item.nominal.toString()).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                        {item.status === 'pending' && 'Menunggu'}
                        {item.status === 'approved' && 'Disetujui'}
                        {item.status === 'rejected' && 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item, 'approved')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Setujui"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAction(item, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Tolak"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {showModal && selectedPencairan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {action === 'approved' ? 'Setujui' : 'Tolak'} Pencairan
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Pengguna</p>
              <p className="font-medium text-gray-800">{selectedPencairan.users?.nama_lengkap}</p>
              
              <p className="text-sm text-gray-600 mb-1 mt-3">Nominal</p>
              <p className="font-medium text-gray-800">
                Rp {parseFloat(selectedPencairan.nominal.toString()).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Tambahkan catatan jika perlu..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setCatatan('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  action === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'approved' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}