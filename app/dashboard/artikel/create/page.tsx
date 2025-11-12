'use client';

import { useState } from 'react';
import { artikelService } from '@/lib/api';
import { ArrowLeft, BookOpen, Upload, Image as ImageIcon } from 'lucide-react';
import { processAndUploadArticleImage } from '@/lib/image-utils';
import { useAuthStore } from '@/lib/store/authStore';

export default function CreateArtikelPage() {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    judul: '',
    konten: '',
    gambar: null as any
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar');
        return;
      }

      // Validate file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 5MB');
        return;
      }

      setImageFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let gambarUrls = formData.gambar;

      // Upload image jika ada
      if (imageFile && token) {
        setUploadingImage(true);
        try {
          gambarUrls = await processAndUploadArticleImage(imageFile, token);
          setUploadingImage(false);
        } catch (uploadError: any) {
          setUploadingImage(false);
          throw new Error(`Gagal upload gambar: ${uploadError.message}`);
        }
      }

      await artikelService.create({
        judul: formData.judul,
        konten: formData.konten,
        gambar: gambarUrls
      });

      alert('Artikel berhasil dibuat!');
      window.location.href = '/dashboard/artikel';
    } catch (error: any) {
      setError(error.message || 'Gagal membuat artikel');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.location.href = '/dashboard/artikel'}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Buat Artikel Baru</h1>
            <p className="text-gray-600">Tambahkan artikel edukasi tentang sampah</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Artikel
            </label>
            <input
              type="text"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Masukkan judul artikel"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Artikel (Opsional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-500 transition-colors">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto h-48 w-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      disabled={loading || uploadingImage}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                        <span>Upload gambar</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={loading || uploadingImage}
                        />
                      </label>
                      <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP hingga 5MB
                    </p>
                  </>
                )}
              </div>
            </div>
            {imageFile && (
              <div className="mt-2 text-sm text-gray-600">
                <p>📁 {imageFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Gambar akan otomatis dikompress dan di-crop ke ukuran standar untuk desktop, tablet, dan mobile
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konten Artikel
            </label>
            <textarea
              value={formData.konten}
              onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Tulis konten artikel di sini..."
              required
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              {formData.konten.length} karakter
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard/artikel'}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || uploadingImage}
            >
              {uploadingImage ? 'Mengupload gambar...' : loading ? 'Menyimpan...' : 'Buat Artikel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
