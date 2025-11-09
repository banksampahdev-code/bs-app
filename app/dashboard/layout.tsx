'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useState, useEffect } from 'react';
import {
  Menu, X, Home, Trash2, History, Wallet, BookOpen,
  FileText, Users, BarChart3, Clock, LogOut
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: any;
  href: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, _hasHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!user) {
      window.location.href = '/login';
    }
  }, [user, _hasHydrated]);

  if (!isMounted || !_hasHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getMenuItems = (): MenuItem[] => {
    const iconMap = {
      home: Home,
      trash: Trash2,
      history: History,
      wallet: Wallet,
      book: BookOpen,
      file: FileText,
      users: Users,
      chart: BarChart3,
      clock: Clock,
    };

    switch (user.role) {
      case 'pengguna': // Backend tetap 'pengguna'
        return [
          { title: 'Dashboard', icon: iconMap.home, href: '/dashboard' },
          { title: 'Setor Sampah', icon: iconMap.trash, href: '/dashboard/setor-sampah' },
          { title: 'Riwayat', icon: iconMap.history, href: '/dashboard/riwayat-sampah' },
          { title: 'Saldo', icon: iconMap.wallet, href: '/dashboard/saldo' },
          { title: 'Pencairan', icon: iconMap.wallet, href: '/dashboard/pencairan' },
          { title: 'Edukasi', icon: iconMap.book, href: '/dashboard/edukasi' },
        ];

      case 'pengelola':
        return [
          { title: 'Dashboard', icon: iconMap.home, href: '/dashboard' },
          { title: 'Antrian Sampah', icon: iconMap.clock, href: '/dashboard/antrian-sampah' },
          { title: 'Riwayat Sampah', icon: iconMap.history, href: '/dashboard/riwayat-sampah' },
          { title: 'Pencairan', icon: iconMap.wallet, href: '/dashboard/pencairan' },
          { title: 'Member', icon: iconMap.users, href: '/dashboard/member' },
          { title: 'Laporan', icon: iconMap.chart, href: '/dashboard/laporan' },
        ];

      case 'admin':
        return [
          { title: 'Dashboard', icon: iconMap.home, href: '/dashboard' },
          { title: 'Antrian Sampah', icon: iconMap.clock, href: '/dashboard/antrian-sampah' },
          { title: 'Riwayat Sampah', icon: iconMap.history, href: '/dashboard/riwayat-sampah' },
          { title: 'Artikel', icon: iconMap.file, href: '/dashboard/artikel' },
          { title: 'Pencairan', icon: iconMap.wallet, href: '/dashboard/pencairan' },
          { title: 'Member', icon: iconMap.users, href: '/dashboard/member' },
          { title: 'Laporan', icon: iconMap.chart, href: '/dashboard/laporan' },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Bank Sampah</h1>
              <p className="text-xs text-gray-500">
                {user.role === 'admin' && 'Admin'}
                {user.role === 'pengelola' && 'Pengelola'}
                {user.role === 'pengguna' && 'Member'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-gradient-to-r from-green-50 to-green-100">
          <p className="text-sm font-medium text-gray-800 truncate">{user.nama_lengkap}</p>
          <p className="text-xs text-gray-600 truncate">{user.email}</p>
          {user.role === 'pengguna' && (
            <div className="mt-2 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium">
              Saldo: Rp {user.saldo?.toLocaleString('id-ID') || 0}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <li key={index}>
                  <a
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-800">Bank Sampah</span>
            </div>

            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-gray-800">
                Selamat Datang, {user.nama_lengkap}!
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800">{user.nama_lengkap}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'admin' && 'Admin'}
                  {user.role === 'pengelola' && 'Pengelola'}
                  {user.role === 'pengguna' && 'Member'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.nama_lengkap.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
