'use client';

import { useEffect, useState } from 'react';
import { artikelService } from '@/lib/api';
import { BookOpen, Calendar, User } from 'lucide-react';

interface ArtikelData {
  id: string;
  judul: string;
  konten: string;
  gambar?: string;
  created_at: string;
  admin?: {
    nama_lengkap: string;
  };
}

export default function EdukasiPage() {
  const [artikel, setArtikel] = useState<ArtikelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtikel, setSelectedArtikel] = useState<ArtikelData | null>(null);

  useEffect(() => {
    let mounted = true; // guard untuk mencegah setState setelah unmount

    const loadArtikel = async () => {
      try {
        setLoading(true);
        const response = await artikelService.list(100, 0);
        // safe-guard kalau shape response berbeda
        const data = response?.data ?? [];
        if (mounted) setArtikel(data);
      } catch (error) {
        console.error('Load artikel error:', error);
        // bisa set error state di sini jika mau menampilkan pesan
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadArtikel();

    return () => {
      mounted = false;
    };
  }, []); // [] => hanya run sekali

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"
          aria-hidden="true"
        />
        <span className="sr-only">Memuat artikel...</span>
      </div>
    );
  }

  if (selectedArtikel) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedArtikel(null)}
          className="mb-6 text-green-600 hover:text-green-700 flex items-center gap-2 font-medium"
        >
          ← Kembali ke Daftar Artikel
        </button>

        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {selectedArtikel.gambar && (
            <div className="w-full h-64 bg-gray-200 overflow-hidden">
              <img
                src={selectedArtikel.gambar}
                alt={selectedArtikel.judul}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedArtikel.judul}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{selectedArtikel.admin?.nama_lengkap || 'Admin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(selectedArtikel.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>{selectedArtikel.konten}</div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  // List view: tampilkan daftar artikel
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edukasi & Artikel</h1>
          <p className="text-gray-600">Baca artikel tentang pengelolaan sampah dan lingkungan</p>
        </div>
      </div>

      {artikel.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Belum ada artikel tersedia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artikel.map((a) => (
            <article
              key={a.id}
              onClick={() => setSelectedArtikel(a)}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
            >
              {a.gambar ? (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={a.gambar}
                    alt={a.judul}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white opacity-50" />
                </div>
              )}

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                  {a.judul}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {a.konten.substring(0, 120)}...
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {a.admin?.nama_lengkap || 'Admin'}
                  </span>
                  <span>{new Date(a.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
