'use client';

import { useEffect, useState } from 'react';
import { setoranService } from '@/lib/api';
import { Setoran } from '@/lib/types';
import { ListChecks, Package, Truck } from 'lucide-react';

export default function AntrianSampahPage() {
  const [antrianPickup, setAntrianPickup] = useState<Setoran[]>([]);
  const [antrianDropoff, setAntrianDropoff] = useState<Setoran[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetoran, setSelectedSetoran] = useState<Setoran | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    berat_sampah: '',
    harga_per_kg: ''
  });

  useEffect(() => {
    loadAntrian();
  }, []);

  const loadAntrian = async () => {
    try {
      const data = await setoranService.list();
      const pending = data.filter((s: Setoran) => s.status === 'pending');
      
      setAntrianPickup(pending.filter((s: Setoran) => s.metode === 'pick-up'));
      setAntrianDropoff(pending.filter((s: Setoran) => s.metode === 'drop-off'));
    } catch (error) {
      console.error('Load antrian error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidasi = (setoran: Setoran) => {
    setSelectedSetoran(setoran);
    setShowModal(true);
  };

  const handleSubmitValidasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetoran) return;

    try {
      await setoranService.validate(selectedSetoran.id, formData);
      alert('Setoran berhasil divalidasi!');
      setShowModal(false);
      setFormData({ berat_sampah: '', harga_per_kg: '' });
      loadAntrian();
    } catch (error: any) {
      alert(error.message || 'Gagal validasi setoran');
    }
  };

  const SetoranCard = ({ item }: { item: Setoran }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">{item.users?.nama_lengkap}</h3>
          <p className="text-sm text-gray-500">{item.users?.email}</p>
          <p className="text-sm text-gray-500">{item.users?.no_hp}</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          {item.jenis_sampah}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {new Date(item.tanggal_setor).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </p>
        <button
          onClick={() => handleValidasi(item)}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          Validasi
        </button>
      </div>
    </div>
  );

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
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <ListChecks className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Antrian Sampah</h1>
          <p className="text-gray-600">Validasi setoran sampah dari pengguna</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pick-up */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Pick-up ({antrianPickup.length})
            </h2>
          </div>
          <div className="space-y-3">
            {antrianPickup.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">Tidak ada antrian pick-up</p>
              </div>
            ) : (
              antrianPickup.map((item) => (
                <SetoranCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        {/* Drop-off */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Drop-off ({antrianDropoff.length})
            </h2>
          </div>
          <div className="space-y-3">
            {antrianDropoff.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">Tidak ada antrian drop-off</p>
              </div>
            ) : (
              antrianDropoff.map((item) => (
                <SetoranCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Validasi */}
      {showModal && selectedSetoran && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Validasi Setoran</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Nama Pengguna</p>
              <p className="font-medium text-gray-800">{selectedSetoran.users?.nama_lengkap}</p>
              
              <p className="text-sm text-gray-600 mb-1 mt-3">Jenis Sampah</p>
              <p className="font-medium text-gray-800">{selectedSetoran.jenis_sampah}</p>
              
              <p className="text-sm text-gray-600 mb-1 mt-3">Metode</p>
              <p className="font-medium text-gray-800 capitalize">{selectedSetoran.metode}</p>
            </div>

            <form onSubmit={handleSubmitValidasi} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Berat Sampah (kg)
                </label>
                <input
                  type="number"
                  value={formData.berat_sampah}
                  onChange={(e) => setFormData({ ...formData, berat_sampah: e.target.value })}
                  step="0.1"
                  min="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga per Kg (Rp)
                </label>
                <input
                  type="number"
                  value={formData.harga_per_kg}
                  onChange={(e) => setFormData({ ...formData, harga_per_kg: e.target.value })}
                  step="100"
                  min="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {formData.berat_sampah && formData.harga_per_kg && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Total:</strong> Rp {(
                      parseFloat(formData.berat_sampah) * parseFloat(formData.harga_per_kg)
                    ).toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ berat_sampah: '', harga_per_kg: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Validasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}