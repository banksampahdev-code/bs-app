'use client';

import { useEffect, useState } from 'react';
import { artikelService } from '@/lib/api';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';

interface Artikel {
  id: string;
  judul: string;
  konten: string;
  gambar?: string;
  created_at: string;
  admin?: {
    nama_lengkap: string;
  };
}

export default function ArtikelPage() {
  const [artikels, setArtikels] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtikels();
  }, []);

  const loadArtikels = async () => {
    try {
      const response = await artikelService.list(100, 0);
      // API mengembalikan { data: [...], pagination: {...} }
      const artikelData = response.data || [];
      setArtikels(artikelData);
    } catch (error) {
      console.error('Load artikel error:', error);
      setArtikels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus artikel ini?')) return;

    try {
      await artikelService.delete(id);
      alert('Artikel berhasil dihapus');
      loadArtikels();
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus artikel');
    }
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
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Artikel Edukasi</h1>
            <p className="text-gray-600">Kelola artikel edukasi tentang sampah</p>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/artikel/create'}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Buat Artikel
        </button>
      </div>

      {artikels.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Belum ada artikel</p>
          <button
            onClick={() => window.location.href = '/dashboard/artikel/create'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Buat Artikel Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artikels.map((artikel) => (
            <div
              key={artikel.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              {artikel.gambar && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={artikel.gambar}
                    alt={artikel.judul}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                  {artikel.judul}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {artikel.konten.replace(/<[^>]*>/g, '').substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{artikel.admin?.nama_lengkap || 'Admin'}</span>
                  <span>{new Date(artikel.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/dashboard/artikel/edit/${artikel.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(artikel.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
