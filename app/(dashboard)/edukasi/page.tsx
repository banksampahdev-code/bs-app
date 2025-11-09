'use client';

import { useEffect, useState } from 'react';
import { artikelService } from '@/lib/api';
import { Artikel } from '@/lib/types';
import { BookOpen, Calendar, User } from 'lucide-react';

export default function EdukasiPage() {
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtikel, setSelectedArtikel] = useState<Artikel | null>(null);

  useEffect(() => {
    loadArtikel();
  }, []);

  const loadArtikel = async () => {
    try {
      const response = await artikelService.list(100, 0);
      setArtikel(response.data);
    } catch (error) {
      console.error('Load artikel error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (selectedArtikel) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedArtikel(null)}
          className="mb-6 text-green-600 hover:text-green-700 flex items-center gap-2"
        >
          ← Kembali
        </button>

        <article className="bg-white rounded-lg shadow-lg overflow-hidden">---