'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { Bell, Menu } from 'lucide-react';

export default function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <button className="lg:hidden">
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex-1 lg:flex hidden">
          <h2 className="text-xl font-semibold text-gray-800">
            Selamat datang, {user?.nama_lengkap}!
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'pengguna' && (
            <div className="px-4 py-2 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Saldo Anda</p>
              <p className="text-lg font-bold text-green-600">
                Rp {user?.saldo?.toLocaleString('id-ID')}
              </p>
            </div>
          )}
          
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}